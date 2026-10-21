"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import type { Locale } from "@/lib/crm-data";
export const inputClass =
  "w-full rounded-xl border border-[#d7d0e3] bg-white/85 px-3 py-2.5 text-sm text-[#40364f] outline-none focus:border-[#9d87c1] disabled:bg-[#e9e5ee]";
export const buttonClass =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[#d5cce1] bg-white/65 px-3 py-2 text-sm font-medium text-[#645176] hover:bg-white disabled:opacity-45";
export function Modal({
  title,
  locale,
  onClose,
  children,
  side = false,
}: {
  title: string;
  locale: Locale;
  onClose: () => void;
  children: ReactNode;
  side?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={
        side
          ? "fixed inset-y-0 start-auto end-0 m-0 ms-auto h-dvh max-h-dvh w-[690px] max-w-[96vw] overflow-y-auto rounded-s-[28px] bg-[#f6f4ef] p-5 text-[#343046] shadow-2xl backdrop:bg-[#232638]/35 rtl:ms-0"
          : "fixed inset-0 m-auto max-h-[90dvh] w-[650px] max-w-[calc(100%-24px)] overflow-y-auto rounded-[25px] bg-[#f8f6f0] p-5 text-[#343046] shadow-2xl backdrop:bg-[#232638]/35"
      }
      aria-label={title}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: side ? 0 : 10,
          x: side ? (locale === "fa" ? -24 : 24) : 0,
        }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.22 }}
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold rtl:font-[Nian,Anjoman,sans-serif]">
            {title}
          </h2>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7e0f0] text-[#79618e]"
            onClick={onClose}
            aria-label={locale === "en" ? "Close panel" : "بستن پنل"}
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </motion.div>
    </dialog>
  );
}
export function FormattedText({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-7 text-[#655b70]">
      {text.split("\n").map((line, index) => {
        const value = line.replace(/^#{1,3} /, "").replace(/^[-*] /, "• ");
        const parts = value.split(/(\*\*.*?\*\*)/g);
        return (
          <p
            key={index}
            className={line.startsWith("#") ? "font-bold text-[#40344f]" : ""}
          >
            {parts.map((part, i) =>
              part.startsWith("**") ? (
                <strong key={i}>{part.slice(2, -2)}</strong>
              ) : (
                part
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfc3dd] bg-white/30 px-5 py-10 text-center">
      <h3 className="text-base font-bold text-[#675476]">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#95849e]">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
export function downloadFile(
  name: string,
  body: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
