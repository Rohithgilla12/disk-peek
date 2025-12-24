import { useState } from "react";
import { FileBox, Copy, BarChart3, Wrench } from "lucide-react";
import { LargeFilesView } from "./LargeFilesView";
import { DuplicatesView } from "./DuplicatesView";
import { TrendsView } from "./TrendsView";
import { useLargeFiles } from "@/hooks/useLargeFiles";
import { useDuplicates } from "@/hooks/useDuplicates";
import { useTrends } from "@/hooks/useTrends";

type ToolTab = "large-files" | "duplicates" | "trends";

interface ToolsPanelProps {
  onClose?: () => void;
}

export function ToolsPanel({ onClose }: ToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<ToolTab>("large-files");

  const largeFiles = useLargeFiles();
  const duplicates = useDuplicates();
  const trends = useTrends();

  const tabs = [
    { id: "large-files" as const, label: "Large Files", icon: FileBox, color: "var(--color-warning)" },
    { id: "duplicates" as const, label: "Duplicates", icon: Copy, color: "var(--color-accent)" },
    { id: "trends" as const, label: "Trends", icon: BarChart3, color: "var(--color-success)" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 mb-6">
        <div className="inline-flex items-center p-1.5 rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium
                  transition-all duration-200 ease-out
                  ${
                    isActive
                      ? "bg-[var(--color-bg-hover)] text-[var(--color-text)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]/50"
                  }
                `}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? tab.color : undefined }}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "large-files" && (
          <LargeFilesView
            state={largeFiles.state}
            result={largeFiles.result}
            error={largeFiles.error}
            progress={largeFiles.progress}
            onScan={largeFiles.scan}
            onReset={largeFiles.reset}
          />
        )}
        {activeTab === "duplicates" && (
          <DuplicatesView
            state={duplicates.state}
            result={duplicates.result}
            error={duplicates.error}
            onScan={duplicates.scan}
            onDeleteGroup={duplicates.deleteGroup}
            onReset={duplicates.reset}
          />
        )}
        {activeTab === "trends" && (
          <TrendsView
            state={trends.state}
            result={trends.result}
            alerts={trends.alerts}
            error={trends.error}
            onLoad={trends.load}
            onClearHistory={trends.clearHistory}
            onReset={trends.reset}
          />
        )}
      </div>
    </div>
  );
}
