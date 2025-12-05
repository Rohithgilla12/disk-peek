# Disk Peek — Learn Go by Building

> A hands-on guide to learning Go while building a real macOS app

---

## Overview

This guide takes you from Go basics to a working Disk Peek app with two modes:

1. **Normal Mode** — Full disk scan (like DaisyDisk)
2. **Dev Mode** — Targeted developer cache cleanup

Each phase introduces new Go concepts through practical implementation. You'll build incrementally, testing as you go.

**Prerequisites:**

- Basic programming knowledge (you know TypeScript, so you're good)
- Go installed (`brew install go`)
- Wails installed (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

**Time estimate:** 2-3 weeks at a relaxed pace

---

## Phase 0: Go Fundamentals (Day 1-2)

Before touching the app, get comfortable with Go basics. Create a `learning/` folder for experiments.

### 0.1 Hello World & Project Structure

```bash
mkdir -p ~/code/go-learning
cd ~/code/go-learning
go mod init learning
```

Create `main.go`:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Disk Peek!")
}
```

Run it:

```bash
go run main.go
```

**Key concepts:**

- `package main` — Entry point package
- `import` — No npm, just import paths
- `func main()` — Entry function
- `fmt` — Standard library for formatting/printing

### 0.2 Variables & Types

```go
package main

import "fmt"

func main() {
    // Explicit type
    var name string = "Disk Peek"

    // Type inference (like TypeScript's `const x = 5`)
    version := 1.0

    // Constants
    const maxDepth = 10

    // Multiple variables
    var (
        isScanning bool   = false
        itemCount  int    = 0
        totalSize  int64  = 0  // Use int64 for file sizes
    )

    fmt.Printf("App: %s v%.1f\n", name, version)
    fmt.Printf("Scanning: %v, Items: %d, Size: %d\n", isScanning, itemCount, totalSize)
}
```

**Exercise:** Create variables for scan start time, category count, and error message.

### 0.3 Structs (Like TypeScript Interfaces)

```go
package main

import "fmt"

// Define a struct (like a TS interface/type)
type Category struct {
    Name     string
    Path     string
    Size     int64
    Icon     string
    Children []Category  // Nested structs
}

func main() {
    // Create an instance
    xcode := Category{
        Name: "Xcode",
        Path: "~/Library/Developer/Xcode",
        Size: 73400 * 1024 * 1024, // Convert MB to bytes
        Icon: "🔨",
        Children: []Category{
            {Name: "DerivedData", Path: "DerivedData", Size: 34200 * 1024 * 1024, Icon: "📁"},
            {Name: "Archives", Path: "Archives", Size: 12400 * 1024 * 1024, Icon: "📦"},
        },
    }

    fmt.Printf("Category: %s (%s)\n", xcode.Name, xcode.Icon)
    fmt.Printf("Size: %d bytes\n", xcode.Size)
    fmt.Printf("Children: %d\n", len(xcode.Children))
}
```

**Exercise:** Create a `ScanResult` struct with `Categories []Category`, `TotalSize int64`, `ScanDuration time.Duration`.

### 0.4 Slices & Maps (Arrays & Objects)

```go
package main

import "fmt"

func main() {
    // Slice (dynamic array)
    paths := []string{
        "~/Library/Developer/Xcode/DerivedData",
        "~/Library/Caches",
        "~/.npm",
    }

    // Append to slice
    paths = append(paths, "~/.cargo")

    // Iterate
    for i, path := range paths {
        fmt.Printf("%d: %s\n", i, path)
    }

    // Map (like TS Record<string, number>)
    sizes := map[string]int64{
        "Xcode":  73400,
        "Docker": 27500,
        "Node":   32300,
    }

    // Access map
    xcodeSize := sizes["Xcode"]
    fmt.Printf("Xcode: %d MB\n", xcodeSize)

    // Check if key exists
    if size, exists := sizes["Rust"]; exists {
        fmt.Printf("Rust: %d MB\n", size)
    } else {
        fmt.Println("Rust not found")
    }
}
```

**Exercise:** Create a map of category names to their colors (for the UI).

### 0.5 Functions & Error Handling

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

// Function with multiple return values (Go pattern!)
func getDirectorySize(path string) (int64, error) {
    info, err := os.Stat(path)
    if err != nil {
        return 0, err  // Return error to caller
    }

    if !info.IsDir() {
        return 0, errors.New("path is not a directory")
    }

    // For now, just return the dir's own size (we'll recurse later)
    return info.Size(), nil
}

// Function that formats bytes to human readable
func formatSize(bytes int64) string {
    const (
        KB = 1024
        MB = KB * 1024
        GB = MB * 1024
    )

    switch {
    case bytes >= GB:
        return fmt.Sprintf("%.1f GB", float64(bytes)/float64(GB))
    case bytes >= MB:
        return fmt.Sprintf("%.1f MB", float64(bytes)/float64(MB))
    case bytes >= KB:
        return fmt.Sprintf("%.1f KB", float64(bytes)/float64(KB))
    default:
        return fmt.Sprintf("%d B", bytes)
    }
}

func main() {
    size, err := getDirectorySize("/tmp")
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    fmt.Printf("Size: %s\n", formatSize(size))
}
```

**Key concept:** Go doesn't have try/catch. Functions return `(result, error)` and you check `if err != nil`.

**Exercise:** Write a function `expandPath(path string) string` that expands `~` to the home directory.

### 0.6 Goroutines & Channels (Concurrency)

This is Go's superpower — easy concurrency.

```go
package main

import (
    "fmt"
    "time"
)

// Simulate scanning a directory
func scanDirectory(path string, results chan<- string) {
    time.Sleep(100 * time.Millisecond) // Simulate work
    results <- fmt.Sprintf("Scanned: %s", path)
}

func main() {
    paths := []string{
        "~/Library/Caches",
        "~/Library/Developer",
        "~/.npm",
        "~/.cargo",
    }

    // Create a channel to receive results
    results := make(chan string, len(paths))

    // Start goroutines (like Promise.all but better)
    start := time.Now()
    for _, path := range paths {
        go scanDirectory(path, results)  // `go` keyword launches goroutine
    }

    // Collect results
    for i := 0; i < len(paths); i++ {
        result := <-results  // Receive from channel
        fmt.Println(result)
    }

    fmt.Printf("Total time: %v\n", time.Since(start))
    // Should be ~100ms, not 400ms (parallel!)
}
```

**Exercise:** Modify to also send back a size (use a struct for the channel type).

---

## Phase 1: Directory Scanner (Day 3-5)

Now let's build the core scanner. Create a new project:

```bash
mkdir -p ~/code/disk-peek-scanner
cd ~/code/disk-peek-scanner
go mod init disk-peek-scanner
```

### 1.1 Basic Directory Walker

Create `scanner/walker.go`:

```go
package scanner

import (
    "os"
    "path/filepath"
)

// WalkResult holds the scan result for a path
type WalkResult struct {
    Path  string
    Size  int64
    Files int
    Dirs  int
    Error error
}

// WalkDirectory calculates the total size of a directory
func WalkDirectory(root string) WalkResult {
    result := WalkResult{Path: root}

    err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            // Skip permission errors, continue walking
            return nil
        }

        if info.IsDir() {
            result.Dirs++
        } else {
            result.Files++
            result.Size += info.Size()
        }

        return nil
    })

    result.Error = err
    return result
}
```

Create `main.go` to test:

```go
package main

import (
    "disk-peek-scanner/scanner"
    "fmt"
    "os"
    "time"
)

func main() {
    home, _ := os.UserHomeDir()
    testPath := filepath.Join(home, "Library", "Caches")

    fmt.Printf("Scanning: %s\n", testPath)
    start := time.Now()

    result := scanner.WalkDirectory(testPath)

    fmt.Printf("Size: %d bytes (%.2f GB)\n", result.Size, float64(result.Size)/(1024*1024*1024))
    fmt.Printf("Files: %d, Dirs: %d\n", result.Files, result.Dirs)
    fmt.Printf("Time: %v\n", time.Since(start))
}
```

**Run it:**

```bash
go run main.go
```

**Exercise:** Add a `MaxDepth` parameter to limit how deep the walker goes.

### 1.2 Parallel Scanner with Worker Pool

Create `scanner/parallel.go`:

```go
package scanner

import (
    "sync"
)

// ScanPaths scans multiple paths concurrently
func ScanPaths(paths []string, workers int) []WalkResult {
    results := make([]WalkResult, len(paths))

    // Create a channel for jobs
    jobs := make(chan int, len(paths))

    // WaitGroup to know when all workers are done
    var wg sync.WaitGroup

    // Start worker goroutines
    for w := 0; w < workers; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for i := range jobs {
                results[i] = WalkDirectory(paths[i])
            }
        }()
    }

    // Send jobs
    for i := range paths {
        jobs <- i
    }
    close(jobs)

    // Wait for all workers
    wg.Wait()

    return results
}
```

**Key concepts:**

- `sync.WaitGroup` — Wait for multiple goroutines to finish
- `chan` — Channel for passing work to workers
- Worker pool pattern — Limit concurrent operations

**Exercise:** Add a progress callback `func(completed int, total int)` to report scan progress.

### 1.3 Category Definitions

Create `scanner/categories.go`:

```go
package scanner

import (
    "os"
    "path/filepath"
)

type Category struct {
    ID       string     `json:"id"`
    Name     string     `json:"name"`
    Icon     string     `json:"icon"`
    Color    string     `json:"color"`
    Paths    []string   `json:"-"`  // Don't send to frontend
    Size     int64      `json:"size"`
    Children []Category `json:"children,omitempty"`
}

func GetCategories() []Category {
    home, _ := os.UserHomeDir()

    return []Category{
        {
            ID:    "xcode",
            Name:  "Xcode",
            Icon:  "🔨",
            Color: "#3b82f6",
            Children: []Category{
                {
                    ID:    "xcode-derived",
                    Name:  "DerivedData",
                    Icon:  "📁",
                    Color: "#3b82f6",
                    Paths: []string{filepath.Join(home, "Library/Developer/Xcode/DerivedData")},
                },
                {
                    ID:    "xcode-archives",
                    Name:  "Archives",
                    Icon:  "📦",
                    Color: "#60a5fa",
                    Paths: []string{filepath.Join(home, "Library/Developer/Xcode/Archives")},
                },
                {
                    ID:    "xcode-devices",
                    Name:  "iOS DeviceSupport",
                    Icon:  "📱",
                    Color: "#93c5fd",
                    Paths: []string{filepath.Join(home, "Library/Developer/Xcode/iOS DeviceSupport")},
                },
            },
        },
        {
            ID:    "node",
            Name:  "Node.js",
            Icon:  "📦",
            Color: "#22c55e",
            Children: []Category{
                {
                    ID:    "npm-cache",
                    Name:  "npm cache",
                    Icon:  "💾",
                    Color: "#22c55e",
                    Paths: []string{filepath.Join(home, ".npm")},
                },
                {
                    ID:    "yarn-cache",
                    Name:  "yarn cache",
                    Icon:  "🧶",
                    Color: "#4ade80",
                    Paths: []string{filepath.Join(home, "Library/Caches/Yarn")},
                },
            },
        },
        // Add more categories...
    }
}
```

**Exercise:** Add Docker, Rust, Go, and System categories with their paths.

### 1.4 Full Scanner Implementation

Create `scanner/scanner.go`:

```go
package scanner

import (
    "sync"
    "time"
)

type ScanResult struct {
    Categories   []Category    `json:"categories"`
    TotalSize    int64         `json:"totalSize"`
    ScanDuration time.Duration `json:"scanDuration"`
}

type Scanner struct {
    workers int
}

func NewScanner(workers int) *Scanner {
    return &Scanner{workers: workers}
}

func (s *Scanner) Scan() ScanResult {
    start := time.Now()
    categories := GetCategories()

    // Collect all paths to scan
    var allPaths []string
    pathToCategory := make(map[string]*Category)

    var collectPaths func(cats []Category)
    collectPaths = func(cats []Category) {
        for i := range cats {
            for _, path := range cats[i].Paths {
                allPaths = append(allPaths, path)
                pathToCategory[path] = &cats[i]
            }
            if len(cats[i].Children) > 0 {
                collectPaths(cats[i].Children)
            }
        }
    }
    collectPaths(categories)

    // Scan all paths in parallel
    results := ScanPaths(allPaths, s.workers)

    // Map results back to categories
    for i, result := range results {
        if cat, ok := pathToCategory[allPaths[i]]; ok {
            cat.Size = result.Size
        }
    }

    // Calculate parent sizes
    var calculateParentSizes func(cats []Category) int64
    calculateParentSizes = func(cats []Category) int64 {
        var total int64
        for i := range cats {
            if len(cats[i].Children) > 0 {
                cats[i].Size = calculateParentSizes(cats[i].Children)
            }
            total += cats[i].Size
        }
        return total
    }
    totalSize := calculateParentSizes(categories)

    return ScanResult{
        Categories:   categories,
        TotalSize:    totalSize,
        ScanDuration: time.Since(start),
    }
}
```

**Test it:**

```go
// main.go
package main

import (
    "disk-peek-scanner/scanner"
    "encoding/json"
    "fmt"
)

func main() {
    s := scanner.NewScanner(4) // 4 workers
    result := s.Scan()

    // Pretty print JSON
    jsonBytes, _ := json.MarshalIndent(result, "", "  ")
    fmt.Println(string(jsonBytes))
}
```

### 1.5 Full Disk Scanner (Normal Mode)

This is for scanning the entire filesystem, not just dev caches.

Create `scanner/fullscan.go`:

```go
package scanner

import (
    "os"
    "path/filepath"
    "sort"
    "sync"
)

// FileNode represents a file or directory in the hierarchy
type FileNode struct {
    Name     string      `json:"name"`
    Path     string      `json:"path"`
    Size     int64       `json:"size"`
    IsDir    bool        `json:"isDir"`
    Children []*FileNode `json:"children,omitempty"`
}

// FullScanner scans entire directories recursively
type FullScanner struct {
    workers   int
    maxDepth  int
    minSize   int64  // Minimum size to include (filter noise)
}

func NewFullScanner(workers, maxDepth int, minSize int64) *FullScanner {
    return &FullScanner{
        workers:  workers,
        maxDepth: maxDepth,
        minSize:  minSize,
    }
}

// ScanDirectory scans a directory and returns a tree structure
func (fs *FullScanner) ScanDirectory(root string) (*FileNode, error) {
    info, err := os.Stat(root)
    if err != nil {
        return nil, err
    }

    rootNode := &FileNode{
        Name:  info.Name(),
        Path:  root,
        IsDir: info.IsDir(),
    }

    if !info.IsDir() {
        rootNode.Size = info.Size()
        return rootNode, nil
    }

    // Scan recursively
    fs.scanRecursive(rootNode, 0)

    // Sort children by size (largest first)
    fs.sortBySize(rootNode)

    return rootNode, nil
}

func (fs *FullScanner) scanRecursive(node *FileNode, depth int) {
    if depth >= fs.maxDepth {
        // At max depth, just calculate total size without children
        node.Size = fs.calculateDirSize(node.Path)
        return
    }

    entries, err := os.ReadDir(node.Path)
    if err != nil {
        return // Skip directories we can't read
    }

    var wg sync.WaitGroup
    var mu sync.Mutex
    children := make([]*FileNode, 0, len(entries))

    // Use semaphore to limit concurrent goroutines
    sem := make(chan struct{}, fs.workers)

    for _, entry := range entries {
        // Skip hidden files (optional)
        if entry.Name()[0] == '.' {
            continue
        }

        wg.Add(1)
        go func(e os.DirEntry) {
            defer wg.Done()
            sem <- struct{}{}        // Acquire
            defer func() { <-sem }() // Release

            info, err := e.Info()
            if err != nil {
                return
            }

            childPath := filepath.Join(node.Path, e.Name())
            child := &FileNode{
                Name:  e.Name(),
                Path:  childPath,
                IsDir: e.IsDir(),
            }

            if e.IsDir() {
                fs.scanRecursive(child, depth+1)
            } else {
                child.Size = info.Size()
            }

            // Filter small items
            if child.Size >= fs.minSize {
                mu.Lock()
                children = append(children, child)
                mu.Unlock()
            }
        }(entry)
    }

    wg.Wait()

    node.Children = children

    // Calculate total size
    var total int64
    for _, child := range children {
        total += child.Size
    }
    node.Size = total
}

func (fs *FullScanner) calculateDirSize(path string) int64 {
    var size int64
    filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
        if err != nil {
            return nil
        }
        if !info.IsDir() {
            size += info.Size()
        }
        return nil
    })
    return size
}

func (fs *FullScanner) sortBySize(node *FileNode) {
    if node.Children == nil {
        return
    }

    sort.Slice(node.Children, func(i, j int) bool {
        return node.Children[i].Size > node.Children[j].Size
    })

    for _, child := range node.Children {
        fs.sortBySize(child)
    }
}
```

**Test the full scanner:**

```go
package main

import (
    "disk-peek-scanner/scanner"
    "encoding/json"
    "fmt"
    "os"
)

func main() {
    home, _ := os.UserHomeDir()

    // Scan home directory, max 3 levels deep, min 1MB files
    fs := scanner.NewFullScanner(8, 3, 1024*1024)

    fmt.Println("Scanning", home, "...")
    root, err := fs.ScanDirectory(home)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    // Print top-level summary
    fmt.Printf("\nTotal: %.2f GB\n\n", float64(root.Size)/(1024*1024*1024))
    fmt.Println("Top folders:")
    for i, child := range root.Children {
        if i >= 10 {
            break
        }
        fmt.Printf("  %.2f GB  %s\n",
            float64(child.Size)/(1024*1024*1024),
            child.Name)
    }
}
```

**Key differences from Dev Mode:**

- Scans any directory, not predefined paths
- Builds actual filesystem tree structure
- Can go arbitrarily deep
- Filters by minimum size to reduce noise
- Sorts by size for easy identification

**Exercise:** Add a progress callback that reports how many directories have been scanned.

### 1.6 Using Interfaces (Go Pattern)

Both scanners can implement a common interface. This is idiomatic Go:

```go
// scanner/types.go
package scanner

// ScanMode represents the type of scan
type ScanMode string

const (
    ModeDev    ScanMode = "dev"
    ModeNormal ScanMode = "normal"
)

// ScanProgress reports scan progress
type ScanProgress struct {
    Current     int    `json:"current"`
    Total       int    `json:"total"`
    CurrentPath string `json:"currentPath"`
}

// ProgressCallback is called during scanning
type ProgressCallback func(ScanProgress)

// GenericResult is a unified result type for both modes
type GenericResult struct {
    Mode         ScanMode      `json:"mode"`
    TotalSize    int64         `json:"totalSize"`
    ScanDuration time.Duration `json:"scanDuration"`

    // Dev mode uses Categories
    Categories []Category `json:"categories,omitempty"`

    // Normal mode uses FileTree
    FileTree *FileNode `json:"fileTree,omitempty"`
}
```

This lets the frontend handle both results with one type while keeping the backend implementations separate.

---

## Phase 2: Wails Integration (Day 6-8)

Now let's create the actual Wails app.

### 2.1 Create Wails Project

```bash
cd ~/code
wails init -n disk-peek -t react-ts
cd disk-peek
```

### 2.2 Copy Scanner Code

```bash
mkdir -p internal/scanner
# Copy your scanner files to internal/scanner/
```

### 2.3 Create App Binding

Edit `app.go`:

```go
package main

import (
    "context"
    "disk-peek/internal/scanner"
)

type App struct {
    ctx         context.Context
    devScanner  *scanner.Scanner
    fullScanner *scanner.FullScanner
}

func NewApp() *App {
    return &App{
        devScanner:  scanner.NewScanner(4),
        fullScanner: scanner.NewFullScanner(8, 10, 1024*1024), // 10 levels, min 1MB
    }
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
}

// ScanDev runs a targeted scan of developer caches (Dev Mode)
func (a *App) ScanDev() scanner.ScanResult {
    return a.devScanner.Scan()
}

// ScanFull runs a full directory scan (Normal Mode)
func (a *App) ScanFull(path string) (*scanner.FileNode, error) {
    return a.fullScanner.ScanDirectory(path)
}

// GetDevCategories returns the category structure for Dev Mode
func (a *App) GetDevCategories() []scanner.Category {
    return scanner.GetCategories()
}

// CleanPaths deletes the specified paths (moves to Trash)
func (a *App) CleanPaths(paths []string) (int64, error) {
    // We'll implement this later
    return 0, nil
}

// GetHomeDir returns the user's home directory
func (a *App) GetHomeDir() string {
    home, _ := os.UserHomeDir()
    return home
}
```

### 2.4 Bind to Frontend

Edit `main.go`:

```go
package main

import (
    "embed"
    "github.com/wailsapp/wails/v2"
    "github.com/wailsapp/wails/v2/pkg/options"
    "github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
    app := NewApp()

    err := wails.Run(&options.App{
        Title:  "Disk Peek",
        Width:  800,
        Height: 600,
        AssetServer: &assetserver.Options{
            Assets: assets,
        },
        OnStartup: app.startup,
        Bind: []interface{}{
            app,
        },
    })

    if err != nil {
        println("Error:", err.Error())
    }
}
```

### 2.5 Frontend Integration

The Wails binding generates TypeScript types automatically. In your React code:

```typescript
// frontend/src/App.tsx
import { useState } from 'react';
import { ScanDev, ScanFull, GetHomeDir } from '../wailsjs/go/main/App';
import { scanner } from '../wailsjs/go/models';

type Mode = 'normal' | 'dev';

function App() {
  const [mode, setMode] = useState<Mode>('normal');
  const [scanning, setScanning] = useState(false);

  // Dev mode state
  const [categories, setCategories] = useState<scanner.Category[]>([]);

  // Normal mode state
  const [fileTree, setFileTree] = useState<scanner.FileNode | null>(null);

  const handleScan = async () => {
    setScanning(true);
    try {
      if (mode === 'dev') {
        const result = await ScanDev();
        setCategories(result.categories);
      } else {
        const home = await GetHomeDir();
        const tree = await ScanFull(home);
        setFileTree(tree);
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={mode === 'normal' ? 'active' : ''}
          onClick={() => setMode('normal')}
        >
          🖥️ Normal Mode
        </button>
        <button
          className={mode === 'dev' ? 'active' : ''}
          onClick={() => setMode('dev')}
        >
          🛠️ Dev Mode
        </button>
      </div>

      <button onClick={handleScan} disabled={scanning}>
        {scanning ? 'Scanning...' : 'Scan'}
      </button>

      {/* Render drill-down UI based on mode */}
      {mode === 'dev' ? (
        <DevModeView categories={categories} />
      ) : (
        <NormalModeView tree={fileTree} />
      )}
    </div>
  );
}
```

### 2.6 Shared Drill-down Component

Both modes use the same drill-down UI pattern, just different data:

```typescript
// frontend/src/components/DrilldownView.tsx
interface DrilldownItem {
  id: string;
  name: string;
  size: number;
  icon?: string;
  color?: string;
  children?: DrilldownItem[];
}

interface DrilldownViewProps {
  items: DrilldownItem[];
  onNavigate: (item: DrilldownItem) => void;
  breadcrumbs: string[];
  onBreadcrumbClick: (index: number) => void;
}

function DrilldownView({ items, onNavigate, breadcrumbs, onBreadcrumbClick }: DrilldownViewProps) {
  const total = items.reduce((sum, item) => sum + item.size, 0);

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} onClick={() => onBreadcrumbClick(i)}>
            {crumb} {i < breadcrumbs.length - 1 && ' / '}
          </span>
        ))}
      </div>

      {/* Stacked bar */}
      <div className="stacked-bar">
        {items.map(item => (
          <div
            key={item.id}
            style={{
              width: `${(item.size / total) * 100}%`,
              background: item.color || '#6b7280'
            }}
            onClick={() => item.children && onNavigate(item)}
          />
        ))}
      </div>

      {/* Item list */}
      <div className="items">
        {items.map(item => (
          <div
            key={item.id}
            className="item"
            onClick={() => item.children && onNavigate(item)}
          >
            <span className="icon">{item.icon || '📁'}</span>
            <span className="name">{item.name}</span>
            <span className="size">{formatSize(item.size)}</span>
            {item.children && <span className="chevron">›</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.6 Run the App

```bash
wails dev
```

---

## Phase 3: Cleaner Implementation (Day 9-10)

### 3.1 Move to Trash (macOS)

Create `internal/cleaner/cleaner.go`:

```go
package cleaner

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Foundation -framework AppKit
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>

int moveToTrash(const char* path) {
    NSString *nsPath = [NSString stringWithUTF8String:path];
    NSURL *url = [NSURL fileURLWithPath:nsPath];
    NSError *error = nil;

    [[NSFileManager defaultManager] trashItemAtURL:url
                                  resultingItemURL:nil
                                             error:&error];

    if (error != nil) {
        return -1;
    }
    return 0;
}
*/
import "C"

import (
    "errors"
)

// MoveToTrash moves a file or directory to the macOS Trash
func MoveToTrash(path string) error {
    result := C.moveToTrash(C.CString(path))
    if result != 0 {
        return errors.New("failed to move to trash: " + path)
    }
    return nil
}

// CleanPaths moves multiple paths to Trash
func CleanPaths(paths []string) (int64, error) {
    var freedSize int64

    for _, path := range paths {
        // Get size before deleting
        size := getPathSize(path)

        err := MoveToTrash(path)
        if err != nil {
            return freedSize, err
        }

        freedSize += size
    }

    return freedSize, nil
}
```

**Note:** This uses cgo to call native macOS APIs. The Trash is recoverable!

---

## Phase 4: Polish & Learn (Day 11-14)

### 4.1 Progress Events

Wails supports events to update the frontend during long operations:

```go
package main

import (
    "github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) ScanWithProgress() scanner.ScanResult {
    // Emit progress events
    runtime.EventsEmit(a.ctx, "scan:started", nil)

    result := a.scanner.ScanWithProgress(func(completed, total int) {
        runtime.EventsEmit(a.ctx, "scan:progress", map[string]int{
            "completed": completed,
            "total":     total,
        })
    })

    runtime.EventsEmit(a.ctx, "scan:completed", result)
    return result
}
```

Frontend:

```typescript
import { EventsOn } from "../wailsjs/runtime/runtime";

useEffect(() => {
  EventsOn("scan:progress", (data) => {
    setProgress((data.completed / data.total) * 100);
  });
}, []);
```

### 4.2 Testing

Create `scanner/scanner_test.go`:

```go
package scanner

import (
    "testing"
)

func TestWalkDirectory(t *testing.T) {
    result := WalkDirectory("/tmp")

    if result.Error != nil {
        t.Errorf("unexpected error: %v", result.Error)
    }

    if result.Size < 0 {
        t.Error("size should not be negative")
    }
}

func TestFormatSize(t *testing.T) {
    tests := []struct {
        input    int64
        expected string
    }{
        {1024, "1.0 KB"},
        {1048576, "1.0 MB"},
        {1073741824, "1.0 GB"},
    }

    for _, tt := range tests {
        result := FormatSize(tt.input)
        if result != tt.expected {
            t.Errorf("FormatSize(%d) = %s, want %s", tt.input, result, tt.expected)
        }
    }
}
```

Run tests:

```bash
go test ./...
```

---

## Quick Reference Card

### Go vs TypeScript Cheatsheet

| TypeScript                        | Go                                  |
| --------------------------------- | ----------------------------------- |
| `const x = 5`                     | `x := 5`                            |
| `let x: number = 5`               | `var x int = 5`                     |
| `interface User { name: string }` | `type User struct { Name string }`  |
| `string[]`                        | `[]string`                          |
| `Record<string, number>`          | `map[string]int`                    |
| `async/await`                     | goroutines + channels               |
| `try/catch`                       | `if err != nil`                     |
| `export function`                 | `func Name()` (uppercase = public)  |
| `private method`                  | `func name()` (lowercase = private) |
| `null`                            | `nil`                               |
| `console.log()`                   | `fmt.Println()`                     |

### Common Commands

```bash
# Run
go run main.go

# Build
go build -o disk-peek

# Test
go test ./...

# Format code
go fmt ./...

# Check for issues
go vet ./...

# Add dependency
go get github.com/some/package

# Wails dev mode
wails dev

# Wails build
wails build
```

### File Structure

```
disk-peek/
├── main.go                # Entry point
├── app.go                 # Wails app bindings (both modes)
├── go.mod                 # Dependencies
├── internal/
│   ├── scanner/
│   │   ├── types.go       # Shared types (Category, FileNode, etc.)
│   │   ├── walker.go      # Low-level directory walking
│   │   ├── devscan.go     # Dev Mode: category-based scanner
│   │   ├── fullscan.go    # Normal Mode: full directory scanner
│   │   ├── categories.go  # Dev Mode category definitions
│   │   └── scanner_test.go
│   └── cleaner/
│       └── cleaner.go     # Trash operations (shared)
└── frontend/
    ├── src/
    │   ├── App.tsx           # Mode switcher + main layout
    │   ├── components/
    │   │   ├── DrilldownView.tsx  # Shared drill-down UI
    │   │   ├── DevMode.tsx        # Dev mode wrapper
    │   │   ├── NormalMode.tsx     # Normal mode wrapper
    │   │   └── ModeToggle.tsx     # Mode switch component
    │   └── hooks/
    │       └── useScan.ts    # Scan state management
    └── wailsjs/              # Auto-generated bindings
```

---

## Exercises Summary

1. **Phase 0:** Basic Go syntax, structs, error handling
2. **Phase 1:** Build both scanners:
   - Dev Mode scanner with predefined categories
   - Normal Mode full directory scanner
3. **Phase 2:** Integrate with Wails, implement mode switcher
4. **Phase 3:** Implement cleaning functionality (shared by both modes)
5. **Phase 4:** Add progress events, write tests

---

## Resources

- [Go Tour](https://go.dev/tour/) — Interactive Go tutorial
- [Go by Example](https://gobyexample.com/) — Practical examples
- [Wails Docs](https://wails.io/docs/introduction) — Framework docs
- [Effective Go](https://go.dev/doc/effective_go) — Best practices

---

## Next Steps After MVP

1. Find `node_modules` across all projects (recursive search)
2. Add file type breakdown within categories
3. Implement scheduled scans
4. Add menu bar quick-access mode
5. Publish to Homebrew

---

_Happy coding! Build incrementally, test often, and enjoy learning Go._ 🚀
