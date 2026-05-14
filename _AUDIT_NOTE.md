# Audit Note — AIChurchMosqueTempleManagement

Source: `_AUDIT/reports/batch_01.md` (Project 21)

## Maturity: PARTIAL-BUILD (16 routes, 10 AI endpoints)

## Original audit recommendations

### Gaps & Opportunities
- Missing Notifications: No notification system (email/SMS/push) for alerts/updates/engagement.
- Missing Reporting: No export/reporting module for data extraction or BI.
- Missing Integration API: No webhooks or external API for third-party tool integrations.

### Strategic Feature Suggestions
1. Agentic Workflow Orchestration
2. RAG over Domain Documents
3. Real-time Anomaly Detection
4. White-label/Reseller Platform

## Categorization
- **MECHANICAL:** notifications CRUD, reports & CSV export, webhook subscriptions.
- **NEEDS-PRODUCT-DECISION:** agentic workflows, RAG, anomaly detection, white-label.
- **NEEDS-CREDS:** SMS/email outbound delivery (SMTP/Twilio).

## Implementations applied
1. **`backend/routes/notifications.js`** — full CRUD with DB-table-detection fallback.
2. **`backend/routes/reports.js`** — `/summary`, `/donations.csv`, `/members.csv`, `/events.csv`, `/attendance.csv`.
3. **`backend/routes/webhooks.js`** — webhook registry CRUD + manual test-delivery endpoint.
4. **`backend/server.js`** — mounted all three under `/api/notifications`, `/api/reports`, `/api/webhooks`.

All files syntax-checked with `node --check`.

## Backlog (prioritized)

### High priority
- **Outbound delivery worker:** wire donations/events/attendance changes to dispatch through `/api/webhooks` registrations and the notifications table.
- **Email/SMS delivery** for notifications (Nodemailer + Twilio) — needs credentials.

### Medium priority
- **RAG over sermon archive** — retrieval over historic sermons + scriptural references for `/api/ai/sermon-qa`.
- **Volunteer-burnout alerting** — schedule a job that flags burnt-out volunteers via `/api/ai/volunteer-burnout` and emits notifications.

### Low priority
- White-label platform / per-congregation branding.
- Agentic event planner that coordinates calendar, facilities, volunteers.

## Apply pass 3 (frontend)

Action: **LEFT-AS-IS** — frontend already wired.

- `frontend/src/pages/AITools.jsx` exposes all 10 `/api/ai/*` endpoints (sermon-analyzer, donation-insights, prayer-guidance, member-engagement, event-planner, outreach-strategy, sermon-qa, volunteer-burnout, prayer-categorize, facility-optimizer). Uses JWT Bearer from `localStorage`, displays errors (covers 503-no-key surface).
- `frontend/src/pages/Notifications.jsx`, `Reports.jsx`, `Webhooks.jsx` already wired to the apply2 backend additions.
- No FE changes made (idempotent). Log: `_AUDIT/apply3_logs/ab3_56.md`.

## Apply pass 4 (mechanical backlog)

Action: **LEFT-AS-IS** — no remaining MECHANICAL backlog items fit the BE-endpoint + FE-page template.

- Outbound delivery worker: NEEDS-INFRA (long-running worker / background job runner; not a request-scoped endpoint).
- Email/SMS delivery (Nodemailer/Twilio): NEEDS-CREDS.
- RAG over sermon archive: already covered by `/api/ai/sermon-qa` (loads transcripts, returns answer + citations). Full vector-RAG is NEEDS-PRODUCT-DECISION + NEW-DEPS.
- Volunteer-burnout alerting (scheduled job): NEEDS-INFRA (cron / scheduler).
- White-label / agentic event planner: NEEDS-PRODUCT-DECISION.

No code changes. Log: `_AUDIT/apply4_logs/ab3_56.md`.
