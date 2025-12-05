import { Loader2 } from "lucide-react";

interface ScanProgressProps {
  current: number;
  total: number;
  currentPath?: string;
  bytesScanned: number;
}

export function ScanProgress({
  current,
  total,
  currentPath,
  bytesScanned,
}: ScanProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
      {/* Animated loader */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-[var(--color-border)] flex items-center justify-center">
          <Loader2
            size={40}
            className="text-[var(--color-accent)] animate-spin"
          />
        </div>

        {/* Progress ring */}
        <svg
          className="absolute inset-0 w-24 h-24 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.89} 289`}
            className="transition-all duration-300"
          />
        </svg>
      </div>

      {/* Stats */}
      <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
        Scanning...
      </h2>

      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-4">
        <span>
          {current} / {total} locations
        </span>
        <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
        <span className="font-mono">{formatSize(bytesScanned)}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] overflow-hidden mb-4">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Current path */}
      {currentPath && (
        <p className="text-xs text-[var(--color-text-muted)] font-mono truncate max-w-md">
          {truncatePath(currentPath)}
        </p>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${sizes[i]}`;
}

function truncatePath(path: string): string {
  const parts = path.split("/");
  if (parts.length <= 4) return path;
  return `.../${parts.slice(-3).join("/")}`;
}
