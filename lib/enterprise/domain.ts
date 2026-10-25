export const kinds = ["decision", "case", "meeting", "action", "knowledge", "risk"] as const;
export type Kind = (typeof kinds)[number];
export const decisionStages = ["framing", "evidence", "options", "evaluation", "ready", "execution", "outcome"] as const;
export const riskStages = ["identified", "assessing", "mitigating", "monitoring", "closed"] as const;
export type EnterpriseRecord = {
  id: string;
  kind: Kind;
  title: string;
  summary: string;
  ownerId: string;
  dueDate: string;
  stage: string;
  sourceIds: string[];
  evidence: string[];
  options: string[];
  gaps: string[];
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "unlikely" | "possible" | "likely";
  impact: string;
  mitigation: string;
  reviewDate: string;
  approvedAt: string;
  approvedBy: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

const fields = ["title", "summary", "ownerId", "dueDate", "stage", "sourceIds", "evidence", "options", "gaps", "severity", "likelihood", "impact", "mitigation", "reviewDate"] as const;
const max: Record<string, number> = { title: 180, summary: 6000, ownerId: 128, dueDate: 10, stage: 32, impact: 3000, mitigation: 3000, reviewDate: 10 };
function nonempty(value: unknown, limit: number) { return typeof value === "string" && value.trim().length > 0 && value.length <= limit; }
function date(value: unknown) { return value === "" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))); }
function list(value: unknown) { return Array.isArray(value) && value.length <= 40 && value.every((part) => nonempty(part, 600)); }
export function validateInput(value: unknown, kind: Kind, previous?: EnterpriseRecord): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid record");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !(fields as readonly string[]).includes(key))) throw Error("Unsupported field");
  const next: Record<string, unknown> = previous ? Object.fromEntries(fields.map((key) => [key, previous[key]])) : {
    title: "", summary: "", ownerId: "", dueDate: "", stage: kind === "decision" ? "framing" : kind === "risk" ? "identified" : "open",
    sourceIds: [], evidence: [], options: [], gaps: [], severity: "medium", likelihood: "possible", impact: "", mitigation: "", reviewDate: "",
  };
  Object.assign(next, input);
  if (!nonempty(next.title, max.title)) throw Error("Title is required (maximum 180 characters)");
  for (const key of ["summary", "ownerId", "impact", "mitigation"] as const) if (typeof next[key] !== "string" || (next[key] as string).length > max[key]) throw Error(`Invalid ${key}`);
  for (const key of ["dueDate", "reviewDate"] as const) if (!date(next[key])) throw Error(`Invalid ${key}`);
  for (const key of ["sourceIds", "evidence", "options", "gaps"] as const) if (!list(next[key])) throw Error(`Invalid ${key}`);
  if (kind === "decision" && !(decisionStages as readonly string[]).includes(String(next.stage))) throw Error("Invalid decision stage");
  if (kind === "risk" && !(riskStages as readonly string[]).includes(String(next.stage))) throw Error("Invalid risk stage");
  if (!["decision", "risk"].includes(kind) && !["open", "active", "done"].includes(String(next.stage))) throw Error("Invalid status");
  if (!["low", "medium", "high", "critical"].includes(String(next.severity))) throw Error("Invalid severity");
  if (!["unlikely", "possible", "likely"].includes(String(next.likelihood))) throw Error("Invalid likelihood");
  if (kind === "risk" && (!nonempty(next.impact, max.impact) || !nonempty(next.mitigation, max.mitigation) || !next.reviewDate)) throw Error("Risk impact, mitigation, and review date are required");
  if (kind === "decision" && ["ready", "execution", "outcome"].includes(String(next.stage))) {
    if (!(next.options as string[]).length) throw Error("A ready decision needs an option");
    if (!(next.evidence as string[]).length && !(next.gaps as string[]).length) throw Error("A ready decision needs evidence or an explicit gap");
  }
  if (previous?.approvedAt) throw Error("Approved decisions require a new superseding record");
  return next;
}
export function canRead(permissions: string[]) { return permissions.includes("sales:read") || permissions.includes("enterprise:read"); }
export function canWrite(permissions: string[]) { return permissions.includes("sales:write") || permissions.includes("enterprise:write"); }
export function canApprove(role: string, permissions: string[]) { return canWrite(permissions) && ["owner", "admin", "sales-manager", "manager"].includes(role); }
