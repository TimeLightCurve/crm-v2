"use client";
import { useState } from "react";
import {
  Check,
  FileText,
  Link2,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import {
  currentRole,
  currentWorkspace,
  fieldVisible,
  saveRecord,
  trashRecord,
  purgeRecord,
  localFile,
  workspaceRecords,
} from "@/lib/records/model";
import { entityLabels, stageLabels, stagesFor } from "@/lib/records/seed";
import { commitCrm } from "@/lib/records/store";
import type { CrmRecord, CrmState, FieldValue } from "@/lib/records/types";
import { CustomFieldsForm } from "./fields";
import ActivityFeed from "./activity-feed";
import Comments from "./comments";
import { buttonClass, FormattedText, inputClass, Modal } from "./ui";
export function RecordEditor({
  state,
  record,
  locale,
  onClose,
  onSaved,
}: {
  state: CrmState;
  record: CrmRecord;
  locale: Locale;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [draft, setDraft] = useState({
    ...record,
    custom: {
      ...Object.fromEntries(
        state.fields
          .filter(
            (f) =>
              f.workspaceId === state.activeWorkspaceId &&
              f.entity === record.entity &&
              f.defaultValue !== undefined,
          )
          .map((f) => [f.id, f.defaultValue as FieldValue]),
      ),
      ...record.custom,
    },
  });
  const [error, setError] = useState("");
  const [tagsText, setTagsText] = useState(record.tags.join(", "));
  const [preview, setPreview] = useState(false);
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const records = workspaceRecords(state);
  const workspace = currentWorkspace(state);
  function field(
    key: "name" | "description" | "email" | "phone" | "website" | "dueDate",
    label: string,
    type = "text",
  ) {
    return (
      <label
        className={`block text-sm font-medium text-[#7b658b] ${key === "description" ? "sm:col-span-2" : ""}`}
      >
        {label}
        {key === "name" && " *"}
        {key === "description" ? (
          <div className="mt-1">
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                className="rounded bg-[#e7dcef] px-2 py-1 text-xs"
                onClick={() =>
                  setDraft({
                    ...draft,
                    description:
                      draft.description +
                      "\n**" +
                      t("Important note", "نکته مهم") +
                      "**",
                  })
                }
              >
                B
              </button>
              <button
                type="button"
                className="text-xs text-[#9e87ae]"
                onClick={() => setPreview(!preview)}
              >
                {preview
                  ? t("Edit text", "ویرایش متن")
                  : t("Preview formatting", "پیش‌نمایش قالب‌بندی")}
              </button>
            </div>
            {preview ? (
              <FormattedText text={draft.description} />
            ) : (
              <textarea
                aria-label={label}
                rows={4}
                className={inputClass}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            )}
          </div>
        ) : (
          <input
            aria-label={label}
            type={type}
            required={key === "name"}
            maxLength={key === "name" ? 200 : undefined}
            className={inputClass + " mt-1"}
            value={draft[key]}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          />
        )}
      </label>
    );
  }
  return (
    <Modal
      title={
        record.id
          ? t("Edit record", "ویرایش رکورد")
          : t(
              `New ${entityLabels[record.entity].en.toLowerCase()} record`,
              `رکورد جدید ${entityLabels[record.entity].fa}`,
            )
      }
      locale={locale}
      onClose={onClose}
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            let id = draft.id;
            commitCrm((s) => {
              const next = saveRecord(s, draft);
              id =
                next.records.find(
                  (r) => !s.records.some((old) => old.id === r.id),
                )?.id ?? draft.id;
              return next;
            });
            onSaved(id);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", t("Name / title", "نام / عنوان"))}
          <label className="text-sm font-medium text-[#7b658b]">
            {t("Stage / status", "مرحله / وضعیت")}
            <select
              aria-label={t("Record stage", "مرحله رکورد")}
              className={inputClass + " mt-1"}
              value={draft.stage}
              onChange={(e) => setDraft({ ...draft, stage: e.target.value })}
            >
              {stagesFor(draft.entity).map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabels[stage]?.[locale] ?? stage}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[#7b658b]">
            {t("Owner / assignee", "مسئول")}
            <select
              aria-label={t("Record owner", "مسئول رکورد")}
              className={inputClass + " mt-1"}
              value={draft.ownerId}
              onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}
            >
              <option value="">{t("Unassigned", "بدون مسئول")}</option>
              {workspace.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          {draft.entity !== "companies" && draft.entity !== "notes" && (
            <label className="text-sm font-medium text-[#7b658b]">
              {t("Company", "شرکت")}
              <select
                aria-label={t("Linked company", "شرکت مرتبط")}
                className={inputClass + " mt-1"}
                value={draft.companyId}
                onChange={(e) =>
                  setDraft({ ...draft, companyId: e.target.value })
                }
              >
                <option value="">—</option>
                {records
                  .filter((r) => r.entity === "companies")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {["opportunities", "tasks"].includes(draft.entity) && (
            <label className="text-sm font-medium text-[#7b658b]">
              {t("Contact", "مخاطب")}
              <select
                aria-label={t("Linked contact", "مخاطب مرتبط")}
                className={inputClass + " mt-1"}
                value={draft.personId}
                onChange={(e) =>
                  setDraft({ ...draft, personId: e.target.value })
                }
              >
                <option value="">—</option>
                {records
                  .filter((r) => r.entity === "people")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {["people", "companies"].includes(draft.entity) && (
            <>
              {field("email", t("Email", "ایمیل"), "email")}
              {field("phone", t("Phone", "تلفن"))}
              {field("website", t("Website", "وب‌سایت"), "url")}
            </>
          )}
          {draft.entity === "opportunities" && (
            <>
              <label className="text-sm font-medium text-[#7b658b]">
                {t("Value", "ارزش")}
                <input
                  aria-label={t("Opportunity value", "ارزش فرصت")}
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass + " mt-1"}
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-sm font-medium text-[#7b658b]">
                {t("Currency", "واحد پول")}
                <select
                  className={inputClass + " mt-1"}
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({ ...draft, currency: e.target.value })
                  }
                >
                  {["USD", "EUR", "IRR", "IRT"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {["opportunities", "tasks"].includes(draft.entity) && (
            <>
              {field("dueDate", t("Due date", "تاریخ سررسید"), "date")}
              <label className="text-sm font-medium text-[#7b658b]">
                {t("Priority", "اولویت")}
                <select
                  aria-label={t("Record priority", "اولویت رکورد")}
                  className={inputClass + " mt-1"}
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft({ ...draft, priority: e.target.value })
                  }
                >
                  {[
                    ["low", t("Low", "کم")],
                    ["normal", t("Normal", "عادی")],
                    ["high", t("High", "بالا")],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {field("description", t("Description / notes", "توضیحات / یادداشت"))}
          <label className="text-sm font-medium text-[#7b658b]">
            {t("Tags (comma separated)", "برچسب‌ها (با ویرگول جدا کنید)")}
            <input
              aria-label={t("Record tags", "برچسب‌های رکورد")}
              className={inputClass + " mt-1"}
              value={tagsText}
              onChange={(e) => {
                setTagsText(e.target.value);
                setDraft({
                  ...draft,
                  tags: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                });
              }}
            />
          </label>
          {["tasks", "opportunities"].includes(draft.entity) && (
            <label className="text-sm font-medium text-[#7b658b]">
              {t("Depends on", "پیش‌نیازها")}
              <select
                multiple
                aria-label={t("Record dependencies", "پیش‌نیازهای رکورد")}
                className={inputClass + " mt-1 min-h-24"}
                value={draft.dependencyIds ?? []}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    dependencyIds: [...e.target.selectedOptions].map(
                      (o) => o.value,
                    ),
                  })
                }
              >
                {records
                  .filter(
                    (r) =>
                      r.id !== draft.id &&
                      ["tasks", "opportunities"].includes(r.entity),
                  )
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
              <span className="mt-1 block text-xs">
                {t(
                  "Explicit prerequisites, separate from general related records.",
                  "پیش‌نیازهای واقعی را جدا از ارتباط عمومی رکوردها انتخاب کنید.",
                )}
              </span>
            </label>
          )}
          {["notes", "tasks"].includes(draft.entity) && (
            <label className="text-sm font-medium text-[#7b658b]">
              {t("Linked records", "رکوردهای مرتبط")}
              <select
                multiple
                aria-label={t("Linked records", "رکوردهای مرتبط")}
                className={inputClass + " mt-1 min-h-24"}
                value={draft.relatedIds}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    relatedIds: [...e.target.selectedOptions].map(
                      (o) => o.value,
                    ),
                  })
                }
              >
                {records
                  .filter((r) => r.id !== draft.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {entityLabels[r.entity][locale]} · {r.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>
        <div className="border-t border-[#dfd6e7] pt-4">
          <CustomFieldsForm
            state={state}
            entity={draft.entity}
            values={draft.custom}
            onChange={(custom) => setDraft({ ...draft, custom })}
            locale={locale}
          />
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#f7ebcc] p-3 text-sm text-[#93723c]"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonClass} onClick={onClose}>
            {t("Cancel", "انصراف")}
          </button>
          <button className={buttonClass + " bg-[#a992c3]! text-white!"}>
            <Check size={15} />
            {t("Save record", "ذخیره رکورد")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function RecordDrawer({
  state,
  record,
  locale,
  onClose,
  onOpen,
  onCall,
  notify,
}: {
  state: CrmState;
  record: CrmRecord;
  locale: Locale;
  onClose: () => void;
  onOpen: (id: string) => void;
  onCall: (record: CrmRecord) => void;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState("overview"),
    [editing, setEditing] = useState(false);
  const [purging, setPurging] = useState(false);
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const writable = currentRole(state) !== "viewer";
  const related = workspaceRecords(state).filter(
    (r) =>
      r.id !== record.id &&
      ([record.companyId, record.personId, ...record.relatedIds].includes(
        r.id,
      ) ||
        [r.companyId, r.personId, ...r.relatedIds].includes(record.id)),
  );
  const fields = state.fields.filter(
    (f) =>
      f.workspaceId === state.activeWorkspaceId &&
      f.entity === record.entity &&
      fieldVisible(f, record.custom),
  );
  const showValue = (value: FieldValue | undefined) =>
    Array.isArray(value)
      ? value
          .map(
            (id) =>
              state.records.find(
                (r) => r.id === id && r.workspaceId === state.activeWorkspaceId,
              )?.name ?? id,
          )
          .join(", ")
      : typeof value === "boolean"
        ? value
          ? t("Yes", "بله")
          : t("No", "خیر")
        : String(value ?? "—");
  return (
    <>
      <Modal
        title={entityLabels[record.entity][locale]}
        locale={locale}
        onClose={onClose}
        side
      >
        <header className="mb-5 rounded-2xl bg-[#d7cbe8] p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="max-w-full break-words text-2xl font-bold text-[#544265]">
              {record.name}
            </h2>
            <span className="rounded-full bg-white/65 px-2 py-1 text-xs text-[#8a6d9d]">
              {stageLabels[record.stage]?.[locale] ?? record.stage}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/40 px-2 py-1 text-xs text-[#826692]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={!writable || !!record.deletedAt}
              className={buttonClass}
              onClick={() => setEditing(true)}
            >
              <Pencil size={14} />
              {t("Edit", "ویرایش")}
            </button>
            {record.entity === "people" && !record.deletedAt && (
              <button
                className={buttonClass + " bg-[#313a50]! text-white!"}
                onClick={() => {
                  onClose();
                  onCall(record);
                }}
              >
                <Phone size={14} />
                {t("Open call workspace", "فضای تماس")}
              </button>
            )}
            <button
              disabled={!writable}
              className={buttonClass + " ms-auto"}
              onClick={() => {
                try {
                  commitCrm((s) =>
                    trashRecord(s, record.id, !!record.deletedAt),
                  );
                  notify(
                    record.deletedAt
                      ? t("Record restored", "رکورد بازیابی شد")
                      : t("Moved to trash", "به زباله‌دان منتقل شد"),
                  );
                  onClose();
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              {record.deletedAt ? (
                <RotateCcw size={14} />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </header>
        {record.deletedAt && currentRole(state) === "owner" && (
          <button
            className={buttonClass + " mb-4"}
            onClick={() => setPurging(true)}
          >
            <Trash2 size={13} />
            {t("Delete permanently", "حذف دائمی")}
          </button>
        )}
        <nav className="mb-5 flex gap-1 rounded-xl bg-[#e8e0ef] p-1">
          {[
            ["overview", t("Overview", "اطلاعات")],
            ["comments", t("Comments", "نظرات")],
            ["activity", t("Activity", "فعالیت‌ها")],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === value ? "bg-white text-[#836198] shadow-sm" : "text-[#a08aaf]"}`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "overview" ? (
          <div className="space-y-4">
            <section className="rounded-2xl bg-[#f1efdc] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
                <FileText size={16} className="text-[#a79b69]" />
                {t("The details", "اطلاعات رکورد")}
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  [
                    t("Owner", "مسئول"),
                    currentWorkspace(state).members.find(
                      (m) => m.id === record.ownerId,
                    )?.name ?? "—",
                  ],
                  [t("Email", "ایمیل"), record.email],
                  [t("Phone", "تلفن"), record.phone],
                  [t("Website", "وب‌سایت"), record.website],
                  [t("Due date", "سررسید"), record.dueDate],
                  [
                    t("Value", "ارزش"),
                    record.entity === "opportunities"
                      ? `${record.currency} ${record.amount.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}`
                      : "",
                  ],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-[#a49a7d]">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-[#6e654d]">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>
            {record.description && (
              <section className="rounded-2xl bg-white/65 p-4">
                <FormattedText text={record.description} />
              </section>
            )}
            {fields.length > 0 && (
              <section className="rounded-2xl bg-[#e5eee6] p-4">
                <h3 className="mb-3 text-base font-bold text-[#5f8066]">
                  {t("Custom details", "اطلاعات سفارشی")}
                </h3>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.id}>
                      <dt className="text-xs text-[#8ca292]">
                        {field.label[locale]}
                      </dt>
                      <dd className="mt-1 break-words text-sm text-[#5f7c67]">
                        {field.type === "file-upload" &&
                        record.custom[field.id] ? (
                          localFile(record.custom[field.id]) ? (
                            <a
                              href={localFile(record.custom[field.id])!.url}
                              download={
                                localFile(record.custom[field.id])!.name
                              }
                              className="underline"
                            >
                              {localFile(record.custom[field.id])!.name}
                            </a>
                          ) : (
                            t("Invalid file", "فایل نامعتبر")
                          )
                        ) : (
                          showValue(record.custom[field.id])
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            <section className="rounded-2xl border border-[#e3d9eb] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
                <Link2 size={16} className="text-[#ae93bf]" />
                {t("Connected work", "رکوردهای مرتبط")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <button
                    key={r.id}
                    className={buttonClass + " text-xs!"}
                    onClick={() => onOpen(r.id)}
                  >
                    <span className="text-[#b197c2]">
                      {entityLabels[r.entity][locale]}
                    </span>
                    {r.name}
                  </button>
                ))}
                {!related.length && (
                  <p className="text-sm text-[#a998b1]">
                    {t(
                      "Link a company, person, task, or note from the editor.",
                      "شرکت، فرد، کار یا یادداشت مرتبط را از ویرایشگر اضافه کنید.",
                    )}
                  </p>
                )}
              </div>
            </section>
            <div className="flex gap-2">
              {record.email && (
                <a href={`mailto:${record.email}`} className={buttonClass}>
                  <Mail size={14} />
                  {t("Email", "ایمیل")}
                </a>
              )}
              {record.phone && (
                <a href={`tel:${record.phone}`} className={buttonClass}>
                  <Phone size={14} />
                  {t("Phone", "تلفن")}
                </a>
              )}
            </div>
          </div>
        ) : tab === "comments" ? (
          <Comments
            state={state}
            recordId={record.id}
            locale={locale}
            notify={notify}
          />
        ) : (
          <ActivityFeed
            state={state}
            recordId={record.id}
            locale={locale}
            onOpen={onOpen}
          />
        )}
      </Modal>
      {purging && (
        <Modal
          title={t("Permanently delete record?", "حذف دائمی رکورد؟")}
          locale={locale}
          onClose={() => setPurging(false)}
        >
          <p className="mb-4 text-sm text-[#9b849f]">
            {t(
              "This removes the record, its comments, and relationship links from this workspace.",
              "رکورد، نظرات و پیوندهای مرتبط آن از این فضای کاری حذف می‌شود.",
            )}
          </p>
          <button
            className={buttonClass}
            onClick={() => {
              try {
                commitCrm((s) => purgeRecord(s, record.id));
                onClose();
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            {t("Delete permanently", "حذف دائمی")}
          </button>
        </Modal>
      )}
      {editing && (
        <RecordEditor
          state={state}
          record={record}
          locale={locale}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            notify(t("Record saved", "رکورد ذخیره شد"));
          }}
        />
      )}
    </>
  );
}
