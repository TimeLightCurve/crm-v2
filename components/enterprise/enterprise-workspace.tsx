"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Download, FolderOpen, GitBranch, Lightbulb, ListTodo, Plus, Search, Sparkles, Users, X } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
import { decisionStages, kinds, type EnterpriseRecord, type Kind } from "@/lib/enterprise/domain";
import { useSession } from "@/lib/backend";
import RelationshipMap from "./relationship-map";

const labels: Record<Kind, [string, string]> = {
  decision: ["Decisions", "تصمیم‌ها"], case: ["Cases", "پرونده‌ها"], meeting: ["Meetings", "جلسه‌ها"],
  action: ["Actions", "اقدام‌ها"], knowledge: ["Memory", "حافظه سازمانی"], risk: ["Risk documents", "سندهای ریسک"],
};
const icons = { decision: GitBranch, case: FolderOpen, meeting: Users, action: ListTodo, knowledge: Lightbulb, risk: AlertTriangle };
const stages: Record<string, [string, string]> = {
  framing: ["Framing", "صورت‌بندی"], evidence: ["Evidence", "شواهد و زمینه"], options: ["Options", "گزینه‌ها"], evaluation: ["Evaluation", "ارزیابی"],
  ready: ["Ready to decide", "آماده تصمیم"], execution: ["Execution", "اجرا"], outcome: ["Outcome", "پیامد"],
  identified: ["Identified", "شناسایی‌شده"], assessing: ["Assessing", "در حال ارزیابی"], mitigating: ["Mitigating", "در حال کاهش"], monitoring: ["Monitoring", "پایش"], closed: ["Closed", "بسته‌شده"],
  open: ["Open", "باز"], active: ["Active", "در جریان"], done: ["Done", "انجام‌شده"],
};
const blank = (kind: Kind, ownerId: string): Partial<EnterpriseRecord> => ({ kind, title: "", summary: "", ownerId, dueDate: "", stage: kind === "decision" ? "framing" : kind === "risk" ? "identified" : "open", sourceIds: [], evidence: [], options: [], gaps: [], severity: "medium", likelihood: "possible", impact: "", mitigation: "", reviewDate: "" });
const inputStyle = "w-full rounded-xl border border-[#d8d1e4] bg-white/90 px-3 py-2.5 text-sm outline-none focus:border-[#7564b2]";
const cardStyle = "rounded-[24px] border border-[#e4dfec] bg-[#fffef9] shadow-[0_15px_40px_#30294a0b]";
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }
function lines(value: string) { return value.split("\n").map((part) => part.trim()).filter(Boolean); }
export default function EnterpriseWorkspace({ locale }: { locale: Locale }) {
  const session = useSession();
  const t = (en: string, fa: string) => locale === "fa" ? fa : en;
  const [records, setRecords] = useState<EnterpriseRecord[]>([]);
  const [kind, setKind] = useState<Kind | "desk">("desk");
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState<Partial<EnterpriseRecord> | null>(null);
  const [query, setQuery] = useState("");
  const [attention, setAttention] = useState<"overdue" | "pending" | "risk" | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ id: number; actor_id: string; event_type: string; changed_at: string; revision: number }[]>([]);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/enterprise/records", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw Error(body.error || "Could not load enterprise records");
    setRecords(body);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void refresh().catch((cause) => setError(cause.message)).finally(() => setLoading(false)); }, 0); return () => window.clearTimeout(timer); }, [refresh]);
  const current = records.find((record) => record.id === selected);
  useEffect(() => {
    if (!selected) return;
    fetch(`/api/enterprise/records/${selected}`, { cache: "no-store" }).then((response) => response.json()).then((body) => setHistory(body.history || [])).catch(() => setHistory([]));
  }, [selected, current?.revision]);
  const filtered = useMemo(() => records.filter((record) => {
    if (kind !== "desk" && record.kind !== kind) return false;
    if (!`${record.title} ${record.summary}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (attention === "overdue") return Boolean(record.dueDate && record.dueDate < new Date().toISOString().slice(0, 10) && !["done", "closed", "outcome"].includes(record.stage));
    if (attention === "pending") return record.kind === "decision" && record.stage === "ready" && !record.approvedAt;
    if (attention === "risk") return record.kind === "risk" && ["high", "critical"].includes(record.severity) && record.stage !== "closed";
    return true;
  }), [records, kind, query, attention]);
  const overdue = records.filter((record) => record.dueDate && record.dueDate < new Date().toISOString().slice(0, 10) && !["done", "closed", "outcome"].includes(record.stage));
  const pending = records.filter((record) => record.kind === "decision" && record.stage === "ready" && !record.approvedAt);
  const risky = records.filter((record) => record.kind === "risk" && ["high", "critical"].includes(record.severity) && record.stage !== "closed");
  const selectFromMap = useCallback((record: EnterpriseRecord) => {
    setKind(record.kind);
    setAttention(null);
    setSelected(record.id);
    setEditing(null);
  }, []);
  async function submit() {
    if (!editing) return;
    setBusy(true); setError("");
    const target = editing.id;
    const data = { ...editing }; delete data.id; delete data.kind; delete data.revision; delete data.createdAt; delete data.updatedAt; delete data.approvedAt; delete data.approvedBy;
    try {
      const response = await fetch(target ? `/api/enterprise/records/${target}` : "/api/enterprise/records", {
        method: target ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target ? { revision: editing.revision, data } : { kind: editing.kind, data }),
      });
      const body = await response.json(); if (!response.ok) throw Error(body.error || "Save failed");
      await refresh(); setSelected(body.id); setKind(body.kind); setAttention(null); setEditing(null);
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  async function approve() {
    if (!current || !window.confirm(t("Approve this decision as a manager?", "این تصمیم به عنوان مدیر تأیید شود؟"))) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/enterprise/records/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: current.revision, action: "approve" }) });
      const body = await response.json(); if (!response.ok) throw Error(body.error || "Approval failed"); await refresh();
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  function update(field: keyof EnterpriseRecord, value: unknown) { setEditing((previous) => previous ? { ...previous, [field]: value } : previous); }
  function exportRecords() {
    download("nabz-enterprise-records.json", JSON.stringify({ exportedAt: new Date().toISOString(), records: filtered }, null, 2), "application/json");
  }
  function exportCsv() {
    const head = ["kind", "title", "stage", "ownerId", "dueDate", "summary", "revision"].join(",");
    const rows = filtered.map((record) => [record.kind, record.title, record.stage, record.ownerId, record.dueDate, record.summary, String(record.revision)].map(csvCell).join(","));
    download("nabz-enterprise-records.csv", `\uFEFF${[head, ...rows].join("\r\n")}`, "text/csv;charset=utf-8");
  }
  return <section dir={locale === "fa" ? "rtl" : "ltr"} className="min-h-[80vh] rounded-[30px] bg-[#f8f6fc] p-4 text-[#302e43] sm:p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-wide text-[#7d70a5]">NABZ · ENTERPRISE</p><h1 className="mt-1 text-3xl font-bold">{t("Company decision desk", "میز تصمیم شرکت")}</h1><p className="mt-2 text-sm text-[#767189]">{t("Decisions, evidence, risks and follow-through in one accountable workspace.", "تصمیم‌ها، شواهد، ریسک‌ها و پیگیری در یک فضای پاسخ‌گو.")}</p></div><div className="flex gap-2"><button onClick={exportCsv} className="rounded-xl border border-[#d8d1e4] bg-white px-3 py-2 text-xs"><Download size={15} className="inline" /> CSV</button><button onClick={exportRecords} className="rounded-xl border border-[#d8d1e4] bg-white px-3 py-2 text-xs"><Download size={15} className="inline" /> JSON</button></div></div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-[#e9b8b0] bg-[#fff0ee] p-3 text-sm text-[#973e3d]">{error} <button onClick={() => { setError(""); void refresh().catch((cause) => setError(cause.message)); }} className="underline">{t("Retry", "تلاش دوباره")}</button></div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat icon={ListTodo} label={t("Overdue", "عقب‌افتاده")} count={overdue.length} tone="rose" onClick={() => { setKind("desk"); setAttention(attention === "overdue" ? null : "overdue"); setSelected(""); }} /><Stat icon={GitBranch} label={t("Awaiting decision", "منتظر تصمیم")} count={pending.length} tone="amber" onClick={() => { setKind("decision"); setAttention(attention === "pending" ? null : "pending"); setSelected(""); }} /><Stat icon={AlertTriangle} label={t("High risks", "ریسک‌های بالا")} count={risky.length} tone="violet" onClick={() => { setKind("risk"); setAttention(attention === "risk" ? null : "risk"); setSelected(""); }} /></div>
    {records.length > 0 && <div className={`${cardStyle} mb-5 p-4`}><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold">{t("Relationship map", "نقشه روابط")}</h2><p className="text-xs text-[#827c96]">{t("Only saved links between authorized records appear", "فقط پیوندهای ثبت‌شده میان رکوردهای مجاز نمایش داده می‌شود")}</p></div><button onClick={() => setShowMap(!showMap)} aria-expanded={showMap} className="rounded-xl bg-[#e7e0f4] px-3 py-2 text-xs font-bold">{showMap ? t("Close map", "بستن نقشه") : t("Open 3D map", "نمای سه‌بعدی")}</button></div>{showMap && <RelationshipMap records={records} onSelect={selectFromMap} locale={locale} />}</div>}
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]"><nav aria-label={t("Enterprise areas", "بخش‌های سازمانی")} className={`${cardStyle} p-3`}><button onClick={() => { setKind("desk"); setAttention(null); setSelected(""); }} className={`mb-2 w-full rounded-xl px-3 py-3 text-start text-sm ${kind === "desk" ? "bg-[#dcd3f4] font-bold" : "hover:bg-[#f1ecf8]"}`}><Sparkles size={17} className="me-2 inline" />{t("Manager desk", "میز مدیر")}</button>{kinds.map((item) => { const Icon = icons[item]; return <button key={item} onClick={() => { setKind(item); setAttention(null); setSelected(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-start text-sm ${kind === item ? "bg-[#dcd3f4] font-bold" : "hover:bg-[#f1ecf8]"}`}><span><Icon size={17} className="me-2 inline" />{t(...labels[item])}</span><span className="text-xs text-[#827c96]">{records.filter((record) => record.kind === item).length}</span></button>; })}<div className="mt-4 rounded-xl bg-[#e5f1e8] p-3 text-xs leading-6 text-[#355a4c]">{t("AI suggestions require configured providers. Records and approval work without a model.", "پیشنهاد هوش مصنوعی به مدل متصل نیاز دارد. ثبت، پیگیری و تأیید بدون مدل کار می‌کنند.")}</div></nav>
      <div className="space-y-4"><div className={`${cardStyle} flex flex-wrap items-center gap-3 p-4`}><div className="relative min-w-48 flex-1"><Search size={16} className="absolute start-3 top-3 text-[#978ca8]" /><input className={`${inputStyle} ps-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search records", "جست‌وجوی پرونده‌ها")} /></div><button onClick={() => { setEditing(blank(kind === "desk" ? "decision" : kind, session?.user?.id || "")); setSelected(""); }} className="rounded-xl bg-[#524598] px-4 py-2.5 text-sm font-bold text-white"><Plus size={17} className="me-1 inline" />{t("Create", "ایجاد")}</button></div>
      {selected && current && !editing ? <div className={`${cardStyle} p-5`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[#827c96]">{t(...labels[current.kind])} · {t(...(stages[current.stage] || [current.stage, current.stage]))} · v{current.revision}</p><h2 className="mt-1 text-2xl font-bold">{current.title}</h2></div><button onClick={() => setSelected("")} aria-label={t("Close detail", "بستن جزئیات")}><X size={19} /></button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7">{current.summary || t("No summary yet", "هنوز خلاصه‌ای ثبت نشده است")}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><Mini label={t("Owner", "مسئول")} value={current.ownerId || t("Unassigned", "تعیین نشده")} /><Mini label={t("Due date", "موعد")} value={current.dueDate || "—"} /><Mini label={t("Approval", "تأیید")} value={current.approvedAt ? `${current.approvedBy} · ${new Date(current.approvedAt).toLocaleString(locale)}` : t("Pending", "تأیید نشده")} /></div>
        {current.kind === "decision" && <><div className="mt-5 grid gap-3 md:grid-cols-2"><List title={t("Options", "گزینه‌ها")} values={current.options} /><List title={t("Evidence", "شواهد")} values={current.evidence} /><List title={t("Unresolved gaps", "ابهام‌های باز")} values={current.gaps} /><List title={t("Linked sources", "منابع پیوندی")} values={current.sourceIds} /></div><div className="mt-5 flex flex-wrap gap-2">{decisionStages.map((stage) => <span key={stage} className={`rounded-full px-3 py-1 text-xs ${current.stage === stage ? "bg-[#aa99dc] font-bold" : "bg-[#f0ecf5]"}`}>{t(...stages[stage])}</span>)}</div></>}
        {current.kind === "risk" && <div className="mt-5 grid gap-3 md:grid-cols-2"><Mini label={t("Severity / likelihood", "شدت / احتمال")} value={`${current.severity} / ${current.likelihood}`} /><Mini label={t("Review date", "تاریخ بازبینی")} value={current.reviewDate} /><Mini label={t("Impact", "اثر")} value={current.impact} /><Mini label={t("Mitigation", "راهکار کاهش")} value={current.mitigation} /><List title={t("Evidence", "شواهد")} values={current.evidence} /><List title={t("Linked records", "پرونده‌های مرتبط")} values={current.sourceIds} /></div>}
        {!(["decision", "risk"] as Kind[]).includes(current.kind) && <div className="mt-5 grid gap-3 md:grid-cols-2"><List title={t("Evidence / notes", "شواهد / یادداشت‌ها")} values={current.evidence} /><List title={t("Linked records", "رکوردهای مرتبط")} values={current.sourceIds} /></div>}
        <div className="mt-5 flex flex-wrap gap-2"><button disabled={Boolean(current.approvedAt)} title={current.approvedAt ? t("Create a superseding decision to change an approved result", "برای تغییر تصمیم تأییدشده، تصمیم جدید ثبت کنید") : undefined} onClick={() => setEditing({ ...current })} className="rounded-xl bg-[#e7e0f4] px-4 py-2 text-sm font-bold disabled:opacity-50">{t("Edit", "ویرایش")}</button>{current.kind === "decision" && current.stage === "ready" && !current.approvedAt && <button disabled={busy} onClick={approve} className="rounded-xl bg-[#dceedd] px-4 py-2 text-sm font-bold text-[#27654a]"><CheckCircle2 size={16} className="me-1 inline" />{t("Manager approval", "تأیید مدیر")}</button>}<button onClick={() => download(`${current.kind}-${current.id}.json`, JSON.stringify({ record: current, history }, null, 2), "application/json")} className="rounded-xl border border-[#d8d1e4] px-4 py-2 text-sm"><Download size={15} className="me-1 inline" />{t("Export with history", "خروجی با تاریخچه")}</button></div><div className="mt-5 border-t border-[#ece7f1] pt-4"><h3 className="mb-2 text-sm font-bold">{t("Audit history", "تاریخچه تغییرات")}</h3>{history.map((entry) => <p key={entry.id} className="py-1 text-xs text-[#756f85]">{entry.event_type} · {entry.actor_id} · v{entry.revision} · {new Date(entry.changed_at).toLocaleString(locale)}</p>)}</div></div> : null}
      {editing && <div className={`${cardStyle} p-5`}><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{editing.id ? t("Edit record", "ویرایش رکورد") : t("New record", "رکورد جدید")} · {t(...labels[editing.kind || "decision"])}</h2><button onClick={() => setEditing(null)} aria-label={t("Close form", "بستن فرم")}><X size={18} /></button></div><div className="grid gap-3 sm:grid-cols-2"><Field label={t("Title", "عنوان")}><input className={inputStyle} value={editing.title || ""} onChange={(event) => update("title", event.target.value)} maxLength={180} /></Field><Field label={t("Owner ID", "شناسه مسئول")}><input className={inputStyle} value={editing.ownerId || ""} onChange={(event) => update("ownerId", event.target.value)} /></Field><Field label={t("Due date", "موعد")}><input type="date" className={inputStyle} value={editing.dueDate || ""} onChange={(event) => update("dueDate", event.target.value)} /></Field><Field label={t("Stage", "مرحله")}><select className={inputStyle} value={editing.stage || "open"} onChange={(event) => update("stage", event.target.value)}>{(editing.kind === "decision" ? [...decisionStages] : editing.kind === "risk" ? ["identified", "assessing", "mitigating", "monitoring", "closed"] : ["open", "active", "done"]).map((stage) => <option key={stage} value={stage}>{t(...stages[stage])}</option>)}</select></Field></div><Field label={t("Summary / context", "خلاصه / زمینه")}><textarea className={`${inputStyle} min-h-24`} value={editing.summary || ""} onChange={(event) => update("summary", event.target.value)} /></Field>
        {editing.kind === "risk" && <div className="grid gap-3 sm:grid-cols-3"><Field label={t("Severity", "شدت")}><select className={inputStyle} value={editing.severity || "medium"} onChange={(event) => update("severity", event.target.value)}>{["low", "medium", "high", "critical"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label={t("Likelihood", "احتمال")}><select className={inputStyle} value={editing.likelihood || "possible"} onChange={(event) => update("likelihood", event.target.value)}>{["unlikely", "possible", "likely"].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label={t("Review date", "تاریخ بازبینی")}><input type="date" className={inputStyle} value={editing.reviewDate || ""} onChange={(event) => update("reviewDate", event.target.value)} /></Field><Field label={t("Impact", "اثر")}><textarea className={inputStyle} value={editing.impact || ""} onChange={(event) => update("impact", event.target.value)} /></Field><Field label={t("Mitigation", "راهکار کاهش")}><textarea className={inputStyle} value={editing.mitigation || ""} onChange={(event) => update("mitigation", event.target.value)} /></Field></div>}
        {(["decision", "risk"] as Kind[]).includes(editing.kind || "decision") && <div className="grid gap-3 sm:grid-cols-2"><Field label={t("Options (one per line)", "گزینه‌ها (هر خط یک مورد)")}><textarea className={inputStyle} value={(editing.options || []).join("\n")} onChange={(event) => update("options", lines(event.target.value))} /></Field><Field label={t("Unresolved gaps", "ابهام‌های باز")}><textarea className={inputStyle} value={(editing.gaps || []).join("\n")} onChange={(event) => update("gaps", lines(event.target.value))} /></Field></div>}
        <div className="grid gap-3 sm:grid-cols-2"><Field label={t("Evidence (one per line)", "شواهد (هر خط یک مورد)")}><textarea className={inputStyle} value={(editing.evidence || []).join("\n")} onChange={(event) => update("evidence", lines(event.target.value))} /></Field><Field label={t("Linked record IDs", "شناسه رکوردهای مرتبط")}><textarea className={inputStyle} value={(editing.sourceIds || []).join("\n")} onChange={(event) => update("sourceIds", lines(event.target.value))} /></Field></div><button disabled={busy} onClick={submit} className="mt-5 rounded-xl bg-[#524598] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? t("Saving…", "در حال ذخیره…") : t("Save record", "ذخیره رکورد")}</button></div>}
      {!editing && <div className={`${cardStyle} p-4`}><h2 className="mb-3 text-base font-bold">{kind === "desk" ? t("Your organization's records", "رکوردهای سازمان") : t(...labels[kind])}</h2>{loading ? <p className="text-sm text-[#817b92]">{t("Loading…", "در حال بارگذاری…")}</p> : filtered.length === 0 ? <p className="rounded-xl bg-[#f5f1fa] p-5 text-sm text-[#817b92]">{t("No records yet. Create the first reviewed record.", "هنوز رکوردی ثبت نشده است. نخستین رکورد قابل بازبینی را ایجاد کنید.")}</p> : <div className="divide-y divide-[#ece7f1]">{filtered.map((record) => { const Icon = icons[record.kind]; return <button key={record.id} onClick={() => { setSelected(record.id); setEditing(null); }} className="flex w-full flex-wrap items-center gap-3 px-2 py-4 text-start hover:bg-[#f8f5fb]"><span className="rounded-xl bg-[#eee7fa] p-2 text-[#6253a2]"><Icon size={17} /></span><span className="min-w-48 flex-1"><strong className="block text-sm">{record.title}</strong><small className="block truncate text-[#867f97]">{record.summary || t(...labels[record.kind])}</small></span><span className="rounded-full bg-[#eeeaf5] px-3 py-1 text-xs">{t(...(stages[record.stage] || [record.stage, record.stage]))}</span>{record.dueDate && <span className="text-xs text-[#80788d]"><CalendarDays size={13} className="me-1 inline" />{record.dueDate}</span>}<ArrowLeft size={15} className="text-[#948ba7]" /></button>; })}</div>}</div>}
      </div></div>
  </section>;
}
function Stat({ icon: Icon, label, count, tone, onClick }: { icon: typeof AlertTriangle; label: string; count: number; tone: "rose" | "amber" | "violet"; onClick: () => void }) { const colors = { rose: "bg-[#fff0ef] text-[#ae554d]", amber: "bg-[#fff4df] text-[#95632d]", violet: "bg-[#eee8fa] text-[#6954aa]" }; return <button onClick={onClick} className={`rounded-[20px] p-4 text-start ${colors[tone]}`}><Icon size={19} /><span className="mt-2 block text-2xl font-bold">{count}</span><span className="text-xs">{label}</span></button>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-3 block text-xs font-bold text-[#68627b]">{label}<div className="mt-1">{children}</div></label>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#f5f1fa] p-3"><small className="block text-[#837b93]">{label}</small><span className="mt-1 block whitespace-pre-wrap text-sm">{value}</span></div>; }
function List({ title, values }: { title: string; values: string[] }) { return <div className="rounded-xl bg-[#f5f1fa] p-3"><strong className="text-xs">{title}</strong>{values.length ? <ul className="mt-2 list-inside list-disc space-y-1 text-sm">{values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul> : <p className="mt-2 text-xs text-[#8b8498]">—</p>}</div>; }
