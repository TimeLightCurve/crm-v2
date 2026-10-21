"use client";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ListTodo, Plus, RefreshCw } from "lucide-react";
import { backend, useSession } from "@/lib/backend";
import type { Locale } from "@/lib/crm-data";
import { buttonClass, inputClass, Modal } from "./records/ui";
interface Deal {
  id: string;
  title: string;
  customer: string;
  amount: string;
  stage: string;
  version: number;
  note: string;
  due_at: string | null;
}
interface Task {
  id: string;
  title: string;
  department: string;
  status: string;
}
export default function NativeWorkspace({ locale }: { locale: Locale }) {
  const session = useSession(),
    user = session?.user;
  const [data, setData] = useState<{ deals: Deal[]; tasks: Task[] }>({
      deals: [],
      tasks: [],
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [adding, setAdding] = useState<"deal" | "task" | null>(null),
    [losing, setLosing] = useState<Deal | null>(null);
  const t = (en: string, fa: string) => (locale === "fa" ? fa : en);
  const allowed = (key: string) =>
    !!user?.permissions.some((p) => p === "*" || p === key);
  async function refresh() {
    setBusy(true);
    try {
      const [deals, tasks] = await Promise.all([
        backend<Deal[]>("deals"),
        backend<Task[]>("tasks"),
      ]);
      setData({ deals: deals || [], tasks: tasks || [] });
      setError("");
      setLoaded(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    Promise.all([backend<Deal[]>("deals"), backend<Task[]>("tasks")])
      .then(([deals, tasks]) => {
        if (active) {
          setData({ deals: deals || [], tasks: tasks || [] });
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function act(path: string, method: string, body: unknown) {
    setBusy(true);
    try {
      await backend(path, { method, body: JSON.stringify(body) });
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const stages = ["new", "negotiation", "proposal", "won", "lost"];
  const departments = [
    "sales",
    "procurement",
    "inventory",
    "production",
    "quality",
    "hr",
    "finance",
    "management",
  ].filter((d) => allowed(d + ":tasks:write"));
  return (
    <section className="space-y-4 text-[#303449]">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-[#f3efdc] p-5">
        <div>
          <h2 className="text-2xl font-bold">
            {t("Your existing Nabz records", "رکوردهای فعلی نبض")}
          </h2>
          <p className="mt-2 text-base text-[#66647b]">
            {t(
              "Live deals and department tasks from your previous CRM.",
              "معاملات و کارهای واحدهای سازمان از CRM قبلی شما.",
            )}
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() => void refresh()}
          className={buttonClass}
        >
          <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
          {t("Refresh", "تازه‌سازی")}
        </button>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-[#e4dcef] p-4 text-base leading-7"
        >
          {error}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl bg-[#dcd3ef] p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <BriefcaseBusiness size={20} />
              {t("Deals", "معاملات")}
              <span className="rounded-full bg-white/60 px-2 text-base">
                {data.deals.length}
              </span>
            </h3>
            <button
              disabled={!allowed("sales:write") || busy}
              className={buttonClass}
              onClick={() => setAdding("deal")}
            >
              <Plus size={16} />
              {t("Add deal", "معامله جدید")}
            </button>
          </header>
          <div className="space-y-3">
            {data.deals.map((d) => (
              <article key={d.id} className="rounded-2xl bg-[#f8f7ef] p-4">
                <h4 className="text-lg font-bold">{d.title}</h4>
                <p className="mt-1 text-base text-[#69637b]">{d.customer}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <strong dir="ltr" className="text-lg">
                    {d.amount
                      ? `${BigInt(d.amount).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} IRR`
                      : t("Amount not set", "مبلغ تعیین نشده")}
                  </strong>
                  <select
                    aria-label={`${t("Stage", "مرحله")} ${d.title}`}
                    className="rounded-full bg-[#dce9e1] px-3 py-2 text-sm font-semibold"
                    disabled={!allowed("sales:write") || busy}
                    value={d.stage}
                    onChange={(e) => {
                      if (e.target.value === "lost") {
                        setLosing(d);
                      } else
                        void act(`deals/${d.id}`, "PATCH", {
                          version: d.version,
                          stage: e.target.value,
                        });
                    }}
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {
                          {
                            new: t("New", "جدید"),
                            negotiation: t("Negotiation", "مذاکره"),
                            proposal: t("Proposal", "پیشنهاد"),
                            won: t("Won", "موفق"),
                            lost: t("Lost", "ناموفق"),
                          }[stage]
                        }
                      </option>
                    ))}
                  </select>
                </div>
                {d.note && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#69637b]">
                    {d.note}
                  </p>
                )}
              </article>
            ))}
            {loaded && !data.deals.length && (
              <p className="rounded-2xl bg-white/50 p-6 text-base">
                {t(
                  "No existing deals in this company yet.",
                  "هنوز معامله‌ای در این شرکت ثبت نشده است.",
                )}
              </p>
            )}
          </div>
        </section>
        <section className="rounded-3xl bg-[#dce9e1] p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <ListTodo size={20} />
              {t("Department tasks", "کارهای واحدها")}
            </h3>
            <button
              disabled={!departments.length || busy}
              className={buttonClass}
              onClick={() => setAdding("task")}
            >
              <Plus size={16} />
              {t("Add task", "کار جدید")}
            </button>
          </header>
          <div className="space-y-3">
            {data.tasks.map((task) => (
              <article key={task.id} className="rounded-2xl bg-[#f8f7ef] p-4">
                <h4 className="text-base font-bold">{task.title}</h4>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm text-[#617569]">
                    {task.department}
                  </span>
                  <select
                    className="rounded-full bg-[#e6e0f2] px-3 py-2 text-sm"
                    aria-label={`${t("Status", "وضعیت")} ${task.title}`}
                    disabled={
                      !allowed(task.department + ":tasks:write") || busy
                    }
                    value={task.status}
                    onChange={(e) =>
                      void act(`tasks/${task.id}`, "PATCH", {
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="open">{t("Open", "باز")}</option>
                    <option value="in_progress">
                      {t("In progress", "در حال انجام")}
                    </option>
                    <option value="done">{t("Done", "انجام شده")}</option>
                  </select>
                </div>
              </article>
            ))}
            {loaded && !data.tasks.length && (
              <p className="rounded-2xl bg-white/50 p-6">
                {t(
                  "No department tasks yet.",
                  "هنوز کاری در واحدها ثبت نشده است.",
                )}
              </p>
            )}
          </div>
        </section>
      </div>
      {adding && (
        <Modal
          locale={locale}
          title={
            adding === "deal"
              ? t("New Nabz deal", "معامله جدید نبض")
              : t("New department task", "کار جدید واحد")
          }
          onClose={() => setAdding(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = Object.fromEntries(new FormData(e.currentTarget));
              const ok = await act(
                adding === "deal" ? "deals" : "tasks",
                "POST",
                adding === "deal"
                  ? {
                      ...form,
                      id: crypto.randomUUID(),
                      stage: "new",
                      source: "Forma",
                      follow_up: "",
                      due_at: null,
                    }
                  : form,
              );
              if (ok) setAdding(null);
            }}
          >
            <label className="block text-sm font-bold">
              {t("Title", "عنوان")}
              <input
                className={inputClass + " mt-2"}
                name="title"
                required
                maxLength={adding === "deal" ? 160 : 500}
              />
            </label>
            {adding === "deal" ? (
              <>
                <label className="block text-sm font-bold">
                  {t("Customer", "مشتری")}
                  <input
                    className={inputClass + " mt-2"}
                    name="customer"
                    required
                    maxLength={200}
                  />
                </label>
                <label className="block text-sm font-bold">
                  {t(
                    "Amount in whole rials (optional)",
                    "مبلغ به ریال (اختیاری)",
                  )}
                  <input
                    className={inputClass + " mt-2"}
                    name="amount"
                    inputMode="numeric"
                    pattern="(0|[1-9][0-9]{0,19})"
                    maxLength={20}
                  />
                </label>
              </>
            ) : (
              <label className="block text-sm font-bold">
                {t("Department", "واحد")}
                <select className={inputClass + " mt-2"} name="department">
                  {departments.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm">
                {error}
              </p>
            )}
            <button disabled={busy} className={buttonClass}>
              {t("Save to Nabz", "ذخیره در نبض")}
            </button>
          </form>
        </Modal>
      )}
      {losing && (
        <Modal
          locale={locale}
          title={t("Why was this deal lost?", "دلیل از دست رفتن معامله")}
          onClose={() => setLosing(null)}
        >
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const reason = new FormData(e.currentTarget).get("reason");
              if (
                await act(`deals/${losing.id}`, "PATCH", {
                  version: losing.version,
                  stage: "lost",
                  loss_reason: reason,
                })
              )
                setLosing(null);
            }}
          >
            <input
              aria-label={t("Loss reason", "دلیل عدم موفقیت")}
              name="reason"
              required
              maxLength={200}
              className={inputClass}
            />
            {error && <p role="alert">{error}</p>}
            <button disabled={busy} className={buttonClass}>
              {t("Confirm", "تأیید")}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
