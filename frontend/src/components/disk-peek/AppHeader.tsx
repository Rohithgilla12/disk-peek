import { RefreshCw, Clock, HardDrive, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ModeToggle, type ScanMode } from "./ModeToggle";
import { motion } from "framer-motion";
import { springs } from "@/components/ui/motion";

interface AppHeaderProps {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  isBusy: boolean;
  scanState: "idle" | "scanning" | "completed" | "error" | "cancelled";
  isCleaning: boolean;
  isCleanCompleted: boolean;
  scanDuration?: number;
  onReset: () => void;
  onOpenSettings: () => void;
}

export function AppHeader({
  mode,
  onModeChange,
  isBusy,
  scanState,
  isCleaning,
  isCleanCompleted,
  scanDuration,
  onReset,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="flex-shrink-0 px-6 py-4 border-b border-[var(--color-border)]/50 glass-subtle">
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.smooth}
        >
          <div className="relative group">
            <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-[var(--shadow-md)] group-hover:glow-accent transition-shadow duration-300">
              <HardDrive size={22} className="text-white" strokeWidth={2} />
            </div>
            {/* Sparkle accent */}
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-warning)] flex items-center justify-center shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.bouncy, delay: 0.3 }}
            >
              <Sparkles size={10} className="text-white" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">
              Disk Peek
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              {mode === "dev"
                ? "Clean up dev clutter"
                : mode === "tools"
                  ? "Advanced analysis tools"
                  : "Explore your storage"}
            </p>
          </div>
        </motion.div>

        {/* Mode Toggle - Centered */}
        <ModeToggle mode={mode} onModeChange={onModeChange} disabled={isBusy} />

        {/* Actions */}
        <motion.div
          className="flex items-center gap-3 min-w-[200px] justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.smooth}
        >
          {scanState === "completed" && !isCleaning && !isCleanCompleted && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springs.bouncy}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="gap-2 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-text-muted)] rounded-[var(--radius-lg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                >
                  <RefreshCw size={15} />
                  Scan again
                </Button>
              </motion.div>
              {scanDuration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...springs.bouncy, delay: 0.1 }}
                >
                  <Badge variant="ghost" className="gap-1.5">
                    <Clock size={12} />
                    <span className="font-mono">{formatDuration(scanDuration)}</span>
                  </Badge>
                </motion.div>
              )}
            </>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            disabled={isBusy}
            className="w-9 h-9 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)]"
            title="Settings"
          >
            <Settings size={18} className="text-[var(--color-text-muted)]" />
          </Button>
        </motion.div>
      </div>
    </header>
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
