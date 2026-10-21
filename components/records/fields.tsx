"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { text, type Locale } from "@/lib/crm-data";
import {
  currentRole,
  fieldVisible,
  deleteField,
  localFile,
  saveField,
  workspaceRecords,
} from "@/lib/records/model";
import { entityLabels, fieldTypes } from "@/lib/records/seed";
import type {
  CrmState,
  CustomField,
  Entity,
  FieldType,
  FieldValue,
} from "@/lib/records/types";
import { commitCrm } from "@/lib/records/store";
import { buttonClass, Empty, inputClass, Modal } from "./ui";

export function CustomInput({
  field,
  value,
  onChange,
  state,
  locale,
  disabled = false,
}: {
  field: CustomField;
  value?: FieldValue;
  onChange: (value: FieldValue) => void;
  state: CrmState;
  locale: Locale;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const [rawTags, setRawTags] = useState<string | null>(null);
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const label = field.label[locale];
  const choices = field.options;
  if (["checkbox", "toggle"].includes(field.type))
    return (
      <label className="flex items-center gap-2 rounded-xl bg-white/60 p-3 text-sm">
        <input
          disabled={disabled}
          aria-label={label}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-[#9b85bb]"
        />
        {label}
        {field.required && " *"}
      </label>
    );
  let control;
  if (
    ["radio", "toggle-buttons", "checkbox-list", "multi-select"].includes(
      field.type,
    )
  ) {
    const multiple = ["checkbox-list", "multi-select"].includes(field.type);
    control = (
      <div className="flex flex-wrap gap-2">
        {choices.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 rounded-lg border border-[#ddd4e8] bg-white/70 px-2 py-2 text-xs"
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              disabled={disabled}
              name={field.id}
              checked={
                multiple
                  ? Array.isArray(value) && value.includes(option)
                  : value === option
              }
              onChange={(e) =>
                onChange(
                  multiple
                    ? e.target.checked
                      ? [...(Array.isArray(value) ? value : []), option]
                      : (Array.isArray(value) ? value : []).filter(
                          (v) => v !== option,
                        )
                    : option,
                )
              }
            />
            {option}
          </label>
        ))}
      </div>
    );
  } else if (field.type === "select")
    control = (
      <select
        disabled={disabled}
        aria-label={label}
        className={inputClass}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("Choose…", "انتخاب…")}</option>
        {choices.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  else if (field.type === "record")
    control = (
      <select
        disabled={disabled}
        multiple
        aria-label={label}
        className={inputClass}
        value={Array.isArray(value) ? value : []}
        onChange={(e) =>
          onChange([...e.target.selectedOptions].map((o) => o.value))
        }
      >
        {workspaceRecords(state)
          .filter((r) => !field.lookup || r.entity === field.lookup)
          .map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
      </select>
    );
  else if (["textarea", "rich-editor", "markdown-editor"].includes(field.type))
    control = (
      <div>
        <textarea
          disabled={disabled}
          aria-label={label}
          rows={3}
          className={inputClass}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.type !== "textarea" && (
          <p className="mt-1 text-xs text-[#9d8cad]">
            {t(
              "Supports # headings, **bold**, and lists.",
              "از عنوان، **متن ضخیم** و فهرست پشتیبانی می‌کند.",
            )}
          </p>
        )}
      </div>
    );
  else if (field.type === "file-upload")
    control = (
      <div>
        <input
          disabled={disabled}
          aria-label={label}
          type="file"
          accept="image/png,image/jpeg,application/pdf,text/plain"
          className={inputClass}
          onChange={async (e) => {
            setError("");
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 256000) {
              setError(
                t(
                  "Choose a file under 250 KB.",
                  "فایلی کوچک‌تر از ۲۵۰ کیلوبایت انتخاب کنید.",
                ),
              );
              return;
            }
            if (
              ![
                "image/png",
                "image/jpeg",
                "application/pdf",
                "text/plain",
              ].includes(file.type)
            ) {
              setError(
                t("Unsupported file type.", "نوع فایل پشتیبانی نمی‌شود."),
              );
              return;
            }
            const reader = new FileReader();
            reader.onload = () =>
              onChange(JSON.stringify({ name: file.name, url: reader.result }));
            reader.readAsDataURL(file);
          }}
        />
        {localFile(value) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[#897494]">
            <a
              href={localFile(value)!.url}
              download={localFile(value)!.name}
              className="truncate underline"
            >
              {localFile(value)!.name}
            </a>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              {t("Remove", "حذف")}
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-[#996f43]">
            {error}
          </p>
        )}
      </div>
    );
  else
    control = (
      <input
        disabled={disabled}
        aria-label={label}
        className={inputClass}
        type={
          ["number", "currency"].includes(field.type)
            ? "number"
            : field.type === "date-time"
              ? "datetime-local"
              : field.type === "color-picker"
                ? "color"
                : field.type === "date"
                  ? "date"
                  : field.type === "email"
                    ? "email"
                    : field.type === "link"
                      ? "url"
                      : "text"
        }
        step={field.type === "currency" ? "0.01" : undefined}
        min={field.min}
        max={field.max}
        value={
          Array.isArray(value)
            ? (rawTags ?? value.join(", "))
            : String(value ?? (field.type === "color-picker" ? "#a38bbe" : ""))
        }
        onChange={(e) => {
          if (field.type === "tags-input") setRawTags(e.target.value);
          onChange(
            ["number", "currency"].includes(field.type)
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : field.type === "tags-input"
                ? e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                : e.target.value,
          );
        }}
      />
    );
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#665374]">
        {label}
        {field.required && " *"}
      </label>
      {control}
    </div>
  );
}
export function CustomFieldsForm({
  state,
  entity,
  values,
  onChange,
  locale,
  disabled = false,
}: {
  state: CrmState;
  entity: Entity;
  values: Record<string, FieldValue>;
  onChange: (values: Record<string, FieldValue>) => void;
  locale: Locale;
  disabled?: boolean;
}) {
  const fields = state.fields.filter(
    (f) =>
      f.workspaceId === state.activeWorkspaceId &&
      f.entity === entity &&
      fieldVisible(f, values),
  );
  return (
    <div className="space-y-4">
      {[...new Set(fields.map((field) => field.section || "General"))].map(
        (section) => (
          <fieldset
            key={section}
            className="rounded-2xl border border-[#e5ddeb] p-3"
          >
            <legend className="px-2 text-xs font-semibold text-[#a28ab2]">
              {section}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields
                .filter((field) => (field.section || "General") === section)
                .map((field) => (
                  <CustomInput
                    key={field.id}
                    field={field}
                    state={state}
                    locale={locale}
                    disabled={disabled}
                    value={values[field.id] ?? field.defaultValue}
                    onChange={(value) =>
                      onChange({ ...values, [field.id]: value })
                    }
                  />
                ))}
            </div>
          </fieldset>
        ),
      )}
    </div>
  );
}

export default function FieldsManager({
  state,
  locale,
  notify,
}: {
  state: CrmState;
  locale: Locale;
  notify: (message: string) => void;
}) {
  const [entity, setEntity] = useState<Entity>("people");
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [deleting, setDeleting] = useState<CustomField | null>(null);
  const [error, setError] = useState("");
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const canManage = ["owner", "admin"].includes(currentRole(state));
  const fields = state.fields.filter(
    (f) => f.workspaceId === state.activeWorkspaceId && f.entity === entity,
  );
  function save() {
    if (!editing) return;
    try {
      commitCrm((s) => saveField(s, editing));
      setEditing(null);
      setError("");
      notify(t("Field saved", "فیلد ذخیره شد"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Settings2 size={20} />
            {t("Make the CRM yours", "مدل داده خودتان را بسازید")}
          </h2>
          <p className="mt-1 text-sm text-[#8d7d99]">
            {t(
              "Fields, sections, options, validation, and conditional visibility.",
              "فیلدها، بخش‌ها، گزینه‌ها، اعتبارسنجی و نمایش شرطی.",
            )}
          </p>
        </div>
        <button
          disabled={!canManage}
          className={buttonClass}
          onClick={() => {
            setError("");
            setEditing({
              id: "",
              workspaceId: state.activeWorkspaceId,
              entity,
              label: text("", ""),
              type: "text",
              section: "General",
              required: false,
              unique: false,
              options: [],
            });
          }}
        >
          <Plus size={16} />
          {t("New field", "فیلد جدید")}
        </button>
      </header>
      <select
        className={inputClass + " mb-4 max-w-xs"}
        value={entity}
        onChange={(e) => setEntity(e.target.value as Entity)}
        aria-label={t("Field entity", "نوع رکورد فیلد")}
      >
        {Object.entries(entityLabels).map(([id, label]) => (
          <option key={id} value={id}>
            {label[locale]}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field, index) => (
          <section
            key={field.id}
            className="rounded-2xl border border-white bg-[#f6f3e5] p-4"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#e4d8f0] px-2 py-1 text-xs text-[#866799]">
                {field.type}
              </span>
              <span className="ms-auto text-xs text-[#a1969b]">
                {field.section}
              </span>
            </div>
            <h3 className="mt-3 text-base font-bold">{field.label[locale]}</h3>
            <div className="mt-2 flex flex-wrap gap-1 text-xs text-[#9d8b91]">
              {field.required && <span>{t("Required", "ضروری")} · </span>}
              {field.unique && <span>{t("Unique", "یکتا")} · </span>}
              {field.condition && <span>{t("Conditional", "شرطی")}</span>}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                disabled={!canManage}
                className={buttonClass}
                onClick={() => {
                  setEditing(field);
                  setError("");
                }}
                aria-label={t(
                  `Edit ${field.label.en}`,
                  `ویرایش ${field.label.fa}`,
                )}
              >
                <Pencil size={13} />
              </button>
              {[-1, 1].map((delta) => (
                <button
                  key={delta}
                  disabled={
                    !canManage ||
                    index + delta < 0 ||
                    index + delta >= fields.length
                  }
                  className="p-2 text-[#9d87ad]"
                  onClick={() => {
                    const a = state.fields.indexOf(field),
                      b = state.fields.indexOf(fields[index + delta]);
                    commitCrm((s) => {
                      const next = [...s.fields];
                      [next[a], next[b]] = [next[b], next[a]];
                      return { ...s, fields: next };
                    });
                  }}
                  aria-label={t(
                    delta < 0 ? "Move field up" : "Move field down",
                    delta < 0 ? "فیلد بالاتر" : "فیلد پایین‌تر",
                  )}
                >
                  {delta < 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
              ))}
              <button
                disabled={!canManage}
                className="ms-auto p-2 text-[#a48a9a]"
                onClick={() => setDeleting(field)}
                aria-label={t("Delete field", "حذف فیلد")}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </section>
        ))}
      </div>
      {!fields.length && (
        <Empty
          title={t("Room for your own data", "فضایی برای داده‌های شما")}
          description={t(
            "Add a field to customize these records.",
            "برای سفارشی‌سازی این رکوردها فیلد اضافه کنید.",
          )}
        />
      )}
      {editing && (
        <Modal
          title={
            editing.id
              ? t("Edit field", "ویرایش فیلد")
              : t("New custom field", "فیلد سفارشی جدید")
          }
          locale={locale}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                English label
                <input
                  aria-label="English label"
                  required
                  className={inputClass + " mt-1"}
                  value={editing.label.en}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      label: { ...editing.label, en: e.target.value },
                    })
                  }
                />
              </label>
              <label className="text-sm font-medium">
                عنوان فارسی
                <input
                  aria-label="عنوان فارسی"
                  required
                  className={inputClass + " mt-1"}
                  value={editing.label.fa}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      label: { ...editing.label, fa: e.target.value },
                    })
                  }
                />
              </label>
              <label className="text-sm">
                {t("Type", "نوع")}
                <select
                  disabled={!!editing.id}
                  aria-label={t("Field type", "نوع فیلد")}
                  className={inputClass + " mt-1"}
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      type: e.target.value as FieldType,
                    })
                  }
                >
                  {fieldTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                {t("Section", "بخش")}
                <input
                  className={inputClass + " mt-1"}
                  value={editing.section}
                  onChange={(e) =>
                    setEditing({ ...editing, section: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={editing.required}
                  onChange={(e) =>
                    setEditing({ ...editing, required: e.target.checked })
                  }
                />
                {t("Required", "ضروری")}
              </label>
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={editing.unique}
                  onChange={(e) =>
                    setEditing({ ...editing, unique: e.target.checked })
                  }
                />
                {t("Unique values", "مقادیر یکتا")}
              </label>
            </div>
            {[
              "select",
              "radio",
              "toggle-buttons",
              "multi-select",
              "checkbox-list",
            ].includes(editing.type) && (
              <label className="block text-sm">
                {t("Options (one per line)", "گزینه‌ها (هر کدام یک خط)")}
                <textarea
                  aria-label={t("Field options", "گزینه‌های فیلد")}
                  rows={4}
                  className={inputClass + " mt-1"}
                  value={editing.options.join("\n")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      options: e.target.value.split("\n"),
                    })
                  }
                />
              </label>
            )}
            {["number", "currency"].includes(editing.type) && (
              <div className="grid grid-cols-2 gap-3">
                {(["min", "max"] as const).map((key) => (
                  <label key={key} className="text-sm">
                    {key}
                    <input
                      type="number"
                      className={inputClass}
                      value={editing[key] ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [key]:
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            {editing.type === "record" && (
              <select
                aria-label={t("Lookup type", "نوع رکورد مرتبط")}
                className={inputClass}
                value={editing.lookup ?? "people"}
                onChange={(e) =>
                  setEditing({ ...editing, lookup: e.target.value as Entity })
                }
              >
                {Object.entries(entityLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label[locale]}
                  </option>
                ))}
              </select>
            )}
            <div className="rounded-xl bg-[#ece4f3] p-3">
              <h3 className="mb-2 text-sm font-bold">
                {t("Show only when…", "نمایش فقط زمانی که…")}
              </h3>
              <select
                aria-label={t("Condition field", "فیلد شرط")}
                className={inputClass}
                value={editing.condition?.fieldId ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    condition: e.target.value
                      ? { fieldId: e.target.value, equals: "" }
                      : undefined,
                  })
                }
              >
                <option value="">
                  {t("Always visible", "همیشه نمایش داده شود")}
                </option>
                {fields
                  .filter((f) => f.id !== editing.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label[locale]}
                    </option>
                  ))}
              </select>
              {editing.condition && (
                <input
                  aria-label={t("Condition equals", "مقدار شرط")}
                  placeholder={t("Equals this value", "برابر با این مقدار")}
                  className={inputClass + " mt-2"}
                  value={editing.condition.equals}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      condition: {
                        ...editing.condition!,
                        equals: e.target.value,
                      },
                    })
                  }
                />
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm text-[#947138]">
                {error}
              </p>
            )}
            <button className={buttonClass + " w-full bg-[#b4a3d5]!"}>
              {t("Save field", "ذخیره فیلد")}
            </button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={t("Delete field?", "حذف فیلد؟")}
          locale={locale}
          onClose={() => setDeleting(null)}
        >
          <p className="mb-4 text-sm leading-relaxed text-[#86728f]">
            {t(
              "This removes the field and its stored values from this workspace.",
              "این کار فیلد و مقادیر ذخیره‌شده آن را از این فضای کاری حذف می‌کند.",
            )}
          </p>
          <button
            className={buttonClass}
            onClick={() => {
              commitCrm((s) => deleteField(s, deleting.id));
              setDeleting(null);
            }}
          >
            {t("Delete field and values", "حذف فیلد و مقادیر")}
          </button>
        </Modal>
      )}
    </div>
  );
}
