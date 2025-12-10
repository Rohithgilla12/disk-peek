import { HardDrive, Search, Sparkles, Zap, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanMode } from "./ModeToggle";

interface EmptyStateProps {
  mode: ScanMode;
  onScan: () => void;
  isScanning: boolean;
}

export function EmptyState({ mode, onScan, isScanning }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
      {/* Animated icon with floating elements */}
      <div className="relative mb-10">
        {/* Outer glow */}
        <div className="absolute inset-[-16px] rounded-[var(--radius-xl)] bg-[var(--color-accent)]/5 animate-pulse" />

        {/* Main icon container */}
        <div
          className={`
            relative w-28 h-28 rounded-[var(--radius-xl)]
            bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)]
            flex items-center justify-center
            shadow-[var(--shadow-glow)]
            transition-transform duration-500
            hover:scale-105
            ${isScanning ? "scan-pulse" : ""}
          `}
        >
          {/* Inner highlight */}
          <div className="absolute inset-2 rounded-[calc(var(--radius-xl)-8px)] bg-gradient-to-br from-white/20 to-transparent" />

          {/* Icon */}
          {mode === "dev" ? (
            <Zap size={48} className="text-white drop-shadow-lg relative z-10" strokeWidth={2} />
          ) : (
            <HardDrive size={48} className="text-white drop-shadow-lg relative z-10" strokeWidth={1.5} />
          )}
        </div>

        {/* Floating decorative elements */}
        <div
          className="absolute -top-3 -right-3 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-success)] flex items-center justify-center shadow-[var(--shadow-md)] animate-bounce"
          style={{ animationDuration: "3s" }}
        >
          <Sparkles size={18} className="text-white" />
        </div>

        <div
          className="absolute -bottom-2 -left-3 w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-warning)] flex items-center justify-center shadow-[var(--shadow-md)] animate-bounce"
          style={{ animationDuration: "3s", animationDelay: "0.5s" }}
        >
          <FolderOpen size={14} className="text-white" />
        </div>
      </div>

      {/* Text content */}
      <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2 text-center">
        {mode === "dev" ? "Clean Your Dev Caches" : "Analyze Your Disk"}
      </h2>
      <p className="text-[var(--color-text-secondary)] text-center max-w-md mb-8 leading-relaxed">
        {mode === "dev"
          ? "Find Xcode DerivedData, node_modules, Docker images, and other developer caches that can be safely cleaned."
          : "Get a complete breakdown of your disk usage. See exactly where your storage space is going."}
      </p>

      {/* Scan button */}
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
            : "hover:scale-105 hover:shadow-[var(--shadow-glow)] active:scale-100"
          }
        `}
      >
        <Search size={20} className="mr-2" />
        {isScanning ? "Scanning..." : "Start Scan"}
      </Button>

      {/* Quick tip */}
      <div className="mt-10 p-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">💡</span>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {mode === "dev"
                ? "Dev mode only scans safe-to-delete caches. Your projects and code are never touched."
                : "Normal mode scans your entire home folder to show all disk usage."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
