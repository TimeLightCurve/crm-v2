import type { CrmRecord, Entity } from "../records/types";
export type ReadField =
  | "stage"
  | "ownerId"
  | "dueDate"
  | "priority"
  | "description"
  | "dependencyIds"
  | "amount"
  | "currency"
  | "tags"
  | "email"
  | "phone"
  | "website";
export type WriteField = "stage" | "ownerId" | "dueDate" | "priority";
export interface AgentScope {
  workspaceId: string;
  entity: Entity;
  readFields: ReadField[];
  customFields: string[];
  comments: boolean;
  writeFields: WriteField[];
}
export interface BoardAgent {
  id: string;
  name: string;
  objective: string;
  instructions: string;
  workspaceId: string;
  scopes: AgentScope[];
  skills: string[];
  model: "mock" | "lmstudio";
  modelName: string;
  trigger: "manual" | "board-change";
  enabled: boolean;
  tools: string[];
}
export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  instructions: string;
  sections: string[];
  version: number;
  builtin: boolean;
}
export interface AgentSource {
  id: string;
  workspaceId: string;
  entity: Entity;
  name: string;
  fields: Partial<CrmRecord>;
  custom: Record<string, unknown>;
  comments: { id: string; body: string; createdAt: string; recordId: string }[];
}
export interface AgentFinding {
  kind: string;
  severity: string;
  title: string;
  detail: string;
  sourceIds: string[];
  commentIds: string[];
}
export interface AgentProposal {
  id: string;
  agentId: string;
  recordId: string;
  workspaceId: string;
  entity: Entity;
  recordName: string;
  field: WriteField;
  before: string;
  after: string;
  reason: string;
  expectedUpdatedAt: string;
  state: "pending" | "approved" | "rejected" | "conflict" | "expired";
  decidedBy?: string;
  decidedAt?: string;
}
export interface AgentReport {
  title: string;
  summary: string;
  asOf: string;
  sections: string[];
  snapshot: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    statusVisible: boolean;
  };
  findings: AgentFinding[];
  nextActions: { title: string; detail: string; sourceIds: string[] }[];
  sources: AgentSource[];
}
export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  skillId: string;
  workspaceId: string;
  actorId: string;
  question: string;
  locale: string;
  mode: string;
  createdAt: string;
  crmRevision: number;
  status: string;
  error?: string;
  report: AgentReport;
  proposals: AgentProposal[];
}
export interface AgentEvent {
  id: string;
  agentId: string;
  runId: string;
  actorId: string;
  action: string;
  detail: string;
  createdAt: string;
}
export interface AgentState {
  revision: number;
  config: { agents: BoardAgent[]; skills: AgentSkill[] };
  skills: AgentSkill[];
  runs: AgentRun[];
  events: AgentEvent[];
  providers: {
    id: string;
    name: string;
    status: string;
    capabilities: string[];
    deliveryEnabled: boolean;
    detail: string;
  }[];
  localModelEnabled: boolean;
}
export const readFields: ReadField[] = [
  "stage",
  "ownerId",
  "dueDate",
  "priority",
  "description",
  "dependencyIds",
  "amount",
  "currency",
  "tags",
  "email",
  "phone",
  "website",
];
export const writeFields: WriteField[] = [
  "stage",
  "ownerId",
  "dueDate",
  "priority",
];
export const fieldLabels: Record<ReadField, { en: string; fa: string }> = {
  stage: { en: "Status", fa: "وضعیت" },
  ownerId: { en: "Owner", fa: "مسئول" },
  dueDate: { en: "Due date", fa: "موعد" },
  priority: { en: "Priority", fa: "اولویت" },
  description: { en: "Description", fa: "توضیحات" },
  dependencyIds: { en: "Dependencies", fa: "پیش‌نیازها" },
  amount: { en: "Value", fa: "ارزش" },
  currency: { en: "Currency", fa: "واحد پول" },
  tags: { en: "Tags", fa: "برچسب‌ها" },
  email: { en: "Email", fa: "ایمیل" },
  phone: { en: "Phone", fa: "تلفن" },
  website: { en: "Website", fa: "وب‌سایت" },
};
export function businessDay() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function newBoardAgent(
  workspaceId: string,
  entity: Entity = "tasks",
): BoardAgent {
  return {
    id: "",
    name: "",
    objective: "",
    instructions: "",
    workspaceId,
    scopes: [
      {
        workspaceId,
        entity,
        readFields: [
          "stage",
          "ownerId",
          "dueDate",
          "priority",
          "description",
          "dependencyIds",
        ],
        customFields: [],
        comments: true,
        writeFields: [],
      },
    ],
    skills: ["board-review"],
    model: "mock",
    modelName: "",
    trigger: "manual",
    enabled: true,
    tools: [],
  };
}
