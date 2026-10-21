"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { CalendarDays, GripVertical, Plus, Users } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import { stageLabels, stagesFor } from "@/lib/records/seed";
import { currentWorkspace } from "@/lib/records/model";
import type { CrmRecord, CrmState, Entity } from "@/lib/records/types";
function BoardCard({
  record,
  state,
  locale,
  writable,
  onOpen,
  onMove,
  onDrop,
}: {
  record: CrmRecord;
  state: CrmState;
  locale: Locale;
  writable: boolean;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: string, target?: string, owner?: string) => void;
  onDrop: (x: number, y: number) => void;
}) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  return (
    <motion.article
      layout
      layoutId={`record-card-${record.id}`}
      drag={writable}
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      dragSnapToOrigin
      whileDrag={{ scale: 1.025, boxShadow: "0 20px 35px #3f315833" }}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_, info) => {
        setDragging(false);
        onDrop(info.point.x - window.scrollX, info.point.y - window.scrollY);
      }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { type: "spring", stiffness: 330, damping: 32 },
        duration: 0.2,
      }}
      data-crm-card={record.id}
      className="record-board-card relative rounded-2xl border border-white bg-[#f9f7ed] p-3 shadow-[0_2px_5px_#4e3a5809]"
      style={{ zIndex: dragging ? 50 : 1 }}
    >
      <div className="flex items-start gap-2">
        <button
          className="flex-1 text-start text-sm font-bold leading-relaxed text-[#5b4e68]"
          onClick={() => onOpen(record.id)}
        >
          {record.name}
        </button>
        <button
          disabled={!writable}
          className="-me-1 grid size-6 touch-none place-items-center rounded-lg text-[#b19ec0] hover:bg-[#e9e0f1] active:cursor-grabbing!"
          aria-label={`${t("Move", "جابجایی")} ${record.name}`}
          onPointerDown={(e) => controls.start(e)}
          onKeyDown={(e) => {
            const stages = stagesFor(record.entity),
              current = stages.indexOf(record.stage);
            const delta =
              e.key === "ArrowRight"
                ? locale === "fa"
                  ? -1
                  : 1
                : e.key === "ArrowLeft"
                  ? locale === "fa"
                    ? 1
                    : -1
                  : 0;
            if (delta && stages[current + delta]) {
              e.preventDefault();
              onMove(record.id, stages[current + delta]);
            }
          }}
        >
          <GripVertical size={15} />
        </button>
      </div>
      {record.entity === "opportunities" && (
        <p className="mt-2 text-lg font-semibold tracking-tight text-[#8b759c]">
          {record.currency}{" "}
          {record.amount.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}
        </p>
      )}
      {record.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#aa9ab4]">
          {record.description.replaceAll("#", "")}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {record.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-[#e9e0f0] px-1.5 py-1 text-[10px] text-[#a087af]"
          >
            {tag}
          </span>
        ))}
        {record.priority === "high" && (
          <span className="rounded-md bg-[#efe3b9] px-1.5 py-1 text-[10px] text-[#a18b4d]">
            {t("High priority", "اولویت بالا")}
          </span>
        )}
      </div>
      <footer className="mt-3 flex items-center justify-between gap-2 text-xs text-[#8b7798]">
        <span
          className="grid size-6 place-items-center rounded-full bg-[#ddd4e7] text-[10px] font-bold text-[#8d769f]"
          title={
            currentWorkspace(state).members.find((m) => m.id === record.ownerId)
              ?.name
          }
        >
          {currentWorkspace(state)
            .members.find((m) => m.id === record.ownerId)
            ?.name.slice(0, 1) ?? "?"}
        </span>
        {record.dueDate && (
          <span className="flex items-center gap-1">
            <CalendarDays size={11} />
            {record.dueDate.slice(5)}
          </span>
        )}
        <select
          disabled={!writable}
          aria-label={t(`Stage for ${record.name}`, `مرحله ${record.name}`)}
          className="max-w-[100px] rounded bg-transparent text-[11px]"
          value={record.stage}
          onChange={(e) => onMove(record.id, e.target.value)}
        >
          {stagesFor(record.entity).map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]?.[locale] ?? stage}
            </option>
          ))}
        </select>
      </footer>
    </motion.article>
  );
}
export default function RecordBoard({
  records,
  state,
  entity,
  locale,
  writable,
  onOpen,
  onMove,
  onAdd,
}: {
  records: CrmRecord[];
  state: CrmState;
  entity: Entity;
  locale: Locale;
  writable: boolean;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: string, target?: string, owner?: string) => void;
  onAdd: (stage: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [swimlanes, setSwimlanes] = useState(false);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const stages = stagesFor(entity);
  const owners = swimlanes
    ? currentWorkspace(state).members.map((m) => ({ id: m.id, name: m.name }))
    : [{ id: "all", name: "" }];
  function drop(record: CrmRecord, x: number, y: number) {
    const columns = [
      ...(root.current?.querySelectorAll<HTMLElement>("[data-crm-stage]") ??
        []),
    ];
    const column = columns.find((node) => {
      const box = node.getBoundingClientRect();
      return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    });
    if (!column) return;
    const target = [...column.querySelectorAll<HTMLElement>("[data-crm-card]")]
      .filter((node) => node.dataset.crmCard !== record.id)
      .find(
        (node) =>
          node.getBoundingClientRect().top +
            node.getBoundingClientRect().height / 2 >
          y,
      );
    onMove(
      record.id,
      column.dataset.crmStage!,
      target?.dataset.crmCard,
      column.dataset.owner === "all" ? undefined : column.dataset.owner,
    );
  }
  return (
    <div ref={root}>
      <button
        className="mb-3 flex items-center gap-2 text-xs text-[#9c83af]"
        aria-pressed={swimlanes}
        onClick={() => setSwimlanes(!swimlanes)}
      >
        <Users size={13} />
        {swimlanes
          ? t("Group by stage only", "فقط گروه‌بندی مرحله‌ای")
          : t("Show owner swimlanes", "نمایش ردیف مسئول‌ها")}
      </button>
      {owners.map((owner) => (
        <section key={owner.id} className="mb-4">
          {swimlanes && (
            <h3 className="mb-3 text-sm font-bold text-[#8f78a2]">
              {owner.name}
            </h3>
          )}
          <div className="flex gap-3 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {stages.map((stage, index) => {
              const items = records
                .filter(
                  (r) =>
                    r.stage === stage &&
                    (owner.id === "all" || r.ownerId === owner.id),
                )
                .sort((a, b) => a.position - b.position);
              const key = owner.id + stage;
              const limit = limits[key] ?? 20;
              const totals = items.reduce<Record<string, number>>(
                (sum, r) => ({
                  ...sum,
                  [r.currency]: (sum[r.currency] ?? 0) + r.amount,
                }),
                {},
              );
              return (
                <section
                  data-crm-stage={stage}
                  data-owner={owner.id}
                  key={stage}
                  className={`record-board-column min-h-[330px] w-[245px] shrink-0 rounded-[20px] border border-white/55 p-3 ${["bg-[#e8e0f0]", "bg-[#dee9e8]", "bg-[#f0ead4]", "bg-[#e2deed]", "bg-[#dcebe0]", "bg-[#eee1e4]"][index % 6]}`}
                >
                  <header className="mb-3 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#a28bb7]" />
                    <h3 className="text-sm font-bold text-[#715b82]">
                      {stageLabels[stage]?.[locale] ?? stage}
                    </h3>
                    <span className="ms-auto rounded-full bg-white/50 px-2 py-0.5 text-xs text-[#a38baf]">
                      {items.length}
                    </span>
                    <button
                      disabled={!writable}
                      aria-label={t(
                        `Add to ${stage}`,
                        `افزودن به ${stageLabels[stage]?.fa}`,
                      )}
                      className="text-[#a58cb6]"
                      onClick={() => onAdd(stage)}
                    >
                      <Plus size={15} />
                    </button>
                  </header>
                  {entity === "opportunities" && (
                    <div className="mb-3 flex flex-wrap gap-2 text-xs text-[#9b85aa]">
                      {Object.entries(totals).map(([currency, amount]) => (
                        <span key={currency}>
                          {currency}{" "}
                          {amount.toLocaleString(
                            locale === "fa" ? "fa-IR" : "en-US",
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2.5">
                    <AnimatePresence initial={false}>
                      {items.slice(0, limit).map((record) => (
                        <BoardCard
                          key={record.id}
                          record={record}
                          state={state}
                          locale={locale}
                          writable={writable}
                          onOpen={onOpen}
                          onMove={onMove}
                          onDrop={(x, y) => drop(record, x, y)}
                        />
                      ))}
                    </AnimatePresence>
                    {!items.length && (
                      <div className="grid h-28 place-items-center rounded-xl border border-dashed border-[#cfc1db] text-xs text-[#baa8c5]">
                        {t("Drop a record here", "رکورد را اینجا رها کنید")}
                      </div>
                    )}
                    {items.length > limit && (
                      <button
                        className="w-full py-2 text-xs text-[#9c80b0]"
                        onClick={() =>
                          setLimits({ ...limits, [key]: limit + 20 })
                        }
                      >
                        {t("Load more", "نمایش بیشتر")} ({items.length - limit})
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
