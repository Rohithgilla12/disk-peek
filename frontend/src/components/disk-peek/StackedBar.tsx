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
      <div className="h-12 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center">
        <span className="text-sm text-[var(--color-text-muted)]">
          No data to display
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main stacked bar */}
      <div className="h-12 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] overflow-hidden flex">
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
              className="bar-segment relative group"
              style={{
                width: `${percentage}%`,
                backgroundColor: category.color,
                opacity: isOtherHighlighted ? 0.3 : 1,
                transform: isHighlighted ? "scaleY(1.08)" : "scaleY(1)",
                animationDelay: `${index * 50}ms`,
              }}
              onClick={() => onCategoryClick?.(category)}
              title={`${category.name}: ${formatSize(category.size)} (${percentage.toFixed(1)}%)`}
            >
              {/* Hover tooltip */}
              <div
                className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
                bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-sm)]
                text-xs font-medium whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-150
                shadow-[var(--shadow-lg)]
                z-10
              "
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
                <div className="text-[var(--color-text-secondary)] mt-0.5">
                  {formatSize(category.size)} ({percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {visibleCategories.slice(0, 8).map((category) => (
          <button
            key={category.id}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            onClick={() => onCategoryClick?.(category)}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="truncate max-w-[100px]">{category.name}</span>
          </button>
        ))}
        {visibleCategories.length > 8 && (
          <span className="text-xs text-[var(--color-text-muted)]">
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
