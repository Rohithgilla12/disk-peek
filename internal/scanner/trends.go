package scanner

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"time"
)

// DiskUsageSnapshot represents disk usage at a point in time
type DiskUsageSnapshot struct {
	Timestamp  time.Time         `json:"timestamp"`
	TotalSize  int64             `json:"totalSize"`
	Categories map[string]int64  `json:"categories"` // Category ID -> Size
}

// DiskUsageTrend represents the trend data for a category
type DiskUsageTrend struct {
	CategoryID   string            `json:"categoryId"`
	CategoryName string            `json:"categoryName"`
	DataPoints   []TrendDataPoint  `json:"dataPoints"`
	GrowthRate   float64           `json:"growthRate"` // Bytes per day
	TotalChange  int64             `json:"totalChange"`
}

// TrendDataPoint represents a single data point in a trend
type TrendDataPoint struct {
	Timestamp time.Time `json:"timestamp"`
	Size      int64     `json:"size"`
}

// TrendsResult contains disk usage trends analysis
type TrendsResult struct {
	Snapshots      []DiskUsageSnapshot `json:"snapshots"`
	CategoryTrends []DiskUsageTrend    `json:"categoryTrends"`
	TotalTrend     DiskUsageTrend      `json:"totalTrend"`
	OldestSnapshot time.Time           `json:"oldestSnapshot"`
	NewestSnapshot time.Time           `json:"newestSnapshot"`
}

// TrendsManager manages disk usage history
type TrendsManager struct {
	dataPath  string
	snapshots []DiskUsageSnapshot
}

// NewTrendsManager creates a new trends manager
func NewTrendsManager() (*TrendsManager, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	dataPath := filepath.Join(home, ".config", "disk-peek", "trends.json")

	tm := &TrendsManager{
		dataPath:  dataPath,
		snapshots: []DiskUsageSnapshot{},
	}

	// Load existing data
	tm.load()

	return tm, nil
}

// load reads existing trend data from disk
func (tm *TrendsManager) load() {
	data, err := os.ReadFile(tm.dataPath)
	if err != nil {
		return
	}

	var snapshots []DiskUsageSnapshot
	if err := json.Unmarshal(data, &snapshots); err != nil {
		return
	}

	tm.snapshots = snapshots
}

// save writes trend data to disk
func (tm *TrendsManager) save() error {
	// Ensure directory exists
	dir := filepath.Dir(tm.dataPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(tm.snapshots, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(tm.dataPath, data, 0644)
}

// RecordSnapshot adds a new disk usage snapshot
func (tm *TrendsManager) RecordSnapshot(result ScanResult) error {
	categories := make(map[string]int64)

	var recordCategories func(cats []Category)
	recordCategories = func(cats []Category) {
		for _, cat := range cats {
			if len(cat.Children) > 0 {
				recordCategories(cat.Children)
			}
			categories[cat.ID] = cat.Size
		}
	}
	recordCategories(result.Categories)

	snapshot := DiskUsageSnapshot{
		Timestamp:  time.Now(),
		TotalSize:  result.TotalSize,
		Categories: categories,
	}

	tm.snapshots = append(tm.snapshots, snapshot)

	// Keep only last 365 days of data
	cutoff := time.Now().AddDate(0, 0, -365)
	var filtered []DiskUsageSnapshot
	for _, s := range tm.snapshots {
		if s.Timestamp.After(cutoff) {
			filtered = append(filtered, s)
		}
	}
	tm.snapshots = filtered

	return tm.save()
}

// GetTrends analyzes the stored snapshots and returns trends
func (tm *TrendsManager) GetTrends(categories []Category) TrendsResult {
	if len(tm.snapshots) == 0 {
		return TrendsResult{}
	}

	// Sort snapshots by time
	sort.Slice(tm.snapshots, func(i, j int) bool {
		return tm.snapshots[i].Timestamp.Before(tm.snapshots[j].Timestamp)
	})

	oldest := tm.snapshots[0].Timestamp
	newest := tm.snapshots[len(tm.snapshots)-1].Timestamp

	// Build category name map
	categoryNames := make(map[string]string)
	var buildNames func(cats []Category)
	buildNames = func(cats []Category) {
		for _, cat := range cats {
			categoryNames[cat.ID] = cat.Name
			if len(cat.Children) > 0 {
				buildNames(cat.Children)
			}
		}
	}
	buildNames(categories)

	// Calculate category trends
	categoryData := make(map[string][]TrendDataPoint)
	for _, snapshot := range tm.snapshots {
		for catID, size := range snapshot.Categories {
			categoryData[catID] = append(categoryData[catID], TrendDataPoint{
				Timestamp: snapshot.Timestamp,
				Size:      size,
			})
		}
	}

	var categoryTrends []DiskUsageTrend
	for catID, dataPoints := range categoryData {
		if len(dataPoints) < 2 {
			continue
		}

		trend := DiskUsageTrend{
			CategoryID:   catID,
			CategoryName: categoryNames[catID],
			DataPoints:   dataPoints,
		}

		// Calculate growth rate (bytes per day)
		firstPoint := dataPoints[0]
		lastPoint := dataPoints[len(dataPoints)-1]
		days := lastPoint.Timestamp.Sub(firstPoint.Timestamp).Hours() / 24
		if days > 0 {
			trend.GrowthRate = float64(lastPoint.Size-firstPoint.Size) / days
		}
		trend.TotalChange = lastPoint.Size - firstPoint.Size

		categoryTrends = append(categoryTrends, trend)
	}

	// Sort by absolute growth rate (fastest growing first)
	sort.Slice(categoryTrends, func(i, j int) bool {
		return abs(categoryTrends[i].GrowthRate) > abs(categoryTrends[j].GrowthRate)
	})

	// Calculate total trend
	var totalDataPoints []TrendDataPoint
	for _, snapshot := range tm.snapshots {
		totalDataPoints = append(totalDataPoints, TrendDataPoint{
			Timestamp: snapshot.Timestamp,
			Size:      snapshot.TotalSize,
		})
	}

	totalTrend := DiskUsageTrend{
		CategoryID:   "total",
		CategoryName: "Total",
		DataPoints:   totalDataPoints,
	}

	if len(totalDataPoints) >= 2 {
		first := totalDataPoints[0]
		last := totalDataPoints[len(totalDataPoints)-1]
		days := last.Timestamp.Sub(first.Timestamp).Hours() / 24
		if days > 0 {
			totalTrend.GrowthRate = float64(last.Size-first.Size) / days
		}
		totalTrend.TotalChange = last.Size - first.Size
	}

	return TrendsResult{
		Snapshots:      tm.snapshots,
		CategoryTrends: categoryTrends,
		TotalTrend:     totalTrend,
		OldestSnapshot: oldest,
		NewestSnapshot: newest,
	}
}

// GetGrowthAlerts returns categories that are growing rapidly
func (tm *TrendsManager) GetGrowthAlerts(thresholdBytesPerDay int64) []DiskUsageTrend {
	trends := tm.GetTrends(GetCategories())

	var alerts []DiskUsageTrend
	for _, trend := range trends.CategoryTrends {
		if trend.GrowthRate > float64(thresholdBytesPerDay) {
			alerts = append(alerts, trend)
		}
	}

	return alerts
}

// ClearHistory removes all stored snapshots
func (tm *TrendsManager) ClearHistory() error {
	tm.snapshots = []DiskUsageSnapshot{}
	return tm.save()
}

// GetSnapshotCount returns the number of stored snapshots
func (tm *TrendsManager) GetSnapshotCount() int {
	return len(tm.snapshots)
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
