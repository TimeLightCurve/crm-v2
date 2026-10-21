# Nabz backend integration

The frontend reuses the existing Go API source in `D:/dev/nabz-crm/nabz-crm`, opaque Nabz sessions, tenant identity, permissions and PostgreSQL. `compose.backend.yaml` builds a separate API on `127.0.0.1:8081` using the existing `nabz-ui_default` database network. The old API on :8080 and its volume remain unchanged. Its running image predates the current Go source and does not expose the same tenant identity; tests use the new tenant-aware API built from the current source.

## Storage and identity

- `forma_document`: one JSON document per tenant/kind (`crm`, `schedule`, `calls`), payload, revision, actor and timestamp.
- `forma_revision`: immutable revision/actor/timestamp metadata committed in the same transaction.
- Authenticated `GET/PUT /api/forma/{kind}` use tenant predicates and compare-and-swap revisions; stale writers receive 409.
- Nabz membership is derived from actual active company accounts on every CRM load/save. Client identity/roles cannot be substituted. CRM reads need `sales:read`; CRM/call writes need `sales:write`. Managers configure fields, workspaces and assistant settings; only owners permanently delete previously trashed records.
- Schedule changes require existing department task permissions for specialists, with participant-or-manager checks and server-side overlapping-booking validation. Managers/owners can plan across the team.
- Complete runtime shapes are checked before persistence, along with record links, required/unique custom values, comment authorship/moderation and immutable activity entries.

The Next.js same-origin proxy exposes only needed auth, Forma, staff, deals and task routes. It forwards only `nabz_session`, retains HttpOnly session cookies, rejects cross-origin mutations, and does not expose accounting, signup, ops or SSO endpoints. The optional local AI route also requires authentication and same-origin access.

PostgreSQL is authoritative. No prototype records or localStorage data are automatically uploaded. Client saves serialize revisions and keep confirmed snapshots. Failures discard unsaved snapshots with a visible message; **Reload latest** fetches server state explicitly. A session generation prevents expired requests/queued writes from crossing into a later login. Other users' changes appear after reload; real-time push is not implemented.

Attachments remain bounded inline values in JSON (250 KB custom file, 500 KB/comment file, five/comment); documents have a 5 MB client ceiling. Move binary assets to an object store before increasing those limits.

## Existing native data

Ruling: expose native Nabz deals and department tasks through **Nabz records**, using their original API contracts, instead of copying them into generic Forma records. This preserves exact integer-rial strings, native optimistic deal versions, required loss reasons, and restrictions on cartable tasks. The tradeoff is two distinct record collections: customized/multi-currency Forma records and native Nabz records. There is no automatic duplication or bidirectional conversion.

Staff provisioning uses the existing Nabz staff API and permissions. The UI requires an explicit initial password; it does not log, persist or reset existing passwords. No bootstrap owner password is passed to the new API container.

Real VoIP, STT, audio storage, external messaging and Qwen inference remain provider adapters. Mock call histories store sample references, not real voice files. No cloud AI provider is enabled. Optional LM Studio configuration is server-only and disabled by default.

## Verification

- Frontend: 18 domain/store tests, ESLint, TypeScript and production Next.js build.
- Go: full backend suite plus an HTTP/PostgreSQL integration test against temporary isolated tenants, covering real login, anonymous/reader rejection, tenant isolation, CAS conflicts and schedule persistence. Set `FORMA_TEST_DATABASE_URL` to enable that integration test. It cleans up its own fixtures by default.
- Browser: login, create/read/reload records, fields/comments, contact call bridge, mock call history, schedule persistence and pointer/keyboard moves, native deal/task writes and exact 20-digit rials, staff provisioning, specialist permissions, new workspace creation, proxy guards, logout, authenticated AI guard, Persian login and 390 px RTL layout.
- The temporary browser test tenants, staff, sessions and native records were removed. Existing tenant/user/accounting data was not reset.

Backend files must travel with the frontend when merging: `internal/ports/forma.go`, `internal/adapters/store/forma.go`, `internal/adapters/httpapi/forma*.go`, plus the registration additions in `httpapi/server.go` and `store/postgres.go`. Rebuild with `docker compose -f compose.backend.yaml up -d --build` after backend changes.

Board-agent policy, approvals, private archives and optional Qwen configuration are described in [board agents](board-agents.md). Both backend and frontend additions must be merged together.
