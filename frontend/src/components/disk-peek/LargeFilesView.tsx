import { useState } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { FileBox, Trash2, Search, Loader2, FolderOpen, File, Clock } from "lucide-react";
import { DeletePath } from "../../../wailsjs/go/main/App";

interface Progress {
  scanned: number;
  current: string;
}

interface LargeFilesViewProps {
  state: "idle" | "scanning" | "completed" | "error";
  result: scanner.LargeFilesResult | null;
  error: string | null;
  progress: Progress | null;
  onScan: (minSizeMB?: number) => void;
  onReset: () => void;
}

export function LargeFilesView({ state, result, error, progress, onScan, onReset }: LargeFilesViewProps) {
  const [minSizeMB, setMinSizeMB] = useState(100);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deletedPaths, setDeletedPaths] = useState<Set<string>>(new Set());

  const handleDelete = async (path: string) => {
    try {
      setDeletingPath(path);
      await DeletePath(path, false); // Move to trash
      setDeletedPaths((prev) => new Set([...prev, path]));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingPath(null);
    }
  };

  // Filter out deleted files (handle null/undefined files array)
  const visibleFiles = (result?.files ?? []).filter((f) => !deletedPaths.has(f.path));

  if (state === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-20 h-20 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-warning)]/20 to-[var(--color-warning)]/5 flex items-center justify-center mb-6">
          <FileBox size={40} className="text-[var(--color-warning)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Find Large Files</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center max-w-md">
          Discover files and folders taking up the most space on your disk.
        </p>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm text-[var(--color-text-secondary)]">Minimum size:</label>
          <select
            value={minSizeMB}
            onChange={(e) => setMinSizeMB(Number(e.target.value))}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value={50}>50 MB</option>
            <option value={100}>100 MB</option>
            <option value={250}>250 MB</option>
            <option value={500}>500 MB</option>
            <option value={1000}>1 GB</option>
          </select>
        </div>

        <Button
          size="lg"
          onClick={() => onScan(minSizeMB)}
          className="bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-warning)]/80 hover:from-[var(--color-warning)]/90 hover:to-[var(--color-warning)]/70 text-white font-semibold rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]"
        >
          <Search size={18} className="mr-2" />
          Find Large Files
        </Button>
      </div>
    );
  }

  if (state === "scanning") {
    const currentPath = progress?.current || "";
    const shortPath = currentPath.length > 50
      ? "..." + currentPath.slice(-47)
      : currentPath;

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[var(--color-bg-elevated)] border-t-[var(--color-warning)] animate-spin" />
          <FileBox size={32} className="text-[var(--color-warning)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Scanning for large files...</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">Looking for files larger than {minSizeMB} MB</p>
        {progress && (
          <div className="text-center max-w-md">
            <p className="text-sm font-mono text-[var(--color-warning)] mb-1">
              {progress.scanned.toLocaleString()} files scanned
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate" title={currentPath}>
              {shortPath}
            </p>
          </div>
        )}
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

  if (!result || visibleFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No Large Files Found</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          No files larger than {formatSize(result?.threshold || minSizeMB * 1024 * 1024)} were found.
        </p>
        <Button variant="outline" onClick={onReset}>
          Scan Again
        </Button>
      </div>
    );
  }

  const totalSize = visibleFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">Large Files</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Found{" "}
            <span className="font-mono font-bold text-[var(--color-warning)]">
              {formatSize(totalSize)}
            </span>{" "}
            across {visibleFiles.length} {visibleFiles.length === 1 ? "file" : "files"}
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

      {/* File list */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        <div className="grid grid-cols-1 gap-2">
          {visibleFiles.map((file, index) => (
            <div
              key={file.path}
              className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-[var(--color-text-muted)]/50 transition-all"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-warning)]/10 flex items-center justify-center flex-shrink-0">
                {file.isDir ? (
                  <FolderOpen size={20} className="text-[var(--color-warning)]" />
                ) : (
                  <File size={20} className="text-[var(--color-warning)]" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--color-text)] truncate">{file.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{file.path}</p>
              </div>

              {/* Size & Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-[var(--color-text)]">
                    {formatSize(file.size)}
                  </div>
                  {file.modTime && (
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Clock size={10} />
                      {formatDate(file.modTime)}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(file.path)}
                  disabled={deletingPath === file.path}
                  className="hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                  title="Move to Trash"
                >
                  {deletingPath === file.path ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>
              </div>
            </div>
          ))}
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
