import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { springs } from "@/components/ui/motion";
import type { ScanMode } from "./ModeToggle";

interface AppFooterProps {
  mode: ScanMode;
  isScanning: boolean;
  isCleaning: boolean;
  isCleanCompleted: boolean;
}

export function AppFooter({
  mode,
  isScanning,
  isCleaning,
  isCleanCompleted,
}: AppFooterProps) {
  const getStatusDotClass = () => {
    if (isCleaning) return "bg-[var(--color-danger)]";
    if (isScanning) return "bg-[var(--color-warning)]";
    return "bg-[var(--color-success)]";
  };

  const getStatusText = () => {
    if (isCleaning) return "Cleaning in progress...";
    if (isScanning) return "Scanning in progress...";
    if (isCleanCompleted) return "Cleaning complete!";
    if (mode === "dev") return "Ready to clean dev caches";
    if (mode === "tools") return "Analysis tools ready";
    return "Ready to explore";
  };

  return (
    <motion.footer
      className="flex-shrink-0 px-6 py-3 border-t border-[var(--color-border)]/50 glass-subtle"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.smooth, delay: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${getStatusDotClass()}`}
            animate={
              isCleaning || isScanning
                ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }
                : {}
            }
            transition={
              isCleaning || isScanning
                ? { duration: 1, repeat: Infinity }
                : {}
            }
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            {getStatusText()}
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          v0.2.0
        </Badge>
      </div>
    </motion.footer>
  );
}
