import { useEffect, useCallback, useRef } from "react";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import type { ScanMode } from "../components/disk-peek/ModeToggle";

interface MenuEventCallbacks {
  onScan: () => void;
  onQuickScan: () => void;
  onClean: () => void;
  onSettings: () => void;
  onModeChange: (mode: ScanMode) => void;
  onCancel: () => void;
}

export function useMenuEvents(callbacks: MenuEventCallbacks) {
  // Use refs to avoid stale closures
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    // Scan triggered from menu (Cmd+R)
    const unsubscribeScan = EventsOn("menu:scan", () => {
      callbacksRef.current.onScan();
    });

    // Quick scan (Shift+Cmd+R)
    const unsubscribeQuickScan = EventsOn("menu:quickscan", () => {
      callbacksRef.current.onQuickScan();
    });

    // Clean selected (Cmd+D)
    const unsubscribeClean = EventsOn("menu:clean", () => {
      callbacksRef.current.onClean();
    });

    // Settings (Cmd+,)
    const unsubscribeSettings = EventsOn("menu:settings", () => {
      callbacksRef.current.onSettings();
    });

    // Mode switch (Cmd+1, Cmd+2, or Cmd+3)
    const unsubscribeMode = EventsOn("menu:mode", (mode: string) => {
      if (mode === "dev" || mode === "normal" || mode === "tools") {
        callbacksRef.current.onModeChange(mode as ScanMode);
      }
    });

    // Cancel operation (Escape)
    const unsubscribeCancel = EventsOn("menu:cancel", () => {
      callbacksRef.current.onCancel();
    });

    return () => {
      unsubscribeScan();
      unsubscribeQuickScan();
      unsubscribeClean();
      unsubscribeSettings();
      unsubscribeMode();
      unsubscribeCancel();
    };
  }, []);
}
