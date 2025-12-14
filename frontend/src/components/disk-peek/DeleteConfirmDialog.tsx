import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Folder, File } from "lucide-react";
import { formatSize } from "@/lib/formatters";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemPath: string;
  itemSize: number;
  isDirectory: boolean;
  onTrash: () => void;
  onPermanentDelete: () => void;
  isDeleting?: boolean;
  error?: string | null;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemPath,
  itemSize,
  isDirectory,
  onTrash,
  onPermanentDelete,
  isDeleting = false,
  error = null,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md overflow-hidden">
        <AlertDialogHeader className="overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-danger)]/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-[var(--color-danger)]" />
            </div>
            <AlertDialogTitle className="text-xl">Delete {isDirectory ? "Folder" : "File"}?</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="text-left overflow-hidden">
              <div className="mt-4 p-4 bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                    {isDirectory ? (
                      <Folder size={20} className="text-[var(--color-warning)]" />
                    ) : (
                      <File size={20} className="text-[var(--color-accent)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-semibold text-[var(--color-text)] truncate">{itemName}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{itemPath}</p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="font-mono text-sm font-bold text-[var(--color-text)] whitespace-nowrap">
                      {formatSize(itemSize)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                Choose how you want to delete this {isDirectory ? "folder" : "file"}:
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-[var(--radius-lg)] mb-2">
            <p className="text-sm text-[var(--color-danger)] font-medium">
              {error}
            </p>
          </div>
        )}

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Move to Trash - Primary/Default action */}
          <Button
            onClick={onTrash}
            disabled={isDeleting}
            className="w-full h-11 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-text-muted)] hover:scale-[1.02] hover:shadow-md text-[var(--color-text)] rounded-[var(--radius-lg)] transition-all duration-200"
          >
            <Trash2 size={16} className="mr-2" />
            {isDeleting ? "Moving to Trash..." : "Move to Trash"}
          </Button>

          {/* Permanent Delete - Destructive action */}
          <Button
            onClick={onPermanentDelete}
            disabled={isDeleting}
            className="w-full h-11 bg-[var(--color-danger)] hover:bg-red-600 hover:scale-[1.02] hover:shadow-lg text-white rounded-[var(--radius-lg)] transition-all duration-200"
          >
            <AlertTriangle size={16} className="mr-2" />
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </Button>

          {/* Cancel */}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full h-11 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] hover:scale-[1.02] rounded-[var(--radius-lg)] transition-all duration-200"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
