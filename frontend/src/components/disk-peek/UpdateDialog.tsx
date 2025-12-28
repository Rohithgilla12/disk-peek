import { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, ExternalLink, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/alert-dialog";
import {
  CheckForUpdate,
  DownloadUpdate,
  InstallUpdate,
  OpenReleasePage,
} from "../../../wailsjs/go/main/App";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import type { updater } from "../../../wailsjs/go/models";
import { formatSize } from "@/lib/formatters";

interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
}

type UpdateState = "checking" | "available" | "up-to-date" | "downloading" | "ready" | "error";

interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
}

export function UpdateDialog({ open, onClose }: UpdateDialogProps) {
  const [state, setState] = useState<UpdateState>("checking");
  const [updateInfo, setUpdateInfo] = useState<updater.UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    setState("checking");
    setError(null);
    setDownloadProgress(null);
    setDownloadedPath(null);

    try {
      const info = await CheckForUpdate();
      setUpdateInfo(info);
      setState(info.available ? "available" : "up-to-date");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check for updates");
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (open) {
      checkForUpdates();
    }
  }, [open, checkForUpdates]);

  useEffect(() => {
    const unsubscribe = EventsOn("update:progress", (progress: DownloadProgress) => {
      setDownloadProgress(progress);
    });
    return () => unsubscribe();
  }, []);

  const handleDownload = async () => {
    if (!updateInfo?.downloadURL) return;

    setState("downloading");
    setDownloadProgress({ bytesDownloaded: 0, totalBytes: updateInfo.assetSize || 0, percent: 0 });

    try {
      const path = await DownloadUpdate(updateInfo.downloadURL);
      setDownloadedPath(path);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download update");
      setState("error");
    }
  };

  const handleInstall = async () => {
    if (!downloadedPath) return;

    try {
      await InstallUpdate(downloadedPath);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to install update");
      setState("error");
    }
  };

  const handleOpenReleasePage = async () => {
    if (!updateInfo?.releaseURL) return;
    try {
      await OpenReleasePage(updateInfo.releaseURL);
    } catch (err) {
      console.error("Failed to open release page:", err);
    }
  };

  const renderContent = () => {
    switch (state) {
      case "checking":
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
            <p className="text-sm text-[var(--color-text-muted)]">Checking for updates...</p>
          </div>
        );

      case "up-to-date":
        return (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text)]">You're up to date!</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Version {updateInfo?.currentVersion} is the latest version.
              </p>
            </div>
          </div>
        );

      case "available":
        return (
          <div className="space-y-4 py-4">
            <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    New version available
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {updateInfo?.currentVersion} → {updateInfo?.latestVersion}
                  </p>
                </div>
                {updateInfo?.assetSize && updateInfo.assetSize > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatSize(updateInfo.assetSize)}
                  </span>
                )}
              </div>
              {updateInfo?.releaseNotes && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Release Notes
                  </p>
                  <div className="text-xs text-[var(--color-text-muted)] max-h-32 overflow-y-auto prose prose-sm prose-invert">
                    {updateInfo.releaseNotes.split("\n").map((line, i) => (
                      <p key={i} className="mb-1">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1 gap-2">
                <Download size={14} />
                Download Update
              </Button>
              <Button variant="outline" onClick={handleOpenReleasePage} className="gap-2">
                <ExternalLink size={14} />
                View on GitHub
              </Button>
            </div>
          </div>
        );

      case "downloading":
        return (
          <div className="space-y-4 py-4">
            <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[var(--color-text)]">Downloading update...</p>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {downloadProgress?.percent?.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] transition-all duration-300"
                  style={{ width: `${downloadProgress?.percent || 0}%` }}
                />
              </div>
              {downloadProgress && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  {formatSize(downloadProgress.bytesDownloaded)} / {formatSize(downloadProgress.totalBytes)}
                </p>
              )}
            </div>
          </div>
        );

      case "ready":
        return (
          <div className="space-y-4 py-4">
            <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-success)]/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Download complete!</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Ready to install {updateInfo?.latestVersion}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleInstall} className="w-full gap-2">
              <Download size={14} />
              Install and Restart
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="space-y-4 py-4">
            <div className="bg-[var(--color-danger)]/10 rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[var(--color-danger)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-danger)]">Update failed</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{error}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkForUpdates} variant="outline" className="flex-1 gap-2">
                <RefreshCw size={14} />
                Try Again
              </Button>
              {updateInfo?.releaseURL && (
                <Button variant="outline" onClick={handleOpenReleasePage} className="gap-2">
                  <ExternalLink size={14} />
                  Manual Download
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw size={20} />
            Software Update
          </AlertDialogTitle>
          <AlertDialogDescription>
            Check for and install Disk Peek updates
          </AlertDialogDescription>
        </AlertDialogHeader>

        {renderContent()}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" className="gap-2">
              <X size={14} />
              Close
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
