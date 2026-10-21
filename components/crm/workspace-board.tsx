"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowRight,
  AudioLines,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
} from "lucide-react";
import {
  type Lead,
  type LeadStatus,
  type TranscriptLine,
  statusLabels,
  waveform,
} from "@/lib/crm-data";
import LeadDetail, { duration, type LeadDetailProps } from "./lead-detail";

interface Props {
  detail: LeadDetailProps;
  visibleLeads: Lead[];
  statuses: Record<string, LeadStatus>;
  filter: string;
  onFilter: (filter: string) => void;
  query: string;
  onQuery: (query: string) => void;
  onSelect: (id: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  transcriptRef: RefObject<HTMLDivElement | null>;
  shownLines: TranscriptLine[];
  conversationTab: string;
  onConversationTab: (tab: string) => void;
  onExport: () => void;
  assistantQuestion: string;
  onQuestion: (value: string) => void;
  assistantAnswer: string;
  onAsk: (question: string) => void;
}
export default function WorkspaceBoard({
  detail,
  visibleLeads,
  statuses,
  filter,
  onFilter,
  query,
  onQuery,
  onSelect,
  searchRef,
  transcriptRef,
  shownLines,
  conversationTab,
  onConversationTab,
  onExport,
  assistantQuestion,
  onQuestion,
  assistantAnswer,
  onAsk,
}: Props) {
  const [queueExpanded, setQueueExpanded] = useState(true);
  const { lead, locale, phase, seconds } = detail;
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const busy = phase === "calling" || phase === "analyzing";
  return (
    <div className="workspace-grid grid min-w-0 items-start gap-3.5 min-[1200px]:grid-cols-[minmax(0,1fr)_285px] min-[1600px]:grid-cols-[minmax(0,1fr)_320px]">
      <motion.section
        layout
        className="lead-workspace min-w-0 rounded-[25px] bg-[#263149] p-2.5 sm:p-3"
      >
        <div className="workspace-toolbar mb-3 flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
          <h2 className="flex items-center gap-2 text-sm font-medium text-[#d7dddd]">
            <button
              onClick={() => setQueueExpanded(!queueExpanded)}
              aria-expanded={queueExpanded}
              aria-controls="lead-queue"
              aria-label={t(
                queueExpanded ? "Collapse lead list" : "Expand lead list",
                queueExpanded ? "جمع کردن فهرست لیدها" : "باز کردن فهرست لیدها",
              )}
              className="grid size-8 place-items-center rounded-lg bg-white/10 text-[#d7e3e9] hover:bg-white/20"
            >
              {queueExpanded ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </button>
            {t("Lead queue", "صف لیدها")}
          </h2>
          <div
            className="queue-tabs flex max-w-full gap-1 rounded-full bg-[#f4f3df] p-1"
            role="tablist"
            aria-label={t("Lead categories", "دسته‌بندی لیدها")}
          >
            {[
              ["new", t("New leads", "لید جدید")],
              ["followup", t("Follow-up", "نیاز به پیگیری")],
              ["noanswer", t("No answer", "عدم پاسخ")],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={filter === id}
                disabled={busy}
                onClick={() => onFilter(id)}
                className={`relative whitespace-nowrap rounded-full px-2.5 py-2 text-xs transition-colors sm:px-3 ${filter === id ? "text-[#342654]" : "text-[#6b7c83] hover:text-[#243d49]"}`}
              >
                {filter === id && (
                  <motion.span
                    layoutId="queue-category"
                    className="absolute inset-0 rounded-full bg-[#b7ace8]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          <span className="hidden size-7 items-center justify-center rounded-full border border-[#4c575b] text-[#a2b5bd] min-[1400px]:flex">
            <Sparkles size={13} />
          </span>
        </div>
        <motion.div
          layout
          className={
            "grid min-w-0 gap-3 transition-[grid-template-columns] duration-300 " +
            (queueExpanded
              ? "min-[700px]:grid-cols-[185px_minmax(0,1fr)] min-[1600px]:grid-cols-[200px_minmax(0,1fr)]"
              : "min-[700px]:grid-cols-[52px_minmax(0,1fr)]")
          }
        >
          <aside id="lead-queue" className="lead-queue flex min-w-0 flex-col">
            {queueExpanded && (
              <label className="search-field mb-3 flex h-9 items-center gap-2 rounded-xl border border-[#4c575b] px-2.5 text-[#a2b6be]">
                <Search size={14} />
                <input
                  ref={searchRef}
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#e3edf1] outline-none placeholder:text-[#8a9fa8]"
                  value={query}
                  onChange={(e) => onQuery(e.target.value)}
                  placeholder={t("Search leads…", "جست‌وجوی لید…")}
                  aria-label={t("Search leads", "جست‌وجوی لید")}
                />
              </label>
            )}
            <div className="lead-list flex gap-1.5 overflow-x-auto pb-1 min-[700px]:flex-col min-[700px]:overflow-visible">
              <AnimatePresence initial={false} mode="popLayout">
                {visibleLeads.map((item) => (
                  <motion.button
                    layout="position"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    key={item.id}
                    aria-label={item.name[locale]}
                    title={item.name[locale]}
                    onClick={() => onSelect(item.id)}
                    disabled={busy && lead.id !== item.id}
                    className={`lead-row flex shrink-0 items-center gap-2 rounded-xl p-2.5 text-start transition-colors min-[700px]:min-w-0 ${queueExpanded ? "min-w-[180px]" : "justify-center"} ${lead.id === item.id ? "selected bg-[#afa5dc] text-[#27223f]" : "bg-[#323e58] text-[#e4ecef] hover:bg-[#414d69]"}`}
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-white/30 text-xs font-medium text-[#334c58]"
                      style={{ background: item.color }}
                    >
                      {item.initials}
                    </span>
                    {queueExpanded && (
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-medium">
                          {item.name[locale]}
                        </strong>
                        <span
                          className={`mt-1 block truncate text-xs ${lead.id === item.id ? "text-[#494066]" : "text-[#a1b3bd]"}`}
                        >
                          {
                            statusLabels[statuses[item.id] ?? item.status][
                              locale
                            ]
                          }
                        </span>
                      </span>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
              {visibleLeads.length === 0 && (
                <div className="empty-state w-full rounded-xl border border-dashed border-[#556168] p-4 text-center text-sm text-[#bfced5]">
                  <Search size={19} className="mx-auto mb-2" />
                  {t("No leads found", "لیدی پیدا نشد")}
                  {query && (
                    <button
                      className="mt-2 block w-full text-xs text-[#dfff76]"
                      onClick={() => onQuery("")}
                    >
                      {t("Clear search", "پاک کردن جست‌وجو")}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="mt-auto hidden items-center justify-between border-t border-[#465157] px-1 pt-3 text-xs text-[#9aafb9] min-[700px]:flex">
              <span>
                {t(
                  `${visibleLeads.length} leads`,
                  `${visibleLeads.length} لید`,
                )}
              </span>
              <span className="size-1.5 rounded-full bg-[#97c7b4]" />
            </div>
          </aside>
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <LeadDetail key={lead.id} {...detail} />
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.section>
      <AnimatePresence mode="wait" initial={false}>
        <motion.aside
          key={lead.id}
          layout
          className={
            "conversation-card flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#b8b5ce] bg-[#f4f3df] " +
            (shownLines.length
              ? "min-[1200px]:h-[min(680px,calc(100dvh-156px))] min-[1200px]:min-h-[550px]"
              : "min-[1200px]:min-h-[360px]")
          }
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <header className="border-b border-[#d8d4df] p-3.5">
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#ddd5f3] text-[#6551a0]">
                <AudioLines size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium text-[#294555]">
                  {t("Conversation", "گفت‌وگو")}
                </h2>
                <p className="mt-0.5 text-xs text-[#747184]">
                  {t(
                    "Listen. Understand. Connect.",
                    "بشنوید، بشناسید، ارتباط بگیرید.",
                  )}
                </p>
              </div>
              <span
                className={`flex items-center gap-1 text-xs ${phase === "calling" ? "text-[#4e9f73]" : "text-[#8b9faa]"}`}
              >
                <i
                  className={`size-1 rounded-full ${phase === "calling" ? "bg-[#59b081] motion-safe:animate-pulse" : "bg-[#adbdc6]"}`}
                />
                {phase === "calling" ? t("Live", "زنده") : t("Demo", "نمونه")}
              </span>
            </div>
            <div className="conversation-tabs mt-3 flex gap-1 rounded-lg bg-[#e5e1ed] p-1">
              {[
                ["transcript", t("Transcript", "متن مکالمه")],
                ["assistant", t("AI assistant", "دستیار هوشمند")],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => onConversationTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-1 py-2 text-xs transition-colors ${conversationTab === id ? "bg-white text-[#51407d] shadow-sm" : "text-[#736c83]"}`}
                >
                  {id === "transcript" ? (
                    <AudioLines size={12} />
                  ) : (
                    <Sparkles size={12} />
                  )}{" "}
                  {label}
                </button>
              ))}
            </div>
          </header>
          {conversationTab === "transcript" ? (
            <>
              {shownLines.length > 0 && (
                <div className="call-visualizer mx-3.5 mt-3 rounded-xl bg-[#e2dcef] px-3 py-2.5">
                  <div
                    className="flex h-6 items-center justify-center gap-1"
                    aria-hidden="true"
                  >
                    {waveform.slice(0, 26).map((height, i) => (
                      <motion.i
                        key={i}
                        className="w-1 rounded-full bg-[#9b8ac1]"
                        style={{ height: height * 0.75 }}
                        animate={
                          phase === "calling"
                            ? { scaleY: [0.4, 1, 0.6] }
                            : { scaleY: 1 }
                        }
                        transition={
                          phase === "calling"
                            ? {
                                repeat: Infinity,
                                duration: 0.65,
                                delay: i * 0.03,
                              }
                            : { duration: 0.2 }
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between gap-2 text-xs text-[#74628c]">
                    <span>
                      {phase === "calling"
                        ? t("Listening…", "در حال شنیدن…")
                        : t("Previous conversation", "گفت‌وگوی قبلی")}
                    </span>
                    <span dir="ltr" className="tabular-nums">
                      {phase === "calling" ? duration(seconds) : "01:38"}
                    </span>
                  </div>
                </div>
              )}
              <div
                ref={transcriptRef}
                className="transcript-list mt-3 flex max-h-[380px] min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-3 [scrollbar-color:#c2d5df_transparent] [scrollbar-width:thin] min-[1200px]:max-h-none"
                aria-live={phase === "calling" ? "polite" : "off"}
              >
                {shownLines.length === 0 && (
                  <div className="m-auto py-10 text-center">
                    <AudioLines
                      size={28}
                      className="mx-auto mb-3 text-[#8cabbc]"
                    />
                    <h3 className="text-base font-semibold text-[#38586a]">
                      {t("No conversation yet", "هنوز گفت‌وگویی ثبت نشده")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#708995]">
                      {t(
                        "Start a call. The transcript will appear here when you connect.",
                        "تماس را شروع کنید؛ متن گفت‌وگو پس از ارتباط اینجا نمایش داده می‌شود.",
                      )}
                    </p>
                  </div>
                )}
                {shownLines.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: phase === "calling" ? 0 : index * 0.035,
                    }}
                    className={`transcript-bubble rounded-xl border px-3 py-2.5 ${line.speaker === "agent" ? "agent border-[#d9d1e8] bg-[#e8e2f1]" : "client border-[#dbdbc9] bg-white"}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-[#74678d]">
                      <span>
                        {line.speaker === "agent"
                          ? t("You · Negar", "شما · نگار")
                          : lead.name[locale].split(" ")[0]}
                      </span>
                      <time dir="ltr" className="text-[#82778f]">
                        {line.time}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed text-[#49455e]">
                      {line.content[locale]}
                    </p>
                  </motion.div>
                ))}
              </div>
              <footer className="mt-auto flex items-center justify-between gap-2 border-t border-[#d8d4df] px-3.5 py-2.5">
                <span className="text-xs text-[#767184]">
                  {t(
                    "Mock STT · Auto-transcribed",
                    "تبدیل گفتار به متن · نمونه",
                  )}
                </span>
                <button
                  className="grid size-7 place-items-center rounded-full text-[#63849a] hover:bg-[#e5eef3]"
                  aria-label={t("Export transcript", "خروجی متن مکالمه")}
                  onClick={onExport}
                  disabled={shownLines.length === 0}
                >
                  <ArrowDownToLine size={14} />
                </button>
              </footer>
            </>
          ) : (
            <div className="assistant-panel flex min-h-[380px] flex-1 flex-col p-3.5">
              <div className="rounded-xl bg-[#e4deef] p-4">
                <Sparkles size={23} className="text-[#618fac]" />
                <h3 className="mt-3 text-base font-medium text-[#493a68]">
                  {t("A little help, right here.", "کمی کمک، همین‌جا.")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#726480]">
                  {t(
                    "Prepare for objections and find the next step.",
                    "برای اعتراض‌ها آماده شوید و قدم بعدی را پیدا کنید.",
                  )}
                </p>
                <p className="mt-2 text-xs text-[#819aa9]">
                  {t(
                    "Mock responses · LLM not connected",
                    "پاسخ نمونه · مدل زبانی متصل نیست",
                  )}
                </p>
              </div>
              {assistantAnswer && (
                <motion.p
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl bg-white p-3 text-sm leading-relaxed text-[#4e6b7d]"
                >
                  {assistantAnswer}
                </motion.p>
              )}
              <div className="mt-auto space-y-2 pt-4">
                {[
                  t(
                    "How do I handle the price concern?",
                    "چطور به اعتراض قیمت پاسخ بدهم؟",
                  ),
                  t("What is the best next step?", "بهترین قدم بعدی چیست؟"),
                ].map((question) => (
                  <button
                    key={question}
                    className="w-full rounded-lg border border-[#d5e3eb] px-3 py-2 text-start text-xs text-[#648297] hover:bg-[#eaf2f7]"
                    onClick={() => onAsk(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
              <form
                className="mt-3 flex items-center gap-2 rounded-lg border border-[#c8dce7] bg-white p-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  onAsk(assistantQuestion);
                }}
              >
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#47687c] outline-none placeholder:text-[#95a9b5]"
                  value={assistantQuestion}
                  onChange={(e) => onQuestion(e.target.value)}
                  placeholder={t(
                    "Ask about this lead…",
                    "درباره این لید بپرسید…",
                  )}
                  aria-label={t("Ask assistant", "پرسش از دستیار")}
                />
                <button
                  disabled={!assistantQuestion.trim()}
                  aria-label={t("Send question", "ارسال پرسش")}
                  className="text-[#547d97]"
                >
                  <ArrowRight size={16} className="rtl:rotate-180" />
                </button>
              </form>
            </div>
          )}
        </motion.aside>
      </AnimatePresence>
    </div>
  );
}
