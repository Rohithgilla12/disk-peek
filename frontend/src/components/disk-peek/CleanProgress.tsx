import { Loader2, Trash2, Sparkles, CheckCircle2, X } from "lucide-react";
import { Button } from "../ui/button";

interface CleanProgressProps {
  current: number;
  total: number;
  currentPath?: string;
  bytesFreed: number;
  currentItem?: string;
  onCancel?: () => void;
}

const cleaningMessages = [
  "Cleaning up...",
  "Removing cached files...",
  "Making space...",
  "Freeing storage...",
  "Almost done...",
];

export function CleanProgress({
  current,
  total,
  currentPath,
  bytesFreed,
  currentItem,
  onCancel,
}: CleanProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  // Cycle through messages based on progress
  const messageIndex = Math.min(
    Math.floor((percentage / 100) * cleaningMessages.length),
    cleaningMessages.length - 1
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
      {/* Animated loader with floating icons */}
      <div className="relative mb-10">
        {/* Outer glow ring - danger/cleaning color */}
        <div className="absolute inset-[-20px] rounded-full bg-[var(--color-danger)]/10 animate-pulse" />

        {/* Main circle container */}
        <div className="relative w-32 h-32 rounded-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] flex items-center justify-center">
          {/* Progress ring SVG */}
          <svg
            className="absolute inset-0 w-32 h-32 -rotate-90"
            viewBox="0 0 128 128"
          >
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="4"
            />
            {/* Progress circle - using danger/red color for cleaning */}
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="var(--color-danger)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 3.64} 364`}
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* Inner content */}
          <div className="relative z-10 flex flex-col items-center">
            <Trash2
              size={36}
              className="text-[var(--color-danger)] animate-pulse"
            />
            <span className="text-lg font-bold text-[var(--color-text)] mt-1 font-mono">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Floating decorative icons */}
        <div
          className="absolute -top-3 -right-3 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-md)] animate-bounce"
          style={{ animationDuration: "2s" }}
        >
          <Sparkles size={18} className="text-[var(--color-warning)]" />
        </div>

        <div
          className="absolute -bottom-2 -left-4 w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-md)] animate-bounce"
          style={{ animationDuration: "2.5s", animationDelay: "0.3s" }}
        >
          <CheckCircle2 size={16} className="text-[var(--color-success)]" />
        </div>
      </div>

      {/* Status text */}
      <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-3">
        {cleaningMessages[messageIndex]}
      </h2>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-full border border-[var(--color-border)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse" />
          <span>{current} / {total} items</span>
        </div>
        <div className="px-3 py-1.5 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-full font-mono text-[var(--color-success)]">
          +{formatSize(bytesFreed)} freed
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="h-2 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-danger)] to-[var(--color-warning)] transition-all duration-300 ease-out"
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
      </div>

      {/* Current item being cleaned */}
      {(currentItem || currentPath) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] rounded-[var(--radius-md)] border border-[var(--color-border)] max-w-md">
          <Loader2 size={14} className="text-[var(--color-danger)] flex-shrink-0 animate-spin" />
          <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
            {currentItem || truncatePath(currentPath || "")}
          </p>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="mt-6 gap-2"
        >
          <X size={14} />
          Cancel Clean
        </Button>
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

