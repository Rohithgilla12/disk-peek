import { ChevronRight } from "lucide-react";
import type { scanner } from "../../../wailsjs/go/models";
import { CategoryIcon } from "./CategoryIcon";
import { motion } from "framer-motion";
import { springs } from "@/components/ui/motion";

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
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{
        opacity: isDimmed ? 0.5 : 1,
        y: 0,
        scale: isHighlighted ? 1.01 : 1,
      }}
      transition={{
        ...springs.smooth,
        delay: index * 0.04
      }}
      whileHover={{
        scale: 1.02,
        transition: springs.snappy
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      className={`
        w-full text-left p-4
        bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]
        border border-[var(--color-border)] hover:border-[var(--color-text-muted)]/50
        rounded-[var(--radius-lg)]
        group cursor-pointer
        ${isHighlighted ? "bg-[var(--color-bg-hover)] border-[var(--color-text-muted)]/50" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Icon with color accent */}
        <motion.div
          animate={{
            scale: isHighlighted ? 1.1 : 1
          }}
          transition={springs.snappy}
          className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <CategoryIcon
            icon={category.icon}
            color={category.color}
            size={22}
          />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--color-text)] truncate">
              {category.name}
            </h3>
            {hasChildren && (
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 2 }}
                className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors flex-shrink-0"
              >
                <ChevronRight size={16} />
              </motion.span>
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
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(percentage / maxPercentage) * 100}%` }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.04 + 0.2,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
          )}
        </div>

        {/* Size */}
        <div className="text-right flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              ...springs.bouncy,
              delay: index * 0.04 + 0.15
            }}
            className="font-mono text-sm font-semibold text-[var(--color-text)]"
          >
            {formatSize(category.size)}
          </motion.div>
          {percentage > 0.1 && (
            <div className="text-xs text-[var(--color-text-muted)]">
              {percentage.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </motion.button>
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
