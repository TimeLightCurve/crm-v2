"use client";
import { useCrmState } from "./records/store";
import { text } from "./crm-data";
export function useScheduleMembers() {
  const state = useCrmState();
  return (
    state?.workspaces.find((w) => w.id === state.activeWorkspaceId)?.members ??
    []
  ).map((m) => ({
    id: m.id,
    initials: m.name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    name: text(m.name, m.name),
  }));
}
