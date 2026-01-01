package scanner

import (
	"os"
	"path/filepath"
	"sort"
	"time"
)

// RecommendationType represents the type of recommendation
type RecommendationType string

const (
	RecommendationHighImpact    RecommendationType = "high_impact"
	RecommendationQuickWin      RecommendationType = "quick_win"
	RecommendationGrowthAlert   RecommendationType = "growth_alert"
	RecommendationStale         RecommendationType = "stale"
	RecommendationDuplicate     RecommendationType = "duplicate"
	RecommendationNodeModules   RecommendationType = "node_modules"
)

// Recommendation represents a cleanup suggestion
type Recommendation struct {
	ID          string             `json:"id"`
	Type        RecommendationType `json:"type"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Size        int64              `json:"size"`
	Priority    int                `json:"priority"` // 1-5, 5 being highest
	CategoryID  string             `json:"categoryId,omitempty"`
	Paths       []string           `json:"paths,omitempty"`
	Action      string             `json:"action"` // "clean", "review", "ignore"
	Icon        string             `json:"icon"`
}

// RecommendationsResult contains all recommendations
type RecommendationsResult struct {
	Recommendations  []Recommendation `json:"recommendations"`
	TotalSavings     int64            `json:"totalSavings"`
	HighPriorityCount int             `json:"highPriorityCount"`
	GeneratedAt      time.Time        `json:"generatedAt"`
}

// GenerateRecommendations analyzes scan results and generates smart recommendations
func GenerateRecommendations(scanResult ScanResult, trendsResult *TrendsResult) RecommendationsResult {
	var recommendations []Recommendation

	// 1. High Impact: Categories taking > 1GB
	recommendations = append(recommendations, findHighImpactCategories(scanResult.Categories)...)

	// 2. Quick Wins: Categories with > 100MB that are safe to delete
	recommendations = append(recommendations, findQuickWins(scanResult.Categories)...)

	// 3. Growth Alerts: Categories growing rapidly (if trends available)
	if trendsResult != nil {
		recommendations = append(recommendations, findGrowthAlerts(trendsResult.CategoryTrends)...)
	}

	// 4. Stale Items: Old caches that haven't been accessed
	recommendations = append(recommendations, findStaleItems(scanResult.Categories)...)

	// Sort by priority (highest first)
	sort.Slice(recommendations, func(i, j int) bool {
		if recommendations[i].Priority != recommendations[j].Priority {
			return recommendations[i].Priority > recommendations[j].Priority
		}
		return recommendations[i].Size > recommendations[j].Size
	})

	// Assign IDs
	for i := range recommendations {
		recommendations[i].ID = generateRecommendationID(i)
	}

	// Calculate totals
	var totalSavings int64
	var highPriorityCount int
	for _, r := range recommendations {
		totalSavings += r.Size
		if r.Priority >= 4 {
			highPriorityCount++
		}
	}

	return RecommendationsResult{
		Recommendations:   recommendations,
		TotalSavings:      totalSavings,
		HighPriorityCount: highPriorityCount,
		GeneratedAt:       time.Now(),
	}
}

// findHighImpactCategories finds categories using > 1GB
func findHighImpactCategories(categories []Category) []Recommendation {
	var recommendations []Recommendation
	threshold := int64(1024 * 1024 * 1024) // 1GB

	for _, cat := range categories {
		if cat.Size >= threshold {
			recommendations = append(recommendations, Recommendation{
				Type:        RecommendationHighImpact,
				Title:       cat.Name + " is using significant space",
				Description: "This category is taking up over 1GB. Consider cleaning it to free up substantial disk space.",
				Size:        cat.Size,
				Priority:    5,
				CategoryID:  cat.ID,
				Action:      "clean",
				Icon:        "alert-triangle",
			})
		}

		// Check children recursively
		if len(cat.Children) > 0 {
			recommendations = append(recommendations, findHighImpactCategories(cat.Children)...)
		}
	}

	return recommendations
}

// findQuickWins finds safe-to-delete categories with moderate size
func findQuickWins(categories []Category) []Recommendation {
	var recommendations []Recommendation
	minSize := int64(100 * 1024 * 1024)  // 100MB
	maxSize := int64(1024 * 1024 * 1024) // 1GB

	// Safe categories that regenerate automatically
	safeCategories := map[string]bool{
		"npm-cache":       true,
		"yarn-cache":      true,
		"pnpm-cache":      true,
		"pip-cache":       true,
		"go-cache":        true,
		"cargo-cache":     true,
		"gradle-cache":    true,
		"maven-cache":     true,
		"cocoapods-cache": true,
		"homebrew":        true,
		"docker-cache":    true,
	}

	for _, cat := range categories {
		if cat.Size >= minSize && cat.Size < maxSize {
			// Check if it's a safe category
			if safeCategories[cat.ID] {
				recommendations = append(recommendations, Recommendation{
					Type:        RecommendationQuickWin,
					Title:       "Clean " + cat.Name + " cache",
					Description: "This cache will regenerate automatically when needed. Safe to delete.",
					Size:        cat.Size,
					Priority:    4,
					CategoryID:  cat.ID,
					Action:      "clean",
					Icon:        "zap",
				})
			}
		}

		// Check children
		if len(cat.Children) > 0 {
			recommendations = append(recommendations, findQuickWins(cat.Children)...)
		}
	}

	return recommendations
}

// findGrowthAlerts finds categories growing faster than 50MB/day
func findGrowthAlerts(trends []DiskUsageTrend) []Recommendation {
	var recommendations []Recommendation
	threshold := float64(50 * 1024 * 1024) // 50MB per day

	for _, trend := range trends {
		if trend.GrowthRate > threshold {
			recommendations = append(recommendations, Recommendation{
				Type:        RecommendationGrowthAlert,
				Title:       trend.CategoryName + " is growing rapidly",
				Description: "This category is growing by " + FormatSize(int64(trend.GrowthRate)) + " per day. Consider cleaning it regularly.",
				Size:        trend.TotalChange,
				Priority:    4,
				CategoryID:  trend.CategoryID,
				Action:      "review",
				Icon:        "trending-up",
			})
		}
	}

	return recommendations
}

// findStaleItems finds caches that are old and likely unused
func findStaleItems(categories []Category) []Recommendation {
	var recommendations []Recommendation

	// Check for old Xcode data
	xcodeCategories := []string{"xcode-derived", "xcode-archives", "ios-device-support"}
	for _, cat := range categories {
		for _, xcodeID := range xcodeCategories {
			if cat.ID == xcodeID && cat.Size > 500*1024*1024 { // > 500MB
				recommendations = append(recommendations, Recommendation{
					Type:        RecommendationStale,
					Title:       "Old " + cat.Name + " data",
					Description: "Xcode caches tend to accumulate old, unused data. Review and clean older items.",
					Size:        cat.Size,
					Priority:    3,
					CategoryID:  cat.ID,
					Action:      "review",
					Icon:        "clock",
				})
			}
		}

		// Check children
		if len(cat.Children) > 0 {
			recommendations = append(recommendations, findStaleItems(cat.Children)...)
		}
	}

	return recommendations
}

// CheckForOldNodeModules finds node_modules directories not accessed in 30+ days
func CheckForOldNodeModules() []Recommendation {
	var recommendations []Recommendation
	home, _ := os.UserHomeDir()

	// Common project directories
	searchDirs := []string{
		filepath.Join(home, "Projects"),
		filepath.Join(home, "Code"),
		filepath.Join(home, "Developer"),
		filepath.Join(home, "Documents"),
	}

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var oldNodeModules []string
	var totalSize int64

	for _, dir := range searchDirs {
		filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil
			}

			if info.IsDir() && info.Name() == "node_modules" {
				// Check if the parent package.json was modified recently
				packageJSON := filepath.Join(filepath.Dir(path), "package.json")
				if pInfo, err := os.Stat(packageJSON); err == nil {
					if pInfo.ModTime().Before(thirtyDaysAgo) {
						oldNodeModules = append(oldNodeModules, path)
						size := WalkDirectory(path).Size
						totalSize += size
					}
				}
				return filepath.SkipDir
			}

			// Skip common non-project directories
			if info.IsDir() {
				skipDirs := []string{".git", "Library", ".cache", "node_modules"}
				for _, skip := range skipDirs {
					if info.Name() == skip {
						return filepath.SkipDir
					}
				}
			}

			return nil
		})
	}

	if len(oldNodeModules) > 0 && totalSize > 100*1024*1024 {
		recommendations = append(recommendations, Recommendation{
			Type:        RecommendationNodeModules,
			Title:       "Old node_modules directories found",
			Description: "Found " + string(rune(len(oldNodeModules))) + " node_modules directories in projects not touched in 30+ days.",
			Size:        totalSize,
			Priority:    4,
			Paths:       oldNodeModules,
			Action:      "clean",
			Icon:        "package",
		})
	}

	return recommendations
}

func generateRecommendationID(index int) string {
	return "rec_" + time.Now().Format("20060102") + "_" + string(rune('a'+index))
}
