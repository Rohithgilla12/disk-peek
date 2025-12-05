import { Monitor, Wrench } from "lucide-react";

export type ScanMode = "normal" | "dev";

interface ModeToggleProps {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center p-1 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <button
        onClick={() => onModeChange("normal")}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium
          transition-all duration-200
          ${
            mode === "normal"
              ? "bg-[var(--color-accent)] text-white shadow-[var(--shadow-md)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <Monitor size={16} />
        <span>Normal</span>
      </button>
      <button
        onClick={() => onModeChange("dev")}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium
          transition-all duration-200
          ${
            mode === "dev"
              ? "bg-[var(--color-accent)] text-white shadow-[var(--shadow-md)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <Wrench size={16} />
        <span>Dev Mode</span>
      </button>
    </div>
  );
}
