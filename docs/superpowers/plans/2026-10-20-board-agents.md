# Board agents implementation plan

Spec: ../specs/2026-10-20-board-agents-design.md

- [x] Domain contracts and tests: skills/agents, board projection, source-linked reports, proposal validation, dependency invariants.
- [x] Backend: authenticated agent commands, private config/runtime storage, atomic CAS approvals/audit, local structured model adapter, provider readiness catalog, board-change review trigger.
- [x] Frontend: board-side assistant, structured report/proposal cards, agent builder, reusable skill editor, read/tool/approval controls, history; explicit record dependencies.
- [x] Verification: isolated HTTP/database/browser scenarios, regression suites, lint/build, fresh read-only review and fixes; update docs and clean synthetic fixtures.

Execution: inline, honoring earlier explicit no-implementation-questions instruction. No autonomous external sends. Existing native Nabz records remain separate from the generic board data analyzed here.


## Execution record

Implemented the domain/policy engine in the sibling Nabz Go backend and the inline-styled EN/FA frontend in this checkout. Agent config/runtime/archive documents are private; no generic Forma write bypass exists. Scope validation, projected field masks, source-linked structured output and atomic approval commits are server-enforced. Skills are reusable application templates; local model generation is opt-in and rules mode is explicit.

One final read-only review identified two P2 issues: reports with more than 100 overdue records exceeded the action limit, and unbounded history could fill its document. Both were fixed with bounded report output and transactional archival, with regression coverage. The nonblocking sibling-approval limitation was also resolved by advancing unchanged previews only within the approved run/record. Existing external-edit conflicts remain enforced. Additional checks cover comment/source attribution and selecting the newest eight updates.

Verification completed: 18 frontend tests; full Go suite with isolated PostgreSQL HTTP scenarios; ESLint; TypeScript; production Next build; Playwright/Chrome workflows for live thread signals, reject/approve persistence, scoped builder, reusable skill versioning, local-model failure without fallback, provider readiness, source links and Persian mobile. Separate checks verified reader restrictions and audit export. Synthetic local HTTP model tests verify JSON schema and action-scope rejection; real Qwen inference was not available.

All four retained browser QA tenants and their documents, sessions and users were removed using exact fixture IDs plus a QA-name guard. Secret fixture files were deleted. Existing accounts/passwords, native records and original containers were preserved. Both worktrees remain uncommitted for the owner's later merge.

Provider ruling: Gmail/Slack/Outlook/Teams are unconfigured capability metadata. OAuth/provider adapters, live sends, custom MCP execution and a durable scheduler are outside this delivered implementation and are explicitly described in the UI/docs. Board-change reviews are synchronous, rules-only and best effort. Older reviews are exportable archives with expired pending previews.

Next feedback reporting pass: no qualifying Next.js issue remained to report.
