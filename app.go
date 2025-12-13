package main

import (
	"context"
	"os"
	"os/exec"

	"disk-peek/internal/scanner"
	"disk-peek/internal/updater"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct holds application state and dependencies
type App struct {
	ctx           context.Context
	devScanner    *scanner.DevScanner
	normalScanner *scanner.NormalScanner
	updater       *updater.Updater
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		devScanner:    scanner.NewDevScanner(8),    // 8 concurrent workers
		normalScanner: scanner.NewNormalScanner(8), // 8 concurrent workers
		updater:       updater.NewUpdater(),
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// --- Dev Mode Methods ---

// ScanDev performs a full Dev Mode scan of all categories
func (a *App) ScanDev() scanner.ScanResult {
	// Set up progress callback to emit events
	a.devScanner.SetProgressCallback(func(progress scanner.ScanProgress) {
		runtime.EventsEmit(a.ctx, "scan:progress", progress)
	})

	runtime.EventsEmit(a.ctx, "scan:started", nil)
	result := a.devScanner.Scan()
	runtime.EventsEmit(a.ctx, "scan:completed", result)

	return result
}

// QuickScanDev performs a faster scan (parallel, no detailed progress)
func (a *App) QuickScanDev() scanner.ScanResult {
	runtime.EventsEmit(a.ctx, "scan:started", nil)
	result := a.devScanner.QuickScan()
	runtime.EventsEmit(a.ctx, "scan:completed", result)
	return result
}

// GetDevCategories returns the category structure for display
func (a *App) GetDevCategories() []scanner.Category {
	return scanner.GetCategories()
}

// ScanCategory scans a single category by ID
func (a *App) ScanCategory(categoryID string) *scanner.Category {
	return a.devScanner.ScanCategory(categoryID)
}

// GetCategoryItems returns detailed items within a category
func (a *App) GetCategoryItems(categoryID string) ([]scanner.FileNode, error) {
	return a.devScanner.GetCategoryItems(categoryID)
}

// --- Normal Mode Methods ---

// ScanNormal performs a full Normal Mode scan starting from home directory
func (a *App) ScanNormal() scanner.FullScanResult {
	// Set up progress callback to emit events
	a.normalScanner.SetProgressCallback(func(progress scanner.ScanProgress) {
		runtime.EventsEmit(a.ctx, "scan:progress", progress)
	})

	runtime.EventsEmit(a.ctx, "scan:started", nil)
	result := a.normalScanner.Scan()
	runtime.EventsEmit(a.ctx, "scan:completed:normal", result)

	return result
}

// ScanNormalPath performs a Normal Mode scan starting from a specific path
func (a *App) ScanNormalPath(path string) scanner.FullScanResult {
	a.normalScanner.SetProgressCallback(func(progress scanner.ScanProgress) {
		runtime.EventsEmit(a.ctx, "scan:progress", progress)
	})

	runtime.EventsEmit(a.ctx, "scan:started", nil)
	result := a.normalScanner.ScanPath(path)
	runtime.EventsEmit(a.ctx, "scan:completed:normal", result)

	return result
}

// GetDirectoryChildren returns the children of a directory for lazy loading
func (a *App) GetDirectoryChildren(path string) ([]*scanner.FileNode, error) {
	return a.normalScanner.GetDirectoryChildren(path)
}

// --- Utility Methods ---

// GetHomeDir returns the user's home directory
func (a *App) GetHomeDir() string {
	home, _ := os.UserHomeDir()
	return home
}

// FormatSize converts bytes to human-readable format
func (a *App) FormatSize(bytes int64) string {
	return scanner.FormatSize(bytes)
}

// --- Clean Methods ---

// CleanCategories cleans the specified category IDs with progress reporting
func (a *App) CleanCategories(categoryIDs []string) scanner.CleanResult {
	runtime.EventsEmit(a.ctx, "clean:started", nil)

	// Get all categories and collect paths for the specified IDs
	categories := scanner.GetCategories()
	var pathsToClean []string
	pathSizes := make(map[string]int64)

	for _, id := range categoryIDs {
		cat := scanner.GetCategoryByID(categories, id)
		if cat == nil {
			continue
		}
		// Collect all paths from this category and its children
		collectPathsFromCategory(cat, &pathsToClean, pathSizes)
	}

	// Remove duplicates
	pathsToClean = uniquePaths(pathsToClean)

	result := scanner.CleanResult{
		FreedBytes:   0,
		DeletedPaths: []string{},
		Errors:       []string{},
	}

	total := len(pathsToClean)
	for i, path := range pathsToClean {
		// Emit progress
		progress := scanner.CleanProgress{
			Current:     i + 1,
			Total:       total,
			CurrentPath: path,
			BytesFreed:  result.FreedBytes,
			CurrentItem: truncatePath(path),
		}
		runtime.EventsEmit(a.ctx, "clean:progress", progress)

		// Get size before deletion
		size := pathSizes[path]
		if size == 0 {
			walkResult := scanner.WalkDirectory(path)
			size = walkResult.Size
		}

		// Move to trash instead of permanent delete
		err := moveToTrash(path)
		if err != nil {
			result.Errors = append(result.Errors, err.Error())
			continue
		}

		result.FreedBytes += size
		result.DeletedPaths = append(result.DeletedPaths, path)
	}

	runtime.EventsEmit(a.ctx, "clean:completed", result)
	return result
}

// collectPathsFromCategory recursively collects all paths from a category
func collectPathsFromCategory(cat *scanner.Category, paths *[]string, sizes map[string]int64) {
	for _, path := range cat.Paths {
		*paths = append(*paths, path)
		sizes[path] = cat.Size
	}
	for i := range cat.Children {
		collectPathsFromCategory(&cat.Children[i], paths, sizes)
	}
}

// uniquePaths removes duplicate paths
func uniquePaths(paths []string) []string {
	seen := make(map[string]bool)
	result := []string{}
	for _, path := range paths {
		if !seen[path] {
			seen[path] = true
			result = append(result, path)
		}
	}
	return result
}

// truncatePath shortens a path for display
func truncatePath(path string) string {
	parts := []string{}
	for _, part := range []byte(path) {
		if part == '/' {
			parts = append(parts, "")
		}
	}
	// Simple truncation - show last 3 components
	pathParts := splitPath(path)
	if len(pathParts) <= 3 {
		return path
	}
	return ".../" + joinPath(pathParts[len(pathParts)-3:])
}

func splitPath(path string) []string {
	result := []string{}
	current := ""
	for _, c := range path {
		if c == '/' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(c)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

func joinPath(parts []string) string {
	result := ""
	for i, part := range parts {
		if i > 0 {
			result += "/"
		}
		result += part
	}
	return result
}

// moveToTrash moves a file/directory to the system trash
func moveToTrash(path string) error {
	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil // Already doesn't exist, consider it success
	}

	// Use macOS trash command via osascript for proper Trash behavior
	// This preserves the "Put Back" functionality
	cmd := exec.Command("osascript", "-e", 
		`tell application "Finder" to delete POSIX file "`+path+`"`)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Fallback: try direct removal if Finder fails
		return os.RemoveAll(path)
	}
	_ = output
	return nil
}

// CleanPaths deletes the specified paths (moves to Trash) - legacy method
func (a *App) CleanPaths(paths []string) (scanner.CleanResult, error) {
	runtime.EventsEmit(a.ctx, "clean:started", nil)

	result := scanner.CleanResult{
		FreedBytes:   0,
		DeletedPaths: []string{},
		Errors:       []string{},
	}

	total := len(paths)
	for i, path := range paths {
		// Emit progress
		progress := scanner.CleanProgress{
			Current:     i + 1,
			Total:       total,
			CurrentPath: path,
			BytesFreed:  result.FreedBytes,
			CurrentItem: truncatePath(path),
		}
		runtime.EventsEmit(a.ctx, "clean:progress", progress)

		// Get size before deletion
		walkResult := scanner.WalkDirectory(path)
		size := walkResult.Size

		// Move to trash
		err := moveToTrash(path)
		if err != nil {
			result.Errors = append(result.Errors, err.Error())
			continue
		}

		result.FreedBytes += size
		result.DeletedPaths = append(result.DeletedPaths, path)
	}

	runtime.EventsEmit(a.ctx, "clean:completed", result)
	return result, nil
}

// --- Update Methods ---

// GetAppVersion returns the current application version
func (a *App) GetAppVersion() string {
	return a.updater.GetCurrentVersion()
}

// GetVersionInfo returns detailed version information
func (a *App) GetVersionInfo() map[string]string {
	return a.updater.GetVersionInfo()
}

// CheckForUpdates checks GitHub for available updates
func (a *App) CheckForUpdates() (*updater.UpdateInfo, error) {
	return a.updater.CheckForUpdates()
}

// DownloadUpdate downloads the update and returns the path to the DMG
func (a *App) DownloadUpdate(downloadURL string) (string, error) {
	var lastProgress updater.DownloadProgress

	dmgPath, err := a.updater.DownloadUpdate(downloadURL, func(progress updater.DownloadProgress) {
		// Only emit events every 1% to avoid flooding
		if progress.Percent-lastProgress.Percent >= 1 || progress.Percent >= 100 {
			runtime.EventsEmit(a.ctx, "update:download-progress", progress)
			lastProgress = progress
		}
	})

	if err != nil {
		return "", err
	}

	runtime.EventsEmit(a.ctx, "update:download-complete", dmgPath)
	return dmgPath, nil
}

// InstallUpdate opens the downloaded DMG for installation
func (a *App) InstallUpdate(dmgPath string) error {
	return a.updater.InstallUpdate(dmgPath)
}

// OpenReleasePage opens the GitHub release page in the browser
func (a *App) OpenReleasePage(url string) error {
	return a.updater.OpenReleasePage(url)
}
