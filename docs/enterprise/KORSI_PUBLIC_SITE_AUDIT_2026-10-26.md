# Korsi public site audit and Nabz Enterprise build plan

Date: 2026-10-26. Scope: every Persian page in the [Korsi sitemap](https://korsi.ai/sitemap.xml) at this date, plus the clickable fictional product showcase on [the product page](https://korsi.ai/fa/product). Public pages can establish a displayed flow or a vendor claim. They cannot establish that an authenticated operation, model, export, billing rule, isolation control, or integration works. A subscribed live Korsi tenant has not been exercised. This inventory is therefore a complete audit of the public site, not a claim of complete internal Korsi feature parity.

## Page-by-page coverage

| Page | What it adds to the feature map | Nabz consequence |
| --- | --- | --- |
| [Home](https://korsi.ai/fa) | Linked meetings, documents, decisions and actions; fictional manager desk; ownership, urgency, calendar, cases and memory; board buyer positioning | Executive cockpit must draw counts from actual authorized records and deep link to causes, not static cards |
| [For boards](https://korsi.ai/fa/boards) | Four target forms: wholesale/trade, multi-company groups, private investment, large projects; seven-stage decision, three compared options, typed supporting/contradicting/context evidence, unresolved supplier capacity and final committee authority | Decision record needs criterion-by-option comparison, evidence type and provenance, conflict resolution, authority, approval, execution and outcome review |
| [Product](https://korsi.ai/fa/product) | Six linked surfaces: desk, cases, decisions, meetings, actions and memory; source→case→decision→action→memory path; contextual assistant; recording pipeline; status and notifications | One consistent entity graph, event timeline and permission-filtered retrieval, with explicit workflow status |
| [Approach](https://korsi.ai/fa/approach) | Discovery 4–8 weeks, deployment of one workflow, measured improvement; setup checklist for organization, identities, structure, people/roles, past decisions and retained knowledge | Productized onboarding and backoffice review, with owner signoff and lifecycle metrics |
| [Methodology](https://korsi.ai/fa/approach/methodology) | Six repeated discovery activities and seven knowledge layers: direction/value, vocabulary, authority, workflows, decision logic, authoritative sources, lived knowledge; conflicting accounts and open questions | Intake interviews, source review, contradiction queue, reviewer attribution and deployable organization model |
| [Organization wiki](https://korsi.ai/fa/approach/organizational-wiki) | Versioned reviewed chapters, source map, key topics, open questions, reviewer and change history | Tenant-scoped wiki with review states, citations, diff/history and scheduled recertification |
| [AI-ready](https://korsi.ai/fa/ai-ready) | Agent source, meaning, authority and output-quality boundaries; meeting/case/decision companions; external agent connection presented as future work | Agent contract and read/write scopes, human approval, evaluation and escalation; do not advertise external agents as live |
| [Digital twin](https://korsi.ai/fa/ai-ready/digital-twin) | Four conceptual steps: documented wiki, structured entities/relations, authoritative live feeds, validated scenario model. Site explicitly says wiki alone is not a digital twin | Build source-linked graph before a live-state view; label WebGL as visualization until validated feeds and scenario models exist |
| [Industries](https://korsi.ai/fa/industries) | Retail/e-commerce and manufacturing situations, linked inventory, delivery, production, quality and precedent | Industry templates and terms without duplicating core entities; integrate native APIs only for real authoritative values |
| [Retail](https://korsi.ai/fa/industries/retail) | Multi-team distribution-center case, owner/counterparty/dates/outcome, 6-source summary, 4/7 actions, missing quality result and suggested next step | Case workspace needs structured outcome, evidence freshness, related work, blockers and review dates |
| [Manufacturing](https://korsi.ai/fa/industries/manufacturing) | Improvement project and maintenance memory; past event retrieval | Reusable incident and risk templates, similarity retrieval with verified source and company-specific terminology |
| [Customers](https://korsi.ai/fa/customers) | Names three organizations as in-contact; explicitly postpones detailed attributed results until approved | Nabz may show only measured, permitted customer proof; no invented performance claims |
| [Insights](https://korsi.ai/fa/insights) | Content taxonomy around memory, decision and AI readiness | Teach product method alongside workflow, not substitute blog text for implemented capability |
| [Playbooks](https://korsi.ai/fa/playbooks) | Two editable CSV artifacts: decision context and human-agent brief | Offer native, versioned templates with CSV/Docx/PDF export and real record creation |
| [Journal](https://korsi.ai/fa/journal) | Board/technology publication program; issue 1 is a draft | Content/brand channel, separate from product parity |
| [Journal issue](https://korsi.ai/fa/journal/board-and-technology) | 140-page issue 1 labeled preliminary, not final | No product capability implied |
| [Talk](https://korsi.ai/fa/talk) | Three-step contact flow, required name/company/role/mobile, optional work email, optional organization size/ownership/board access | Enterprise intake can be shorter, but store contact and authority state separately from verified identity/KYB |
| [Trust](https://korsi.ai/fa/trust) | Source trace, role/agent access, human formal approval, hosting/retention/backup/on-prem negotiated per customer; no certification claim | Enforce tenant and record ACL at APIs, evidence lineage, approval audit, backup/retention contract |
| [About](https://korsi.ai/fa/about) | Positioning around organization discovery, product adoption and continuous improvement | Service packaging and onboarding success criteria |
| [Privacy](https://korsi.ai/fa/privacy) | Claimed content categories, subscription data, technical logs; Google Calendar optional **one-way** copy to a Korsi-created calendar; encrypted OAuth token claim | Nabz calendar connector must use narrow scopes, store encrypted tokens and prove directionality before launch |
| [Terms](https://korsi.ai/fa/terms) | AI output may err, human approval before record changes; account, payment, content, consent and termination terms | Product must preserve approval and its own legal terms; Korsi text is not Nabz legal copy |
| [Wiki insight](https://korsi.ai/fa/insights/organizational-wiki) | Wiki answers contextual questions beyond a file inventory | Retrieval should return reason, options, owner and source, with unknowns visible |
| [Agent-context insight](https://korsi.ai/fa/insights/context-before-agents) | Agent needs precise goal, authoritative source, role boundary and escalation | Command mode uses allowlisted operations and uncertainty gates |
| [Decision-context insight](https://korsi.ai/fa/insights/decision-context) | Preserve problem, alternative, rationale, assumptions, owner, review trigger and superseding decision history | Decision schema and change chain, not free-form summary only |
| [Wiki-to-twin insight](https://korsi.ai/fa/insights/wiki-to-digital-twin) | Distinguishes prose, typed graph and current state | WebGL graph should show typed edges, freshness and source status |
| [Decision template](https://korsi.ai/fa/playbooks/decision-record) | Eight fields: problem, desired result, options, choice/rationale, assumptions, sources, approver/executor, review | First-party decision template and export |
| [Agent brief template](https://korsi.ai/fa/playbooks/agent-brief) | Eight fields: goal, scope, sources, freshness, human owner, authority, escalation, quality | First-party agent policy template and execution gate |

The sitemap contains 27 URLs, each represented once above. `سند ریسک` was **not** found as a named feature in these public pages. It remains a direct Nabz product requirement, not a verified Korsi feature. The same applies to any feature visible only after authenticated Korsi access, which is not yet available.

## Clickable public dashboard, screen by screen

| Surface | Observed controls and states | Required implementation |
| --- | --- | --- |
| Desk | Personal/organization toggle, create, four attention KPIs, date strip, calendar, attention feed, owned cases, next actions | Permission-aware projections, exact status/due calculations, filter and navigation from each metric |
| Case | Owner, counterparty, target/review dates, expected outcome, six-source summary, action progress, recommended next step, tabs for meetings/docs/proposals/decisions/history | Typed case, source links, child records, timeline, review and workflow health |
| Decision | Seven stages, owner, committee, decision date, visibility, assistant, options table, supporting/contradicting/context evidence, missing facts, manual final decision | Stage rules, versioned criteria and options, evidence provenance/conflicts, authority, approval, execution result and review |
| Meeting | Recording, participant/speaker views, visibility, transcription/diarization stages, summary/topics/mind map/group dynamics/commitments/timeline/risks, suggested decisions/tasks awaiting review | Nava/ASR pipeline with independent quality gates, reviewed transcript, grounded template engine, explicit acceptance and export |
| Actions | Personal/organization, open/overdue/due/blocked/unassigned, flow states, workload heatmap | Action state machine, due/reassignment audit, blocker and dependency records, charts backed by real events |
| Memory | People, organizations, projects and topics linked to facts, sources and recent additions; assistant | Reviewed wiki + typed relationship graph with ACL-filtered retrieval and stale-source warning |
| Assistant | Screen-aware chat and reported operation count | Read tool calls with citations; plan/preview/approve/execute/verify for writes; never confuse text generation with command completion |
| Dock | Documents, calendar, finance and integrations shown disabled in the fictional demo | Track separately; do not count them as functioning competitor workflows |

## Nabz implementation plan and acceptance

### 0. Preserve identity and make the handoff real

Keep `ai.nabzlab.com` as the enterprise front door and the approved Nava story on apex `/`. Intake order: company name, human contact name or username, E.164 phone; then Nabz account choice Google, phone or email/password. The current Nabz login screenshot includes a wallet option unrelated to enterprise, so remove the wallet entry from visible login/signup surfaces and navigation, without altering custody backend gates. Store contact phone as unverified until OTP. Organization request can be pending, activated, rejected or needing information with owner and backoffice reason. Only an activated, provisioned membership can enter the CRM tenant. Return to `crm.nabzlab.com/?view=enterprise` via an authenticated, short-lived SSO exchange, not by copying cookies between domains.

Acceptance: existing personal login still works; Google callback and email/password work end to end; phone verification has a real provider or stays visibly unavailable; no wallet CTA; duplicate intake idempotency; backoffice can review/activate with audit; one company cannot read another; CRM login lands on the requested manager view.

### 1. Authoritative enterprise graph and workflow

Entities: organization/profile, membership/role/authority, source/document and version, wiki finding/chapter, case, meeting/transcript, decision/option/criterion/evidence, risk, action/dependency, review/approval, event, export. Model facts as accepted, pending, contradicted or superseded; preserve source timestamp, reviewer and visibility. Keep material money/date calculations in code. Every derived recommendation cites actual authorized source spans. Connect existing CRM customers/companies through references, not duplicate truth. Where Nabz native data is authoritative, adapter reads are versioned and scoped.

Acceptance: real PostgreSQL persistence, migrations and backups; tenant/record ACL tests; optimistic conflicts; append-only event history; no client-supplied tenant or actor; no unsupported links; no silently rewritten approved decisions. The first `crm-v2` branch already contains a minimal isolated API and manager UI; it does **not** satisfy this whole stage.

### 2. Meeting and document production

Use Nava reviewed transcript as the input, with language, model, audio and diarization provenance. Jev may classify template/intent when a Persian/English benchmark proves quality and cost; a generative local model or provider drafts only from selected citations. Human review confirms names, dates, assignments and decisions. Templates include meeting minutes, executive brief, risk document, decision record, action register, case summary, board pack and the two Korsi-inspired playbooks, plus sector-specific forms. Produce PDF/Docx/CSV/JSON with version, citations and sharing ACL.

Acceptance: transcript→suggested template with evidence/override→grounded fields→draft→preview→approval→export/share. Compare local GPU and provider on the same cases before claiming a cost advantage. No data leaves a tenant's policy boundary unexpectedly.

### 3. Agent command mode

Planner receives authorized context, goal, allowed operations and a budget. It can gather sources, compare options, detect contradictions, draft documents and propose typed actions. Before writes it shows exact before/after and required approver. Executor uses idempotent allowlisted APIs, rechecks permissions and source versions, then verifies durable results. Failure is visible and recoverable. Integrations start with Nabz CRM, Nava recordings, reviewed note exports and company/backoffice profile. Calendar, accounting and external apps are separate adapters, not generic model-generated HTTP.

Acceptance: task completion is backed by a persisted operation result, not a chat claim. Adversarial prompts cannot cross role or tenant boundaries. Rejected/stale actions never mutate records. Agent policy is versioned per organization and evaluated on Persian enterprise cases.

### 4. UX and visualization

Use the existing Forma lavender/cream/mint style in CRM-v2, Persian RTL first. Preserve the accessible list and detail view as the main action surface. Add an interactive WebGL relationship map of source→case→decision→risk→action→outcome with filter, keyboard-accessible equivalent, reduced-motion mode, freshness/contradiction legend and deep links. The manager desk includes attention, calendar, progress, unresolved evidence, workload and outcome review. Keep public landing and real app labels separate so fictional data is never mistaken for customer data. Use concise Persian UI copy without decorative double dashes or terminal dots, as requested.

Acceptance: desktop and 390 px mobile layouts, keyboard navigation, screen-reader labels, empty/loading/error states, no broken controls, automated browser paths for create→review→approve→export and source click-through, and real visual inspection in the target browser.

### 5. Production gate and ownership

The target is the existing local/Cursor server and subdomains, not Vercel. Put CRM-v2 and its database in a separately named deployment with distinct secret, database and volume; map `crm.nabzlab.com` only after proving the built image and rollback. The currently deployed CRM Go API does not expose the `tenant_id` field required by the new executive API, and it does not serve the Forma documents expected by CRM-v2. Add an authenticated tenant contract and the missing backend routes, or deploy a deliberately scoped executive-only route with its own verified SSO before cutover. The production `nabz-crm_platform` service was stopped at the last check because its referenced image was missing. The public `ai.nabzlab.com` A record was absent and `enterprise.nabzlab.com` had an invalid TLS chain. Resolve these, exercise actual signup, backoffice review, CRM login and tenant data, then deploy the reviewed revision. A healthy container, Git commit or Vercel preview is not proof of a working production flow.

Recommended code ownership: keep `TimeLightCurve/crm-v2` as the separate executive UI repository the owner identified, keep Nabz account/onboarding/backoffice/recording APIs in their existing service repositories, and publish versioned contracts plus one deployment manifest. A further UI repository would fragment auth and design before these contracts stabilize.
