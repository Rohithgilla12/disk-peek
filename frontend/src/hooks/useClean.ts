import { useState, useEffect, useCallback } from "react";
import { CleanCategories, CancelClean } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import type { scanner } from "../../wailsjs/go/models";

interface CleanProgress {
  current: number;
  total: number;
  currentPath: string;
  bytesFreed: number;
  currentItem: string;
}

type CleanState = "idle" | "cleaning" | "completed" | "error" | "cancelled";

interface UseCleanReturn {
  state: CleanState;
  result: scanner.CleanResult | null;
  progress: CleanProgress;
  error: string | null;
  clean: (categoryIds: string[]) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useClean(): UseCleanReturn {
  const [state, setState] = useState<CleanState>("idle");
  const [result, setResult] = useState<scanner.CleanResult | null>(null);
  const [progress, setProgress] = useState<CleanProgress>({
    current: 0,
    total: 0,
    currentPath: "",
    bytesFreed: 0,
    currentItem: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Listen to clean events from Go backend
  useEffect(() => {
    const unsubscribeProgress = EventsOn(
      "clean:progress",
      (data: CleanProgress) => {
        setProgress(data);
      }
    );

    const unsubscribeStarted = EventsOn("clean:started", () => {
      setState("cleaning");
      setProgress({
        current: 0,
        total: 0,
        currentPath: "",
        bytesFreed: 0,
        currentItem: "",
      });
    });

    const unsubscribeCompleted = EventsOn(
      "clean:completed",
      (data: scanner.CleanResult) => {
        setState("completed");
        setResult(data);
      }
    );

    const unsubscribeCancelled = EventsOn("clean:cancelled", () => {
      setState("cancelled");
      setProgress({
        current: 0,
        total: 0,
        currentPath: "",
        bytesFreed: 0,
        currentItem: "",
      });
    });

    return () => {
      unsubscribeProgress();
      unsubscribeStarted();
      unsubscribeCompleted();
      unsubscribeCancelled();
    };
  }, []);

  const clean = useCallback(async (categoryIds: string[]) => {
    try {
      setState("cleaning");
      setError(null);
      setProgress({
        current: 0,
        total: 0,
        currentPath: "",
        bytesFreed: 0,
        currentItem: "",
      });

      const cleanResult = await CleanCategories(categoryIds);
      setResult(cleanResult);
      setState("completed");
    } catch (err) {
      console.error("Clean error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    }
  }, []);

  const cancel = useCallback(() => {
    CancelClean();
    // Don't set state here - let the clean:cancelled event handler do it
    // to avoid race conditions
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setProgress({
      current: 0,
      total: 0,
      currentPath: "",
      bytesFreed: 0,
      currentItem: "",
    });
    setError(null);
  }, []);

  return {
    state,
    result,
    progress,
    error,
    clean,
    cancel,
    reset,
  };
}

