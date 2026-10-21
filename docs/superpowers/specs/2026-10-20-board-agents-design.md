# Board agents and controlled skills

User intent: add the supplied monday-style capabilities inside Forma's existing CRM: a board-side chat, configurable agents/skills, live authorized board context, typed reports with sources, proposed changes requiring human approval, and accountable run history. Preserve inline Tailwind, motion/react, EN/FA RTL, actual Nabz identity/PostgreSQL and local Qwen later. Prior instruction explicitly requests autonomous implementation without approval questions; execute this architectural design inline.

## Selected approach

Use an application-level skill library and Go policy engine, with a structured report contract shared by rules-based mock and optional LM Studio/Qwen generation. A prompt-only assistant would not enforce permissions or approval. An external agent framework adds runtime/deployment dependencies without improving the trusted approval boundary. Keep all authorization, source projection, action validation and commits in Nabz.

Boards are an existing CRM workspace + record entity. Custom agents can access multiple explicitly selected boards, with per-board readable fields/custom fields/comments and separately allowed proposal fields. User permissions remain an upper bound. Skills define objective, instructions and visible sections; built-ins are versioned and custom skills are reusable. Core editable fields are status, owner, due date and priority. No model can execute arbitrary code, alter authorization, or send communications.

## Workflows

1. Ask Sidekick from a table/board with the current record subset; the server reads canonical current data, filters to granted fields, and creates a source-linked structured report. Reports show snapshot, progress, risks/blockers and recommended actions. Replies include visible provenance and generation mode.
2. Manage agents under CRM Agents. Configure identity/instructions, skill selection, board scopes, read/proposal permissions, manual or board-change trigger, model mode/name and selected external tool capabilities. Start from templates or blank.
3. Proposed field changes are immutable server-generated before/after previews. Approve or reject explicitly. Recheck current user, agent policy, record version/value and workspace on decision. One transaction commits CRM revision/activity, proposal state and agent audit; duplicate approvals never repeat a write. Stale proposals become conflicts rather than overwriting edits.
4. Persist runs, approvals and timestamped events in PostgreSQL through private agent documents. The public generic Forma endpoint cannot write agent runtime state. Serialize transactional agent/config/CRM revision checks.
5. Add explicit dependencyIds for tasks/opportunities with same-workspace, valid-record and cycle validation. Report unfinished dependencies and thread text matching blocker signals without claiming semantic certainty.

## Providers

Rules-based mock works against real records now. Optional local LM Studio uses server configuration and JSON-schema structured output, then independent validation. Do not silently fall back from failed local inference to mock. Provider credentials stay server-side. Gmail, Slack, Outlook and Teams appear in a capability catalog as unconfigured until real credentials/adapters exist. Never pretend OAuth is connected or send a real message. External draft previews may be generated but live delivery remains unavailable until configured.

## Validation

Pure tests: read masks, board/workspace scope, hidden-field leakage, thread citations, dependencies, deterministic reports, structured output validation, agent configuration, permission revocation and stale/single-use decisions. HTTP/PostgreSQL: tenant isolation, reader restrictions, atomic approvals, generic-endpoint bypass, conflict checks and persisted history. Browser: agent/skill creation, sidekick context, structured output/source links, approvals/rejections, reload, provider statuses, EN/FA mobile. Fresh read-only review at end.

Ruling: retain existing checkouts for the user's later merge; no commit/push/merge or account/password reset. These are application skills, not Codex installation skills. Provider catalog is usable configuration/readiness UI; live external services require credentials not supplied in this request.
