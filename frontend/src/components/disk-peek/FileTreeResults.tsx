import { useState, useMemo, useCallback } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { Breadcrumbs } from "./Breadcrumbs";
import { ArrowLeft, Folder, File, ChevronRight, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetDirectoryChildren } from "../../../wailsjs/go/main/App";

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

interface FileTreeResultsProps {
  result: scanner.FullScanResult;
}

// Color palette for files/folders based on their relative size
const SIZE_COLORS = [
  "#ef4444", // red - largest
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet - smallest
];

function getColorForPercentage(percentage: number): string {
  // Map percentage to color index (higher percentage = warmer color)
  const index = Math.min(
    Math.floor((100 - percentage) / 10),
    SIZE_COLORS.length - 1
  );
  return SIZE_COLORS[Math.max(0, index)];
}

export function FileTreeResults({ result }: FileTreeResultsProps) {
  const [navigationStack, setNavigationStack] = useState<BreadcrumbItem[]>([
    { id: "root", name: result.root?.name || "Home", path: result.root?.path || "" },
  ]);
  const [currentChildren, setCurrentChildren] = useState<scanner.FileNode[]>(
    result.root?.children || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const currentLevel = navigationStack[navigationStack.length - 1];

  // Calculate total size for current level
  const currentTotalSize = useMemo(() => {
    return currentChildren.reduce((sum, node) => sum + node.size, 0);
  }, [currentChildren]);

  // Sort children by size (already sorted from backend, but ensure it)
  const sortedChildren = useMemo(() => {
    return [...currentChildren].sort((a, b) => b.size - a.size);
  }, [currentChildren]);

  const handleNodeClick = useCallback(async (node: scanner.FileNode) => {
    if (!node.isDir) return;

    setIsLoading(true);
    try {
      const children = await GetDirectoryChildren(node.path);
      setCurrentChildren(children || []);
      setNavigationStack((prev) => [
        ...prev,
        { id: node.path, name: node.name, path: node.path },
      ]);
    } catch (error) {
      console.error("Failed to load directory:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBreadcrumbNavigate = useCallback(async (index: number) => {
    const target = navigationStack[index];
    if (index === 0) {
      // Go back to root
      setCurrentChildren(result.root?.children || []);
    } else {
      setIsLoading(true);
      try {
        const children = await GetDirectoryChildren(target.path);
        setCurrentChildren(children || []);
      } catch (error) {
        console.error("Failed to load directory:", error);
      } finally {
        setIsLoading(false);
      }
    }
    setNavigationStack((prev) => prev.slice(0, index + 1));
  }, [navigationStack, result.root]);

  const handleBack = useCallback(async () => {
    if (navigationStack.length > 1) {
      const parentIndex = navigationStack.length - 2;
      await handleBreadcrumbNavigate(parentIndex);
    }
  }, [navigationStack, handleBreadcrumbNavigate]);

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
            total across {sortedChildren.length} items
          </p>
        </div>

        {navigationStack.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2"
            disabled={isLoading}
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

      {/* Stacked bar for current directory */}
      <div className="mb-6">
        <FileStackedBar
          nodes={sortedChildren}
          totalSize={currentTotalSize}
          onNodeClick={handleNodeClick}
          highlightedPath={highlightedId}
        />
      </div>

      {/* File/folder grid */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
          </div>
        ) : sortedChildren.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
            <Folder size={48} className="mb-4 opacity-50" />
            <p>This directory is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sortedChildren.map((node, index) => (
              <div
                key={node.path}
                onMouseEnter={() => setHighlightedId(node.path)}
                onMouseLeave={() => setHighlightedId(null)}
              >
                <FileNodeCard
                  node={node}
                  index={index}
                  totalSize={currentTotalSize}
                  onClick={() => handleNodeClick(node)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stacked bar component for files/folders
interface FileStackedBarProps {
  nodes: scanner.FileNode[];
  totalSize: number;
  onNodeClick?: (node: scanner.FileNode) => void;
  highlightedPath?: string | null;
}

function FileStackedBar({
  nodes,
  totalSize,
  onNodeClick,
  highlightedPath,
}: FileStackedBarProps) {
  if (totalSize === 0) return null;

  // Show top 10 items in the bar
  const topNodes = nodes.slice(0, 10);
  const otherSize = nodes.slice(10).reduce((sum, n) => sum + n.size, 0);

  return (
    <div className="h-8 rounded-[var(--radius-md)] overflow-hidden flex bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      {topNodes.map((node, index) => {
        const percentage = (node.size / totalSize) * 100;
        if (percentage < 0.5) return null;

        const color = getColorForPercentage(percentage);
        const isHighlighted = highlightedPath === node.path;

        return (
          <button
            key={node.path}
            className={`
              h-full transition-all duration-200 relative group
              ${isHighlighted ? "opacity-100 z-10" : "opacity-80 hover:opacity-100"}
              ${node.isDir ? "cursor-pointer" : "cursor-default"}
            `}
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              transform: isHighlighted ? "scaleY(1.1)" : "scaleY(1)",
            }}
            onClick={() => node.isDir && onNodeClick?.(node)}
            title={`${node.name}: ${formatSize(node.size)} (${percentage.toFixed(1)}%)`}
          >
            {percentage > 8 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white truncate px-1">
                {node.name}
              </span>
            )}
          </button>
        );
      })}
      {otherSize > 0 && (
        <div
          className="h-full bg-[var(--color-text-muted)] opacity-40"
          style={{ width: `${(otherSize / totalSize) * 100}%` }}
          title={`Other: ${formatSize(otherSize)}`}
        />
      )}
    </div>
  );
}

// File/folder card component
interface FileNodeCardProps {
  node: scanner.FileNode;
  index: number;
  totalSize: number;
  onClick?: () => void;
}

function FileNodeCard({ node, index, totalSize, onClick }: FileNodeCardProps) {
  const percentage = totalSize > 0 ? (node.size / totalSize) * 100 : 0;
  const color = getColorForPercentage(percentage);

  return (
    <button
      className={`
        category-card w-full text-left p-4
        bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]
        border border-[var(--color-border)] hover:border-[var(--color-text-muted)]
        rounded-[var(--radius-lg)]
        transition-all duration-200
        group
        ${node.isDir ? "cursor-pointer" : "cursor-default"}
      `}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={node.isDir ? onClick : undefined}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          {node.isDir ? (
            <Folder size={20} style={{ color }} />
          ) : (
            <File size={20} style={{ color }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--color-text)] truncate">
              {node.name}
            </h3>
            {node.isDir && (
              <ChevronRight
                size={16}
                className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all flex-shrink-0"
              />
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
            {node.isDir ? "Folder" : "File"}
          </p>
        </div>

        {/* Size */}
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-sm font-semibold text-[var(--color-text)]">
            {formatSize(node.size)}
          </div>
          {percentage > 0.1 && (
            <div className="text-xs text-[var(--color-text-muted)]">
              {percentage.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Mini progress bar */}
      {node.size > 0 && (
        <div className="mt-3 h-1 rounded-full bg-[var(--color-bg)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(percentage, 1)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      )}
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
