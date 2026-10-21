"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  FileText,
  Filter,
  History,
  LayoutGrid,
  List,
  ListTodo,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import {
  assertWrite,
  csvEscape,
  currentRole,
  currentWorkspace,
  moveRecord,
  saveRecord,
  trashRecord,
  workspaceRecords,
} from "@/lib/records/model";
import {
  blankRecord,
  entityLabels,
  stageLabels,
  stagesFor,
} from "@/lib/records/seed";
import { commitCrm, useCrmState } from "@/lib/records/store";
import type {
  CrmRecord,
  CrmState,
  Entity,
  SavedView,
} from "@/lib/records/types";
import RecordDrawer, { RecordEditor } from "./record-detail";
import RecordBoard from "./record-board";
import FieldsManager from "./fields";
import ActivityFeed from "./activity-feed";
import ImportRecords from "./import-records";
import WorkspaceSettings from "./workspace-settings";
import BoardSidekick from "../agents/board-sidekick";
import AgentWorkspace from "../agents/agent-workspace";
import { buttonClass, downloadFile, Empty, inputClass, Modal } from "./ui";
const entityIcons = {
  people: Users,
  companies: Building2,
  opportunities: TrendingUp,
  tasks: ListTodo,
  notes: FileText,
};
type Section = Entity | "activity" | "fields" | "settings" | "agents";
export default function CrmWorkspace({
  locale,
  onCallPerson,
}: {
  locale: Locale;
  onCallPerson: (record: CrmRecord) => void;
}) {
  const state = useCrmState();
  return state ? (
    <Content
      key={state.activeWorkspaceId}
      state={state}
      locale={locale}
      onCallPerson={onCallPerson}
    />
  ) : (
    <div className="h-96 animate-pulse rounded-3xl bg-[#e0daee]" />
  );
}
function Content({
  state,
  locale,
  onCallPerson,
}: {
  state: CrmState;
  locale: Locale;
  onCallPerson: (record: CrmRecord) => void;
}) {
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  const root = useRef<HTMLElement>(null);
  const [section, setSection] = useState<Section>("people"),
    [mode, setMode] = useState<SavedView["mode"]>("table"),
    [query, setQuery] = useState(""),
    [stage, setStage] = useState(""),
    [owner, setOwner] = useState(""),
    [sort, setSort] = useState("updated"),
    [trash, setTrash] = useState("active"),
    [page, setPage] = useState(0),
    [checked, setChecked] = useState<string[]>([]),
    [openId, setOpenId] = useState(""),
    [editing, setEditing] = useState<CrmRecord | null>(null),
    [importing, setImporting] = useState(false),
    [notice, setNotice] = useState(""),
    [saveView, setSaveView] = useState(false),
    [viewName, setViewName] = useState(""),
    [activeView, setActiveView] = useState(""),
    [columnsOpen, setColumnsOpen] = useState(false),
    [columns, setColumns] = useState(["company", "email", "dueDate"]),
    [customField, setCustomField] = useState(""),
    [customValue, setCustomValue] = useState(""),
    [assistant, setAssistant] = useState(false),
    [notifications, setNotifications] = useState(false),
    [quickFind, setQuickFind] = useState(false),
    [globalQuery, setGlobalQuery] = useState("");
  const entity = (
    ["people", "companies", "opportunities", "tasks", "notes"].includes(section)
      ? section
      : "people"
  ) as Entity;
  const workspace = currentWorkspace(state),
    writable = currentRole(state) !== "viewer";
  const all = workspaceRecords(state),
    allWithTrash = workspaceRecords(state, true);
  const fields = state.fields.filter(
    (f) => f.workspaceId === state.activeWorkspaceId && f.entity === entity,
  );
  const filtered = allWithTrash
    .filter(
      (record) =>
        record.entity === entity &&
        (trash === "all" ||
          (trash === "trashed" ? !!record.deletedAt : !record.deletedAt)) &&
        (!stage || record.stage === stage) &&
        (!owner || record.ownerId === owner) &&
        (!customField ||
          String(record.custom[customField] ?? "")
            .toLowerCase()
            .includes(customValue.toLowerCase())) &&
        `${record.name} ${record.description} ${record.email} ${record.phone} ${record.tags.join(" ")} ${JSON.stringify(record.custom)} ${all.find((r) => r.id === record.companyId)?.name ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "value"
          ? b.amount - a.amount
          : sort === "due"
            ? (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
            : b.updatedAt.localeCompare(a.updatedAt),
    );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 20) - 1),
  );
  const paged = filtered.slice(currentPage * 20, currentPage * 20 + 20);
  const record = allWithTrash.find((r) => r.id === openId);
  const views = state.views.filter(
    (v) => v.workspaceId === state.activeWorkspaceId && v.entity === entity,
  );
  const unread = state.notifications.filter(
    (n) =>
      n.workspaceId === state.activeWorkspaceId &&
      n.recipientId === state.currentMemberId &&
      !n.read,
  );
  const globalResults = all
    .filter((r) =>
      `${r.name} ${r.email} ${r.description}`
        .toLowerCase()
        .includes(globalQuery.toLowerCase()),
    )
    .slice(0, 30);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "k" &&
        root.current?.offsetParent !== null
      ) {
        event.preventDefault();
        setQuickFind(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function run(action: () => void, message?: string) {
    try {
      action();
      if (message) setNotice(message);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function add(nextStage?: string) {
    setEditing({
      ...blankRecord(entity, state.activeWorkspaceId),
      ownerId: state.currentMemberId,
      ...(nextStage ? { stage: nextStage } : {}),
    });
  }
  function changeSection(next: Section) {
    setSection(next);
    setChecked([]);
    setPage(0);
    setStage("");
    setOwner("");
    setQuery("");
    setTrash("active");
    setActiveView("");
    setCustomField("");
    setCustomValue("");
    setMode(
      next === "opportunities"
        ? "board"
        : next === "companies" || next === "notes"
          ? "cards"
          : "table",
    );
  }
  function move(
    id: string,
    nextStage: string,
    targetId?: string,
    newOwner?: string,
  ) {
    run(
      () =>
        commitCrm((s) => {
          let next = s;
          if (
            newOwner &&
            newOwner !== s.records.find((r) => r.id === id)?.ownerId
          )
            next = saveRecord(s, {
              ...s.records.find((r) => r.id === id)!,
              ownerId: newOwner,
            });
          return moveRecord(next, id, nextStage, targetId);
        }),
      t("Board updated", "برد به‌روز شد"),
    );
  }
  function exportCsv() {
    const list = checked.length
      ? filtered.filter((r) => checked.includes(r.id))
      : filtered;
    const base = [
      "name",
      "description",
      "email",
      "phone",
      "website",
      "stage",
      "priority",
      "amount",
      "currency",
      "dueDate",
      "ownerId",
      "companyId",
      "personId",
      "tags",
      "relatedIds",
    ] as const;
    const header = [...base, ...fields.map((f) => `custom:${f.id}`)];
    const rows = list.map((r) => [
      ...base.map((key) =>
        Array.isArray(r[key]) ? (r[key] as string[]).join("|") : r[key],
      ),
      ...fields.map((f) =>
        Array.isArray(r.custom[f.id])
          ? (r.custom[f.id] as string[]).join("|")
          : (r.custom[f.id] ?? ""),
      ),
    ]);
    downloadFile(
      `forma-${entity}.csv`,
      "\uFEFF" +
        [header, ...rows]
          .map((row) => row.map(csvEscape).join(","))
          .join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  function loadView(id: string) {
    setActiveView(id);
    const view = views.find((v) => v.id === id);
    if (!view) return;
    setQuery(view.query);
    setStage(view.stage);
    setOwner(view.owner);
    setMode(view.mode);
    setSort(view.sort);
    setCustomField(view.customField ?? "");
    setCustomValue(view.customValue ?? "");
    setColumns(view.columns ?? ["company", "email", "dueDate"]);
    setTrash(view.trash ?? "active");
    setPage(0);
    setChecked([]);
  }
  const label = entityLabels[entity][locale],
    Icon = entityIcons[entity];
  const narrowSelect = inputClass + " w-auto! max-w-full py-2! text-xs!";
  return (
    <div
      className={`grid min-w-0 gap-4 ${assistant ? "xl:grid-cols-[minmax(0,1fr)_390px]" : ""}`}
    >
      <section
        ref={root}
        className="records-workspace min-w-0 rounded-[26px] border border-white/70 bg-[#d7d2e7] p-3 text-[#4e405d] sm:p-4"
      >
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <div className="me-auto">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[.12em] text-[#9a83ac]">
              {t("EVERY RELATIONSHIP, CONNECTED", "همه ارتباط‌ها، در کنار هم")}
            </p>
            <h1 className="text-xl font-bold rtl:font-[Nian,Anjoman,sans-serif]">
              {t("Your CRM, in focus.", "CRM شما، با نگاهی روشن.")}
            </h1>
          </div>
          <select
            aria-label={t("Switch CRM workspace", "تغییر فضای کاری CRM")}
            className={inputClass + " w-auto! max-w-[200px] py-2! text-xs!"}
            value={state.activeWorkspaceId}
            onChange={(e) =>
              commitCrm((s) => ({
                ...s,
                activeWorkspaceId: e.target.value,
                currentMemberId: s.workspaces
                  .find((w) => w.id === e.target.value)!
                  .members.some((m) => m.id === s.currentMemberId)
                  ? s.currentMemberId
                  : s.workspaces.find((w) => w.id === e.target.value)!
                      .members[0].id,
              }))
            }
          >
            {state.workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            className={buttonClass}
            aria-label={t("Search all records", "جست‌وجوی همه رکوردها")}
            onClick={() => setQuickFind(true)}
          >
            <Search size={16} />
          </button>
          <button
            className={buttonClass + " relative"}
            aria-label={t("Record notifications", "اعلان‌های رکوردها")}
            onClick={() => setNotifications(true)}
          >
            <Bell size={16} />
            {unread.length > 0 && (
              <span className="absolute -end-1 -top-1 rounded-full bg-[#ac8cc5] px-1.5 text-[10px] text-white">
                {unread.length}
              </span>
            )}
          </button>
          <button
            className={buttonClass + " bg-[#2d394e]! text-[#eae3f3]!"}
            aria-label={t("Ask Forma", "از فورما بپرسید")}
            onClick={() => setAssistant(true)}
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">
              {t("Ask Forma", "از فورما بپرسید")}
            </span>
          </button>
        </header>
        <nav
          className="mb-4 flex gap-1 overflow-x-auto rounded-2xl bg-[#29354c] p-1.5 [scrollbar-width:thin]"
          aria-label={t("CRM sections", "بخش‌های CRM")}
        >
          {(
            [
              ["people", Users],
              ["companies", Building2],
              ["opportunities", TrendingUp],
              ["tasks", ListTodo],
              ["notes", FileText],
              ["activity", History],
              ["fields", SlidersHorizontal],
              ["agents", Bot],
              ["settings", Settings2],
            ] as const
          ).map(([id, NavIcon]) => (
            <button
              key={id}
              aria-current={section === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${section === id ? "bg-[#b2a1d0] text-[#473557]" : "text-[#b9b5c9] hover:bg-white/10"}`}
              onClick={() => changeSection(id)}
            >
              <NavIcon size={15} />
              {id in entityLabels
                ? entityLabels[id as Entity][locale]
                : id === "activity"
                  ? t("Activity", "فعالیت‌ها")
                  : id === "agents"
                    ? t("Agents", "عامل‌ها")
                    : id === "fields"
                      ? t("Fields", "فیلدها")
                      : t("Settings", "تنظیمات")}
              {id in entityLabels && (
                <span className="hidden rounded-md bg-white/10 px-1.5 text-[10px] min-[1500px]:inline">
                  {all.filter((r) => r.entity === id).length}
                </span>
              )}
            </button>
          ))}
        </nav>
        {section === "agents" ? (
          <AgentWorkspace state={state} locale={locale} onOpen={setOpenId} />
        ) : section === "fields" ? (
          <FieldsManager state={state} locale={locale} notify={setNotice} />
        ) : section === "activity" ? (
          <ActivityFeed state={state} locale={locale} onOpen={setOpenId} />
        ) : section === "settings" ? (
          <WorkspaceSettings
            key={workspace.id + state.currentMemberId}
            state={state}
            locale={locale}
            notify={setNotice}
          />
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f3f1de] p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e4ddc5] text-[#9b8a58]">
                  <Icon size={21} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-[#695b40]">{label}</h2>
                  <p className="mt-0.5 text-xs text-[#8d7b54]">
                    {filtered.length} {t("records", "رکورد")} ·{" "}
                    {currentRole(state) === "viewer"
                      ? t("View only", "فقط مشاهده")
                      : t(
                          "A place for the details that matter.",
                          "فضایی برای جزئیات مهم.",
                        )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#c1d8cc] p-3">
                <button
                  disabled={!writable}
                  className={buttonClass + " bg-white/40!"}
                  onClick={() => add()}
                >
                  <Plus size={16} />
                  {t("New record", "رکورد جدید")}
                </button>
                <button
                  disabled={!writable}
                  className={buttonClass + " bg-white/30!"}
                  aria-label={t("Import CSV", "ورود CSV")}
                  onClick={() => setImporting(true)}
                >
                  <Upload size={15} />
                </button>
                <button
                  className={buttonClass + " bg-white/30!"}
                  aria-label={t("Export CSV", "خروجی CSV")}
                  onClick={exportCsv}
                >
                  <Download size={15} />
                </button>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="flex min-w-[140px] flex-1 items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 text-[#a991b8]">
                <Search size={15} />
                <input
                  aria-label={t(
                    "Search current records",
                    "جست‌وجوی رکوردهای این بخش",
                  )}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#b39dc0]"
                  placeholder={t(
                    "Search names, details, tags…",
                    "جست‌وجوی نام، جزئیات، برچسب…",
                  )}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <select
                aria-label={t("Filter stage", "فیلتر مرحله")}
                className={narrowSelect}
                value={stage}
                onChange={(e) => {
                  setStage(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("All stages", "همه مراحل")}</option>
                {stagesFor(entity).map((value) => (
                  <option key={value} value={value}>
                    {stageLabels[value]?.[locale] ?? value}
                  </option>
                ))}
              </select>
              <select
                aria-label={t("Filter owner", "فیلتر مسئول")}
                className={narrowSelect}
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("Everyone", "همه اعضا")}</option>
                {workspace.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                aria-label={t("Show deleted records", "نمایش رکوردهای حذف‌شده")}
                className={narrowSelect}
                value={trash}
                onChange={(e) => {
                  setTrash(e.target.value);
                  setChecked([]);
                }}
              >
                <option value="active">
                  {t("Active records", "رکوردهای فعال")}
                </option>
                <option value="trashed">{t("Trash", "زباله‌دان")}</option>
                <option value="all">{t("All records", "همه رکوردها")}</option>
              </select>
              <div className="flex rounded-xl bg-white/50 p-1">
                {(
                  [
                    ["table", List],
                    ["cards", LayoutGrid],
                    ["board", Columns3],
                  ] as const
                ).map(([value, ModeIcon]) => (
                  <button
                    key={value}
                    className={`rounded-lg p-2 ${mode === value ? "bg-[#b5a0cf] text-white" : "text-[#a58cb6]"}`}
                    aria-label={t(
                      `${value} view`,
                      `${{ table: "جدول", cards: "کارت", board: "برد" }[value]}`,
                    )}
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                  >
                    <ModeIcon size={15} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <select
                aria-label={t("Saved views", "نمای ذخیره‌شده")}
                className={narrowSelect}
                value={activeView}
                onChange={(e) => loadView(e.target.value)}
              >
                <option value="">{t("Saved views", "نماهای ذخیره‌شده")}</option>
                {views.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!writable}
                className="px-2 py-1 text-xs text-[#a17fb8]"
                onClick={() => setSaveView(true)}
              >
                {t("+ Save view", "+ ذخیره نما")}
              </button>
              {activeView && (
                <button
                  disabled={!writable}
                  aria-label={t("Delete saved view", "حذف نمای ذخیره‌شده")}
                  onClick={() => {
                    commitCrm((s) => ({
                      ...s,
                      views: s.views.filter((v) => v.id !== activeView),
                    }));
                    setActiveView("");
                  }}
                >
                  <X size={12} className="text-[#a88db8]" />
                </button>
              )}
              <select
                aria-label={t("Sort records", "مرتب‌سازی رکوردها")}
                className={narrowSelect + " ms-auto"}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {[
                  ["updated", t("Recently updated", "آخرین ویرایش")],
                  ["name", t("Name A–Z", "نام")],
                  ["value", t("Highest value", "بیشترین ارزش")],
                  ["due", t("Due date", "سررسید")],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {mode === "table" && (
                <button
                  className={buttonClass + " py-1.5! text-xs!"}
                  onClick={() => setColumnsOpen(!columnsOpen)}
                >
                  <SlidersHorizontal size={13} />
                  {t("Columns", "ستون‌ها")}
                </button>
              )}
              {fields.length > 0 && (
                <>
                  <Filter size={13} className="text-[#ad91be]" />
                  <select
                    aria-label={t("Custom field filter", "فیلتر فیلد سفارشی")}
                    className={narrowSelect}
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                  >
                    <option value="">{t("Custom field", "فیلد سفارشی")}</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label[locale]}
                      </option>
                    ))}
                  </select>
                  {customField && (
                    <input
                      aria-label={t(
                        "Custom field contains",
                        "مقدار فیلد سفارشی",
                      )}
                      className={inputClass + " w-32! py-2! text-xs!"}
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder={t("Contains…", "شامل…")}
                    />
                  )}
                </>
              )}
            </div>
            {columnsOpen && mode === "table" && (
              <div className="mb-4 flex flex-wrap gap-3 rounded-xl bg-white/50 p-3 text-xs text-[#9e80b1]">
                {[
                  ["company", t("Company", "شرکت")],
                  ["email", t("Email", "ایمیل")],
                  ["phone", t("Phone", "تلفن")],
                  ["dueDate", t("Due date", "سررسید")],
                  ["tags", t("Tags", "برچسب‌ها")],
                  ...fields.map((f) => [f.id, f.label[locale]]),
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={columns.includes(key)}
                      onChange={(e) =>
                        setColumns(
                          e.target.checked
                            ? [...columns, key]
                            : columns.filter((c) => c !== key),
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
            {checked.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#b7a3d1] p-3 text-xs text-[#f9f4fe]">
                <span>
                  {checked.length} {t("selected", "انتخاب‌شده")}
                </span>
                <button
                  disabled={!writable}
                  className="ms-auto flex items-center gap-1 rounded-lg bg-white/25 px-2 py-1"
                  onClick={() =>
                    run(
                      () => {
                        commitCrm((s) =>
                          checked.reduce(
                            (next, id) =>
                              trashRecord(next, id, trash === "trashed"),
                            s,
                          ),
                        );
                        setChecked([]);
                      },
                      t("Records updated", "رکوردها به‌روز شدند"),
                    )
                  }
                >
                  {trash === "trashed" ? (
                    <RotateCcw size={13} />
                  ) : (
                    <Trash2 size={13} />
                  )}{" "}
                  {trash === "trashed"
                    ? t("Restore", "بازیابی")
                    : t("Move to trash", "انتقال به زباله‌دان")}
                </button>
                <button onClick={() => setChecked([])}>
                  <X size={13} />
                </button>
              </div>
            )}
            {mode === "board" && trash === "active" ? (
              <RecordBoard
                records={filtered}
                state={state}
                entity={entity}
                locale={locale}
                writable={writable}
                onOpen={setOpenId}
                onMove={move}
                onAdd={add}
              />
            ) : mode === "cards" ? (
              <motion.div
                layout
                className="grid gap-3 sm:grid-cols-2 min-[1500px]:grid-cols-3"
              >
                <AnimatePresence>
                  {paged.map((item) => (
                    <motion.button
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      aria-label={item.name}
                      onClick={() => setOpenId(item.id)}
                      className={`rounded-[20px] border border-white p-5 text-start ${item.entity === "companies" ? "bg-[#c6ded0]" : item.entity === "notes" ? "bg-[#f2efd9]" : "bg-[#e7dcef]"}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="grid size-10 place-items-center rounded-xl bg-white/40 text-lg font-bold text-[#8c739e]">
                          {item.name.slice(0, 1)}
                        </span>
                        <span className="rounded-full bg-white/40 px-2 py-1 text-xs text-[#9a7bab]">
                          {stageLabels[item.stage]?.[locale] ?? item.stage}
                        </span>
                      </div>
                      <h3 className="truncate text-base font-bold">
                        {item.name}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#937f9f]">
                        {item.description ||
                          item.email ||
                          item.tags.join(" · ") ||
                          t(
                            "Open to add the details",
                            "برای افزودن جزئیات باز کنید",
                          )}
                      </p>
                      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-white/50 pt-3 text-xs text-[#8c729a]">
                        <span>
                          {workspace.members.find((m) => m.id === item.ownerId)
                            ?.name ?? "—"}
                        </span>
                        {item.entity === "opportunities" && (
                          <span>
                            {item.currency} {item.amount.toLocaleString()}
                          </span>
                        )}
                      </footer>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="overflow-x-auto rounded-[20px] border border-white bg-[#f7f5ec] [scrollbar-width:thin]">
                <table className="w-full min-w-[680px] text-start text-sm">
                  <thead className="border-b border-[#e6dfee] text-xs text-[#aa97b6]">
                    <tr>
                      <th className="w-10 p-3">
                        <input
                          aria-label={t(
                            "Select visible records",
                            "انتخاب رکوردهای صفحه",
                          )}
                          type="checkbox"
                          checked={
                            paged.length > 0 &&
                            paged.every((r) => checked.includes(r.id))
                          }
                          onChange={(e) =>
                            setChecked(
                              e.target.checked
                                ? [
                                    ...new Set([
                                      ...checked,
                                      ...paged.map((r) => r.id),
                                    ]),
                                  ]
                                : checked.filter(
                                    (id) => !paged.some((r) => r.id === id),
                                  ),
                            )
                          }
                        />
                      </th>
                      <th className="px-3 py-4 text-start">
                        {t("Name", "نام")}
                      </th>
                      <th className="px-3 py-4 text-start">
                        {t("Status", "وضعیت")}
                      </th>
                      <th className="px-3 py-4 text-start">
                        {t("Owner", "مسئول")}
                      </th>
                      {entity === "opportunities" && (
                        <th className="px-3 py-4 text-start">
                          {t("Value", "ارزش")}
                        </th>
                      )}
                      {columns.map((column) => (
                        <th key={column} className="px-3 py-4 text-start">
                          {fields.find((f) => f.id === column)?.label[locale] ??
                            (
                              {
                                company: t("Company", "شرکت"),
                                email: t("Email", "ایمیل"),
                                phone: t("Phone", "تلفن"),
                                dueDate: t("Due", "سررسید"),
                                tags: t("Tags", "برچسب‌ها"),
                              } as Record<string, string>
                            )[column] ??
                            column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((item) => (
                      <tr
                        key={item.id}
                        data-record-row={item.id}
                        className="border-b border-[#eae4ef] last:border-none hover:bg-white/60"
                      >
                        <td className="p-3">
                          <input
                            aria-label={t(
                              `Select ${item.name}`,
                              `انتخاب ${item.name}`,
                            )}
                            type="checkbox"
                            checked={checked.includes(item.id)}
                            onChange={(e) =>
                              setChecked(
                                e.target.checked
                                  ? [...checked, item.id]
                                  : checked.filter((id) => id !== item.id),
                              )
                            }
                          />
                        </td>
                        <td className="max-w-[260px] px-3 py-4">
                          <button
                            className="flex items-center gap-2 text-start font-semibold text-[#6a557a]"
                            aria-label={item.name}
                            onClick={() => setOpenId(item.id)}
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#dfd4e9] text-xs text-[#a083b2]">
                              {item.name.slice(0, 1)}
                            </span>
                            <span className="line-clamp-2">{item.name}</span>
                            {item.deletedAt && <Trash2 size={12} />}
                          </button>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`whitespace-nowrap rounded-lg px-2 py-1 text-xs ${["won", "done", "customer"].includes(item.stage) ? "bg-[#dcebdc] text-[#7f9b79]" : "bg-[#e7dbef] text-[#a081b0]"}`}
                          >
                            {stageLabels[item.stage]?.[locale] ?? item.stage}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-xs text-[#82708e]">
                          {workspace.members.find((m) => m.id === item.ownerId)
                            ?.name ?? "—"}
                        </td>
                        {entity === "opportunities" && (
                          <td className="whitespace-nowrap px-3 py-4 text-xs font-medium text-[#95749f]">
                            {item.currency} {item.amount.toLocaleString()}
                          </td>
                        )}
                        {columns.map((column) => (
                          <td
                            key={column}
                            className="max-w-[190px] truncate px-3 py-4 text-xs text-[#7e6c8b]"
                          >
                            {column === "company"
                              ? (all.find((r) => r.id === item.companyId)
                                  ?.name ?? "—")
                              : column === "tags"
                                ? item.tags.join(", ")
                                : fields.some((f) => f.id === column)
                                  ? String(item.custom[column] ?? "—")
                                  : String(
                                      item[column as keyof CrmRecord] ?? "—",
                                    )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!filtered.length && (
              <div className="mt-3">
                <Empty
                  title={t(
                    "A little room for your next opportunity.",
                    "فضایی برای فرصت بعدی شما.",
                  )}
                  description={t(
                    "Add a record, import your data, or adjust your filters.",
                    "رکورد اضافه کنید، داده وارد کنید یا فیلترها را تغییر دهید.",
                  )}
                >
                  <button
                    disabled={!writable}
                    className={buttonClass}
                    onClick={() => add()}
                  >
                    <Plus size={14} />
                    {t("Create a record", "ساخت رکورد")}
                  </button>
                </Empty>
              </div>
            )}
            {mode !== "board" && filtered.length > 20 && (
              <footer className="mt-4 flex items-center justify-end gap-3 text-xs text-[#a68db6]">
                <span>
                  {currentPage + 1} / {Math.ceil(filtered.length / 20)}
                </span>
                <button
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={16} className="rtl:rotate-180" />
                </button>
                <button
                  disabled={(currentPage + 1) * 20 >= filtered.length}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight size={16} className="rtl:rotate-180" />
                </button>
              </footer>
            )}
          </>
        )}
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-[#9e87ad]">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#95b6a3]" />
            {t("Stored in Nabz", "ذخیره‌شده در نبض")} ·{" "}
            {workspace.name}
          </span>
          <span>
            {t("Your data. Your workspace.", "داده شما، فضای کاری شما.")}
          </span>
        </footer>
        {record && (
          <RecordDrawer
            key={record.id}
            state={state}
            record={record}
            locale={locale}
            onClose={() => setOpenId("")}
            onOpen={setOpenId}
            onCall={onCallPerson}
            notify={setNotice}
          />
        )}
        {editing && (
          <RecordEditor
            state={state}
            record={editing}
            locale={locale}
            onClose={() => setEditing(null)}
            onSaved={(id) => {
              setEditing(null);
              setOpenId(id);
              setNotice(t("Record saved", "رکورد ذخیره شد"));
            }}
          />
        )}
        {importing && (
          <ImportRecords
            state={state}
            entity={entity}
            locale={locale}
            onClose={() => setImporting(false)}
            notify={setNotice}
          />
        )}
        {saveView && (
          <Modal
            title={t("Save this view", "ذخیره این نما")}
            locale={locale}
            onClose={() => setSaveView(false)}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() =>
                  commitCrm((s) => {
                    assertWrite(s);
                    return {
                      ...s,
                      views: [
                        ...s.views,
                        {
                          id: crypto.randomUUID(),
                          workspaceId: s.activeWorkspaceId,
                          entity,
                          name: viewName.trim(),
                          query,
                          stage,
                          owner,
                          mode,
                          sort,
                          customField,
                          customValue,
                          columns,
                          trash,
                        },
                      ],
                    };
                  }),
                );
                setSaveView(false);
                setViewName("");
              }}
            >
              <input
                required
                autoFocus
                aria-label={t("View name", "نام نما")}
                className={inputClass}
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder={t(
                  "My priority opportunities",
                  "فرصت‌های اولویت‌دار من",
                )}
              />
              <button className={buttonClass + " mt-4"}>
                {t("Save view", "ذخیره نما")}
              </button>
            </form>
          </Modal>
        )}

        {notifications && (
          <Modal
            title={t("Your notifications", "اعلان‌های شما")}
            locale={locale}
            onClose={() => setNotifications(false)}
          >
            <button
              className={buttonClass + " mb-4"}
              onClick={() =>
                commitCrm((s) => ({
                  ...s,
                  notifications: s.notifications.map((n) =>
                    n.workspaceId === s.activeWorkspaceId &&
                    n.recipientId === s.currentMemberId
                      ? { ...n, read: true }
                      : n,
                  ),
                }))
              }
            >
              {t("Mark all read", "خواندن همه")}
            </button>
            <div className="space-y-2">
              {state.notifications
                .filter(
                  (n) =>
                    n.workspaceId === state.activeWorkspaceId &&
                    n.recipientId === state.currentMemberId,
                )
                .map((n) => (
                  <button
                    key={n.id}
                    className={`w-full rounded-xl p-3 text-start text-sm ${n.read ? "bg-white/50 text-[#b4a3be]" : "bg-[#e9dbf2] text-[#9670aa]"}`}
                    onClick={() => {
                      commitCrm((s) => ({
                        ...s,
                        notifications: s.notifications.map((item) =>
                          item.id === n.id ? { ...item, read: true } : item,
                        ),
                      }));
                      setNotifications(false);
                      setOpenId(n.recordId);
                    }}
                  >
                    {n.text}
                  </button>
                ))}
            </div>
            {!state.notifications.some(
              (n) =>
                n.workspaceId === state.activeWorkspaceId &&
                n.recipientId === state.currentMemberId,
            ) && (
              <Empty
                title={t("All quiet here", "اینجا همه چیز آرام است")}
                description={t(
                  "Mentions and assignments will appear here.",
                  "منشن‌ها و کارهای ارجاع‌شده اینجا نمایش داده می‌شوند.",
                )}
              />
            )}
          </Modal>
        )}
        {quickFind && (
          <Modal
            title={t(
              "Find anything in this workspace",
              "هر چیزی را در این فضای کاری پیدا کنید",
            )}
            locale={locale}
            onClose={() => setQuickFind(false)}
          >
            <input
              autoFocus
              aria-label={t("Global record search", "جست‌وجوی سراسری رکورد")}
              className={inputClass + " mb-4"}
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder={t(
                "People, companies, opportunities…",
                "افراد، شرکت‌ها، فرصت‌ها…",
              )}
            />
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {globalResults.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/65 p-3 text-start text-sm text-[#8f729e]"
                  onClick={() => {
                    setQuickFind(false);
                    setOpenId(item.id);
                  }}
                >
                  <span className="rounded-lg bg-[#e9dff0] px-2 py-1 text-xs">
                    {entityLabels[item.entity][locale]}
                  </span>
                  {item.name}
                </button>
              ))}
            </div>
          </Modal>
        )}
        <AnimatePresence>
          {notice && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-5 start-1/2 z-[60] flex w-max max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#dacbe5] bg-[#fbf8fe] px-4 py-3 text-sm text-[#9a7bad] shadow-lg rtl:translate-x-1/2"
            >
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label={t(
                  "Dismiss records notification",
                  "بستن اعلان رکوردها",
                )}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <AnimatePresence>
        {assistant && (
          <BoardSidekick
            key="board-sidekick"
            state={state}
            locale={locale}
            entity={entity}
            recordIds={filtered.filter((r) => !r.deletedAt).map((r) => r.id)}
            onClose={() => setAssistant(false)}
            onOpen={setOpenId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
