import type {
  ActivityEntry,
  Comment,
  CrmRecord,
  CrmState,
  CustomField,
  FieldValue,
  Role,
} from "./types";
import { stagesFor } from "./seed";
export function currentWorkspace(state: CrmState) {
  const workspace = state.workspaces.find(
    (w) => w.id === state.activeWorkspaceId,
  );
  if (!workspace) throw Error("Workspace not found");
  return workspace;
}
export function currentRole(state: CrmState): Role {
  return (
    currentWorkspace(state).members.find((m) => m.id === state.currentMemberId)
      ?.role ?? "viewer"
  );
}
export function assertWrite(state: CrmState, admin = false) {
  const role = currentRole(state);
  if (role === "viewer" || (admin && !["owner", "admin"].includes(role)))
    throw Error("Your workspace role does not allow this action.");
}
export function workspaceRecords(state: CrmState, includeDeleted = false) {
  return state.records.filter(
    (r) =>
      r.workspaceId === state.activeWorkspaceId &&
      (includeDeleted || !r.deletedAt),
  );
}
export function getRecord(state: CrmState, id: string, deleted = false) {
  const record = workspaceRecords(state, deleted).find((r) => r.id === id);
  if (!record) throw Error("Record not found in this workspace.");
  return record;
}
const show = (value: unknown) =>
  typeof value === "string" ? value : (JSON.stringify(value) ?? "");
export function logActivity(
  state: CrmState,
  recordId: string,
  type: ActivityEntry["type"],
  title: string,
  changes: ActivityEntry["changes"] = [],
): CrmState {
  return {
    ...state,
    activities: [
      {
        id: crypto.randomUUID(),
        workspaceId: state.activeWorkspaceId,
        recordId,
        actorId: state.currentMemberId,
        type,
        title,
        changes,
        createdAt: new Date().toISOString(),
        batchId: crypto.randomUUID(),
      },
      ...state.activities,
    ],
  };
}
export function fieldVisible(
  field: CustomField,
  values: Record<string, FieldValue>,
) {
  return (
    !field.condition ||
    String(values[field.condition.fieldId] ?? "") === field.condition.equals
  );
}
export function validateField(
  field: CustomField,
  value: FieldValue | undefined,
  state: CrmState,
  recordId: string,
) {
  const empty =
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && !value.length);
  if (field.required && empty)
    throw Error(`${field.label.en}: a value is required.`);
  if (empty) return;
  if (["number", "currency"].includes(field.type)) {
    if (typeof value !== "number" || !Number.isFinite(value))
      throw Error(`${field.label.en}: enter a valid number.`);
    if (
      (field.min !== undefined && value < field.min) ||
      (field.max !== undefined && value > field.max)
    )
      throw Error(`${field.label.en}: value is outside the allowed range.`);
  }
  if (["checkbox", "toggle"].includes(field.type) && typeof value !== "boolean")
    throw Error(`${field.label.en}: expected a boolean.`);
  if (
    ["multi-select", "checkbox-list", "tags-input", "record"].includes(
      field.type,
    ) &&
    !Array.isArray(value)
  )
    throw Error(`${field.label.en}: expected a list.`);
  if (
    ["select", "radio", "toggle-buttons"].includes(field.type) &&
    !field.options.includes(String(value))
  )
    throw Error(`${field.label.en}: choose an available option.`);
  if (
    ["multi-select", "checkbox-list"].includes(field.type) &&
    Array.isArray(value) &&
    value.some((v) => !field.options.includes(v))
  )
    throw Error(`${field.label.en}: an option is invalid.`);
  if (
    field.type === "email" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
  )
    throw Error(`${field.label.en}: invalid email.`);
  if (field.type === "link" && !/^https?:\/\//i.test(String(value)))
    throw Error(`${field.label.en}: use an http or https URL.`);
  if (field.type === "color-picker" && !/^#[\da-f]{6}$/i.test(String(value)))
    throw Error(`${field.label.en}: invalid hex color.`);
  if (
    ["date", "date-time"].includes(field.type) &&
    !Number.isFinite(Date.parse(String(value)))
  )
    throw Error(`${field.label.en}: invalid date.`);
  if (field.type === "record" && Array.isArray(value))
    for (const id of value) {
      const existing = state.records.find(
        (record) =>
          record.id === recordId &&
          record.workspaceId === state.activeWorkspaceId,
      )?.custom[field.id];
      const linked = getRecord(
        state,
        id,
        Array.isArray(existing) && existing.includes(id),
      );
      if (field.lookup && linked.entity !== field.lookup)
        throw Error(`${field.label.en}: invalid record type.`);
    }
  if (field.type === "file-upload" && !localFile(value))
    throw Error(`${field.label.en}: invalid file.`);
  if (
    field.unique &&
    workspaceRecords(state, true).some(
      (r) =>
        r.id !== recordId &&
        r.entity === field.entity &&
        show(r.custom[field.id]).toLowerCase() === show(value).toLowerCase(),
    )
  )
    throw Error(`${field.label.en}: this value is already in use.`);
}
export function saveRecord(state: CrmState, input: CrmRecord): CrmState {
  assertWrite(state);
  if (input.workspaceId !== state.activeWorkspaceId)
    throw Error("Cannot write to another workspace.");
  const previous = input.id ? getRecord(state, input.id, true) : undefined;
  if (previous && previous.entity !== input.entity)
    throw Error("Record type cannot be changed.");
  const record = {
    ...input,
    name: input.name.trim(),
    id: input.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  if (!record.name || record.name.length > 200)
    throw Error("Name is required and must be under 200 characters.");
  if (record.description.length > 32000)
    throw Error("Description is too long.");
  if (!Number.isFinite(record.amount) || record.amount < 0)
    throw Error("Amount must be a non-negative number.");
  if (!stagesFor(record.entity).includes(record.stage))
    throw Error("Invalid stage for this record.");
  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))
    throw Error("Enter a valid email address.");
  if (record.website && !/^https?:\/\//i.test(record.website))
    throw Error("Website must use http or https.");
  if (record.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(record.dueDate))
    throw Error("Invalid due date.");
  if (
    record.ownerId &&
    !currentWorkspace(state).members.some((m) => m.id === record.ownerId)
  )
    throw Error("Owner must belong to this workspace.");
  if (record.dueDate) {
    const parsed = new Date(record.dueDate + "T12:00:00Z");
    if (
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== record.dueDate
    )
      throw Error("Invalid due date.");
  }
  for (const [key, entity] of [
    ["companyId", "companies"],
    ["personId", "people"],
  ] as const)
    if (
      record[key] &&
      getRecord(state, record[key], previous?.[key] === record[key]).entity !==
        entity
    )
      throw Error("Invalid linked record type.");
  for (const id of record.relatedIds) {
    if (id === record.id) throw Error("A record cannot link to itself.");
    getRecord(state, id, previous?.relatedIds.includes(id));
  }
  for (const id of record.dependencyIds ?? []) {
    if (id === record.id) throw Error("A record cannot depend on itself.");
    const dependency = getRecord(
      state,
      id,
      previous?.dependencyIds?.includes(id),
    );
    if (!["tasks", "opportunities"].includes(dependency.entity))
      throw Error("A dependency must be a task or opportunity.");
    const seen = new Set<string>();
    const reaches = (candidate: string): boolean => {
      if (candidate === record.id) return true;
      if (seen.has(candidate)) return false;
      seen.add(candidate);
      return (
        state.records.find((r) => r.id === candidate)?.dependencyIds ?? []
      ).some(reaches);
    };
    if (reaches(id)) throw Error("This dependency creates a cycle.");
  }
  for (const field of state.fields.filter(
    (f) =>
      f.workspaceId === state.activeWorkspaceId && f.entity === record.entity,
  ))
    if (fieldVisible(field, record.custom))
      validateField(field, record.custom[field.id], state, record.id);
  if (!previous) {
    record.createdAt = record.updatedAt;
    record.position =
      Math.max(
        -1,
        ...workspaceRecords(state)
          .filter((r) => r.entity === record.entity && r.stage === record.stage)
          .map((r) => r.position),
      ) + 1;
  }
  const changes = Object.keys(record)
    .filter(
      (key) =>
        !["createdAt", "updatedAt", "position", "id", "workspaceId"].includes(
          key,
        ) &&
        show(previous?.[key as keyof CrmRecord]) !==
          show(record[key as keyof CrmRecord]),
    )
    .map((key) => ({
      field: key,
      before: show(previous?.[key as keyof CrmRecord] ?? ""),
      after: show(record[key as keyof CrmRecord]),
    }));
  let next = {
    ...state,
    records: previous
      ? state.records.map((r) => (r.id === record.id ? record : r))
      : [...state.records, record],
  };
  next = logActivity(
    next,
    record.id,
    previous ? "updated" : "created",
    previous ? "Record updated" : "Record created",
    changes,
  );
  if (
    record.ownerId !== state.currentMemberId &&
    record.ownerId !== previous?.ownerId
  )
    next = {
      ...next,
      notifications: [
        {
          id: crypto.randomUUID(),
          workspaceId: state.activeWorkspaceId,
          recipientId: record.ownerId,
          recordId: record.id,
          text: `Assigned to you: ${record.name}`,
          read: false,
          createdAt: record.updatedAt,
        },
        ...next.notifications,
      ],
    };
  return next;
}
export function trashRecord(
  state: CrmState,
  id: string,
  restore = false,
): CrmState {
  assertWrite(state);
  const record = getRecord(state, id, true);
  let next = {
    ...state,
    records: state.records.map((r) =>
      r.id === id
        ? { ...r, deletedAt: restore ? undefined : new Date().toISOString() }
        : r,
    ),
  };
  if (restore) {
    for (const field of state.fields.filter(
      (f) =>
        f.workspaceId === state.activeWorkspaceId &&
        f.entity === record.entity &&
        fieldVisible(f, record.custom),
    ))
      validateField(field, record.custom[field.id], state, id);
  }
  next = logActivity(
    next,
    id,
    restore ? "restored" : "deleted",
    restore ? "Record restored" : "Record moved to trash",
  );
  return next;
}
export function moveRecord(
  state: CrmState,
  id: string,
  stage: string,
  targetId?: string,
): CrmState {
  assertWrite(state);
  const record = getRecord(state, id);
  if (!stagesFor(record.entity).includes(stage)) throw Error("Invalid column.");
  const items = workspaceRecords(state)
    .filter(
      (r) => r.entity === record.entity && r.stage === stage && r.id !== id,
    )
    .sort((a, b) => a.position - b.position);
  let at = targetId ? items.findIndex((r) => r.id === targetId) : items.length;
  if (at < 0) at = items.length;
  items.splice(at, 0, { ...record, stage });
  const ranks = new Map(items.map((item, i) => [item.id, i]));
  let next = {
    ...state,
    records: state.records.map((r) =>
      r.id === id
        ? { ...r, stage, position: at, updatedAt: new Date().toISOString() }
        : ranks.has(r.id)
          ? { ...r, position: ranks.get(r.id)! }
          : r,
    ),
  };
  next = logActivity(next, id, "updated", "Board position updated", [
    { field: "stage", before: record.stage, after: stage },
  ]);
  return next;
}
export function saveField(state: CrmState, input: CustomField): CrmState {
  assertWrite(state, true);
  if (input.workspaceId !== state.activeWorkspaceId)
    throw Error("Invalid workspace.");
  if (!input.label.en.trim() || !input.label.fa.trim())
    throw Error("Add English and Persian labels.");
  if (input.condition?.fieldId === input.id && input.id)
    throw Error("A field cannot depend on itself.");
  if (
    input.condition &&
    !state.fields.some(
      (f) =>
        f.id === input.condition!.fieldId &&
        f.workspaceId === state.activeWorkspaceId &&
        f.entity === input.entity,
    )
  )
    throw Error("Visibility condition must use a field on the same entity.");
  if (
    [
      "select",
      "radio",
      "toggle-buttons",
      "multi-select",
      "checkbox-list",
    ].includes(input.type) &&
    !input.options.length
  )
    throw Error("Choice fields need at least one option.");
  const old = state.fields.find((f) => f.id === input.id);
  if (
    old &&
    (old.workspaceId !== state.activeWorkspaceId ||
      old.entity !== input.entity ||
      old.type !== input.type)
  )
    throw Error(
      "Existing field type cannot change. Create a new field instead.",
    );
  const field = {
    ...input,
    options: [
      ...new Set(input.options.map((option) => option.trim()).filter(Boolean)),
    ],
    id: input.id || crypto.randomUUID(),
  };
  if (
    [
      "select",
      "radio",
      "toggle-buttons",
      "multi-select",
      "checkbox-list",
    ].includes(field.type) &&
    !field.options.length
  )
    throw Error("Choice fields need at least one option.");
  const next = {
    ...state,
    fields: old
      ? state.fields.map((f) => (f.id === field.id ? field : f))
      : [...state.fields, field],
  };
  return logActivity(
    next,
    "",
    "field",
    `Field ${old ? "updated" : "created"}: ${field.label.en}`,
  );
}
export function saveComment(
  state: CrmState,
  input: Pick<Comment, "recordId" | "parentId" | "body" | "attachments">,
): CrmState {
  assertWrite(state);
  getRecord(state, input.recordId);
  if (!input.body.trim() && !input.attachments.length)
    throw Error("Write a comment or add an attachment.");
  if (input.body.length > 8000) throw Error("Comment is too long.");
  if (
    input.attachments.length > 5 ||
    input.attachments.some(
      (file) =>
        file.size > 512000 ||
        !["image/png", "image/jpeg", "application/pdf", "text/plain"].includes(
          file.mime,
        ) ||
        !file.dataUrl.startsWith(`data:${file.mime};base64,`),
    )
  )
    throw Error(
      "Invalid attachment. Use up to 5 supported files under 500 KB each.",
    );
  if (input.parentId) {
    const parent = state.comments.find(
      (c) =>
        c.id === input.parentId &&
        c.workspaceId === state.activeWorkspaceId &&
        c.recordId === input.recordId,
    );
    if (!parent) throw Error("Reply must belong to this record.");
  }
  const comment: Comment = {
    ...input,
    id: crypto.randomUUID(),
    workspaceId: state.activeWorkspaceId,
    authorId: state.currentMemberId,
    createdAt: new Date().toISOString(),
    pinned: false,
    reactions: {},
  };
  const subscribers = new Set([
    ...(state.subscriptions[input.recordId] ?? []),
    state.currentMemberId,
  ]);
  let next = {
    ...state,
    comments: [...state.comments, comment],
    subscriptions: {
      ...state.subscriptions,
      [input.recordId]: [...subscribers],
    },
  };
  const mentioned = currentWorkspace(state).members.filter((m) =>
    input.body.toLowerCase().includes(`@${m.name.split(" ")[0].toLowerCase()}`),
  );
  const recipients = new Set([...mentioned.map((m) => m.id), ...subscribers]);
  recipients.delete(state.currentMemberId);
  next = {
    ...next,
    notifications: [
      ...[...recipients].map((id) => ({
        id: crypto.randomUUID(),
        workspaceId: state.activeWorkspaceId,
        recipientId: id,
        recordId: input.recordId,
        text: `New comment: ${input.body.slice(0, 100)}`,
        read: false,
        createdAt: comment.createdAt,
      })),
      ...next.notifications,
    ],
  };
  return logActivity(next, input.recordId, "comment", "Comment added");
}
export function updateComment(
  state: CrmState,
  id: string,
  action: "delete" | "pin" | "react" | "edit",
  value = "",
): CrmState {
  assertWrite(state);
  const comment = state.comments.find(
    (c) => c.id === id && c.workspaceId === state.activeWorkspaceId,
  );
  if (!comment) throw Error("Comment not found.");
  if (
    ["delete", "edit"].includes(action) &&
    comment.authorId !== state.currentMemberId &&
    !["owner", "admin"].includes(currentRole(state))
  )
    throw Error("Only the author or an admin can edit this comment.");
  if (action === "edit" && !value.trim() && !comment.attachments.length)
    throw Error("Comment cannot be empty.");
  let comments = state.comments;
  if (action === "delete") {
    const ids = new Set([id]);
    for (let n = 0; n < comments.length; n++)
      for (const c of comments) if (ids.has(c.parentId)) ids.add(c.id);
    comments = comments.filter((c) => !ids.has(c.id));
  } else
    comments = comments.map((c) => {
      if (c.id !== id) return c;
      if (action === "pin") return { ...c, pinned: !c.pinned };
      if (action === "edit")
        return { ...c, body: value.trim(), editedAt: new Date().toISOString() };
      const users = c.reactions[value] ?? [];
      return {
        ...c,
        reactions: {
          ...c.reactions,
          [value]: users.includes(state.currentMemberId)
            ? users.filter((u) => u !== state.currentMemberId)
            : [...users, state.currentMemberId],
        },
      };
    });
  return logActivity(
    { ...state, comments },
    comment.recordId,
    "comment",
    `Comment ${action}`,
  );
}
export function csvEscape(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
export function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  source = source.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(value);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      value = "";
    } else value += c;
  }
  if (quoted) throw Error("CSV has an unclosed quoted value.");
  row.push(value);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

export function purgeRecord(state: CrmState, id: string): CrmState {
  if (currentRole(state) !== "owner")
    throw Error(
      "Only the local workspace owner can permanently delete records.",
    );
  const record = getRecord(state, id, true);
  if (!record.deletedAt) throw Error("Move the record to trash first.");
  const subscriptions = { ...state.subscriptions };
  delete subscriptions[id];
  const next = {
    ...state,
    subscriptions,
    records: state.records
      .filter((r) => r.id !== id)
      .map((r) =>
        r.workspaceId !== state.activeWorkspaceId
          ? r
          : {
              ...r,
              companyId: r.companyId === id ? "" : r.companyId,
              personId: r.personId === id ? "" : r.personId,
              relatedIds: r.relatedIds.filter((link) => link !== id),
              dependencyIds: (r.dependencyIds ?? []).filter(
                (link) => link !== id,
              ),
              custom: Object.fromEntries(
                Object.entries(r.custom).map(([key, value]) => [
                  key,
                  Array.isArray(value) &&
                  state.fields.some((f) => f.id === key && f.type === "record")
                    ? value.filter((link) => link !== id)
                    : value,
                ]),
              ),
            },
      ),
    comments: state.comments.filter((c) => c.recordId !== id),
    notifications: state.notifications.filter((n) => n.recordId !== id),
  };
  return logActivity(
    next,
    "",
    "deleted",
    "Permanently deleted: " + record.name,
  );
}
export function workspaceBackup(state: CrmState) {
  const records = workspaceRecords(state, true);
  const ids = new Set(records.map((r) => r.id));
  return {
    ...state,
    workspaces: [currentWorkspace(state)],
    records,
    fields: state.fields.filter(
      (f) => f.workspaceId === state.activeWorkspaceId,
    ),
    comments: state.comments.filter(
      (c) => c.workspaceId === state.activeWorkspaceId,
    ),
    activities: state.activities.filter(
      (a) => a.workspaceId === state.activeWorkspaceId,
    ),
    views: state.views.filter((v) => v.workspaceId === state.activeWorkspaceId),
    notifications: state.notifications.filter(
      (n) => n.workspaceId === state.activeWorkspaceId,
    ),
    subscriptions: Object.fromEntries(
      Object.entries(state.subscriptions).filter(([id]) => ids.has(id)),
    ),
  };
}
export function deleteField(state: CrmState, id: string): CrmState {
  assertWrite(state, true);
  const field = state.fields.find(
    (f) => f.id === id && f.workspaceId === state.activeWorkspaceId,
  );
  if (!field) throw Error("Field not found.");
  return logActivity(
    {
      ...state,
      fields: state.fields
        .filter((f) => f.id !== id)
        .map((f) =>
          f.workspaceId === state.activeWorkspaceId &&
          f.condition?.fieldId === id
            ? { ...f, condition: undefined }
            : f,
        ),
      records: state.records.map((r) => {
        if (r.workspaceId !== state.activeWorkspaceId) return r;
        const custom = { ...r.custom };
        delete custom[id];
        return { ...r, custom };
      }),
    },
    "",
    "field",
    `Field deleted: ${field.label.en}`,
  );
}
export function removeMember(state: CrmState, id: string): CrmState {
  assertWrite(state, true);
  const workspace = currentWorkspace(state);
  const member = workspace.members.find((m) => m.id === id);
  if (!member || id === state.currentMemberId || member.role === "owner")
    throw Error("This member cannot be removed.");
  const recordIds = new Set(workspaceRecords(state, true).map((r) => r.id));
  return logActivity(
    {
      ...state,
      workspaces: state.workspaces.map((w) =>
        w.id === state.activeWorkspaceId
          ? { ...w, members: w.members.filter((m) => m.id !== id) }
          : w,
      ),
      records: state.records.map((r) =>
        r.workspaceId === state.activeWorkspaceId && r.ownerId === id
          ? { ...r, ownerId: state.currentMemberId }
          : r,
      ),
      notifications: state.notifications.filter(
        (n) =>
          n.workspaceId !== state.activeWorkspaceId || n.recipientId !== id,
      ),
      subscriptions: Object.fromEntries(
        Object.entries(state.subscriptions).map(([key, ids]) => [
          key,
          recordIds.has(key) ? ids.filter((member) => member !== id) : ids,
        ]),
      ),
    },
    "",
    "workspace",
    `Member removed and records reassigned: ${member.name}`,
  );
}
export function localFile(
  value: FieldValue | undefined,
): { name: string; url: string } | null {
  if (typeof value !== "string" || value.length > 400000) return null;
  try {
    const file = JSON.parse(value);
    return typeof file.name === "string" &&
      typeof file.url === "string" &&
      /^data:(image\/(png|jpeg)|application\/pdf|text\/plain);base64,[a-z0-9+/=\r\n]+$/i.test(
        file.url,
      )
      ? file
      : null;
  } catch {
    return null;
  }
}
