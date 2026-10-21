"use client";
import { useState } from "react";
import { ArrowRight, Clock3, Filter } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import { currentWorkspace } from "@/lib/records/model";
import type { CrmState } from "@/lib/records/types";
import { Empty, inputClass } from "./ui";
export default function ActivityFeed({
  state,
  locale,
  recordId,
  onOpen,
}: {
  state: CrmState;
  locale: Locale;
  recordId?: string;
  onOpen?: (id: string) => void;
}) {
  const [type, setType] = useState("all"),
    [after, setAfter] = useState(""),
    [related, setRelated] = useState(true);
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const record = state.records.find((r) => r.id === recordId);
  const ids = new Set(recordId ? [recordId] : []);
  if (related && record) {
    for (const id of [record.companyId, record.personId, ...record.relatedIds])
      if (id) ids.add(id);
    for (const r of state.records)
      if (
        r.workspaceId === state.activeWorkspaceId &&
        [r.companyId, r.personId, ...r.relatedIds].includes(recordId!)
      )
        ids.add(r.id);
  }
  const items = state.activities
    .filter(
      (a) =>
        a.workspaceId === state.activeWorkspaceId &&
        (!recordId || ids.has(a.recordId)) &&
        (type === "all" || a.type === type) &&
        (!after || a.createdAt >= after),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section>
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="me-auto flex items-center gap-2 text-base font-bold">
          <Clock3 size={17} className="text-[#a88ebd]" />
          {t("Activity timeline", "خط زمانی فعالیت‌ها")}
        </h3>
        <Filter size={14} className="text-[#ac98ba]" />
        <select
          aria-label={t("Activity filter", "فیلتر فعالیت")}
          className={inputClass + " max-w-[150px] py-2!"}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {[
            "all",
            "created",
            "updated",
            "deleted",
            "restored",
            "comment",
            "field",
            "workspace",
          ].map((value) => (
            <option key={value} value={value}>
              {
                {
                  all: t("All activity", "همه فعالیت‌ها"),
                  created: t("Created", "ایجاد"),
                  updated: t("Updated", "ویرایش"),
                  deleted: t("Deleted", "حذف"),
                  restored: t("Restored", "بازیابی"),
                  comment: t("Comments", "نظرات"),
                  field: t("Fields", "فیلدها"),
                  workspace: t("Workspace", "فضای کاری"),
                }[value]
              }
            </option>
          ))}
        </select>
        <input
          aria-label={t("Activity since", "فعالیت از تاریخ")}
          type="date"
          className={inputClass + " max-w-[155px] py-2!"}
          value={after}
          onChange={(e) => setAfter(e.target.value)}
        />
        {recordId && (
          <label className="w-full text-xs text-[#a18aac]">
            <input
              type="checkbox"
              checked={related}
              onChange={(e) => setRelated(e.target.checked)}
            />{" "}
            {t("Include linked record activity", "نمایش فعالیت رکوردهای مرتبط")}
          </label>
        )}
      </header>
      <div className="space-y-3">
        {items.map((item) => {
          const target = state.records.find(
            (r) =>
              r.id === item.recordId &&
              r.workspaceId === state.activeWorkspaceId,
          );
          return (
            <article
              key={item.id}
              className="flex gap-3 rounded-2xl bg-white/65 p-4"
            >
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${item.type === "created" ? "bg-[#8fbaa4]" : item.type === "comment" ? "bg-[#bba0d4]" : "bg-[#b3b1ca]"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm font-semibold text-[#6f5c7d]">
                    {t(
                      item.title,
                      (
                        {
                          "Record created": "رکورد ایجاد شد",
                          "Record updated": "رکورد ویرایش شد",
                          "Record moved to trash":
                            "رکورد به زباله‌دان منتقل شد",
                          "Record restored": "رکورد بازیابی شد",
                          "Board position updated": "جایگاه در برد تغییر کرد",
                          "Comment added": "نظر اضافه شد",
                          "Comment edit": "نظر ویرایش شد",
                          "Comment delete": "نظر حذف شد",
                          "Comment pin": "سنجاق نظر تغییر کرد",
                          "Comment react": "واکنش به نظر",
                        } as Record<string, string>
                      )[item.title] ?? item.title,
                    )}
                  </strong>
                  <time className="text-[11px] text-[#ad9bb7]">
                    {new Date(item.createdAt).toLocaleString(
                      locale === "fa" ? "fa-IR" : "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </time>
                </div>
                <p className="mt-1 text-xs text-[#a18daa]">
                  {currentWorkspace(state).members.find(
                    (m) => m.id === item.actorId,
                  )?.name ?? "—"}
                  {target && (
                    <button
                      className="ms-2 text-[#9270a5] underline underline-offset-2"
                      onClick={() => onOpen?.(target.id)}
                    >
                      {target.name}
                    </button>
                  )}
                </p>
                {item.changes.length > 0 && (
                  <details className="mt-3 rounded-lg bg-[#f2edf6] px-3 py-2">
                    <summary className="cursor-pointer text-xs text-[#9f87ae]">
                      {item.changes.length}{" "}
                      {t("changes in this update", "تغییر در این ویرایش")}
                    </summary>
                    <div className="mt-2 space-y-2">
                      {item.changes.map((change) => (
                        <div key={change.field} className="text-xs">
                          <strong className="block text-[#8d729e]">
                            {change.field}
                          </strong>
                          <div className="mt-1 flex min-w-0 items-start gap-2 text-[#a18eab]">
                            <span className="min-w-0 flex-1 break-words line-through">
                              {change.before.slice(0, 250) || "—"}
                            </span>
                            <ArrowRight
                              size={12}
                              className="mt-1 rtl:rotate-180"
                            />
                            <span className="min-w-0 flex-1 break-words text-[#7d947e]">
                              {change.after.slice(0, 250) || "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!items.length && (
        <Empty
          title={t("A fresh start", "شروعی تازه")}
          description={t(
            "Record changes and conversations will appear here.",
            "تغییرات رکوردها و گفت‌وگوها اینجا نمایش داده می‌شوند.",
          )}
        />
      )}
    </section>
  );
}
