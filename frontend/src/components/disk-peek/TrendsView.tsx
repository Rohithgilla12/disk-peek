import { useEffect } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, BarChart3, Trash2, RefreshCw } from "lucide-react";

interface TrendsViewProps {
  state: "idle" | "loading" | "completed" | "error";
  result: scanner.TrendsResult | null;
  alerts: scanner.DiskUsageTrend[];
  error: string | null;
  onLoad: () => void;
  onClearHistory: () => void;
  onReset: () => void;
}

export function TrendsView({ state, result, alerts, error, onLoad, onClearHistory, onReset }: TrendsViewProps) {
  // Auto-load on mount
  useEffect(() => {
    if (state === "idle") {
      onLoad();
    }
  }, [state, onLoad]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[var(--color-bg-elevated)] border-t-[var(--color-success)] animate-spin" />
          <BarChart3 size={32} className="text-[var(--color-success)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Loading trends...</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Analyzing disk usage history</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/20 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Error</h2>
        <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>
        <Button variant="outline" onClick={onReset}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!result || !result.snapshots || result.snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-20 h-20 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-success)]/20 to-[var(--color-success)]/5 flex items-center justify-center mb-6">
          <BarChart3 size={40} className="text-[var(--color-success)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Disk Usage Trends</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center max-w-md">
          No usage history available yet. Run scans in Dev Clean mode to start tracking disk usage over time.
        </p>
        <p className="text-xs text-[var(--color-text-muted)] text-center max-w-sm">
          Usage snapshots are recorded after each Dev Clean scan and stored for up to 365 days.
        </p>
      </div>
    );
  }

  const snapshots = result.snapshots;
  const latestSnapshot = snapshots[snapshots.length - 1];
  const oldestSnapshot = snapshots[0];
  const totalChange = latestSnapshot.totalSize - oldestSnapshot.totalSize;
  const isGrowing = totalChange > 0;

  // Calculate max size for chart scaling
  const maxSize = Math.max(...snapshots.map((s) => s.totalSize));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">Disk Usage Trends</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tracking {snapshots.length} {snapshots.length === 1 ? "snapshot" : "snapshots"} over{" "}
            {formatDateRange(oldestSnapshot.timestamp, latestSnapshot.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoad}
            className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] rounded-[var(--radius-lg)]"
          >
            <RefreshCw size={14} className="mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/30 rounded-[var(--radius-lg)]"
          >
            <Trash2 size={14} className="mr-2" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Alerts section */}
      {alerts.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-[var(--color-warning)]" />
            <span className="font-semibold text-[var(--color-warning)]">Growth Alerts</span>
          </div>
          <ul className="space-y-1">
            {alerts.map((alert) => (
              <li key={alert.categoryId} className="text-sm text-[var(--color-text-secondary)]">
                <span className="font-medium">{alert.categoryName}</span> is growing at{" "}
                <span className="font-mono text-[var(--color-warning)]">
                  {formatSize(alert.growthRate)}/day
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
          <div className="text-xs text-[var(--color-text-muted)] mb-1">Current Size</div>
          <div className="text-lg font-mono font-bold text-[var(--color-text)]">
            {formatSize(latestSnapshot.totalSize)}
          </div>
        </div>
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
          <div className="text-xs text-[var(--color-text-muted)] mb-1">Total Change</div>
          <div className={`text-lg font-mono font-bold flex items-center gap-1 ${isGrowing ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
            {isGrowing ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {isGrowing ? "+" : ""}{formatSize(Math.abs(totalChange))}
          </div>
        </div>
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
          <div className="text-xs text-[var(--color-text-muted)] mb-1">Avg. Daily Change</div>
          <div className="text-lg font-mono font-bold text-[var(--color-text)]">
            {result.totalTrend ? formatSize(Math.abs(result.totalTrend.growthRate)) + "/day" : "N/A"}
          </div>
        </div>
      </div>

      {/* Simple bar chart */}
      <div className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 overflow-hidden">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Usage Over Time</h3>
        <div className="flex items-end gap-1 h-[calc(100%-2rem)]">
          {snapshots.map((snapshot, index) => {
            const height = maxSize > 0 ? (snapshot.totalSize / maxSize) * 100 : 0;
            const isLatest = index === snapshots.length - 1;

            return (
              <div
                key={snapshot.timestamp}
                className="flex-1 flex flex-col items-center justify-end group"
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isLatest
                      ? "bg-[var(--color-accent)]"
                      : "bg-[var(--color-accent)]/40 group-hover:bg-[var(--color-accent)]/60"
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${formatDate(snapshot.timestamp)}: ${formatSize(snapshot.totalSize)}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)]">
          <span>{formatDate(oldestSnapshot.timestamp)}</span>
          <span>{formatDate(latestSnapshot.timestamp)}</span>
        </div>
      </div>

      {/* Category trends */}
      {result.categoryTrends && result.categoryTrends.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Category Trends</h3>
          <div className="grid grid-cols-2 gap-3">
            {result.categoryTrends.slice(0, 6).map((trend) => {
              const isGrowing = trend.growthRate > 0;
              return (
                <div
                  key={trend.categoryId}
                  className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-text)] truncate">
                      {trend.categoryName}
                    </span>
                    {isGrowing ? (
                      <TrendingUp size={14} className="text-[var(--color-danger)] flex-shrink-0" />
                    ) : (
                      <TrendingDown size={14} className="text-[var(--color-success)] flex-shrink-0" />
                    )}
                  </div>
                  <div className={`text-xs font-mono ${isGrowing ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
                    {isGrowing ? "+" : ""}{formatSize(Math.abs(trend.totalChange))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${sizes[i]}`;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateRange(start: string | Date, end: string | Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day";
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}
