"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Headphones,
  History,
  Layers,
  MessageCircle,
  MessageSquare,
  Pause,
  Pencil,
  Phone,
  PhoneOff,
  Play,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  type Lead,
  type LeadStatus,
  type Locale,
  statusLabels,
  waveform,
} from "@/lib/crm-data";
import ScoreGauge from "./score-gauge";

export type CallPhase = "idle" | "calling" | "analyzing" | "analyzed";
export interface Activity {
  id: string;
  title: { en: string; fa: string };
  detail: { en: string; fa: string };
}
export function duration(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
export interface LeadDetailProps {
  lead: Lead;
  locale: Locale;
  phase: CallPhase;
  seconds: number;
  onCall: () => void;
  onMessage: (channel: "WhatsApp" | "SMS") => void;
  note?: string;
  onNote: (note: string) => void;
  activities: Activity[];
  recordingIds: string[];
  hasAnalysis: boolean;
  status: LeadStatus;
  onStatus: (status: LeadStatus) => void;
  onNext: () => void;
  scheduled: boolean;
  onSchedule: () => void;
}

export function RecordingPlayer({ locale }: { locale: Locale }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [length, setLength] = useState(0);
  const [error, setError] = useState(false);
  const attachAudio = useCallback((element: HTMLAudioElement | null) => {
    audio.current = element;
    if (element && Number.isFinite(element.duration))
      setLength(element.duration);
  }, []);
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  return (
    <div className="recording-player min-w-0">
      <audio
        ref={attachAudio}
        src="/audio/demo-call.wav"
        preload="metadata"
        onLoadedMetadata={() => setLength(audio.current?.duration ?? 0)}
        onTimeUpdate={() => setProgress(audio.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />
      <div className="flex items-center gap-2.5">
        <button
          className="play-button grid size-9 shrink-0 place-items-center rounded-full bg-[#203945] text-white transition-colors hover:bg-[#315769]"
          aria-label={
            playing
              ? t("Pause recording", "توقف ضبط")
              : t("Play demo recording", "پخش نمونه ضبط")
          }
          onClick={async () => {
            if (!audio.current) return;
            if (playing) {
              audio.current.pause();
              setPlaying(false);
            } else {
              try {
                await audio.current.play();
                setPlaying(true);
              } catch {
                setError(true);
              }
            }
          }}
        >
          {playing ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <strong className="block text-sm font-medium text-[#263e49]">
            {t("Discovery call", "تماس آشنایی")}
          </strong>
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-xs text-[#70818a]">
              {error
                ? t("Audio unavailable", "صدا در دسترس نیست")
                : t("Sample recording", "نمونه ضبط تماس")}
            </span>
            <span className="text-xs tabular-nums text-[#627580]" dir="ltr">
              {duration(Math.floor(playing ? progress : length))}
            </span>
          </div>
        </div>
        <a
          className="grid size-7 shrink-0 place-items-center rounded-full text-[#536d7b] hover:bg-[#e1ebef]"
          href="/audio/demo-call.wav"
          download
          aria-label={t("Download demo recording", "دانلود نمونه ضبط")}
        >
          <ArrowDownToLine size={14} />
        </a>
      </div>
      <div
        className="waveform mt-2 flex h-7 items-center justify-between gap-0.5 overflow-hidden"
        aria-hidden="true"
      >
        {waveform.map((height, i) => (
          <motion.i
            key={i}
            className="w-1 flex-1 rounded-full bg-[#b9ced8]"
            style={{
              height,
              background:
                length && i / waveform.length < progress / length
                  ? "#527d94"
                  : undefined,
            }}
            animate={playing ? { scaleY: [0.5, 1, 0.6] } : { scaleY: 1 }}
            transition={
              playing
                ? { repeat: Infinity, duration: 0.7, delay: i * 0.025 }
                : { duration: 0.2 }
            }
          />
        ))}
      </div>
    </div>
  );
}

function RecordingsMenu({
  locale,
  recordingIds,
}: {
  locale: Locale;
  recordingIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={root} className="recordings-menu flex min-w-0">
      <button
        ref={trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="lead-recordings"
        aria-label={t("Call recordings", "صداهای ضبط‌شده")}
        className={
          "flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors " +
          (open
            ? "border-[#8173d2] bg-[#dad3ff] text-[#493b99]"
            : "border-[#c5bfdc] bg-[#eeeaf7] text-[#4c456b] hover:bg-[#ddd6f5]")
        }
      >
        <Headphones size={18} />
        <span className="hidden @min-[620px]:inline">
          {t("Recordings", "ضبط تماس‌ها")}
        </span>
        <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-xs">
          {recordingIds.length}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="lead-recordings"
            role="dialog"
            aria-label={t("Call recordings", "صداهای ضبط‌شده")}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.97 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="recordings-overlay absolute end-0 top-[calc(100%+8px)] z-50 w-[360px] max-w-full rounded-2xl border border-[#cbc5df] bg-[#f9f8f1] p-4 shadow-[0_20px_60px_-12px_#262d5055]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#282c45]">
                  {t("Call recordings", "صداهای ضبط‌شده")}
                </h3>
                <p className="mt-1 text-xs text-[#696b80]">
                  {t("This lead · Sample audio", "این لید · صدای نمونه")}
                </p>
              </div>
              <button
                ref={close}
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
                aria-label={t("Close recordings", "بستن ضبط تماس‌ها")}
                className="grid size-8 place-items-center rounded-full bg-[#e8e4f4] text-[#514775] hover:bg-[#d8d0ed]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[300px] space-y-3 overflow-y-auto [scrollbar-width:thin]">
              {recordingIds.length ? (
                recordingIds.map((id, i) => (
                  <div
                    key={id}
                    className="rounded-xl border border-[#e0ddeb] bg-white p-3"
                  >
                    <p className="mb-2 text-xs font-semibold text-[#786b9d]">
                      {t("Recording", "ضبط تماس")} {i + 1}
                    </p>
                    <RecordingPlayer locale={locale} />
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-[#eeebf5] p-4 text-sm leading-relaxed text-[#68607d]">
                  {t(
                    "No answered calls recorded yet.",
                    "هنوز تماس پاسخ‌داده‌شده‌ای ضبط نشده است.",
                  )}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LeadDetail({
  lead,
  locale,
  phase,
  seconds,
  onCall,
  onMessage,
  note,
  onNote,
  activities,
  recordingIds,
  hasAnalysis,
  status,
  onStatus,
  onNext,
  scheduled,
  onSchedule,
}: LeadDetailProps) {
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const reducedMotion = useReducedMotion();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.055,
        delayChildren: reducedMotion ? 0 : 0.03,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.18,
        staggerChildren: reducedMotion ? 0 : 0.025,
        staggerDirection: -1,
        when: "afterChildren",
      },
    },
  };
  const card: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      y: reducedMotion ? 0 : -7,
      transition: { duration: reducedMotion ? 0 : 0.14 },
    },
  };
  return (
    <motion.div
      layout
      transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
      className="lead-detail @container relative min-w-0 rounded-[20px] bg-[#d2cee8] p-3 text-[#292d44]"
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.header variants={card} className="lead-identity px-1 pb-3">
        <div className="identity-main grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3 @min-[500px]:grid-cols-[40px_minmax(0,1fr)_auto]">
          <div className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-white/45 bg-[#dbe6e9] text-sm font-medium text-[#254250]">
            {lead.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-[#132c3b]">
                {lead.name[locale]}
              </h2>
              <span className="hidden text-xs text-[#254656] sm:inline">
                {lead.id}
              </span>
            </div>
            <div className="contact-row mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#213f50]">
              <span dir="ltr" className="whitespace-nowrap">
                {lead.phone}
              </span>
              {lead.email && <span dir="ltr">{lead.email}</span>}
              <span className="hidden h-3 w-px bg-[#466a7c]/35 sm:block" />
              <span>{lead.source[locale]}</span>
              <span className="rounded bg-white/15 px-1.5 py-0.5">
                {lead.interest[locale]}
              </span>
            </div>
          </div>
          <div className="status-select col-start-2 w-fit @min-[500px]:col-start-3 @min-[500px]:row-start-1 flex shrink-0 items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2 py-1.5">
            <span className="size-1.5 rounded-full bg-[#6150e7]" />
            <select
              className="max-w-[104px] appearance-none bg-transparent text-xs text-[#183646] outline-none"
              aria-label={t("Lead status", "وضعیت لید")}
              value={status}
              onChange={(e) => onStatus(e.target.value as LeadStatus)}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label[locale]}
                </option>
              ))}
            </select>
            <ChevronDown size={12} />
          </div>
        </div>
      </motion.header>
      <motion.div
        variants={card}
        layout
        className="contact-actions relative z-20 mb-3 flex flex-wrap gap-2"
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          className={`call-button flex min-h-11 min-w-[145px] max-w-[250px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium shadow-sm transition-colors ${phase === "calling" ? "bg-[#29354c] text-white" : "bg-[#6150e7] text-white hover:bg-[#5140d1]"}`}
          onClick={onCall}
          disabled={phase === "analyzing"}
        >
          {phase === "calling" ? <PhoneOff size={17} /> : <Phone size={17} />}
          <span>
            {phase === "calling"
              ? t("End call", "پایان تماس")
              : phase === "analyzing"
                ? t("Analyzing…", "در حال تحلیل…")
                : t("Start a call", "شروع تماس")}
          </span>
          <span className="ms-auto hidden text-xs font-normal opacity-65 sm:inline">
            {phase === "calling"
              ? duration(seconds)
              : t("DEMO VOIP", "نمونه ویپ")}
          </span>
        </motion.button>
        <RecordingsMenu locale={locale} recordingIds={recordingIds} />
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#bdb7d4] bg-[#f4f3df] px-3 text-sm font-medium text-[#494460] hover:bg-[#e8e2f7]"
          aria-label={t("WhatsApp", "واتس‌اپ")}
          onClick={() => onMessage("WhatsApp")}
        >
          <MessageCircle size={17} />
          <span className="hidden @min-[620px]:inline">
            {t("WhatsApp", "واتس‌اپ")}
          </span>
        </button>
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#bdb7d4] bg-[#f4f3df] px-3 text-sm font-medium text-[#494460] hover:bg-[#e8e2f7]"
          aria-label={t("SMS", "پیامک")}
          onClick={() => onMessage("SMS")}
        >
          <MessageSquare size={17} />
          <span className="hidden @min-[620px]:inline">
            {t("SMS", "پیامک")}
          </span>
        </button>
      </motion.div>
      <motion.div
        layout
        className="detail-grid grid grid-cols-1 items-start gap-2.5 @min-[500px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
      >
        <motion.section
          layout
          transition={{
            layout: { type: "spring", stiffness: 260, damping: 30 },
          }}
          variants={card}
          className="scenario-block rounded-[16px] bg-[#b3a9e3] p-4 @min-[500px]:col-start-1 @min-[500px]:row-start-1"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <Layers
                size={15}
                className="box-content rounded-lg bg-[#7363bc] p-1.5 text-[#fbf9ff]"
              />
              {t("Conversation plan", "سناریوی گفت‌وگو")}
            </h3>
            <span className="rounded-md bg-[#ddd5fa] px-1.5 py-1 text-xs text-[#514378]">
              {t("AI draft", "پیش‌نویس")}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[#383250]">
            {lead.scenario[locale]}
          </p>
        </motion.section>
        <AnimatePresence mode="popLayout">
          {hasAnalysis && (
            <motion.section
              layout
              transition={{
                layout: { type: "spring", stiffness: 260, damping: 30 },
              }}
              variants={card}
              key="analysis"
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="score-card flex h-full items-center gap-3 rounded-[16px] bg-[#8bb4a6] p-4 @min-[500px]:col-start-2 @min-[500px]:row-start-1"
            >
              <div className="w-[120px] shrink-0">
                <ScoreGauge score={lead.score} locale={locale} />
              </div>
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Sparkles size={17} className="text-[#527a90]" />
                  {t("Lead potential", "پتانسیل لید")}
                </h3>
                <p className="mt-1 text-sm text-[#264e44]">
                  {t(
                    "Positive intent · Follow up",
                    "تمایل مثبت · نیاز به پیگیری",
                  )}
                </p>
                <p className="mt-1 text-xs text-[#365b51]">
                  {t(
                    "Completed call · Sample analysis",
                    "تماس پاسخ‌داده‌شده · تحلیل نمونه",
                  )}
                </p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        <motion.section
          layout
          transition={{
            layout: { type: "spring", stiffness: 260, damping: 30 },
          }}
          variants={card}
          className={
            "note-block h-full rounded-[16px] bg-[#f4f3df] p-4 " +
            (hasAnalysis
              ? "@min-[500px]:col-start-1 @min-[500px]:row-start-2"
              : "@min-[500px]:col-start-2 @min-[500px]:row-start-1")
          }
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <FileText
                size={15}
                className="box-content rounded-lg bg-[#ddd9ba] p-1.5 text-[#5b583b]"
              />
              {t("Notes & summary", "یادداشت و خلاصه")}
            </h3>
            <button
              className="flex items-center gap-1 text-xs text-[#557589] hover:text-[#1c4053]"
              onClick={() => {
                setDraft(note ?? (hasAnalysis ? lead.note[locale] : ""));
                setEditing(true);
              }}
            >
              <Pencil size={12} />
              {t("Edit", "ویرایش")}
            </button>
          </div>
          {editing ? (
            <div>
              <textarea
                autoFocus
                className="w-full resize-y rounded-lg border border-[#adc4d1] bg-white/65 p-2 text-sm leading-relaxed"
                rows={3}
                aria-label={t("Lead notes", "یادداشت لید")}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="mt-1 flex gap-2">
                <button
                  className="flex items-center gap-1 rounded-md bg-[#264c60] px-2 py-1 text-xs text-white"
                  onClick={() => {
                    onNote(draft);
                    setEditing(false);
                  }}
                >
                  <Check size={12} />
                  {t("Save note", "ذخیره")}
                </button>
                <button
                  className="px-2 py-1 text-xs text-[#547083]"
                  onClick={() => setEditing(false)}
                >
                  {t("Cancel", "انصراف")}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-[#535063]">
              {note ??
                (hasAnalysis
                  ? lead.note[locale]
                  : t(
                      "No call summary yet. Add a note to prepare for the conversation.",
                      "هنوز خلاصه تماسی ثبت نشده است. برای آمادگی گفت‌وگو یادداشت اضافه کنید.",
                    ))}
            </p>
          )}
        </motion.section>
        <motion.section
          layout
          transition={{
            layout: { type: "spring", stiffness: 260, damping: 30 },
          }}
          variants={card}
          className={
            "activity-timeline rounded-[16px] bg-[#29354c] p-4 " +
            (hasAnalysis
              ? "h-full @min-[500px]:col-start-2 @min-[500px]:row-start-2 @min-[500px]:row-span-2"
              : "@min-[500px]:col-span-2")
          }
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#f4f3df]">
            <History
              size={15}
              className="box-content rounded-lg bg-[#46526b] p-1.5 text-[#b9afd8]"
            />
            {t("Recent activity", "آخرین فعالیت‌ها")}
          </h3>
          <div
            className={
              "max-h-[300px] overflow-y-auto pe-1 [scrollbar-width:thin] " +
              (hasAnalysis ? "space-y-4" : "flex flex-wrap gap-x-8 gap-y-4")
            }
          >
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#8eaf46]" />
                <div>
                  <strong className="block text-sm font-medium text-[#f0eef8]">
                    {activity.title[locale]}
                  </strong>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#bec6d8]">
                    {activity.detail[locale]}
                  </p>
                </div>
              </div>
            ))}
            {hasAnalysis &&
              lead.status !== "new" &&
              lead.status !== "noanswer" && (
                <div className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#769caf]" />
                  <div>
                    <strong className="block text-sm font-medium text-[#f0eef8]">
                      {t(
                        "Discovery call · In negotiation",
                        "تماس آشنایی · در حال مذاکره",
                      )}
                    </strong>
                    <span className="text-xs text-[#bec6d8]">
                      {t("Yesterday · 14:30", "دیروز · ۱۴:۳۰")}
                    </span>
                    <p className="mt-2 text-sm leading-relaxed text-[#bec6d8]">
                      {lead.note[locale]}
                    </p>
                  </div>
                </div>
              )}
            {lead.status === "noanswer" && (
              <div className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c0cbd1]" />
                <div>
                  <strong className="block text-sm font-medium text-[#f0eef8]">
                    {t("First call · No answer", "تماس اول · بدون پاسخ")}
                  </strong>
                  <span className="text-xs text-[#bec6d8]">
                    {t("Oct 18 · 11:45", "۲۶ مهر · ۱۱:۴۵")}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c0cbd1]" />
              <div>
                <strong className="block text-sm font-medium text-[#f0eef8]">
                  {t("Lead assigned to Negar", "لید به نگار ارجاع شد")}
                </strong>
                <span className="text-xs text-[#bec6d8]">
                  {lead.source[locale]}
                </span>
              </div>
            </div>
          </div>
        </motion.section>
        <motion.section
          layout
          transition={{
            layout: { type: "spring", stiffness: 260, damping: 30 },
          }}
          variants={card}
          className={
            "next-action grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[16px] bg-[#e5e0f6] p-3 " +
            (hasAnalysis
              ? "@min-[500px]:col-start-1 @min-[500px]:row-start-3"
              : "@min-[500px]:col-span-2 @min-[500px]:grid-cols-[auto_minmax(0,1fr)_auto]")
          }
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#d3c9f2] text-[#6855a1]">
            <Sparkles size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-[#3c315b]">
              {t("A clear next step", "قدم بعدی روشن")}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[#665b7d]">
              {hasAnalysis
                ? t(
                    "Send the schedule & payment plan. Follow up tomorrow.",
                    "برنامه کلاس و شرایط پرداخت را بفرستید؛ فردا پیگیری کنید.",
                  )
                : t(
                    "Start a conversation to understand their needs.",
                    "برای شناخت نیازها، گفت‌وگو را شروع کنید.",
                  )}
            </p>
          </div>
          <button
            className={
              "col-start-2 w-fit flex items-center gap-1.5 rounded-lg border border-[#b5a5d8] bg-white/25 px-2.5 py-2 text-xs text-[#584278] hover:bg-white/50 " +
              (!hasAnalysis
                ? "@min-[500px]:col-start-3 @min-[500px]:row-start-1"
                : "")
            }
            onClick={onSchedule}
            disabled={scheduled}
          >
            {scheduled ? <Check size={13} /> : <Plus size={13} />}{" "}
            {scheduled
              ? t("Scheduled", "ثبت شد")
              : t("Follow up", "ثبت پیگیری")}
          </button>
        </motion.section>
      </motion.div>
      <motion.footer
        variants={card}
        className="flex items-center justify-between gap-2 px-1 pt-2.5 text-xs text-[#244757]"
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${phase === "calling" ? "bg-[#b9aaff] motion-safe:animate-pulse" : "bg-[#83b5a2]"}`}
          />
          {phase === "calling"
            ? t("Demo call in progress", "تماس نمایشی در جریان")
            : t("Ready to connect", "آماده گفت‌وگو")}
        </span>
        <button
          className="flex items-center gap-1.5 hover:text-[#102e3e]"
          disabled={phase === "calling" || phase === "analyzing"}
          onClick={onNext}
        >
          {t("Next lead", "لید بعدی")}
          <ArrowRight size={13} className="rtl:rotate-180" />
        </button>
      </motion.footer>
    </motion.div>
  );
}
