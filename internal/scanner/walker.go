package scanner

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"syscall"
)

// WalkDirectory calculates the total size of a directory recursively
// It skips symlinks and tracks inodes to avoid double-counting hardlinked files
func WalkDirectory(root string) WalkResult {
	result := WalkResult{Path: root}

	// Use Lstat to not follow symlinks
	info, err := os.Lstat(root)
	if err != nil {
		result.Error = err
		return result
	}

	// Skip symlinks at root level
	if info.Mode()&os.ModeSymlink != 0 {
		return result
	}

	// If it's a file, just return its size
	if !info.IsDir() {
		result.Size = info.Size()
		result.FileCount = 1
		return result
	}

	// Track seen inodes to avoid counting hardlinked files multiple times
	seenInodes := make(map[uint64]bool)

	// Walk the directory tree
	err = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			// Skip permission errors, continue walking
			return nil
		}

		// Check if it's a symlink and skip it
		if d.Type()&os.ModeSymlink != 0 {
			return nil // Skip symlinks entirely
		}

		if d.IsDir() {
			result.DirCount++
		} else {
			info, err := d.Info()
			if err == nil {
				// Get the inode and actual disk usage (handles sparse files and hardlinks)
				if stat, ok := info.Sys().(*syscall.Stat_t); ok {
					inode := stat.Ino
					// Skip if we've already counted this inode (hardlinks)
					if seenInodes[inode] {
						return nil
					}
					seenInodes[inode] = true
					// Use actual disk blocks instead of logical size (handles sparse files)
					// Blocks are in 512-byte units
					result.Size += stat.Blocks * 512
				} else {
					result.Size += info.Size()
				}
				result.FileCount++
			}
		}

		return nil
	})

	result.Error = err
	return result
}

// WalkDirectoryWithCallback walks a directory and reports progress
// It skips symlinks to avoid double-counting files
func WalkDirectoryWithCallback(root string, callback func(path string, size int64)) WalkResult {
	result := WalkResult{Path: root}

	// Use Lstat to not follow symlinks
	info, err := os.Lstat(root)
	if err != nil {
		result.Error = err
		return result
	}

	// Skip symlinks at root level
	if info.Mode()&os.ModeSymlink != 0 {
		return result
	}

	if !info.IsDir() {
		result.Size = info.Size()
		result.FileCount = 1
		if callback != nil {
			callback(root, result.Size)
		}
		return result
	}

	err = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}

		// Check if it's a symlink and skip it
		if d.Type()&os.ModeSymlink != 0 {
			return nil // Skip symlinks entirely
		}

		if d.IsDir() {
			result.DirCount++
			if callback != nil {
				callback(path, 0)
			}
		} else {
			info, err := d.Info()
			if err == nil {
				result.FileCount++
				result.Size += info.Size()
			}
		}

		return nil
	})

	result.Error = err
	return result
}

// ScanMultiplePaths scans multiple paths concurrently using a worker pool
func ScanMultiplePaths(paths []string, workers int) []WalkResult {
	if workers <= 0 {
		workers = 4
	}

	results := make([]WalkResult, len(paths))

	// Channel for job indices
	jobs := make(chan int, len(paths))

	// WaitGroup to track completion
	var wg sync.WaitGroup

	// Start worker goroutines
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range jobs {
				results[i] = WalkDirectory(paths[i])
			}
		}()
	}

	// Send jobs
	for i := range paths {
		jobs <- i
	}
	close(jobs)

	// Wait for all workers to finish
	wg.Wait()

	return results
}

// ScanMultiplePathsWithProgress scans paths and reports progress
func ScanMultiplePathsWithProgress(paths []string, workers int, callback ProgressCallback) []WalkResult {
	if workers <= 0 {
		workers = 4
	}

	results := make([]WalkResult, len(paths))
	jobs := make(chan int, len(paths))

	var wg sync.WaitGroup
	var mu sync.Mutex
	completed := 0

	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range jobs {
				results[i] = WalkDirectory(paths[i])

				if callback != nil {
					mu.Lock()
					completed++
					callback(ScanProgress{
						Current:      completed,
						Total:        len(paths),
						CurrentPath:  paths[i],
						BytesScanned: results[i].Size,
					})
					mu.Unlock()
				}
			}
		}()
	}

	for i := range paths {
		jobs <- i
	}
	close(jobs)

	wg.Wait()

	return results
}

// GetDirectoryItems returns immediate children of a directory with their sizes
// It skips symlinks to avoid double-counting files
func GetDirectoryItems(root string) ([]FileNode, error) {
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil, err
	}

	items := make([]FileNode, 0, len(entries))

	for _, entry := range entries {
		// Skip symlinks entirely
		if entry.Type()&os.ModeSymlink != 0 {
			continue
		}

		path := filepath.Join(root, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		node := FileNode{
			Name:    entry.Name(),
			Path:    path,
			IsDir:   entry.IsDir(),
			ModTime: info.ModTime(),
		}

		if entry.IsDir() {
			// Calculate directory size
			result := WalkDirectory(path)
			node.Size = result.Size
		} else {
			// Use actual disk blocks for sparse file support
			if stat, ok := info.Sys().(*syscall.Stat_t); ok {
				node.Size = stat.Blocks * 512
			} else {
				node.Size = info.Size()
			}
		}

		items = append(items, node)
	}

	return items, nil
}

// FormatSize converts bytes to human-readable format
func FormatSize(bytes int64) string {
	const (
		KB = 1024
		MB = KB * 1024
		GB = MB * 1024
		TB = GB * 1024
	)

	switch {
	case bytes >= TB:
		return formatFloat(float64(bytes)/float64(TB)) + " TB"
	case bytes >= GB:
		return formatFloat(float64(bytes)/float64(GB)) + " GB"
	case bytes >= MB:
		return formatFloat(float64(bytes)/float64(MB)) + " MB"
	case bytes >= KB:
		return formatFloat(float64(bytes)/float64(KB)) + " KB"
	default:
		return formatFloat(float64(bytes)) + " B"
	}
}

func formatFloat(f float64) string {
	if f >= 100 {
		return fmt.Sprintf("%.0f", f)
	} else if f >= 10 {
		return fmt.Sprintf("%.1f", f)
	}
	return fmt.Sprintf("%.2f", f)
}
