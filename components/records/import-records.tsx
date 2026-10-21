"use client";
import { useState } from "react";
import { blankRecord } from "@/lib/records/seed";
import { parseCsv, saveRecord } from "@/lib/records/model";
import { commitCrm } from "@/lib/records/store";
import type { CrmRecord, CrmState, Entity } from "@/lib/records/types";
import type { Locale } from "@/lib/crm-data";
import { buttonClass, Modal } from "./ui";
export default function ImportRecords({
  state,
  entity,
  locale,
  onClose,
  notify,
}: {
  state: CrmState;
  entity: Entity;
  locale: Locale;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [rows, setRows] = useState<CrmRecord[]>([]),
    [errors, setErrors] = useState<string[]>([]),
    [fileName, setFileName] = useState("");
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  async function read(file?: File) {
    if (!file) return;
    setRows([]);
    setErrors([]);
    setFileName(file.name);
    try {
      if (file.size > 2000000) throw Error("Choose a CSV smaller than 2 MB.");
      const csv = parseCsv(await file.text());
      if (csv.length < 2) throw Error("CSV has no data.");
      const headers = csv[0].map((h) => h.trim().toLowerCase());
      if (!headers.includes("name")) throw Error("A name column is required.");
      if (csv.length > 1001) throw Error("Import up to 1,000 rows at a time.");
      const parsed: CrmRecord[] = [],
        issues: string[] = [];
      let simulated = state;
      for (const [index, row] of csv.slice(1).entries()) {
        const record = {
          ...blankRecord(entity, state.activeWorkspaceId),
          ownerId: state.currentMemberId,
        };
        for (const [col, header] of headers.entries()) {
          const value = row[col] ?? "";
          if (
            [
              "name",
              "description",
              "email",
              "phone",
              "website",
              "stage",
              "priority",
              "currency",
              "dueDate",
              "companyId",
              "personId",
              "ownerId",
            ].some((key) => key.toLowerCase() === header)
          ) {
            const key = [
              "name",
              "description",
              "email",
              "phone",
              "website",
              "stage",
              "priority",
              "currency",
              "dueDate",
              "companyId",
              "personId",
              "ownerId",
            ].find((k) => k.toLowerCase() === header)!;
            (record as unknown as Record<string, unknown>)[key] = value;
          } else if (header === "amount") record.amount = Number(value);
          else if (["tags", "relatedids"].includes(header)) {
            record[header === "tags" ? "tags" : "relatedIds"] = value
              .split("|")
              .filter(Boolean);
          } else if (header.startsWith("custom:")) {
            const field = state.fields.find(
              (f) =>
                f.id.toLowerCase() === header.slice(7) &&
                f.workspaceId === state.activeWorkspaceId &&
                f.entity === entity,
            );
            if (field)
              record.custom[field.id] = ["number", "currency"].includes(
                field.type,
              )
                ? Number(value)
                : ["toggle", "checkbox"].includes(field.type)
                  ? value === "true"
                  : [
                        "record",
                        "multi-select",
                        "checkbox-list",
                        "tags-input",
                      ].includes(field.type)
                    ? value.split("|").filter(Boolean)
                    : value;
          }
        }
        try {
          simulated = saveRecord(simulated, record);
          parsed.push(record);
        } catch (e) {
          issues.push(`Row ${index + 2}: ${(e as Error).message}`);
        }
      }
      setRows(parsed);
      setErrors(issues);
    } catch (e) {
      setErrors([(e as Error).message]);
    }
  }
  return (
    <Modal
      title={t("Import records", "ورود رکوردها")}
      locale={locale}
      onClose={onClose}
    >
      <p className="mb-4 text-sm leading-relaxed text-[#9883a6]">
        {t(
          "Upload UTF-8 CSV. Required column: name. Optional: email, phone, description, stage, amount, currency, ownerId, companyId, personId, tags. Tags use |. Export a CSV to see the full format. All rows are validated before import.",
          "فایل CSV با کدگذاری UTF-8 وارد کنید. ستون name ضروری است. برای دیدن قالب کامل یک خروجی CSV بگیرید. تمام ردیف‌ها پیش از ورود اعتبارسنجی می‌شوند.",
        )}
      </p>
      <input
        aria-label={t("CSV file", "فایل CSV")}
        type="file"
        accept=".csv,text/csv"
        className="mb-4 w-full rounded-xl border border-dashed border-[#d0bcdf] bg-white/60 p-5 text-sm text-[#9d81af]"
        onChange={(e) => read(e.target.files?.[0])}
      />
      {fileName && (
        <p className="mb-3 text-xs text-[#a68cb8]">
          {fileName} · {rows.length} {t("valid rows", "ردیف معتبر")}
        </p>
      )}
      {rows.length > 0 && (
        <div className="mb-4 max-h-52 overflow-y-auto rounded-xl bg-white/65 p-3">
          <table className="w-full text-start text-xs">
            <thead>
              <tr>
                <th className="text-start">{t("Name", "نام")}</th>
                <th className="text-start">{t("Stage", "مرحله")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((r, i) => (
                <tr key={i}>
                  <td className="py-1.5">{r.name}</td>
                  <td>{r.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {errors.length > 0 && (
        <div
          role="alert"
          className="mb-4 max-h-40 overflow-y-auto rounded-xl bg-[#f6ebcb] p-3 text-xs leading-relaxed text-[#9a7d43]"
        >
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      <button
        disabled={!rows.length || !!errors.length}
        className={buttonClass + " w-full bg-[#ae96c5]!"}
        onClick={() => {
          try {
            commitCrm((s) =>
              rows.reduce((next, row) => saveRecord(next, row), s),
            );
            notify(
              t(
                `${rows.length} records imported`,
                `${rows.length} رکورد وارد شد`,
              ),
            );
            onClose();
          } catch (e) {
            setErrors([(e as Error).message]);
          }
        }}
      >
        {t("Import all validated rows", "ورود همه ردیف‌های معتبر")}
      </button>
    </Modal>
  );
}
