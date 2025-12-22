package scanner

import (
	"runtime"
	"testing"
)

func TestGetCategories(t *testing.T) {
	categories := GetCategories()

	t.Run("returns categories", func(t *testing.T) {
		if len(categories) == 0 {
			t.Error("expected non-empty categories list")
		}
	})

	t.Run("categories have required fields", func(t *testing.T) {
		for _, cat := range categories {
			if cat.ID == "" {
				t.Error("category has empty ID")
			}
			if cat.Name == "" {
				t.Errorf("category %s has empty Name", cat.ID)
			}
			if cat.Icon == "" {
				t.Errorf("category %s has empty Icon", cat.ID)
			}
			if cat.Color == "" {
				t.Errorf("category %s has empty Color", cat.ID)
			}
		}
	})

	t.Run("cross-platform categories exist", func(t *testing.T) {
		// These categories should exist on all platforms
		expectedIDs := []string{
			"node", "rust", "go", "gradle", "maven", "android",
		}

		for _, expectedID := range expectedIDs {
			found := false
			for _, cat := range categories {
				if cat.ID == expectedID {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("expected cross-platform category %s not found", expectedID)
			}
		}
	})

	t.Run("platform-specific categories exist", func(t *testing.T) {
		var expectedIDs []string
		switch runtime.GOOS {
		case "darwin":
			expectedIDs = []string{"xcode", "simulators", "swift-packages", "homebrew", "system-caches", "system-logs"}
		case "linux":
			expectedIDs = []string{"system-caches", "snap", "flatpak", "thumbnails", "trash"}
		case "windows":
			expectedIDs = []string{"windows-temp", "vscode-cache", "nuget", "edge-cache", "chrome-cache"}
		}

		for _, expectedID := range expectedIDs {
			found := false
			for _, cat := range categories {
				if cat.ID == expectedID {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("expected platform-specific category %s not found on %s", expectedID, runtime.GOOS)
			}
		}
	})

	t.Run("leaf categories have paths", func(t *testing.T) {
		var checkLeafs func(cats []Category)
		checkLeafs = func(cats []Category) {
			for _, cat := range cats {
				if len(cat.Children) > 0 {
					checkLeafs(cat.Children)
				} else {
					// Leaf category should have paths
					if len(cat.Paths) == 0 {
						t.Errorf("leaf category %s has no paths", cat.ID)
					}
				}
			}
		}
		checkLeafs(categories)
	})
}

func TestFlattenCategories(t *testing.T) {
	categories := GetCategories()
	flattened := FlattenCategories(categories)

	t.Run("returns non-empty result", func(t *testing.T) {
		if len(flattened) == 0 {
			t.Error("expected non-empty flattened list")
		}
	})

	t.Run("all flattened have paths", func(t *testing.T) {
		for _, cat := range flattened {
			if len(cat.Paths) == 0 {
				t.Errorf("flattened category %s has no paths", cat.ID)
			}
		}
	})

	t.Run("no nested categories", func(t *testing.T) {
		for _, cat := range flattened {
			if len(cat.Children) > 0 {
				t.Errorf("flattened category %s has children", cat.ID)
			}
		}
	})

	t.Run("contains cross-platform leaf categories", func(t *testing.T) {
		// These leaf categories should exist on all platforms
		expectedLeafs := []string{
			"npm-cache", "yarn-cache", "cargo-registry", "gradle", "maven",
		}

		flatIDs := make(map[string]bool)
		for _, cat := range flattened {
			flatIDs[cat.ID] = true
		}

		for _, expected := range expectedLeafs {
			if !flatIDs[expected] {
				t.Errorf("expected leaf category %s not in flattened list", expected)
			}
		}
	})
}

func TestGetCategoryByID(t *testing.T) {
	categories := GetCategories()

	t.Run("find cross-platform category", func(t *testing.T) {
		cat := GetCategoryByID(categories, "node")
		if cat == nil {
			t.Error("expected to find node category")
			return
		}
		if cat.Name != "Node.js" {
			t.Errorf("Name = %s, want Node.js", cat.Name)
		}
	})

	t.Run("find nested category", func(t *testing.T) {
		cat := GetCategoryByID(categories, "npm-cache")
		if cat == nil {
			t.Error("expected to find npm-cache category")
			return
		}
		if cat.Name != "npm Cache" {
			t.Errorf("Name = %s, want npm Cache", cat.Name)
		}
	})

	t.Run("find platform-specific category", func(t *testing.T) {
		var categoryID, expectedName string
		switch runtime.GOOS {
		case "darwin":
			categoryID = "xcode"
			expectedName = "Xcode"
		case "linux":
			categoryID = "snap"
			expectedName = "Snap"
		case "windows":
			categoryID = "windows-temp"
			expectedName = "Temp Files"
		default:
			t.Skip("unsupported platform")
			return
		}

		cat := GetCategoryByID(categories, categoryID)
		if cat == nil {
			t.Errorf("expected to find %s category on %s", categoryID, runtime.GOOS)
			return
		}
		if cat.Name != expectedName {
			t.Errorf("Name = %s, want %s", cat.Name, expectedName)
		}
	})

	t.Run("non-existent category returns nil", func(t *testing.T) {
		cat := GetCategoryByID(categories, "non-existent")
		if cat != nil {
			t.Error("expected nil for non-existent category")
		}
	})

	t.Run("empty ID returns nil", func(t *testing.T) {
		cat := GetCategoryByID(categories, "")
		if cat != nil {
			t.Error("expected nil for empty ID")
		}
	})

	t.Run("empty categories list returns nil", func(t *testing.T) {
		cat := GetCategoryByID([]Category{}, "node")
		if cat != nil {
			t.Error("expected nil for empty categories list")
		}
	})
}

func TestGoModCache(t *testing.T) {
	// This function is internal but we can test it indirectly through GetCategories
	categories := GetCategories()

	t.Run("go category has paths", func(t *testing.T) {
		cat := GetCategoryByID(categories, "go")
		if cat == nil {
			t.Error("expected to find go category")
			return
		}
		if len(cat.Paths) == 0 {
			t.Error("go category should have paths")
		}
	})
}

func TestCategoryStructure(t *testing.T) {
	categories := GetCategories()

	t.Run("node category has children", func(t *testing.T) {
		cat := GetCategoryByID(categories, "node")
		if cat == nil {
			t.Error("expected to find node category")
			return
		}
		if len(cat.Children) == 0 {
			t.Error("node category should have children")
		}

		childIDs := make(map[string]bool)
		for _, child := range cat.Children {
			childIDs[child.ID] = true
		}

		expected := []string{"npm-cache", "yarn-cache", "pnpm-cache"}
		for _, id := range expected {
			if !childIDs[id] {
				t.Errorf("node missing child %s", id)
			}
		}
	})

	t.Run("rust category has children", func(t *testing.T) {
		cat := GetCategoryByID(categories, "rust")
		if cat == nil {
			t.Error("expected to find rust category")
			return
		}
		if len(cat.Children) == 0 {
			t.Error("rust category should have children")
		}
	})

	t.Run("android category has children", func(t *testing.T) {
		cat := GetCategoryByID(categories, "android")
		if cat == nil {
			t.Error("expected to find android category")
			return
		}
		if len(cat.Children) == 0 {
			t.Error("android category should have children")
		}
	})
}

func TestPlatformDetection(t *testing.T) {
	t.Run("GetCurrentPlatform returns runtime.GOOS", func(t *testing.T) {
		platform := GetCurrentPlatform()
		if platform != runtime.GOOS {
			t.Errorf("GetCurrentPlatform() = %s, want %s", platform, runtime.GOOS)
		}
	})

	t.Run("IsPlatformSupported returns true for supported platforms", func(t *testing.T) {
		// Current platform should be supported if we're running tests
		if !IsPlatformSupported() {
			t.Error("current platform should be supported")
		}
	})
}

func TestPnpmPaths(t *testing.T) {
	categories := GetCategories()
	cat := GetCategoryByID(categories, "pnpm-cache")

	if cat == nil {
		t.Error("expected to find pnpm-cache category")
		return
	}

	// pnpm has at least 1 path on all platforms, and 2 on macOS
	if len(cat.Paths) == 0 {
		t.Error("pnpm-cache should have at least one path")
	}

	// On macOS, pnpm has 2 paths
	if runtime.GOOS == "darwin" && len(cat.Paths) < 2 {
		t.Errorf("pnpm-cache should have multiple paths on macOS, got %d", len(cat.Paths))
	}
}
