"use client";
import { useScheduleMembers } from "@/lib/schedule-members";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "motion/react";
import { Check, GripVertical, Plus } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import {
  activityTypes,
  addDays,
  dateKey,
  eventLanes,
  timeLabel,
  type ScheduleEvent,
} from "@/lib/schedule-data";

const START = 480,
  END = 1080,
  HOUR = 72;
export function Avatars({ ids, locale }: { ids: string[]; locale: Locale }) {
  const members = useScheduleMembers();
  return (
    <div className="flex items-center -space-x-1 rtl:space-x-reverse">
      {ids.slice(0, 3).map((id) => {
        const member = members.find((m) => m.id === id);
        return (
          <span
            key={id}
            title={member?.name[locale]}
            className="grid size-5 place-items-center rounded-full border-2 border-white/90 bg-[#fbfaf5] text-[9px] font-bold text-[#59546b]"
          >
            {member?.initials}
          </span>
        );
      })}
      {ids.length > 3 && (
        <span className="ps-2 text-[11px] font-medium">+{ids.length - 3}</span>
      )}
    </div>
  );
}
function EventCard({
  event,
  locale,
  day,
  lane,
  count,
  onEdit,
  onPreview,
  onDrop,
  onKeyMove,
}: {
  event: ScheduleEvent;
  locale: Locale;
  day: number;
  lane: number;
  count: number;
  onEdit: () => void;
  onPreview: (info: PanInfo) => void;
  onDrop: (info: PanInfo) => void;
  onKeyMove: (day: number, time: number) => void;
}) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  return (
    <motion.article
      layout="position"
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragSnapToOrigin
      onDragStart={() => setDragging(true)}
      onDrag={(_, info) => onPreview(info)}
      onDragEnd={(_, info) => {
        setDragging(false);
        onDrop(info);
      }}
      whileDrag={{ scale: 1.035, boxShadow: "0 16px 35px #34304a33" }}
      transition={{
        layout: { type: "spring", stiffness: 340, damping: 32 },
        duration: 0.22,
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      data-event-id={event.id}
      className={`schedule-event absolute flex flex-col overflow-hidden rounded-xl border px-2 py-1.5 shadow-[0_2px_3px_#3c365008] ${activityTypes[event.type].card} ${event.completed ? "opacity-60" : ""}`}
      style={{
        top: ((event.start - START) / 60) * HOUR + 3,
        height: (event.duration / 60) * HOUR - 6,
        insetInlineStart: `calc(${((day + lane / count) / 7) * 100}% + 4px)`,
        width: `calc(${100 / 7 / count}% - 8px)`,
        zIndex: dragging ? 40 : 10,
      }}
    >
      <div className="flex items-start gap-1">
        <button
          onClick={onEdit}
          className={`min-w-0 flex-1 text-start text-xs font-semibold leading-4 ${event.duration <= 60 ? "truncate" : "line-clamp-2"} ${event.completed ? "line-through" : ""}`}
          title={event.title[locale]}
        >
          {event.title[locale]}
        </button>
        <button
          onPointerDown={(e) => controls.start(e)}
          onKeyDown={(e) => {
            const move = {
              ArrowUp: [0, -15],
              ArrowDown: [0, 15],
              ArrowLeft: [locale === "fa" ? 1 : -1, 0],
              ArrowRight: [locale === "fa" ? -1 : 1, 0],
            }[e.key];
            if (move) {
              e.preventDefault();
              onKeyMove(move[0], move[1]);
            }
          }}
          aria-label={`${locale === "en" ? "Move" : "جابجایی"} ${event.title[locale]}`}
          title={
            locale === "en"
              ? "Drag, or use arrow keys to move"
              : "بکشید یا با کلیدهای جهت جابجا کنید"
          }
          className="-me-1 -mt-1 grid size-5 shrink-0 cursor-grab! touch-none place-items-center rounded-md opacity-65 hover:bg-white/40 active:cursor-grabbing!"
        >
          <GripVertical size={14} />
        </button>
      </div>
      <span
        dir="ltr"
        className={`mt-0.5 text-start text-[10px] tabular-nums opacity-80 ${event.duration < 45 ? "hidden" : ""}`}
      >
        {timeLabel(event.start)} – {timeLabel(event.start + event.duration)}
      </span>
      {event.duration >= 60 && (
        <div className="mt-auto flex items-center justify-between gap-1 pt-0.5">
          <Avatars ids={event.participants} locale={locale} />
          {event.completed && <Check size={13} />}
        </div>
      )}
    </motion.article>
  );
}
export default function WeeklyCalendar({
  todayKey,
  week,
  events,
  locale,
  onAdd,
  onEdit,
  onMove,
  onNotice,
}: {
  todayKey: string;
  week: Date;
  events: ScheduleEvent[];
  locale: Locale;
  onAdd: (date: string, time: number) => void;
  onEdit: (event: ScheduleEvent) => void;
  onMove: (event: ScheduleEvent) => void;
  onNotice: (text: string) => void;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<ScheduleEvent | null>(null);
  const dates = Array.from({ length: 7 }, (_, i) => dateKey(addDays(week, i)));
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const lanes = Object.assign(
    {},
    ...dates.map((date) => eventLanes(events.filter((e) => e.date === date))),
  );
  function target(event: ScheduleEvent, info: PanInfo) {
    const width = (grid.current?.getBoundingClientRect().width ?? 700) / 7;
    const day = Math.max(
      0,
      Math.min(
        6,
        dates.indexOf(event.date) +
          Math.round(info.offset.x / width) * (locale === "fa" ? -1 : 1),
      ),
    );
    const time = Math.max(
      START,
      Math.min(
        END - event.duration,
        event.start + Math.round(((info.offset.y / HOUR) * 60) / 15) * 15,
      ),
    );
    return { ...event, date: dates[day], start: time };
  }
  return (
    <div
      className="calendar-scroll overflow-auto rounded-2xl border border-[#e6e5ef] bg-white/55 [scrollbar-width:thin]"
      style={{ maxHeight: "clamp(400px, calc(100dvh - 430px), 650px)" }}
    >
      <div className="min-w-[780px]">
        <div className="sticky top-0 z-30 grid grid-cols-[52px_minmax(0,1fr)] border-b border-[#e9e7f0] bg-[#faf9fc]/95 backdrop-blur-sm">
          <div className="flex items-center justify-center text-[10px] text-[#9792a5]">
            GMT+3:30
          </div>
          <div className="grid grid-cols-7">
            {dates.map((date, i) => (
              <div
                key={date}
                className={`flex items-center justify-center gap-1.5 border-s border-[#e9e7f0] py-4 text-sm ${date === todayKey ? "bg-[#e8e0f8] font-bold text-[#65518b]" : i > 4 ? "text-[#a39baa]" : "text-[#4b465b]"}`}
              >
                <span>
                  {addDays(week, i).toLocaleDateString(
                    locale === "fa" ? "fa-IR" : "en-US",
                    { weekday: "short" },
                  )}
                </span>
                <span>
                  {addDays(week, i).toLocaleDateString(
                    locale === "fa" ? "fa-IR" : "en-US",
                    { day: "numeric" },
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[52px_minmax(0,1fr)]">
          <div
            className="relative text-[10px] tabular-nums text-[#948d9f]"
            style={{ height: ((END - START) / 60) * HOUR }}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="absolute inset-x-0 pt-1 text-center"
                style={{ top: i * HOUR }}
              >
                {timeLabel(START + i * 60)}
              </span>
            ))}
          </div>
          <div
            ref={grid}
            className="week-time-grid relative"
            style={{ height: ((END - START) / 60) * HOUR }}
          >
            <div className="absolute inset-0 grid grid-cols-7">
              {dates.map((date, day) => (
                <div
                  key={date}
                  className={`border-s border-[#eeebf3] ${day > 4 ? "bg-[#f4f1f7]/60" : ""}`}
                >
                  {Array.from({ length: 20 }, (_, slot) => (
                    <button
                      key={slot}
                      aria-label={t(
                        `Add activity ${date} ${timeLabel(START + slot * 30)}`,
                        `افزودن فعالیت ${date} ${timeLabel(START + slot * 30)}`,
                      )}
                      onClick={() => onAdd(date, START + slot * 30)}
                      className={`group flex w-full items-center justify-center text-[#8c80a3] hover:bg-[#eee7f7] focus-visible:bg-[#eee7f7] ${slot % 2 === 0 ? "border-t border-[#eeeaf4]" : "border-t border-dashed border-[#f3f0f6]"}`}
                      style={{ height: HOUR / 2 }}
                    >
                      <Plus
                        size={17}
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                      />
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {preview && (
              <div
                className="pointer-events-none absolute z-[5] rounded-xl border-2 border-dashed border-[#9e8cbe] bg-[#d9c9f4]/35"
                style={{
                  top: ((preview.start - START) / 60) * HOUR,
                  height: (preview.duration / 60) * HOUR,
                  insetInlineStart: `${(dates.indexOf(preview.date) / 7) * 100}%`,
                  width: `${100 / 7}%`,
                }}
              />
            )}
            <AnimatePresence>
              {events
                .filter((e) => dates.includes(e.date))
                .map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    locale={locale}
                    day={dates.indexOf(event.date)}
                    lane={lanes[event.id]?.lane ?? 0}
                    count={lanes[event.id]?.count ?? 1}
                    onEdit={() => onEdit(event)}
                    onPreview={(info) => setPreview(target(event, info))}
                    onDrop={(info) => {
                      setPreview(null);
                      const rect = grid.current?.getBoundingClientRect();
                      if (
                        rect &&
                        (info.point.x - window.scrollX < rect.left ||
                          info.point.x - window.scrollX > rect.right ||
                          info.point.y - window.scrollY < rect.top ||
                          info.point.y - window.scrollY > rect.bottom)
                      ) {
                        onNotice(
                          t(
                            "Move cancelled. Drop inside the calendar.",
                            "جابجایی لغو شد؛ داخل تقویم رها کنید.",
                          ),
                        );
                        return;
                      }
                      onMove(target(event, info));
                    }}
                    onKeyMove={(day, time) => {
                      const index = dates.indexOf(event.date) + day;
                      if (
                        index < 0 ||
                        index > 6 ||
                        event.start + time < START ||
                        event.start + time + event.duration > END
                      )
                        return;
                      onMove({
                        ...event,
                        date: dates[index],
                        start: event.start + time,
                      });
                    }}
                  />
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
