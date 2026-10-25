"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleHelp,
  Headphones,
  LayoutGrid,
  Plus,
  Send,
  Settings2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  getTranscript,
  statusLabels,
  text,
  type LeadStatus,
  type Locale,
  type Lead,
} from "@/lib/crm-data";
import {
  duration,
  RecordingPlayer,
  type Activity,
  type CallPhase,
} from "./lead-detail";
import WorkspaceBoard from "./workspace-board";
import ScheduleWorkspace from "../scheduling/schedule-workspace";
import CrmWorkspace from "../records/crm-workspace";
import { useServerProperty, useSession } from "@/lib/backend";
import { emptyLead } from "@/lib/call-data";
import NativeWorkspace from "../native-workspace";
import EnterpriseWorkspace from "../enterprise/enterprise-workspace";
import WorkspaceSettings from "../records/workspace-settings";
import { useCrmState } from "@/lib/records/store";

type Dialog =
  | "WhatsApp"
  | "SMS"
  | "notifications"
  | "settings"
  | "help"
  | "recordings"
  | "activity"
  | "add"
  | null;
export default function SalesWorkspace({
  initialLocale = "en",
  onPersianChange,
}: {
  initialLocale?: Locale;
  onPersianChange?: (persian: boolean) => void;
}) {
  const session = useSession();
  const crm = useCrmState();
  const [leads, setLeads] = useServerProperty<Lead[]>("leads", []);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [selected, setSelected] = useState(leads[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("followup");
  const [conversationTab, setConversationTab] = useState("transcript");
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  // Completed conversations are independent of editable pipeline status.
  const [recordings, setRecordings] = useServerProperty<
    Record<string, string[]>
  >("recordings", {});
  const hasAnalysis = (recordings[selected]?.length ?? 0) > 0;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [notes, setNotes] = useServerProperty<Record<string, string>>(
    "notes",
    {},
  );
  const [statuses, setStatuses] = useServerProperty<Record<string, LeadStatus>>(
    "statuses",
    {},
  );
  const [activities, setActivities] = useServerProperty<
    Record<string, Activity[]>
  >("activities", {});
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [topTab, setTopTab] = useState("records");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("view") === "enterprise") setTopTab("enterprise");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const searchRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const lead = leads.find((l) => l.id === selected) ?? emptyLead;
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const busy = phase === "calling" || phase === "analyzing";
  const lines = getTranscript(lead);
  const shownLines =
    phase === "calling"
      ? lines.slice(0, Math.min(lines.length, Math.floor(seconds / 3) + 1))
      : hasAnalysis
        ? lines.slice(0, phase === "analyzed" ? 7 : 6)
        : [];
  const visibleLeads = leads.filter((l) => {
    const status = statuses[l.id] ?? l.status;
    return (
      leadCategory(status) === filter &&
      `${l.name.en} ${l.name.fa} ${l.phone} ${l.company.en} ${l.company.fa}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    onPersianChange?.(locale === "fa");
  }, [locale, onPersianChange]);
  useEffect(() => {
    if (phase !== "calling") return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);
  useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = setTimeout(() => {
      setPhase("analyzed");
      setRecordings((prev) => ({
        ...prev,
        [selected]: [crypto.randomUUID(), ...(prev[selected] ?? [])],
      }));
    }, 1500);
    return () => clearTimeout(timer);
  }, [phase, selected, setRecordings]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  useEffect(() => {
    if (phase === "calling")
      transcriptRef.current?.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: "smooth",
      });
  }, [shownLines.length, phase]);
  function addActivity(title: Activity["title"], detail: Activity["detail"]) {
    setActivities((prev) => ({
      ...prev,
      [selected]: [
        { id: crypto.randomUUID(), title, detail },
        ...(prev[selected] ?? []),
      ],
    }));
  }
  function leadCategory(status: LeadStatus) {
    return status === "new"
      ? "new"
      : status === "noanswer"
        ? "noanswer"
        : "followup";
  }
  function changeCategory(category: string) {
    if (busy) return;
    setFilter(category);
    setQuery("");
    if (leadCategory(statuses[selected] ?? lead.status) !== category) {
      const first = leads.find(
        (l) => leadCategory(statuses[l.id] ?? l.status) === category,
      );
      if (first) selectLead(first.id);
    }
  }
  function selectLead(id: string) {
    if (busy) return;
    setSelected(id);
    setPhase("idle");
    setSeconds(0);
    setAssistantAnswer("");
    setScheduled(false);
  }
  function handleCall() {
    if (phase === "calling") {
      if (seconds < 3) {
        setPhase("idle");
        addActivity(
          text("Call ended · No response", "پایان تماس · بدون پاسخ"),
          text(
            "No conversation or recording captured.",
            "گفت‌وگو یا صدایی ثبت نشد.",
          ),
        );
        return;
      }
      setPhase("analyzing");
      addActivity(
        text("Demo call completed", "تماس نمایشی پایان یافت"),
        text(
          `Duration ${duration(seconds)} · Sample analysis generated`,
          `مدت ${duration(seconds)} · تحلیل نمونه ایجاد شد`,
        ),
      );
    } else {
      setSeconds(0);
      setPhase("calling");
      setConversationTab("transcript");
    }
  }
  function openMessage(channel: "WhatsApp" | "SMS") {
    setMessage(
      t(
        `Hi ${lead.name.en.split(" ")[0]}, thanks for your time! Here are the next steps for the ${lead.interest.en.toLowerCase()}. Let me know when you’re available to discuss the schedule and payment options.`,
        `سلام ${lead.name.fa}، ممنون از وقتی که گذاشتید! برای ادامه ثبت‌نام در ${lead.interest.fa}، لطفاً زمان مناسب برای بررسی برنامه کلاس و شرایط پرداخت را اعلام کنید.`,
      ),
    );
    setDialog(channel);
  }
  function askAssistant(question: string) {
    if (!question.trim()) return;
    setAssistantAnswer(
      t(
        `For ${lead.name.en}, acknowledge the concern first, then connect the value to their goals. Offer the installment plan and send a clear schedule. A good next step is a short follow-up tomorrow. This is a sample response; an LLM is not connected yet.`,
        `برای ${lead.name.fa} ابتدا نگرانی را تأیید کنید، سپس ارزش دوره را به اهداف او مرتبط کنید. پرداخت اقساطی و برنامه روشن کلاس پیشنهاد دهید. یک پیگیری کوتاه فردا قدم مناسبی است. این پاسخ نمونه است و مدل زبانی هنوز متصل نیست.`,
      ),
    );
    setAssistantQuestion("");
  }
  function exportTranscript() {
    const blob = new Blob(
      [
        shownLines
          .map(
            (l) =>
              `[${l.time}] ${l.speaker === "agent" ? t("Negar", "نگار") : lead.name[locale]}: ${l.content[locale]}`,
          )
          .join("\n\n"),
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lead.id}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={
          "crm-app min-h-screen rtl:font-[Anjoman,Arial,sans-serif] [&_h2]:font-bold [&_h3]:font-bold rtl:[&_h2]:font-[Nian,Anjoman,sans-serif] rtl:[&_h3]:font-[Nian,Anjoman,sans-serif]"
        }
        dir={locale === "fa" ? "rtl" : "ltr"}
      >
        <aside
          className={
            "sidebar fixed inset-y-0 start-0 w-19.5 border-e border-e-[#bcbcd2] bg-[#f4f3df] flex items-center flex-col z-30 p-[23px_0_20px] max-[1050px]:w-16 max-[520px]:w-13.25 max-[520px]:pt-4.5"
          }
        >
          <Link
            href="/"
            className={
              "brand-symbol text-[46px] leading-[40px] text-[#2e3b50] max-[520px]:text-4xl"
            }
            aria-label="Forma home"
          >
            ✳
          </Link>
          <div
            className={
              "sidebar-nav flex flex-col gap-3.75 mt-[51px] max-[520px]:mt-8.75 max-[520px]:gap-3.25"
            }
          >
            <button
              className={
                topTab === "workspace"
                  ? "nav-icon active w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
                  : "nav-icon w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
              }
              aria-label={t("Workspace", "فضای کار")}
              title={t("Workspace", "فضای کار")}
              onClick={() => setTopTab("workspace")}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              className={
                "nav-icon w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
              }
              aria-label={t("Leads", "لیدها")}
              title={t("Leads", "لیدها")}
              onClick={() => {
                setTopTab("workspace");
                changeCategory("new");
                searchRef.current?.focus();
              }}
            >
              <Users size={20} />
            </button>
            <button
              className={
                "nav-icon w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
              }
              aria-label={t("Team schedule", "برنامه تیم")}
              title={t("Team schedule", "برنامه تیم")}
              onClick={() => setTopTab("schedule")}
            >
              <CalendarDays size={20} />
            </button>
            <button
              className={
                "nav-icon w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
              }
              aria-label={t("Recordings", "فایل‌های ضبط‌شده")}
              title={t("Recordings", "فایل‌های ضبط‌شده")}
              onClick={() => setDialog("recordings")}
            >
              <Headphones size={20} />
            </button>
            <button
              className={
                topTab === "reports"
                  ? "nav-icon active w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
                  : "nav-icon w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
              }
              aria-label={t("Nabz records", "رکوردهای نبض")}
              title={t("Nabz records", "رکوردهای نبض")}
              onClick={() => setTopTab("reports")}
            >
              <ChartNoAxesCombined size={20} />
            </button>
          </div>
          <div
            className={
              "sidebar-bottom mt-auto flex flex-col items-center gap-2.5 max-[520px]:gap-1.5"
            }
          >
            <button
              className={
                "nav-icon w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
              }
              aria-label={t("Help", "راهنما")}
              onClick={() => setDialog("help")}
            >
              <CircleHelp size={20} />
            </button>
            <button
              className={
                "nav-icon w-10.75 h-10.75 grid place-items-center text-[#899080] rounded-[14px] [&:hover]:bg-[#e5e1f2] [&:hover]:text-[#3b4730] [&.active]:bg-[#b8afea] [&.active]:text-[#322b65] max-[520px]:w-8.75 max-[520px]:h-9.25 max-[520px]:rounded-[11px] max-[520px]:[&_svg]:w-4.5"
              }
              aria-label={t("Settings", "تنظیمات")}
              onClick={() => setTopTab("team")}
            >
              <Settings2 size={20} />
            </button>
            <div
              className={"sidebar-divider w-6.75 h-px bg-[#e0e5d9] m-[9px_0]"}
            />
            <button
              className={
                "user-avatar relative w-9.25 h-9.25 rounded-full bg-[#cab79e] text-[#493a28] text-sm border-3 border-[#ede8de] font-bold [&_span]:absolute [&_span]:bottom-[-1px] [&_span]:right-[-1px] [&_span]:w-2.25 [&_span]:h-2.25 [&_span]:bg-[#91ac74] [&_span]:border-2 [&_span]:border-[#f4f3df] [&_span]:rounded-full max-[520px]:w-[31px] max-[520px]:h-[31px] max-[520px]:text-xs"
              }
              aria-label={t("Your profile", "پروفایل شما")}
              onClick={() => setTopTab("team")}
            >
              {session?.user?.name.slice(0, 2).toUpperCase()}
              <span />
            </button>
          </div>
        </aside>
        <div
          className={
            "app-content ms-19.5 max-[1050px]:ms-16 max-[520px]:ms-13.25"
          }
        >
          <header
            className={
              "topbar flex h-16 items-center gap-6 border-b border-[#dce3e6] px-4 sm:px-6 max-[520px]:gap-3"
            }
          >
            <div
              className={
                "wordmark text-4xl tracking-[-1.8px] font-semibold flex items-start [&>span]:text-sm [&>span]:tracking-0 [&>span]:mt-2 [&>span]:ms-0.75 max-[780px]:text-3xl max-[520px]:text-3xl"
              }
            >
              forma<span>®</span>
            </div>
            <nav
              className={
                "top-nav flex gap-6.25 self-stretch [&_button]:relative [&_button]:text-[#666279] [&_button]:text-base [&_button]:p-[0_3px] [&_button.selected]:text-[#2e3628] [&_button>span]:h-0.5 [&_button>span]:absolute [&_button>span]:bottom-0 [&_button>span]:left-0 [&_button>span]:right-0 [&_button>span]:bg-[#6150bd] max-[1050px]:gap-4.5 max-[780px]:gap-3.75 max-[780px]:[&_button]:text-sm max-[520px]:gap-2.5 max-[520px]:[&_button]:text-xs max-[520px]:[&_button:last-child]:hidden"
              }
            >
              {[
                ["workspace", t("Workspace", "فضای کار")],
                ["records", t("CRM", "رکوردها")],
                ["enterprise", t("Executive desk", "میز مدیر")],
                ["schedule", t("Schedule", "برنامه")],
                ["reports", t("Nabz records", "رکوردهای نبض")],
                ["team", t("Team", "تیم")],
              ].map(([id, label]) => (
                <button
                  className={`${topTab === id ? "selected" : ""} ${id === "reports" || id === "team" ? "max-[1050px]:hidden" : id === "schedule" ? "max-[520px]:hidden" : ""}`}
                  onClick={() => setTopTab(id)}
                  key={id}
                >
                  {label}
                  {topTab === id && (
                    <motion.span
                      layoutId="top-nav"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              ))}
            </nav>
            <div
              className={
                "topbar-actions flex items-center gap-5.25 ms-auto max-[1250px]:gap-3.5 max-[780px]:gap-2 max-[520px]:gap-0"
              }
            >
              <span
                className={
                  "demo-badge flex items-center gap-1.5 text-sm text-[#666279] [&>span]:inline-block [&>span]:w-1.25 [&>span]:h-1.25 [&>span]:rounded-full [&>span]:bg-[#859c67] [&>span]:shrink-0 max-[1250px]:hidden"
                }
              >
                <span />
                {t("Nabz connected", "متصل به نبض")}
              </span>
              <button
                className={
                  "language-toggle flex items-center border border-[#dce1d5] rounded-[8px] p-0.75 gap-px [&_span]:text-sm [&_span]:p-[5px_7px] [&_span]:rounded-[5px] [&_span]:text-[#929888] [&_span.chosen]:bg-[white] [&_span.chosen]:text-[#3e4934] max-[520px]:[&_span]:text-xs max-[520px]:[&_span]:p-[4px_5px]"
                }
                onClick={() => setLocale(locale === "en" ? "fa" : "en")}
                aria-label={t("Switch to Persian", "Switch to English")}
              >
                <span className={locale === "en" ? "chosen" : ""}>EN</span>
                <span className={locale === "fa" ? "chosen" : ""}>فا</span>
              </button>
              <button
                className={
                  "icon-button notification-button w-8 h-8 inline-flex items-center justify-center rounded-full text-[#777e6d] shrink-0 [&:hover]:bg-[#e4e9dc] [&.small]:w-6.5 [&.small]:h-6.5 relative [&_i]:h-1 [&_i]:w-1 [&_i]:rounded-full [&_i]:bg-[#8a9d66] [&_i]:absolute [&_i]:top-1 [&_i]:right-1.75 max-[520px]:hidden"
                }
                aria-label={t("Notifications", "اعلان‌ها")}
                onClick={() => setDialog("notifications")}
              >
                <Bell size={18} />
                <i />
              </button>
              <div
                className={
                  "header-profile flex items-center gap-2.25 border-s border-s-[#dce1d6] ps-5 [&_strong]:block [&_span]:block [&_strong]:text-sm [&_strong]:font-medium [&_span]:text-[#8f9489] [&_span]:text-xs [&_span]:mt-1 [&>svg]:ms-2.5 [&>svg]:text-[#929886] [&_.avatar]:flex [&_.avatar]:text-sm max-[1050px]:[&>div:not(.avatar)]:hidden max-[1050px]:[&>svg]:hidden max-[1050px]:ps-3 max-[780px]:hidden"
                }
              >
                <div
                  className={
                    "avatar avatar-small w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium text-[#66523c] shrink-0 border-2 border-[#ffffff25] bg-[#d6c4ae]!"
                  }
                >
                  {session?.user?.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <strong>{session?.user?.name ?? ""}</strong>
                  <span>
                    {session?.user?.role} · {session?.user?.department}
                  </span>
                </div>
                <ChevronDown size={13} />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-[1720px] px-3 pb-2 pt-3 sm:px-5 lg:px-6">
            <div
              className={"page-heading mb-3 flex items-center justify-between"}
            >
              {/* <div>
                <div className="eyebrow page-eyebrow">
                  {t("YOUR DAILY SALES SPACE", "فضای روزانه فروش شما")}
                </div>
                <h1>
                  {topTab === "reports"
                    ? t("A little progress, every day.", "هر روز، کمی پیشرفت.")
                    : topTab === "team"
                      ? t(
                          "Better conversations, together.",
                          "گفت‌وگوی بهتر، در کنار هم.",
                        )
                      : t("Your sales workspace", "فضای کار فروش شما")}
                  <span className="greeting-dot">.</span>
                </h1>
                <p>
                  {t(
                    "Every conversation is a new possibility. Let’s make it count.",
                    "هر گفت‌وگو یک فرصت تازه است. از آن بهترین استفاده را ببریم.",
                  )}
                </p>
              </div> */}
              <div
                className={
                  "date-pill flex items-center gap-2 py-1 text-xs text-[#718693] [&>span:last-child]:text-xs"
                }
              >
                <CalendarDays size={15} />
                <span>{t("Tuesday, October 20", "سه‌شنبه، ۲۸ مهر")}</span>
                <span
                  className={
                    "date-divider h-3 w-px bg-[#d8ddce] max-[1050px]:hidden"
                  }
                />
                <span>{t("Today", "امروز")}</span>
              </div>
            </div>
            {/* Overview metrics intentionally hidden in this focused workspace. */}
            <div hidden={topTab !== "records"}>
              <CrmWorkspace
                locale={locale}
                onCallPerson={(record) => {
                  if (busy) {
                    setToast(
                      t(
                        "Finish the current call first",
                        "ابتدا تماس فعلی را پایان دهید",
                      ),
                    );
                    return;
                  }
                  const original = leads.find((item) => item.id === record.id);
                  const contact = {
                    ...(original ?? emptyLead),
                    id: record.id,
                    name: text(
                      record.name,
                      original?.name.en === record.name
                        ? original.name.fa
                        : record.name,
                    ),
                    initials: record.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase(),
                    email: record.email,
                    phone: record.phone,
                    status: original?.status ?? ("new" as LeadStatus),
                    score: original?.score ?? 0,
                    company:
                      original?.company ?? text("CRM contact", "مخاطب CRM"),
                    role: text(
                      record.description || "CRM contact",
                      record.description || "مخاطب CRM",
                    ),
                    source:
                      original?.source ?? text("CRM records", "رکوردهای CRM"),
                    interest:
                      original?.interest ??
                      text("Discovery conversation", "گفت‌وگوی آشنایی"),
                    scenario:
                      original?.scenario ??
                      text(
                        "Introduce yourself and ask about their goals. Explore the next step together.",
                        "خودتان را معرفی و درباره اهداف او سؤال کنید؛ قدم بعدی را با هم پیدا کنید.",
                      ),
                    note:
                      original?.note ??
                      text(record.description, record.description),
                  };
                  setLeads((prev) =>
                    prev.some((item) => item.id === record.id)
                      ? prev.map((item) =>
                          item.id === record.id ? contact : item,
                        )
                      : [...prev, contact],
                  );
                  setFilter(
                    leadCategory(statuses[record.id] ?? contact.status),
                  );
                  selectLead(record.id);
                  setTopTab("workspace");
                }}
              />
            </div>
            <div hidden={topTab !== "schedule"}>
              <ScheduleWorkspace locale={locale} />
            </div>
            {topTab === "enterprise" && <EnterpriseWorkspace locale={locale} />}
            {topTab === "schedule" || topTab === "records" || topTab === "enterprise" ? null : topTab ===
              "workspace" ? (
              leads.length === 0 ? (
                <section className="rounded-3xl bg-[#f3efdc] p-8 text-[#35364d]">
                  <h2 className="text-2xl font-bold">
                    {t(
                      "Start with a real contact",
                      "با یک مخاطب واقعی شروع کنید",
                    )}
                  </h2>
                  <p className="mt-3 text-base">
                    {t(
                      "Open a person in CRM and choose Call, or add a lead here.",
                      "از بخش CRM یک مخاطب را برای تماس باز کنید یا لید جدید اضافه کنید.",
                    )}
                  </p>
                  <button
                    className="mt-5 rounded-full bg-[#c1b4de] px-5 py-3 font-bold"
                    onClick={() => setDialog("add")}
                  >
                    {t("Add lead", "افزودن لید")}
                  </button>
                </section>
              ) : (
                <WorkspaceBoard
                  detail={{
                    lead,
                    locale,
                    phase,
                    seconds,
                    onCall: handleCall,
                    onMessage: openMessage,
                    note: notes[`${selected}-${locale}`],
                    onNote: (note) => {
                      setNotes((n) => ({
                        ...n,
                        [`${selected}-${locale}`]: note,
                      }));
                      setToast(t("Note saved", "یادداشت ذخیره شد"));
                    },
                    activities: activities[selected] ?? [],
                    recordingIds: recordings[selected] ?? [],
                    hasAnalysis,
                    status: statuses[selected] ?? lead.status,
                    onStatus: (status) => {
                      setStatuses((s) => ({ ...s, [selected]: status }));
                      addActivity(
                        text("Lead status updated", "وضعیت لید تغییر کرد"),
                        statusLabels[status],
                      );
                    },
                    onNext: () => {
                      const next =
                        leads[
                          (leads.findIndex((l) => l.id === selected) + 1) %
                            leads.length
                        ];
                      setFilter(leadCategory(statuses[next.id] ?? next.status));
                      selectLead(next.id);
                    },
                    scheduled,
                    onSchedule: () => {
                      setScheduled(true);
                      addActivity(
                        text("Follow-up scheduled", "پیگیری برنامه‌ریزی شد"),
                        text(
                          "Tomorrow at 10:00 · Demo reminder",
                          "فردا ساعت ۱۰ · یادآوری نمایشی",
                        ),
                      );
                      setToast(
                        t(
                          "Follow-up set for tomorrow at 10:00",
                          "پیگیری برای فردا ساعت ۱۰ ثبت شد",
                        ),
                      );
                    },
                  }}
                  visibleLeads={visibleLeads}
                  statuses={statuses}
                  filter={filter}
                  onFilter={changeCategory}
                  query={query}
                  onQuery={setQuery}
                  onSelect={selectLead}
                  searchRef={searchRef}
                  transcriptRef={transcriptRef}
                  shownLines={shownLines}
                  conversationTab={conversationTab}
                  onConversationTab={setConversationTab}
                  onExport={exportTranscript}
                  assistantQuestion={assistantQuestion}
                  onQuestion={setAssistantQuestion}
                  assistantAnswer={assistantAnswer}
                  onAsk={askAssistant}
                />
              )
            ) : topTab === "reports" ? (
              <NativeWorkspace locale={locale} />
            ) : crm ? (
              <WorkspaceSettings
                key={crm.activeWorkspaceId}
                state={crm}
                locale={locale}
                notify={setToast}
              />
            ) : null}
            <footer className={"page-footer hidden"}>
              <span>
                forma<span className={"footer-dot text-xs align-top"}>®</span>{" "}
                <span>
                  {t("A better way to connect.", "راهی بهتر برای ارتباط.")}
                </span>
              </span>
              <span>
                {t(
                  "Made for meaningful conversations.",
                  "برای گفت‌وگوهای ارزشمند.",
                )}
                <span
                  className={
                    "footer-flower text-2xl ms-2.5 align-middle text-[#a1ad90]"
                  }
                >
                  ✳
                </span>
              </span>
            </footer>
          </main>
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              className={
                "toast fixed bottom-6 left-[50%] [transform:translateX(-50%)]! z-100 bg-[#323c29] text-[#e6efd8] shadow-[0_5px_30px_#26321b20] p-[15px_20px] rounded-[12px] text-base flex items-center gap-2.5 max-w-[calc(100%_-_32px)] [&>svg]:text-[#c2dd9b] [&_button]:grid [&_button]:place-items-center [&_button]:ms-2.5 max-[520px]:text-sm max-[520px]:p-[12px_14px] max-[520px]:w-[max-content]"
              }
              role="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <Check size={17} />
              {toast}
              <button
                onClick={() => setToast("")}
                aria-label={t("Dismiss", "بستن")}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {dialog && (
            <DialogContent
              key={dialog}
              dialog={dialog}
              locale={locale}
              onClose={() => setDialog(null)}
              title={
                dialog === "WhatsApp"
                  ? t("WhatsApp message", "پیام واتس‌اپ")
                  : dialog === "SMS"
                    ? t("Send an SMS", "ارسال پیامک")
                    : dialog === "settings"
                      ? t("Workspace settings", "تنظیمات فضای کار")
                      : dialog === "notifications"
                        ? t("You’re all caught up", "اعلان‌های شما")
                        : dialog === "recordings"
                          ? t("Call recordings", "فایل‌های ضبط تماس")
                          : dialog === "activity"
                            ? t("Your activity", "فعالیت‌های شما")
                            : dialog === "add"
                              ? t("Add a lead", "افزودن لید")
                              : t("Welcome to Forma", "به فرما خوش آمدید")
              }
            >
              {dialog === "WhatsApp" || dialog === "SMS" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addActivity(
                      text(
                        `${dialog} message saved (demo)`,
                        `پیام ${dialog === "SMS" ? "پیامک" : "واتس‌اپ"} ذخیره شد (نمونه)`,
                      ),
                      text(message, message),
                    );
                    setDialog(null);
                    setToast(
                      t(
                        "Demo message saved to activity. No message was sent.",
                        "پیام نمایشی در فعالیت‌ها ذخیره شد. پیامی ارسال نشد.",
                      ),
                    );
                  }}
                >
                  <div
                    className={
                      "message-recipient flex items-center gap-2.5 border-b border-b-[#e4eadb] pb-4.25 mb-5 [&_strong]:text-base [&_strong]:font-normal [&_p]:text-sm [&_p]:text-[#6e805a] [&_p]:mt-1.25 [&_p]:text-start"
                    }
                  >
                    <div
                      className={
                        "avatar w-8.75 h-8.75 flex items-center justify-center rounded-full text-sm font-medium text-[#455042] shrink-0 border-2 border-[#ffffff25]"
                      }
                      style={{ background: lead.color }}
                    >
                      {lead.initials}
                    </div>
                    <div>
                      <strong>{lead.name[locale]}</strong>
                      <p dir="ltr">{lead.phone}</p>
                    </div>
                  </div>
                  <label
                    className={
                      "form-label flex flex-col gap-2.25 text-[#82936e] text-sm [&_textarea]:p-3.25 [&_textarea]:border [&_textarea]:border-[#dce6d0] [&_textarea]:rounded-[10px] [&_textarea]:bg-[#f3f6ee] [&_textarea]:text-[#6d8158] [&_textarea]:resize-y [&_textarea]:text-base [&_textarea]:leading-[1.8]"
                    }
                  >
                    {t("Message", "پیام")}
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      required
                    />
                  </label>
                  <p
                    className={
                      "modal-notice text-sm text-[#6f805b] leading-[1.8] m-[15px_0]"
                    }
                  >
                    {t(
                      "Demo mode: this saves a message to the activity log. No external messages are sent.",
                      "حالت نمایشی: پیام در تاریخچه ذخیره می‌شود و پیام واقعی ارسال نخواهد شد.",
                    )}
                  </p>
                  <button
                    className={
                      "primary-button bg-[#dfeca7] p-[12px_19px] rounded-[9px] inline-flex items-center gap-2 text-[#556b3b] text-base"
                    }
                    type="submit"
                    disabled={!message.trim()}
                  >
                    <Send size={16} />
                    {t("Save demo message", "ذخیره پیام نمایشی")}
                  </button>
                </form>
              ) : dialog === "settings" ? (
                <div
                  className={
                    "settings-content [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:p-[15px_0] [&>div]:border-b [&>div]:border-b-[#e6eddd] [&>div]:text-base [&>div]:text-[#83976c]"
                  }
                >
                  <div>
                    <span>{t("Language", "زبان")}</span>
                    <button
                      className={
                        "secondary-button p-[8px_12px] border border-[#dae4cb] rounded-[7px] text-sm text-[#88a06b]"
                      }
                      onClick={() => setLocale(locale === "en" ? "fa" : "en")}
                    >
                      {locale === "en" ? "فارسی · RTL" : "English · LTR"}
                    </button>
                  </div>
                  <div>
                    <span>{t("VoIP connection", "اتصال ویپ")}</span>
                    <span
                      className={
                        "soft-badge inline-flex items-center gap-1 text-[#809263] bg-[#eef3e4] p-[4px_6px] rounded-[5px] text-xs whitespace-nowrap"
                      }
                    >
                      {t("Demo adapter", "اتصال نمایشی")}
                    </span>
                  </div>
                  <div>
                    <span>{t("Speech-to-text", "تبدیل گفتار به متن")}</span>
                    <span
                      className={
                        "soft-badge inline-flex items-center gap-1 text-[#809263] bg-[#eef3e4] p-[4px_6px] rounded-[5px] text-xs whitespace-nowrap"
                      }
                    >
                      {t("Mock transcript", "متن نمونه")}
                    </span>
                  </div>
                  <div>
                    <span>{t("AI analysis", "تحلیل هوشمند")}</span>
                    <span
                      className={
                        "soft-badge inline-flex items-center gap-1 text-[#809263] bg-[#eef3e4] p-[4px_6px] rounded-[5px] text-xs whitespace-nowrap"
                      }
                    >
                      {t("Sample results", "نتایج نمونه")}
                    </span>
                  </div>
                  <p
                    className={
                      "modal-notice text-sm text-[#6f805b] leading-[1.8] m-[15px_0]"
                    }
                  >
                    {t(
                      "Changes are saved to Nabz. Telephony and AI remain mock adapters until configured.",
                      "تغییرات در نبض ذخیره می‌شوند. تلفن و هوش مصنوعی تا زمان پیکربندی به صورت نمونه هستند.",
                    )}
                  </p>
                </div>
              ) : dialog === "recordings" ? (
                <>
                  <p
                    className={
                      "modal-notice text-sm text-[#6f805b] leading-[1.8] m-[15px_0]"
                    }
                  >
                    {t(
                      "A generated sample conversation for previewing the player.",
                      "نمونه گفت‌وگوی تولیدشده برای پیش‌نمایش پخش‌کننده.",
                    )}
                  </p>
                  <RecordingPlayer locale={locale} />
                </>
              ) : dialog === "activity" ? (
                <div
                  className={
                    "modal-activities [&>div]:flex [&>div]:gap-2.5 [&>div]:p-[15px_0] [&>div]:border-b [&>div]:border-b-[#e6ebdd] [&_.connection-dot]:mt-1.25 [&_strong]:text-base [&_strong]:font-normal [&_p]:text-sm [&_p]:text-[#9aa98a] [&_p]:leading-[1.7] [&_p]:mt-1.5 [&_p]:[overflow-wrap:anywhere]"
                  }
                >
                  {Object.values(activities).flat().length ? (
                    Object.entries(activities).flatMap(([id, items]) =>
                      items.map((item) => (
                        <div key={item.id}>
                          <span
                            className={
                              "connection-dot inline-block w-1.25 h-1.25 rounded-full bg-[#859c67] shrink-0"
                            }
                          />
                          <div>
                            <strong>{item.title[locale]}</strong>
                            <p>
                              {leads.find((l) => l.id === id)?.name[locale]} ·{" "}
                              {item.detail[locale]}
                            </p>
                          </div>
                        </div>
                      )),
                    )
                  ) : (
                    <p>
                      {t(
                        "Your activity will appear here. Try a demo call, edit a status, or save a message.",
                        "فعالیت‌های شما اینجا نمایش داده می‌شوند. یک تماس نمایشی بگیرید، وضعیت را تغییر دهید یا پیام ذخیره کنید.",
                      )}
                    </p>
                  )}
                </div>
              ) : dialog === "notifications" ? (
                <div
                  className={
                    "notification-items [&>div]:flex [&>div]:items-start [&>div]:gap-3.25 [&>div]:border-b [&>div]:border-b-[#e6eddd] [&>div]:p-[16px_0] [&_svg]:text-[#96aa7d] [&_strong]:text-base [&_strong]:font-normal [&_p]:text-sm [&_p]:leading-[1.7] [&_p]:text-[#9da991] [&_p]:m-[8px_0]"
                  }
                >
                  <div>
                    <CalendarDays size={20} />
                    <div>
                      <strong>
                        {t(
                          "Your next conversations are ready",
                          "گفت‌وگوهای بعدی آماده‌اند",
                        )}
                      </strong>
                      <p>
                        {t(
                          "Review the follow-up queue and make the next step clear.",
                          "صف پیگیری را بررسی کنید و قدم بعدی را مشخص کنید.",
                        )}
                      </p>
                      <button
                        className={
                          "text-button inline-flex items-center gap-1.25 text-sm text-[#78836c]"
                        }
                        onClick={() => {
                          changeCategory("followup");
                          setTopTab("workspace");
                          setDialog(null);
                        }}
                      >
                        {t("View leads", "مشاهده لیدها")}
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <TrendingUp size={20} />
                    <div>
                      <strong>
                        {t(
                          "You’re 76% of the way there",
                          "۷۶٪ مسیر را طی کرده‌اید",
                        )}
                      </strong>
                      <p>
                        {t(
                          "Your monthly target is within reach.",
                          "هدف ماهانه در دسترس است.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : dialog === "add" ? (
                <form
                  className={
                    "add-lead-form [&_.form-label]:mb-3.75 [&_input]:border [&_input]:border-[#dce6d0] [&_input]:p-2.75 [&_input]:rounded-[8px] [&_input]:bg-[#f4f7ef] [&_input]:text-[#647950]"
                  }
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newName.trim() || busy) return;
                    const id = crypto.randomUUID();
                    setLeads((prev) => [
                      ...prev,
                      {
                        ...emptyLead,
                        id,
                        name: text(newName.trim(), newName.trim()),
                        initials: newName
                          .trim()
                          .split(/\s+/)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join(""),
                        phone: newPhone,
                        email: "",
                        status: "new",
                        score: 0,
                        value: 0,
                        source: text("Manual entry", "ثبت دستی"),
                        company: text("New contact", "مخاطب جدید"),
                        interest: text(newInterest, newInterest),
                        note: text(
                          "No notes yet. Start a conversation to learn more.",
                          "هنوز یادداشتی ثبت نشده است. گفت‌وگو را شروع کنید.",
                        ),
                        scenario: text(
                          "Introduce yourself, explore their goals, and agree on a next step.",
                          "خودتان را معرفی کنید، اهداف را بررسی کنید و قدم بعدی را مشخص کنید.",
                        ),
                      },
                    ]);
                    setSelected(id);
                    setPhase("idle");
                    setQuery("");
                    setFilter("new");
                    setDialog(null);
                    setNewName("");
                    setNewPhone("");
                    setNewInterest("");
                    setToast(t("Lead saved to Nabz", "لید در نبض ذخیره شد"));
                  }}
                >
                  <label
                    className={
                      "form-label flex flex-col gap-2.25 text-[#82936e] text-sm [&_textarea]:p-3.25 [&_textarea]:border [&_textarea]:border-[#dce6d0] [&_textarea]:rounded-[10px] [&_textarea]:bg-[#f3f6ee] [&_textarea]:text-[#6d8158] [&_textarea]:resize-y [&_textarea]:text-base [&_textarea]:leading-[1.8]"
                    }
                  >
                    {t("Full name", "نام و نام خانوادگی")}
                    <input
                      required
                      autoComplete="off"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </label>
                  <label
                    className={
                      "form-label flex flex-col gap-2.25 text-[#82936e] text-sm [&_textarea]:p-3.25 [&_textarea]:border [&_textarea]:border-[#dce6d0] [&_textarea]:rounded-[10px] [&_textarea]:bg-[#f3f6ee] [&_textarea]:text-[#6d8158] [&_textarea]:resize-y [&_textarea]:text-base [&_textarea]:leading-[1.8]"
                    }
                  >
                    {t("Phone number", "شماره تماس")}
                    <input
                      required
                      type="tel"
                      dir="ltr"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </label>
                  <label
                    className={
                      "form-label flex flex-col gap-2.25 text-[#82936e] text-sm [&_textarea]:p-3.25 [&_textarea]:border [&_textarea]:border-[#dce6d0] [&_textarea]:rounded-[10px] [&_textarea]:bg-[#f3f6ee] [&_textarea]:text-[#6d8158] [&_textarea]:resize-y [&_textarea]:text-base [&_textarea]:leading-[1.8]"
                    }
                  >
                    {t("Interested in", "علاقه‌مند به")}
                    <input
                      required
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                    />
                  </label>
                  <p
                    className={
                      "modal-notice text-sm text-[#6f805b] leading-[1.8] m-[15px_0]"
                    }
                  >
                    {t(
                      "Changes are saved to Nabz and remain after refresh.",
                      "تغییرات در نبض ذخیره می‌شوند و بعد از بارگذاری مجدد باقی می‌مانند.",
                    )}
                  </p>
                  <button
                    className={
                      "primary-button bg-[#dfeca7] p-[12px_19px] rounded-[9px] inline-flex items-center gap-2 text-[#556b3b] text-base"
                    }
                    disabled={busy || !newName.trim()}
                  >
                    <Plus size={15} />
                    {t("Add lead", "افزودن لید")}
                  </button>
                </form>
              ) : (
                <div
                  className={
                    "help-content [&>p]:text-base [&>p]:text-[#8a9b77] [&>p]:leading-[1.7] [&_ol]:ps-5 [&_ol]:text-[#9baa89] [&_ol]:text-base [&_ol]:leading-[2.3] [&_ol]:m-[20px_0]"
                  }
                >
                  <p>
                    {t(
                      "A focused space for your next great conversation.",
                      "فضایی متمرکز برای گفت‌وگوی بعدی شما.",
                    )}
                  </p>
                  <ol>
                    <li>
                      {t(
                        "Choose a lead from the queue.",
                        "یک لید از صف انتخاب کنید.",
                      )}
                    </li>
                    <li>
                      {t(
                        "Start a demo call to see the transcript arrive live.",
                        "تماس نمایشی را شروع کنید و متن زنده را ببینید.",
                      )}
                    </li>
                    <li>
                      {t(
                        "End the call to reveal a sample AI analysis.",
                        "تماس را پایان دهید تا تحلیل هوشمند نمونه نمایش داده شود.",
                      )}
                    </li>
                    <li>
                      {t(
                        "Save notes, draft messages, and schedule a follow-up.",
                        "یادداشت و پیام ذخیره کنید و پیگیری ثبت کنید.",
                      )}
                    </li>
                  </ol>
                  <p
                    className={
                      "modal-notice text-sm text-[#6f805b] leading-[1.8] m-[15px_0]"
                    }
                  >
                    {t(
                      "Your data is saved in Nabz. Calls, messages and AI use mock adapters.",
                      "همه موارد نمایشی هستند. تماس یا پیام واقعی برقرار نمی‌شود.",
                    )}
                  </p>
                </div>
              )}
            </DialogContent>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function DialogContent({
  dialog,
  locale,
  title,
  onClose,
  children,
}: {
  dialog: Dialog;
  locale: Locale;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current;
    el?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = el?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input, textarea, select, a[href]",
      );
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === el)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <motion.div
      className={
        "modal-backdrop fixed inset-0 bg-[#20291d66] backdrop-blur-[5px] z-80 flex items-center justify-center p-5"
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={ref}
        tabIndex={-1}
        className={
          "modal w-[470px] max-w-[100%] max-h-[85vh] overflow-auto bg-[#fbfcf7] rounded-[22px] p-6.5 shadow-[0_25px_100px_#1c271b30] outline-none [&_h2]:text-3xl [&_h2]:font-normal [&_h2]:tracking-[-0.6px] [&_.soft-badge]:text-xs [&_.recording-info_strong]:text-sm [&_.recording-info_span]:text-xs max-[520px]:p-5.5 max-[520px]:[&_h2]:text-2xl"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={`dialog-${dialog}`}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            "modal-header flex items-center justify-between gap-2.5 mb-5.75"
          }
        >
          <h2 id={`dialog-${dialog}`}>{title}</h2>
          <button
            className={
              "icon-button w-8 h-8 inline-flex items-center justify-center rounded-full text-[#777e6d] shrink-0 [&:hover]:bg-[#e4e9dc] [&.small]:w-6.5 [&.small]:h-6.5"
            }
            aria-label={locale === "en" ? "Close" : "بستن"}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
