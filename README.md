# PreClaim AI

**Prevent insurance denials before they happen.**

PreClaim AI is a proactive, AI-powered insurance assistant for healthcare revenue cycle (RCM) teams. Instead of finding out a claim was denied *after* submission, PreClaim AI predicts denial and prior-authorization risk *before* treatment, explains exactly why the risk exists, identifies missing documentation, and guides staff through the specific actions needed to prevent an avoidable denial.

## The problem

The traditional claims workflow is reactive:

```
Treatment → Claim → Rejection → Investigation → Correction → Resubmission
```

By the time a denial is discovered, the patient has already been treated, staff time has been spent on a doomed submission, and revenue is delayed or lost.

## The solution

PreClaim AI flips the workflow to be proactive:

```
Planned Treatment → AI Risk Analysis → Predict Risk → Identify Gaps → Fix → Recalculate Risk → Submit
```

Core loop: **Predict → Explain → Detect → Fix → Simulate → Prevent.**

## What makes it different

PreClaim AI doesn't just predict whether a claim will be denied — it:

- **Predicts** an estimated denial-risk score with a confidence level
- **Explains** exactly why the risk exists, in plain language, with evidence
- **Detects** which specific documents/requirements are missing, and why each one matters
- **Remediates** by generating a prioritized action plan (who to contact, how to obtain each item)
- **Simulates** how completing specific actions would change the predicted risk *before* you do the work ("What-If" simulator)
- **Prevents** avoidable denials by giving staff a concrete, step-by-step path from "high risk" to "ready to submit"

## Demo workflow (the "golden path")

1. Open the demo (`Enter Demo`) → **Dashboard**
2. Open the primary case: **CASE-1048, John Davis, MRI Knee, UnitedHealthcare**
3. See **82% Denial Risk (HIGH)** — predicted outcome: *Prior Authorization Likely Required*, confidence 87%
4. Expand **"Why is this case high risk?"** → missing diagnostic report, missing medical necessity documentation, prior authorization requirement, historical denial pattern
5. Review **Documentation Readiness** (3/6 available) and the **Prevention Action Plan**
6. Open **What-If?**, select all three corrective actions → simulated risk drops to **27%** (55-point reduction)
7. Ask **PreClaim Copilot**: *"Why is this case high risk?"* / *"What should I do next?"*
8. Open the **Emergency case** (Emily Rodriguez) to see the Emergency Workflow banner — insurance risk never blocks emergency care
9. Review **Denial Intelligence** for historical denial patterns across payers/procedures

## Architecture

```
Frontend (React/Vite) → REST API (Express) → Controllers → Services → Risk Engine / AI Service → Prisma → SQLite
```

- **Frontend never computes risk.** It only renders what the API returns. All scoring logic lives server-side in `backend/src/ai/riskEngine.ts`.
- **Document checklists are generated server-side**, per case, from payer + procedure + urgency (`backend/src/ai/requirementsEngine.ts`) — never hard-coded in the UI.
- **Completing a document or action always re-runs the risk analysis** server-side, so risk score, readiness, and status stay consistent everywhere (dashboard, case list, case detail).
- **What-If simulation never mutates real case data.** It runs the risk engine against a hypothetical document snapshot and stores a `Simulation` record for history.
- **AI Copilot is an abstraction** (`backend/src/ai/aiService.ts`): it will call an external LLM if `LLM_API_KEY` is configured, and otherwise falls back to a deterministic, case-aware response generator — so the product is fully functional with no external API key.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Lucide icons, Recharts
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite + Prisma ORM
- **Auth:** JWT + bcrypt password hashing (email/password login or one-click demo login)
- **AI:** Deterministic risk/requirements engine + pluggable LLM abstraction for the Copilot

## Project structure

```
PreClaim AI/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # User, Patient, Insurance, Case, Document, RiskFactor, Action, Simulation, DenialRecord, CopilotMessage
│   │   └── seed.ts             # 12 synthetic demo cases + historical denial records
│   └── src/
│       ├── ai/                 # riskEngine, requirementsEngine, payerData, aiService (copilot)
│       ├── controllers/
│       ├── services/            # caseService, dashboardService, denialService, copilotService, authService
│       ├── routes/
│       ├── middleware/          # auth (JWT), error handling
│       └── index.ts
└── frontend/
    └── src/
        ├── components/ui/       # Button, Card, Badge, ProgressBar, Skeleton, EmptyState
        ├── components/layout/   # Sidebar, Header, AppLayout
        ├── features/case/       # RiskHeroCard, RiskFactors, DocumentChecklist, ActionPlan, WhatIfSimulator, CoverageChecker, CopilotPanel
        ├── pages/                # Login, Dashboard, Cases, NewCase, CaseAnalysis, DenialIntelligence, Copilot, Settings
        ├── hooks/                # useAuth, useToast
        ├── services/api.ts      # centralized API client
        └── types/
```

## Setup

### Prerequisites

- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (already included for local development):

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="preclaim-ai-hackathon-secret-change-in-prod"
PORT=4000
LLM_API_KEY=
```

Set up the database and seed demo data:

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

Run the backend:

```bash
npm run dev
```

The API is available at `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is available at `http://localhost:5173` and proxies `/api` requests to the backend on port 4000.

### 3. Demo login

Click **Enter Demo** on the login screen (creates/reuses a fixed demo user, Sarah Chen), or sign in with:

- Email: `sarah.chen@preclaim.ai`
- Password: `demo1234`
- 
## Deployment

PreClaim AI is deployed using a separate frontend and backend.

- **Live Application:** https://pre-claim-ai.vercel.app
- **Backend API:** https://preclaim-ai.onrender.com
- **GitHub Repository:** https://github.com/chandilyanr-star/PreClaim-AI

The production frontend communicates with the deployed backend API on Render.

## AI configuration

`backend/src/ai/aiService.ts` is a thin abstraction: if `LLM_API_KEY` is set in `backend/.env`, the Copilot will attempt to call an external LLM provider; if the key is absent (or the call fails), it falls back to a deterministic, case-aware response engine keyed on question intent (why high risk / missing documents / next steps / prior authorization / risk reduction / summary). This keeps the whole product fully functional and demo-safe with zero external dependencies.

## Limitations

- This is a hackathon MVP: risk scoring is a deterministic, transparent points-based model (not a trained ML model), designed to be explainable and reliable for a live demo.
- No real payer integrations, EDI/claim submission, or OCR — document status is tracked as metadata ("obtained" / "missing"), not actual file uploads/parsing.
- Uses synthetic demo data only. No real patient information is stored or processed anywhere in this system.
- Not a HIPAA-compliant production system. All predictions are decision support and explicitly labeled as estimates that do not replace payer verification.

## Future improvements

- Real payer API/portal integrations for live authorization status
- Document upload + OCR to auto-verify content (not just presence) of required documents
- A trained ML risk model informed by real historical claims data, with the current rules engine as an explainable baseline/fallback
- Role-based permissions and multi-facility support
- Real-time collaborative case notes and audit trail
