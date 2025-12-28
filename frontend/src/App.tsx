import { useState, useCallback, useRef, useEffect } from "react";
import "@/index.css";
import {
  EmptyState,
  ScanProgress,
  CleanProgress,
  ScanResults,
  FileTreeResults,
  CleanCompletedDialog,
  SettingsPanel,
  ToolsPanel,
  AppHeader,
  AppFooter,
  CompactView,
  type ScanMode,
} from "@/components/disk-peek";
import type { scanner } from "../wailsjs/go/models";
import { useScan } from "@/hooks/useScan";
import { useClean } from "@/hooks/useClean";
import { useMenuEvents } from "@/hooks/useMenuEvents";
import { useNotifications } from "@/hooks/useNotifications";
import { IsCompactMode, SetCompactMode, SetFullMode } from "../wailsjs/go/main/App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/components/ui/motion";

function App() {
  const [mode, setMode] = useState<ScanMode>("dev");
  const [showSettings, setShowSettings] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const { state: scanState, result, progress: scanProgress, error: scanError, scan, quickScan, cancel: cancelScan, reset: resetScan } = useScan(mode);

  // Check if in compact mode on mount and window resize
  useEffect(() => {
    const checkCompactMode = async () => {
      try {
        const compact = await IsCompactMode();
        setIsCompact(compact);
      } catch {
        // Ignore errors during initial load
      }
    };
    checkCompactMode();

    // Listen for window resize
    const handleResize = () => {
      setIsCompact(window.innerWidth < 500);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcut to toggle compact mode (Cmd/Ctrl + Shift + M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (isCompact) {
          SetFullMode();
          setIsCompact(false);
        } else {
          SetCompactMode();
          setIsCompact(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompact]);
  const {
    state: cleanState,
    result: cleanResult,
    progress: cleanProgress,
    error: cleanError,
    clean,
    cancel: cancelClean,
    reset: resetClean
  } = useClean();

  // Enable system notifications for scan/clean events
  useNotifications({ enabled: true });

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

  // Render compact view if in compact mode
  if (isCompact) {
    return (
      <ThemeProvider defaultTheme="system">
        <CompactView />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider delayDuration={300}>
        <div className="h-screen flex flex-col bg-[var(--color-bg)] gradient-mesh noise-overlay">
          {/* Header */}
          <AppHeader
            mode={mode}
            onModeChange={handleModeChange}
            isBusy={isBusy}
            scanState={scanState}
            isCleaning={isCleaning}
            isCleanCompleted={isCleanCompleted}
            scanDuration={result?.scanDuration}
            onReset={resetScan}
            onOpenSettings={() => setShowSettings(true)}
            onCompactMode={() => {
              SetCompactMode();
              setIsCompact(true);
            }}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-hidden p-6">
            {/* Error State */}
            <AnimatePresence>
              {(scanError || cleanError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={springs.smooth}
                  className="mb-4 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-lg)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-danger)]/20 flex items-center justify-center">
                      <span className="text-sm">⚠️</span>
                    </div>
                    <p className="text-sm text-[var(--color-danger)] font-medium">
                      {scanError || cleanError}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* Clean completed dialog */}
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
          <AppFooter
            mode={mode}
            isScanning={isScanning}
            isCleaning={isCleaning}
            isCleanCompleted={isCleanCompleted}
          />

          {/* Settings Panel */}
          <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
