"use client";
import { useState } from "react";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import type { CrmState, Entity } from "@/lib/records/types";
import { entityLabels } from "@/lib/records/seed";
import {
  fieldLabels,
  readFields,
  writeFields,
  type BoardAgent,
  type AgentSkill,
  type AgentScope,
} from "@/lib/agents/types";
import { buttonClass, inputClass, Modal } from "../records/ui";
export function AgentEditor({
  agent,
  state,
  skills,
  locale,
  onClose,
  onSave,
}: {
  agent: BoardAgent;
  state: CrmState;
  skills: AgentSkill[];
  locale: Locale;
  onClose: () => void;
  onSave: (a: BoardAgent) => Promise<void>;
}) {
  const [draft, setDraft] = useState(agent),
    [tab, setTab] = useState("identity"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = (en: string, fa: string) => (locale === "fa" ? fa : en);
  function scope(index: number, update: Partial<AgentScope>) {
    setDraft((s) => ({
      ...s,
      scopes: s.scopes.map((v, i) => (i === index ? { ...v, ...update } : v)),
    }));
  }
  const input = (
    key: "name" | "objective" | "instructions" | "modelName",
    label: string,
    area = false,
  ) => (
    <label className="block text-sm font-bold">
      {label}
      {area ? (
        <textarea
          rows={key === "instructions" ? 5 : 3}
          className={inputClass + " mt-2 resize-y"}
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          maxLength={key === "instructions" ? 12000 : 2000}
        />
      ) : (
        <input
          required={key === "name"}
          className={inputClass + " mt-2"}
          value={draft[key]}
          maxLength={key === "modelName" ? 160 : 120}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      )}
    </label>
  );
  return (
    <Modal
      title={
        agent.id
          ? t("Edit agent", "ویرایش عامل")
          : t("Build your agent", "ساخت عامل شما")
      }
      locale={locale}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(draft);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <nav
          aria-label={t("Agent settings tabs", "بخش‌های تنظیمات عامل")}
          className="flex flex-wrap gap-2 rounded-2xl bg-[#e4dcef] p-2"
        >
          {[
            ["identity", t("Identity", "هویت")],
            ["access", t("Board access", "دسترسی برد")],
            ["skills", t("Skills & tools", "مهارت و ابزار")],
          ].map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === id ? "bg-white text-[#5e47a3]" : "text-[#8b779d]"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "identity" && (
          <div className="space-y-4">
            {input("name", t("Agent name", "نام عامل"))}
            {input("objective", t("Objective", "هدف"), true)}
            {input("instructions", t("Instructions", "دستورالعمل"), true)}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold">
                {t("Model", "مدل")}
                <select
                  aria-label={t("Agent model", "مدل عامل")}
                  className={inputClass + " mt-2"}
                  value={draft.model}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      model: e.target.value as BoardAgent["model"],
                      trigger:
                        e.target.value === "lmstudio"
                          ? "manual"
                          : draft.trigger,
                    })
                  }
                >
                  <option value="mock">
                    {t("Rules / mock", "قواعد / نمونه")}
                  </option>
                  <option value="lmstudio">LM Studio · Qwen</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                {t("Trigger", "محرک اجرا")}
                <select
                  aria-label={t("Agent trigger", "محرک عامل")}
                  className={inputClass + " mt-2"}
                  value={draft.trigger}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      trigger: e.target.value as BoardAgent["trigger"],
                    })
                  }
                >
                  <option value="manual">
                    {t("Run manually", "اجرای دستی")}
                  </option>
                  <option
                    value="board-change"
                    disabled={draft.model === "lmstudio"}
                  >
                    {t(
                      "After board data changes (rules)",
                      "پس از تغییر داده برد (قواعد)",
                    )}
                  </option>
                </select>
              </label>
            </div>
            {draft.model === "lmstudio" &&
              input(
                "modelName",
                t("Loaded model identifier", "شناسه مدل بارگذاری‌شده"),
              )}
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) =>
                  setDraft({ ...draft, enabled: e.target.checked })
                }
              />
              {t("Agent enabled", "عامل فعال")}
            </label>
            <p className="rounded-xl bg-[#e3ebe4] p-3 text-sm leading-7 text-[#577562]">
              {t(
                "A run reads current board data and creates a report. No trigger can apply a proposed change automatically.",
                "هر اجرا داده فعلی برد را می‌خواند و گزارش می‌سازد. هیچ محرکی تغییر پیشنهادی را خودکار اعمال نمی‌کند.",
              )}
            </p>
          </div>
        )}
        {tab === "access" && (
          <div className="space-y-4">
            <p className="rounded-2xl bg-[#f2edda] p-4 text-sm leading-7">
              {t(
                "Choose exactly which boards and fields this agent may read. Proposal permissions only allow previews; a user must still approve every change.",
                "بردها و فیلدهای مجاز را دقیق انتخاب کنید. دسترسی پیشنهاد فقط پیش‌نمایش می‌سازد؛ هر تغییر همچنان نیاز به تأیید انسان دارد.",
              )}
            </p>
            {draft.scopes.map((s, i) => (
              <section
                key={i}
                className="space-y-3 rounded-2xl border border-[#d9cde6] bg-[#f4f0f8] p-4"
              >
                <div className="flex gap-2">
                  <select
                    aria-label={`${t("Scope workspace", "فضای کاری دسترسی")} ${i + 1}`}
                    className={inputClass}
                    value={s.workspaceId}
                    onChange={(e) =>
                      scope(i, {
                        workspaceId: e.target.value,
                        customFields: [],
                      })
                    }
                  >
                    {state.workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`${t("Scope board", "برد دسترسی")} ${i + 1}`}
                    className={inputClass}
                    value={s.entity}
                    onChange={(e) =>
                      scope(i, {
                        entity: e.target.value as Entity,
                        customFields: [],
                      })
                    }
                  >
                    {Object.entries(entityLabels).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label[locale]}
                      </option>
                    ))}
                  </select>
                  <button
                    aria-label={t("Remove scope", "حذف دسترسی")}
                    type="button"
                    disabled={draft.scopes.length === 1}
                    className="rounded-xl bg-[#e7dcef] p-2 disabled:opacity-30"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        scopes: draft.scopes.filter((_, index) => index !== i),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-[#624c81]">
                  {t("Readable fields", "فیلدهای قابل خواندن")}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {readFields.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={s.readFields.includes(f)}
                        onChange={(e) =>
                          scope(i, {
                            readFields: e.target.checked
                              ? [...s.readFields, f]
                              : s.readFields.filter((v) => v !== f),
                            writeFields: e.target.checked
                              ? s.writeFields
                              : s.writeFields.filter((v) => v !== f),
                          })
                        }
                      />
                      {fieldLabels[f][locale]}
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={s.comments}
                    onChange={(e) => scope(i, { comments: e.target.checked })}
                  />
                  {t("Read update threads", "خواندن گفتگوهای رکورد")}
                </label>
                {(s.customFields.length > 0 ||
                  state.fields.some(
                    (f) =>
                      f.workspaceId === s.workspaceId && f.entity === s.entity,
                  )) && (
                  <details>
                    <summary className="text-sm font-bold">
                      {t("Custom fields", "فیلدهای سفارشی")}
                    </summary>
                    <button
                      type="button"
                      className="my-2 text-xs font-bold"
                      onClick={() => scope(i, { customFields: [] })}
                    >
                      {t(
                        "Clear custom field access",
                        "پاک‌کردن دسترسی فیلد سفارشی",
                      )}
                    </button>
                    {state.fields
                      .filter(
                        (f) =>
                          f.workspaceId === s.workspaceId &&
                          f.entity === s.entity,
                      )
                      .map((f) => (
                        <label
                          key={f.id}
                          className="my-2 flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={s.customFields.includes(f.id)}
                            onChange={(e) =>
                              scope(i, {
                                customFields: e.target.checked
                                  ? [...s.customFields, f.id]
                                  : s.customFields.filter((v) => v !== f.id),
                              })
                            }
                          />
                          {f.label[locale]}
                        </label>
                      ))}
                  </details>
                )}
                <div className="rounded-xl bg-[#e0eadd] p-3">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#4b6f56]">
                    <ShieldCheck size={15} />
                    {t("May propose changes to", "مجاز به پیشنهاد تغییر")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {writeFields.map((f) => (
                      <label
                        key={f}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          aria-label={`${t("Propose", "پیشنهاد")} ${fieldLabels[f][locale]} ${i + 1}`}
                          checked={s.writeFields.includes(f)}
                          onChange={(e) =>
                            scope(i, {
                              writeFields: e.target.checked
                                ? [...s.writeFields, f]
                                : s.writeFields.filter((v) => v !== f),
                              readFields:
                                e.target.checked && !s.readFields.includes(f)
                                  ? [...s.readFields, f]
                                  : s.readFields,
                            })
                          }
                        />
                        {fieldLabels[f][locale]}
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            ))}
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                const next = state.workspaces
                  .flatMap((w) =>
                    (Object.keys(entityLabels) as Entity[]).map((entity) => ({
                      workspaceId: w.id,
                      entity,
                    })),
                  )
                  .find(
                    (b) =>
                      !draft.scopes.some(
                        (s) =>
                          s.workspaceId === b.workspaceId &&
                          s.entity === b.entity,
                      ),
                  );
                if (next)
                  setDraft({
                    ...draft,
                    scopes: [
                      ...draft.scopes,
                      {
                        ...next,
                        readFields: ["stage", "dueDate", "ownerId", "priority"],
                        customFields: [],
                        comments: false,
                        writeFields: [],
                      },
                    ],
                  });
              }}
            >
              <Plus size={15} />
              {t("Add board scope", "افزودن برد")}
            </button>
          </div>
        )}
        {tab === "skills" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold">
              {t("Reusable report skills", "مهارت‌های قابل استفاده مجدد")}
            </h3>
            {skills.map((skill) => (
              <label
                key={skill.id}
                className="flex gap-3 rounded-2xl bg-[#eee6f5] p-4"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.skills.includes(skill.id)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      skills: e.target.checked
                        ? [...draft.skills, skill.id]
                        : draft.skills.filter((v) => v !== skill.id),
                    })
                  }
                />
                <span>
                  <strong className="block text-sm">
                    {skill.name} · v{skill.version}
                  </strong>
                  <span className="mt-1 block text-sm leading-6 text-[#7b698c]">
                    {skill.description}
                  </span>
                </span>
              </label>
            ))}
            <h3 className="pt-2 text-base font-bold">
              {t("External tools", "ابزارهای بیرونی")}
            </h3>
            <p className="text-sm leading-7 text-[#7a698a]">
              {t(
                "Select intended capabilities. These services remain disconnected until their credentials and server adapters are configured; no data is fetched or sent.",
                "قابلیت‌های مورد نیاز را انتخاب کنید. تا پیکربندی اعتبارنامه و اتصال سرور، این سرویس‌ها قطع هستند و داده‌ای خوانده یا ارسال نمی‌شود.",
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["gmail", "slack", "outlook", "teams"].map((tool) => (
                <label
                  key={tool}
                  className="flex items-center gap-2 rounded-xl bg-[#f0eddf] p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={draft.tools.includes(tool)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        tools: e.target.checked
                          ? [...draft.tools, tool]
                          : draft.tools.filter((v) => v !== tool),
                      })
                    }
                  />
                  {tool}
                  <span className="ms-auto text-xs text-[#918575]">
                    {t("Offline", "قطع")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#f3e7c5] p-3 text-sm leading-6"
          >
            {error}
          </p>
        )}
        <footer className="flex justify-end gap-2 border-t border-[#ded3e7] pt-4">
          <button type="button" className={buttonClass} onClick={onClose}>
            {t("Cancel", "انصراف")}
          </button>
          <button
            disabled={busy || !draft.name.trim() || !draft.skills.length}
            className={buttonClass + " bg-[#d3c2e8]! font-bold"}
          >
            {busy
              ? t("Saving…", "در حال ذخیره…")
              : t("Save agent", "ذخیره عامل")}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function SkillEditor({
  skill,
  locale,
  onClose,
  onSave,
}: {
  skill: AgentSkill;
  locale: Locale;
  onClose: () => void;
  onSave: (s: AgentSkill) => Promise<void>;
}) {
  const [draft, setDraft] = useState(skill),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = (en: string, fa: string) => (locale === "fa" ? fa : en);
  return (
    <Modal
      title={t("Reusable agent skill", "مهارت قابل استفاده مجدد")}
      locale={locale}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(draft);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="rounded-2xl bg-[#e3ebe1] p-4 text-sm leading-7">
          {t(
            "A skill combines instructions and fixed report sections. In rules mode the built-in checks are used; local Qwen can follow your custom instructions later.",
            "مهارت از دستورالعمل و بخش‌های ثابت گزارش تشکیل می‌شود. حالت قواعد بررسی‌های پیش‌فرض دارد؛ Qwen محلی بعداً دستورالعمل اختصاصی شما را اجرا می‌کند.",
          )}
        </p>
        {[
          ["name", t("Skill name", "نام مهارت")],
          ["description", t("Description", "توضیحات")],
          [
            "instructions",
            t("Step-by-step instructions", "دستورالعمل گام‌به‌گام"),
          ],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm font-bold">
            {label}
            {key === "name" ? (
              <input
                required
                aria-label={label}
                className={inputClass + " mt-2"}
                maxLength={120}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            ) : (
              <textarea
                aria-label={label}
                className={inputClass + " mt-2"}
                rows={key === "instructions" ? 6 : 2}
                maxLength={key === "instructions" ? 12000 : 1000}
                value={draft[key as "description" | "instructions"]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            )}
          </label>
        ))}
        <fieldset>
          <legend className="mb-2 text-sm font-bold">
            {t("Controlled output sections", "بخش‌های ثابت خروجی")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["snapshot", t("Snapshot", "نمای کلی")],
              ["progress", t("Progress", "پیشرفت")],
              ["risks", t("Risks & blockers", "ریسک و مانع")],
              ["actions", t("Recommended actions", "قدم‌های پیشنهادی")],
            ].map(([id, label]) => (
              <label
                key={id}
                className="flex gap-2 rounded-xl bg-[#eee7f4] p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={draft.sections.includes(id)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sections: e.target.checked
                        ? [...draft.sections, id]
                        : draft.sections.filter((v) => v !== id),
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm">
            {error}
          </p>
        )}
        <button
          disabled={busy || !draft.name.trim() || !draft.sections.length}
          className={buttonClass}
        >
          {t("Save skill", "ذخیره مهارت")}
        </button>
      </form>
    </Modal>
  );
}
