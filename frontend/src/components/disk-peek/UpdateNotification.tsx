import { Download, ExternalLink, RefreshCw, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useUpdate } from "@/hooks/useUpdate";

interface UpdateNotificationProps {
  update: ReturnType<typeof useUpdate>;
}

export function UpdateNotification({ update }: UpdateNotificationProps) {
  const {
    state,
    updateInfo,
    downloadProgress,
    error,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    openReleasePage,
    dismiss,
  } = update;

  // Don't show anything if idle or checking
  if (state === "idle" || state === "checking") {
    return null;
  }

  // Error state
  if (state === "error") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-danger)]/30 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-[var(--color-danger)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Update Check Failed
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                {error}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkForUpdates}
                  className="h-7 text-xs bg-transparent border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismiss}
                  className="h-7 text-xs hover:bg-[var(--color-bg-hover)]"
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Update available
  if (state === "available" && updateInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-accent)]/30 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center flex-shrink-0">
              <Download size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Update Available
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Version {updateInfo.latestVersion} is ready
              </p>
              {updateInfo.releaseNotes && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2 line-clamp-2">
                  {updateInfo.releaseNotes.split('\n')[0]}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={downloadUpdate}
                  className="h-7 text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                >
                  <Download size={12} className="mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openReleasePage}
                  className="h-7 text-xs bg-transparent border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
                >
                  <ExternalLink size={12} className="mr-1" />
                  View
                </Button>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Downloading
  if (state === "downloading") {
    const percent = Math.round(downloadProgress.percent);
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
              <Download size={18} className="text-[var(--color-accent)] animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Downloading Update
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {formatBytes(downloadProgress.downloaded)} / {formatBytes(downloadProgress.total)}
              </p>
              <div className="mt-3">
                <div className="h-1.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right font-mono">
                  {percent}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ready to install
  if (state === "ready") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-success)]/30 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-[var(--color-success)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Ready to Install
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Click install to open the update
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={installUpdate}
                  className="h-7 text-xs bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white"
                >
                  Install Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismiss}
                  className="h-7 text-xs hover:bg-[var(--color-bg-hover)]"
                >
                  Later
                </Button>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(1)} ${sizes[i]}`;
}
