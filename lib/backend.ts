"use client";
import { useCallback, useRef, useSyncExternalStore } from "react";
export interface NabzUser {
  id: string;
  tenant_id: string;
  name: string;
  username: string;
  department: string;
  role: string;
  permissions: string[];
}
type Kind = "crm" | "schedule" | "calls";
type Document = { revision: number; data: unknown };
const documents = new Map<Kind, Document>();
const confirmed = new Map<Kind, Document>();
const listeners = new Set<() => void>();
const pending = new Map<Kind, unknown>();
const saving = new Set<Kind>();
let user: NabzUser | null = null;
let generation = 0;
let mutation = 0;
let error = "";
let status: { user: NabzUser | null; error: string; saving: boolean } = {
  user,
  error,
  saving: false,
};
function emit() {
  status = { user, error, saving: saving.size > 0 || pending.size > 0 };
  for (const f of listeners) f();
}
function subscribe(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}
function invalidateSession() {
  generation++;
  user = null;
  documents.clear();
  confirmed.clear();
  pending.clear();
  saving.clear();
  error = "";
  emit();
}
export async function backend<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const started = generation;
  const response = await fetch(`/api/backend/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  const value = await response.json();
  if (!response.ok) {
    if (response.status === 401 && started === generation) invalidateSession();
    throw Error(value.error || `Request failed (${response.status})`);
  }
  return value;
}
export async function loadSession() {
  if (saving.size || pending.size)
    throw Error("Wait for your changes to finish saving");
  const started = generation;
  const initialMutation = mutation;
  const identity = await backend<NabzUser>("auth/me");
  const loaded = await Promise.all(
    (["crm", "schedule", "calls"] as Kind[]).map(
      async (kind) => [kind, await backend<Document>(`forma/${kind}`)] as const,
    ),
  );
  if (started !== generation) throw Error("Session changed. Sign in again.");
  if (initialMutation !== mutation)
    throw Error(
      "Changes were made during refresh. Finish saving, then reload the latest data.",
    );
  documents.clear();
  confirmed.clear();
  for (const [kind, document] of loaded) {
    documents.set(kind, document);
    confirmed.set(kind, document);
  }
  user = identity;
  error = "";
  emit();
  return identity;
}
export function useSession() {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => null,
  );
}
export function getDocument<T>(kind: Kind): T {
  const d = documents.get(kind);
  if (!d) throw Error("Sign in before using this workspace");
  return d.data as T;
}
export function useDocument<T>(kind: Kind) {
  return useSyncExternalStore(
    subscribe,
    () => (documents.get(kind)?.data as T | undefined) ?? null,
    () => null,
  );
}
export function useServerProperty<T>(
  key: string,
  fallback: T,
): [T, (update: T | ((value: T) => T)) => void] {
  const initial = useRef(fallback);
  const state = useDocument<Record<string, unknown>>("calls");
  const value = (state?.[key] as T | undefined) ?? fallback;
  const set = useCallback(
    (update: T | ((value: T) => T)) =>
      updateDocument<Record<string, unknown>>("calls", (current) => {
        const before = (current[key] as T | undefined) ?? initial.current;
        return {
          ...current,
          [key]:
            typeof update === "function"
              ? (update as (value: T) => T)(before)
              : update,
        };
      }),
    [key],
  );
  return [value, set];
}
export function updateDocument<T>(kind: Kind, update: (state: T) => T) {
  if (!user) throw Error("Sign in to save changes");
  const doc = documents.get(kind)!;
  const data = update(doc.data as T);
  if (JSON.stringify(data).length > 5_000_000)
    throw Error(
      "Workspace is too large. Download a backup and remove large attachments.",
    );
  mutation++;
  documents.set(kind, { ...doc, data });
  pending.set(kind, data);
  emit();
  void drain(kind);
}
async function drain(kind: Kind) {
  if (saving.has(kind)) return;
  const started = generation;
  saving.add(kind);
  emit();
  try {
    while (pending.has(kind)) {
      const data = pending.get(kind);
      pending.delete(kind);
      const saved = await backend<Document>(`forma/${kind}`, {
        method: "PUT",
        body: JSON.stringify({ revision: documents.get(kind)!.revision, data }),
      });
      if (started !== generation) return;
      confirmed.set(kind, saved);
      documents.set(kind, {
        revision: saved.revision,
        data: pending.has(kind) ? pending.get(kind) : saved.data,
      });
      emit();
    }
  } catch (e) {
    if (started !== generation) return;
    pending.delete(kind);
    error = `${(e as Error).message}. Unsaved changes were rolled back. Reload for the latest data.`;
    const before = confirmed.get(kind);
    if (before) documents.set(kind, before);
    // Reload is explicit: a recovery GET must not overwrite a new edit or race a new session.
  } finally {
    if (started === generation) {
      saving.delete(kind);
      emit();
    }
  }
}
export async function logout() {
  if (saving.size || pending.size)
    throw Error("Wait for your changes to finish saving");
  await backend("auth/logout", { method: "POST" });
  invalidateSession();
}
