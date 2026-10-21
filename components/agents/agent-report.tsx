"use client";
import { downloadFile } from "../records/ui";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clipboard,
  Clock3,
  FileCheck2,
  Link2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import type { CrmState } from "@/lib/records/types";
import { stageLabels } from "@/lib/records/seed";
import { currentRole } from "@/lib/records/model";
import type { AgentRun, AgentSource } from "@/lib/agents/types";
import { fieldLabels } from "@/lib/agents/types";
export default function AgentReportView({
  run,
  state,
  locale,
  busy,
  onDecision,
  onOpen,
}: {
  run: AgentRun;
  state: CrmState;
  locale: Locale;
  busy: boolean;
  onDecision: (
    runId: string,
    proposalId: string,
    decision: "approve" | "reject",
  ) => void;
  onOpen?: (id: string) => void;
}) {
  const [all, setAll] = useState(false),
    [evidence, setEvidence] = useState<AgentSource | null>(null),
    [copied, setCopied] = useState(false);
  const t = (en: string, fa: string) => (locale === "fa" ? fa : en);
  const writable = currentRole(state) !== "viewer";
  const sources = run.report.sources ?? [];
  const sourceButton = (id: string) => {
    const source = sources.find((s) => s.id === id);
    if (!source) return null;
    return (
      <button
        key={id}
        className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-xs font-semibold text-[#5f5388] hover:bg-white"
        onClick={() => {
          if (source.workspaceId === state.activeWorkspaceId && onOpen)
            onOpen(id);
          else setEvidence(source);
        }}
        title={source.name}
      >
        <Link2 size={11} />
        <span className="truncate">{source.name}</span>
      </button>
    );
  };
  function display(field: string, value: string) {
    if (!value) return t("Not set", "تعیین نشده");
    if (field === "ownerId")
      return (
        state.workspaces.flatMap((w) => w.members).find((m) => m.id === value)
          ?.name ?? value
      );
    if (field === "stage") return stageLabels[value]?.[locale] ?? value;
    return value;
  }
  if (run.status === "failed")
    return (
      <div
        role="alert"
        className="rounded-2xl bg-[#f2e7c8] p-4 text-base leading-7 text-[#695b38]"
      >
        <strong>{t("This run could not complete", "این اجرا کامل نشد")}</strong>
        <p>{run.error}</p>
        <p className="mt-2 text-sm">
          {t(
            "No record was changed. Fix the connection and run again.",
            "رکوردی تغییر نکرد. اتصال را بررسی و دوباره اجرا کنید.",
          )}
        </p>
      </div>
    );
  const report = run.report,
    findings = all ? report.findings : report.findings.slice(0, 6);
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 space-y-4"
    >
      <header className="rounded-2xl bg-[#e6def4] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#696087]">
          <span className="rounded-full bg-white/65 px-2 py-1">
            {run.mode === "lmstudio" ? "LM Studio" : "Rules / Mock"}
          </span>
          <span>{report.asOf}</span>
        </div>
        <h3 className="text-lg font-bold text-[#39344f]">{report.title}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#625974]">
          {report.summary}
        </p>
        <button
          aria-label={t("Copy briefing", "کپی گزارش")}
          className="mt-3 flex items-center gap-2 text-sm font-bold text-[#625087]"
          onClick={async () => {
            const text = [
              report.title,
              report.summary,
              ...report.findings.map((f) => `${f.title}: ${f.detail}`),
              ...report.nextActions.map((a) => `${a.title}: ${a.detail}`),
            ].join("\n\n");
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            } catch {
              downloadFile("forma-briefing.txt", text, "text/plain");
            }
          }}
        >
          <Clipboard size={14} />
          {copied ? t("Copied", "کپی شد") : t("Copy briefing", "کپی گزارش")}
        </button>
      </header>
      {report.sections.includes("snapshot") && (
        <section className="rounded-2xl bg-[#f2efdb] p-4">
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold">
            <Sparkles size={15} />
            {t("Overall snapshot", "نمای کلی")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              [
                t("Visible records", "رکورد قابل مشاهده"),
                report.snapshot.total,
              ],
              [
                t("Complete / closed", "کامل / بسته"),
                report.snapshot.statusVisible ? report.snapshot.completed : "—",
              ],
              [
                t("In progress", "در حال انجام"),
                report.snapshot.statusVisible
                  ? report.snapshot.inProgress
                  : "—",
              ],
              [
                t("Not started", "شروع نشده"),
                report.snapshot.statusVisible
                  ? report.snapshot.notStarted
                  : "—",
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/70 p-3">
                <span className="text-xs text-[#756d7d]">{label}</span>
                <strong className="mt-1 block text-2xl text-[#3c3b52]">
                  {value}
                </strong>
              </div>
            ))}
          </div>
          {!report.snapshot.statusVisible && (
            <p className="mt-3 text-xs leading-6">
              {t(
                "Status is hidden by this agent's access policy.",
                "وضعیت در دسترسی این عامل مجاز نیست.",
              )}
            </p>
          )}
        </section>
      )}
      {report.sections.includes("progress") &&
        report.snapshot.statusVisible &&
        report.snapshot.total > 0 && (
          <section className="rounded-2xl bg-[#dce9e1] p-4">
            <h4 className="mb-3 text-base font-bold">
              {t("Progress", "پیشرفت")}
            </h4>
            <div className="h-3 overflow-hidden rounded-full bg-white/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(report.snapshot.completed / report.snapshot.total) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 110, damping: 22 }}
                className="h-full rounded-full bg-[#6e9f8b]"
              />
            </div>
            <p className="mt-2 text-sm text-[#567365]">
              {report.snapshot.completed} / {report.snapshot.total}{" "}
              {t("closed", "بسته")}
            </p>
          </section>
        )}
      {report.sections.includes("risks") && (
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold">
            <FileCheck2 size={17} />
            {t("Risks & blockers", "ریسک‌ها و موانع")}
            <span className="rounded-full bg-[#e8def3] px-2 py-0.5 text-sm">
              {report.findings.length}
            </span>
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {findings.map((f, index) => (
                <motion.div
                  key={`${f.kind}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.24) }}
                  className={`rounded-2xl border border-white/80 p-3.5 ${f.severity === "high" ? "bg-[#f1e8c9]" : "bg-[#e9e4f3]"}`}
                >
                  <span className="mb-1 inline-block rounded-full bg-white/65 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#776685]">
                    {{
                      overdue: t("Overdue", "گذشته از موعد"),
                      dependency: t("Dependency", "پیش‌نیاز"),
                      blocker: t("Update signal", "نشانه در گفتگو"),
                      unassigned: t("Ownership", "مسئولیت"),
                      risk: t("Risk", "ریسک"),
                      info: t("Note", "نکته"),
                    }[f.kind] ?? f.kind}
                  </span>
                  <h5 className="text-sm font-bold text-[#48415b]">
                    {f.title}
                  </h5>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#6c6178]">
                    {f.detail}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {f.sourceIds.map(sourceButton)}
                    {f.commentIds.length > 0 && (
                      <span className="px-1 text-xs text-[#786c87]">
                        {t("Update thread cited", "ارجاع به گفتگو")}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!report.findings.length && (
              <p className="rounded-2xl bg-[#dce9e1] p-4 text-sm leading-6">
                {t(
                  "No signals found in the data this agent may read.",
                  "در داده‌های مجاز برای این عامل، نشانه‌ای پیدا نشد.",
                )}
              </p>
            )}
          </div>
          {report.findings.length > 6 && (
            <button
              className="mt-3 flex items-center gap-1 text-sm font-bold text-[#766291]"
              onClick={() => setAll(!all)}
            >
              <ChevronDown size={14} />
              {all
                ? t("Show less", "نمایش کمتر")
                : t("Show all findings", "همه یافته‌ها")}
            </button>
          )}
        </section>
      )}
      {report.sections.includes("actions") && (
        <section className="rounded-2xl bg-[#f3f0e1] p-4">
          <h4 className="mb-2 text-base font-bold">
            {t("Recommended next actions", "قدم‌های بعدی پیشنهادی")}
          </h4>
          {report.nextActions.map((a, i) => (
            <div
              key={i}
              className="border-b border-[#d9d3be]/60 py-3 last:border-0"
            >
              <strong className="text-sm">{a.title}</strong>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#746a7d]">
                {a.detail}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {a.sourceIds.map(sourceButton)}
              </div>
            </div>
          ))}
        </section>
      )}
      {run.proposals.length > 0 && (
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-base font-bold">
            <ShieldCheck size={17} />
            {t("Review proposed changes", "بررسی تغییرات پیشنهادی")}
          </h4>
          <p className="mb-3 text-sm leading-6 text-[#756a84]">
            {t(
              "Nothing changes until you approve an exact preview.",
              "تا پیش‌نمایش دقیق را تأیید نکنید، چیزی تغییر نمی‌کند.",
            )}
          </p>
          <div className="space-y-3">
            {run.proposals.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[#c5b5df] bg-[#eee8f7] p-4"
              >
                <strong className="text-base">{p.recordName}</strong>
                <p className="mt-1 text-xs font-bold text-[#81718d]">
                  {fieldLabels[p.field][locale]}
                </p>
                <div className="my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <span className="break-words rounded-lg bg-white/65 p-2 text-[#756a80]">
                    {display(p.field, p.before)}
                  </span>
                  <ArrowUpRight size={15} />
                  <strong className="break-words rounded-lg bg-[#dce9e1] p-2 text-[#426856]">
                    {display(p.field, p.after)}
                  </strong>
                </div>
                <p className="text-sm leading-6 text-[#6e617d]">{p.reason}</p>
                {p.state === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busy || !writable}
                      aria-label={`Approve ${p.recordName} ${p.field}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#6551c9] px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
                      onClick={() => onDecision(run.id, p.id, "approve")}
                    >
                      <Check size={14} />
                      {t("Approve change", "تأیید تغییر")}
                    </button>
                    <button
                      disabled={busy || !writable}
                      aria-label={`Reject ${p.recordName} ${p.field}`}
                      className="rounded-full bg-white px-3 py-2 text-sm font-bold disabled:opacity-40"
                      onClick={() => onDecision(run.id, p.id, "reject")}
                    >
                      {t("Reject", "رد")}
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-2 rounded-lg bg-white/70 p-2 text-sm font-bold">
                    <Clock3 size={14} />
                    {
                      {
                        expired: t(
                          "Archived — run a fresh review",
                          "بایگانی شده؛ دوباره بررسی کنید",
                        ),
                        approved: t("Approved & applied", "تأیید و اعمال شد"),
                        rejected: t("Rejected", "رد شد"),
                        conflict: t(
                          "Stale or permission changed — run a fresh review",
                          "داده یا دسترسی تغییر کرده؛ دوباره بررسی کنید",
                        ),
                      }[p.state]
                    }
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <details className="rounded-2xl bg-white/70 p-3">
        <summary className="cursor-pointer text-sm font-bold">
          {sources.length} {t("board sources", "منبع از برد")}
        </summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {sources.map((s) => sourceButton(s.id))}
        </div>
        <p className="mt-3 text-xs leading-6 text-[#81728d]">
          {t(
            "Read from the server at run time. Record text is evidence, not an instruction. Hidden reasoning is not displayed.",
            "داده‌ها هنگام اجرا از سرور خوانده شدند. متن رکوردها منبع بررسی است، نه دستور اجرا.",
          )}
        </p>
      </details>
      {evidence && (
        <section className="rounded-2xl bg-[#e2e9e2] p-4">
          <header className="flex items-center gap-2">
            <h4 className="flex-1 font-bold">{evidence.name}</h4>
            <button
              aria-label={t("Close evidence", "بستن منبع")}
              onClick={() => setEvidence(null)}
            >
              <X size={17} />
            </button>
          </header>
          <p className="mt-2 text-xs">
            {t("Authorized source snapshot", "نسخه مجاز منبع هنگام اجرا")}
          </p>
          <dl className="mt-2 space-y-2 text-sm">
            {Object.entries(evidence.fields).map(([k, v]) => (
              <div key={k} className="grid grid-cols-2 gap-2">
                <dt className="font-bold">
                  {fieldLabels[k as keyof typeof fieldLabels]?.[locale] ?? k}
                </dt>
                <dd className="break-words">
                  {Array.isArray(v) ? v.join(", ") : String(v ?? "")}
                </dd>
              </div>
            ))}
          </dl>
          {evidence.comments.map((c) => (
            <p
              key={c.id}
              className="mt-2 whitespace-pre-wrap rounded-xl bg-white/65 p-3 text-sm leading-6"
            >
              {c.body}
            </p>
          ))}
        </section>
      )}
    </motion.article>
  );
}
