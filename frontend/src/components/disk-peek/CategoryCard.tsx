import { ChevronRight } from "lucide-react";
import type { scanner } from "../../../wailsjs/go/models";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryCardProps {
  category: scanner.Category;
  index: number;
  totalSize: number;
  onClick?: () => void;
  onSelect?: (selected: boolean) => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

export function CategoryCard({
  category,
  index,
  totalSize,
  onClick,
  isHighlighted,
  isDimmed,
}: CategoryCardProps) {
  const percentage = totalSize > 0 ? (category.size / totalSize) * 100 : 0;
  const hasChildren = category.children && category.children.length > 0;
  const maxPercentage = 100; // For progress bar width calculation

  return (
    <button
      className={`
        category-card w-full text-left p-4
        bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]
        border border-[var(--color-border)] hover:border-[var(--color-text-muted)]/50
        rounded-[var(--radius-lg)]
        transition-all duration-200
        group cursor-pointer
        ${isHighlighted ? "bg-[var(--color-bg-hover)] border-[var(--color-text-muted)]/50 scale-[1.01]" : ""}
        ${isDimmed ? "opacity-50" : "opacity-100"}
      `}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Icon with color accent */}
        <div
          className={`
            w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0
            transition-transform duration-200
            ${isHighlighted ? "scale-110" : "group-hover:scale-105"}
          `}
          style={{ backgroundColor: `${category.color}20` }}
        >
          <CategoryIcon
            icon={category.icon}
            color={category.color}
            size={22}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--color-text)] truncate">
              {category.name}
            </h3>
            {hasChildren && (
              <ChevronRight
                size={16}
                className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all flex-shrink-0"
              />
            )}
          </div>
          {category.description && (
            <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
              {category.description}
            </p>
          )}

          {/* Progress bar inside card */}
          {category.size > 0 && (
            <div className="mt-2 h-1 rounded-full bg-[var(--color-bg)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(percentage / maxPercentage) * 100}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
          )}
        </div>

        {/* Size */}
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-sm font-semibold text-[var(--color-text)]">
            {formatSize(category.size)}
          </div>
          {percentage > 0.1 && (
            <div className="text-xs text-[var(--color-text-muted)]">
              {percentage.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </button>
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
