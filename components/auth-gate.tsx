"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import { backend, loadSession, logout, useSession } from "@/lib/backend";
import SalesWorkspace from "./crm/sales-workspace";
export default function AuthGate() {
  const session = useSession();
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fa, setFa] = useState(false);
  useEffect(() => {
    loadSession()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const t = (en: string, persian: string) => (fa ? persian : en);
  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#eceaf1] text-[#3c3951]">
        <LoaderCircle className="animate-spin" aria-label="Loading workspace" />
      </main>
    );
  if (session?.user)
    return (
      <>
        <div className="ms-19.5 flex flex-wrap items-center justify-between gap-2 bg-[#292f40] px-3 py-2 text-sm text-[#f4f2df] max-[1050px]:ms-16 max-[520px]:ms-13.25 sm:px-5">
          <span className="flex min-w-0 items-center gap-2">
            <ShieldCheck size={15} className="shrink-0" />
            <span className="max-w-40 truncate">{session.user.name}</span>
            <span className="text-[#b9c5c6] max-sm:hidden">
              · {session.user.department}
            </span>
          </span>
          <span role="status" className="max-w-2xl text-[#c6dfd0]">
            {session.error ||
              (session.saving
                ? t("Saving…", "در حال ذخیره…")
                : t("Saved to Nabz", "ذخیره در نبض"))}
          </span>
          {session.error && (
            <button
              disabled={session.saving}
              className="rounded-full bg-[#bfb1df] px-3 py-1 text-[#292f40]"
              onClick={() => loadSession().catch((e) => setError(e.message))}
            >
              Reload latest / تازه‌سازی
            </button>
          )}
          <button
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 disabled:opacity-40"
            disabled={session.saving}
            onClick={() => logout().catch((e) => setError(e.message))}
          >
            <LogOut size={14} />
            {t("Sign out", "خروج")}
          </button>
        </div>
        {error && (
          <p role="alert" className="bg-[#f3efdc] p-3 text-[#53445b]">
            {error}
          </p>
        )}
        <SalesWorkspace
          initialLocale={fa ? "fa" : "en"}
          onPersianChange={setFa}
        />
      </>
    );
  return (
    <main
      dir={fa ? "rtl" : "ltr"}
      className="grid min-h-screen place-items-center bg-[#e6e3ed] p-5 font-[Anjoman,Arial,sans-serif] text-[#292f40]"
    >
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[32px] bg-[#f8f7ec] p-8 shadow-xl shadow-[#b9afd0]/20"
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="rounded-2xl bg-[#c8bce7] px-4 py-3 text-xl font-bold">
            forma<span className="text-[#5e8275]">.</span>
          </span>
          <button
            onClick={() => setFa(!fa)}
            className="rounded-full bg-[#e9e5f1] px-4 py-2 text-sm"
          >
            {fa ? "English" : "فارسی"}
          </button>
        </div>
        <h1 className="text-3xl font-bold">
          {t("Your team's workspace", "فضای کاری تیم شما")}
        </h1>
        <p className="mb-6 mt-3 text-base leading-7 text-[#66647a]">
          {t(
            "Sign in with your existing Nabz CRM account.",
            "با حساب فعلی CRM نبض وارد شوید.",
          )}
        </p>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await backend("auth/login", {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(data)),
              });
              await loadSession();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {[
            ["username", t("Username", "نام کاربری"), "text"],
            ["password", t("Password", "گذرواژه"), "password"],
            [
              "company",
              t("Company (if required)", "شرکت (در صورت نیاز)"),
              "text",
            ],
          ].map(([name, label, type]) => (
            <label key={name} className="block text-sm font-bold">
              {label}
              <input
                name={name}
                type={type}
                required={name !== "company"}
                autoComplete={
                  name === "password"
                    ? "current-password"
                    : name === "username"
                      ? "username"
                      : "organization"
                }
                className="mt-2 w-full rounded-xl border border-[#d7d1e2] bg-white/80 px-4 py-3 text-base font-normal outline-none focus:border-[#9080b7]"
              />
            </label>
          ))}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#e9e3f3] p-3 text-sm leading-6"
            >
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#292f40] p-3.5 font-bold text-[#f4f2df] disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ArrowRight size={18} />
            )}
            {t("Enter workspace", "ورود به فضای کاری")}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
