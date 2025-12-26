package scanner

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"
)

// LargeFile represents a file that exceeds the size threshold
type LargeFile struct {
	Path    string    `json:"path"`
	Name    string    `json:"name"`
	Size    int64     `json:"size"`
	ModTime time.Time `json:"modTime"`
	IsDir   bool      `json:"isDir"`
}

// LargeFilesResult contains the results of scanning for large files
type LargeFilesResult struct {
	Files        []LargeFile   `json:"files"`
	TotalSize    int64         `json:"totalSize"`
	TotalCount   int           `json:"totalCount"`
	ScanDuration time.Duration `json:"scanDuration"`
	Threshold    int64         `json:"threshold"`
}

// LargeFilesOptions configures the large file scan
type LargeFilesOptions struct {
	// MinSize is the minimum file size in bytes to include
	MinSize int64
	// MaxResults limits the number of results returned (0 = no limit)
	MaxResults int
	// IncludeDirectories includes directories in results
	IncludeDirectories bool
	// ExcludePatterns are glob patterns to exclude
	ExcludePatterns []string
	// FileTypes filters by extension (e.g., ".dmg", ".zip")
	FileTypes []string
}

// DefaultLargeFilesOptions returns sensible defaults
func DefaultLargeFilesOptions() LargeFilesOptions {
	return LargeFilesOptions{
		MinSize:            100 * 1024 * 1024, // 100 MB
		MaxResults:         100,
		IncludeDirectories: false,
		ExcludePatterns: []string{
			".Trash",
			"Library/Caches",
			"node_modules",
			".git",
			"Library/Group Containers",
			"Library/Containers/com.docker.docker",
			".orbstack",
			".docker",
			".lima",
			".colima",
		},
	}
}

// FindLargeFiles scans for files larger than the specified threshold
func FindLargeFiles(rootPath string, options LargeFilesOptions, progressCallback func(scanned int, currentPath string)) LargeFilesResult {
	startTime := time.Now()

	if rootPath == "" {
		rootPath, _ = os.UserHomeDir()
	}

	files := make([]LargeFile, 0)
	var mu sync.Mutex
	var scanned int

	// Walk the directory tree
	_ = filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		// Use Lstat to get info without following symlinks
		linfo, lerr := os.Lstat(path)
		if lerr != nil {
			return nil
		}

		// Skip symlinks entirely to avoid double-counting and virtual disk issues
		if linfo.Mode()&os.ModeSymlink != 0 {
			return nil
		}

		// Skip excluded patterns
		for _, pattern := range options.ExcludePatterns {
			if strings.Contains(path, pattern) {
				if linfo.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}
		}

		// Skip hidden files/directories (except root)
		name := linfo.Name()
		if path != rootPath && len(name) > 0 && name[0] == '.' {
			if linfo.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		scanned++
		if progressCallback != nil && scanned%100 == 0 {
			progressCallback(scanned, path)
		}

		// Check if it's a directory
		if linfo.IsDir() {
			if !options.IncludeDirectories {
				return nil
			}
			// For directories, calculate total size
			dirSize := calculateDirSize(path)
			if dirSize >= options.MinSize {
				mu.Lock()
				files = append(files, LargeFile{
					Path:    path,
					Name:    name,
					Size:    dirSize,
					ModTime: linfo.ModTime(),
					IsDir:   true,
				})
				mu.Unlock()
			}
			return nil
		}

		// Get actual disk usage (handles sparse files correctly)
		var fileSize int64
		if stat, ok := linfo.Sys().(*syscall.Stat_t); ok {
			// Use actual disk blocks instead of logical size
			fileSize = stat.Blocks * 512
		} else {
			fileSize = linfo.Size()
		}

		// Check file size against threshold
		if fileSize < options.MinSize {
			return nil
		}

		// Filter by file type if specified
		if len(options.FileTypes) > 0 {
			ext := strings.ToLower(filepath.Ext(name))
			found := false
			for _, ft := range options.FileTypes {
				if ext == strings.ToLower(ft) {
					found = true
					break
				}
			}
			if !found {
				return nil
			}
		}

		mu.Lock()
		files = append(files, LargeFile{
			Path:    path,
			Name:    name,
			Size:    fileSize,
			ModTime: linfo.ModTime(),
			IsDir:   false,
		})
		mu.Unlock()

		return nil
	})

	// Sort by size (largest first)
	sort.Slice(files, func(i, j int) bool {
		return files[i].Size > files[j].Size
	})

	// Limit results
	if options.MaxResults > 0 && len(files) > options.MaxResults {
		files = files[:options.MaxResults]
	}

	// Calculate total size
	var totalSize int64
	for _, f := range files {
		totalSize += f.Size
	}

	return LargeFilesResult{
		Files:        files,
		TotalSize:    totalSize,
		TotalCount:   len(files),
		ScanDuration: time.Since(startTime),
		Threshold:    options.MinSize,
	}
}

// calculateDirSize calculates the total size of a directory
// It skips symlinks and uses actual disk blocks for sparse files
func calculateDirSize(path string) int64 {
	var size int64
	_ = filepath.Walk(path, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		// Use Lstat to not follow symlinks
		linfo, lerr := os.Lstat(p)
		if lerr != nil {
			return nil
		}
		// Skip symlinks
		if linfo.Mode()&os.ModeSymlink != 0 {
			return nil
		}
		if !linfo.IsDir() {
			// Use actual disk blocks for sparse file support
			if stat, ok := linfo.Sys().(*syscall.Stat_t); ok {
				size += stat.Blocks * 512
			} else {
				size += linfo.Size()
			}
		}
		return nil
	})
	return size
}

// Common large file categories for quick filtering
var LargeFileCategories = map[string][]string{
	"disk-images": {".dmg", ".iso", ".img", ".vhd", ".vmdk"},
	"archives":    {".zip", ".tar", ".gz", ".rar", ".7z", ".bz2", ".xz"},
	"videos":      {".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm"},
	"backups":     {".bak", ".backup", ".old", ".tmp"},
	"databases":   {".db", ".sqlite", ".sql", ".mdb"},
}

// GetLargeFileCategory returns the category for a file extension
func GetLargeFileCategory(ext string) string {
	ext = strings.ToLower(ext)
	for category, extensions := range LargeFileCategories {
		for _, e := range extensions {
			if ext == e {
				return category
			}
		}
	}
	return "other"
}
