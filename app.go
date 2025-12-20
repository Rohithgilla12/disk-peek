package main

import (
	"context"
	"os"
	"os/exec"
	"strings"

	"disk-peek/internal/scanner"
	"disk-peek/internal/settings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct holds application state and dependencies
type App struct {
	ctx           context.Context
	devScanner    *scanner.DevScanner
	normalScanner *scanner.NormalScanner
	scanCancel    context.CancelFunc
	cleanCancel   context.CancelFunc
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		devScanner:    scanner.NewDevScanner(8),    // 8 concurrent workers
		normalScanner: scanner.NewNormalScanner(8), // 8 concurrent workers
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// CancelScan cancels any running scan operation
func (a *App) CancelScan() {
	if a.scanCancel != nil {
		a.scanCancel()
		a.scanCancel = nil
	}
	a.devScanner.Cancel()
	a.normalScanner.Cancel()
	runtime.EventsEmit(a.ctx, "scan:cancelled", nil)
}

// CancelClean cancels any running clean operation
func (a *App) CancelClean() {
	if a.cleanCancel != nil {
		a.cleanCancel()
		a.cleanCancel = nil
	}
	runtime.EventsEmit(a.ctx, "clean:cancelled", nil)
}

// --- Dev Mode Methods ---

// ScanDev performs a full Dev Mode scan of all categories
func (a *App) ScanDev() scanner.ScanResult {
	// Cancel any existing scan
	if a.scanCancel != nil {
		a.scanCancel()
	}

	// Create new context for this scan
	ctx, cancel := context.WithCancel(context.Background())
	a.scanCancel = cancel

	// Set up context and progress callback
	a.devScanner.SetContext(ctx)
	a.devScanner.SetProgressCallback(func(progress scanner.ScanProgress) {
		runtime.EventsEmit(a.ctx, "scan:progress", progress)
	})

	runtime.EventsEmit(a.ctx, "scan:started", nil)
	result := a.devScanner.Scan()

	// Check if cancelled
	if a.devScanner.IsCancelled() {
		return result
	}

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
	// Cancel any existing scan
	if a.scanCancel != nil {
		a.scanCancel()
	}

	// Create new context for this scan
	ctx, cancel := context.WithCancel(context.Background())
	a.scanCancel = cancel

	// Set up context and progress callback
	a.normalScanner.SetContext(ctx)
	a.normalScanner.SetProgressCallback(func(progress scanner.ScanProgress) {
		runtime.EventsEmit(a.ctx, "scan:progress", progress)
	})

	runtime.EventsEmit(a.ctx, "scan:started", nil)
	result := a.normalScanner.Scan()

	// Check if cancelled
	if a.normalScanner.IsCancelled() {
		return result
	}

	runtime.EventsEmit(a.ctx, "scan:completed:normal", result)
	return result
}

// ScanNormalPath performs a Normal Mode scan starting from a specific path
func (a *App) ScanNormalPath(path string) scanner.FullScanResult {
	// Cancel any existing scan
	if a.scanCancel != nil {
		a.scanCancel()
	}

	// Create new context for this scan
	ctx, cancel := context.WithCancel(context.Background())
	a.scanCancel = cancel

	// Set up context and progress callback
	a.normalScanner.SetContext(ctx)
	a.normalScanner.SetProgressCallback(func(progress scanner.ScanProgress) {
		runtime.EventsEmit(a.ctx, "scan:progress", progress)
	})

	runtime.EventsEmit(a.ctx, "scan:started", nil)
	result := a.normalScanner.ScanPath(path)

	// Check if cancelled
	if a.normalScanner.IsCancelled() {
		return result
	}

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

// --- Delete/Clean Methods ---

// DeletePaths is the unified method for deleting files/directories
// If permanent is true, uses os.RemoveAll for permanent deletion
// If permanent is false, moves to system Trash
// Emits progress events for batch operations
func (a *App) DeletePaths(paths []string, permanent bool) scanner.CleanResult {
	runtime.EventsEmit(a.ctx, "clean:started", nil)

	result := scanner.CleanResult{
		FreedBytes:     0,
		DeletedPaths:   []string{},
		Errors:         []string{},
		DetailedErrors: []scanner.CleanError{},
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

		// Check if path exists
		if _, err := os.Stat(path); os.IsNotExist(err) {
			continue // Skip non-existent paths
		}

		// Get size before deletion
		walkResult := scanner.WalkDirectory(path)
		size := walkResult.Size

		var err error
		if permanent {
			err = os.RemoveAll(path)
		} else {
			err = moveToTrash(path)
		}

		if err != nil {
			errorCode := getErrorCode(err)
			errorMsg := getErrorMessage(err, path)
			result.Errors = append(result.Errors, errorMsg)
			result.DetailedErrors = append(result.DetailedErrors, scanner.CleanError{
				Path:    path,
				Message: errorMsg,
				Code:    errorCode,
			})
			continue
		}

		result.FreedBytes += size
		result.DeletedPaths = append(result.DeletedPaths, path)
	}

	runtime.EventsEmit(a.ctx, "clean:completed", result)
	return result
}

// getErrorCode returns a code for the error type
func getErrorCode(err error) string {
	if os.IsPermission(err) {
		return "PERMISSION_DENIED"
	}
	if os.IsNotExist(err) {
		return "NOT_FOUND"
	}
	if os.IsExist(err) {
		return "ALREADY_EXISTS"
	}
	return "UNKNOWN"
}

// getErrorMessage returns a user-friendly error message
func getErrorMessage(err error, path string) string {
	if os.IsPermission(err) {
		return "Permission denied: " + truncatePath(path) + ". Try running with elevated permissions."
	}
	if os.IsNotExist(err) {
		return "File not found: " + truncatePath(path)
	}
	// Default to original error message
	return err.Error()
}

// DeletePath deletes a single path - convenience wrapper for DeletePaths
func (a *App) DeletePath(path string, permanent bool) scanner.CleanResult {
	return a.DeletePaths([]string{path}, permanent)
}

// CleanCategories cleans the specified category IDs
// Uses permanent delete setting from user preferences
func (a *App) CleanCategories(categoryIDs []string) scanner.CleanResult {
	// Get all categories and collect paths for the specified IDs
	categories := scanner.GetCategories()
	var pathsToClean []string

	for _, id := range categoryIDs {
		// Skip disabled categories
		if !settings.IsCategoryEnabled(id) {
			continue
		}
		cat := scanner.GetCategoryByID(categories, id)
		if cat == nil {
			continue
		}
		// Collect all paths from this category and its children
		collectPathsFromCategory(cat, &pathsToClean, nil)
	}

	// Remove duplicates and delete using user's preference
	permanent := settings.GetPermanentDelete()
	return a.DeletePaths(uniquePaths(pathsToClean), permanent)
}

// collectPathsFromCategory recursively collects all paths from a category
func collectPathsFromCategory(cat *scanner.Category, paths *[]string, sizes map[string]int64) {
	for _, path := range cat.Paths {
		*paths = append(*paths, path)
		if sizes != nil {
			sizes[path] = cat.Size
		}
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

	// Escape backslashes and double quotes for AppleScript string
	escapedPath := strings.ReplaceAll(path, `\`, `\\`)
	escapedPath = strings.ReplaceAll(escapedPath, `"`, `\"`)

	// Use macOS trash command via osascript for proper Trash behavior
	// This preserves the "Put Back" functionality
	cmd := exec.Command("osascript", "-e",
		`tell application "Finder" to delete POSIX file "`+escapedPath+`"`)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Fallback: try direct removal if Finder fails
		return os.RemoveAll(path)
	}
	_ = output
	return nil
}

// --- Settings Methods ---

// GetSettings returns the current settings
func (a *App) GetSettings() *settings.Settings {
	s, _ := settings.Load()
	return s
}

// SaveSettings saves the settings
func (a *App) SaveSettings(s *settings.Settings) error {
	return settings.Save(s)
}

// SetPermanentDelete sets the permanent delete preference
func (a *App) SetPermanentDelete(permanent bool) error {
	return settings.SetPermanentDelete(permanent)
}

// GetPermanentDelete returns whether permanent delete is enabled
func (a *App) GetPermanentDelete() bool {
	return settings.GetPermanentDelete()
}

// SetCategoryEnabled enables or disables a category
func (a *App) SetCategoryEnabled(categoryID string, enabled bool) error {
	return settings.SetCategoryEnabled(categoryID, enabled)
}

// IsCategoryEnabled returns whether a category is enabled
func (a *App) IsCategoryEnabled(categoryID string) bool {
	return settings.IsCategoryEnabled(categoryID)
}
