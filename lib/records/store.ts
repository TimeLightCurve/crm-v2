"use client";
import { updateDocument, useDocument } from "../backend";
import type { CrmState } from "./types";
export function commitCrm(update: (state: CrmState) => CrmState) {
  updateDocument("crm", update);
}
export function useCrmState() {
  return useDocument<CrmState>("crm");
}
