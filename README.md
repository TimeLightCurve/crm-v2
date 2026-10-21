# Forma CRM · Nabz backend

A bilingual English/Persian sales workspace, styled with inline Tailwind and animated with motion/react. Includes CRM records, the call workspace, a draggable team schedule, and existing Nabz deals/tasks.

## Run locally

The existing Nabz UI database must be running (`nabz-ui-postgres-1` on `nabz-ui_default`). Then:

```powershell
docker compose -f compose.backend.yaml up -d --build
npm install
npm run dev
```

Open http://localhost:3000 and sign in with your existing Nabz account. No password is reset or created automatically. The new API listens on http://127.0.0.1:8081; the original API remains on :8080. The compose file builds the sibling backend at `../../nabz-crm/nabz-crm`; override `NABZ_BACKEND_PATH`, `NABZ_POSTGRES_URL` and `NABZ_DOCKER_NETWORK` for another checkout/database.

Copy `.env.example` to `.env.local` to override the server API address or configure local AI later. Backend credentials are server-side only. The browser uses the same-origin `/api/backend` proxy and the HttpOnly Nabz session cookie.

## Connected workflows

- CRM people, companies, opportunities, tasks, notes, custom fields, comments/files, immutable activity history, views, notifications and subscriptions are saved in PostgreSQL. No demo records or localStorage data are automatically imported.
- The call workspace saves its contacts, notes, lead statuses, activity and mock recording references. Open a CRM person and choose **Open call workspace**, or add a lead directly. Real VoIP/STT, actual recordings and WhatsApp/SMS delivery remain provider integration points; simulated calls/analysis are explicitly samples.
- The schedule saves meetings/tasks/focus/review activities with real Nabz team accounts, participant conflict validation and 15-minute drag/keyboard movement. Calendar dates use Tehran time. The planning assistant still proposes deterministic sample suggestions.
- **Nabz records** reads and updates existing native deals and department tasks through their original API. Exact integer rial values stay strings; native deal version checks, loss reasons and cartable task restrictions remain in effect. These records are distinct from Forma's customizable, multi-currency CRM records.
- **Team** / CRM **Settings** shows real accounts and creates staff using Nabz's provisioning rules. There is no local role impersonation. CRM writes require `sales:write`; reads require `sales:read`. Owner and sales-manager permissions determine UI roles, with all writes checked again on the server.
- Optimistic saves serialize revision numbers. A conflict, permission failure or network failure restores confirmed state and shows a visible error. Reload gets other users' latest changes. This is shared persistence with conflict detection, not live push collaboration.

## Board agents

Use **Ask Forma** on a CRM board for source-linked reviews and human-approved changes. **CRM → Agents** includes the agent builder, board/field access controls, versioned reusable skills, connection readiness and timestamped history. Rules mode works now; local LM Studio/Qwen is optional. Gmail/Slack/Outlook/Teams are unconfigured catalog entries, not live integrations. See [setup, capabilities and limits](docs/board-agents.md).

## Styling and local AI

Edit component `className` values inline. The palette remains lavender, cream, mint and navy; Persian titles use Nian Bold and body text uses Anjoman. `app/globals.css` contains Tailwind/font setup only. Lead cards and scheduling retain motion/react transitions, reduced-motion support and RTL behavior.

Mock AI is the default. Later, enable `LM_STUDIO_ENABLED=true`, load Qwen in LM Studio, and select its model identifier in Settings. The optional authenticated `/api/local-ai` adapter accepts only a server-configured loopback endpoint. No cloud AI provider is configured.

## Verification and source

```powershell
npm test
npm run lint
npm run build
```

Backend modifications are in the sibling Nabz repository: `internal/ports/forma.go`, `internal/adapters/store/forma.go` and `internal/adapters/httpapi/forma*.go`, plus route/schema registration. Deploy these together with this frontend. They add `forma_document` and `forma_revision` tables; existing database volumes, users, passwords and accounting connectors are preserved.

See [backend integration details](docs/nabz-backend-integration.md) and [the Relaticle source audit](docs/relaticle/FEATURE-MAP.md). Relaticle's PHP packages informed the React workflows; they are not installed as a Laravel runtime. Email/calendar OAuth sync, queued mail, MCP/OAuth agent endpoints, encryption adapters, billing and full Relaticle server parity are not implemented.
