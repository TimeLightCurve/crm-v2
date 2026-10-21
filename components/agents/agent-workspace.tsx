"use client";
import { useState } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Copy,
  Download,
  History,
  Mail,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
} from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import type { CrmState } from "@/lib/records/types";
import { currentRole } from "@/lib/records/model";
import { entityLabels } from "@/lib/records/seed";
import { backend, useSession } from "@/lib/backend";
import { useBoardAgents } from "@/lib/agents/client";
import {
  businessDay,
  newBoardAgent,
  type BoardAgent,
  type AgentRun,
  type AgentSkill,
} from "@/lib/agents/types";
import { buttonClass, downloadFile, Modal } from "../records/ui";
import { AgentEditor, SkillEditor } from "./agent-editor";
import BoardSidekick from "./board-sidekick";
export default function AgentWorkspace({
  state,
  locale,
  onOpen,
}: {
  state: CrmState;
  locale: Locale;
  onOpen: (id: string) => void;
}) {
  const api = useBoardAgents(),
    session = useSession();
  const [tab, setTab] = useState("agents"),
    [editing, setEditing] = useState<BoardAgent | null>(null),
    [skill, setSkill] = useState<AgentSkill | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [preview, setPreview] = useState(""),
    [previewRun, setPreviewRun] = useState(""),
    [running, setRunning] = useState(""),
    [deleting, setDeleting] = useState<BoardAgent | null>(null);
  const t = (en: string, fa: string) => (locale === "fa" ? fa : en),
    admin = ["owner", "admin"].includes(currentRole(state));
  const agents =
    api.state?.config.agents.filter(
      (a) =>
        a.workspaceId === state.activeWorkspaceId ||
        a.scopes.some((s) => s.workspaceId === state.activeWorkspaceId),
    ) ?? [];
  function template(kind: "launch" | "sales" | "blank") {
    const a = newBoardAgent(
      state.activeWorkspaceId,
      kind === "sales" ? "opportunities" : "tasks",
    );
    if (kind === "launch") {
      a.name = t("Launch coordinator", "هماهنگ‌کننده پروژه");
      a.objective = t(
        "Track progress, explicit dependencies, blockers and missing owners. Prepare a concise leadership update.",
        "پیشرفت، پیش‌نیازها، موانع و مسئولیت‌ها را بررسی و گزارش مدیریتی مختصر تهیه کن.",
      );
      a.instructions = t(
        "Use real board records and update threads. Cite evidence. Never change status, owners, dates or priority without human approval.",
        "از رکوردها و گفتگوهای واقعی استفاده و منابع را مشخص کن. وضعیت، مسئول، موعد و اولویت را بدون تأیید انسان تغییر نده.",
      );
      a.skills = ["board-review", "risk-scan", "leadership-brief"];
    } else if (kind === "sales") {
      a.name = t("Sales follow-up partner", "همراه پیگیری فروش");
      a.objective = t(
        "Keep open opportunities moving with an accountable owner and a clear next date.",
        "برای فرصت‌های باز، مسئول مشخص و موعد بعدی روشن پیشنهاد بده.",
      );
      a.skills = ["follow-up", "board-review"];
    }
    setEditing(a);
  }
  async function saveAgent(a: BoardAgent) {
    await api.command({
      type: "save-agent",
      revision: api.state!.revision,
      agent: a,
    });
    setEditing(null);
    setNotice(t("Agent saved", "عامل ذخیره شد"));
  }
  async function saveSkill(s: AgentSkill) {
    await api.command({
      type: "save-skill",
      revision: api.state!.revision,
      skill: s,
    });
    setSkill(null);
    setNotice(t("Skill saved", "مهارت ذخیره شد"));
  }
  async function run(a: BoardAgent) {
    setRunning(a.id);
    setError("");
    try {
      const response = await api.command<AgentRun>({
        type: "run",
        agentId: a.id,
        skillId: a.skills[0],
        question: t(
          "Give me a board status update and recommended next actions.",
          "گزارش وضعیت برد و قدم‌های بعدی پیشنهادی را بده.",
        ),
        locale,
        workspaceId: state.activeWorkspaceId,
        entity: "",
        allScopes: true,
        asOf: businessDay(),
      });
      setPreview(a.id);
      setPreviewRun(response.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning("");
    }
  }
  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center gap-4 rounded-3xl bg-[#292f42] p-5 text-[#f6f2e3]">
        <span className="grid size-14 place-items-center rounded-2xl bg-[#a494d6] text-[#292f42]">
          <Bot size={29} />
        </span>
        <div className="me-auto">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#b6a9d9]">
            {t(
              "Your team, with an extra perspective",
              "نگاهی تازه در کنار تیم شما",
            )}
          </p>
          <h2 className="mt-1 text-2xl font-bold">
            {t("Agents & skills", "عامل‌ها و مهارت‌ها")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#c7c6d6]">
            {t(
              "Board context in. Structured reports out. Every change goes through a person.",
              "داده برد را بخوان، گزارش ساختارمند بگیر؛ هر تغییر با تأیید یک نفر انجام می‌شود.",
            )}
          </p>
        </div>
        <button
          disabled={!admin || !api.state}
          className="flex items-center gap-2 rounded-full bg-[#d9caed] px-4 py-3 text-sm font-bold text-[#383249] disabled:opacity-40"
          onClick={() => template("blank")}
        >
          <Plus size={16} />
          {t("New agent", "عامل جدید")}
        </button>
      </header>
      <nav
        aria-label={t("Agent workspace sections", "بخش‌های فضای عامل")}
        className="flex flex-wrap gap-2"
      >
        {[
          ["agents", Bot, t("Agents", "عامل‌ها")],
          ["skills", BookOpen, t("Skill library", "کتابخانه مهارت")],
          ["connections", Unplug, t("Connections", "اتصال‌ها")],
          ["activity", History, t("Activity", "فعالیت")],
        ].map(([id, Icon, label]) => {
          const Glyph = Icon as typeof Bot;
          return (
            <button
              key={String(id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ${tab === id ? "bg-[#7661bd] text-white" : "bg-[#eee8f5] text-[#796487]"}`}
              onClick={() => setTab(String(id))}
            >
              <Glyph size={16} />
              {label as string}
            </button>
          );
        })}
        <button
          className={buttonClass + " ms-auto"}
          aria-label={t("Refresh agents", "تازه‌سازی عامل‌ها")}
          onClick={() => api.refresh().catch((e) => setError(e.message))}
        >
          <RefreshCw size={15} />
        </button>
      </nav>
      {(error || api.error) && (
        <p
          role="alert"
          className="rounded-2xl bg-[#f2e6c5] p-4 text-sm leading-7 text-[#75613e]"
        >
          {error || api.error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-[#dce9e1] p-3 text-sm text-[#55725d]"
        >
          <CheckCircle2 size={16} />
          {notice}
        </p>
      )}
      {!api.state && !api.error && (
        <div className="h-48 animate-pulse rounded-3xl bg-[#e6dfee]" />
      )}
      {tab === "agents" && api.state && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((a) => (
              <motion.article
                layout
                key={a.id}
                className="rounded-3xl border border-white bg-[#faf8ee] p-5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#d6c7e9] text-[#6b528e]">
                    <Bot size={25} />
                  </span>
                  <div className="flex-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${a.enabled ? "bg-[#dce9e0] text-[#5b7f65]" : "bg-[#e4ddec] text-[#8b7b9b]"}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {a.enabled ? t("Enabled", "فعال") : t("Paused", "متوقف")}
                    </span>
                    <h3 className="mt-1 text-lg font-bold">{a.name}</h3>
                  </div>
                </div>
                <p className="line-clamp-3 min-h-18 text-sm leading-7 text-[#81708d]">
                  {a.objective ||
                    t(
                      "A custom agent for your boards.",
                      "عامل اختصاصی برای بردهای شما.",
                    )}
                </p>
                <div className="my-4 flex flex-wrap gap-1.5">
                  {a.scopes.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-[#e9e2f2] px-2.5 py-1 text-xs font-semibold text-[#7d6693]"
                    >
                      {entityLabels[s.entity][locale]} · {s.readFields.length}{" "}
                      {t("fields", "فیلد")}
                    </span>
                  ))}
                </div>
                <div className="space-y-1 border-t border-[#e4dce8] pt-3 text-xs text-[#8b7b98]">
                  <p>
                    {a.model === "lmstudio"
                      ? `LM Studio · ${a.modelName}`
                      : t(
                          "Rules / mock — real board data",
                          "قواعد / نمونه — داده واقعی برد",
                        )}
                  </p>
                  <p>
                    {a.trigger === "board-change"
                      ? t(
                          "Reviews after board changes",
                          "بررسی پس از تغییر برد",
                        )
                      : t("Runs when you ask", "اجرا به درخواست شما")}
                  </p>
                  <p className="flex items-center gap-1">
                    <ShieldCheck size={12} />
                    {t(
                      "Human approval for every change",
                      "تأیید انسان برای هر تغییر",
                    )}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    disabled={!a.enabled || !!running || session?.saving}
                    className={
                      buttonClass +
                      " flex-1 justify-center bg-[#e0d4f0]! font-bold"
                    }
                    onClick={() => void run(a)}
                  >
                    <Play size={14} />
                    {running === a.id
                      ? t("Running…", "در حال اجرا…")
                      : t("Run now", "اجرای اکنون")}
                  </button>
                  <button
                    disabled={!admin}
                    aria-label={`${t("Edit agent", "ویرایش عامل")} ${a.name}`}
                    className={buttonClass}
                    onClick={() => setEditing(a)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    disabled={!admin}
                    aria-label={`${t("Delete agent", "حذف عامل")} ${a.name}`}
                    className={buttonClass}
                    onClick={() => setDeleting(a)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
          <section className="rounded-3xl bg-[#e1e9df] p-5">
            <h3 className="text-lg font-bold">
              {agents.length
                ? t("Start with another role", "یک نقش دیگر بسازید")
                : t(
                    "Give your agent a clear job",
                    "وظیفه عامل را روشن تعریف کنید",
                  )}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#70816e]">
              {t(
                "Templates include an objective and report skills. Board writes stay disabled until you grant proposal fields.",
                "قالب‌ها هدف و مهارت گزارش دارند. تا انتخاب فیلدهای مجاز، پیشنهاد تغییر رکورد غیرفعال است.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                disabled={!admin}
                className={buttonClass + " bg-white/75!"}
                onClick={() => template("launch")}
              >
                {t("Launch coordinator", "هماهنگ‌کننده پروژه")}
              </button>
              <button
                disabled={!admin}
                className={buttonClass + " bg-white/75!"}
                onClick={() => template("sales")}
              >
                {t("Sales follow-up", "پیگیری فروش")}
              </button>
            </div>
          </section>
          {preview && (
            <BoardSidekick
              key={preview + previewRun}
              initialRunId={previewRun}
              initialAgentId={preview}
              state={state}
              locale={locale}
              onOpen={onOpen}
              onClose={() => setPreview("")}
            />
          )}
        </>
      )}
      {tab === "skills" && api.state && (
        <section className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">
                {t(
                  "Instructions with a controlled output",
                  "دستورالعمل با خروجی مشخص",
                )}
              </h3>
              <p className="mt-2 text-sm text-[#877294]">
                {t(
                  "Versioned, reusable skills. Reports use the same validated schema.",
                  "مهارت‌های نسخه‌دار و قابل استفاده مجدد، با قالب خروجی یکسان و اعتبارسنجی‌شده.",
                )}
              </p>
            </div>
            <button
              disabled={!admin}
              className={buttonClass}
              onClick={() =>
                setSkill({
                  id: "",
                  name: "",
                  description: "",
                  instructions: "",
                  sections: ["snapshot", "risks", "actions"],
                  version: 1,
                  builtin: false,
                })
              }
            >
              <Plus size={15} />
              {t("New skill", "مهارت جدید")}
            </button>
          </header>
          <div className="grid gap-3 md:grid-cols-2">
            {api.state.skills.map((s) => (
              <article key={s.id} className="rounded-3xl bg-[#f5f0df] p-5">
                <div className="flex gap-3">
                  <BookOpen className="text-[#9a8ab3]" size={24} />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold">{s.name}</h4>
                    <span className="mt-1 inline-block rounded-full bg-white/70 px-2 py-1 text-xs text-[#897791]">
                      {s.builtin
                        ? t("Built-in", "پیش‌فرض")
                        : t("Custom", "اختصاصی")}{" "}
                      · v{s.version}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#89778e]">
                  {s.description}
                </p>
                <details className="mt-3 text-sm text-[#7c6b87]">
                  <summary className="cursor-pointer font-bold">
                    {t("Instructions & sections", "دستورالعمل و بخش‌ها")}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap leading-7">
                    {s.instructions}
                  </p>
                  <p className="mt-2">{s.sections.join(" · ")}</p>
                </details>
                <button
                  disabled={!admin}
                  className={buttonClass + " mt-4"}
                  onClick={() =>
                    setSkill(
                      s.builtin
                        ? {
                            ...s,
                            id: "",
                            name: s.name + " · custom",
                            builtin: false,
                            version: 1,
                          }
                        : s,
                    )
                  }
                >
                  {s.builtin ? <Copy size={14} /> : <Pencil size={14} />}{" "}
                  {s.builtin
                    ? t("Use as template", "ساخت از قالب")
                    : t("Edit skill", "ویرایش مهارت")}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "connections" && api.state && (
        <section>
          <div className="mb-4 rounded-3xl bg-[#f1edda] p-5">
            <h3 className="text-xl font-bold">
              {t(
                "One place for tool permissions",
                "مدیریت متمرکز دسترسی ابزارها",
              )}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#7c7280]">
              {t(
                "Agent tools are separate from your model. Selecting a tool does not connect an account or grant delivery. These providers need server credentials and adapters; no OAuth connection or external send is simulated.",
                "ابزار عامل از مدل جداست. انتخاب ابزار به معنی اتصال حساب یا اجازه ارسال نیست. این سرویس‌ها به اعتبارنامه و اتصال سرور نیاز دارند؛ اتصال OAuth یا ارسال بیرونی شبیه‌سازی نمی‌شود.",
              )}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {api.state.providers.map((p) => (
              <article key={p.id} className="rounded-3xl bg-[#f8f5ec] p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-[#e3d9ef] p-3 text-[#806391]">
                    {p.id === "gmail" || p.id === "outlook" ? (
                      <Mail size={23} />
                    ) : (
                      <MessageCircle size={23} />
                    )}
                  </span>
                  <h4 className="flex-1 text-lg font-bold">{p.name}</h4>
                  <span className="rounded-full bg-[#e5e1d8] px-3 py-1 text-xs font-bold text-[#91816e]">
                    {t("Not configured", "پیکربندی نشده")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#85778d]">
                  {t(
                    "Requires a server-side provider adapter and account authorization. Live reading and delivery are disabled.",
                    "نیازمند اتصال سمت سرور و مجوز حساب است. خواندن و ارسال زنده غیرفعال است.",
                  )}
                </p>
                <p className="mt-3 text-xs font-semibold text-[#698271]">
                  {agents.filter((a) => a.tools.includes(p.id)).length}{" "}
                  {t(
                    "agents selected this tool",
                    "عامل این ابزار را انتخاب کرده‌اند",
                  )}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-4 rounded-3xl bg-[#dce9e1] p-5">
            <h4 className="text-lg font-bold">LM Studio / Qwen</h4>
            <p className="mt-2 text-sm leading-7">
              {api.state.localModelEnabled
                ? t(
                    "Local model adapter enabled. Enter the loaded model ID in each agent; responses are independently validated.",
                    "اتصال مدل محلی فعال است. شناسه مدل را در تنظیمات عامل وارد کنید؛ خروجی جداگانه اعتبارسنجی می‌شود.",
                  )
                : t(
                    "Local model adapter is disabled. Rules mode works now; enable NABZ_AGENT_LM_STUDIO_ENABLED on the backend when Qwen is ready.",
                    "اتصال مدل محلی غیرفعال است. حالت قواعد اکنون فعال است؛ بعداً NABZ_AGENT_LM_STUDIO_ENABLED را در بک‌اند فعال کنید.",
                  )}
            </p>
          </div>
        </section>
      )}
      {tab === "activity" && api.state && (
        <section className="rounded-3xl bg-[#f8f5eb] p-5">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <History size={20} />
              {t("Agent activity & approvals", "فعالیت عامل و تأییدها")}
            </h3>
            <button
              className={buttonClass}
              onClick={async () => {
                try {
                  const archives: unknown[] = [];
                  let offset = 0,
                    more = true;
                  while (more) {
                    const page = await backend<{
                      entries: unknown[];
                      next: number;
                      hasMore: boolean;
                    }>(`agents/history?offset=${offset}`);
                    archives.push(...page.entries);
                    offset = page.next;
                    more = page.hasMore;
                  }
                  downloadFile(
                    "forma-agent-history.json",
                    JSON.stringify(
                      {
                        runs: api.state!.runs,
                        events: api.state!.events,
                        archives,
                      },
                      null,
                      2,
                    ),
                    "application/json",
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <Download size={15} />
              {t("Export history", "دریافت تاریخچه")}
            </button>
          </header>
          <p className="mb-4 text-sm text-[#87748f]">
            {t(
              "Events include the acting user and timestamp. The latest 20 reviews stay interactive; older reviews are archived and pending previews expire. Export includes the full archive.",
              "رویدادها با کاربر و زمان ثبت می‌شوند. حداکثر ۲۰ بررسی فعال می‌ماند؛ قدیمی‌ترها بایگانی و پیشنهادهای معلق آن‌ها منقضی می‌شوند. خروجی شامل تمام بایگانی است.",
            )}
          </p>
          <div className="space-y-2">
            {api.state.events.slice(0, 100).map((event) => (
              <article
                key={event.id}
                className="flex gap-3 rounded-2xl bg-[#eae3f2] p-4"
              >
                <span className="mt-2 size-2 shrink-0 rounded-full bg-[#8e75b4]" />
                <div className="min-w-0 flex-1">
                  <strong className="text-sm">{event.action}</strong>
                  <p className="mt-1 break-words text-sm leading-6 text-[#7a6888]">
                    {event.detail}
                  </p>
                  <p className="mt-2 text-xs text-[#94809e]">
                    {state.workspaces
                      .flatMap((w) => w.members)
                      .find((m) => m.id === event.actorId)?.name ??
                      event.actorId}{" "}
                    ·{" "}
                    {new Intl.DateTimeFormat(
                      locale === "fa" ? "fa-IR" : "en-US",
                      {
                        timeZone: "Asia/Tehran",
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    ).format(new Date(event.createdAt))}
                  </p>
                </div>
                {event.runId &&
                  api.state!.runs.some((run) => run.id === event.runId) && (
                    <button
                      className="self-start rounded-full bg-white/75 px-3 py-1 text-xs font-bold"
                      onClick={() => {
                        const run = api.state!.runs.find(
                          (r) => r.id === event.runId,
                        );
                        if (run) {
                          setPreview(run.agentId);
                          setPreviewRun(run.id);
                          setTab("agents");
                        }
                      }}
                    >
                      {t("View run", "مشاهده اجرا")}
                    </button>
                  )}
              </article>
            ))}
            {!api.state.events.length && (
              <p className="rounded-2xl bg-[#e2e9df] p-5 text-sm">
                {t(
                  "Your first agent action will appear here.",
                  "اولین فعالیت عامل در اینجا نمایش داده می‌شود.",
                )}
              </p>
            )}
          </div>
        </section>
      )}
      {editing && api.state && (
        <AgentEditor
          agent={editing}
          state={state}
          skills={api.state.skills}
          locale={locale}
          onClose={() => setEditing(null)}
          onSave={saveAgent}
        />
      )}
      {skill && (
        <SkillEditor
          skill={skill}
          locale={locale}
          onClose={() => setSkill(null)}
          onSave={saveSkill}
        />
      )}
      {deleting && api.state && (
        <Modal
          title={t("Remove this agent?", "این عامل حذف شود؟")}
          locale={locale}
          onClose={() => setDeleting(null)}
        >
          <p className="text-base leading-7">
            {deleting.name} ·{" "}
            {t(
              "Run history and prior record changes will remain. Pending proposals will no longer be applicable.",
              "تاریخچه و تغییرات قبلی رکورد باقی می‌مانند. پیشنهادهای معلق دیگر قابل اعمال نیستند.",
            )}
          </p>
          <button
            className={buttonClass + " mt-5"}
            onClick={async () => {
              try {
                await api.command({
                  type: "delete-agent",
                  revision: api.state!.revision,
                  id: deleting.id,
                });
                setDeleting(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {t("Remove agent", "حذف عامل")}
          </button>
        </Modal>
      )}
    </div>
  );
}
