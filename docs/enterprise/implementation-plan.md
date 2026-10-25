# Enterprise decision workspace · issue #1

## Observed source and limits

The [Korsi interactive public showcase](https://korsi.ai/fa#explore-korsi) uses synthetic data. It exposes a manager desk, decisions with seven stages and evidence, cases, meetings, actions, an organizational memory graph, and contextual assistance. Risk and document workflows are product requirements from the Nabz owner; the showcase does not prove their authenticated persistence or APIs. `crm-v2` already has real CRM records, schedules, and board agents, but its documented Forma Go backend is absent from the local sibling checkout. The new executive records therefore use an isolated PostgreSQL connection and explicit Nabz session authorization.

## Implementation sequence

1. Add versioned, tenant-scoped decision, case, meeting, action, knowledge, and risk-document records. Keep an append-only change event and optimistic revision. Never accept tenant or actor identity from the browser.
2. Validate records and domain transitions. Require evidence or an explicit unresolved gap before a decision can be marked ready. Final approval requires a manager role and a separately recorded approval event. Risk documents include severity, likelihood, impact, mitigation, owner, review date, linked sources, and human acknowledgement.
3. Build an RTL Persian-first executive workspace in the existing Forma palette. Add real create/edit/detail/list views, navigation, attention queue, case and decision links, and downloadable JSON/CSV snapshots. Existing CRM stays accessible.
4. Make the Nabz AI landing hand off to `crm-v2` after intake; new organization requests remain pending activation, not automatic tenant creation.
5. Package a separate production Postgres volume and secret-based connection. Test isolation, authorization, conflicts, schema, and UI. Deploy only after the backend/session route and DNS are verified on the target host.

## Evidence gates

- Tests cover malformed records, stage gates, risk fields, tenant separation, revision conflict, and permission checks.
- Production build and browser exercise prove UI navigation and actions. A local test with isolated Postgres proves persistence. Live CRM login and deployment require the actual host image, route, TLS, and activated tenant.
- Provider AI inference, STT, messaging, and accounting actions are unconfigured until their adapters and approval gates are tested.
