package updater

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	// GitHubRepo is the repository to check for updates
	GitHubRepo = "Rohithgilla12/disk-peek"
	// GitHubAPIURL is the base URL for GitHub API
	GitHubAPIURL = "https://api.github.com"
)

// Version information - these are set at build time via ldflags
var (
	Version   = "dev"
	BuildTime = "unknown"
	GitCommit = "unknown"
)

// ReleaseAsset represents a downloadable asset from a release
type ReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
	ContentType        string `json:"content_type"`
}

// Release represents a GitHub release
type Release struct {
	TagName     string         `json:"tag_name"`
	Name        string         `json:"name"`
	Body        string         `json:"body"`
	Draft       bool           `json:"draft"`
	Prerelease  bool           `json:"prerelease"`
	PublishedAt string         `json:"published_at"`
	HTMLURL     string         `json:"html_url"`
	Assets      []ReleaseAsset `json:"assets"`
}

// UpdateInfo contains information about an available update
type UpdateInfo struct {
	CurrentVersion   string `json:"currentVersion"`
	LatestVersion    string `json:"latestVersion"`
	UpdateAvailable  bool   `json:"updateAvailable"`
	ReleaseNotes     string `json:"releaseNotes"`
	ReleaseURL       string `json:"releaseUrl"`
	DownloadURL      string `json:"downloadUrl"`
	AssetName        string `json:"assetName"`
	AssetSize        int64  `json:"assetSize"`
	PublishedAt      string `json:"publishedAt"`
}

// DownloadProgress represents download progress information
type DownloadProgress struct {
	Downloaded int64   `json:"downloaded"`
	Total      int64   `json:"total"`
	Percent    float64 `json:"percent"`
}

// Updater handles checking for and applying updates
type Updater struct {
	currentVersion string
	httpClient     *http.Client
}

// NewUpdater creates a new Updater instance
func NewUpdater() *Updater {
	return &Updater{
		currentVersion: Version,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetCurrentVersion returns the current application version
func (u *Updater) GetCurrentVersion() string {
	return u.currentVersion
}

// GetVersionInfo returns detailed version information
func (u *Updater) GetVersionInfo() map[string]string {
	return map[string]string{
		"version":   Version,
		"buildTime": BuildTime,
		"gitCommit": GitCommit,
	}
}

// CheckForUpdates checks GitHub for the latest release
func (u *Updater) CheckForUpdates() (*UpdateInfo, error) {
	release, err := u.getLatestRelease()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch latest release: %w", err)
	}

	latestVersion := strings.TrimPrefix(release.TagName, "v")
	currentVersion := strings.TrimPrefix(u.currentVersion, "v")

	updateAvailable := isNewerVersion(latestVersion, currentVersion)

	// Find the appropriate download asset based on architecture
	downloadURL, assetName, assetSize := u.findDownloadAsset(release.Assets)

	return &UpdateInfo{
		CurrentVersion:  u.currentVersion,
		LatestVersion:   release.TagName,
		UpdateAvailable: updateAvailable,
		ReleaseNotes:    release.Body,
		ReleaseURL:      release.HTMLURL,
		DownloadURL:     downloadURL,
		AssetName:       assetName,
		AssetSize:       assetSize,
		PublishedAt:     release.PublishedAt,
	}, nil
}

// getLatestRelease fetches the latest release from GitHub
func (u *Updater) getLatestRelease() (*Release, error) {
	url := fmt.Sprintf("%s/repos/%s/releases/latest", GitHubAPIURL, GitHubRepo)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "disk-peek-updater")

	resp, err := u.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API returned %d: %s", resp.StatusCode, string(body))
	}

	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("failed to decode release: %w", err)
	}

	return &release, nil
}

// findDownloadAsset finds the appropriate DMG asset for the current architecture
func (u *Updater) findDownloadAsset(assets []ReleaseAsset) (downloadURL, assetName string, size int64) {
	// Determine preferred asset based on architecture
	arch := runtime.GOARCH
	preferredSuffix := "-universal.dmg"
	fallbackSuffix := ".dmg"

	if arch == "arm64" {
		preferredSuffix = "-arm64.dmg"
	}

	// First, look for preferred asset
	for _, asset := range assets {
		if strings.HasSuffix(asset.Name, preferredSuffix) {
			return asset.BrowserDownloadURL, asset.Name, asset.Size
		}
	}

	// Fall back to any DMG
	for _, asset := range assets {
		if strings.HasSuffix(asset.Name, fallbackSuffix) {
			return asset.BrowserDownloadURL, asset.Name, asset.Size
		}
	}

	return "", "", 0
}

// DownloadUpdate downloads the update DMG to a temporary location
func (u *Updater) DownloadUpdate(downloadURL string, progressCallback func(DownloadProgress)) (string, error) {
	if downloadURL == "" {
		return "", fmt.Errorf("no download URL provided")
	}

	// Create temp file for download
	tmpDir := os.TempDir()
	tmpFile, err := os.CreateTemp(tmpDir, "disk-peek-update-*.dmg")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer tmpFile.Close()

	// Download the file
	resp, err := u.httpClient.Get(downloadURL)
	if err != nil {
		os.Remove(tmpFile.Name())
		return "", fmt.Errorf("failed to download update: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		os.Remove(tmpFile.Name())
		return "", fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	totalSize := resp.ContentLength
	var downloaded int64

	// Read and write with progress updates
	buffer := make([]byte, 32*1024) // 32KB buffer
	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			_, writeErr := tmpFile.Write(buffer[:n])
			if writeErr != nil {
				os.Remove(tmpFile.Name())
				return "", fmt.Errorf("failed to write to temp file: %w", writeErr)
			}
			downloaded += int64(n)

			if progressCallback != nil && totalSize > 0 {
				progressCallback(DownloadProgress{
					Downloaded: downloaded,
					Total:      totalSize,
					Percent:    float64(downloaded) / float64(totalSize) * 100,
				})
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			os.Remove(tmpFile.Name())
			return "", fmt.Errorf("error reading download: %w", err)
		}
	}

	return tmpFile.Name(), nil
}

// InstallUpdate mounts the DMG and opens it for the user to install
func (u *Updater) InstallUpdate(dmgPath string) error {
	if _, err := os.Stat(dmgPath); os.IsNotExist(err) {
		return fmt.Errorf("DMG file not found: %s", dmgPath)
	}

	// Open the DMG file - this will mount it and show in Finder
	cmd := exec.Command("open", dmgPath)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to open DMG: %w", err)
	}

	return nil
}

// OpenReleasePage opens the release page in the default browser
func (u *Updater) OpenReleasePage(url string) error {
	cmd := exec.Command("open", url)
	return cmd.Run()
}

// GetDownloadsFolder returns the user's Downloads folder path
func (u *Updater) GetDownloadsFolder() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "Downloads")
}

// isNewerVersion compares two semantic versions
// Returns true if latest is newer than current
func isNewerVersion(latest, current string) bool {
	// Handle "dev" version - always consider updates available
	if current == "dev" || current == "" {
		return false // Don't prompt for updates in dev mode
	}

	latestParts := parseVersion(latest)
	currentParts := parseVersion(current)

	for i := 0; i < 3; i++ {
		if latestParts[i] > currentParts[i] {
			return true
		}
		if latestParts[i] < currentParts[i] {
			return false
		}
	}

	return false
}

// parseVersion extracts major, minor, patch from a version string
func parseVersion(v string) [3]int {
	v = strings.TrimPrefix(v, "v")
	parts := strings.Split(v, ".")

	var result [3]int
	for i := 0; i < len(parts) && i < 3; i++ {
		// Parse the number, ignoring any suffix (like -beta)
		numStr := parts[i]
		if idx := strings.IndexAny(numStr, "-+"); idx != -1 {
			numStr = numStr[:idx]
		}
		fmt.Sscanf(numStr, "%d", &result[i])
	}

	return result
}
