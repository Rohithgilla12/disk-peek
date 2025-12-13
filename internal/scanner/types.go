package scanner

import "time"

// ScanMode represents the type of scan
type ScanMode string

const (
	ModeDev    ScanMode = "dev"
	ModeNormal ScanMode = "normal"
)

// Category represents a scannable category in Dev Mode
// Categories can be nested (e.g., Xcode > DerivedData, Archives)
type Category struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description,omitempty"`
	Icon        string     `json:"icon"`
	Color       string     `json:"color"`
	Paths       []string   `json:"-"` // Don't expose raw paths to frontend
	Size        int64      `json:"size"`
	ItemCount   int        `json:"itemCount"`
	Children    []Category `json:"children,omitempty"`
	Selected    bool       `json:"selected"`
}

// FileNode represents a file or directory in Normal Mode's tree view
type FileNode struct {
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	Size     int64       `json:"size"`
	IsDir    bool        `json:"isDir"`
	ModTime  time.Time   `json:"modTime,omitempty"`
	Children []*FileNode `json:"children,omitempty"`
}

// ScanResult is the unified result for Dev Mode scans
type ScanResult struct {
	Mode         ScanMode      `json:"mode"`
	Categories   []Category    `json:"categories"`
	TotalSize    int64         `json:"totalSize"`
	ScanDuration time.Duration `json:"scanDuration"`
}

// FullScanResult is the result for Normal Mode scans
type FullScanResult struct {
	Mode         ScanMode      `json:"mode"`
	Root         *FileNode     `json:"root"`
	TotalSize    int64         `json:"totalSize"`
	ScanDuration time.Duration `json:"scanDuration"`
}

// ScanProgress reports scan progress to the frontend
type ScanProgress struct {
	Current     int    `json:"current"`
	Total       int    `json:"total"`
	CurrentPath string `json:"currentPath"`
	BytesScanned int64 `json:"bytesScanned"`
}

// CleanResult is returned after cleaning operations
type CleanResult struct {
	FreedBytes   int64    `json:"freedBytes"`
	DeletedPaths []string `json:"deletedPaths"`
	Errors       []string `json:"errors,omitempty"`
}

// CleanProgress reports cleaning progress to the frontend
type CleanProgress struct {
	Current      int    `json:"current"`
	Total        int    `json:"total"`
	CurrentPath  string `json:"currentPath"`
	BytesFreed   int64  `json:"bytesFreed"`
	CurrentItem  string `json:"currentItem"`
}

// CleanProgressCallback is called during cleaning to report progress
type CleanProgressCallback func(CleanProgress)

// WalkResult holds the scan result for a single path
type WalkResult struct {
	Path      string
	Size      int64
	FileCount int
	DirCount  int
	Error     error
}

// ProgressCallback is called during scanning to report progress
type ProgressCallback func(ScanProgress)
