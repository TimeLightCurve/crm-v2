"use client";
import { useScheduleMembers } from "@/lib/schedule-members";
import { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import {
  activityTypes,
  timeLabel,
  type ActivityType,
  type ScheduleEvent,
} from "@/lib/schedule-data";

export default function EventEditor({
  event,
  locale,
  onSave,
  onClose,
  onDelete,
}: {
  event: ScheduleEvent;
  locale: Locale;
  onSave: (event: ScheduleEvent) => string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const members = useScheduleMembers();
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(event);
  const [error, setError] = useState("");
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const field =
    "mt-1.5 w-full rounded-xl border border-[#dcd6e7] bg-white px-3 py-2.5 text-sm text-[#40384f] outline-none focus:border-[#9b84bf]";
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[480px] max-w-[calc(100%-32px)] overflow-y-auto rounded-3xl bg-[#fbfaf7] p-6 text-[#343044] shadow-2xl backdrop:bg-[#29273d]/35"
      aria-labelledby="event-editor-title"
      dir={locale === "fa" ? "rtl" : "ltr"}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9b86b5]">
            {t("Make space for what matters", "برای کارهای مهم وقت بگذارید")}
          </p>
          <h2 id="event-editor-title" className="text-xl font-bold">
            {event.id
              ? t("Edit activity", "ویرایش فعالیت")
              : t("Add an activity", "افزودن فعالیت")}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label={t("Close editor", "بستن ویرایشگر")}
          className="rounded-full bg-[#eee8f5] p-2"
        >
          <X size={18} />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title[locale].trim() || draft.participants.length === 0) {
            setError(
              t(
                "Add a title and at least one participant.",
                "عنوان و حداقل یک شرکت‌کننده را مشخص کنید.",
              ),
            );
            return;
          }
          const message = onSave(draft);
          if (message) setError(message);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-semibold">
          {t("Title", "عنوان")}
          <input
            autoFocus
            required
            maxLength={80}
            className={field}
            value={draft.title[locale]}
            onChange={(e) =>
              setDraft({
                ...draft,
                title: {
                  ...draft.title,
                  [locale]: e.target.value,
                  ...(!event.id
                    ? { en: e.target.value, fa: e.target.value }
                    : {}),
                },
              })
            }
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            {t("Date", "تاریخ")}
            <input
              required
              type="date"
              className={field}
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("Activity type", "نوع فعالیت")}
            <select
              className={field}
              aria-label={t("Activity type", "نوع فعالیت")}
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as ActivityType })
              }
            >
              {Object.entries(activityTypes).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label[locale]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            {t("Start time", "زمان شروع")}
            <input
              required
              type="time"
              min="08:00"
              max="17:30"
              step={900}
              className={field}
              value={timeLabel(draft.start)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                setDraft({ ...draft, start: h * 60 + m });
              }}
            />
          </label>
          <label className="text-sm font-semibold">
            {t("Duration (minutes)", "مدت (دقیقه)")}
            <select
              className={field}
              aria-label={t("Duration (minutes)", "مدت (دقیقه)")}
              value={draft.duration}
              onChange={(e) =>
                setDraft({ ...draft, duration: Number(e.target.value) })
              }
            >
              {[30, 45, 60, 75, 90, 105, 120, 150, 180, 240].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            {t("Participants", "شرکت‌کنندگان")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${draft.participants.includes(member.id) ? "border-[#b7a3cf] bg-[#eee5f7]" : "border-[#e4dfeb] bg-white"}`}
              >
                <input
                  type="checkbox"
                  className="accent-[#8870ac]"
                  checked={draft.participants.includes(member.id)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      participants: e.target.checked
                        ? [...draft.participants, member.id]
                        : draft.participants.filter((id) => id !== member.id),
                    })
                  }
                />
                {member.name[locale]}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#fff0d3] p-3 text-sm text-[#856526]"
          >
            {error}
          </p>
        )}
        <div className="flex items-center gap-2 border-t border-[#e9e4ed] pt-4">
          {event.id && (
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm text-[#8c6f7e]"
            >
              <Trash2 size={15} />
              {t("Delete", "حذف")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ms-auto rounded-xl px-4 py-2.5 text-sm"
          >
            {t("Cancel", "انصراف")}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#303343] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("Save activity", "ذخیره فعالیت")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
