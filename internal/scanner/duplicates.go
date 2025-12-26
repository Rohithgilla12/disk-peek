package scanner

import (
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

// DuplicateFile represents a file that has duplicates
type DuplicateFile struct {
	Path    string    `json:"path"`
	Name    string    `json:"name"`
	Size    int64     `json:"size"`
	ModTime time.Time `json:"modTime"`
	Hash    string    `json:"hash"`
}

// DuplicateGroup represents a group of duplicate files
type DuplicateGroup struct {
	Hash       string          `json:"hash"`
	Size       int64           `json:"size"`
	Files      []DuplicateFile `json:"files"`
	WastedSize int64           `json:"wastedSize"` // Size * (Count - 1)
}

// DuplicatesResult contains the results of duplicate file scanning
type DuplicatesResult struct {
	Groups       []DuplicateGroup `json:"groups"`
	TotalWasted  int64            `json:"totalWasted"`
	TotalFiles   int              `json:"totalFiles"`
	TotalGroups  int              `json:"totalGroups"`
	ScanDuration time.Duration    `json:"scanDuration"`
}

// DuplicatesOptions configures the duplicate scan
type DuplicatesOptions struct {
	// MinSize is the minimum file size to consider (skip tiny files)
	MinSize int64
	// MaxSize is the maximum file size to consider (0 = no limit)
	MaxSize int64
	// ExcludePatterns are patterns to exclude
	ExcludePatterns []string
	// IncludePatterns limits to specific patterns (empty = all)
	IncludePatterns []string
	// MaxGroups limits the number of duplicate groups returned
	MaxGroups int
	// Workers for parallel hashing
	Workers int
}

// DefaultDuplicatesOptions returns sensible defaults
func DefaultDuplicatesOptions() DuplicatesOptions {
	return DuplicatesOptions{
		MinSize: 1024, // 1 KB minimum
		MaxSize: 0,    // No maximum
		ExcludePatterns: []string{
			".git",
			"node_modules",
			".Trash",
			"Library/Caches",
		},
		MaxGroups: 100,
		Workers:   4,
	}
}

// FindDuplicates scans for duplicate files based on content hash
func FindDuplicates(rootPath string, options DuplicatesOptions, progressCallback func(phase string, current int, total int)) DuplicatesResult {
	startTime := time.Now()

	if rootPath == "" {
		rootPath, _ = os.UserHomeDir()
	}

	// Phase 1: Group files by size (quick filter)
	if progressCallback != nil {
		progressCallback("scanning", 0, 0)
	}

	sizeGroups := make(map[int64][]string)
	var scanned int

	_ = filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		// Use Lstat to check for symlinks
		linfo, lerr := os.Lstat(path)
		if lerr != nil {
			return nil
		}

		// Skip symlinks to avoid infinite loops and double-counting
		if linfo.Mode()&os.ModeSymlink != 0 {
			return nil
		}

		// Skip directories
		if info.IsDir() {
			// Check exclusion patterns for directories
			for _, pattern := range options.ExcludePatterns {
				if strings.Contains(path, pattern) {
					return filepath.SkipDir
				}
			}
			return nil
		}

		// Skip hidden files
		name := info.Name()
		if len(name) > 0 && name[0] == '.' {
			return nil
		}

		// Skip excluded patterns
		for _, pattern := range options.ExcludePatterns {
			if strings.Contains(path, pattern) {
				return nil
			}
		}

		size := info.Size()

		// Check size constraints
		if size < options.MinSize {
			return nil
		}
		if options.MaxSize > 0 && size > options.MaxSize {
			return nil
		}

		sizeGroups[size] = append(sizeGroups[size], path)
		scanned++

		if progressCallback != nil && scanned%1000 == 0 {
			progressCallback("scanning", scanned, 0)
		}

		return nil
	})

	// Filter to only size groups with potential duplicates
	var potentialDuplicates [][]string
	for _, paths := range sizeGroups {
		if len(paths) > 1 {
			potentialDuplicates = append(potentialDuplicates, paths)
		}
	}

	// Phase 2: Hash files with same size
	if progressCallback != nil {
		progressCallback("hashing", 0, len(potentialDuplicates))
	}

	hashGroups := make(map[string][]DuplicateFile)
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, options.Workers)

	groupsProcessed := 0
	for _, paths := range potentialDuplicates {
		for _, path := range paths {
			wg.Add(1)
			sem <- struct{}{}

			go func(filePath string) {
				defer wg.Done()
				defer func() { <-sem }()

				hash, err := hashFile(filePath)
				if err != nil {
					return
				}

				info, err := os.Stat(filePath)
				if err != nil {
					return
				}

				file := DuplicateFile{
					Path:    filePath,
					Name:    filepath.Base(filePath),
					Size:    info.Size(),
					ModTime: info.ModTime(),
					Hash:    hash,
				}

				mu.Lock()
				hashGroups[hash] = append(hashGroups[hash], file)
				mu.Unlock()
			}(path)
		}

		groupsProcessed++
		if progressCallback != nil {
			progressCallback("hashing", groupsProcessed, len(potentialDuplicates))
		}
	}

	wg.Wait()

	// Phase 3: Build duplicate groups
	var groups []DuplicateGroup
	var totalWasted int64
	var totalFiles int

	for hash, files := range hashGroups {
		if len(files) < 2 {
			continue
		}

		// Sort files by modification time (oldest first)
		sort.Slice(files, func(i, j int) bool {
			return files[i].ModTime.Before(files[j].ModTime)
		})

		size := files[0].Size
		wastedSize := size * int64(len(files)-1)

		groups = append(groups, DuplicateGroup{
			Hash:       hash,
			Size:       size,
			Files:      files,
			WastedSize: wastedSize,
		})

		totalWasted += wastedSize
		totalFiles += len(files)
	}

	// Sort groups by wasted size (largest first)
	sort.Slice(groups, func(i, j int) bool {
		return groups[i].WastedSize > groups[j].WastedSize
	})

	// Limit groups
	if options.MaxGroups > 0 && len(groups) > options.MaxGroups {
		groups = groups[:options.MaxGroups]
	}

	return DuplicatesResult{
		Groups:       groups,
		TotalWasted:  totalWasted,
		TotalFiles:   totalFiles,
		TotalGroups:  len(groups),
		ScanDuration: time.Since(startTime),
	}
}

// hashFile calculates the MD5 hash of a file
// Always hashes the full file to avoid false positives that could lead to data loss
func hashFile(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// DeleteDuplicates deletes duplicate files, keeping the specified index in each group
// If keepIndex is -1, keeps the first (oldest) file
func DeleteDuplicates(groups []DuplicateGroup, keepIndex int, permanent bool, trashFunc func(string) error) CleanResult {
	result := CleanResult{
		FreedBytes:     0,
		DeletedPaths:   []string{},
		Errors:         []string{},
		DetailedErrors: []CleanError{},
	}

	for _, group := range groups {
		// Determine which file to keep
		keepIdx := keepIndex
		if keepIdx < 0 || keepIdx >= len(group.Files) {
			keepIdx = 0 // Default to keeping the first (oldest) file
		}

		for i, file := range group.Files {
			// Skip the file we want to keep
			if i == keepIdx {
				continue
			}

			var err error
			if permanent {
				err = os.Remove(file.Path)
			} else if trashFunc != nil {
				err = trashFunc(file.Path)
			} else {
				err = os.Remove(file.Path)
			}

			if err != nil {
				result.Errors = append(result.Errors, err.Error())
				result.DetailedErrors = append(result.DetailedErrors, CleanError{
					Path:    file.Path,
					Message: err.Error(),
					Code:    "DELETE_FAILED",
				})
				continue
			}

			result.FreedBytes += file.Size
			result.DeletedPaths = append(result.DeletedPaths, file.Path)
		}
	}

	return result
}
