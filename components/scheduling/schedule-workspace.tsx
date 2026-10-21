"use client";
import { useScheduleMembers } from "@/lib/schedule-members";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Plus,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { text, type Locale, type Localized } from "@/lib/crm-data";
import {
  activityTypes,
  addDays,
  dateKey,
  findFreeSlot,
  hasConflict,
  parseDate,
  timeLabel,
  weekStart,
  type ScheduleEvent,
} from "@/lib/schedule-data";
import { useDocument, updateDocument, useSession } from "@/lib/backend";
import WeeklyCalendar, { Avatars } from "./weekly-calendar";
import EventEditor from "./event-editor";

const subscribeToClock = () => () => {};
// Read the local day only after hydration; keep the static shell deterministic.
export default function ScheduleWorkspace({ locale }: { locale: Locale }) {
  const todayKey = useSyncExternalStore(
    subscribeToClock,
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    () => null,
  );
  return todayKey ? (
    <ScheduleContent locale={locale} todayKey={todayKey} />
  ) : (
    <div
      className="h-80 animate-pulse rounded-3xl bg-[#faf8fc]"
      aria-label={locale === "en" ? "Loading schedule" : "بارگذاری برنامه"}
    />
  );
}
function ScheduleContent({
  locale,
  todayKey,
}: {
  locale: Locale;
  todayKey: string;
}) {
  const [today] = useState(() => parseDate(todayKey));
  const [week, setWeek] = useState(() => weekStart(today));
  const members = useScheduleMembers();
  const session = useSession();
  const events = useDocument<ScheduleEvent[]>("schedule") ?? [];
  const setEvents = (update: (events: ScheduleEvent[]) => ScheduleEvent[]) =>
    updateDocument("schedule", update);
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [query, setQuery] = useState("");
  const [member, setMember] = useState("all");
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<Localized | null>(null);
  const [proposal, setProposal] = useState<ScheduleEvent | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { question: string; answer: Localized }[]
  >([]);
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const language = locale === "fa" ? "fa-IR-u-ca-gregory" : "en-US";
  const days = Array.from({ length: 7 }, (_, i) => dateKey(addDays(week, i)));
  const weekEvents = events.filter((e) => days.includes(e.date));
  const filtered = weekEvents.filter(
    (e) =>
      (member === "all" || e.participants.includes(member)) &&
      `${e.title.en} ${e.title.fa}`.toLowerCase().includes(query.toLowerCase()),
  );
  const tasks = filtered.filter((e) => e.type === "task");
  const upcoming = [...filtered]
    .filter((e) => !e.completed && e.date >= dateKey(today))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
    .slice(0, 3);
  const completed = tasks.filter((e) => e.completed).length;
  const monthStart = weekStart(month);
  const miniDays = Array.from({ length: 42 }, (_, i) => addDays(monthStart, i));
  function navigate(next: Date) {
    setWeek(weekStart(next));
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setProposal(null);
  }
  function create(date = dateKey(addDays(week, 0)), start = 540) {
    setEditing({
      id: "",
      title: text("", ""),
      date,
      start,
      duration: Math.min(60, 1080 - start),
      type: "task",
      participants:
        member === "all"
          ? [session!.user!.id]
          : Array.from(new Set([session!.user!.id, member])),
    });
  }
  function validate(event: ScheduleEvent) {
    if (
      !event.date ||
      !Number.isFinite(event.start) ||
      event.start < 480 ||
      event.start + event.duration > 1080
    )
      return t(
        "Choose a time between 08:00 and 18:00.",
        "زمانی بین ۸ تا ۱۸ انتخاب کنید.",
      );
    if (hasConflict(event, events))
      return t(
        "A participant is already booked at that time. Choose another slot.",
        "یکی از شرکت‌کنندگان در این زمان مشغول است؛ زمان دیگری انتخاب کنید.",
      );
    return null;
  }
  function save(event: ScheduleEvent) {
    const error = validate(event);
    if (error) return error;
    const item = { ...event, id: event.id || crypto.randomUUID() };
    setEvents((prev) =>
      prev.some((e) => e.id === item.id)
        ? prev.map((e) => (e.id === item.id ? item : e))
        : [...prev, item],
    );
    setEditing(null);
    setNotice(t("Activity saved.", "فعالیت ذخیره شد."));
    if (!days.includes(item.date)) navigate(parseDate(item.date));
    return null;
  }
  function move(event: ScheduleEvent) {
    const error = validate(event);
    if (error) {
      setNotice(error);
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    setNotice(
      t(
        `${event.title.en} moved to ${event.date}, ${timeLabel(event.start)}.`,
        `${event.title.fa} به ${event.date}، ساعت ${timeLabel(event.start)} منتقل شد.`,
      ),
    );
  }
  function ask(intent: string, label: string) {
    if (reply)
      setChatHistory((prev) => [
        ...prev,
        { question: lastQuestion, answer: reply },
      ]);
    setLastQuestion(label);
    setQuestion("");
    const participants = member === "all" ? members.map((m) => m.id) : [member];
    const focus = intent === "focus";
    let candidate: ScheduleEvent = {
      id: "",
      title: focus
        ? text("Protected focus time", "زمان تمرکز محافظت‌شده")
        : text("Team catch-up", "هماهنگی تیم"),
      date: "",
      start: 0,
      duration: focus ? 90 : 30,
      type: focus ? "focus" : "meeting",
      participants,
    };
    if (intent === "balance") {
      const load = (date: string) =>
        weekEvents
          .filter((e) => e.date === date && !e.completed)
          .reduce((n, e) => n + e.duration, 0);
      const existing = [...filtered]
        .filter((e) => e.type === "meeting" && !e.completed)
        .sort((a, b) => load(b.date) - load(a.date))[0];
      if (!existing) {
        setProposal(null);
        setReply(
          text(
            "There are no meetings to rebalance this week. Try finding a shared time or adding a focus block.",
            "این هفته جلسه‌ای برای جابجایی وجود ندارد. یک زمان مشترک یا بازه تمرکز پیدا کنید.",
          ),
        );
        return;
      }
      candidate = existing;
    }
    const next = findFreeSlot(events, week, candidate, intent === "balance");
    setProposal(next);
    setReply(
      next
        ? text(
            intent === "balance"
              ? "I found a lighter day for this meeting, keeping every participant’s focus blocks intact. Review the move below."
              : focus
                ? "Here’s a 90-minute focus block with no participant conflicts. Add it to protect this time."
                : "Everyone selected is free for this 30-minute slot. Review it before adding the meeting.",
            intent === "balance"
              ? "روز خلوت‌تری برای این جلسه پیدا شد؛ زمان تمرکز شرکت‌کنندگان حفظ می‌شود. جابجایی را بررسی کنید."
              : focus
                ? "این بازه ۹۰ دقیقه‌ای با برنامه شرکت‌کنندگان تداخل ندارد. برای حفظ زمان تمرکز آن را اضافه کنید."
                : "همه افراد انتخاب‌شده در این بازه ۳۰ دقیقه‌ای آزادند. پیش از افزودن جلسه آن را بررسی کنید.",
          )
        : text(
            "No shared opening was found during this workweek. Try fewer participants or a different week.",
            "در این هفته زمان مشترکی پیدا نشد. تعداد افراد یا هفته را تغییر دهید.",
          ),
    );
  }
  const iconButton =
    "grid size-8 place-items-center rounded-full bg-white text-[#716779] transition-colors hover:bg-[#e9e2f3]";
  return (
    <section className="schedule-workspace rounded-[26px] border border-white/80 bg-[linear-gradient(120deg,#f5fafc_0%,#faf8fb_48%,#faf6ed_100%)] p-3 text-[#353044] shadow-[0_6px_35px_#5f56700a] sm:p-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#9d8cab]">
            <span className="size-1.5 rounded-full bg-[#b59ccb]" />
            {t(
              "A little space to do your best work",
              "فضایی برای بهترین کار شما",
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight rtl:font-[Nian,Anjoman,sans-serif]">
            {t("Team schedule", "برنامه تیم")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="hidden items-center gap-2 rounded-full border border-white bg-white/75 px-3 py-2 text-[#91889c] min-[900px]:flex">
            <Search size={15} />
            <input
              className="w-36 bg-transparent text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("Search schedule", "جست‌وجوی برنامه")}
              placeholder={t("Search activities…", "جست‌وجوی فعالیت…")}
            />
          </label>
          <button
            onClick={() => create()}
            className="flex items-center gap-2 rounded-full bg-[#303343] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4b425b]"
          >
            <Plus size={15} />
            {t("Add activity", "افزودن فعالیت")}
          </button>
        </div>
      </header>
      <div className="grid min-w-0 items-start gap-4 min-[1250px]:grid-cols-[minmax(0,1fr)_270px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="me-auto text-lg font-bold">
              {week.toLocaleDateString(language, {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              className={iconButton}
              onClick={() => navigate(addDays(week, -7))}
              aria-label={t("Previous week", "هفته قبل")}
            >
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>
            <button
              className={iconButton}
              onClick={() => navigate(addDays(week, 7))}
              aria-label={t("Next week", "هفته بعد")}
            >
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
            <button
              onClick={() => navigate(today)}
              className="rounded-full border border-[#e5dfee] px-3 py-1.5 text-xs text-[#796b88]"
            >
              {t("Today", "امروز")}
            </button>
            <select
              aria-label={t("Filter by team member", "فیلتر اعضای تیم")}
              value={member}
              onChange={(e) => setMember(e.target.value)}
              className="max-w-full rounded-full border border-[#e4deeb] bg-white px-3 py-2 text-xs text-[#756880]"
            >
              <option value="all">{t("Everyone", "همه اعضا")}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name[locale]}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {Object.entries(activityTypes).map(([key, type]) => (
              <span
                key={key}
                className="flex items-center gap-1.5 text-xs text-[#7e738a]"
              >
                <span className={`size-2 rounded-full ${type.dot}`} />
                {type.label[locale]}
              </span>
            ))}
            <span className="ms-auto text-[11px] text-[#9c92a5]">
              {t(
                "Drag the handle · 15-minute snap",
                "جابجایی با دستگیره · بازه ۱۵ دقیقه",
              )}
            </span>
          </div>
          <WeeklyCalendar
            todayKey={todayKey}
            week={week}
            events={filtered}
            locale={locale}
            onAdd={create}
            onEdit={setEditing}
            onMove={move}
            onNotice={setNotice}
          />
          <section className="mt-4 rounded-2xl border border-[#e9e4ed] bg-white/75 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg bg-[#f7edca] p-1.5 text-[#b49c53]">
                <ListTodo size={16} />
              </span>
              <h3 className="text-sm font-bold">
                {t("This week’s tasks", "کارهای این هفته")}
              </h3>
              <span className="ms-auto rounded-full bg-[#f2eef7] px-2 py-1 text-xs text-[#8e7c9e]">
                {completed}/{tasks.length} {t("done", "انجام‌شده")}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 rounded-xl bg-[#faf8f0] p-3"
                >
                  <button
                    aria-label={`${t("Toggle completion", "تغییر وضعیت انجام")} ${task.title[locale]}`}
                    aria-pressed={!!task.completed}
                    onClick={() =>
                      setEvents((prev) =>
                        prev.map((e) =>
                          e.id === task.id
                            ? { ...e, completed: !e.completed }
                            : e,
                        ),
                      )
                    }
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${task.completed ? "border-[#9abdac] bg-[#bde1ce]" : "border-[#d6c998] bg-white"}`}
                  >
                    {task.completed && <Check size={13} />}
                  </button>
                  <button
                    onClick={() => setEditing(task)}
                    className="text-start"
                  >
                    <span
                      className={`block text-sm font-medium ${task.completed ? "text-[#a09b8f] line-through" : "text-[#655a41]"}`}
                    >
                      {task.title[locale]}
                    </span>
                    <span className="mt-1 block text-xs text-[#9b9078]">
                      {parseDate(task.date).toLocaleDateString(language, {
                        weekday: "short",
                      })}{" "}
                      · {timeLabel(task.start)}
                    </span>
                  </button>
                </div>
              ))}
              {!tasks.length && (
                <button
                  onClick={() => create()}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-[#ddd5e7] p-3 text-sm text-[#9383a1]"
                >
                  <Plus size={15} />
                  {t(
                    "Add the first task for this week",
                    "اولین کار این هفته را اضافه کنید",
                  )}
                </button>
              )}
            </div>
          </section>
        </div>
        <aside className="grid gap-3 sm:max-[1249px]:grid-cols-2">
          <section className="rounded-2xl border border-white bg-white/75 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                aria-expanded={calendarExpanded}
                aria-label={t(
                  "Toggle full month calendar",
                  "نمایش تقویم کامل ماه",
                )}
                onClick={() => setCalendarExpanded(!calendarExpanded)}
                className="text-start text-sm font-bold"
              >
                {month.toLocaleDateString(language, {
                  month: "long",
                  year: "numeric",
                })}
              </button>
              <div className="flex">
                <button
                  className={iconButton}
                  onClick={() => {
                    setCalendarExpanded(true);
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    );
                  }}
                  aria-label={t("Previous month", "ماه قبل")}
                >
                  <ChevronLeft size={14} className="rtl:rotate-180" />
                </button>
                <button
                  className={iconButton}
                  onClick={() => {
                    setCalendarExpanded(true);
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    );
                  }}
                  aria-label={t("Next month", "ماه بعد")}
                >
                  <ChevronRight size={14} className="rtl:rotate-180" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className="pb-2 text-[10px] text-[#a198aa]">
                  {addDays(weekStart(today), i).toLocaleDateString(language, {
                    weekday: "narrow",
                  })}
                </span>
              ))}
              {(calendarExpanded ? miniDays : days.map(parseDate)).map(
                (date) => {
                  const key = dateKey(date);
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(date)}
                      aria-label={date.toLocaleDateString(language, {
                        dateStyle: "full",
                      })}
                      aria-pressed={days.includes(key)}
                      className={`relative grid h-7 place-items-center rounded-lg text-[11px] ${key === dateKey(today) ? "bg-[#a997c5] font-bold text-white" : days.includes(key) ? "bg-[#eee6f7] text-[#79618e]" : date.getMonth() !== month.getMonth() ? "text-[#ccc5d2]" : "text-[#807487] hover:bg-[#f1ebf6]"}`}
                    >
                      {date.toLocaleDateString(language, { day: "numeric" })}
                      {events.some((e) => e.date === key) && (
                        <span className="absolute bottom-0.5 size-0.5 rounded-full bg-current" />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-white bg-white/75 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {t("Upcoming events", "رویدادهای پیش رو")}
              </h3>
              <CalendarDays size={15} className="text-[#b2a3bf]" />
            </div>
            <div className="space-y-2">
              {upcoming.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setEditing(event)}
                  className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-start ${activityTypes[event.type].card}`}
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${activityTypes[event.type].dot}`}
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-semibold">
                      {event.title[locale]}
                    </strong>
                    <span className="mt-1 block text-[11px] opacity-75">
                      {parseDate(event.date).toLocaleDateString(language, {
                        weekday: "short",
                      })}{" "}
                      · {timeLabel(event.start)}
                    </span>
                  </span>
                  <ArrowUpRight size={13} />
                </button>
              ))}
              {!upcoming.length && (
                <p className="py-4 text-sm text-[#9c8eaa]">
                  {t(
                    "A clear week. Make room for something good.",
                    "هفته‌ای آزاد؛ برای کارهای مهم برنامه‌ریزی کنید.",
                  )}
                </p>
              )}
            </div>
          </section>
          <section className="flex flex-col rounded-2xl border border-[#e8def2] bg-[#f6f0fb] p-4 sm:max-[1249px]:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={17} className="text-[#a183ba]" />
              <h3 className="text-sm font-bold">
                {t("Planning assistant", "دستیار برنامه‌ریزی")}
              </h3>
              <span className="ms-auto rounded-md bg-white px-1.5 py-1 text-[10px] text-[#a18cb2]">
                {t("Demo", "نمونه")}
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#8d7b9c]">
              {t(
                "Find shared time and protect focus. Local demo suggestions; AI is not connected.",
                "زمان مشترک پیدا کنید و تمرکز را حفظ کنید. پیشنهادهای نمایشی؛ هوش مصنوعی متصل نیست.",
              )}
            </p>
            <div className="space-y-2">
              {[
                ["meeting", t("Find a meeting time", "پیدا کردن زمان جلسه")],
                ["focus", t("Protect focus time", "حفظ زمان تمرکز")],
                ["balance", t("Rebalance the week", "متعادل‌سازی هفته")],
              ].map(([intent, label]) => (
                <button
                  key={intent}
                  onClick={() => ask(intent, label)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#e4d9ef] bg-white/70 px-3 py-2 text-start text-xs text-[#8b6ba3] hover:bg-white"
                >
                  {label}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
            {chatHistory.length > 0 && (
              <div
                className="mt-3 max-h-36 space-y-2 overflow-y-auto pe-1 [scrollbar-width:thin]"
                aria-label={t(
                  "Planning conversation history",
                  "تاریخچه گفت‌وگوی برنامه‌ریزی",
                )}
              >
                {chatHistory.map((message, index) => (
                  <div key={index} className="space-y-2">
                    <p className="ms-5 rounded-xl bg-[#e7d9f2] p-2.5 text-xs text-[#77608b]">
                      {message.question}
                    </p>
                    <p className="rounded-xl bg-white p-3 text-xs leading-relaxed text-[#7e6b8f]">
                      {message.answer[locale]}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <AnimatePresence mode="wait">
              {reply && (
                <motion.div
                  key={lastQuestion + reply.en}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 space-y-2"
                >
                  <p className="ms-5 rounded-xl bg-[#e7d9f2] p-2.5 text-xs text-[#77608b]">
                    {lastQuestion}
                  </p>
                  <p
                    role="status"
                    className="rounded-xl bg-white p-3 text-xs leading-relaxed text-[#7e6b8f]"
                  >
                    {reply[locale]}
                  </p>
                  {proposal && (
                    <div className="rounded-xl border border-[#d2bfdc] bg-white p-3">
                      <strong className="block text-xs text-[#766083]">
                        {proposal.title[locale]}
                      </strong>
                      <p className="mt-1 text-xs text-[#9884a4]">
                        {parseDate(proposal.date).toLocaleDateString(language, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {timeLabel(proposal.start)}–
                        {timeLabel(proposal.start + proposal.duration)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Avatars ids={proposal.participants} locale={locale} />
                        <button
                          onClick={() => {
                            const error = save(proposal);
                            if (error) setNotice(error);
                            else {
                              setProposal(null);
                              setReply(
                                text(
                                  "Applied to your calendar. Your other activities and focus time are preserved.",
                                  "در تقویم اعمال شد؛ سایر فعالیت‌ها و زمان تمرکز حفظ شدند.",
                                ),
                              );
                            }
                          }}
                          className="rounded-lg bg-[#9b80b4] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          {t("Apply", "اعمال")}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (question.trim())
                  ask(
                    /focus|تمرکز/i.test(question)
                      ? "focus"
                      : /balance|متعادل/i.test(question)
                        ? "balance"
                        : "meeting",
                    question,
                  );
              }}
              className="mt-3 flex items-center gap-2 rounded-xl border border-[#e4d9ef] bg-white p-2.5"
            >
              <input
                aria-label={t(
                  "Ask planning assistant",
                  "پرسش از دستیار برنامه‌ریزی",
                )}
                placeholder={t("Find time for…", "پیدا کردن زمان برای…")}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#b3a5be]"
              />
              <button
                disabled={!question.trim()}
                aria-label={t(
                  "Send planning request",
                  "ارسال درخواست برنامه‌ریزی",
                )}
                className="rounded-full bg-[#34313f] p-1.5 text-white"
              >
                <Send size={12} />
              </button>
            </form>
          </section>
        </aside>
      </div>
      <AnimatePresence>
        {notice && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-5 start-1/2 z-50 flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#ded4e8] bg-[#faf7fd] px-4 py-3 text-sm text-[#72617f] shadow-xl rtl:translate-x-1/2"
          >
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label={t("Dismiss notification", "بستن اعلان")}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {editing && (
        <EventEditor
          key={editing.id || "new"}
          event={editing}
          locale={locale}
          onSave={save}
          onClose={() => setEditing(null)}
          onDelete={(id) => {
            setEvents((prev) => prev.filter((e) => e.id !== id));
            setEditing(null);
            setNotice(t("Activity deleted.", "فعالیت حذف شد."));
          }}
        />
      )}
    </section>
  );
}
