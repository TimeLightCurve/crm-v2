"use client";
import { useCallback, useEffect, useState } from "react";
import { backend, loadSession } from "../backend";
import type { AgentState } from "./types";
export function useBoardAgents() {
  const [state, setState] = useState<AgentState | null>(null),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const next = await backend<AgentState>("agents");
      setState(next);
      setError("");
      return next;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }, []);
  useEffect(() => {
    let live = true;
    backend<AgentState>("agents")
      .then((s) => {
        if (live) setState(s);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  const command = useCallback(
    async <T>(body: object) => {
      const reply = await backend<{ result: T; crmChanged: boolean }>(
        "agents/command",
        { method: "POST", body: JSON.stringify(body) },
      );
      if (reply.crmChanged) await loadSession();
      await refresh();
      return reply.result;
    },
    [refresh],
  );
  return { state, error, refresh, command };
}
