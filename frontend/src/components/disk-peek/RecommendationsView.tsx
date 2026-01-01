import { useState, useEffect } from "react";
import type { scanner } from "../../../wailsjs/go/models";
import { GetRecommendations, CleanCategories } from "../../../wailsjs/go/main/App";
import { formatSize } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/components/ui/motion";
import {
  Lightbulb,
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  Package,
  Trash2,
  Loader2,
  RefreshCw,
  CheckCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type RecommendationType = "high_impact" | "quick_win" | "growth_alert" | "stale" | "duplicate" | "node_modules";

const typeConfig: Record<RecommendationType, { icon: typeof AlertTriangle; color: string; label: string }> = {
  high_impact: { icon: AlertTriangle, color: "#ef4444", label: "High Impact" },
  quick_win: { icon: Zap, color: "#f59e0b", label: "Quick Win" },
  growth_alert: { icon: TrendingUp, color: "#8b5cf6", label: "Growing Fast" },
  stale: { icon: Clock, color: "#6b7280", label: "Old Cache" },
  duplicate: { icon: Package, color: "#3b82f6", label: "Duplicates" },
  node_modules: { icon: Package, color: "#10b981", label: "Node Modules" },
};

interface RecommendationsViewProps {
  onNavigateToCategory?: (categoryId: string) => void;
}

export function RecommendationsView({ onNavigateToCategory }: RecommendationsViewProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<scanner.RecommendationsResult | null>(null);
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [cleaned, setCleaned] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await GetRecommendations();
      setResult(data);
    } catch (err) {
      setError("Failed to generate recommendations. Run a scan first.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleClean = async (rec: scanner.Recommendation) => {
    if (!rec.categoryId) return;

    setCleaning(rec.id);
    try {
      await CleanCategories([rec.categoryId]);
      setCleaned((prev) => new Set([...prev, rec.id]));
    } catch (err) {
      console.error("Clean failed:", err);
    } finally {
      setCleaning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-4">
          <Loader2 size={28} className="text-[var(--color-accent)] animate-spin" />
        </div>
        <p className="text-[var(--color-text-muted)]">Analyzing your disk usage...</p>
      </div>
    );
  }

  if (error || !result || result.recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-4">
          <Lightbulb size={36} className="text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          {error ? "No Recommendations Available" : "All Clean!"}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] text-center max-w-sm mb-6">
          {error || "Your disk is looking good. Run a new scan to check for cleanup opportunities."}
        </p>
        <Button onClick={loadRecommendations} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              Smart Recommendations
            </h2>
            {result.highPriorityCount > 0 && (
              <span className="px-2 py-0.5 bg-[var(--color-danger)]/15 text-[var(--color-danger)] rounded-full text-xs font-semibold">
                {result.highPriorityCount} High Priority
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Found{" "}
            <span className="font-mono font-bold text-[var(--color-accent)]">
              {formatSize(result.totalSavings)}
            </span>{" "}
            potential savings across {result.recommendations.length} suggestions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecommendations}
          className="gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </motion.div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-2">
        <AnimatePresence>
          <div className="space-y-3">
            {result.recommendations.map((rec, index) => {
              const config = typeConfig[rec.type as RecommendationType] || typeConfig.quick_win;
              const Icon = config.icon;
              const isCleaning = cleaning === rec.id;
              const isCleaned = cleaned.has(rec.id);

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ ...springs.smooth, delay: index * 0.05 }}
                  className={`
                    p-4 rounded-[var(--radius-xl)] border
                    bg-[var(--color-bg-elevated)]
                    ${isCleaned
                      ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/5"
                      : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]/50"
                    }
                    transition-all duration-300
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {isCleaned ? (
                        <CheckCircle size={24} className="text-[var(--color-success)]" />
                      ) : (
                        <Icon size={24} style={{ color: config.color }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${config.color}15`,
                            color: config.color
                          }}
                        >
                          {config.label}
                        </span>
                        {rec.priority >= 4 && (
                          <span className="text-xs text-[var(--color-danger)] font-medium">
                            Priority
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[var(--color-text)] mb-1">
                        {isCleaned ? "Cleaned!" : rec.title}
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                        {isCleaned
                          ? `Freed up ${formatSize(rec.size)}`
                          : rec.description
                        }
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-base font-bold text-[var(--color-text)]">
                          {formatSize(rec.size)}
                        </div>
                      </div>

                      {!isCleaned && (
                        <div className="flex gap-2">
                          {rec.categoryId && onNavigateToCategory && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onNavigateToCategory(rec.categoryId!)}
                              className="gap-1"
                            >
                              View
                              <ChevronRight size={14} />
                            </Button>
                          )}
                          {rec.action === "clean" && rec.categoryId && (
                            <Button
                              size="sm"
                              onClick={() => handleClean(rec)}
                              disabled={isCleaning}
                              className="gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                            >
                              {isCleaning ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Clean
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>

      {/* Summary Footer */}
      {result.totalSavings > 0 && (
        <motion.div
          className="mt-6 pt-5 border-t border-[var(--color-border)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Total potential savings
              </p>
              <p className="text-2xl font-bold text-[var(--color-accent)]">
                {formatSize(result.totalSavings)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Sparkles size={16} className="text-[var(--color-warning)]" />
              {result.highPriorityCount} high priority items
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
