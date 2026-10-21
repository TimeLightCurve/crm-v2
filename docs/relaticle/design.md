# Relaticle-inspired CRM expansion

Goal: bring the customer-facing workflows from the five linked repositories into Forma's existing Next.js UI. Keep inline Tailwind, lavender/cream/mint/navy, Motion, Nian/Anjoman, EN/FA RTL, call workspace and scheduling.

Architecture: typed workspace-scoped records with a persistent browser repository. Every record mutation produces before/after activity. Relations, custom fields, comments, saved views and notifications share this repository. UI permissions are a local preview, not authenticated server authorization. PHP packages are references, not dependencies or copied runtime code.

Deliverables: people/company/opportunity/task/note CRUD; table/card/board views; filters, sorting, saved views, CSV import/export, trash/restore; linked record drawers; type-aware configurable fields and conditional display; board reorder/stage moves and summaries; threaded comments, mentions, reactions, pinning, subscriptions, local attachments; grouped/filterable activity; isolated local workspaces and team roles; mock assistant plus optional LM Studio chat adapter.

Integration boundaries: actual Laravel persistence, authenticated role enforcement, encryption-at-rest, queued mail, calendar/email OAuth, cross-user real-time broadcasts, billing, public REST and MCP servers are server features, not simulated as live services. Track each in the feature matrix with a clear status. LM Studio remains disabled by default; no cloud AI calls.

Source audit: clone and inventory every tracked file; scan first-party textual source/docs/tests; manually review entry points, model relationships, resource forms/actions, package feature guides, validation, board movement, timeline and comments behavior. Do not describe automated scanning as a manual line-by-line audit.
