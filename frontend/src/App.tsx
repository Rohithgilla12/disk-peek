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
import { RefreshCw, Clock } from "lucide-react";
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
      <header className="flex-shrink-0 px-6 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-[var(--shadow-md)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-text)] tracking-tight">
                Disk Peek
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                {mode === "dev" ? "Developer Cache Cleaner" : "Disk Analyzer"}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <ModeToggle
            mode={mode}
            onModeChange={handleModeChange}
            disabled={state === "scanning"}
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {state === "completed" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                >
                  <RefreshCw size={16} className="mr-1.5" />
                  New Scan
                </Button>
                {result && (
                  <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <Clock size={12} />
                    {formatDuration(result.scanDuration)}
                  </span>
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
          <div className="mb-4 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-md)]">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
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
      <footer className="flex-shrink-0 px-6 py-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>
            {mode === "dev"
              ? "Scanning developer caches only"
              : "Full disk analysis"}
          </span>
          <span className="font-mono">v0.1.0</span>
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
