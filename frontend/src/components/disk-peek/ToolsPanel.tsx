import { FileBox, Copy, BarChart3, Lightbulb } from "lucide-react";
import { LargeFilesView } from "./LargeFilesView";
import { DuplicatesView } from "./DuplicatesView";
import { TrendsView } from "./TrendsView";
import { RecommendationsView } from "./RecommendationsView";
import { useLargeFiles } from "@/hooks/useLargeFiles";
import { useDuplicates } from "@/hooks/useDuplicates";
import { useTrends } from "@/hooks/useTrends";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ToolTab = "recommendations" | "large-files" | "duplicates" | "trends";

interface ToolsPanelProps {
  onClose?: () => void;
}

export function ToolsPanel({ onClose }: ToolsPanelProps) {
  const largeFiles = useLargeFiles();
  const duplicates = useDuplicates();
  const trends = useTrends();

  const tabs = [
    { id: "recommendations" as const, label: "Smart Tips", icon: Lightbulb, color: "var(--color-warning)" },
    { id: "large-files" as const, label: "Large Files", icon: FileBox, color: "var(--color-danger)" },
    { id: "duplicates" as const, label: "Duplicates", icon: Copy, color: "var(--color-accent)" },
    { id: "trends" as const, label: "Trends", icon: BarChart3, color: "var(--color-success)" },
  ];

  return (
    <Tabs defaultValue="recommendations" className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 mb-6">
        <TabsList className="inline-flex h-auto p-1.5 rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="group relative flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-200 ease-out data-[state=active]:bg-[var(--color-bg-hover)] data-[state=active]:text-[var(--color-text)] data-[state=active]:shadow-[var(--shadow-sm)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]/50"
              >
                <Icon
                  size={16}
                  className="transition-colors group-data-[state=active]:drop-shadow-sm"
                  style={{ color: tab.color }}
                />
                <span>{tab.label}</span>
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity"
                  style={{ backgroundColor: tab.color }}
                />
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Content */}
      <TabsContent value="recommendations" className="flex-1 overflow-hidden mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2">
        <RecommendationsView />
      </TabsContent>
      <TabsContent value="large-files" className="flex-1 overflow-hidden mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2">
        <LargeFilesView
          state={largeFiles.state}
          result={largeFiles.result}
          error={largeFiles.error}
          progress={largeFiles.progress}
          onScan={largeFiles.scan}
          onReset={largeFiles.reset}
        />
      </TabsContent>
      <TabsContent value="duplicates" className="flex-1 overflow-hidden mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2">
        <DuplicatesView
          state={duplicates.state}
          result={duplicates.result}
          error={duplicates.error}
          onScan={duplicates.scan}
          onDeleteGroup={duplicates.deleteGroup}
          onReset={duplicates.reset}
        />
      </TabsContent>
      <TabsContent value="trends" className="flex-1 overflow-hidden mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2">
        <TrendsView
          state={trends.state}
          result={trends.result}
          alerts={trends.alerts}
          error={trends.error}
          onLoad={trends.load}
          onClearHistory={trends.clearHistory}
          onReset={trends.reset}
        />
      </TabsContent>
    </Tabs>
  );
}
