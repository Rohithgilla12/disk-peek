import { Loader2, Folder, HardDrive, X } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/components/ui/motion";

interface ScanProgressProps {
  current: number;
  total: number;
  currentPath?: string;
  bytesScanned: number;
  onCancel?: () => void;
}

const scanningMessages = [
  "Finding hidden treasures...",
  "Exploring your folders...",
  "Digging through caches...",
  "Uncovering space hogs...",
  "Almost there...",
];

export function ScanProgress({
  current,
  total,
  currentPath,
  bytesScanned,
  onCancel,
}: ScanProgressProps) {
  // Handle indeterminate state when total is 0
  const isIndeterminate = total === 0;
  const percentage = isIndeterminate ? 0 : (current / total) * 100;

  // Cycle through messages based on bytes scanned
  const messageIndex = Math.min(
    Math.floor((bytesScanned / (1024 * 1024 * 500)) * scanningMessages.length),
    scanningMessages.length - 1
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
      {/* Animated loader with floating icons */}
      <motion.div
        className="relative mb-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springs.bouncy}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-[-20px] rounded-full bg-[var(--color-accent)]/10"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

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
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 364" }}
              animate={{
                strokeDasharray: isIndeterminate
                  ? ["0 364", "182 182", "0 364"]
                  : `${percentage * 3.64} 364`
              }}
              transition={
                isIndeterminate
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.5, ease: "easeOut" }
              }
            />
          </svg>

          {/* Inner content */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={36} className="text-[var(--color-accent)]" />
            </motion.div>
            {!isIndeterminate && (
              <motion.span
                className="text-lg font-bold text-[var(--color-text)] mt-1 font-mono"
                key={Math.round(percentage)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {Math.round(percentage)}%
              </motion.span>
            )}
          </div>
        </div>

        {/* Floating decorative icons */}
        <motion.div
          className="absolute -top-3 -right-3 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-md)]"
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: [0, -6, 0]
          }}
          transition={{
            opacity: { delay: 0.2, duration: 0.3 },
            scale: { delay: 0.2, ...springs.bouncy },
            rotate: { delay: 0.2, ...springs.bouncy },
            y: { delay: 0.5, duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Folder size={18} className="text-[var(--color-warning)]" />
        </motion.div>

        <motion.div
          className="absolute -bottom-2 -left-4 w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-md)]"
          initial={{ opacity: 0, scale: 0, rotate: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: [0, -4, 0]
          }}
          transition={{
            opacity: { delay: 0.3, duration: 0.3 },
            scale: { delay: 0.3, ...springs.bouncy },
            rotate: { delay: 0.3, ...springs.bouncy },
            y: { delay: 0.6, duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <HardDrive size={16} className="text-[var(--color-accent)]" />
        </motion.div>
      </motion.div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={messageIndex}
          className="text-2xl font-semibold text-[var(--color-text)] mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={springs.smooth}
        >
          {scanningMessages[messageIndex]}
        </motion.h2>
      </AnimatePresence>

      {/* Stats row */}
      <motion.div
        className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.1 }}
      >
        {!isIndeterminate ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-full border border-[var(--color-border)]">
            <motion.span
              className="w-2 h-2 rounded-full bg-[var(--color-success)]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span>{current} / {total} locations</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-full border border-[var(--color-border)]">
            <motion.span
              className="w-2 h-2 rounded-full bg-[var(--color-accent)]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span>Scanning...</span>
          </div>
        )}
        <motion.div
          className="px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-full border border-[var(--color-border)] font-mono"
          key={formatSize(bytesScanned)}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {formatSize(bytesScanned)}
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="w-full max-w-md mb-6"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ ...springs.smooth, delay: 0.15 }}
      >
        <div className="h-2 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] overflow-hidden relative">
          {isIndeterminate ? (
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <motion.div
              className="h-full rounded-full bg-[var(--color-accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(percentage, 2)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
        </div>
      </motion.div>

      {/* Current path */}
      <AnimatePresence mode="wait">
        {currentPath && (
          <motion.div
            key={currentPath}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] rounded-[var(--radius-md)] border border-[var(--color-border)] max-w-md"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <Folder size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />
            <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
              {truncatePath(currentPath)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel button */}
      {onCancel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="mt-6 gap-2"
            >
              <X size={14} />
              Cancel Scan
            </Button>
          </motion.div>
        </motion.div>
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
