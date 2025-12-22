package cache

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"disk-peek/internal/scanner"
)

// CachedDevScan represents a cached dev scan result with metadata
type CachedDevScan struct {
	Result    scanner.ScanResult `json:"result"`
	Timestamp time.Time          `json:"timestamp"`
	Version   string             `json:"version"`
}

// CachedNormalScan represents a cached normal scan result with metadata
type CachedNormalScan struct {
	Result    scanner.FullScanResult `json:"result"`
	Timestamp time.Time              `json:"timestamp"`
	RootPath  string                 `json:"rootPath"`
	Version   string                 `json:"version"`
}

const (
	cacheVersion    = "1.0"
	devCacheFile    = "dev_scan_cache.json"
	normalCacheFile = "normal_scan_cache.json"
)

// getCacheDir returns the cache directory path
func getCacheDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	cacheDir := filepath.Join(home, ".config", "disk-peek", "cache")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return "", err
	}
	return cacheDir, nil
}

// SaveDevScan saves a dev scan result to cache
func SaveDevScan(result scanner.ScanResult) error {
	cacheDir, err := getCacheDir()
	if err != nil {
		return err
	}

	cached := CachedDevScan{
		Result:    result,
		Timestamp: time.Now(),
		Version:   cacheVersion,
	}

	data, err := json.MarshalIndent(cached, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(cacheDir, devCacheFile), data, 0644)
}

// LoadDevScan loads a cached dev scan result
// Returns nil if no cache exists or cache is invalid
func LoadDevScan() *CachedDevScan {
	cacheDir, err := getCacheDir()
	if err != nil {
		return nil
	}

	data, err := os.ReadFile(filepath.Join(cacheDir, devCacheFile))
	if err != nil {
		return nil
	}

	var cached CachedDevScan
	if err := json.Unmarshal(data, &cached); err != nil {
		return nil
	}

	// Check version compatibility
	if cached.Version != cacheVersion {
		return nil
	}

	return &cached
}

// SaveNormalScan saves a normal scan result to cache
func SaveNormalScan(result scanner.FullScanResult, rootPath string) error {
	cacheDir, err := getCacheDir()
	if err != nil {
		return err
	}

	cached := CachedNormalScan{
		Result:    result,
		Timestamp: time.Now(),
		RootPath:  rootPath,
		Version:   cacheVersion,
	}

	data, err := json.MarshalIndent(cached, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(cacheDir, normalCacheFile), data, 0644)
}

// LoadNormalScan loads a cached normal scan result
// Returns nil if no cache exists or cache is invalid
func LoadNormalScan() *CachedNormalScan {
	cacheDir, err := getCacheDir()
	if err != nil {
		return nil
	}

	data, err := os.ReadFile(filepath.Join(cacheDir, normalCacheFile))
	if err != nil {
		return nil
	}

	var cached CachedNormalScan
	if err := json.Unmarshal(data, &cached); err != nil {
		return nil
	}

	// Check version compatibility
	if cached.Version != cacheVersion {
		return nil
	}

	return &cached
}

// ClearCache removes all cached scan results
func ClearCache() error {
	cacheDir, err := getCacheDir()
	if err != nil {
		return err
	}

	_ = os.Remove(filepath.Join(cacheDir, devCacheFile))
	_ = os.Remove(filepath.Join(cacheDir, normalCacheFile))
	return nil
}

// GetCacheInfo returns information about cached scans
type CacheInfo struct {
	HasDevCache    bool      `json:"hasDevCache"`
	DevTimestamp   time.Time `json:"devTimestamp"`
	HasNormalCache bool      `json:"hasNormalCache"`
	NormalTimestamp time.Time `json:"normalTimestamp"`
}

// GetCacheInfo returns information about available cached scans
func GetCacheInfo() CacheInfo {
	info := CacheInfo{}

	if devCache := LoadDevScan(); devCache != nil {
		info.HasDevCache = true
		info.DevTimestamp = devCache.Timestamp
	}

	if normalCache := LoadNormalScan(); normalCache != nil {
		info.HasNormalCache = true
		info.NormalTimestamp = normalCache.Timestamp
	}

	return info
}
