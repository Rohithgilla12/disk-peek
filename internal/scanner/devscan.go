package scanner

import (
	"sync"
	"time"
)

// DevScanner scans predefined developer cache locations
type DevScanner struct {
	workers  int
	callback ProgressCallback
}

// NewDevScanner creates a new DevScanner with the specified number of workers
func NewDevScanner(workers int) *DevScanner {
	if workers <= 0 {
		workers = 4
	}
	return &DevScanner{
		workers: workers,
	}
}

// SetProgressCallback sets a callback for progress updates
func (s *DevScanner) SetProgressCallback(callback ProgressCallback) {
	s.callback = callback
}

// Scan performs a scan of all developer cache categories
func (s *DevScanner) Scan() ScanResult {
	start := time.Now()

	// Get category definitions
	categories := GetCategories()

	// Collect all paths that need scanning
	pathToCategoryMap := make(map[string]*Category)
	var allPaths []string

	var collectPaths func(cats []Category, parent *Category)
	collectPaths = func(cats []Category, parent *Category) {
		for i := range cats {
			cat := &cats[i]

			// Scan paths for leaf categories
			for _, path := range cat.Paths {
				allPaths = append(allPaths, path)
				pathToCategoryMap[path] = cat
			}

			// Recurse into children
			if len(cat.Children) > 0 {
				collectPaths(cat.Children, cat)
			}
		}
	}
	collectPaths(categories, nil)

	// Scan all paths in parallel
	var results []WalkResult
	if s.callback != nil {
		results = ScanMultiplePathsWithProgress(allPaths, s.workers, s.callback)
	} else {
		results = ScanMultiplePaths(allPaths, s.workers)
	}

	// Map results back to categories
	for i, result := range results {
		if cat, ok := pathToCategoryMap[allPaths[i]]; ok {
			cat.Size += result.Size
			cat.ItemCount += result.FileCount + result.DirCount
		}
	}

	// Calculate parent category sizes by summing children
	var calculateParentSizes func(cats []Category) int64
	calculateParentSizes = func(cats []Category) int64 {
		var total int64
		for i := range cats {
			if len(cats[i].Children) > 0 {
				cats[i].Size = calculateParentSizes(cats[i].Children)
				// Sum up item counts too
				for _, child := range cats[i].Children {
					cats[i].ItemCount += child.ItemCount
				}
			}
			total += cats[i].Size
		}
		return total
	}
	totalSize := calculateParentSizes(categories)

	return ScanResult{
		Mode:         ModeDev,
		Categories:   categories,
		TotalSize:    totalSize,
		ScanDuration: time.Since(start),
	}
}

// ScanCategory scans a single category and its children
func (s *DevScanner) ScanCategory(categoryID string) *Category {
	categories := GetCategories()
	cat := GetCategoryByID(categories, categoryID)
	if cat == nil {
		return nil
	}

	// Collect paths for this category and its children
	var paths []string
	pathToCat := make(map[string]*Category)

	var collect func(c *Category)
	collect = func(c *Category) {
		for _, path := range c.Paths {
			paths = append(paths, path)
			pathToCat[path] = c
		}
		for i := range c.Children {
			collect(&c.Children[i])
		}
	}
	collect(cat)

	// Scan paths
	results := ScanMultiplePaths(paths, s.workers)

	// Map results
	for i, result := range results {
		if c, ok := pathToCat[paths[i]]; ok {
			c.Size += result.Size
			c.ItemCount += result.FileCount + result.DirCount
		}
	}

	// Calculate parent size
	var calcSize func(c *Category) int64
	calcSize = func(c *Category) int64 {
		if len(c.Children) > 0 {
			var total int64
			for i := range c.Children {
				total += calcSize(&c.Children[i])
			}
			c.Size = total
			return total
		}
		return c.Size
	}
	calcSize(cat)

	return cat
}

// GetCategoryItems returns detailed items within a category path
func (s *DevScanner) GetCategoryItems(categoryID string) ([]FileNode, error) {
	categories := GetCategories()
	cat := GetCategoryByID(categories, categoryID)
	if cat == nil || len(cat.Paths) == 0 {
		return nil, nil
	}

	// Get items from the first path (most categories have one path)
	return GetDirectoryItems(cat.Paths[0])
}

// QuickScan performs a fast scan that just checks if paths exist and gets basic info
func (s *DevScanner) QuickScan() ScanResult {
	start := time.Now()
	categories := GetCategories()

	var wg sync.WaitGroup
	var mu sync.Mutex

	var quickScan func(cats []Category)
	quickScan = func(cats []Category) {
		for i := range cats {
			cat := &cats[i]

			if len(cat.Children) > 0 {
				quickScan(cat.Children)
				// Sum children
				for _, child := range cat.Children {
					cat.Size += child.Size
				}
			} else if len(cat.Paths) > 0 {
				wg.Add(1)
				go func(c *Category) {
					defer wg.Done()

					var size int64
					for _, path := range c.Paths {
						result := WalkDirectory(path)
						size += result.Size
					}

					mu.Lock()
					c.Size = size
					mu.Unlock()
				}(cat)
			}
		}
	}

	quickScan(categories)
	wg.Wait()

	// Recalculate parent sizes after goroutines complete
	var totalSize int64
	var recalc func(cats []Category) int64
	recalc = func(cats []Category) int64 {
		var total int64
		for i := range cats {
			if len(cats[i].Children) > 0 {
				cats[i].Size = recalc(cats[i].Children)
			}
			total += cats[i].Size
		}
		return total
	}
	totalSize = recalc(categories)

	return ScanResult{
		Mode:         ModeDev,
		Categories:   categories,
		TotalSize:    totalSize,
		ScanDuration: time.Since(start),
	}
}
