import { useState } from "react";
import "@/index.css";
import {
  ModeToggle,
  EmptyState,
  ScanProgress,
  ScanResults,
  FileTreeResults,
  type ScanMode,
} from "@/components/disk-peek";
import type { scanner } from "../wailsjs/go/models";
import { useScan } from "@/hooks/useScan";
import { RefreshCw, Clock, HardDrive, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function App() {
  const [mode, setMode] = useState<ScanMode>("dev");
  const { state, result, progress, error, scan, reset } = useScan(mode);

  const handleModeChange = (newMode: ScanMode) => {
    if (state === "scanning") return;
    setMode(newMode);
    reset();
  };

  const handleClean = (categoryIds: string[]) => {
    console.log("Cleaning categories:", categoryIds);
    // TODO: Implement clean functionality
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
            disabled={state === "scanning"}
          />

          {/* Actions */}
          <div className="flex items-center gap-3 min-w-[160px] justify-end">
            {state === "completed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
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
        {error && (
          <div className="mb-4 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-lg)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-danger)]/20 flex items-center justify-center">
                <span className="text-sm">⚠️</span>
              </div>
              <p className="text-sm text-[var(--color-danger)] font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Content based on state */}
        {state === "idle" && (
          <EmptyState mode={mode} onScan={scan} isScanning={false} />
        )}

        {state === "scanning" && (
          <ScanProgress
            current={progress.current}
            total={progress.total}
            currentPath={progress.currentPath}
            bytesScanned={progress.bytesScanned}
          />
        )}

        {state === "completed" && result && (
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
            <div className={`w-2 h-2 rounded-full ${state === "scanning" ? "bg-[var(--color-warning)] animate-pulse" : "bg-[var(--color-success)]"}`} />
            <span className="text-xs text-[var(--color-text-muted)]">
              {state === "scanning"
                ? "Scanning in progress..."
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

export default App;
