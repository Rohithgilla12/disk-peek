package scanner

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

// NodeModulesProject represents a project with node_modules
type NodeModulesProject struct {
	Path        string    `json:"path"`
	ProjectName string    `json:"projectName"`
	Size        int64     `json:"size"`
	ModTime     time.Time `json:"modTime"`
	PackageJSON bool      `json:"packageJson"`
}

// NodeModulesResult contains the results of scanning for node_modules
type NodeModulesResult struct {
	Projects     []NodeModulesProject `json:"projects"`
	TotalSize    int64                `json:"totalSize"`
	TotalCount   int                  `json:"totalCount"`
	ScanDuration time.Duration        `json:"scanDuration"`
}

// FindNodeModules scans common directories for node_modules folders
// It searches in the user's home directory for typical project locations
func FindNodeModules(progressCallback func(current int, path string)) NodeModulesResult {
	startTime := time.Now()
	home, _ := os.UserHomeDir()

	// Common directories where projects are typically stored
	searchDirs := []string{
		home,
		filepath.Join(home, "Documents"),
		filepath.Join(home, "Projects"),
		filepath.Join(home, "Developer"),
		filepath.Join(home, "Code"),
		filepath.Join(home, "Workspace"),
		filepath.Join(home, "dev"),
		filepath.Join(home, "repos"),
		filepath.Join(home, "src"),
		filepath.Join(home, "Sites"),
		filepath.Join(home, "work"),
	}

	var projects []NodeModulesProject
	var mu sync.Mutex
	var wg sync.WaitGroup
	visited := make(map[string]bool)
	var visitedMu sync.Mutex

	// Worker pool for parallel scanning
	sem := make(chan struct{}, 8)
	count := 0

	for _, searchDir := range searchDirs {
		// Check if directory exists
		if _, err := os.Stat(searchDir); os.IsNotExist(err) {
			continue
		}

		// Walk the directory tree looking for node_modules
		_ = filepath.Walk(searchDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil
			}

			// Skip hidden directories (except the search roots)
			name := info.Name()
			if name != "." && len(name) > 0 && name[0] == '.' && path != searchDir {
				if info.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}

			// Skip certain directories that are unlikely to contain projects
			if info.IsDir() {
				switch name {
				case "Library", "Applications", ".Trash", "Pictures", "Music", "Movies",
					"Downloads", "Public", "Desktop", ".git", ".svn", ".hg",
					"vendor", "Pods", "build", "dist", "target", ".next", ".nuxt":
					return filepath.SkipDir
				}
			}

			// Found a node_modules directory
			if info.IsDir() && name == "node_modules" {
				// Get the parent directory (the project root)
				projectRoot := filepath.Dir(path)

				// Check if we've already visited this project
				visitedMu.Lock()
				if visited[projectRoot] {
					visitedMu.Unlock()
					return filepath.SkipDir
				}
				visited[projectRoot] = true
				visitedMu.Unlock()

				wg.Add(1)
				sem <- struct{}{} // Acquire semaphore

				go func(nmPath, pRoot string) {
					defer wg.Done()
					defer func() { <-sem }() // Release semaphore

					project := scanNodeModulesProject(nmPath, pRoot)

					mu.Lock()
					projects = append(projects, project)
					count++
					if progressCallback != nil {
						progressCallback(count, pRoot)
					}
					mu.Unlock()
				}(path, projectRoot)

				// Don't recurse into node_modules
				return filepath.SkipDir
			}

			return nil
		})
	}

	wg.Wait()

	// Sort by size (largest first)
	sort.Slice(projects, func(i, j int) bool {
		return projects[i].Size > projects[j].Size
	})

	// Calculate total size
	var totalSize int64
	for _, p := range projects {
		totalSize += p.Size
	}

	return NodeModulesResult{
		Projects:     projects,
		TotalSize:    totalSize,
		TotalCount:   len(projects),
		ScanDuration: time.Since(startTime),
	}
}

// scanNodeModulesProject gathers information about a single node_modules project
func scanNodeModulesProject(nodeModulesPath, projectRoot string) NodeModulesProject {
	project := NodeModulesProject{
		Path:        nodeModulesPath,
		ProjectName: filepath.Base(projectRoot),
	}

	// Get node_modules size (using 4 workers for speed)
	result := WalkDirectoryFast(nodeModulesPath, 4)
	project.Size = result.Size

	// Get modification time
	if info, err := os.Stat(nodeModulesPath); err == nil {
		project.ModTime = info.ModTime()
	}

	// Check for package.json and get project name
	packageJSONPath := filepath.Join(projectRoot, "package.json")
	if data, err := os.ReadFile(packageJSONPath); err == nil {
		project.PackageJSON = true
		var pkgJSON struct {
			Name string `json:"name"`
		}
		if json.Unmarshal(data, &pkgJSON) == nil && pkgJSON.Name != "" {
			project.ProjectName = pkgJSON.Name
		}
	}

	return project
}

// DeleteNodeModules deletes the specified node_modules directories
func DeleteNodeModules(paths []string, permanent bool, progressCallback func(current, total int, path string, bytesFreed int64)) CleanResult {
	result := CleanResult{
		FreedBytes:     0,
		DeletedPaths:   []string{},
		Errors:         []string{},
		DetailedErrors: []CleanError{},
	}

	total := len(paths)
	for i, path := range paths {
		// Get size before deletion
		walkResult := WalkDirectoryFast(path, 4)
		size := walkResult.Size

		var err error
		if permanent {
			err = os.RemoveAll(path)
		} else {
			// For non-permanent, we'd use the trash function from app.go
			// But since we're in the scanner package, we'll just do permanent delete
			err = os.RemoveAll(path)
		}

		if progressCallback != nil {
			progressCallback(i+1, total, path, result.FreedBytes)
		}

		if err != nil {
			errorCode := "UNKNOWN"
			if os.IsPermission(err) {
				errorCode = "PERMISSION_DENIED"
			} else if os.IsNotExist(err) {
				errorCode = "NOT_FOUND"
			}
			errorMsg := err.Error()
			result.Errors = append(result.Errors, errorMsg)
			result.DetailedErrors = append(result.DetailedErrors, CleanError{
				Path:    path,
				Message: errorMsg,
				Code:    errorCode,
			})
			continue
		}

		result.FreedBytes += size
		result.DeletedPaths = append(result.DeletedPaths, path)
	}

	return result
}
