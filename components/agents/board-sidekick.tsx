"use client";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Bot,
  ChevronDown,
  History,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import type { CrmState, Entity } from "@/lib/records/types";
import { useSession } from "@/lib/backend";
import { useBoardAgents } from "@/lib/agents/client";
import { businessDay, type AgentRun } from "@/lib/agents/types";
import { entityLabels } from "@/lib/records/seed";
import AgentReportView from "./agent-report";
export default function BoardSidekick({
  state,
  locale,
  entity,
  recordIds,
  initialAgentId = "sidekick",
  initialRunId = "",
  onClose,
  onOpen,
}: {
  state: CrmState;
  locale: Locale;
  entity?: Entity;
  recordIds?: string[];
  initialAgentId?: string;
  initialRunId?: string;
  onClose?: () => void;
  onOpen?: (id: string) => void;
}) {
  const api = useBoardAgents(),
    session = useSession();
  const [agentId, setAgentId] = useState(initialAgentId),
    [skillId, setSkillId] = useState("board-review"),
    [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(initialRunId),
    [localRun, setLocalRun] = useState<AgentRun | null>(null),
    [asOf, setAsOf] = useState(businessDay),
    [controls, setControls] = useState(false);
  const t = (en: string, fa: string) => (locale === "fa" ? fa : en);
  const agents =
    api.state?.config.agents.filter(
      (a) =>
        a.enabled &&
        a.scopes.some(
          (s) =>
            s.workspaceId === state.activeWorkspaceId &&
            (!entity || s.entity === entity),
        ),
    ) ?? [];
  const active = agents.find((a) => a.id === agentId);
  const skillIds =
    agentId === "sidekick"
      ? ["board-review", "risk-scan", "leadership-brief", "follow-up"]
      : (active?.skills ?? []);
  const skills = api.state?.skills.filter((s) => skillIds.includes(s.id)) ?? [];
  const runs =
    api.state?.runs.filter(
      (r) => r.workspaceId === state.activeWorkspaceId && r.agentId === agentId,
    ) ?? [];
  const run =
    runs.find((r) => r.id === selected) ??
    (localRun?.agentId === agentId ? localRun : null) ??
    runs[0];
  async function ask(prompt: string) {
    if (busy || session?.saving) return;
    setBusy(true);
    setError("");
    try {
      const next = await api.command<AgentRun>({
        type: "run",
        agentId,
        skillId: skillIds.includes(skillId) ? skillId : skillIds[0],
        question: prompt,
        locale,
        workspaceId: state.activeWorkspaceId,
        allScopes: !entity && agentId !== "sidekick",
        entity: entity ?? (agentId === "sidekick" ? "tasks" : ""),
        ...(entity && recordIds ? { recordIds } : {}),
        asOf,
      });
      setLocalRun(next);
      setSelected(next.id);
      setQuestion("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function decide(
    runId: string,
    proposalId: string,
    decision: "approve" | "reject",
  ) {
    setBusy(true);
    setError("");
    try {
      const next = await api.command<AgentRun>({
        type: "decide",
        runId,
        proposalId,
        decision,
      });
      setLocalRun(next);
      setSelected(next.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <motion.aside
      initial={{ opacity: 0, x: locale === "fa" ? -18 : 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="min-w-0 self-start overflow-hidden rounded-[26px] border border-white/80 bg-[#faf8f0] text-[#39364e] shadow-sm xl:sticky xl:top-4"
      aria-label={t("Board sidekick", "دستیار برد")}
    >
      <header className="border-b border-[#e5dff0] bg-[#e1d8ef] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#6d58c5] text-white">
            <Bot size={23} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7a639b]">
              {t("Board intelligence", "هوشمندی برد")}
            </p>
            <h2 className="text-xl font-bold">
              {t("Forma Sidekick", "دستیار فرما")}
            </h2>
          </div>
          <button
            aria-label={t("Refresh agent history", "تازه‌سازی تاریخچه عامل")}
            onClick={() => api.refresh().catch((e) => setError(e.message))}
            className="rounded-full bg-white/60 p-2"
          >
            <RefreshCw size={15} />
          </button>
          {onClose && (
            <button
              aria-label={t("Close board sidekick", "بستن دستیار برد")}
              onClick={onClose}
              className="rounded-full bg-white/60 p-2"
            >
              <X size={17} />
            </button>
          )}
        </div>
        <p className="mt-3 text-sm leading-6 text-[#756582]">
          {entity
            ? `${state.workspaces.find((w) => w.id === state.activeWorkspaceId)?.name} · ${entityLabels[entity][locale]} · ${recordIds?.length ?? ""}`
            : t(
                "Use configured board access and a controlled report skill.",
                "بررسی بر اساس دسترسی برد و قالب مهارت انتخابی.",
              )}
        </p>
      </header>
      <div className="space-y-3 border-b border-[#e5dff0] p-4">
        <label className="block text-xs font-bold text-[#7a698a]">
          {t("Agent", "عامل")}
          <select
            aria-label={t("Board agent", "عامل برد")}
            className="mt-1.5 w-full rounded-xl border border-[#d9cde7] bg-white px-3 py-2.5 text-sm text-[#4c405f]"
            value={agentId}
            onChange={(e) => {
              setAgentId(e.target.value);
              setSelected("");
              setLocalRun(null);
              setSkillId("board-review");
            }}
          >
            <option value="sidekick">
              Forma Sidekick · {t("built in", "پیش‌فرض")}
            </option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1 text-xs font-bold text-[#7a698a]">
            {t("Skill / output template", "مهارت / قالب خروجی")}
            <select
              aria-label={t("Run skill", "مهارت اجرا")}
              className="mt-1.5 w-full rounded-xl border border-[#d9cde7] bg-white px-3 py-2.5 text-sm text-[#4c405f]"
              value={skillIds.includes(skillId) ? skillId : (skillIds[0] ?? "")}
              onChange={(e) => setSkillId(e.target.value)}
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {{
                    "board-review": t("Board review", "بررسی برد"),
                    "risk-scan": t("Risk radar", "پایش ریسک"),
                    "leadership-brief": t(
                      "Leadership briefing",
                      "گزارش مدیریتی",
                    ),
                    "follow-up": t("Sales follow-up", "پیگیری فروش"),
                  }[s.id] ?? s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded-xl bg-[#ece5f5] p-3"
            aria-expanded={controls}
            aria-label={t("Review options", "گزینه‌های بررسی")}
            onClick={() => setControls(!controls)}
          >
            <ChevronDown size={16} />
          </button>
        </div>
        {controls && (
          <div className="rounded-xl bg-[#eeeadc] p-3">
            <label className="text-xs font-bold">
              {t("As of (Tehran calendar date)", "تاریخ بررسی (به وقت تهران)")}
              <input
                type="date"
                aria-label={t("Report as of", "تاریخ گزارش")}
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="mt-2 w-full rounded-lg bg-white p-2 text-sm"
              />
            </label>
            <p className="mt-2 text-xs leading-6">
              {active?.model === "lmstudio"
                ? `LM Studio · ${active.modelName}`
                : agentId === "sidekick" && state.ai.mode === "lmstudio"
                  ? `LM Studio · ${state.ai.model}`
                  : t(
                      "Rules mode analyzes actual board data. A local LLM is not used.",
                      "حالت قواعد، داده واقعی برد را بررسی می‌کند؛ مدل زبانی محلی اجرا نمی‌شود.",
                    )}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#5b7a6b]">
          <ShieldCheck size={14} />
          {t(
            "Scoped reads · human-approved changes",
            "خواندن محدود · تغییر با تأیید انسان",
          )}
        </div>
      </div>
      <div className="max-h-[min(68dvh,1100px)] space-y-4 overflow-y-auto p-4 [scrollbar-width:thin]">
        {(error || api.error) && (
          <p
            role="alert"
            className="rounded-2xl bg-[#f2e7c8] p-3 text-sm leading-6 text-[#75613a]"
          >
            {error || api.error}
          </p>
        )}
        {runs.length > 0 && (
          <label className="flex items-center gap-2 text-xs font-bold text-[#7b6d8d]">
            <History size={14} />
            <select
              aria-label={t("Run history", "تاریخچه اجرا")}
              className="min-w-0 flex-1 rounded-lg border border-[#e1d6eb] bg-white p-2 text-xs"
              value={run?.id ?? ""}
              onChange={(e) => {
                setSelected(e.target.value);
                setLocalRun(null);
              }}
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Intl.DateTimeFormat(
                    locale === "fa" ? "fa-IR" : "en-US",
                    {
                      timeZone: "Asia/Tehran",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  ).format(new Date(r.createdAt))}{" "}
                  · {r.question || r.skillId}
                </option>
              ))}
            </select>
          </label>
        )}
        {run && (
          <div className="ms-5 rounded-2xl bg-[#eae3f4] px-4 py-3 text-sm leading-6">
            {run.question || t("Review this board", "این برد را بررسی کن")}
          </div>
        )}
        {busy ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl bg-[#e3ece5] p-4 text-sm text-[#527261]"
          >
            <LoaderCircle size={18} className="animate-spin" />
            {t(
              "Working with authorized board data…",
              "در حال بررسی داده‌های مجاز برد…",
            )}
          </div>
        ) : run ? (
          <AgentReportView
            key={run.id + run.proposals.map((p) => p.state).join()}
            run={run}
            state={state}
            locale={locale}
            busy={busy || !!session?.saving}
            onDecision={decide}
            onOpen={onOpen}
          />
        ) : (
          <div className="rounded-2xl bg-[#edf0e2] p-5">
            <Sparkles size={25} className="text-[#729a83]" />
            <h3 className="mt-3 text-lg font-bold">
              {t(
                "A clear picture, with evidence",
                "تصویری روشن، همراه با منبع",
              )}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#6d7f71]">
              {t(
                "Review progress, spot deadline risks and read update threads. Every suggested change stays a preview until a person approves it.",
                "پیشرفت، ریسک موعدها و گفتگوها را بررسی کنید. هر تغییر پیشنهادی تا تأیید یک نفر، فقط پیش‌نمایش است.",
              )}
            </p>
            <button
              disabled={!api.state || busy || session?.saving}
              className="mt-4 w-full rounded-full bg-[#6851c5] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              onClick={() =>
                ask(
                  t(
                    "Review this board and recommend next steps",
                    "این برد را بررسی کن و قدم بعدی پیشنهاد بده",
                  ),
                )
              }
            >
              {t("Review this board", "بررسی این برد")}
            </button>
          </div>
        )}
      </div>
      <form
        className="border-t border-[#e4dcef] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-[#cebedf] bg-white p-3">
          <textarea
            rows={2}
            value={question}
            aria-label={t("Ask board sidekick", "پرسش از دستیار برد")}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("Ask about this board…", "درباره این برد بپرسید…")}
            className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[#a392b5]"
          />
          <button
            aria-label={t("Send board question", "ارسال پرسش برد")}
            disabled={!question.trim() || busy || !api.state || session?.saving}
            className="rounded-full bg-[#6851c5] p-2.5 text-white disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#8a7b99]">
          {t(
            "Record writes need explicit approval. External tools are disconnected.",
            "تغییر رکورد نیاز به تأیید دارد. ابزارهای بیرونی متصل نیستند.",
          )}
        </p>
      </form>
    </motion.aside>
  );
}
