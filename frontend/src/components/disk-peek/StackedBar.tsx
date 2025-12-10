import { useMemo } from "react";
import type { scanner } from "../../../wailsjs/go/models";

interface StackedBarProps {
  categories: scanner.Category[];
  totalSize: number;
  onCategoryClick?: (category: scanner.Category) => void;
  highlightedId?: string | null;
}

export function StackedBar({
  categories,
  totalSize,
  onCategoryClick,
  highlightedId,
}: StackedBarProps) {
  // Filter out zero-size categories and sort by size
  const visibleCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [categories]);

  if (totalSize === 0) {
    return (
      <div className="h-8 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
        <span className="text-sm text-[var(--color-text-muted)]">
          No data to display
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main stacked bar */}
      <div className="h-8 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)]/50 overflow-hidden flex">
        {visibleCategories.map((category, index) => {
          const percentage = (category.size / totalSize) * 100;
          // Don't render segments smaller than 0.5%
          if (percentage < 0.5) return null;

          const isHighlighted = highlightedId === category.id;
          const isOtherHighlighted =
            highlightedId && highlightedId !== category.id;

          return (
            <div
              key={category.id}
              className="bar-segment relative group first:rounded-l-[var(--radius-md)] last:rounded-r-[var(--radius-md)]"
              style={{
                width: `${percentage}%`,
                background: `linear-gradient(180deg, ${category.color} 0%, ${category.color}dd 100%)`,
                opacity: isOtherHighlighted ? 0.3 : 1,
                transform: isHighlighted ? "scaleY(1.15)" : "scaleY(1)",
                animationDelay: `${index * 50}ms`,
                zIndex: isHighlighted ? 10 : 1,
              }}
              onClick={() => onCategoryClick?.(category)}
              title={`${category.name}: ${formatSize(category.size)} (${percentage.toFixed(1)}%)`}
            >
              {/* Hover tooltip */}
              <div
                className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2
                  bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)]
                  text-xs font-medium whitespace-nowrap
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-all duration-200
                  shadow-[var(--shadow-lg)]
                  z-50
                "
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-[var(--color-text)]">{category.name}</span>
                </div>
                <div className="text-[var(--color-text-secondary)] mt-1">
                  {formatSize(category.size)} ({percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {visibleCategories.slice(0, 8).map((category) => {
          const isHighlighted = highlightedId === category.id;
          const isOtherHighlighted =
            highlightedId && highlightedId !== category.id;

          return (
            <button
              key={category.id}
              className={`
                flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-full
                transition-all duration-200
                ${isHighlighted
                  ? "bg-[var(--color-bg-hover)] text-[var(--color-text)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
                }
                ${isOtherHighlighted ? "opacity-40" : "opacity-100"}
              `}
              onClick={() => onCategoryClick?.(category)}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="truncate max-w-[100px]">{category.name}</span>
            </button>
          );
        })}
        {visibleCategories.length > 8 && (
          <span className="text-xs text-[var(--color-text-muted)] px-2 py-1.5">
            +{visibleCategories.length - 8} more
          </span>
        )}
      </div>
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
