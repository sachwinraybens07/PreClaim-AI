# API Reference

Base URL: `${VITE_API_URL}/api` in production, or `/api` locally (proxied to
`http://localhost:4000` by Vite). All request/response bodies are JSON.

Every route except `POST /auth/login`, `POST /auth/signup`, and
`POST /auth/google` requires:

```
Authorization: Bearer <jwt>
```

Tokens are issued by the three auth endpoints and expire after 12 hours.
Missing or invalid tokens return `401`.

## Error shape

All errors — validation failures, not-found, auth failures, unexpected
errors — return the same envelope:

```json
{ "error": true, "message": "Human-readable message" }
```

with an appropriate HTTP status (`400`, `401`, `404`, `409`, or `500`).

---

## Authentication

### `POST /auth/login`

Email/password sign-in, or demo login.

**Credentials:**
```json
{ "email": "jane@example.com", "password": "hunter2000" }
```

**Demo (bypasses credential checks, logs into the seeded demo account):**
```json
{ "demo": true }
```

**200 response:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Sarah Chen", "email": "sarah.chen@preclaim.ai", "role": "RCM_MANAGER" }
}
```

**Errors:** `400` invalid payload · `401` invalid email/password or account
has no password set (e.g. it's Google-only).

### `POST /auth/signup`

Creates a new email/password account.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "at-least-8-chars",
  "confirmPassword": "at-least-8-chars"
}
```

**201 response:** same shape as `/auth/login`.

**Errors:** `400` validation failure (name required, invalid email, password
< 8 chars, passwords don't match) · `409` an account with this email already
exists. Email is lowercased/trimmed before the uniqueness check and storage.

### `POST /auth/google`

Google Identity Services sign-in/sign-up.

**Request:**
```json
{ "idToken": "<Google ID token from the client library>" }
```

**200 response:** same shape as `/auth/login`.

**Behavior:**
- Verifies the ID token server-side against `GOOGLE_CLIENT_ID`; rejects
  unverified emails.
- If a user already exists with this Google account (`googleId`), signs
  them in.
- If no `googleId` match but the email belongs to an **existing
  password-based account**, the accounts are **not** linked — returns `409`
  with a message directing the user to sign in with their password.
- Otherwise creates a new `provider: "GOOGLE"` user (no password) and signs
  them in.

**Errors:** `400` missing token · `401` invalid/unverifiable token or
unverified email · `409` email belongs to an existing password account ·
`500` `GOOGLE_CLIENT_ID` not configured on the server.

---

## Cases

All routes below require `Authorization: Bearer <jwt>`.

### `POST /cases`

Creates a patient, insurance record, and case, then generates the document
checklist server-side (`requirementsEngine`) based on payer/procedure/urgency.

**Request:**
```json
{
  "patientName": "John Davis",
  "patientIdentifier": "PT-1002",
  "dateOfBirth": "1980-04-11",
  "payer": "UnitedHealthcare",
  "planName": "Choice Plus",
  "memberId": "UHC-9981",
  "diagnosis": "Meniscus tear",
  "diagnosisCode": "S83.2",
  "procedure": "MRI Knee",
  "procedureCode": "73721",
  "provider": "Dr. Patel",
  "treatmentDate": "2026-09-20",
  "urgency": "STANDARD",
  "availableDocumentTypes": ["INSURANCE_CARD"]
}
```

`urgency` is one of `STANDARD | URGENT | EMERGENCY` (default `STANDARD`).
`availableDocumentTypes` pre-marks matching checklist items as `AVAILABLE`.

**201 response:** the full `CaseDetail` (see below) — note the risk fields
are still at their defaults until `POST /cases/:id/analyze` is called.

### `GET /cases`

Lists all cases (summary view), most recent first.

**200 response:**
```json
[
  {
    "id": "...", "caseNumber": "CASE-1048", "patientName": "John Davis",
    "procedure": "MRI Knee", "payer": "UnitedHealthcare",
    "initialRisk": 82, "currentRisk": 82, "riskLevel": "HIGH",
    "status": "ACTION_REQUIRED", "urgency": "STANDARD", "createdAt": "..."
  }
]
```

### `GET /cases/:id`

Full case detail, including relations.

**200 response (`CaseDetail`):**
```json
{
  "id": "...", "caseNumber": "CASE-1048",
  "patient": { "id": "...", "name": "John Davis", "patientIdentifier": "...", "dateOfBirth": "..." },
  "insurance": { "id": "...", "payer": "UnitedHealthcare", "planName": "...", "memberId": "..." },
  "diagnosis": "...", "diagnosisCode": "...",
  "procedure": "...", "procedureCode": "...", "provider": "...",
  "urgency": "STANDARD", "status": "ACTION_REQUIRED",
  "riskScore": 82, "riskLevel": "HIGH", "confidence": 87,
  "predictedOutcome": "Prior Authorization Likely Required",
  "readiness": 50, "treatmentDate": "...",
  "documents": [ { "id": "...", "name": "Diagnostic Report", "type": "DIAGNOSTIC_REPORT", "status": "MISSING", "required": true, "priority": "HIGH", "source": "...", "instructions": "..." } ],
  "riskFactors": [ { "id": "...", "title": "Missing Diagnostic Report", "description": "...", "severity": "HIGH", "impact": "HIGH", "evidence": "...", "action": "Obtain Diagnostic Report" } ],
  "actions": [ { "id": "...", "title": "Obtain Diagnostic Report", "description": "...", "priority": "HIGH", "status": "PENDING", "estimatedImpact": "High expected impact" } ]
}
```

**Errors:** `404` case not found.

### `POST /cases/:id/analyze`

Re-runs the risk engine for this case (payer/procedure base risk + missing
required documents + historical denial pattern), persists the new
`riskScore` / `riskLevel` / `confidence` / `predictedOutcome` / `readiness` /
`status` onto the case, and reconciles `RiskFactor` and `Action` rows to
match. Returns the updated `CaseDetail`. This is also called automatically
whenever a document or action status changes.

### `GET /cases/:id/risk`

Risk fields only, without the full case payload:
```json
{ "riskScore": 82, "riskLevel": "HIGH", "confidence": 87, "predictedOutcome": "...", "readiness": 50, "riskFactors": [ ... ] }
```

### `GET /cases/:id/documents`

Returns the case's `Document[]`, oldest first.

### `POST /cases/:id/documents`

Adds an ad-hoc document to the case (not part of the generated checklist).

**Request:** `{ "name": "Referral Letter", "type": "REFERRAL", "status": "AVAILABLE" }`
(`status` optional, defaults to `AVAILABLE`).

**201 response:** the created `Document`.

### `PATCH /documents/:id`

Updates a document's status and triggers a full re-analysis of its case.

**Request:** `{ "status": "AVAILABLE" }` — one of `MISSING | AVAILABLE | PENDING_REVIEW`.

**200 response:** the updated `Document`.

**Errors:** `400` invalid status · `404` document not found.

### `GET /cases/:id/actions`

Returns the case's `Action[]` (the prevention/remediation plan), oldest first.

### `PATCH /actions/:id`

Updates an action's status. Marking an action `COMPLETED` for a
document-backed action (e.g. "Obtain Diagnostic Report") also marks the
corresponding `Document` as `AVAILABLE`, then re-analyzes the case.

**Request:** `{ "status": "COMPLETED" }` — one of `PENDING | IN_PROGRESS | COMPLETED`.

**200 response:** the updated `Action`.

**Errors:** `400` invalid status · `404` action not found.

### `POST /cases/:id/simulate`

Runs the What-If simulator: applies the given document types as `AVAILABLE`
in memory (never mutates real case data), returns the projected risk and a
step-by-step trajectory, and stores a `Simulation` record for history.

**Request:** `{ "selectedDocumentTypes": ["DIAGNOSTIC_REPORT", "MEDICAL_NECESSITY_LETTER"] }`

**200 response:**
```json
{
  "currentRisk": 82,
  "simulatedRisk": 27,
  "riskReduction": 55,
  "steps": [
    { "label": "Current", "risk": 82 },
    { "label": "Diagnostic report obtained", "risk": 60 },
    { "label": "Medical necessity letter added", "risk": 27 }
  ],
  "predictedOutcome": "Likely to Process Cleanly"
}
```

### `GET /cases/:id/coverage`

Deterministic coverage/authorization/medical-necessity summary for the case
(decision support — not a payer verification).

**200 response:**
```json
{
  "procedure": "MRI Knee", "payer": "UnitedHealthcare",
  "coverageStatus": "Requires Verification",
  "authorizationStatus": "Likely Required",
  "medicalNecessityStatus": "Verification Required",
  "policyConcern": "Verify payer requirements before submission",
  "disclaimer": "This is decision support and does not replace payer verification."
}
```

---

## Copilot

### `POST /cases/:id/copilot`

Sends a message to the case-aware Copilot and returns its reply. Both the
user message and the assistant reply are persisted to `CopilotMessage`.
Uses an external LLM if `LLM_API_KEY` is configured, otherwise a
deterministic, case-aware response generator (see
[architecture.md](./architecture.md#aiservicets--copilot)).

**Request:** `{ "message": "Why is this case high risk?" }`

**200 response (`CopilotMessage`):**
```json
{ "id": "...", "caseId": "...", "userId": "...", "role": "ASSISTANT", "content": "This case has an estimated 82% denial risk (HIGH). ...", "createdAt": "..." }
```

**Errors:** `400` empty message · `404` case not found.

### `GET /cases/:id/copilot`

Returns the full `CopilotMessage[]` history for the case, oldest first.

---

## Dashboard

### `GET /dashboard`

Aggregated KPIs and priority queue across all cases.

**200 response:**
```json
{
  "kpis": {
    "activeCases": 12, "highRisk": 4, "missingDocuments": 9,
    "authorizationRequired": 3, "potentialDenialsPrevented": 15
  },
  "priorityCases": [
    { "id": "...", "caseNumber": "CASE-1048", "patientName": "John Davis", "procedure": "MRI Knee", "payer": "UnitedHealthcare", "riskScore": 82, "riskLevel": "HIGH", "status": "ACTION_REQUIRED", "nextAction": "Obtain Diagnostic Report" }
  ],
  "riskDistribution": { "LOW": 3, "MEDIUM": 5, "HIGH": 3, "CRITICAL": 1 },
  "preventionImpact": {
    "casesAnalyzed": 10, "potentialDenialsDetected": 9,
    "casesCorrected": 4, "estimatedRiskReduction": 55
  }
}
```

---

## Denial Intelligence

### `GET /denials`

Historical denial analytics from the synthetic `DenialRecord` dataset, with
optional filters.

**Query params (all optional):** `payer`, `procedure`, `reason` — exact match.

**200 response:**
```json
{
  "topDenialReasons": [ { "reason": "Authorization", "count": 14, "percentage": 35 } ],
  "records": [ { "id": "...", "payer": "...", "procedure": "...", "diagnosis": "...", "reason": "...", "outcome": "DENIED", "date": "..." } ],
  "filters": { "payers": ["UnitedHealthcare", "..."], "procedures": ["MRI Knee", "..."], "reasons": ["Authorization", "..."] },
  "insights": { "mostCommonDenialFactor": "Authorization", "highestRiskWorkflow": "Prior Authorization", "totalRecords": 40 }
}
```

Only the 50 most recent matching records are returned in `records`;
`topDenialReasons` and `insights` are computed over the full filtered set.
