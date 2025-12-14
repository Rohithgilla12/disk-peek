import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, RefreshCw, ArrowLeft } from "lucide-react";
import type { scanner } from "../../../wailsjs/go/models";
import { formatSize } from "@/lib/formatters";

interface CleanCompletedDialogProps {
  open: boolean;
  result: scanner.CleanResult;
  onGoBack: () => void;
  onScanAgain: () => void;
  isPermanentDelete?: boolean;
}

export function CleanCompletedDialog({
  open,
  result,
  onGoBack,
  onScanAgain,
  isPermanentDelete = false,
}: CleanCompletedDialogProps) {
  const hasErrors = result.errors && result.errors.length > 0;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md overflow-hidden">
        <AlertDialogHeader className="overflow-hidden">
          {/* Success icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[var(--color-success)]/10 border-2 border-[var(--color-success)]/30 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-[var(--color-success)]" />
              </div>
              {/* Sparkle decoration */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-warning)] flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
            </div>
          </div>

          <AlertDialogTitle className="text-center text-xl">
            {isPermanentDelete ? "Deletion Complete!" : "Cleaning Complete!"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your disk space has been freed up successfully
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 my-4">
          <div className="flex flex-col items-center px-5 py-3 bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] min-w-0">
            <span className="text-2xl font-bold text-[var(--color-success)] font-mono whitespace-nowrap">
              {formatSize(result.freedBytes)}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-1">Space Freed</span>
          </div>
          <div className="flex flex-col items-center px-5 py-3 bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-border)] min-w-0">
            <span className="text-2xl font-bold text-[var(--color-text)] font-mono">
              {result.deletedPaths.length}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-1 whitespace-nowrap">
              {result.deletedPaths.length === 1 ? "Item" : "Items"} Cleaned
            </span>
          </div>
        </div>

        {/* Errors if any */}
        {hasErrors && result.errors && (
          <div className="p-3 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-[var(--radius-lg)] mb-4 overflow-hidden">
            <p className="text-sm text-[var(--color-warning)] font-medium mb-1">
              Some items couldn't be cleaned:
            </p>
            <ul className="text-xs text-[var(--color-text-muted)] space-y-0.5 overflow-hidden">
              {result.errors.slice(0, 3).map((err, i) => (
                <li key={i} className="truncate">• {err}</li>
              ))}
              {result.errors.length > 3 && (
                <li className="text-[var(--color-text-muted)]">
                  ...and {result.errors.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Info text */}
        <p className="text-xs text-[var(--color-text-muted)] text-center mb-2">
          {isPermanentDelete 
            ? "Items have been permanently deleted"
            : "Items were moved to Trash — you can restore them if needed"
          }
        </p>

        <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
          {/* Go Back - Primary action */}
          <Button
            onClick={onGoBack}
            className="flex-1 h-11 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] hover:from-[var(--color-accent-hover)] hover:to-[var(--color-accent)] text-white font-semibold rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-glow)] transition-all duration-300"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </Button>

          {/* Scan Again - Secondary action */}
          <Button
            variant="outline"
            onClick={onScanAgain}
            className="flex-1 h-11 bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-text-muted)] text-[var(--color-text)] rounded-[var(--radius-lg)]"
          >
            <RefreshCw size={16} className="mr-2" />
            Scan Again
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
