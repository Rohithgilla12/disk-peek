import { useState, useCallback, useRef } from "react";
import "@/index.css";
import {
  ModeToggle,
  EmptyState,
  ScanProgress,
  CleanProgress,
  ScanResults,
  FileTreeResults,
  CleanCompletedDialog,
  SettingsPanel,
  ToolsPanel,
  type ScanMode,
} from "@/components/disk-peek";
import type { scanner } from "../wailsjs/go/models";
import { useScan } from "@/hooks/useScan";
import { useClean } from "@/hooks/useClean";
import { useMenuEvents } from "@/hooks/useMenuEvents";
import { RefreshCw, Clock, HardDrive, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function App() {
  const [mode, setMode] = useState<ScanMode>("dev");
  const [showSettings, setShowSettings] = useState(false);
  const { state: scanState, result, progress: scanProgress, error: scanError, scan, quickScan, cancel: cancelScan, reset: resetScan } = useScan(mode);
  const {
    state: cleanState,
    result: cleanResult,
    progress: cleanProgress,
    error: cleanError,
    clean,
    cancel: cancelClean,
    reset: resetClean
  } = useClean();

  // Ref to ScanResults for programmatic clean trigger
  const selectedCategoriesRef = useRef<string[]>([]);

  // Combined state for UI
  const isScanning = scanState === "scanning";
  const isCleaning = cleanState === "cleaning";
  const isCleanCompleted = cleanState === "completed";
  const isBusy = isScanning || isCleaning;

  const handleModeChange = useCallback((newMode: ScanMode) => {
    if (isBusy) return;
    setMode(newMode);
    resetScan();
    resetClean();
  }, [isBusy, resetScan, resetClean]);

  const handleClean = async (categoryIds: string[]) => {
    await clean(categoryIds);
  };

  // Go back to the scan results without rescanning
  const handleCleanGoBack = () => {
    resetClean();
  };

  // Rescan to show updated sizes
  const handleCleanScanAgain = () => {
    resetClean();
    scan();
  };

  // Track selected categories from ScanResults
  const handleSelectionChange = useCallback((categoryIds: string[]) => {
    selectedCategoriesRef.current = categoryIds;
  }, []);

  // Cancel any running operation
  const handleCancel = useCallback(() => {
    if (isScanning) {
      cancelScan();
    } else if (isCleaning) {
      cancelClean();
    }
  }, [isScanning, isCleaning, cancelScan, cancelClean]);

  // Menu event handlers
  useMenuEvents({
    onScan: () => {
      if (!isBusy) {
        scan();
      }
    },
    onQuickScan: () => {
      if (!isBusy) {
        quickScan();
      }
    },
    onClean: () => {
      if (!isBusy && scanState === "completed" && selectedCategoriesRef.current.length > 0) {
        handleClean(selectedCategoriesRef.current);
      }
    },
    onSettings: () => {
      if (!isBusy) {
        setShowSettings(true);
      }
    },
    onModeChange: handleModeChange,
    onCancel: handleCancel,
  });

  return (
    <ThemeProvider defaultTheme="system">
    <TooltipProvider delayDuration={300}>
    <div className="h-screen flex flex-col bg-[var(--color-bg)] gradient-mesh noise-overlay">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-[var(--color-border)]/50 glass-subtle">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-[var(--shadow-md)] group-hover:glow-accent transition-shadow duration-300">
                <HardDrive size={22} className="text-white" strokeWidth={2} />
              </div>
              {/* Sparkle accent */}
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-warning)] flex items-center justify-center shadow-sm">
                <Sparkles size={10} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">
                Disk Peek
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                {mode === "dev" ? "Clean up dev clutter" : mode === "tools" ? "Advanced analysis tools" : "Explore your storage"}
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
          <div className="flex items-center gap-3 min-w-[200px] justify-end">
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
                  <Badge variant="ghost" className="gap-1.5">
                    <Clock size={12} />
                    <span className="font-mono">{formatDuration(result.scanDuration)}</span>
                  </Badge>
                )}
              </>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              disabled={isBusy}
              className="w-9 h-9 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)]"
              title="Settings"
            >
              <Settings size={18} className="text-[var(--color-text-muted)]" />
            </Button>
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
        {scanState === "idle" && !isCleaning && !isCleanCompleted && mode !== "tools" && (
          <EmptyState mode={mode} onScan={scan} isScanning={false} />
        )}

        {isScanning && (
          <ScanProgress
            current={scanProgress.current}
            total={scanProgress.total}
            currentPath={scanProgress.currentPath}
            bytesScanned={scanProgress.bytesScanned}
            onCancel={cancelScan}
          />
        )}

        {isCleaning && (
          <CleanProgress
            current={cleanProgress.current}
            total={cleanProgress.total}
            currentPath={cleanProgress.currentPath}
            bytesFreed={cleanProgress.bytesFreed}
            currentItem={cleanProgress.currentItem}
            onCancel={cancelClean}
          />
        )}

        {scanState === "completed" && result && !isCleaning && mode !== "tools" && (
          mode === "dev" ? (
            <ScanResults
              result={result as scanner.ScanResult}
              onClean={handleClean}
              onSelectionChange={handleSelectionChange}
            />
          ) : (
            <FileTreeResults result={result as scanner.FullScanResult} />
          )
        )}

        {mode === "tools" && !isCleaning && !isCleanCompleted && (
          <ToolsPanel />
        )}

        {/* Clean completed dialog - shows over the scan results */}
        {isCleanCompleted && cleanResult && (
          <CleanCompletedDialog
            open={isCleanCompleted}
            result={cleanResult}
            onGoBack={handleCleanGoBack}
            onScanAgain={handleCleanScanAgain}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 px-6 py-3 border-t border-[var(--color-border)]/50 glass-subtle">
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
                      : mode === "tools"
                        ? "Analysis tools ready"
                        : "Ready to explore"
              }
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            v0.2.0
          </Badge>
        </div>
      </footer>

      {/* Settings Panel */}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
    </TooltipProvider>
    </ThemeProvider>
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
