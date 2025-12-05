package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"disk-peek/internal/scanner"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct holds application state and dependencies
type App struct {
	ctx           context.Context
	devScanner    *scanner.DevScanner
	normalScanner *scanner.NormalScanner
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

// --- Clean Methods (placeholder for now) ---

// CleanPaths deletes the specified paths (moves to Trash)
func (a *App) CleanPaths(paths []string) (scanner.CleanResult, error) {
	// TODO: Implement with cleaner package
	return scanner.CleanResult{
		FreedBytes:   0,
		DeletedPaths: []string{},
	}, nil
}

// --- Debug Methods ---

// ExportScanToJSON exports the normal scan results to a JSON file for debugging
func (a *App) ExportScanToJSON() (string, error) {
	// Run a scan and export results
	result := a.normalScanner.Scan()

	// Create output file in Downloads
	home, _ := os.UserHomeDir()
	filename := filepath.Join(home, "Downloads", "disk-peek-debug-"+time.Now().Format("2006-01-02-150405")+".json")

	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", err
	}

	err = os.WriteFile(filename, data, 0644)
	if err != nil {
		return "", err
	}

	return filename, nil
}

// DebugScanFolder scans a single folder and returns detailed info
func (a *App) DebugScanFolder(path string) map[string]interface{} {
	result := scanner.WalkDirectory(path)

	return map[string]interface{}{
		"path":      path,
		"size":      result.Size,
		"sizeHuman": scanner.FormatSize(result.Size),
		"fileCount": result.FileCount,
		"dirCount":  result.DirCount,
		"error":     result.Error,
	}
}
