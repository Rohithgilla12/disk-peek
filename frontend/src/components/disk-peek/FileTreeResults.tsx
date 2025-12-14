import { useState, useMemo, useCallback } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { Breadcrumbs } from "./Breadcrumbs";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ArrowLeft, Folder, File, ChevronRight, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetDirectoryChildren, DeletePath } from "../../../wailsjs/go/main/App";

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

interface FileTreeResultsProps {
  result: scanner.FullScanResult;
}

// Warmer color palette for files/folders based on their relative size
const SIZE_COLORS = [
  "#ff7f6e", // coral - largest
  "#ff9966", // peach
  "#ffab70", // light orange
  "#f5c45e", // warm yellow
  "#a8d08d", // sage green
  "#7dd3a8", // mint
  "#6ecfcf", // teal
  "#7dc3e8", // sky blue
  "#a78bfa", // lavender
  "#c4b5fd", // light purple - smallest
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
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<scanner.FileNode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Open delete confirmation dialog
  const handleDeleteClick = useCallback((node: scanner.FileNode, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering folder navigation
    setNodeToDelete(node);
    setDeleteDialogOpen(true);
  }, []);

  // Refresh current directory after deletion
  const refreshCurrentDirectory = useCallback(async () => {
    if (navigationStack.length === 1) {
      // At root - we need to filter out the deleted item from current children
      // Since we can't re-scan from here, just filter local state
      if (nodeToDelete) {
        setCurrentChildren(prev => prev.filter(n => n.path !== nodeToDelete.path));
      }
    } else {
      // In a subdirectory - reload from backend
      const currentPath = currentLevel.path;
      try {
        const children = await GetDirectoryChildren(currentPath);
        setCurrentChildren(children || []);
      } catch (error) {
        console.error("Failed to refresh directory:", error);
      }
    }
  }, [navigationStack.length, currentLevel.path, nodeToDelete]);

  // Handle trash deletion
  const handleTrash = useCallback(async () => {
    if (!nodeToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await DeletePath(nodeToDelete.path, false);
      if (result.deletedPaths.length > 0) {
        await refreshCurrentDirectory();
      }
    } catch (error) {
      console.error("Failed to move to trash:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setNodeToDelete(null);
    }
  }, [nodeToDelete, refreshCurrentDirectory]);

  // Handle permanent deletion
  const handlePermanentDelete = useCallback(async () => {
    if (!nodeToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await DeletePath(nodeToDelete.path, true);
      if (result.deletedPaths.length > 0) {
        await refreshCurrentDirectory();
      }
    } catch (error) {
      console.error("Failed to delete permanently:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setNodeToDelete(null);
    }
  }, [nodeToDelete, refreshCurrentDirectory]);

  const breadcrumbItems = navigationStack.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header with total size */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">
            {currentLevel.name}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-mono font-bold text-[var(--color-accent)] size-reveal">
              {formatSize(currentTotalSize)}
            </span>{" "}
            in {sortedChildren.length} {sortedChildren.length === 1 ? "item" : "items"}
          </p>
        </div>

        {navigationStack.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-text-muted)] rounded-[var(--radius-lg)]"
            disabled={isLoading}
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
      <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-4">
              <Loader2 size={28} className="text-[var(--color-accent)] animate-spin" />
            </div>
            <p className="text-[var(--color-text-muted)]">Loading folder...</p>
          </div>
        ) : sortedChildren.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <div className="w-20 h-20 rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-4">
              <FolderOpen size={36} className="text-[var(--color-text-muted)]" />
            </div>
            <p className="text-base font-medium text-[var(--color-text-secondary)]">This folder is empty</p>
            <p className="text-sm mt-1">Nothing to see here</p>
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
                  onDelete={(e) => handleDeleteClick(node, e)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {nodeToDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemName={nodeToDelete.name}
          itemPath={nodeToDelete.path}
          itemSize={nodeToDelete.size}
          isDirectory={nodeToDelete.isDir}
          onTrash={handleTrash}
          onPermanentDelete={handlePermanentDelete}
          isDeleting={isDeleting}
        />
      )}
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
    <div className="h-12 rounded-[var(--radius-xl)] overflow-hidden flex bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
      {topNodes.map((node, index) => {
        const percentage = (node.size / totalSize) * 100;
        if (percentage < 0.5) return null;

        const color = getColorForPercentage(percentage);
        const isHighlighted = highlightedPath === node.path;

        return (
          <button
            key={node.path}
            className={`
              h-full transition-all duration-300 ease-out relative group
              first:rounded-l-[var(--radius-lg)] last:rounded-r-[var(--radius-lg)]
              ${isHighlighted ? "z-10" : ""}
              ${node.isDir ? "cursor-pointer" : "cursor-default"}
            `}
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`,
              opacity: highlightedPath && !isHighlighted ? 0.3 : 1,
              transform: isHighlighted ? "scaleY(1.15)" : "scaleY(1)",
            }}
            onClick={() => node.isDir && onNodeClick?.(node)}
            title={`${node.name}: ${formatSize(node.size)} (${percentage.toFixed(1)}%)`}
          >
            {percentage > 10 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white truncate px-2 drop-shadow">
                {node.name}
              </span>
            )}

            {/* Hover tooltip */}
            <div
              className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2.5
                bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)]
                text-sm whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-all duration-200 ease-out
                shadow-[var(--shadow-lg)]
                z-20
                group-hover:translate-y-[-4px]
              "
            >
              <div className="flex items-center gap-2.5">
                {node.isDir ? (
                  <Folder size={14} style={{ color }} />
                ) : (
                  <File size={14} style={{ color }} />
                )}
                <span className="text-[var(--color-text)] font-semibold">{node.name}</span>
              </div>
              <div className="text-[var(--color-text-secondary)] mt-1 text-xs">
                {formatSize(node.size)} ({percentage.toFixed(1)}%)
              </div>
            </div>
          </button>
        );
      })}
      {otherSize > 0 && (
        <div
          className="h-full bg-[var(--color-text-muted)]/30 last:rounded-r-[var(--radius-lg)]"
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
  onDelete?: (e: React.MouseEvent) => void;
}

function FileNodeCard({ node, index, totalSize, onClick, onDelete }: FileNodeCardProps) {
  const percentage = totalSize > 0 ? (node.size / totalSize) * 100 : 0;
  const color = getColorForPercentage(percentage);

  return (
    <div
      className={`
        category-card w-full text-left p-5
        bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]
        border border-[var(--color-border)] hover:border-[var(--color-text-muted)]/50
        rounded-[var(--radius-xl)]
        transition-all duration-300 ease-out
        group
        hover:shadow-[var(--shadow-md)]
        hover:translate-y-[-2px]
        ${node.isDir ? "cursor-pointer" : "cursor-default"}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={node.isDir ? onClick : undefined}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${color}25` }}
        >
          {node.isDir ? (
            <Folder size={24} style={{ color }} />
          ) : (
            <File size={24} style={{ color }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--color-text)] truncate text-base">
              {node.name}
            </h3>
            {node.isDir && (
              <ChevronRight
                size={18}
                className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all flex-shrink-0"
              />
            )}
          </div>
          <p className="text-sm text-[var(--color-text-muted)] truncate mt-0.5">
            {node.isDir ? "Folder" : "File"}
          </p>
        </div>

        {/* Size and Delete button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Delete button - shows on hover */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)] transition-all duration-200 hover:scale-110"
              title={`Delete ${node.name}`}
            >
              <Trash2 size={16} />
            </button>
          )}
          
          {/* Size */}
          <div className="text-right">
            <div className="font-mono text-base font-bold text-[var(--color-text)]">
              {formatSize(node.size)}
            </div>
            {percentage > 0.1 && (
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {percentage.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {node.size > 0 && (
        <div className="mt-4 h-2 rounded-full bg-[var(--color-bg)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(percentage, 2)}%`,
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            }}
          />
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
