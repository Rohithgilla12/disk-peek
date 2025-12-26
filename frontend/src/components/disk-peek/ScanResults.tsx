import { useState, useMemo, useEffect } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { StackedBar } from "./StackedBar";
import { CategoryCard } from "./CategoryCard";
import { Breadcrumbs } from "./Breadcrumbs";
import { ArrowLeft, Trash2, Sparkles, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  id: string;
  name: string;
  categories: scanner.Category[];
}

interface ScanResultsProps {
  result: scanner.ScanResult;
  onClean?: (categoryIds: string[]) => void;
  onSelectionChange?: (categoryIds: string[]) => void;
}

export function ScanResults({ result, onClean, onSelectionChange }: ScanResultsProps) {
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

  // Notify parent of current selection for keyboard shortcuts
  useEffect(() => {
    if (onSelectionChange) {
      const categoryIds = sortedCategories.map((c) => c.id);
      onSelectionChange(categoryIds);
    }
  }, [sortedCategories, onSelectionChange]);

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

  // Determine if we found a lot of space to clean
  const isSignificant = currentTotalSize > 1024 * 1024 * 500; // > 500MB

  return (
    <div className="flex flex-col h-full">
      {/* Header with total size */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              {currentLevel.name}
            </h2>
            {isSignificant && navigationStack.length === 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-success)]/15 text-[var(--color-success)] rounded-full text-xs font-semibold">
                <PartyPopper size={12} />
                Lots to clean!
              </div>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Found{" "}
            <span className="font-mono font-bold text-[var(--color-accent)] size-reveal">
              {formatSize(currentTotalSize)}
            </span>{" "}
            across {sortedCategories.length} {sortedCategories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        {navigationStack.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-text-muted)] rounded-[var(--radius-lg)]"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        )}
      </div>

      {/* Breadcrumbs */}
      <div className="mb-5">
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
      <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-2">
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
                isHighlighted={highlightedCategoryId === category.id}
                isDimmed={highlightedCategoryId !== null && highlightedCategoryId !== category.id}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Clean button - sticky footer */}
      {currentTotalSize > 0 && onClean && (
        <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
          <Button
            size="lg"
            onClick={() =>
              onClean(sortedCategories.map((c) => c.id))
            }
            className="w-full h-14 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] hover:from-[var(--color-accent-hover)] hover:to-[var(--color-accent)] text-white font-semibold rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-glow)] transition-all duration-300"
          >
            <Sparkles size={18} className="mr-2" />
            Free up {formatSize(currentTotalSize)}
            <Trash2 size={16} className="ml-2 opacity-70" />
          </Button>
          <p className="text-xs text-[var(--color-text-muted)] text-center mt-3 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            Items will be moved to Trash (you can restore them)
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
