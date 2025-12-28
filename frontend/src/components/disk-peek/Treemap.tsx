import { useMemo, useState } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { Treemap as RechartsTreemap, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { springs } from "@/components/ui/motion";
import { formatSize } from "@/lib/formatters";

interface TreemapProps {
  categories: scanner.Category[];
  totalSize: number;
  onCategoryClick?: (category: scanner.Category) => void;
  height?: number;
}

interface TreemapNode {
  name: string;
  size: number;
  originalCategory: scanner.Category;
  color: string;
  children?: TreemapNode[];
}

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  size: number;
  color: string;
  originalCategory: scanner.Category;
}

interface TreemapTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TreemapNode }>;
}

// Premium color palette
const COLORS = [
  "hsl(220, 90%, 56%)",  // Vivid blue
  "hsl(280, 85%, 60%)",  // Purple
  "hsl(340, 85%, 58%)",  // Pink
  "hsl(25, 95%, 55%)",   // Orange
  "hsl(160, 80%, 45%)",  // Teal
  "hsl(45, 95%, 50%)",   // Gold
  "hsl(190, 90%, 50%)",  // Cyan
  "hsl(0, 85%, 60%)",    // Red
  "hsl(120, 60%, 50%)",  // Green
  "hsl(260, 75%, 65%)",  // Lavender
];

export function Treemap({ categories, totalSize, onCategoryClick, height = 300 }: TreemapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const data = useMemo(() => {
    return categories.map((cat, index) => ({
      name: cat.name,
      size: cat.size,
      originalCategory: cat,
      color: COLORS[index % COLORS.length],
    }));
  }, [categories]);

  const CustomContent = (props: TreemapContentProps) => {
    const { x, y, width, height, name, color, originalCategory } = props;

    if (width < 30 || height < 30) return null;

    const isHovered = hoveredNode === name;
    const fontSize = Math.min(14, Math.max(10, Math.min(width, height) / 8));
    const showSize = width > 60 && height > 45;

    return (
      <g>
        <motion.rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={6}
          fill={color}
          fillOpacity={isHovered ? 1 : 0.85}
          stroke="var(--color-bg)"
          strokeWidth={2}
          style={{ cursor: originalCategory?.children?.length ? "pointer" : "default" }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.smooth}
          onMouseEnter={() => setHoveredNode(name)}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={() => {
            if (onCategoryClick && originalCategory) {
              onCategoryClick(originalCategory);
            }
          }}
        />
        {width > 40 && height > 25 && (
          <text
            x={x + width / 2}
            y={y + height / 2 - (showSize ? 6 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={fontSize}
            fontWeight={600}
            style={{
              pointerEvents: "none",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {name.length > Math.floor(width / 8)
              ? name.slice(0, Math.floor(width / 8)) + "…"
              : name
            }
          </text>
        )}
        {showSize && (
          <text
            x={x + width / 2}
            y={y + height / 2 + fontSize}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize={fontSize - 2}
            style={{ pointerEvents: "none" }}
          >
            {formatSize(props.size)}
          </text>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: TreemapTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const percentage = totalSize > 0 ? ((data.size / totalSize) * 100).toFixed(1) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium text-[var(--color-text)]">{data.name}</span>
        </div>
        <div className="text-sm text-[var(--color-text-muted)]">
          <span className="font-mono font-bold text-[var(--color-accent)]">
            {formatSize(data.size)}
          </span>
          <span className="mx-1">•</span>
          <span>{percentage}%</span>
        </div>
        {data.originalCategory?.children?.length > 0 && (
          <div className="text-xs text-[var(--color-text-muted)] mt-1.5 pt-1.5 border-t border-[var(--color-border)]">
            Click to explore {data.originalCategory.children.length} sub-categories
          </div>
        )}
      </motion.div>
    );
  };

  if (categories.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)]"
        style={{ height }}
      >
        <p className="text-[var(--color-text-muted)]">No data to display</p>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.smooth}
    >
      <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Space Distribution</h3>
      <ResponsiveContainer width="100%" height={height - 50}>
        <RechartsTreemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="var(--color-bg)"
          content={<CustomContent />}
          animationDuration={800}
          animationEasing="ease-out"
        >
          <Tooltip content={<CustomTooltip />} />
        </RechartsTreemap>
      </ResponsiveContainer>
    </motion.div>
  );
}
