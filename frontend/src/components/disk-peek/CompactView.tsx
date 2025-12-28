import { useState, useEffect } from "react";
import { HardDrive, Sparkles, Play, Loader2, Maximize2, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/components/ui/motion";
import { ScanDev, QuickScanDev, SetFullMode, CleanCategories } from "../../../wailsjs/go/main/App";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import { formatSize } from "@/lib/formatters";

interface ScanProgress {
  current: number;
  total: number;
  currentPath: string;
  bytesScanned: number;
}

interface ScanResultData {
  totalSize: number;
  categories: Array<{ id: string; name: string; size: number }>;
}

type ViewState = "idle" | "scanning" | "results" | "cleaning" | "done";

export function CompactView() {
  const [state, setState] = useState<ViewState>("idle");
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [freedBytes, setFreedBytes] = useState(0);

  useEffect(() => {
    const unsubProgress = EventsOn("scan:progress", (data: ScanProgress) => {
      setProgress(data);
    });

    const unsubCompleted = EventsOn("scan:completed", (data: ScanResultData) => {
      setState("results");
      setResult(data);
    });

    const unsubCleanCompleted = EventsOn("clean:completed", (data: { freedBytes: number }) => {
      setState("done");
      setFreedBytes(data.freedBytes);
    });

    return () => {
      unsubProgress();
      unsubCompleted();
      unsubCleanCompleted();
    };
  }, []);

  const handleQuickScan = async () => {
    setState("scanning");
    setProgress(null);
    setResult(null);
    try {
      await QuickScanDev();
    } catch (err) {
      console.error("Scan failed:", err);
      setState("idle");
    }
  };

  const handleFullScan = async () => {
    setState("scanning");
    setProgress(null);
    setResult(null);
    try {
      await ScanDev();
    } catch (err) {
      console.error("Scan failed:", err);
      setState("idle");
    }
  };

  const handleClean = async () => {
    if (!result) return;
    setState("cleaning");
    try {
      const categoryIds = result.categories.map((c) => c.id);
      await CleanCategories(categoryIds);
    } catch (err) {
      console.error("Clean failed:", err);
      setState("results");
    }
  };

  const handleExpandWindow = () => {
    SetFullMode();
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setFreedBytes(0);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)] p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-md">
            <HardDrive size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)]">Disk Peek</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Quick Access</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExpandWindow}
          className="w-8 h-8"
          title="Expand to full window"
        >
          <Maximize2 size={16} className="text-[var(--color-text-muted)]" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.smooth}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
                <Sparkles size={32} className="text-[var(--color-accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                Ready to Clean
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                Scan for developer cache files
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleQuickScan}
                  className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                >
                  <Play size={16} className="mr-2" />
                  Quick Scan
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFullScan}
                  className="w-full"
                >
                  Full Scan
                </Button>
              </div>
            </motion.div>
          )}

          {state === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springs.smooth}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
                <Loader2 size={32} className="text-[var(--color-accent)] animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                Scanning...
              </h2>
              {progress && (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {formatSize(progress.bytesScanned)} scanned
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[280px]">
                    {progress.currentPath.split("/").slice(-2).join("/")}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {state === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.smooth}
              className="text-center w-full"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
                <Sparkles size={32} className="text-[var(--color-success)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">
                {formatSize(result.totalSize)}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                found to clean
              </p>

              {/* Top categories */}
              <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 mb-4">
                {result.categories.slice(0, 4).map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <span className="text-[var(--color-text-secondary)] truncate">
                      {cat.name}
                    </span>
                    <span className="text-[var(--color-text)] font-mono">
                      {formatSize(cat.size)}
                    </span>
                  </div>
                ))}
                {result.categories.length > 4 && (
                  <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)] mt-2">
                    +{result.categories.length - 4} more categories
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleClean}
                  className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                >
                  <Trash2 size={16} className="mr-2" />
                  Clean All
                </Button>
              </div>
            </motion.div>
          )}

          {state === "cleaning" && (
            <motion.div
              key="cleaning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springs.smooth}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
                <Loader2 size={32} className="text-[var(--color-accent)] animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                Cleaning...
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Moving files to Trash
              </p>
            </motion.div>
          )}

          {state === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springs.bouncy}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
                <CheckCircle size={40} className="text-[var(--color-success)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-success)] mb-1">
                {formatSize(freedBytes)}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                freed up!
              </p>
              <Button onClick={handleReset} className="w-full">
                Scan Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <p className="text-xs text-[var(--color-text-muted)]">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[10px]">
            ⌘ + Shift + M
          </kbd>{" "}
          to expand
        </p>
      </div>
    </div>
  );
}
