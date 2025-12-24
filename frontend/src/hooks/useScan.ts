import { useState, useEffect, useCallback, useRef } from "react";
import { ScanDev, QuickScanDev, ScanNormal, CancelScan } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import type { scanner } from "../../wailsjs/go/models";
import type { ScanMode } from "../components/disk-peek/ModeToggle";

interface ScanProgress {
  current: number;
  total: number;
  currentPath: string;
  bytesScanned: number;
}

type ScanState = "idle" | "scanning" | "completed" | "error" | "cancelled";

// Union type for scan results
type ScanResultUnion = scanner.ScanResult | scanner.FullScanResult;

// Cache structure for storing results per mode
interface ScanCache {
  dev: { state: ScanState; result: ScanResultUnion | null } | null;
  normal: { state: ScanState; result: ScanResultUnion | null } | null;
  tools: { state: ScanState; result: ScanResultUnion | null } | null;
}

interface UseScanReturn {
  state: ScanState;
  result: ScanResultUnion | null;
  progress: ScanProgress;
  error: string | null;
  scan: () => Promise<void>;
  quickScan: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

// Global cache to persist results across mode switches
const scanCache: ScanCache = {
  dev: null,
  normal: null,
  tools: null,
};

export function useScan(mode: ScanMode): UseScanReturn {
  // Initialize state from cache if available
  const cached = scanCache[mode];
  const [state, setState] = useState<ScanState>(cached?.state || "idle");
  const [result, setResult] = useState<ScanResultUnion | null>(cached?.result || null);
  const [progress, setProgress] = useState<ScanProgress>({
    current: 0,
    total: 0,
    currentPath: "",
    bytesScanned: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const prevModeRef = useRef<ScanMode>(mode);

  // Listen to scan events from Go backend
  useEffect(() => {
    const unsubscribeProgress = EventsOn(
      "scan:progress",
      (data: ScanProgress) => {
        setProgress(data);
      }
    );

    const unsubscribeStarted = EventsOn("scan:started", () => {
      setState("scanning");
      setProgress({ current: 0, total: 0, currentPath: "", bytesScanned: 0 });
    });

    // Dev mode completion
    const unsubscribeCompleted = EventsOn(
      "scan:completed",
      (data: scanner.ScanResult) => {
        setState("completed");
        setResult(data);
      }
    );

    // Normal mode completion
    const unsubscribeCompletedNormal = EventsOn(
      "scan:completed:normal",
      (data: scanner.FullScanResult) => {
        setState("completed");
        setResult(data);
      }
    );

    // Scan cancelled
    const unsubscribeCancelled = EventsOn("scan:cancelled", () => {
      setState("cancelled");
      setProgress({ current: 0, total: 0, currentPath: "", bytesScanned: 0 });
    });

    return () => {
      unsubscribeProgress();
      unsubscribeStarted();
      unsubscribeCompleted();
      unsubscribeCompletedNormal();
      unsubscribeCancelled();
    };
  }, []);

  // Save current results to cache and restore from cache when mode changes
  useEffect(() => {
    // If mode changed
    if (prevModeRef.current !== mode) {
      // Save current state to cache for the previous mode
      scanCache[prevModeRef.current] = { state, result };

      // Restore from cache for the new mode
      const newCached = scanCache[mode];
      if (newCached) {
        setState(newCached.state);
        setResult(newCached.result);
      } else {
        setState("idle");
        setResult(null);
      }
      setProgress({ current: 0, total: 0, currentPath: "", bytesScanned: 0 });
      setError(null);

      prevModeRef.current = mode;
    }
  }, [mode, state, result]);

  const scan = useCallback(async () => {
    try {
      setState("scanning");
      setError(null);
      setProgress({ current: 0, total: 0, currentPath: "", bytesScanned: 0 });

      let scanResult: ScanResultUnion;
      if (mode === "dev") {
        scanResult = await ScanDev();
      } else {
        scanResult = await ScanNormal();
      }
      setResult(scanResult);
      setState("completed");
      // Update cache
      scanCache[mode] = { state: "completed", result: scanResult };
    } catch (err) {
      console.error("Scan error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    }
  }, [mode]);

  const quickScan = useCallback(async () => {
    try {
      setState("scanning");
      setError(null);

      let scanResult: ScanResultUnion;
      if (mode === "dev") {
        scanResult = await QuickScanDev();
      } else {
        // Normal mode uses the same scan for both
        scanResult = await ScanNormal();
      }
      setResult(scanResult);
      setState("completed");
      // Update cache
      scanCache[mode] = { state: "completed", result: scanResult };
    } catch (err) {
      console.error("Quick scan error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    }
  }, [mode]);

  const cancel = useCallback(() => {
    CancelScan();
    setState("idle");
    setProgress({ current: 0, total: 0, currentPath: "", bytesScanned: 0 });
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setProgress({ current: 0, total: 0, currentPath: "", bytesScanned: 0 });
    setError(null);
    // Clear cache for current mode
    scanCache[mode] = null;
  }, [mode]);

  return {
    state,
    result,
    progress,
    error,
    scan,
    quickScan,
    cancel,
    reset,
  };
}
