"use client";

import { useEffect } from "react";
import { useProgressStore, flushPendingSave } from "@/store/useProgressStore";

export function useHydrated(): boolean {
  const hydrated = useProgressStore((s) => s.hydrated);
  const hydrate = useProgressStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function flush() {
      flushPendingSave(useProgressStore.getState().data);
    }
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return hydrated;
}
