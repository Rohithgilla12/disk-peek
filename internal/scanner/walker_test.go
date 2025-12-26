package scanner

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFormatSize(t *testing.T) {
	tests := []struct {
		name     string
		bytes    int64
		expected string
	}{
		{"zero bytes", 0, "0.00 B"},
		{"bytes", 500, "500 B"},
		{"kilobytes small", 1024, "1.00 KB"},
		{"kilobytes", 2048, "2.00 KB"},
		{"kilobytes decimal", 1536, "1.50 KB"},
		{"megabytes", 1048576, "1.00 MB"},
		{"megabytes large", 10485760, "10.0 MB"},
		{"gigabytes", 1073741824, "1.00 GB"},
		{"gigabytes large", 107374182400, "100 GB"},
		{"terabytes", 1099511627776, "1.00 TB"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatSize(tt.bytes)
			if result != tt.expected {
				t.Errorf("FormatSize(%d) = %s, want %s", tt.bytes, result, tt.expected)
			}
		})
	}
}

func TestFormatFloat(t *testing.T) {
	tests := []struct {
		name     string
		input    float64
		expected string
	}{
		{"small decimal", 1.234, "1.23"},
		{"medium", 15.67, "15.7"},
		{"large", 150.5, "150"},
		{"zero", 0.0, "0.00"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatFloat(tt.input)
			if result != tt.expected {
				t.Errorf("formatFloat(%f) = %s, want %s", tt.input, result, tt.expected)
			}
		})
	}
}

func TestWalkDirectory(t *testing.T) {
	// Create a temporary directory structure for testing
	tmpDir := t.TempDir()

	// Create test files and directories
	subDir := filepath.Join(tmpDir, "subdir")
	if err := os.Mkdir(subDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Create a test file with known content
	testFile := filepath.Join(tmpDir, "test.txt")
	content := []byte("Hello, World!")
	if err := os.WriteFile(testFile, content, 0644); err != nil {
		t.Fatal(err)
	}

	// Create a file in subdirectory
	subFile := filepath.Join(subDir, "sub.txt")
	if err := os.WriteFile(subFile, []byte("Subfile"), 0644); err != nil {
		t.Fatal(err)
	}

	t.Run("walk directory", func(t *testing.T) {
		result := WalkDirectory(tmpDir)

		if result.Error != nil {
			t.Errorf("unexpected error: %v", result.Error)
		}

		if result.Path != tmpDir {
			t.Errorf("path = %s, want %s", result.Path, tmpDir)
		}

		// Should have 2 files
		if result.FileCount != 2 {
			t.Errorf("FileCount = %d, want 2", result.FileCount)
		}

		// Should have at least 1 directory (subdir)
		if result.DirCount < 1 {
			t.Errorf("DirCount = %d, want >= 1", result.DirCount)
		}

		// Size should be > 0
		if result.Size <= 0 {
			t.Errorf("Size = %d, want > 0", result.Size)
		}
	})

	t.Run("walk single file", func(t *testing.T) {
		result := WalkDirectory(testFile)

		if result.Error != nil {
			t.Errorf("unexpected error: %v", result.Error)
		}

		if result.FileCount != 1 {
			t.Errorf("FileCount = %d, want 1", result.FileCount)
		}

		if result.Size <= 0 {
			t.Errorf("Size = %d, want > 0", result.Size)
		}
	})

	t.Run("walk non-existent path", func(t *testing.T) {
		result := WalkDirectory("/non/existent/path")

		if result.Error == nil {
			t.Error("expected error for non-existent path")
		}
	})
}

func TestWalkDirectoryFast(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a more complex directory structure
	for i := 0; i < 5; i++ {
		subDir := filepath.Join(tmpDir, "dir"+string(rune('A'+i)))
		if err := os.Mkdir(subDir, 0755); err != nil {
			t.Fatal(err)
		}
		// Create files in each subdirectory
		for j := 0; j < 3; j++ {
			fileName := filepath.Join(subDir, "file"+string(rune('0'+j))+".txt")
			if err := os.WriteFile(fileName, []byte("test content"), 0644); err != nil {
				t.Fatal(err)
			}
		}
	}

	t.Run("fast walk with workers", func(t *testing.T) {
		result := WalkDirectoryFast(tmpDir, 4)

		if result.Error != nil {
			t.Errorf("unexpected error: %v", result.Error)
		}

		// Should have 15 files (5 dirs * 3 files)
		if result.FileCount != 15 {
			t.Errorf("FileCount = %d, want 15", result.FileCount)
		}

		// Should have 5 directories plus root
		if result.DirCount != 6 {
			t.Errorf("DirCount = %d, want 6", result.DirCount)
		}
	})

	t.Run("fast walk with default workers", func(t *testing.T) {
		result := WalkDirectoryFast(tmpDir, 0)

		if result.Error != nil {
			t.Errorf("unexpected error: %v", result.Error)
		}

		if result.FileCount != 15 {
			t.Errorf("FileCount = %d, want 15", result.FileCount)
		}
	})

	t.Run("fast walk single file", func(t *testing.T) {
		testFile := filepath.Join(tmpDir, "single.txt")
		if err := os.WriteFile(testFile, []byte("single"), 0644); err != nil {
			t.Fatal(err)
		}

		result := WalkDirectoryFast(testFile, 4)

		if result.FileCount != 1 {
			t.Errorf("FileCount = %d, want 1", result.FileCount)
		}
	})
}

func TestWalkDirectoryWithCallback(t *testing.T) {
	tmpDir := t.TempDir()

	// Create test structure
	subDir := filepath.Join(tmpDir, "sub")
	if err := os.Mkdir(subDir, 0755); err != nil {
		t.Fatal(err)
	}

	testFile := filepath.Join(tmpDir, "test.txt")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		t.Fatal(err)
	}

	t.Run("with callback", func(t *testing.T) {
		var callbackPaths []string
		callback := func(path string, size int64) {
			callbackPaths = append(callbackPaths, path)
		}

		result := WalkDirectoryWithCallback(tmpDir, callback)

		if result.Error != nil {
			t.Errorf("unexpected error: %v", result.Error)
		}

		// Callback should have been called for directories and files
		if len(callbackPaths) < 2 {
			t.Errorf("callback called %d times, want >= 2", len(callbackPaths))
		}
	})

	t.Run("nil callback", func(t *testing.T) {
		result := WalkDirectoryWithCallback(tmpDir, nil)

		if result.Error != nil {
			t.Errorf("unexpected error: %v", result.Error)
		}
	})
}

func TestScanMultiplePaths(t *testing.T) {
	tmpDir := t.TempDir()

	// Create multiple directories
	paths := []string{}
	for i := 0; i < 3; i++ {
		dir := filepath.Join(tmpDir, "dir"+string(rune('A'+i)))
		if err := os.Mkdir(dir, 0755); err != nil {
			t.Fatal(err)
		}
		testFile := filepath.Join(dir, "file.txt")
		if err := os.WriteFile(testFile, []byte("content"), 0644); err != nil {
			t.Fatal(err)
		}
		paths = append(paths, dir)
	}

	t.Run("scan multiple paths", func(t *testing.T) {
		results := ScanMultiplePaths(paths, 2)

		if len(results) != 3 {
			t.Errorf("len(results) = %d, want 3", len(results))
		}

		for i, result := range results {
			if result.Error != nil {
				t.Errorf("result[%d] error: %v", i, result.Error)
			}
			if result.FileCount != 1 {
				t.Errorf("result[%d] FileCount = %d, want 1", i, result.FileCount)
			}
		}
	})

	t.Run("default workers", func(t *testing.T) {
		results := ScanMultiplePaths(paths, 0)

		if len(results) != 3 {
			t.Errorf("len(results) = %d, want 3", len(results))
		}
	})
}

func TestScanMultiplePathsWithProgress(t *testing.T) {
	tmpDir := t.TempDir()

	paths := []string{}
	for i := 0; i < 2; i++ {
		dir := filepath.Join(tmpDir, "dir"+string(rune('A'+i)))
		if err := os.Mkdir(dir, 0755); err != nil {
			t.Fatal(err)
		}
		paths = append(paths, dir)
	}

	t.Run("with progress callback", func(t *testing.T) {
		var progressUpdates []ScanProgress
		callback := func(p ScanProgress) {
			progressUpdates = append(progressUpdates, p)
		}

		results := ScanMultiplePathsWithProgress(paths, 1, callback)

		if len(results) != 2 {
			t.Errorf("len(results) = %d, want 2", len(results))
		}

		if len(progressUpdates) != 2 {
			t.Errorf("progress updates = %d, want 2", len(progressUpdates))
		}

		// Check progress increments
		for i, p := range progressUpdates {
			if p.Total != 2 {
				t.Errorf("progress[%d].Total = %d, want 2", i, p.Total)
			}
		}
	})
}

func TestGetDirectoryItems(t *testing.T) {
	tmpDir := t.TempDir()

	// Create mixed content
	subDir := filepath.Join(tmpDir, "subdir")
	if err := os.Mkdir(subDir, 0755); err != nil {
		t.Fatal(err)
	}

	testFile := filepath.Join(tmpDir, "test.txt")
	if err := os.WriteFile(testFile, []byte("content"), 0644); err != nil {
		t.Fatal(err)
	}

	t.Run("get items", func(t *testing.T) {
		items, err := GetDirectoryItems(tmpDir)

		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		if len(items) != 2 {
			t.Errorf("len(items) = %d, want 2", len(items))
		}

		// Check that we have both a file and directory
		hasFile := false
		hasDir := false
		for _, item := range items {
			if item.IsDir {
				hasDir = true
			} else {
				hasFile = true
			}
		}

		if !hasFile || !hasDir {
			t.Error("expected both file and directory in results")
		}
	})

	t.Run("non-existent directory", func(t *testing.T) {
		_, err := GetDirectoryItems("/non/existent/path")

		if err == nil {
			t.Error("expected error for non-existent path")
		}
	})
}

func TestSymlinkHandling(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a real file
	realFile := filepath.Join(tmpDir, "real.txt")
	if err := os.WriteFile(realFile, []byte("real content"), 0644); err != nil {
		t.Fatal(err)
	}

	// Create a symlink
	symlink := filepath.Join(tmpDir, "link.txt")
	if err := os.Symlink(realFile, symlink); err != nil {
		// Skip on systems that don't support symlinks
		t.Skip("symlinks not supported on this system")
	}

	t.Run("WalkDirectory skips symlinks", func(t *testing.T) {
		result := WalkDirectory(tmpDir)

		// Should only count the real file, not the symlink
		if result.FileCount != 1 {
			t.Errorf("FileCount = %d, want 1 (symlink should be skipped)", result.FileCount)
		}
	})

	t.Run("WalkDirectoryFast skips symlinks", func(t *testing.T) {
		result := WalkDirectoryFast(tmpDir, 4)

		if result.FileCount != 1 {
			t.Errorf("FileCount = %d, want 1 (symlink should be skipped)", result.FileCount)
		}
	})

	t.Run("GetDirectoryItems skips symlinks", func(t *testing.T) {
		items, err := GetDirectoryItems(tmpDir)

		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		if len(items) != 1 {
			t.Errorf("len(items) = %d, want 1 (symlink should be skipped)", len(items))
		}
	})
}
