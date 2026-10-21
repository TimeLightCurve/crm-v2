import { text, type Localized } from "./crm-data";

export type ActivityType = "meeting" | "task" | "focus" | "review";
export interface ScheduleEvent {
  id: string;
  title: Localized;
  date: string;
  start: number;
  duration: number;
  type: ActivityType;
  participants: string[];
  completed?: boolean;
}
export const activityTypes = {
  meeting: {
    label: text("Meeting", "جلسه"),
    card: "bg-[#c6e8f5] border-[#a8d5e8] text-[#20485c]",
    dot: "bg-[#63b8d8]",
  },
  task: {
    label: text("Task", "کار"),
    card: "bg-[#f5e5ad] border-[#e8d58f] text-[#65531d]",
    dot: "bg-[#dbb54f]",
  },
  focus: {
    label: text("Focus time", "زمان تمرکز"),
    card: "bg-[#c9eddd] border-[#aed8c5] text-[#285746]",
    dot: "bg-[#72b99b]",
  },
  review: {
    label: text("Review", "بازبینی"),
    card: "bg-[#dfcef5] border-[#cbb5e8] text-[#564071]",
    dot: "bg-[#ae89d8]",
  },
} as const;
export const members = [
  { id: "negar", initials: "NR", name: text("Negar", "نگار") },
  { id: "sara", initials: "SA", name: text("Sara", "سارا") },
  { id: "amir", initials: "AH", name: text("Amir", "امیر") },
  { id: "niloofar", initials: "NK", name: text("Niloofar", "نیلوفر") },
];
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(key: string) {
  return new Date(`${key}T12:00:00`);
}
export function addDays(date: Date, count: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}
export function weekStart(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}
export function timeLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function hasConflict(candidate: ScheduleEvent, events: ScheduleEvent[]) {
  return events.some(
    (event) =>
      event.id !== candidate.id &&
      event.date === candidate.date &&
      !event.completed &&
      candidate.start < event.start + event.duration &&
      candidate.start + candidate.duration > event.start &&
      candidate.participants.some((id) => event.participants.includes(id)),
  );
}
export function seedEvents(start: Date): ScheduleEvent[] {
  const items: [
    number,
    number,
    number,
    ActivityType,
    string,
    string,
    string[],
  ][] = [
    [
      0,
      540,
      75,
      "meeting",
      "Client discovery",
      "جلسه آشنایی مشتری",
      ["negar", "sara", "amir"],
    ],
    [
      0,
      690,
      90,
      "task",
      "Prepare sales proposal",
      "آماده‌سازی پیشنهاد فروش",
      ["negar", "sara"],
    ],
    [0, 840, 90, "focus", "Deep work", "کار با تمرکز", ["negar"]],
    [
      1,
      570,
      90,
      "task",
      "Build the presentation",
      "آماده‌سازی ارائه",
      ["sara"],
    ],
    [
      1,
      705,
      75,
      "review",
      "Pipeline review",
      "بازبینی مسیر فروش",
      ["negar", "amir"],
    ],
    [
      1,
      840,
      60,
      "meeting",
      "Research sync",
      "هماهنگی تحقیقات",
      ["sara", "niloofar"],
    ],
    [
      2,
      540,
      60,
      "meeting",
      "Team planning",
      "برنامه‌ریزی تیم",
      ["negar", "sara", "amir", "niloofar"],
    ],
    [2, 690, 60, "meeting", "Project handoff", "تحویل پروژه", ["sara", "amir"]],
    [2, 810, 90, "focus", "Quiet hours", "ساعت‌های تمرکز", ["negar", "amir"]],
    [3, 600, 90, "task", "Content audit", "بررسی محتوا", ["niloofar", "sara"]],
    [
      3,
      780,
      90,
      "review",
      "Campaign review",
      "بازبینی کمپین",
      ["negar", "niloofar"],
    ],
    [
      4,
      555,
      75,
      "review",
      "Brand assets sync",
      "هماهنگی هویت برند",
      ["sara", "niloofar"],
    ],
    [
      4,
      690,
      120,
      "focus",
      "Make room to create",
      "فرصتی برای خلق",
      ["negar", "sara"],
    ],
    [
      4,
      870,
      60,
      "meeting",
      "Weekly wrap-up",
      "جمع‌بندی هفته",
      ["negar", "sara", "amir", "niloofar"],
    ],
  ];
  return items.map(([day, time, duration, type, en, fa, participants], i) => ({
    id: `sample-${i}`,
    title: text(en, fa),
    date: dateKey(addDays(start, day)),
    start: time,
    duration,
    type,
    participants,
  }));
}
// Assign lanes even when simultaneous activities have different participants.
export function eventLanes(events: ScheduleEvent[]) {
  const result: Record<string, { lane: number; count: number }> = {};
  const sorted = [...events].sort((a, b) => a.start - b.start);
  let group: ScheduleEvent[] = [],
    end = -1;
  function flush() {
    const lanes: number[] = [];
    for (const event of group) {
      let lane = lanes.findIndex((until) => until <= event.start);
      if (lane < 0) lane = lanes.length;
      lanes[lane] = event.start + event.duration;
      result[event.id] = { lane, count: 0 };
    }
    for (const event of group) result[event.id].count = lanes.length;
  }
  for (const event of sorted) {
    if (event.start >= end) {
      flush();
      group = [];
      end = -1;
    }
    group.push(event);
    end = Math.max(end, event.start + event.duration);
  }
  flush();
  return result;
}
export function findFreeSlot(
  events: ScheduleEvent[],
  start: Date,
  candidate: ScheduleEvent,
  rebalance = false,
) {
  const days = Array.from({ length: 5 }, (_, i) => dateKey(addDays(start, i)));
  if (rebalance)
    days.sort(
      (a, b) =>
        events.filter((e) => e.date === a).reduce((n, e) => n + e.duration, 0) -
        events.filter((e) => e.date === b).reduce((n, e) => n + e.duration, 0),
    );
  for (const date of days)
    for (let time = 540; time + candidate.duration <= 1020; time += 15) {
      if (candidate.date === date && candidate.start === time) continue;
      const next = { ...candidate, date, start: time };
      if (!hasConflict(next, events)) return next;
    }
  return null;
}
