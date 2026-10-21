# Board assistants and reusable skills

Open a CRM entity (Tasks, Opportunities, People, Companies or Notes), then **Ask Forma**. Sidekick reads the current filtered record subset from PostgreSQL. Open **CRM → Agents** to build an agent, manage the skill library, inspect connections or export activity.

## Available now

- Board-side assistant with current record context, update-thread signals, explicit dependencies, linked sources, status counts and proposed next steps. Rules mode uses deterministic checks; it is labeled Rules / Mock and does not claim to understand arbitrary questions.
- Agent templates for launch coordination and sales follow-up, plus a blank builder. Configure identity, instructions, one or more board scopes, individual readable core/custom fields, update-thread access, allowed proposal fields and reusable skills.
- Four built-in skills and editable custom skills with version increments and fixed report sections. In rules mode, custom instructions are stored for future model use; the built-in checks and chosen sections run today. These are application skills, not installed Codex SKILL.md files.
- Explicit **Depends on** links for tasks/opportunities. Same-workspace links and acyclic dependencies are checked in the browser and server. General related-record links are never treated as dependencies.
- Human approval for status, owner, due date and priority. Model output cannot directly write records or send messages. Stored proposal IDs select server-held values; a decision rechecks the actual user's permission, current agent scope, record version and original field value. CRM, proposal state and audit metadata commit in one PostgreSQL transaction. Repeated approvals are idempotent. Compatible sibling proposals from one review advance together after our own approved edit; unrelated edits still invalidate previews.
- Timestamped runs and approval/rejection/conflict events, with JSON export. The interactive window holds at most 20 reviews / roughly 2 MB and 500 events. Older entries are atomically archived in private tenant documents, and their pending previews expire. Export includes the archive; it remains readable, with no generic endpoint allowing edits. Large contexts may reduce the interactive count below 20.
- Optional board-change rules reviews. They run synchronously after successful CRM saves and compare the projected sources with the last report. This is a best-effort request hook, not a durable background scheduler. It never applies proposals, runs external tools or invokes Qwen automatically. Automatic reviews currently use English.

## Access boundary and limits

The existing tenant-wide CRM authorization remains in force: `sales:read` for board/history access, `agent:use` for runs, `sales:write` for decisions, owner or sales-manager role for agent/skill configuration. Agent masks restrict what enters a report/model call; they do not create a separate user-level field-security system. Built-in Sidekick uses the current board's readable fields; configure a custom agent for narrower masks.

The server projects up to 250 matching records, bounded text and approximately 96 KB of record context. Each record includes its eight newest permitted thread updates, capped at 1,000 characters each. Binary attachment contents are excluded. Reports cap findings and actions at 100 each and rules previews at 50; partial context/output is disclosed. Sources are snapshots at review time, and their links can open the current record. Keyword blocker signals are possibilities, not verified semantic conclusions. No historical changes are invented when no comparison exists. Native **Nabz records** are a separate collection and are not analyzed by this assistant.

## LM Studio / Qwen

Rules mode works without an LLM. To enable real generation later:

1. Load a Qwen model supporting structured output in LM Studio and enable its local OpenAI-compatible server.
2. Set these backend variables in the compose project's `.env` or shell (Next's `.env.local` does not configure Docker):

```dotenv
NABZ_AGENT_LM_STUDIO_ENABLED=true
NABZ_AGENT_LM_STUDIO_BASE_URL=http://host.docker.internal:1234/v1
NABZ_AGENT_LM_STUDIO_API_KEY=
```

3. Recreate the API: `docker compose -f compose.backend.yaml up -d --build api`.
4. Edit an agent, choose **LM Studio · Qwen**, enter the exact loaded model identifier, and run it manually.

The model adapter is server-only. It accepts configured local HTTP hosts, rejects redirects, uses an 85-second deadline, requests a strict JSON schema and validates citations/action permissions independently. Board text is treated as untrusted data. Failed local inference stays a failed run; there is no silent fallback. Actual Qwen quality/compatibility must be checked with your loaded model. Adapter tests use a synthetic local HTTP server; no real model was supplied for this implementation.

See the primary [LM Studio structured-output documentation](https://lmstudio.ai/docs/developer/openai-compat/structured-output). The older `/api/local-ai` CRM adapter uses different `LM_STUDIO_*` variables; these board-agent settings are `NABZ_AGENT_LM_STUDIO_*`.

## External connections

Gmail, Slack, Outlook and Microsoft Teams are an honest readiness catalog with selectable agent tool metadata. All are **Not configured / Offline**. OAuth, token storage, provider reads, delivery adapters and custom MCP execution are not implemented. Selecting a tool does not establish a connection or enable delivery. No external account is read or messaged by this feature.

## Verification and deployment

Deploy both checkouts together. Frontend code lives in `components/agents`, `lib/agents` and the CRM board. Backend additions are `internal/{domain,application,ports}/board_agent*.go`, `internal/adapters/{httpapi,store}/board_agent*.go`, registration in `httpapi/server.go`, dependency validation and the existing Forma persistence infrastructure. No user/password reset or existing database-volume replacement is required.

Checks: `npm test`, `npm run lint`, `npm run build`; backend `go test ./...`. Set `FORMA_TEST_DATABASE_URL` to enable isolated PostgreSQL HTTP tests. They create their own tenants and clean them by default. Tests cover policy projection, source attribution, newest updates, large boards, archive retention, model schema/permission rejection, atomic/idempotent approvals, stale/revoked previews, cross-company rejection and board-change review.

`tests/agents-browser.cjs` exercises the actual UI using Playwright/Chrome. Generate an isolated fixture with backend `TestBoardAgentPostgresWorkflow` and `FORMA_AGENT_BROWSER_FIXTURE` pointing outside either repo, then set `FORMA_AGENT_FIXTURE` to that exported file and run `node tests/agents-browser.cjs`. Set `PLAYWRIGHT_MODULE` if Playwright is installed elsewhere; `FORMA_URL` defaults to localhost:3000. This fixture mode deliberately retains synthetic tenants for browser testing; remove only those fixture tenants/documents/users/sessions afterward and delete the secret fixture file. Never use production accounts for the smoke test.
