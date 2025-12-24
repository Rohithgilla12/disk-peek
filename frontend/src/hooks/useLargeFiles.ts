import { useState, useCallback } from "react";
import { FindLargeFiles } from "../../wailsjs/go/main/App";
import type { scanner } from "../../wailsjs/go/models";

type ScanState = "idle" | "scanning" | "completed" | "error";

interface UseLargeFilesReturn {
  state: ScanState;
  result: scanner.LargeFilesResult | null;
  error: string | null;
  scan: (minSizeMB?: number) => Promise<void>;
  reset: () => void;
}

export function useLargeFiles(): UseLargeFilesReturn {
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<scanner.LargeFilesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (minSizeMB: number = 100) => {
    try {
      setState("scanning");
      setError(null);
      const scanResult = await FindLargeFiles(minSizeMB);
      setResult(scanResult);
      setState("completed");
    } catch (err) {
      console.error("Large files scan error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return {
    state,
    result,
    error,
    scan,
    reset,
  };
}
