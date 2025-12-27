import { HardDrive, Search, Sparkles, Zap, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanMode } from "./ModeToggle";
import { motion } from "framer-motion";
import { springs } from "@/components/ui/motion";

interface EmptyStateProps {
  mode: ScanMode;
  onScan: () => void;
  isScanning: boolean;
}

export function EmptyState({ mode, onScan, isScanning }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
      {/* Animated icon with floating elements */}
      <motion.div
        className="relative mb-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...springs.bouncy, delay: 0.1 }}
      >
        {/* Outer glow */}
        <motion.div
          className="absolute inset-[-16px] rounded-[var(--radius-xl)] bg-[var(--color-accent)]/5"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main icon container */}
        <motion.div
          className={`
            relative w-28 h-28 rounded-[var(--radius-xl)]
            bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)]
            flex items-center justify-center
            shadow-[var(--shadow-glow)]
            ${isScanning ? "scan-pulse" : ""}
          `}
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.98 }}
          transition={springs.snappy}
        >
          {/* Inner highlight */}
          <div className="absolute inset-2 rounded-[calc(var(--radius-xl)-8px)] bg-gradient-to-br from-white/20 to-transparent" />

          {/* Icon */}
          <motion.div
            animate={{
              y: [0, -3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {mode === "dev" ? (
              <Zap size={48} className="text-white drop-shadow-lg relative z-10" strokeWidth={2} />
            ) : (
              <HardDrive size={48} className="text-white drop-shadow-lg relative z-10" strokeWidth={1.5} />
            )}
          </motion.div>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          className="absolute -top-3 -right-3 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-success)] flex items-center justify-center shadow-[var(--shadow-md)]"
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: [0, -6, 0]
          }}
          transition={{
            opacity: { delay: 0.3, duration: 0.3 },
            scale: { delay: 0.3, ...springs.bouncy },
            rotate: { delay: 0.3, ...springs.bouncy },
            y: { delay: 0.6, duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Sparkles size={18} className="text-white" />
        </motion.div>

        <motion.div
          className="absolute -bottom-2 -left-3 w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-warning)] flex items-center justify-center shadow-[var(--shadow-md)]"
          initial={{ opacity: 0, scale: 0, rotate: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: [0, -4, 0]
          }}
          transition={{
            opacity: { delay: 0.4, duration: 0.3 },
            scale: { delay: 0.4, ...springs.bouncy },
            rotate: { delay: 0.4, ...springs.bouncy },
            y: { delay: 0.8, duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <FolderOpen size={14} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.h2
        className="text-2xl font-semibold text-[var(--color-text)] mb-2 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.2 }}
      >
        {mode === "dev" ? "Clean Your Dev Caches" : "Analyze Your Disk"}
      </motion.h2>
      <motion.p
        className="text-[var(--color-text-secondary)] text-center max-w-md mb-8 leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.25 }}
      >
        {mode === "dev"
          ? "Find Xcode DerivedData, node_modules, Docker images, and other developer caches that can be safely cleaned."
          : "Get a complete breakdown of your disk usage. See exactly where your storage space is going."}
      </motion.p>

      {/* Scan button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.3 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={springs.snappy}
        >
          <Button
            size="lg"
            onClick={onScan}
            disabled={isScanning}
            className={`
              h-14 px-8 text-base font-semibold
              bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
              rounded-[var(--radius-lg)]
              transition-all duration-300
              ${isScanning
                ? "opacity-80"
                : "hover:shadow-[var(--shadow-glow)]"
              }
            `}
          >
            <Search size={20} className="mr-2" />
            {isScanning ? "Scanning..." : "Start Scan"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick tip */}
      <motion.div
        className="mt-10 p-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.4 }}
      >
        <div className="flex items-start gap-3">
          <motion.div
            className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <span className="text-sm">💡</span>
          </motion.div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {mode === "dev"
                ? "Dev mode only scans safe-to-delete caches. Your projects and code are never touched."
                : "Normal mode scans your entire home folder to show all disk usage."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
