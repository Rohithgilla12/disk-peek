import { useState } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Search, Loader2, Check, ChevronDown, ChevronRight, File, Clock } from "lucide-react";

interface DuplicatesViewProps {
  state: "idle" | "scanning" | "completed" | "error";
  result: scanner.DuplicatesResult | null;
  error: string | null;
  onScan: () => void;
  onDeleteGroup: (group: scanner.DuplicateGroup, keepIndex: number) => void;
  onReset: () => void;
}

export function DuplicatesView({ state, result, error, onScan, onDeleteGroup, onReset }: DuplicatesViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [selectedKeepIndex, setSelectedKeepIndex] = useState<Record<string, number>>({});

  const toggleGroup = (hash: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  };

  const handleDeleteGroup = async (group: scanner.DuplicateGroup) => {
    const keepIndex = selectedKeepIndex[group.hash] ?? 0;
    setDeletingGroup(group.hash);
    try {
      await onDeleteGroup(group, keepIndex);
    } finally {
      setDeletingGroup(null);
    }
  };

  if (state === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-20 h-20 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 flex items-center justify-center mb-6">
          <Copy size={40} className="text-[var(--color-accent)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Find Duplicate Files</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center max-w-md">
          Identify duplicate files by comparing their contents.
          Free up space by removing unnecessary copies.
        </p>

        <Button
          size="lg"
          onClick={onScan}
          className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] hover:from-[var(--color-accent-hover)] hover:to-[var(--color-accent)] text-white font-semibold rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]"
        >
          <Search size={18} className="mr-2" />
          Find Duplicates
        </Button>

        <p className="text-xs text-[var(--color-text-muted)] mt-4 text-center max-w-sm">
          This may take a while depending on the number of files.
          Uses content hashing for accurate detection.
        </p>
      </div>
    );
  }

  if (state === "scanning") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[var(--color-bg-elevated)] border-t-[var(--color-accent)] animate-spin" />
          <Copy size={32} className="text-[var(--color-accent)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Finding duplicates...</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Analyzing file contents</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/20 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Error</h2>
        <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>
        <Button variant="outline" onClick={onReset}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!result || result.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No Duplicates Found</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Your files are unique! No duplicate content was detected.
        </p>
        <Button variant="outline" onClick={onReset}>
          Scan Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">Duplicate Files</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Found{" "}
            <span className="font-mono font-bold text-[var(--color-accent)]">
              {formatSize(result.totalWasted)}
            </span>{" "}
            of wasted space in {result.totalGroups} {result.totalGroups === 1 ? "group" : "groups"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] rounded-[var(--radius-lg)]"
        >
          Scan Again
        </Button>
      </div>

      {/* Duplicate groups */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        <div className="space-y-3">
          {result.groups.map((group, groupIndex) => {
            const isExpanded = expandedGroups.has(group.hash);
            const keepIndex = selectedKeepIndex[group.hash] ?? 0;

            return (
              <div
                key={group.hash}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden"
                style={{ animationDelay: `${groupIndex * 50}ms` }}
              >
                {/* Group header */}
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                  onClick={() => toggleGroup(group.hash)}
                >
                  <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-[var(--color-accent)]" />
                    ) : (
                      <ChevronRight size={18} className="text-[var(--color-accent)]" />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">
                        {group.files.length} identical files
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full">
                        {formatSize(group.size)} each
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      Hash: {group.hash.substring(0, 16)}...
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-semibold text-[var(--color-danger)]">
                      -{formatSize(group.wastedSize)}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">wasted</div>
                  </div>
                </button>

                {/* Expanded file list */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-bg)]/50">
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">
                      Select which file to keep, then delete the rest:
                    </p>
                    <div className="space-y-2">
                      {group.files.map((file, fileIndex) => (
                        <div
                          key={file.path}
                          className={`flex items-center gap-2 p-2 rounded-[var(--radius-md)] cursor-pointer transition-all ${
                            fileIndex === keepIndex
                              ? "bg-[var(--color-success)]/10 border border-[var(--color-success)]/30"
                              : "hover:bg-[var(--color-bg-hover)] border border-transparent"
                          }`}
                          onClick={() => setSelectedKeepIndex((prev) => ({ ...prev, [group.hash]: fileIndex }))}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              fileIndex === keepIndex
                                ? "bg-[var(--color-success)] text-white"
                                : "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
                            }`}
                          >
                            {fileIndex === keepIndex && <Check size={12} />}
                          </div>
                          <File size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--color-text)] truncate">{file.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)] truncate">{file.path}</p>
                          </div>
                          {file.modTime && (
                            <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] flex-shrink-0">
                              <Clock size={10} />
                              {formatDate(file.modTime)}
                            </div>
                          )}
                          {fileIndex === keepIndex && (
                            <span className="text-xs px-2 py-0.5 bg-[var(--color-success)]/20 text-[var(--color-success)] rounded-full flex-shrink-0">
                              Keep
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteGroup(group)}
                        disabled={deletingGroup === group.hash}
                        className="bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90"
                      >
                        {deletingGroup === group.hash ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                          <Trash2 size={14} className="mr-2" />
                        )}
                        Delete {group.files.length - 1} duplicate{group.files.length > 2 ? "s" : ""}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Duration footer */}
      {result.scanDuration > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center">
          <span className="text-xs text-[var(--color-text-muted)]">
            Scan completed in {formatDuration(result.scanDuration)}
          </span>
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

function formatDuration(nanoseconds: number): string {
  const ms = nanoseconds / 1_000_000;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
