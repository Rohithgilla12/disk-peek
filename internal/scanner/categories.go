package scanner

import (
	"os"
	"path/filepath"
)

// GetCategories returns all dev cache categories with their paths
func GetCategories() []Category {
	home, _ := os.UserHomeDir()

	return []Category{
		{
			ID:          "xcode",
			Name:        "Xcode",
			Description: "Xcode build artifacts and caches",
			Icon:        "hammer",
			Color:       "#1e90ff",
			Children: []Category{
				{
					ID:          "xcode-derived",
					Name:        "DerivedData",
					Description: "Build products and intermediate files",
					Icon:        "folder",
					Color:       "#1e90ff",
					Paths:       []string{filepath.Join(home, "Library/Developer/Xcode/DerivedData")},
				},
				{
					ID:          "xcode-archives",
					Name:        "Archives",
					Description: "Archived builds for distribution",
					Icon:        "archive",
					Color:       "#3b9eff",
					Paths:       []string{filepath.Join(home, "Library/Developer/Xcode/Archives")},
				},
				{
					ID:          "xcode-devices",
					Name:        "iOS DeviceSupport",
					Description: "Debug symbols for connected devices",
					Icon:        "smartphone",
					Color:       "#5aadff",
					Paths:       []string{filepath.Join(home, "Library/Developer/Xcode/iOS DeviceSupport")},
				},
				{
					ID:          "xcode-watchos",
					Name:        "watchOS DeviceSupport",
					Description: "Debug symbols for Apple Watch",
					Icon:        "watch",
					Color:       "#79bcff",
					Paths:       []string{filepath.Join(home, "Library/Developer/Xcode/watchOS DeviceSupport")},
				},
			},
		},
		{
			ID:          "simulators",
			Name:        "Simulators",
			Description: "iOS/watchOS/tvOS simulator data",
			Icon:        "tablet-smartphone",
			Color:       "#8b5cf6",
			Paths:       []string{filepath.Join(home, "Library/Developer/CoreSimulator/Devices")},
		},
		{
			ID:          "swift-packages",
			Name:        "Swift Packages",
			Description: "Swift Package Manager caches",
			Icon:        "package",
			Color:       "#f97316",
			Children: []Category{
				{
					ID:          "spm-cache",
					Name:        "SPM Cache",
					Description: "Downloaded package sources",
					Icon:        "database",
					Color:       "#f97316",
					Paths:       []string{filepath.Join(home, "Library/Caches/org.swift.swiftpm")},
				},
				{
					ID:          "cocoapods-cache",
					Name:        "CocoaPods Cache",
					Description: "Downloaded pod sources",
					Icon:        "database",
					Color:       "#fb923c",
					Paths:       []string{filepath.Join(home, "Library/Caches/CocoaPods")},
				},
				{
					ID:          "carthage-cache",
					Name:        "Carthage Cache",
					Description: "Downloaded Carthage frameworks",
					Icon:        "database",
					Color:       "#fdba74",
					Paths:       []string{filepath.Join(home, "Library/Caches/org.carthage.CarthageKit")},
				},
			},
		},
		{
			ID:          "node",
			Name:        "Node.js",
			Description: "Node.js package manager caches",
			Icon:        "hexagon",
			Color:       "#22c55e",
			Children: []Category{
				{
					ID:          "npm-cache",
					Name:        "npm Cache",
					Description: "Downloaded npm packages",
					Icon:        "database",
					Color:       "#22c55e",
					Paths:       []string{filepath.Join(home, ".npm")},
				},
				{
					ID:          "yarn-cache",
					Name:        "Yarn Cache",
					Description: "Downloaded Yarn packages",
					Icon:        "database",
					Color:       "#4ade80",
					Paths:       []string{filepath.Join(home, "Library/Caches/Yarn")},
				},
				{
					ID:          "pnpm-cache",
					Name:        "pnpm Store",
					Description: "pnpm content-addressable store",
					Icon:        "database",
					Color:       "#86efac",
					Paths: []string{
						filepath.Join(home, "Library/pnpm"),
						filepath.Join(home, ".local/share/pnpm"),
					},
				},
			},
		},
		{
			ID:          "homebrew",
			Name:        "Homebrew",
			Description: "Homebrew package manager cache",
			Icon:        "beer",
			Color:       "#eab308",
			Paths:       []string{filepath.Join(home, "Library/Caches/Homebrew")},
		},
		{
			ID:          "rust",
			Name:        "Rust",
			Description: "Cargo build artifacts and registry",
			Icon:        "cog",
			Color:       "#dea584",
			Children: []Category{
				{
					ID:          "cargo-registry",
					Name:        "Cargo Registry",
					Description: "Downloaded crate sources",
					Icon:        "database",
					Color:       "#dea584",
					Paths:       []string{filepath.Join(home, ".cargo/registry")},
				},
				{
					ID:          "cargo-git",
					Name:        "Cargo Git",
					Description: "Git dependencies cache",
					Icon:        "git-branch",
					Color:       "#e7b89a",
					Paths:       []string{filepath.Join(home, ".cargo/git")},
				},
			},
		},
		{
			ID:          "go",
			Name:        "Go",
			Description: "Go module cache",
			Icon:        "package",
			Color:       "#00add8",
			Paths:       goModCache(home),
		},
		{
			ID:          "gradle",
			Name:        "Gradle",
			Description: "Gradle build cache",
			Icon:        "layers",
			Color:       "#02303a",
			Paths:       []string{filepath.Join(home, ".gradle/caches")},
		},
		{
			ID:          "maven",
			Name:        "Maven",
			Description: "Maven local repository",
			Icon:        "feather",
			Color:       "#c71a36",
			Paths:       []string{filepath.Join(home, ".m2/repository")},
		},
		{
			ID:          "docker",
			Name:        "Docker",
			Description: "Docker Desktop data and images",
			Icon:        "container",
			Color:       "#2496ed",
			Paths:       []string{filepath.Join(home, "Library/Containers/com.docker.docker/Data")},
		},
		{
			ID:          "android",
			Name:        "Android",
			Description: "Android SDK and AVD data",
			Icon:        "smartphone",
			Color:       "#3ddc84",
			Children: []Category{
				{
					ID:          "android-avd",
					Name:        "Android AVDs",
					Description: "Android Virtual Devices",
					Icon:        "monitor-smartphone",
					Color:       "#3ddc84",
					Paths:       []string{filepath.Join(home, ".android/avd")},
				},
				{
					ID:          "android-cache",
					Name:        "Android Cache",
					Description: "Android SDK caches",
					Icon:        "database",
					Color:       "#5ee89d",
					Paths:       []string{filepath.Join(home, ".android/cache")},
				},
			},
		},
		{
			ID:          "system-caches",
			Name:        "System Caches",
			Description: "macOS application caches",
			Icon:        "hard-drive",
			Color:       "#6b7280",
			Paths:       []string{filepath.Join(home, "Library/Caches")},
		},
		{
			ID:          "system-logs",
			Name:        "System Logs",
			Description: "Application and system logs",
			Icon:        "file-text",
			Color:       "#9ca3af",
			Paths:       []string{filepath.Join(home, "Library/Logs")},
		},
	}
}

// FlattenCategories returns all leaf categories with paths
func FlattenCategories(categories []Category) []Category {
	var result []Category

	var flatten func(cats []Category)
	flatten = func(cats []Category) {
		for _, cat := range cats {
			if len(cat.Children) > 0 {
				flatten(cat.Children)
			} else if len(cat.Paths) > 0 {
				result = append(result, cat)
			}
		}
	}

	flatten(categories)
	return result
}

// GetCategoryByID finds a category by its ID (searches nested)
func GetCategoryByID(categories []Category, id string) *Category {
	for i := range categories {
		if categories[i].ID == id {
			return &categories[i]
		}
		if len(categories[i].Children) > 0 {
			if found := GetCategoryByID(categories[i].Children, id); found != nil {
				return found
			}
		}
	}
	return nil
}

// goModCache returns possible Go module cache paths using the default location and the GOPATH environment variable.
func goModCache(home string) []string {
	paths := []string{filepath.Join(home, "go/pkg/mod")} // default path
	gopath := os.Getenv("GOPATH")
	if gopath != "" {
		paths = append(paths, filepath.Join(gopath, "pkg/mod"))
	}
	return paths
}
