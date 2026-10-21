import type { Localized } from "../crm-data";
export type Entity =
  | "people"
  | "companies"
  | "opportunities"
  | "tasks"
  | "notes";
export type Role = "owner" | "admin" | "member" | "viewer";
export type FieldValue = string | number | boolean | string[];
export type FieldType =
  | "text"
  | "textarea"
  | "rich-editor"
  | "markdown-editor"
  | "number"
  | "currency"
  | "email"
  | "phone"
  | "link"
  | "domain"
  | "select"
  | "multi-select"
  | "radio"
  | "checkbox"
  | "checkbox-list"
  | "toggle"
  | "toggle-buttons"
  | "tags-input"
  | "date"
  | "date-time"
  | "color-picker"
  | "record"
  | "file-upload";
export interface CrmRecord {
  id: string;
  workspaceId: string;
  entity: Entity;
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  companyId: string;
  personId: string;
  relatedIds: string[];
  dependencyIds?: string[];
  ownerId: string;
  stage: string;
  priority: string;
  amount: number;
  currency: string;
  dueDate: string;
  tags: string[];
  position: number;
  custom: Record<string, FieldValue>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
export interface CustomField {
  id: string;
  workspaceId: string;
  entity: Entity;
  label: Localized;
  type: FieldType;
  section: string;
  required: boolean;
  unique: boolean;
  options: string[];
  defaultValue?: FieldValue;
  min?: number;
  max?: number;
  lookup?: Entity;
  condition?: { fieldId: string; equals: string };
}
export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface Workspace {
  id: string;
  name: string;
  members: Member[];
}
export interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
}
export interface Comment {
  id: string;
  workspaceId: string;
  recordId: string;
  parentId: string;
  authorId: string;
  body: string;
  createdAt: string;
  editedAt?: string;
  pinned: boolean;
  reactions: Record<string, string[]>;
  attachments: Attachment[];
}
export interface ActivityEntry {
  id: string;
  workspaceId: string;
  recordId: string;
  actorId: string;
  type:
    | "created"
    | "updated"
    | "deleted"
    | "restored"
    | "comment"
    | "field"
    | "workspace";
  title: string;
  changes: { field: string; before: string; after: string }[];
  createdAt: string;
  batchId: string;
}
export interface SavedView {
  id: string;
  workspaceId: string;
  entity: Entity;
  name: string;
  query: string;
  stage: string;
  owner: string;
  mode: "table" | "cards" | "board";
  sort: string;
  customField?: string;
  customValue?: string;
  columns?: string[];
  trash?: string;
}
export interface CrmNotification {
  id: string;
  workspaceId: string;
  recipientId: string;
  recordId: string;
  text: string;
  read: boolean;
  createdAt: string;
}
export interface CrmState {
  version: 1;
  activeWorkspaceId: string;
  currentMemberId: string;
  workspaces: Workspace[];
  records: CrmRecord[];
  fields: CustomField[];
  comments: Comment[];
  activities: ActivityEntry[];
  views: SavedView[];
  notifications: CrmNotification[];
  subscriptions: Record<string, string[]>;
  ai: { mode: "mock" | "lmstudio"; model: string };
}
