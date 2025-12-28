import { useEffect, useCallback, useRef } from "react";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { formatSize } from "@/lib/formatters";

interface NotificationOptions {
  enabled?: boolean;
}

/**
 * Hook to show system notifications for scan/clean events
 * Uses the browser Notification API (works in Wails webview)
 */
export function useNotifications(options: NotificationOptions = {}) {
  const { enabled = true } = options;
  const permissionRef = useRef<NotificationPermission>("default");

  // Request notification permission on mount
  useEffect(() => {
    if (!enabled || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      permissionRef.current = "granted";
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        permissionRef.current = permission;
      });
    }
  }, [enabled]);

  const showNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if (!enabled || !("Notification" in window)) return;
      if (permissionRef.current !== "granted" && Notification.permission !== "granted") return;

      // Don't show if app is focused
      if (document.hasFocus()) return;

      try {
        new Notification(title, {
          body,
          icon: icon || "/appicon.png",
          silent: false,
        });
      } catch (err) {
        console.warn("Failed to show notification:", err);
      }
    },
    [enabled]
  );

  // Listen to scan/clean events
  useEffect(() => {
    if (!enabled) return;

    // Scan completed (dev mode)
    const unsubScanCompleted = EventsOn("scan:completed", (data: { totalSize: number }) => {
      if (data?.totalSize) {
        showNotification(
          "Scan Complete",
          `Found ${formatSize(data.totalSize)} to clean up`
        );
      }
    });

    // Scan completed (normal mode)
    const unsubScanCompletedNormal = EventsOn("scan:completed:normal", (data: { root?: { size: number } }) => {
      if (data?.root?.size) {
        showNotification(
          "Scan Complete",
          `Scanned ${formatSize(data.root.size)} of files`
        );
      }
    });

    // Clean completed
    const unsubCleanCompleted = EventsOn("clean:completed", (data: { freedBytes: number; deletedPaths: string[] }) => {
      if (data?.freedBytes) {
        showNotification(
          "Cleanup Complete",
          `Freed ${formatSize(data.freedBytes)} (${data.deletedPaths?.length || 0} items)`
        );
      }
    });

    // Large files scan completed
    const unsubLargeFilesCompleted = EventsOn("largefile:completed", (data: { files: unknown[]; totalSize: number }) => {
      if (data?.files?.length) {
        showNotification(
          "Large Files Found",
          `Found ${data.files.length} files totaling ${formatSize(data.totalSize)}`
        );
      }
    });

    // Duplicates scan completed
    const unsubDuplicatesCompleted = EventsOn("duplicates:completed", (data: { groups: unknown[]; totalWasted: number }) => {
      if (data?.groups?.length) {
        showNotification(
          "Duplicates Found",
          `Found ${data.groups.length} groups wasting ${formatSize(data.totalWasted)}`
        );
      }
    });

    // Node modules scan completed
    const unsubNodeModulesCompleted = EventsOn("nodemodules:completed", (data: { directories: unknown[]; totalSize: number }) => {
      if (data?.directories?.length) {
        showNotification(
          "Node Modules Found",
          `Found ${data.directories.length} directories (${formatSize(data.totalSize)})`
        );
      }
    });

    return () => {
      unsubScanCompleted();
      unsubScanCompletedNormal();
      unsubCleanCompleted();
      unsubLargeFilesCompleted();
      unsubDuplicatesCompleted();
      unsubNodeModulesCompleted();
    };
  }, [enabled, showNotification]);

  return { showNotification };
}
