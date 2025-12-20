package scanner

import (
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

	t.Run("known categories exist", func(t *testing.T) {
		expectedIDs := []string{
			"xcode", "simulators", "swift-packages", "node",
			"homebrew", "rust", "go", "gradle", "maven",
			"docker", "android", "system-caches", "system-logs",
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
				t.Errorf("expected category %s not found", expectedID)
			}
		}
	})

	t.Run("xcode has children", func(t *testing.T) {
		for _, cat := range categories {
			if cat.ID == "xcode" {
				if len(cat.Children) == 0 {
					t.Error("xcode category should have children")
				}
				// Check child IDs
				childIDs := make(map[string]bool)
				for _, child := range cat.Children {
					childIDs[child.ID] = true
				}
				expectedChildren := []string{"xcode-derived", "xcode-archives", "xcode-devices", "xcode-watchos"}
				for _, expectedChild := range expectedChildren {
					if !childIDs[expectedChild] {
						t.Errorf("xcode missing child %s", expectedChild)
					}
				}
				return
			}
		}
		t.Error("xcode category not found")
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

	t.Run("contains expected leaf categories", func(t *testing.T) {
		expectedLeafs := []string{
			"xcode-derived", "xcode-archives", "npm-cache", "yarn-cache",
			"cargo-registry", "gradle", "maven", "docker",
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

	t.Run("find top-level category", func(t *testing.T) {
		cat := GetCategoryByID(categories, "xcode")
		if cat == nil {
			t.Error("expected to find xcode category")
			return
		}
		if cat.Name != "Xcode" {
			t.Errorf("Name = %s, want Xcode", cat.Name)
		}
	})

	t.Run("find nested category", func(t *testing.T) {
		cat := GetCategoryByID(categories, "xcode-derived")
		if cat == nil {
			t.Error("expected to find xcode-derived category")
			return
		}
		if cat.Name != "DerivedData" {
			t.Errorf("Name = %s, want DerivedData", cat.Name)
		}
	})

	t.Run("find deeply nested category", func(t *testing.T) {
		cat := GetCategoryByID(categories, "npm-cache")
		if cat == nil {
			t.Error("expected to find npm-cache category")
			return
		}
		if cat.Name != "npm Cache" {
			t.Errorf("Name = %s, want npm Cache", cat.Name)
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
		cat := GetCategoryByID([]Category{}, "xcode")
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

func TestPnpmMultiplePaths(t *testing.T) {
	// pnpm has multiple possible paths
	categories := GetCategories()
	cat := GetCategoryByID(categories, "pnpm-cache")

	if cat == nil {
		t.Error("expected to find pnpm-cache category")
		return
	}

	if len(cat.Paths) < 2 {
		t.Errorf("pnpm-cache should have multiple paths, got %d", len(cat.Paths))
	}
}
