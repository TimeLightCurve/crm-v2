# Nabz backend implementation plan

- [x] Inspect Nabz identity, storage, permissions, task/deal contracts and Docker runtime.
- [x] Add an authenticated Forma API with additive PostgreSQL schema, permissions, tenant scoping and optimistic revisions.
- [x] Build/start a separate API container against the existing database network, without resetting data.
- [x] Add same-origin Next.js proxy and branded EN/FA login using Nabz sessions.
- [x] Replace local CRM persistence and role preview with authenticated server state and visible save status.
- [x] Persist schedule and call workspace state; map real CRM contacts/users rather than prototype seeds.
- [x] Test server authorization, isolation, conflicts, native records and UI persistence; document operation and remaining provider integration.

## Execution record

- Modified the current app in place as requested and extended the sibling backend without resetting its database/users. Left both checkouts available for the user's later merge.
- Ruling: native deals/tasks use a separate Nabz records view rather than document conversion; this preserves exact rials and native workflow safety. Cost: generic and native collections are distinct.
- Fresh-context read-only review identified three concrete findings. All fixed with reproducing failing tests followed by passing suites: session-generation isolation, conflict queue recovery, and complete persisted runtime schemas.
- Save recovery restores a confirmed snapshot and requires explicit reload; it does not race background recovery GETs against later edits.
- Next.js feedback reporting pass: no qualifying framework issue retained; routine application failures and the expected parent-lockfile diagnostic were excluded.
- Browser fixtures were isolated from existing users and removed after verification. No publish, merge or push was requested or performed.
