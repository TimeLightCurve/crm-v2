"use client";
import { useState } from "react";
import { Check, Plus, ShieldCheck, Users } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import {
  currentRole,
  currentWorkspace,
  workspaceBackup,
} from "@/lib/records/model";
import { commitCrm } from "@/lib/records/store";
import { backend, loadSession, useSession } from "@/lib/backend";
import type { CrmState } from "@/lib/records/types";
import { buttonClass, inputClass, Modal, downloadFile } from "./ui";
export default function WorkspaceSettings({
  state,
  locale,
  notify,
}: {
  state: CrmState;
  locale: Locale;
  notify: (message: string) => void;
}) {
  const workspace = currentWorkspace(state),
    session = useSession();
  const [name, setName] = useState(workspace.name),
    [creating, setCreating] = useState(false),
    [newName, setNewName] = useState(""),
    [adding, setAdding] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = (en: string, fa: string) => (locale === "fa" ? fa : en);
  const admin = ["owner", "admin"].includes(currentRole(state));
  const actor = session?.user;
  const canProvision =
    actor?.permissions.includes("*") || actor?.role === "manager";
  const departments =
    actor?.permissions.includes("*") || actor?.department === "management"
      ? [
          "sales",
          "procurement",
          "inventory",
          "production",
          "quality",
          "hr",
          "finance",
          "management",
        ]
      : [actor?.department || "sales"];
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-3xl bg-[#f3efdc] p-5">
        <h2 className="text-xl font-bold">
          {t("Your workspace", "فضای کاری شما")}
        </h2>
        <p className="my-3 text-base leading-7 text-[#686576]">
          {t(
            "Accounts and permissions come from Nabz. Records are shared within your company.",
            "حساب‌ها و دسترسی‌ها از نبض دریافت می‌شوند. رکوردها در شرکت شما مشترک هستند.",
          )}
        </p>
        <label className="block text-sm font-bold">
          {t("Workspace name", "نام فضای کاری")}
          <input
            className={inputClass + " mt-2"}
            value={name}
            disabled={!admin}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={!admin || !name.trim()}
            className={buttonClass}
            onClick={() =>
              commitCrm((s) => ({
                ...s,
                workspaces: s.workspaces.map((w) =>
                  w.id === workspace.id ? { ...w, name: name.trim() } : w,
                ),
              }))
            }
          >
            <Check size={16} />
            {t("Save name", "ذخیره نام")}
          </button>
          <button
            disabled={!admin}
            className={buttonClass}
            onClick={() => setCreating(true)}
          >
            <Plus size={16} />
            {t("New workspace", "فضای کاری جدید")}
          </button>
          <button
            className={buttonClass}
            onClick={() =>
              downloadFile(
                "forma-backup.json",
                JSON.stringify(workspaceBackup(state), null, 2),
                "application/json",
              )
            }
          >
            {t("Download backup", "دریافت پشتیبان")}
          </button>
        </div>
        <div className="mt-5 flex gap-3 rounded-xl bg-white/60 p-4">
          <ShieldCheck className="shrink-0 text-[#658878]" />
          <div>
            <strong>{actor?.name}</strong>
            <p className="mt-1 text-sm text-[#686576]">
              {actor?.role} · {actor?.department}
            </p>
            <p className="mt-2 text-sm">
              {t(
                "Access is enforced by the server.",
                "دسترسی در سرور کنترل می‌شود.",
              )}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-3xl bg-[#e4dfef] p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Users size={20} />
            {t("Team accounts", "حساب‌های تیم")}
          </h2>
          <button
            className={buttonClass}
            disabled={!canProvision || session?.saving}
            onClick={() => {
              setAdding(true);
              setError("");
            }}
          >
            <Plus size={16} />
            {t("Add account", "افزودن حساب")}
          </button>
        </header>
        <div className="space-y-2">
          {workspace.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl bg-white/65 p-3"
            >
              <span className="grid size-10 place-items-center rounded-full bg-[#c5b6dd] font-bold">
                {m.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-base">{m.name}</strong>
                <p className="text-sm text-[#6b6080]">{m.email}</p>
              </div>
              <span className="rounded-full bg-[#d8cfeb] px-3 py-1 text-sm">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-3xl bg-[#dce9e1] p-5 xl:col-span-2">
        <h2 className="text-xl font-bold">
          {t("Your model. Your machine.", "مدل شما روی دستگاه شما")}
        </h2>
        <p className="mt-2 text-base text-[#536d61]">
          {t(
            "Mock answers remain enabled. Connect LM Studio and Qwen when ready.",
            "پاسخ‌های نمونه فعال هستند. بعداً LM Studio و Qwen را متصل کنید.",
          )}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            {t("Assistant mode", "حالت دستیار")}
            <select
              disabled={!admin}
              className={inputClass + " mt-2"}
              value={state.ai.mode}
              onChange={(e) =>
                commitCrm((s) => ({
                  ...s,
                  ai: { ...s.ai, mode: e.target.value as "mock" | "lmstudio" },
                }))
              }
            >
              <option value="mock">{t("Mock", "نمونه")}</option>
              <option value="lmstudio">LM Studio</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            {t("Loaded model identifier", "شناسه مدل بارگذاری‌شده")}
            <input
              disabled={!admin}
              className={inputClass + " mt-2"}
              value={state.ai.model}
              onChange={(e) =>
                commitCrm((s) => ({
                  ...s,
                  ai: { ...s.ai, model: e.target.value },
                }))
              }
            />
          </label>
        </div>
      </section>
      {creating && (
        <Modal
          title={t("New workspace", "فضای کاری جدید")}
          locale={locale}
          onClose={() => setCreating(false)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const id = crypto.randomUUID();
              commitCrm((s) => ({
                ...s,
                activeWorkspaceId: id,
                workspaces: [
                  ...s.workspaces,
                  { id, name: newName.trim(), members: workspace.members },
                ],
              }));
              setCreating(false);
              setNewName("");
            }}
          >
            <label className="block text-sm font-bold">
              {t("Workspace name", "نام فضای کاری")}
              <input
                autoFocus
                required
                maxLength={100}
                aria-label={t("New workspace name", "نام فضای کاری جدید")}
                className={inputClass + " mt-2"}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            <p className="text-sm leading-6 text-[#6b6080]">
              {t(
                "Uses your company's existing accounts and permissions.",
                "از حساب‌ها و دسترسی‌های فعلی شرکت شما استفاده می‌کند.",
              )}
            </p>
            <button className={buttonClass} disabled={!newName.trim()}>
              {t("Create workspace", "ساخت فضای کاری")}
            </button>
          </form>
        </Modal>
      )}
      {adding && (
        <Modal
          title={t("New Nabz account", "حساب جدید نبض")}
          locale={locale}
          onClose={() => setAdding(false)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const data = Object.fromEntries(new FormData(e.currentTarget));
              try {
                await backend("staff", {
                  method: "POST",
                  body: JSON.stringify(data),
                });
                await loadSession();
                setAdding(false);
                notify(t("Account created", "حساب ایجاد شد"));
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {[
              ["name", t("Full name", "نام کامل"), "text"],
              ["username", t("Username", "نام کاربری"), "text"],
              [
                "password",
                t(
                  "Initial password (10+ characters)",
                  "گذرواژه اولیه (حداقل ۱۰ نویسه)",
                ),
                "password",
              ],
            ].map(([key, label, type]) => (
              <label key={key} className="block text-sm font-bold">
                {label}
                <input
                  required
                  name={key}
                  type={type}
                  minLength={key === "password" ? 10 : 2}
                  maxLength={key === "password" ? 128 : 100}
                  autoComplete="off"
                  className={inputClass + " mt-2"}
                />
              </label>
            ))}
            <label className="block text-sm font-bold">
              {t("Department", "واحد")}
              <select name="department" className={inputClass + " mt-2"}>
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              {t("Role", "نقش")}
              <select name="role" className={inputClass + " mt-2"}>
                <option value="employee">{t("Employee", "کارمند")}</option>
                <option value="manager">{t("Manager", "مدیر")}</option>
              </select>
            </label>
            {error && (
              <p role="alert" className="text-sm leading-6">
                {error}
              </p>
            )}
            <button disabled={busy} className={buttonClass}>
              {busy
                ? t("Creating…", "در حال ایجاد…")
                : t("Create account", "ساخت حساب")}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
