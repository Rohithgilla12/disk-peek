import { useState, useEffect } from "react";
import { Settings, Trash2, FolderX, X } from "lucide-react";
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
  GetSettings,
  SetPermanentDelete,
  SetCategoryEnabled,
  GetDevCategories,
} from "../../../wailsjs/go/main/App";
import type { scanner } from "../../../wailsjs/go/models";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface AppSettings {
  permanentDelete: boolean;
  disabledCategories: Record<string, boolean>;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    permanentDelete: false,
    disabledCategories: {},
  });
  const [categories, setCategories] = useState<scanner.Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, categoriesData] = await Promise.all([
        GetSettings(),
        GetDevCategories(),
      ]);
      setSettings({
        permanentDelete: settingsData?.permanentDelete ?? false,
        disabledCategories: settingsData?.disabledCategories ?? {},
      });
      setCategories(categoriesData);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDeleteChange = async (enabled: boolean) => {
    try {
      await SetPermanentDelete(enabled);
      setSettings((prev) => ({ ...prev, permanentDelete: enabled }));
    } catch (err) {
      console.error("Failed to update permanent delete setting:", err);
    }
  };

  const handleCategoryToggle = async (categoryId: string, enabled: boolean) => {
    try {
      await SetCategoryEnabled(categoryId, enabled);
      setSettings((prev) => {
        const newDisabledCategories = { ...prev.disabledCategories };
        if (enabled) {
          delete newDisabledCategories[categoryId];
        } else {
          newDisabledCategories[categoryId] = true;
        }
        return { ...prev, disabledCategories: newDisabledCategories };
      });
    } catch (err) {
      console.error("Failed to update category setting:", err);
    }
  };

  const isCategoryEnabled = (categoryId: string) => {
    return !settings.disabledCategories[categoryId];
  };

  // Flatten categories for display
  const getAllCategories = (cats: scanner.Category[]): scanner.Category[] => {
    const result: scanner.Category[] = [];
    for (const cat of cats) {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result.push(...getAllCategories(cat.children));
      }
    }
    return result;
  };

  const allCategories = getAllCategories(categories);

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            Settings
          </AlertDialogTitle>
          <AlertDialogDescription>
            Configure Disk Peek preferences
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Deletion Behavior */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
                <Trash2 size={16} />
                Deletion Behavior
              </h3>
              <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      Permanent Delete
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Skip Trash and delete files permanently (faster but not recoverable)
                    </p>
                  </div>
                  <button
                    onClick={() => handlePermanentDeleteChange(!settings.permanentDelete)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.permanentDelete
                        ? "bg-[var(--color-danger)]"
                        : "bg-[var(--color-border)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        settings.permanentDelete ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Category Toggles */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
                <FolderX size={16} />
                Categories to Scan
              </h3>
              <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                {allCategories.filter(cat => !cat.children || cat.children.length === 0).map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--color-bg-hover)] first:rounded-t-[var(--radius-lg)] last:rounded-b-[var(--radius-lg)]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-[var(--color-text)]">
                        {category.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCategoryToggle(category.id, !isCategoryEnabled(category.id))}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        isCategoryEnabled(category.id)
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-border)]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                          isCategoryEnabled(category.id) ? "translate-x-4" : ""
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

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
