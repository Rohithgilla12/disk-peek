import { HardDrive, Search, Sparkles } from "lucide-react";
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
      {/* Animated icon */}
      <div className="relative mb-8">
        <div
          className={`
          w-24 h-24 rounded-[var(--radius-xl)]
          bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)]
          flex items-center justify-center
          shadow-[var(--shadow-glow)]
          ${isScanning ? "scan-pulse" : ""}
        `}
        >
          <HardDrive size={40} className="text-white" />
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      {/* Text */}
      <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
        {mode === "dev" ? "Clean Your Dev Caches" : "Analyze Your Disk"}
      </h2>
      <p className="text-[var(--color-text-secondary)] text-center max-w-md mb-8">
        {mode === "dev"
          ? "Scan for Xcode DerivedData, node_modules, Docker images, and other developer caches that can be safely cleaned."
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
          transition-all duration-200
          ${isScanning ? "opacity-80" : "hover:scale-105 hover:shadow-[var(--shadow-glow)]"}
        `}
      >
        <Search size={20} className="mr-2" />
        {isScanning ? "Scanning..." : "Start Scan"}
      </Button>

      {/* Quick tip */}
      <p className="mt-8 text-xs text-[var(--color-text-muted)] text-center max-w-sm">
        {mode === "dev"
          ? "Tip: Dev mode scans only safe-to-delete caches. Your projects and code are never touched."
          : "Tip: Normal mode scans your entire home folder to show all disk usage."}
      </p>
    </div>
  );
}
