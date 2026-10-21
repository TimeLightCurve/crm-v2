import { leads, text } from "../crm-data";
import type { CrmRecord, CrmState, Entity, FieldType } from "./types";
export const entityLabels = {
  people: text("People", "افراد"),
  companies: text("Companies", "شرکت‌ها"),
  opportunities: text("Opportunities", "فرصت‌ها"),
  tasks: text("Tasks", "کارها"),
  notes: text("Notes", "یادداشت‌ها"),
};
export const stageLabels: Record<string, { en: string; fa: string }> = {
  new: text("New", "جدید"),
  qualified: text("Qualified", "تأییدشده"),
  proposal: text("Proposal", "پیشنهاد"),
  negotiation: text("Negotiation", "مذاکره"),
  won: text("Won", "موفق"),
  lost: text("Lost", "از دست رفته"),
  todo: text("To do", "برای انجام"),
  in_progress: text("In progress", "در حال انجام"),
  done: text("Done", "انجام‌شده"),
  active: text("Active", "فعال"),
  customer: text("Customer", "مشتری"),
  prospect: text("Prospect", "مشتری بالقوه"),
};
export const stagesFor = (entity: Entity) =>
  entity === "opportunities"
    ? ["new", "qualified", "proposal", "negotiation", "won", "lost"]
    : entity === "tasks"
      ? ["todo", "in_progress", "done"]
      : entity === "notes"
        ? ["active"]
        : ["prospect", "active", "customer"];
export const fieldTypes: FieldType[] = [
  "text",
  "textarea",
  "rich-editor",
  "markdown-editor",
  "number",
  "currency",
  "email",
  "phone",
  "link",
  "domain",
  "select",
  "multi-select",
  "radio",
  "checkbox",
  "checkbox-list",
  "toggle",
  "toggle-buttons",
  "tags-input",
  "date",
  "date-time",
  "color-picker",
  "record",
  "file-upload",
];
export function blankRecord(entity: Entity, workspaceId: string): CrmRecord {
  return {
    id: "",
    workspaceId,
    entity,
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    companyId: "",
    personId: "",
    relatedIds: [],
    dependencyIds: [],
    ownerId: "negar",
    stage: stagesFor(entity)[0],
    priority: "normal",
    amount: 0,
    currency: "USD",
    dueDate: "",
    tags: [],
    position: 0,
    custom: {},
    createdAt: "",
    updatedAt: "",
  };
}
export function createInitialCrm(): CrmState {
  const workspaceId = "forma-sales",
    stamp = "2026-10-19T09:00:00.000Z";
  let n = 0;
  const record = (
    entity: Entity,
    id: string,
    name: string,
    extra: Partial<CrmRecord> = {},
  ): CrmRecord => ({
    ...blankRecord(entity, workspaceId),
    id,
    name,
    position: n++,
    createdAt: stamp,
    updatedAt: stamp,
    ...extra,
  });
  const companies = [
    record("companies", "co-nava", "Nava Studio", {
      website: "https://example.com",
      description: "Design studio · Team learning & development",
      stage: "customer",
      tags: ["Design", "Team training"],
    }),
    record("companies", "co-orbit", "Orbit Tech", {
      description: "Software and product development",
      stage: "prospect",
      tags: ["Technology"],
    }),
    record("companies", "co-bluerock", "BlueRock", {
      description: "Enterprise training and analytics",
      stage: "active",
      tags: ["Enterprise"],
    }),
  ];
  const people = leads.map((lead, i) =>
    record("people", lead.id, lead.name.en, {
      description: lead.role.en,
      email: lead.email,
      phone: lead.phone,
      companyId: i === 1 ? "co-nava" : i === 2 ? "co-orbit" : "",
      stage: i === 0 ? "active" : "prospect",
      tags: [lead.interest.en],
      custom: { "field-source": lead.source.en },
    }),
  );
  const opportunities = [
    record("opportunities", "deal-nava", "Nava team training", {
      companyId: "co-nava",
      personId: people[1].id,
      stage: "proposal",
      amount: 4800,
      dueDate: "2026-11-05",
      ownerId: "sara",
      priority: "high",
      description: "Training package for a team of four.",
    }),
    record("opportunities", "deal-mohsen", "Data analytics bootcamp", {
      personId: people[0].id,
      stage: "negotiation",
      amount: 2400,
      dueDate: "2026-10-30",
      tags: ["Installments"],
    }),
    record("opportunities", "deal-orbit", "Orbit product academy", {
      companyId: "co-orbit",
      personId: people[2].id,
      stage: "qualified",
      amount: 7600,
      ownerId: "amir",
    }),
    record("opportunities", "deal-blue", "BlueRock enterprise plan", {
      companyId: "co-bluerock",
      stage: "new",
      amount: 12500,
      ownerId: "sara",
    }),
    record("opportunities", "deal-win", "Design foundations", {
      companyId: "co-nava",
      stage: "won",
      amount: 3200,
    }),
  ];
  const tasks = [
    record("tasks", "task-proposal", "Send the team proposal", {
      relatedIds: ["co-nava", "deal-nava"],
      ownerId: "sara",
      stage: "todo",
      priority: "high",
      dueDate: "2026-10-22",
    }),
    record("tasks", "task-followup", "Follow up with Mohsen", {
      relatedIds: [people[0].id, "deal-mohsen"],
      stage: "in_progress",
      dueDate: "2026-10-21",
    }),
    record("tasks", "task-discovery", "Prepare discovery questions", {
      relatedIds: [people[2].id],
      ownerId: "amir",
      stage: "done",
      dueDate: "2026-10-20",
    }),
  ];
  const notes = [
    record("notes", "note-team", "Nava · Discovery notes", {
      description:
        "## Team goals\nThe team wants hands-on projects and a flexible class schedule.\n\n- Send the curriculum\n- Confirm the number of participants\n- Follow up with a team package",
      relatedIds: ["co-nava", people[1].id, "deal-nava"],
    }),
  ];
  return {
    version: 1,
    activeWorkspaceId: workspaceId,
    currentMemberId: "negar",
    workspaces: [
      {
        id: workspaceId,
        name: "Forma · Sales",
        members: [
          {
            id: "negar",
            name: "Negar Rezaei",
            email: "negar@example.com",
            role: "owner",
          },
          {
            id: "sara",
            name: "Sara Ahmadi",
            email: "sara@example.com",
            role: "admin",
          },
          {
            id: "amir",
            name: "Amir Hosseini",
            email: "amir@example.com",
            role: "member",
          },
          {
            id: "viewer",
            name: "Niloofar Karimi",
            email: "niloofar@example.com",
            role: "viewer",
          },
        ],
      },
    ],
    records: [...companies, ...people, ...opportunities, ...tasks, ...notes],
    fields: [
      {
        id: "field-source",
        workspaceId,
        entity: "people",
        label: text("Lead source", "منبع لید"),
        type: "select",
        section: "Acquisition",
        required: false,
        unique: false,
        options: [...new Set(leads.map((lead) => lead.source.en))],
      },
    ],
    comments: [
      {
        id: "comment-seed",
        workspaceId,
        recordId: "deal-nava",
        parentId: "",
        authorId: "sara",
        body: "@Negar The team is ready for a proposal. Can we include a flexible payment plan?",
        createdAt: stamp,
        pinned: true,
        reactions: { "👍": ["negar"] },
        attachments: [],
      },
    ],
    activities: [
      {
        id: "activity-seed",
        workspaceId,
        recordId: "deal-nava",
        actorId: "sara",
        type: "created",
        title: "Record created",
        changes: [],
        createdAt: stamp,
        batchId: "seed",
      },
    ],
    views: [],
    notifications: [],
    subscriptions: {},
    ai: { mode: "mock", model: "qwen" },
  };
}
