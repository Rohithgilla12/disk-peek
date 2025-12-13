import { useState } from "react";
import "@/index.css";
import {
  ModeToggle,
  EmptyState,
  ScanProgress,
  CleanProgress,
  ScanResults,
  FileTreeResults,
  type ScanMode,
} from "@/components/disk-peek";
import type { scanner } from "../wailsjs/go/models";
import { useScan } from "@/hooks/useScan";
import { useClean } from "@/hooks/useClean";
import { RefreshCw, Clock, HardDrive, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function App() {
  const [mode, setMode] = useState<ScanMode>("dev");
  const { state: scanState, result, progress: scanProgress, error: scanError, scan, reset: resetScan } = useScan(mode);
  const { 
    state: cleanState, 
    result: cleanResult, 
    progress: cleanProgress, 
    error: cleanError, 
    clean, 
    reset: resetClean 
  } = useClean();

  // Combined state for UI
  const isScanning = scanState === "scanning";
  const isCleaning = cleanState === "cleaning";
  const isCleanCompleted = cleanState === "completed";
  const isBusy = isScanning || isCleaning;

  const handleModeChange = (newMode: ScanMode) => {
    if (isBusy) return;
    setMode(newMode);
    resetScan();
    resetClean();
  };

  const handleClean = async (categoryIds: string[]) => {
    await clean(categoryIds);
  };

  const handleCleanDone = () => {
    resetClean();
    // Trigger a new scan to show updated sizes
    scan();
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)] noise-overlay">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-[var(--shadow-md)]">
                <HardDrive size={22} className="text-white" strokeWidth={2} />
              </div>
              {/* Sparkle accent */}
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-warning)] flex items-center justify-center">
                <Sparkles size={10} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">
                Disk Peek
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                {mode === "dev" ? "Clean up dev clutter" : "Explore your storage"}
              </p>
            </div>
          </div>

          {/* Mode Toggle - Centered */}
          <ModeToggle
            mode={mode}
            onModeChange={handleModeChange}
            disabled={isBusy}
          />

          {/* Actions */}
          <div className="flex items-center gap-3 min-w-[160px] justify-end">
            {scanState === "completed" && !isCleaning && !isCleanCompleted && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetScan}
                  className="gap-2 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-text-muted)] rounded-[var(--radius-lg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                >
                  <RefreshCw size={15} />
                  Scan again
                </Button>
                {result && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
                    <Clock size={12} />
                    <span className="font-mono">{formatDuration(result.scanDuration)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6">
        {/* Error State */}
        {(scanError || cleanError) && (
          <div className="mb-4 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-lg)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-danger)]/20 flex items-center justify-center">
                <span className="text-sm">⚠️</span>
              </div>
              <p className="text-sm text-[var(--color-danger)] font-medium">{scanError || cleanError}</p>
            </div>
          </div>
        )}

        {/* Content based on state */}
        {scanState === "idle" && !isCleaning && !isCleanCompleted && (
          <EmptyState mode={mode} onScan={scan} isScanning={false} />
        )}

        {isScanning && (
          <ScanProgress
            current={scanProgress.current}
            total={scanProgress.total}
            currentPath={scanProgress.currentPath}
            bytesScanned={scanProgress.bytesScanned}
          />
        )}

        {isCleaning && (
          <CleanProgress
            current={cleanProgress.current}
            total={cleanProgress.total}
            currentPath={cleanProgress.currentPath}
            bytesFreed={cleanProgress.bytesFreed}
            currentItem={cleanProgress.currentItem}
          />
        )}

        {isCleanCompleted && cleanResult && (
          <CleanCompletedState 
            result={cleanResult} 
            onDone={handleCleanDone} 
          />
        )}

        {scanState === "completed" && result && !isCleaning && !isCleanCompleted && (
          mode === "dev" ? (
            <ScanResults result={result as scanner.ScanResult} onClean={handleClean} />
          ) : (
            <FileTreeResults result={result as scanner.FullScanResult} />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isCleaning 
                ? "bg-[var(--color-danger)] animate-pulse" 
                : isScanning 
                  ? "bg-[var(--color-warning)] animate-pulse" 
                  : isCleanCompleted
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-success)]"
            }`} />
            <span className="text-xs text-[var(--color-text-muted)]">
              {isCleaning
                ? "Cleaning in progress..."
                : isScanning
                  ? "Scanning in progress..."
                  : isCleanCompleted
                    ? "Cleaning complete!"
                    : mode === "dev"
                      ? "Ready to clean dev caches"
                      : "Ready to explore"
              }
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-bg-elevated)] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]">
            v0.1.0
          </span>
        </div>
      </footer>
    </div>
  );
}

function formatDuration(nanoseconds: number): string {
  const ms = nanoseconds / 1_000_000;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${sizes[i]}`;
}

interface CleanCompletedStateProps {
  result: scanner.CleanResult;
  onDone: () => void;
}

function CleanCompletedState({ result, onDone }: CleanCompletedStateProps) {
  const hasErrors = result.errors && result.errors.length > 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
      {/* Success icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-[var(--color-success)]/10 border-2 border-[var(--color-success)]/30 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-[var(--color-success)]" />
        </div>
        {/* Sparkle decorations */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--color-warning)] flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      {/* Success message */}
      <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
        Cleaning Complete!
      </h2>
      <p className="text-[var(--color-text-secondary)] mb-6">
        Your disk space has been freed up successfully
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex flex-col items-center px-6 py-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
          <span className="text-3xl font-bold text-[var(--color-success)] font-mono size-reveal">
            {formatSize(result.freedBytes)}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1">Space Freed</span>
        </div>
        <div className="flex flex-col items-center px-6 py-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
          <span className="text-3xl font-bold text-[var(--color-text)] font-mono">
            {result.deletedPaths.length}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1">Items Cleaned</span>
        </div>
      </div>

      {/* Errors if any */}
      {hasErrors && result.errors && (
        <div className="w-full max-w-md mb-6 p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-[var(--radius-lg)]">
          <p className="text-sm text-[var(--color-warning)] font-medium mb-2">
            Some items couldn't be cleaned:
          </p>
          <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
            {result.errors.slice(0, 3).map((err, i) => (
              <li key={i} className="truncate">• {err}</li>
            ))}
            {result.errors.length > 3 && (
              <li className="text-[var(--color-text-muted)]">
                ...and {result.errors.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Action button */}
      <Button
        size="lg"
        onClick={onDone}
        className="px-8 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] hover:from-[var(--color-accent-hover)] hover:to-[var(--color-accent)] text-white font-semibold rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-glow)] transition-all duration-300"
      >
        <RefreshCw size={18} className="mr-2" />
        Scan Again
      </Button>

      <p className="text-xs text-[var(--color-text-muted)] mt-4">
        Items were moved to Trash — you can restore them if needed
      </p>
    </div>
  );
}

export default App;
