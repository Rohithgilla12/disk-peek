import { useState, useEffect, useCallback } from "react";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";
import {
  GetAppVersion,
  CheckForUpdates,
  DownloadUpdate,
  InstallUpdate,
  OpenReleasePage,
} from "../../wailsjs/go/main/App";
import type { updater } from "../../wailsjs/go/models";

export type UpdateState = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

interface DownloadProgress {
  downloaded: number;
  total: number;
  percent: number;
}

interface UseUpdateReturn {
  state: UpdateState;
  updateInfo: updater.UpdateInfo | null;
  downloadProgress: DownloadProgress;
  dmgPath: string | null;
  error: string | null;
  currentVersion: string;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  openReleasePage: () => Promise<void>;
  dismiss: () => void;
}

export function useUpdate(): UseUpdateReturn {
  const [state, setState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<updater.UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    downloaded: 0,
    total: 0,
    percent: 0,
  });
  const [dmgPath, setDmgPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>("dev");

  // Fetch current version on mount
  useEffect(() => {
    GetAppVersion().then(setCurrentVersion).catch(console.error);
  }, []);

  // Listen for download progress events
  useEffect(() => {
    const handleProgress = (progress: DownloadProgress) => {
      setDownloadProgress(progress);
    };

    const handleComplete = (path: string) => {
      setDmgPath(path);
      setState("ready");
    };

    EventsOn("update:download-progress", handleProgress);
    EventsOn("update:download-complete", handleComplete);

    return () => {
      EventsOff("update:download-progress");
      EventsOff("update:download-complete");
    };
  }, []);

  // Auto-check for updates on mount (with a delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-check if not in dev mode
      if (currentVersion !== "dev") {
        checkForUpdates();
      }
    }, 3000); // Check after 3 seconds

    return () => clearTimeout(timer);
  }, [currentVersion]);

  const checkForUpdates = useCallback(async () => {
    setState("checking");
    setError(null);

    try {
      const info = await CheckForUpdates();
      setUpdateInfo(info);
      setState(info.updateAvailable ? "available" : "idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check for updates");
      setState("error");
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!updateInfo?.downloadUrl) {
      setError("No download URL available");
      setState("error");
      return;
    }

    setState("downloading");
    setError(null);
    setDownloadProgress({ downloaded: 0, total: 0, percent: 0 });

    try {
      const path = await DownloadUpdate(updateInfo.downloadUrl);
      setDmgPath(path);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download update");
      setState("error");
    }
  }, [updateInfo]);

  const installUpdate = useCallback(async () => {
    if (!dmgPath) {
      setError("No download path available");
      return;
    }

    try {
      await InstallUpdate(dmgPath);
      // The app will be replaced, so we don't need to update state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to install update");
      setState("error");
    }
  }, [dmgPath]);

  const openReleasePage = useCallback(async () => {
    if (!updateInfo?.releaseUrl) {
      return;
    }

    try {
      await OpenReleasePage(updateInfo.releaseUrl);
    } catch (err) {
      console.error("Failed to open release page:", err);
    }
  }, [updateInfo]);

  const dismiss = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  return {
    state,
    updateInfo,
    downloadProgress,
    dmgPath,
    error,
    currentVersion,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    openReleasePage,
    dismiss,
  };
}
