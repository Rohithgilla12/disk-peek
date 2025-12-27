import { useState, useMemo, useEffect } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { StackedBar } from "./StackedBar";
import { DonutChart } from "./DonutChart";
import { Treemap } from "./Treemap";
import { CategoryCard } from "./CategoryCard";
import { Breadcrumbs } from "./Breadcrumbs";
import { ArrowLeft, Trash2, Sparkles, PartyPopper, PieChart, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/components/ui/motion";

type ChartView = "donut" | "treemap";

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
  const [chartView, setChartView] = useState<ChartView>("donut");

  const currentLevel = navigationStack[navigationStack.length - 1];
  const isRootLevel = navigationStack.length === 1;

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

  const handleCategoryHover = (category: scanner.Category | null) => {
    setHighlightedCategoryId(category?.id || null);
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
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              {currentLevel.name}
            </h2>
            {isSignificant && isRootLevel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.bouncy, delay: 0.3 }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-success)]/15 text-[var(--color-success)] rounded-full text-xs font-semibold"
              >
                <PartyPopper size={12} />
                Lots to clean!
              </motion.div>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Found{" "}
            <span className="font-mono font-bold text-[var(--color-accent)]">
              {formatSize(currentTotalSize)}
            </span>{" "}
            across {sortedCategories.length} {sortedCategories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        {!isRootLevel && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.smooth}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-2 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-text-muted)] rounded-[var(--radius-lg)]"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Breadcrumbs */}
      <div className="mb-5">
        <Breadcrumbs
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>

      {/* Main content - Hero layout at root, simple layout when drilling */}
      {isRootLevel ? (
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Left side: Chart with toggle */}
          <motion.div
            className="flex-shrink-0 flex flex-col items-center justify-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.smooth, delay: 0.1 }}
          >
            {/* Chart View Toggle */}
            <div className="flex items-center gap-1 mb-4 p-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
              <button
                onClick={() => setChartView("donut")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all ${
                  chartView === "donut"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <PieChart size={12} />
                Donut
              </button>
              <button
                onClick={() => setChartView("treemap")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all ${
                  chartView === "treemap"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <LayoutGrid size={12} />
                Treemap
              </button>
            </div>

            {/* Chart Content */}
            <AnimatePresence mode="wait">
              {chartView === "donut" ? (
                <motion.div
                  key="donut"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={springs.snappy}
                >
                  <DonutChart
                    categories={sortedCategories}
                    totalSize={currentTotalSize}
                    size={260}
                    strokeWidth={28}
                    onCategoryHover={handleCategoryHover}
                    highlightedId={highlightedCategoryId}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="treemap"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={springs.snappy}
                  className="w-[280px]"
                >
                  <Treemap
                    categories={sortedCategories}
                    totalSize={currentTotalSize}
                    onCategoryClick={handleCategoryClick}
                    height={280}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stacked bar below chart */}
            <motion.div
              className="w-full mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.smooth, delay: 0.3 }}
            >
              <StackedBar
                categories={sortedCategories}
                totalSize={currentTotalSize}
                onCategoryClick={handleCategoryClick}
                highlightedId={highlightedCategoryId}
              />
            </motion.div>
          </motion.div>

          {/* Right side: Category list */}
          <div className="flex-1 flex flex-col min-h-0">
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

            {/* Clean button */}
            {currentTotalSize > 0 && onClean && (
              <motion.div
                className="mt-6 pt-5 border-t border-[var(--color-border)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.smooth, delay: 0.4 }}
              >
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
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        /* Sub-level layout - no donut chart */
        <>
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
        </>
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
