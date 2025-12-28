import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/components/ui/motion";
import { formatSize } from "@/lib/formatters";
import type { scanner } from "../../../wailsjs/go/models";

interface DonutChartProps {
  categories: scanner.Category[];
  totalSize: number;
  size?: number;
  strokeWidth?: number;
  onCategoryHover?: (category: scanner.Category | null) => void;
  highlightedId?: string | null;
}

export function DonutChart({
  categories,
  totalSize,
  size = 280,
  strokeWidth = 32,
  onCategoryHover,
  highlightedId,
}: DonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter and sort categories
  const visibleCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [categories]);

  // Calculate chart dimensions
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segments
  const segments = useMemo(() => {
    let currentAngle = -90; // Start from top
    return visibleCategories.map((category) => {
      const percentage = (category.size / totalSize) * 100;
      const angle = (percentage / 100) * 360;
      const segment = {
        category,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        strokeDasharray: `${(percentage / 100) * circumference} ${circumference}`,
        strokeDashoffset: -((currentAngle + 90) / 360) * circumference,
      };
      currentAngle += angle;
      return segment;
    });
  }, [visibleCategories, totalSize, circumference]);

  const activeId = highlightedId || hoveredId;
  const activeCategory = activeId
    ? visibleCategories.find((c) => c.id === activeId)
    : null;

  const handleHover = (category: scanner.Category | null) => {
    setHoveredId(category?.id || null);
    onCategoryHover?.(category);
  };

  if (totalSize === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-[var(--color-text-muted)]">No data</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-bg-elevated)"
          strokeWidth={strokeWidth}
          className="opacity-50"
        />
      </svg>

      {/* Segments */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: "rotate(-90deg)" }}
      >
        {segments.map((segment, index) => {
          const isActive = activeId === segment.category.id;
          const isOtherActive = activeId && activeId !== segment.category.id;

          return (
            <motion.circle
              key={segment.category.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.category.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{
                strokeDasharray: `0 ${circumference}`,
                opacity: 0,
              }}
              animate={{
                strokeDasharray: segment.strokeDasharray,
                strokeDashoffset: segment.strokeDashoffset,
                opacity: isOtherActive ? 0.3 : 1,
                strokeWidth: isActive ? strokeWidth + 4 : strokeWidth,
              }}
              transition={{
                strokeDasharray: {
                  duration: 0.8,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                },
                strokeDashoffset: {
                  duration: 0.8,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                },
                opacity: springs.snappy,
                strokeWidth: springs.snappy,
              }}
              className="cursor-pointer drop-shadow-sm"
              style={{
                filter: isActive ? `drop-shadow(0 0 8px ${segment.category.color}60)` : undefined,
              }}
              onMouseEnter={() => handleHover(segment.category)}
              onMouseLeave={() => handleHover(null)}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <AnimatePresence mode="wait">
            {activeCategory ? (
              <motion.div
                key={activeCategory.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: activeCategory.color }}
                />
                <span className="text-xs text-[var(--color-text-muted)] mb-1">
                  {activeCategory.name}
                </span>
                <span className="text-2xl font-bold text-[var(--color-text)] font-mono">
                  {formatSize(activeCategory.size)}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {((activeCategory.size / totalSize) * 100).toFixed(1)}%
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center"
              >
                <span className="text-xs text-[var(--color-text-muted)] mb-1">
                  Total Size
                </span>
                <motion.span
                  className="text-3xl font-bold text-[var(--color-text)] font-mono"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, ...springs.smooth }}
                >
                  {formatSize(totalSize)}
                </motion.span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {visibleCategories.length} categories
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, transparent 60%, var(--color-bg) 100%)`,
        }}
      />
    </div>
  );
}
