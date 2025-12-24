import { useState, useCallback, useEffect } from "react";
import { FindLargeFiles } from "../../wailsjs/go/main/App";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";
import type { scanner } from "../../wailsjs/go/models";

type ScanState = "idle" | "scanning" | "completed" | "error";

interface Progress {
  scanned: number;
  current: string;
}

interface UseLargeFilesReturn {
  state: ScanState;
  result: scanner.LargeFilesResult | null;
  error: string | null;
  progress: Progress | null;
  scan: (minSizeMB?: number) => Promise<void>;
  reset: () => void;
}

export function useLargeFiles(): UseLargeFilesReturn {
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<scanner.LargeFilesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    const unsubProgress = EventsOn("largefile:progress", (data: Progress) => {
      setProgress(data);
    });

    return () => {
      EventsOff("largefile:progress");
    };
  }, []);

  const scan = useCallback(async (minSizeMB: number = 100) => {
    try {
      setState("scanning");
      setError(null);
      setProgress(null);
      const scanResult = await FindLargeFiles(minSizeMB);
      setResult(scanResult);
      setState("completed");
    } catch (err) {
      console.error("Large files scan error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    } finally {
      setProgress(null);
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    state,
    result,
    error,
    progress,
    scan,
    reset,
  };
}
