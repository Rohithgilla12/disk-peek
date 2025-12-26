import { Monitor, Zap, Wrench } from "lucide-react";

export type ScanMode = "normal" | "dev" | "tools";

interface ModeToggleProps {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center p-1.5 rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
      <button
        onClick={() => onModeChange("normal")}
        disabled={disabled}
        className={`
          relative flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold
          transition-all duration-300 ease-out
          ${
            mode === "normal"
              ? "bg-gradient-to-r from-[var(--color-accent)] to-[#5b9cf5] text-white shadow-[var(--shadow-sm)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <Monitor size={17} strokeWidth={mode === "normal" ? 2.5 : 2} />
        <span>Explorer</span>
        {mode === "normal" && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white shadow-sm" />
        )}
      </button>

      <button
        onClick={() => onModeChange("dev")}
        disabled={disabled}
        className={`
          relative flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold
          transition-all duration-300 ease-out
          ${
            mode === "dev"
              ? "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white shadow-[var(--shadow-sm)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <Zap size={17} strokeWidth={mode === "dev" ? 2.5 : 2} />
        <span>Dev Clean</span>
        {mode === "dev" && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white shadow-sm" />
        )}
      </button>

      <button
        onClick={() => onModeChange("tools")}
        disabled={disabled}
        className={`
          relative flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold
          transition-all duration-300 ease-out
          ${
            mode === "tools"
              ? "bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning)]/80 text-white shadow-[var(--shadow-sm)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <Wrench size={17} strokeWidth={mode === "tools" ? 2.5 : 2} />
        <span>Tools</span>
        {mode === "tools" && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white shadow-sm" />
        )}
      </button>
    </div>
  );
}
