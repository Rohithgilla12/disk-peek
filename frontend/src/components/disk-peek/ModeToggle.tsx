import { Monitor, Zap, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/components/ui/motion";

export type ScanMode = "normal" | "dev" | "tools";

interface ModeToggleProps {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  disabled?: boolean;
}

const modes = [
  { id: "normal" as const, label: "Explorer", icon: Monitor, gradient: "from-[var(--color-accent)] to-[#5b9cf5]" },
  { id: "dev" as const, label: "Dev Clean", icon: Zap, gradient: "from-[var(--color-accent)] to-[var(--color-accent-hover)]" },
  { id: "tools" as const, label: "Tools", icon: Wrench, gradient: "from-[var(--color-warning)] to-[var(--color-warning)]/80" },
];

export function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <motion.div
      className="inline-flex items-center p-1.5 rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
    >
      {modes.map((modeOption) => {
        const Icon = modeOption.icon;
        const isActive = mode === modeOption.id;

        return (
          <motion.button
            key={modeOption.id}
            onClick={() => onModeChange(modeOption.id)}
            disabled={disabled}
            className={`
              relative flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold
              transition-colors duration-200
              ${
                isActive
                  ? `bg-gradient-to-r ${modeOption.gradient} text-white shadow-[var(--shadow-sm)]`
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            transition={springs.snappy}
          >
            <motion.span
              animate={{
                scale: isActive ? 1 : 0.9,
                rotate: isActive ? [0, -10, 10, 0] : 0
              }}
              transition={{
                scale: springs.snappy,
                rotate: { duration: 0.4, ease: "easeInOut" }
              }}
            >
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
            </motion.span>
            <span>{modeOption.label}</span>

            {/* Active indicator dot */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white shadow-sm"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={springs.bouncy}
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
