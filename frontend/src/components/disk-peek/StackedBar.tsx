import { useMemo } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { motion } from "framer-motion";
import { springs } from "@/components/ui/motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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
      <div className="h-10 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center glass-subtle">
        <span className="text-sm text-[var(--color-text-muted)]">
          No data to display
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main stacked bar */}
      <div className="h-10 rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)]/50 overflow-hidden flex shadow-inner border border-[var(--color-border)]/30">
        {visibleCategories.map((category, index) => {
          const percentage = (category.size / totalSize) * 100;
          // Don't render segments smaller than 0.5%
          if (percentage < 0.5) return null;

          const isHighlighted = highlightedId === category.id;
          const isOtherHighlighted =
            highlightedId && highlightedId !== category.id;

          return (
            <Tooltip key={category.id}>
              <TooltipTrigger asChild>
                <motion.div
                  className="relative cursor-pointer first:rounded-l-[var(--radius-md)] last:rounded-r-[var(--radius-md)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${percentage}%`,
                    opacity: isOtherHighlighted ? 0.3 : 1,
                    scaleY: isHighlighted ? 1.1 : 1,
                  }}
                  transition={{
                    width: { duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] },
                    opacity: springs.snappy,
                    scaleY: springs.snappy
                  }}
                  whileHover={{
                    scaleY: 1.15,
                    filter: "brightness(1.1)",
                    zIndex: 10,
                  }}
                  whileTap={{ scaleY: 0.95 }}
                  style={{
                    background: `linear-gradient(180deg, ${category.color} 0%, ${category.color}cc 100%)`,
                    zIndex: isHighlighted ? 10 : 1,
                  }}
                  onClick={() => onCategoryClick?.(category)}
                >
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                    }}
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass-strong">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-[var(--color-text)]">{category.name}</span>
                </div>
                <div className="text-[var(--color-text-secondary)]">
                  {formatSize(category.size)} ({percentage.toFixed(1)}%)
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Legend */}
      <motion.div
        className="flex flex-wrap gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: 0.3 }
          }
        }}
      >
        {visibleCategories.slice(0, 8).map((category) => {
          const percentage = (category.size / totalSize) * 100;
          const isHighlighted = highlightedId === category.id;
          const isOtherHighlighted =
            highlightedId && highlightedId !== category.id;

          return (
            <motion.button
              key={category.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={springs.smooth}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-2 text-xs px-3 py-1.5 rounded-full
                transition-colors duration-200 border
                ${isHighlighted
                  ? "bg-[var(--color-bg-hover)] text-[var(--color-text)] border-[var(--color-text-muted)]/30"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] border-transparent"
                }
                ${isOtherHighlighted ? "opacity-40" : "opacity-100"}
              `}
              onClick={() => onCategoryClick?.(category)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: category.color,
                  boxShadow: isHighlighted ? `0 0 8px ${category.color}60` : undefined
                }}
              />
              <span className="truncate max-w-[100px] font-medium">{category.name}</span>
              <span className="text-[var(--color-text-muted)] font-mono text-[10px]">
                {percentage.toFixed(0)}%
              </span>
            </motion.button>
          );
        })}
        {visibleCategories.length > 8 && (
          <Badge variant="ghost" className="text-xs">
            +{visibleCategories.length - 8} more
          </Badge>
        )}
      </motion.div>
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
