# Architecture

This document describes how PreClaim AI is put together: the request flow, the
data model, and where the "intelligence" actually lives. For the product
pitch and demo script, see the root [README](../README.md).

## System overview

```
┌─────────────────┐      HTTPS/JSON       ┌──────────────────┐
│  React frontend  │ ───────────────────▶ │   Express API     │
│  (Vite, TS)       │ ◀─────────────────── │  /api/*            │
└─────────────────┘                        └────────┬─────────┘
                                                       │
                                            ┌──────────┴──────────┐
                                            │      Controllers     │
                                            │  (validate w/ zod)    │
                                            └──────────┬──────────┘
                                                       │
                                            ┌──────────┴──────────┐
                                            │       Services        │
                                            │  (business logic)      │
                                            └──────────┬──────────┘
                                                       │
                                   ┌───────────────────┼───────────────────┐
                                   │                    │                    │
                          ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐
                          │   Risk Engine    │  │ Requirements     │  │   AI Service     │
                          │  (riskEngine.ts) │  │ Engine            │  │  (aiService.ts)  │
                          └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
                                   │                    │                    │
                                   └───────────────────┼───────────────────┘
                                                       │
                                            ┌──────────┴──────────┐
                                            │   Prisma / SQLite     │
                                            └──────────────────────┘
```

The frontend **never computes risk, never hard-codes document checklists, and
never talks to the database directly.** It renders whatever the API returns.
All scoring, checklist generation, and copilot logic live server-side, so the
dashboard, case list, and case detail views always stay consistent with each
other — there is exactly one source of truth per case.

## Request flow

1. A controller (`backend/src/controllers/*.ts`) validates the request body
   with a `zod` schema and throws an `ApiError` on failure. Controllers never
   contain business logic — they parse input, call a service, and shape the
   response.
2. A service (`backend/src/services/*.ts`) implements the actual behavior:
   reading/writing via Prisma, calling into the AI layer, and returning
   plain objects.
3. `backend/src/ai/*` holds the three deterministic "intelligence" modules
   described below — none of them require an external API.
4. Every mutating endpoint (`analyze`, document status change, action status
   change) re-runs `caseService.analyzeCase`, so risk score, risk level,
   confidence, readiness, and status are recalculated and persisted on the
   `Case` row after any change. There's no separate "stale" and "fresh" risk
   value to reconcile — reading a case always returns the latest analysis.

## The three engines (`backend/src/ai/`)

### `requirementsEngine.ts` — document checklist generation

`buildDocumentChecklist(payer, procedure, urgency)` returns the required
document list for a case. It always includes the baseline three documents
(insurance card, physician order, prescription), then adds:

- **Diagnostic report** + **medical necessity letter** if the procedure is in
  the `IMAGING_OR_SURGICAL` list (MRI, CT, spinal fusion, joint replacement,
  cardiac cath, sleep study).
- **Prior authorization form** if the payer/procedure profile has
  `authRequired: true`. For `EMERGENCY` urgency, the instructions shift to
  "initiate retrospective authorization after stabilization" rather than
  blocking treatment.

Each requirement carries a `weight` — how many risk points it contributes to
the score if missing — plus `source`, `instructions`, and `why`, all of which
are rendered directly in the frontend's Document Checklist. Nothing about the
checklist is hard-coded client-side.

### `riskEngine.ts` — risk scoring

`runRiskAnalysis(input)` is the single function that computes a case's risk.
It is deterministic and synchronous except for one query against historical
denial data:

1. Look up the payer/procedure base risk and authorization requirement from
   `payerData.ts`.
2. Sum the `weight` of every **required** document that is not `AVAILABLE`.
3. `riskScore = clamp(baseRisk + missingWeightSum, 3, 97)`, then bucketed into
   a `riskLevel`: `CRITICAL` ≥ 85, `HIGH` ≥ 60, `MEDIUM` ≥ 40, else `LOW`.
4. Query `DenialRecord` for the same payer/procedure. If ≥40% of historical
   matches were denied, add a "Historical Pattern" risk factor.
5. Generate named `riskFactors` for the specific gaps found (missing
   diagnostic report, missing medical necessity documentation, missing prior
   auth, historical pattern) — each with a severity, impact, evidence string,
   and a recommended `action`.
6. Derive a `predictedOutcome` label (e.g. "Prior Authorization Likely
   Required") from which gaps are present, and a `confidence` score from how
   many risk factors were found plus how much historical data backs the
   prediction.
7. `readiness = completedRequiredDocs / requiredDocs * 100`.

`simulateRisk()` is a thin wrapper that runs the same function against a
hypothetical document snapshot — see **What-If simulation** below.

### `aiService.ts` — Copilot

`generateCopilotResponse(userMessage, ctx)` is an explicit abstraction point:
if `LLM_API_KEY` is set, it attempts `callExternalLLM()` (currently a stub
that throws, ready to be wired to a real provider); on any failure or when no
key is configured, it falls back to `deterministicCopilotResponse()`, a
case-aware keyword responder built from the same risk/document/action data
the UI already shows. This means **the product is fully functional with zero
external dependencies** and an LLM can be dropped in later without changing
any caller.

## What-If simulation

`caseService.simulateCaseRisk(caseId, selectedDocumentTypes)`:

1. Runs the risk engine once against the case's current (baseline) document
   state.
2. Applies the selected documents as `AVAILABLE` **in memory only** (never
   writes to the `Document` table) and re-runs the risk engine after each
   incremental addition, in a fixed order (diagnostic report → medical
   necessity → prior auth), to produce a step-by-step trajectory for the UI.
3. Runs the risk engine once more with all selected documents applied, to get
   the final simulated score.
4. Persists a `Simulation` row (selected actions, predicted risk, risk
   reduction) for history — the only write in the whole flow.

Real case data (`Case`, `Document`) is untouched; only completing an actual
document or action (via `PATCH /documents/:id` or `PATCH /actions/:id`)
mutates state and triggers `analyzeCase`.

## Data model (Prisma / SQLite)

```
User ──< CopilotMessage >── Case ──< Document
                              │  ──< RiskFactor
                              │  ──< Action
                              │  ──< Simulation
                              │
Patient ──< Insurance ──< Case
Patient ──< Case

DenialRecord   (standalone historical dataset — no FK to Case)
```

- `Case` denormalizes its latest risk analysis (`riskScore`, `riskLevel`,
  `confidence`, `predictedOutcome`, `readiness`, `status`) directly onto the
  row, rather than requiring a join to reconstruct it — every read is cheap
  and consistent.
- `RiskFactor` and `Action` rows for a case are fully replaced/reconciled on
  every `analyzeCase()` call (existing non-completed actions are updated or
  removed if no longer relevant; `COMPLETED` actions are preserved).
- `DenialRecord` is a synthetic historical dataset keyed by
  `payer` + `procedure` + `reason`, used both by the risk engine (pattern
  detection) and the Denial Intelligence page (`GET /api/denials`).
- SQLite is used for the hackathon/demo deployment; `DATABASE_URL` is the
  only thing that would need to change to move to Postgres via Prisma.

## Authentication

`backend/src/services/authService.ts` supports three ways in, all producing
the same JWT (`signToken`, 12h expiry, `Authorization: Bearer` header
required on every route except `/auth/*`):

- **Email/password** — `bcryptjs` hash (cost 10) stored in `passwordHash`;
  email is lowercased/trimmed before lookup or storage so `Jane@X.com` and
  `jane@x.com` are the same account.
- **Google Sign-In** — the frontend obtains an ID token via Google Identity
  Services; the backend verifies it server-side with
  `google-auth-library`'s `OAuth2Client.verifyIdToken` against
  `GOOGLE_CLIENT_ID` and requires `email_verified`. A Google email that
  already belongs to a **password** account is deliberately **not**
  auto-linked — it returns `409` and asks the user to sign in with their
  password instead, to avoid silently handing account access to whoever
  controls that Google account.
- **Demo login** — `POST /auth/login` with `{ demo: true }` bypasses
  credential checks entirely and logs into a fixed seeded account
  (`ensureDemoUser`, created on server startup if missing), so the product
  can be demoed with zero setup.

No endpoint ever returns `passwordHash` — every response is shaped through
`toSafeUser()`. See [api.md](./api.md#authentication) for request/response
shapes.

## Frontend structure

- `src/pages/*` — one component per route (`App.tsx` wires them behind a
  `ProtectedRoute` that checks `useAuth().isAuthenticated`).
- `src/features/case/*` — the case-detail widgets (risk hero card, risk
  factors, document checklist, action plan, what-if simulator, copilot
  panel) — each is a thin view over one slice of `CaseDetail`.
- `src/services/api.ts` — the only place `fetch` is called; every other
  module goes through `authApi` / `casesApi` / `dashboardApi` / `denialsApi`.
  Base URL is `${VITE_API_URL}/api` in production or the relative `/api`
  (proxied by Vite in dev) when `VITE_API_URL` is unset.
- `src/hooks/useAuth.tsx` — holds the JWT + user in `localStorage`
  (`preclaim_token`, `preclaim_user`) and exposes `login` / `register` /
  `loginWithGoogle` / `logout`.

## Deployment shape

- **Backend**: Node/Express, deployed as a standard long-running service
  (e.g. Render) with `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and
  optionally `LLM_API_KEY` as environment variables. `ensureDemoUser()` runs
  once on boot.
- **Frontend**: static Vite build, deployed separately with `VITE_API_URL`
  pointed at the backend's public URL and `VITE_GOOGLE_CLIENT_ID` matching
  the same Google OAuth client as the backend.
