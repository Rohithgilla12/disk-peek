import { useState, useCallback } from "react";
import { FindDuplicates, DeleteDuplicateGroup } from "../../wailsjs/go/main/App";
import { scanner } from "../../wailsjs/go/models";

type ScanState = "idle" | "scanning" | "completed" | "error";

interface UseDuplicatesReturn {
  state: ScanState;
  result: scanner.DuplicatesResult | null;
  error: string | null;
  scan: () => Promise<void>;
  deleteGroup: (group: scanner.DuplicateGroup, keepIndex: number) => Promise<void>;
  reset: () => void;
}

export function useDuplicates(): UseDuplicatesReturn {
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<scanner.DuplicatesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    try {
      setState("scanning");
      setError(null);
      const scanResult = await FindDuplicates();
      setResult(scanResult);
      setState("completed");
    } catch (err) {
      console.error("Duplicates scan error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setState("error");
    }
  }, []);

  const deleteGroup = useCallback(async (group: scanner.DuplicateGroup, keepIndex: number) => {
    try {
      // Pass the group and keepIndex to the backend
      await DeleteDuplicateGroup(group, keepIndex);

      // Remove the group from results
      if (result) {
        const newGroups = result.groups.filter((g) => g.hash !== group.hash);
        const newTotalWasted = newGroups.reduce((sum, g) => sum + g.wastedSize, 0);
        const newTotalFiles = newGroups.reduce((sum, g) => sum + g.files.length, 0);
        const updatedResult = scanner.DuplicatesResult.createFrom({
          groups: newGroups,
          totalGroups: newGroups.length,
          totalWasted: newTotalWasted,
          totalFiles: newTotalFiles,
          scanDuration: result.scanDuration,
        });
        setResult(updatedResult);
      }
    } catch (err) {
      console.error("Delete duplicate group error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete duplicates");
    }
  }, [result]);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return {
    state,
    result,
    error,
    scan,
    deleteGroup,
    reset,
  };
}
