package scanner

import (
	"os"
	"path/filepath"
	"sort"
	"sync"
	"syscall"
	"time"
)

// NormalScanner scans the entire filesystem hierarchically
type NormalScanner struct {
	workers  int
	callback ProgressCallback
}

// NewNormalScanner creates a new NormalScanner with the specified number of workers
func NewNormalScanner(workers int) *NormalScanner {
	if workers <= 0 {
		workers = 4
	}
	return &NormalScanner{
		workers: workers,
	}
}

// SetProgressCallback sets a callback for progress updates
func (s *NormalScanner) SetProgressCallback(callback ProgressCallback) {
	s.callback = callback
}

// Scan performs a full scan starting from the user's home directory
func (s *NormalScanner) Scan() FullScanResult {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "/"
	}
	return s.ScanPath(homeDir)
}

// ScanPath performs a full scan starting from the specified path
func (s *NormalScanner) ScanPath(rootPath string) FullScanResult {
	start := time.Now()

	// Build the tree with immediate children
	root := s.buildTree(rootPath)

	return FullScanResult{
		Mode:         ModeNormal,
		Root:         root,
		TotalSize:    root.Size,
		ScanDuration: time.Since(start),
	}
}

// buildTree builds a FileNode tree for the given path
// It scans immediate children and calculates their sizes concurrently
// Symlinks are skipped to avoid double-counting files
func (s *NormalScanner) buildTree(rootPath string) *FileNode {
	// Use Lstat to not follow symlinks
	info, err := os.Lstat(rootPath)
	if err != nil {
		return &FileNode{
			Name:  filepath.Base(rootPath),
			Path:  rootPath,
			IsDir: false,
			Size:  0,
		}
	}

	// Skip symlinks
	if info.Mode()&os.ModeSymlink != 0 {
		return &FileNode{
			Name:  filepath.Base(rootPath),
			Path:  rootPath,
			IsDir: false,
			Size:  0,
		}
	}

	root := &FileNode{
		Name:    filepath.Base(rootPath),
		Path:    rootPath,
		IsDir:   info.IsDir(),
		ModTime: info.ModTime(),
	}

	if !info.IsDir() {
		root.Size = info.Size()
		return root
	}

	// Read directory entries
	entries, err := os.ReadDir(rootPath)
	if err != nil {
		return root
	}

	// Filter out symlinks first
	var realEntries []os.DirEntry
	for _, entry := range entries {
		if entry.Type()&os.ModeSymlink == 0 {
			realEntries = append(realEntries, entry)
		}
	}

	// Scan children concurrently
	type childResult struct {
		index int
		node  *FileNode
	}

	results := make(chan childResult, len(realEntries))
	var wg sync.WaitGroup

	// Worker pool
	jobs := make(chan int, len(realEntries))
	for w := 0; w < s.workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range jobs {
				entry := realEntries[i]
				childPath := filepath.Join(rootPath, entry.Name())

				childInfo, err := entry.Info()
				if err != nil {
					continue
				}

				node := &FileNode{
					Name:    entry.Name(),
					Path:    childPath,
					IsDir:   entry.IsDir(),
					ModTime: childInfo.ModTime(),
				}

				if entry.IsDir() {
					// Calculate directory size
					result := WalkDirectory(childPath)
					node.Size = result.Size
				} else {
					// Use actual disk blocks for sparse file support
					if stat, ok := childInfo.Sys().(*syscall.Stat_t); ok {
						node.Size = stat.Blocks * 512
					} else {
						node.Size = childInfo.Size()
					}
				}

				results <- childResult{index: i, node: node}

				// Report progress
				if s.callback != nil {
					s.callback(ScanProgress{
						CurrentPath:  childPath,
						BytesScanned: node.Size,
					})
				}
			}
		}()
	}

	// Send jobs
	for i := range realEntries {
		jobs <- i
	}
	close(jobs)

	// Collect results
	go func() {
		wg.Wait()
		close(results)
	}()

	// Build children slice
	children := make([]*FileNode, len(realEntries))
	for result := range results {
		children[result.index] = result.node
	}

	// Filter out nil entries (from errors) and calculate total size
	var totalSize int64
	validChildren := make([]*FileNode, 0, len(children))
	for _, child := range children {
		if child != nil {
			validChildren = append(validChildren, child)
			totalSize += child.Size
		}
	}

	// Sort by size descending
	sort.Slice(validChildren, func(i, j int) bool {
		return validChildren[i].Size > validChildren[j].Size
	})

	root.Children = validChildren
	root.Size = totalSize

	return root
}

// GetDirectoryChildren returns the immediate children of a directory
// This is used for lazy loading in the UI
// Symlinks are skipped to avoid double-counting files
func (s *NormalScanner) GetDirectoryChildren(path string) ([]*FileNode, error) {
	// Use Lstat to not follow symlinks
	info, err := os.Lstat(path)
	if err != nil {
		return nil, err
	}

	// Skip symlinks
	if info.Mode()&os.ModeSymlink != 0 {
		return nil, nil
	}

	if !info.IsDir() {
		return nil, nil
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	// Filter out symlinks first
	var realEntries []os.DirEntry
	for _, entry := range entries {
		if entry.Type()&os.ModeSymlink == 0 {
			realEntries = append(realEntries, entry)
		}
	}

	// Scan children concurrently
	type childResult struct {
		index int
		node  *FileNode
	}

	results := make(chan childResult, len(realEntries))
	var wg sync.WaitGroup

	// Worker pool
	jobs := make(chan int, len(realEntries))
	for w := 0; w < s.workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range jobs {
				entry := realEntries[i]
				childPath := filepath.Join(path, entry.Name())

				childInfo, err := entry.Info()
				if err != nil {
					continue
				}

				node := &FileNode{
					Name:    entry.Name(),
					Path:    childPath,
					IsDir:   entry.IsDir(),
					ModTime: childInfo.ModTime(),
				}

				if entry.IsDir() {
					result := WalkDirectory(childPath)
					node.Size = result.Size
				} else {
					// Use actual disk blocks for sparse file support
					if stat, ok := childInfo.Sys().(*syscall.Stat_t); ok {
						node.Size = stat.Blocks * 512
					} else {
						node.Size = childInfo.Size()
					}
				}

				results <- childResult{index: i, node: node}
			}
		}()
	}

	// Send jobs
	for i := range realEntries {
		jobs <- i
	}
	close(jobs)

	// Collect results
	go func() {
		wg.Wait()
		close(results)
	}()

	// Build children slice
	children := make([]*FileNode, len(realEntries))
	for result := range results {
		children[result.index] = result.node
	}

	// Filter out nil entries and sort by size
	validChildren := make([]*FileNode, 0, len(children))
	for _, child := range children {
		if child != nil {
			validChildren = append(validChildren, child)
		}
	}

	sort.Slice(validChildren, func(i, j int) bool {
		return validChildren[i].Size > validChildren[j].Size
	})

	return validChildren, nil
}

// QuickScan performs a faster scan that only shows top-level directories
func (s *NormalScanner) QuickScan() FullScanResult {
	return s.Scan()
}
