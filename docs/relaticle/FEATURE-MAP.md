# Relaticle source audit and feature coverage

This is a React implementation of Relaticle-inspired workflows, adapted to Forma's existing visual style. The PHP packages are not installed, vendored or represented as running inside Next.js.

## Research scope

Reviewed the [Relaticle website](https://relaticle.com/) and cloned all five supplied repositories. Every tracked path is inventoried at a pinned commit. Text files matching source/documentation extensions were scanned for structure, symbols and feature surfaces; generated/binary assets and dependency lockfiles were not manually audited. Manual reading concentrated on resource definitions/forms/actions, record relationships, field type/validation contracts, workspace capabilities, API/MCP entry points, package guides, timeline refinement, and comments behavior. This is a feature-oriented source review, not a claim that every line of approximately half a million scanned lines received manual review.

| Repository | Inspected commit | Tracked files | Text source/docs scanned |
| --- | --- | ---: | ---: |
| [relaticle](https://github.com/relaticle/relaticle) | `baa9447a51325d9cdc4aa7b9fe8e9e8423fc9d48` | 3688 | 3190 |
| [custom-fields](https://github.com/relaticle/custom-fields) | `9278aa5897212f0516d7ae15916657dc6bf9b9e4` | 476 | 433 |
| [flowforge](https://github.com/relaticle/flowforge) | `3001dc8cd9d96a40e9b585077e6dad1d5ac3e609` | 297 | 252 |
| [activity-log](https://github.com/relaticle/activity-log) | `0460262a14a77d3e79b750d30bc2c7f62600097d` | 116 | 87 |
| [comments](https://github.com/relaticle/comments) | `ca973c360cab502be0a905db9b565ff97a5eeb63` | 154 | 110 |

Full paths, source symbols and package guide headings are in [source-inventory.json](source-inventory.json). Reference code was inspected in a temporary checkout outside this repository. Forma's implementation is newly written TypeScript/React; no Laravel runtime code was copied.

## Implemented workflows

These React workflows now use the authenticated Nabz Go/PostgreSQL backend. See [the backend integration](../nabz-backend-integration.md). The source audit below describes the original UI adaptation; the following integration notes supersede its earlier browser-local storage/role boundaries.

CRM, call-workspace and schedule state persist to tenant-scoped PostgreSQL documents with revisions. Actual Nabz accounts supply membership and roles, and the API enforces authorization. Existing native Nabz deals/tasks are available separately through **Nabz records**, preserving their original contracts and exact rial amounts. There is no live push collaboration; conflicts require reload. LocalStorage and the role preview have been removed. Uploads remain bounded inline attachments, now stored in PostgreSQL JSON rather than browser storage.

| Reference area | Forma behavior | Implementation |
| --- | --- | --- |
| Core CRM | People, companies, opportunities, tasks, notes; create/edit/soft-delete/restore/permanent delete; owners, stages, priorities, tags, due dates and values | lib/records/model.ts; components/records/record-detail.tsx |
| Company/people profiles | Linked companies, contacts, opportunities, tasks and notes; reverse relationship discovery; contact-to-call-workspace bridge | components/records/record-detail.tsx; components/crm/sales-workspace.tsx |
| Views | Search, owner/stage/custom-value filters, sorting, table/card/board modes, custom table columns, pagination and named saved views | components/records/crm-workspace.tsx |
| Custom fields | 23 type controls including text, numbers, currency, dates, choices, multiple choices, booleans, color, record lookup, local files and formatted text; sections, ordering, min/max, required/unique validation, conditional visibility | components/records/fields.tsx; lib/records/model.ts |
| Flowforge | Animated stage drag-and-drop, within-column ordering, keyboard stage moves, owner swimlanes with cross-lane assignment, counts, currency-separated summaries and incremental local loading | components/records/record-board.tsx |
| Import/export | UTF-8 CSV preview, quoted/multiline values, atomic validation, custom values and relationships, bulk selection export, formula-safe CSV, JSON workspace backup | components/records/import-records.tsx; lib/records/model.ts |
| Activity Log | Own/related record timeline, actor/date/type filters, timestamped grouped before/after changes, local mutation batches | components/records/activity-feed.tsx |
| Comments | Nested replies, member mention suggestions, six reactions, pins, edits/deletion, subscriptions, local mention/assignment notifications, validated small attachments and download | components/records/comments.tsx |
| Team/workspaces | Isolated CRM record workspaces, local member roster, owner/admin/member/viewer UI permissions, role preview, reassignment when removing members | components/records/workspace-settings.tsx |
| Assistant | Calculated demo summaries and conversation history; optional local LM Studio transport, configurable Qwen model identifier, no automatic record mutation | components/records/assistant.tsx; app/api/local-ai/route.ts |
| Existing Forma features | Calling, mock transcription/analysis, WhatsApp/SMS drafts, audio playback, scheduling with drag-and-drop | components/crm; components/scheduling |

## Adaptations and remaining backend work

- Persistence, roles, sessions, tenant isolation and atomic revision checks are connected to Nabz. Real-time broadcasting remains future work.
- Calls and scheduling now persist as tenant-scoped Nabz documents. Provider telephony/STT/messaging and external calendar synchronization remain disconnected.
- Formatted notes/fields use safe Markdown-like controls and preview, not the full Filament WYSIWYG editor. Choice controls use browser-native widgets. Field configuration is local; optional encryption and pluggable Laravel field classes need server support.
- Files are stored as bounded inline PostgreSQL attachments with explicit size/type limits (custom fields 250 KB, comments 500 KB each / five attachments). Cloud media storage, signed uploads, queues and mail delivery need backend adapters.
- CSV imports create new records; they do not reproduce Relaticle's server-side upsert API. They validate every row before applying the import. File size is limited to 2 MB and 1,000 rows per import. JSON backup download is available; automated backup restore is not implemented.
- The board works against the loaded local dataset. It does not reproduce database cursor pagination, arbitrary Filament card schemas, fractional-rank repair commands or distributed optimistic conflict resolution.
- The timeline groups fields changed by one local operation. Spatie source aggregation, distributed deduplication, caching TTL and custom PHP renderer/source plugins remain server concerns.
- CRM REST API, MCP/OAuth/agent tools, email/calendar OAuth sync, automated enrichment, passkeys/MFA, workspace invitations by email, billing/subscriptions and queued digests are not implemented as live services. The website and main repository include these server features; this UI port does not claim full Laravel feature parity.

## LM Studio / Qwen later

The adapter follows [LM Studio's chat-completions endpoint](https://lmstudio.ai/docs/developer/openai-compat/chat-completions). It is disabled by default.

1. Load your Qwen model in LM Studio and enable its local server.
2. Copy .env.example to .env.local and set LM_STUDIO_ENABLED=true. Keep LM_STUDIO_BASE_URL on localhost (default http://127.0.0.1:1234/v1). If needed, set LM_STUDIO_API_KEY only on the server.
3. In CRM Settings, choose LM Studio and enter the exact loaded model identifier.
4. Ask Forma. Only the current CRM workspace's bounded record summary and chat context are sent to your local server. Replies are suggestions; no tool executes a write.

MCP/tool calling, structured lead analysis, STT and scheduling assistant integration are separate adapters for the real project. Live Qwen inference was not tested because no enabled LM Studio instance was supplied.

## Verification

- node --test tests/records.test.cjs: 12 domain/regression tests.
- Browser checks: core CRUD, fields, tags, threaded comments/reactions/pins/files, saved views, call bridge, trash/restore, persistence, authenticated roles, tenant isolation, assistant mock/disabled transport, pointer/keyboard board movement, CSV import/export and invalid input.
- EN/FA RTL and drawer boundaries at 390, 768, 1024 and 1440 px; browser console/page-error checks.
- TypeScript, ESLint and production Next.js build.
