package scanner

import (
	"os"
	"path/filepath"
	"runtime"
)

// Platform constants
const (
	PlatformMacOS   = "darwin"
	PlatformLinux   = "linux"
	PlatformWindows = "windows"
)

// GetCategories returns all dev cache categories with their paths for the current platform
func GetCategories() []Category {
	home, _ := os.UserHomeDir()

	var categories []Category

	// Cross-platform categories (available on all platforms)
	categories = append(categories, getCrossPlatformCategories(home)...)

	// Platform-specific categories
	switch runtime.GOOS {
	case PlatformMacOS:
		categories = append(categories, getMacOSCategories(home)...)
	case PlatformLinux:
		categories = append(categories, getLinuxCategories(home)...)
	case PlatformWindows:
		categories = append(categories, getWindowsCategories(home)...)
	}

	return categories
}

// getCrossPlatformCategories returns categories that exist on all platforms
func getCrossPlatformCategories(home string) []Category {
	return []Category{
		{
			ID:          "node",
			Name:        "Node.js",
			Description: "Node.js package manager caches",
			Icon:        "hexagon",
			Color:       "#22c55e",
			Children:    getNodeCategories(home),
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
					Paths:       []string{filepath.Join(home, ".cargo", "registry")},
				},
				{
					ID:          "cargo-git",
					Name:        "Cargo Git",
					Description: "Git dependencies cache",
					Icon:        "git-branch",
					Color:       "#e7b89a",
					Paths:       []string{filepath.Join(home, ".cargo", "git")},
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
			Paths:       []string{filepath.Join(home, ".gradle", "caches")},
		},
		{
			ID:          "maven",
			Name:        "Maven",
			Description: "Maven local repository",
			Icon:        "feather",
			Color:       "#c71a36",
			Paths:       []string{filepath.Join(home, ".m2", "repository")},
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
					Paths:       []string{filepath.Join(home, ".android", "avd")},
				},
				{
					ID:          "android-cache",
					Name:        "Android Cache",
					Description: "Android SDK caches",
					Icon:        "database",
					Color:       "#5ee89d",
					Paths:       []string{filepath.Join(home, ".android", "cache")},
				},
			},
		},
	}
}

// getNodeCategories returns Node.js related categories with platform-specific paths
func getNodeCategories(home string) []Category {
	categories := []Category{
		{
			ID:          "npm-cache",
			Name:        "npm Cache",
			Description: "Downloaded npm packages",
			Icon:        "database",
			Color:       "#22c55e",
			Paths:       getNpmCachePaths(home),
		},
		{
			ID:          "yarn-cache",
			Name:        "Yarn Cache",
			Description: "Downloaded Yarn packages",
			Icon:        "database",
			Color:       "#4ade80",
			Paths:       getYarnCachePaths(home),
		},
		{
			ID:          "pnpm-cache",
			Name:        "pnpm Store",
			Description: "pnpm content-addressable store",
			Icon:        "database",
			Color:       "#86efac",
			Paths:       getPnpmCachePaths(home),
		},
	}
	return categories
}

// getNpmCachePaths returns npm cache paths for the current platform
func getNpmCachePaths(home string) []string {
	switch runtime.GOOS {
	case PlatformWindows:
		appData := os.Getenv("APPDATA")
		if appData != "" {
			return []string{filepath.Join(appData, "npm-cache")}
		}
		return []string{filepath.Join(home, "AppData", "Roaming", "npm-cache")}
	default: // macOS and Linux
		return []string{filepath.Join(home, ".npm")}
	}
}

// getYarnCachePaths returns Yarn cache paths for the current platform
func getYarnCachePaths(home string) []string {
	switch runtime.GOOS {
	case PlatformMacOS:
		return []string{filepath.Join(home, "Library", "Caches", "Yarn")}
	case PlatformLinux:
		return []string{filepath.Join(home, ".cache", "yarn")}
	case PlatformWindows:
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData != "" {
			return []string{filepath.Join(localAppData, "Yarn", "Cache")}
		}
		return []string{filepath.Join(home, "AppData", "Local", "Yarn", "Cache")}
	default:
		return []string{filepath.Join(home, ".cache", "yarn")}
	}
}

// getPnpmCachePaths returns pnpm cache paths for the current platform
func getPnpmCachePaths(home string) []string {
	switch runtime.GOOS {
	case PlatformMacOS:
		return []string{
			filepath.Join(home, "Library", "pnpm"),
			filepath.Join(home, ".local", "share", "pnpm"),
		}
	case PlatformLinux:
		return []string{filepath.Join(home, ".local", "share", "pnpm")}
	case PlatformWindows:
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData != "" {
			return []string{filepath.Join(localAppData, "pnpm")}
		}
		return []string{filepath.Join(home, "AppData", "Local", "pnpm")}
	default:
		return []string{filepath.Join(home, ".local", "share", "pnpm")}
	}
}

// getMacOSCategories returns macOS-specific categories
func getMacOSCategories(home string) []Category {
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
					Paths:       []string{filepath.Join(home, "Library", "Developer", "Xcode", "DerivedData")},
				},
				{
					ID:          "xcode-archives",
					Name:        "Archives",
					Description: "Archived builds for distribution",
					Icon:        "archive",
					Color:       "#3b9eff",
					Paths:       []string{filepath.Join(home, "Library", "Developer", "Xcode", "Archives")},
				},
				{
					ID:          "xcode-devices",
					Name:        "iOS DeviceSupport",
					Description: "Debug symbols for connected devices",
					Icon:        "smartphone",
					Color:       "#5aadff",
					Paths:       []string{filepath.Join(home, "Library", "Developer", "Xcode", "iOS DeviceSupport")},
				},
				{
					ID:          "xcode-watchos",
					Name:        "watchOS DeviceSupport",
					Description: "Debug symbols for Apple Watch",
					Icon:        "watch",
					Color:       "#79bcff",
					Paths:       []string{filepath.Join(home, "Library", "Developer", "Xcode", "watchOS DeviceSupport")},
				},
			},
		},
		{
			ID:          "simulators",
			Name:        "Simulators",
			Description: "iOS/watchOS/tvOS simulator data",
			Icon:        "tablet-smartphone",
			Color:       "#8b5cf6",
			Paths:       []string{filepath.Join(home, "Library", "Developer", "CoreSimulator", "Devices")},
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
					Paths:       []string{filepath.Join(home, "Library", "Caches", "org.swift.swiftpm")},
				},
				{
					ID:          "cocoapods-cache",
					Name:        "CocoaPods Cache",
					Description: "Downloaded pod sources",
					Icon:        "database",
					Color:       "#fb923c",
					Paths:       []string{filepath.Join(home, "Library", "Caches", "CocoaPods")},
				},
				{
					ID:          "carthage-cache",
					Name:        "Carthage Cache",
					Description: "Downloaded Carthage frameworks",
					Icon:        "database",
					Color:       "#fdba74",
					Paths:       []string{filepath.Join(home, "Library", "Caches", "org.carthage.CarthageKit")},
				},
			},
		},
		{
			ID:          "homebrew",
			Name:        "Homebrew",
			Description: "Homebrew package manager cache",
			Icon:        "beer",
			Color:       "#eab308",
			Paths:       []string{filepath.Join(home, "Library", "Caches", "Homebrew")},
		},
		{
			ID:          "docker",
			Name:        "Docker",
			Description: "Docker Desktop data and images",
			Icon:        "container",
			Color:       "#2496ed",
			Paths:       []string{filepath.Join(home, "Library", "Containers", "com.docker.docker", "Data")},
		},
		{
			ID:          "system-caches",
			Name:        "System Caches",
			Description: "macOS application caches",
			Icon:        "hard-drive",
			Color:       "#6b7280",
			Paths:       []string{filepath.Join(home, "Library", "Caches")},
		},
		{
			ID:          "system-logs",
			Name:        "System Logs",
			Description: "Application and system logs",
			Icon:        "file-text",
			Color:       "#9ca3af",
			Paths:       []string{filepath.Join(home, "Library", "Logs")},
		},
	}
}

// getLinuxCategories returns Linux-specific categories
func getLinuxCategories(home string) []Category {
	return []Category{
		{
			ID:          "docker",
			Name:        "Docker",
			Description: "Docker data and images",
			Icon:        "container",
			Color:       "#2496ed",
			Paths: []string{
				filepath.Join(home, ".docker"),
				"/var/lib/docker", // Requires root, may not be accessible
			},
		},
		{
			ID:          "snap",
			Name:        "Snap",
			Description: "Snap package cache",
			Icon:        "package",
			Color:       "#e95420",
			Paths:       []string{filepath.Join(home, "snap")},
		},
		{
			ID:          "flatpak",
			Name:        "Flatpak",
			Description: "Flatpak application data",
			Icon:        "package",
			Color:       "#4a86cf",
			Paths:       []string{filepath.Join(home, ".var", "app")},
		},
		{
			ID:          "system-caches",
			Name:        "System Caches",
			Description: "Application caches",
			Icon:        "hard-drive",
			Color:       "#6b7280",
			Paths:       []string{filepath.Join(home, ".cache")},
		},
		{
			ID:          "system-logs",
			Name:        "User Logs",
			Description: "Application logs",
			Icon:        "file-text",
			Color:       "#9ca3af",
			Paths:       []string{filepath.Join(home, ".local", "share", "logs")},
		},
		{
			ID:          "thumbnails",
			Name:        "Thumbnails",
			Description: "Cached image thumbnails",
			Icon:        "image",
			Color:       "#a855f7",
			Paths:       []string{filepath.Join(home, ".cache", "thumbnails")},
		},
		{
			ID:          "trash",
			Name:        "Trash",
			Description: "Files in trash",
			Icon:        "trash-2",
			Color:       "#ef4444",
			Paths:       []string{filepath.Join(home, ".local", "share", "Trash")},
		},
	}
}

// getWindowsCategories returns Windows-specific categories
func getWindowsCategories(home string) []Category {
	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData == "" {
		localAppData = filepath.Join(home, "AppData", "Local")
	}
	appData := os.Getenv("APPDATA")
	if appData == "" {
		appData = filepath.Join(home, "AppData", "Roaming")
	}
	temp := os.Getenv("TEMP")
	if temp == "" {
		temp = filepath.Join(localAppData, "Temp")
	}

	return []Category{
		{
			ID:          "windows-temp",
			Name:        "Temp Files",
			Description: "Windows temporary files",
			Icon:        "file-x",
			Color:       "#f97316",
			Paths:       []string{temp},
		},
		{
			ID:          "docker",
			Name:        "Docker",
			Description: "Docker Desktop data",
			Icon:        "container",
			Color:       "#2496ed",
			Paths:       []string{filepath.Join(localAppData, "Docker")},
		},
		{
			ID:          "vscode-cache",
			Name:        "VS Code Cache",
			Description: "Visual Studio Code caches",
			Icon:        "code",
			Color:       "#007acc",
			Paths: []string{
				filepath.Join(appData, "Code", "Cache"),
				filepath.Join(appData, "Code", "CachedData"),
				filepath.Join(appData, "Code", "CachedExtensions"),
			},
		},
		{
			ID:          "nuget",
			Name:        "NuGet",
			Description: ".NET package cache",
			Icon:        "package",
			Color:       "#004880",
			Paths:       []string{filepath.Join(home, ".nuget", "packages")},
		},
		{
			ID:          "windows-installer",
			Name:        "Windows Installer",
			Description: "Windows Installer cache",
			Icon:        "hard-drive",
			Color:       "#0078d4",
			Paths:       []string{filepath.Join(localAppData, "Microsoft", "Windows", "Installer")},
		},
		{
			ID:          "edge-cache",
			Name:        "Edge Cache",
			Description: "Microsoft Edge browser cache",
			Icon:        "globe",
			Color:       "#0078d4",
			Paths:       []string{filepath.Join(localAppData, "Microsoft", "Edge", "User Data", "Default", "Cache")},
		},
		{
			ID:          "chrome-cache",
			Name:        "Chrome Cache",
			Description: "Google Chrome browser cache",
			Icon:        "chrome",
			Color:       "#4285f4",
			Paths:       []string{filepath.Join(localAppData, "Google", "Chrome", "User Data", "Default", "Cache")},
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
	paths := []string{filepath.Join(home, "go", "pkg", "mod")} // default path
	// GOPATH can contain multiple paths separated by os.PathListSeparator
	for _, p := range filepath.SplitList(os.Getenv("GOPATH")) {
		if p != "" {
			paths = append(paths, filepath.Join(p, "pkg", "mod"))
		}
	}
	return paths
}

// GetCurrentPlatform returns the current platform name
func GetCurrentPlatform() string {
	return runtime.GOOS
}

// IsPlatformSupported returns true if the current platform is supported
func IsPlatformSupported() bool {
	switch runtime.GOOS {
	case PlatformMacOS, PlatformLinux, PlatformWindows:
		return true
	default:
		return false
	}
}
