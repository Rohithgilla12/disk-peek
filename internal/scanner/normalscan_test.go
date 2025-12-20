package scanner

import (
	"os"
	"path/filepath"
	"testing"
)

func TestNewNormalScanner(t *testing.T) {
	t.Run("with positive workers", func(t *testing.T) {
		scanner := NewNormalScanner(8)
		if scanner == nil {
			t.Error("expected non-nil scanner")
			return
		}
		if scanner.workers != 8 {
			t.Errorf("workers = %d, want 8", scanner.workers)
		}
	})

	t.Run("with zero workers uses default", func(t *testing.T) {
		scanner := NewNormalScanner(0)
		// Should use runtime.NumCPU() * 2, which will be > 0
		if scanner.workers <= 0 {
			t.Errorf("workers = %d, want > 0", scanner.workers)
		}
	})

	t.Run("with negative workers uses default", func(t *testing.T) {
		scanner := NewNormalScanner(-1)
		if scanner.workers <= 0 {
			t.Errorf("workers = %d, want > 0", scanner.workers)
		}
	})
}

func TestNormalScannerSetProgressCallback(t *testing.T) {
	scanner := NewNormalScanner(4)

	callback := func(p ScanProgress) {}
	scanner.SetProgressCallback(callback)

	if scanner.callback == nil {
		t.Error("callback should be set")
	}
}

func TestNormalScannerScanPath(t *testing.T) {
	// Create a temporary directory structure
	tmpDir := t.TempDir()

	// Create subdirectories
	subDir1 := filepath.Join(tmpDir, "subdir1")
	subDir2 := filepath.Join(tmpDir, "subdir2")
	if err := os.Mkdir(subDir1, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(subDir2, 0755); err != nil {
		t.Fatal(err)
	}

	// Create files
	file1 := filepath.Join(tmpDir, "file1.txt")
	file2 := filepath.Join(subDir1, "file2.txt")
	largeContent := make([]byte, 1000)
	smallContent := make([]byte, 100)

	if err := os.WriteFile(file1, largeContent, 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(file2, smallContent, 0644); err != nil {
		t.Fatal(err)
	}

	scanner := NewNormalScanner(4)

	t.Run("basic scan", func(t *testing.T) {
		result := scanner.ScanPath(tmpDir)

		if result.Mode != ModeNormal {
			t.Errorf("Mode = %s, want %s", result.Mode, ModeNormal)
		}

		if result.Root == nil {
			t.Error("Root should not be nil")
			return
		}

		if result.Root.Path != tmpDir {
			t.Errorf("Root.Path = %s, want %s", result.Root.Path, tmpDir)
		}

		if !result.Root.IsDir {
			t.Error("Root should be a directory")
		}

		if result.TotalSize <= 0 {
			t.Error("TotalSize should be > 0")
		}

		if result.ScanDuration <= 0 {
			t.Error("ScanDuration should be > 0")
		}
	})

	t.Run("children are populated", func(t *testing.T) {
		result := scanner.ScanPath(tmpDir)

		if len(result.Root.Children) == 0 {
			t.Error("Root should have children")
			return
		}

		// Should have 3 children: subdir1, subdir2, file1.txt
		if len(result.Root.Children) != 3 {
			t.Errorf("len(children) = %d, want 3", len(result.Root.Children))
		}
	})

	t.Run("children sorted by size descending", func(t *testing.T) {
		result := scanner.ScanPath(tmpDir)

		for i := 0; i < len(result.Root.Children)-1; i++ {
			if result.Root.Children[i].Size < result.Root.Children[i+1].Size {
				t.Error("children should be sorted by size descending")
				break
			}
		}
	})

	t.Run("scan single file", func(t *testing.T) {
		result := scanner.ScanPath(file1)

		if result.Root.IsDir {
			t.Error("Root should be a file")
		}

		if result.Root.Size <= 0 {
			t.Error("file size should be > 0")
		}
	})
}

func TestNormalScannerScan(t *testing.T) {
	scanner := NewNormalScanner(4)

	// This tests scanning the actual home directory
	// which may take some time and produce a lot of output
	result := scanner.Scan()

	if result.Mode != ModeNormal {
		t.Errorf("Mode = %s, want %s", result.Mode, ModeNormal)
	}

	if result.Root == nil {
		t.Error("Root should not be nil")
		return
	}

	if result.Root.IsDir == false {
		t.Error("Root should be a directory")
	}
}

func TestNormalScannerGetDirectoryChildren(t *testing.T) {
	tmpDir := t.TempDir()

	// Create structure
	subDir := filepath.Join(tmpDir, "subdir")
	if err := os.Mkdir(subDir, 0755); err != nil {
		t.Fatal(err)
	}

	file := filepath.Join(tmpDir, "file.txt")
	if err := os.WriteFile(file, []byte("content"), 0644); err != nil {
		t.Fatal(err)
	}

	scanner := NewNormalScanner(4)

	t.Run("get children", func(t *testing.T) {
		children, err := scanner.GetDirectoryChildren(tmpDir)

		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		if len(children) != 2 {
			t.Errorf("len(children) = %d, want 2", len(children))
		}
	})

	t.Run("sorted by size", func(t *testing.T) {
		children, err := scanner.GetDirectoryChildren(tmpDir)

		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		for i := 0; i < len(children)-1; i++ {
			if children[i].Size < children[i+1].Size {
				t.Error("children should be sorted by size descending")
				break
			}
		}
	})

	t.Run("non-existent path", func(t *testing.T) {
		_, err := scanner.GetDirectoryChildren("/non/existent/path")

		if err == nil {
			t.Error("expected error for non-existent path")
		}
	})

	t.Run("file path returns nil", func(t *testing.T) {
		children, err := scanner.GetDirectoryChildren(file)

		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		if children != nil {
			t.Error("expected nil for file path")
		}
	})
}

func TestNormalScannerQuickScan(t *testing.T) {
	scanner := NewNormalScanner(4)

	result := scanner.QuickScan()

	if result.Mode != ModeNormal {
		t.Errorf("Mode = %s, want %s", result.Mode, ModeNormal)
	}

	if result.Root == nil {
		t.Error("Root should not be nil")
	}
}

func TestNormalScannerSymlinks(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a real file
	realFile := filepath.Join(tmpDir, "real.txt")
	if err := os.WriteFile(realFile, []byte("content"), 0644); err != nil {
		t.Fatal(err)
	}

	// Create a symlink
	symlink := filepath.Join(tmpDir, "link.txt")
	if err := os.Symlink(realFile, symlink); err != nil {
		t.Skip("symlinks not supported on this system")
	}

	scanner := NewNormalScanner(4)

	t.Run("scan skips symlinks", func(t *testing.T) {
		result := scanner.ScanPath(tmpDir)

		// Should only have 1 child (the real file, not the symlink)
		if len(result.Root.Children) != 1 {
			t.Errorf("len(children) = %d, want 1 (symlink should be skipped)",
				len(result.Root.Children))
		}
	})

	t.Run("get children skips symlinks", func(t *testing.T) {
		children, err := scanner.GetDirectoryChildren(tmpDir)

		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		if len(children) != 1 {
			t.Errorf("len(children) = %d, want 1 (symlink should be skipped)",
				len(children))
		}
	})

	t.Run("scan symlink itself returns zero size", func(t *testing.T) {
		result := scanner.ScanPath(symlink)

		if result.Root.Size != 0 {
			t.Errorf("symlink size = %d, want 0", result.Root.Size)
		}
	})
}

func TestNormalScannerProgressCallback(t *testing.T) {
	tmpDir := t.TempDir()

	// Create some files
	for i := 0; i < 5; i++ {
		subDir := filepath.Join(tmpDir, "dir"+string(rune('A'+i)))
		if err := os.Mkdir(subDir, 0755); err != nil {
			t.Fatal(err)
		}
		file := filepath.Join(subDir, "file.txt")
		if err := os.WriteFile(file, []byte("content"), 0644); err != nil {
			t.Fatal(err)
		}
	}

	scanner := NewNormalScanner(4)

	var progressUpdates []ScanProgress
	scanner.SetProgressCallback(func(p ScanProgress) {
		progressUpdates = append(progressUpdates, p)
	})

	result := scanner.ScanPath(tmpDir)

	if result.Root == nil {
		t.Error("scan should complete")
	}

	// Should have received progress updates
	if len(progressUpdates) == 0 {
		t.Error("expected progress updates")
	}

	// Each progress should have a path
	for _, p := range progressUpdates {
		if p.CurrentPath == "" {
			t.Error("progress update missing CurrentPath")
		}
	}
}

func TestNormalScannerPermissionErrors(t *testing.T) {
	// This tests that the scanner handles permission errors gracefully
	scanner := NewNormalScanner(4)

	// Try to scan a path that likely doesn't exist or has no permissions
	result := scanner.ScanPath("/root")

	// Should not panic and should return a result
	if result.Mode != ModeNormal {
		t.Errorf("Mode = %s, want %s", result.Mode, ModeNormal)
	}
}

func TestNormalScannerEmptyDirectory(t *testing.T) {
	tmpDir := t.TempDir()
	scanner := NewNormalScanner(4)

	result := scanner.ScanPath(tmpDir)

	if result.Root == nil {
		t.Error("Root should not be nil")
		return
	}

	if len(result.Root.Children) != 0 {
		t.Errorf("empty directory should have no children, got %d",
			len(result.Root.Children))
	}

	if result.TotalSize != 0 {
		t.Errorf("empty directory should have size 0, got %d", result.TotalSize)
	}
}

func TestNormalScannerDeepNesting(t *testing.T) {
	tmpDir := t.TempDir()

	// Create deeply nested structure
	deepPath := tmpDir
	for i := 0; i < 5; i++ {
		deepPath = filepath.Join(deepPath, "level"+string(rune('0'+i)))
		if err := os.Mkdir(deepPath, 0755); err != nil {
			t.Fatal(err)
		}
	}

	// Create file at deepest level
	file := filepath.Join(deepPath, "deep.txt")
	if err := os.WriteFile(file, []byte("deep content"), 0644); err != nil {
		t.Fatal(err)
	}

	scanner := NewNormalScanner(4)
	result := scanner.ScanPath(tmpDir)

	if result.TotalSize <= 0 {
		t.Error("should calculate size of deeply nested files")
	}

	// Check that root has children
	if len(result.Root.Children) == 0 {
		t.Error("root should have at least one child")
	}
}
