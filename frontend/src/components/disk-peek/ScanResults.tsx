import { useState, useMemo } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { StackedBar } from "./StackedBar";
import { CategoryCard } from "./CategoryCard";
import { Breadcrumbs } from "./Breadcrumbs";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  id: string;
  name: string;
  categories: scanner.Category[];
}

interface ScanResultsProps {
  result: scanner.ScanResult;
  onClean?: (categoryIds: string[]) => void;
}

export function ScanResults({ result, onClean }: ScanResultsProps) {
  const [navigationStack, setNavigationStack] = useState<BreadcrumbItem[]>([
    { id: "root", name: "All Categories", categories: result.categories },
  ]);
  const [highlightedCategoryId, setHighlightedCategoryId] = useState<
    string | null
  >(null);

  const currentLevel = navigationStack[navigationStack.length - 1];

  // Calculate total size for current level
  const currentTotalSize = useMemo(() => {
    return currentLevel.categories.reduce((sum, cat) => sum + cat.size, 0);
  }, [currentLevel]);

  // Sort categories by size
  const sortedCategories = useMemo(() => {
    return [...currentLevel.categories].sort((a, b) => b.size - a.size);
  }, [currentLevel.categories]);

  const handleCategoryClick = (category: scanner.Category) => {
    if (category.children && category.children.length > 0) {
      setNavigationStack((prev) => [
        ...prev,
        { id: category.id, name: category.name, categories: category.children! },
      ]);
    }
  };

  const handleBreadcrumbNavigate = (index: number) => {
    setNavigationStack((prev) => prev.slice(0, index + 1));
  };

  const handleBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack((prev) => prev.slice(0, -1));
    }
  };

  const breadcrumbItems = navigationStack.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header with total size */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {currentLevel.name}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-mono font-semibold text-[var(--color-text)] size-reveal">
              {formatSize(currentTotalSize)}
            </span>{" "}
            total across {sortedCategories.length} categories
          </p>
        </div>

        {navigationStack.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        )}
      </div>

      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>

      {/* Stacked bar */}
      <div className="mb-6">
        <StackedBar
          categories={sortedCategories}
          totalSize={currentTotalSize}
          onCategoryClick={handleCategoryClick}
          highlightedId={highlightedCategoryId}
        />
      </div>

      {/* Category grid */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        <div className="grid grid-cols-1 gap-3">
          {sortedCategories.map((category, index) => (
            <div
              key={category.id}
              onMouseEnter={() => setHighlightedCategoryId(category.id)}
              onMouseLeave={() => setHighlightedCategoryId(null)}
            >
              <CategoryCard
                category={category}
                index={index}
                totalSize={currentTotalSize}
                onClick={() => handleCategoryClick(category)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Clean button - sticky footer */}
      {currentTotalSize > 0 && onClean && (
        <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
          <Button
            size="lg"
            onClick={() =>
              onClean(sortedCategories.map((c) => c.id))
            }
            className="w-full h-12 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white font-semibold"
          >
            <Trash2 size={18} className="mr-2" />
            Clean {formatSize(currentTotalSize)}
          </Button>
          <p className="text-xs text-[var(--color-text-muted)] text-center mt-2">
            Items will be moved to Trash (recoverable)
          </p>
        </div>
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
