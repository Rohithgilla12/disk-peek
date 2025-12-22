package scanner

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestNewDevScanner(t *testing.T) {
	t.Run("with positive workers", func(t *testing.T) {
		scanner := NewDevScanner(8)
		if scanner == nil {
			t.Error("expected non-nil scanner")
			return
		}
		if scanner.workers != 8 {
			t.Errorf("workers = %d, want 8", scanner.workers)
		}
	})

	t.Run("with zero workers defaults to 4", func(t *testing.T) {
		scanner := NewDevScanner(0)
		if scanner.workers != 4 {
			t.Errorf("workers = %d, want 4", scanner.workers)
		}
	})

	t.Run("with negative workers defaults to 4", func(t *testing.T) {
		scanner := NewDevScanner(-1)
		if scanner.workers != 4 {
			t.Errorf("workers = %d, want 4", scanner.workers)
		}
	})
}

func TestDevScannerSetProgressCallback(t *testing.T) {
	scanner := NewDevScanner(4)

	callback := func(p ScanProgress) {
		// Callback function for testing
		_ = p
	}

	scanner.SetProgressCallback(callback)

	// We can't directly test the callback is set, but we can verify no panic
	if scanner.callback == nil {
		t.Error("callback should be set")
	}
}

func TestDevScannerScan(t *testing.T) {
	// Create a minimal scanner for testing
	scanner := NewDevScanner(2)

	t.Run("returns valid result structure", func(t *testing.T) {
		result := scanner.Scan()

		if result.Mode != ModeDev {
			t.Errorf("Mode = %s, want %s", result.Mode, ModeDev)
		}

		if len(result.Categories) == 0 {
			t.Error("expected non-empty categories")
		}

		if result.ScanDuration <= 0 {
			t.Error("expected positive scan duration")
		}
	})

	t.Run("categories have IDs", func(t *testing.T) {
		result := scanner.Scan()

		for _, cat := range result.Categories {
			if cat.ID == "" {
				t.Error("category has empty ID")
			}
		}
	})
}

func TestDevScannerQuickScan(t *testing.T) {
	scanner := NewDevScanner(2)

	result := scanner.QuickScan()

	if result.Mode != ModeDev {
		t.Errorf("Mode = %s, want %s", result.Mode, ModeDev)
	}

	if len(result.Categories) == 0 {
		t.Error("expected non-empty categories")
	}
}

func TestDevScannerScanCategory(t *testing.T) {
	scanner := NewDevScanner(2)

	t.Run("existing cross-platform category", func(t *testing.T) {
		// Scan node category (cross-platform)
		cat := scanner.ScanCategory("node")
		if cat == nil {
			t.Error("expected non-nil category")
			return
		}
		if cat.ID != "node" {
			t.Errorf("ID = %s, want node", cat.ID)
		}
	})

	t.Run("non-existent category returns nil", func(t *testing.T) {
		cat := scanner.ScanCategory("non-existent")
		if cat != nil {
			t.Error("expected nil for non-existent category")
		}
	})

	t.Run("leaf category", func(t *testing.T) {
		// npm-cache is a leaf category that exists on all platforms
		cat := scanner.ScanCategory("npm-cache")
		if cat == nil {
			t.Error("expected non-nil category")
			return
		}
		if cat.ID != "npm-cache" {
			t.Errorf("ID = %s, want npm-cache", cat.ID)
		}
	})

	t.Run("platform-specific category", func(t *testing.T) {
		var categoryID string
		switch runtime.GOOS {
		case "darwin":
			categoryID = "xcode"
		case "linux":
			categoryID = "snap"
		case "windows":
			categoryID = "windows-temp"
		default:
			t.Skip("unsupported platform")
			return
		}

		cat := scanner.ScanCategory(categoryID)
		if cat == nil {
			t.Errorf("expected non-nil category for %s on %s", categoryID, runtime.GOOS)
			return
		}
		if cat.ID != categoryID {
			t.Errorf("ID = %s, want %s", cat.ID, categoryID)
		}
	})
}

func TestDevScannerGetCategoryItems(t *testing.T) {
	scanner := NewDevScanner(2)

	t.Run("nil for non-existent category", func(t *testing.T) {
		items, err := scanner.GetCategoryItems("non-existent")
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
		if items != nil {
			t.Error("expected nil items for non-existent category")
		}
	})

	t.Run("returns items for existing category", func(t *testing.T) {
		// This will return empty or error if the path doesn't exist
		// but shouldn't panic
		_, err := scanner.GetCategoryItems("npm-cache")
		// We don't check the error because the path might not exist
		_ = err
	})
}

func TestDevScannerWithTempDirectory(t *testing.T) {
	// Create a temporary directory structure that mimics npm cache
	tmpDir := t.TempDir()

	// Create a fake npm cache structure
	npmDir := filepath.Join(tmpDir, ".npm")
	if err := os.MkdirAll(npmDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Create some files
	for i := 0; i < 5; i++ {
		file := filepath.Join(npmDir, "cache"+string(rune('0'+i))+".json")
		if err := os.WriteFile(file, []byte("{}"), 0644); err != nil {
			t.Fatal(err)
		}
	}

	// Note: We can't easily test scanning this because the scanner
	// uses the real home directory paths. This test just ensures
	// the basic structure works.
	scanner := NewDevScanner(2)
	result := scanner.Scan()

	// Basic validation
	if result.Mode != ModeDev {
		t.Errorf("Mode = %s, want dev", result.Mode)
	}
}

func TestDevScannerProgressCallback(t *testing.T) {
	scanner := NewDevScanner(2)

	var progressUpdates []ScanProgress
	scanner.SetProgressCallback(func(p ScanProgress) {
		progressUpdates = append(progressUpdates, p)
	})

	result := scanner.Scan()

	// Verify scan completed
	if result.Mode != ModeDev {
		t.Error("scan should complete")
	}

	// Progress updates might be empty if no paths exist
	// but at least the scan should complete without panic
}

func TestParentSizeCalculation(t *testing.T) {
	// Test that parent categories correctly sum their children's sizes
	scanner := NewDevScanner(2)
	result := scanner.Scan()

	for _, cat := range result.Categories {
		if len(cat.Children) > 0 {
			// Parent with children should have size >= sum of children
			var childSum int64
			for _, child := range cat.Children {
				childSum += child.Size
			}

			if cat.Size != childSum {
				t.Errorf("category %s: size %d != sum of children %d",
					cat.ID, cat.Size, childSum)
			}
		}
	}
}
