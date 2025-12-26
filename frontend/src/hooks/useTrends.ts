import { useState, useCallback } from "react";
import { GetDiskTrends, GetGrowthAlerts, ClearTrendsHistory } from "../../wailsjs/go/main/App";
import type { scanner } from "../../wailsjs/go/models";

type LoadState = "idle" | "loading" | "completed" | "error";

interface UseTrendsReturn {
  state: LoadState;
  result: scanner.TrendsResult | null;
  alerts: scanner.DiskUsageTrend[];
  error: string | null;
  load: () => Promise<void>;
  loadAlerts: (thresholdMBPerDay?: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  reset: () => void;
}

export function useTrends(): UseTrendsReturn {
  const [state, setState] = useState<LoadState>("idle");
  const [result, setResult] = useState<scanner.TrendsResult | null>(null);
  const [alerts, setAlerts] = useState<scanner.DiskUsageTrend[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setState("loading");
      setError(null);
      const trendsResult = await GetDiskTrends();
      setResult(trendsResult);
      setState("completed");
    } catch (err) {
      console.error("Load trends error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    }
  }, []);

  const loadAlerts = useCallback(async (thresholdMBPerDay: number = 100) => {
    try {
      const alertsResult = await GetGrowthAlerts(thresholdMBPerDay);
      setAlerts(alertsResult || []);
    } catch (err) {
      console.error("Load alerts error:", err);
      // Don't set error state for alerts, they're optional
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await ClearTrendsHistory();
      setResult(null);
      setAlerts([]);
      setState("idle");
    } catch (err) {
      console.error("Clear history error:", err);
      setError(err instanceof Error ? err.message : "Failed to clear history");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setAlerts([]);
    setError(null);
  }, []);

  return {
    state,
    result,
    alerts,
    error,
    load,
    loadAlerts,
    clearHistory,
    reset,
  };
}
