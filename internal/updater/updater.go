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
	GitHubOwner = "Rohithgilla12"
	GitHubRepo  = "disk-peek"
)

type GitHubRelease struct {
	TagName     string    `json:"tag_name"`
	Name        string    `json:"name"`
	Body        string    `json:"body"`
	Draft       bool      `json:"draft"`
	Prerelease  bool      `json:"prerelease"`
	PublishedAt time.Time `json:"published_at"`
	Assets      []Asset   `json:"assets"`
	HTMLURL     string    `json:"html_url"`
}

type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
	ContentType        string `json:"content_type"`
}

type UpdateInfo struct {
	Available      bool      `json:"available"`
	CurrentVersion string    `json:"currentVersion"`
	LatestVersion  string    `json:"latestVersion"`
	ReleaseNotes   string    `json:"releaseNotes"`
	DownloadURL    string    `json:"downloadURL"`
	ReleaseURL     string    `json:"releaseURL"`
	PublishedAt    time.Time `json:"publishedAt"`
	AssetSize      int64     `json:"assetSize"`
}

type DownloadProgress struct {
	BytesDownloaded int64   `json:"bytesDownloaded"`
	TotalBytes      int64   `json:"totalBytes"`
	Percent         float64 `json:"percent"`
}

func CheckForUpdate(currentVersion string) (*UpdateInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", GitHubOwner, GitHubRepo)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to check for updates: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return &UpdateInfo{Available: false, CurrentVersion: currentVersion}, nil
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("failed to parse release: %w", err)
	}

	latestVersion := strings.TrimPrefix(release.TagName, "v")
	currentClean := strings.TrimPrefix(currentVersion, "v")

	info := &UpdateInfo{
		CurrentVersion: currentVersion,
		LatestVersion:  release.TagName,
		ReleaseNotes:   release.Body,
		ReleaseURL:     release.HTMLURL,
		PublishedAt:    release.PublishedAt,
	}

	if isNewerVersion(latestVersion, currentClean) {
		info.Available = true
		info.DownloadURL, info.AssetSize = findDMGAsset(release.Assets)
	}

	return info, nil
}

func findDMGAsset(assets []Asset) (string, int64) {
	arch := runtime.GOARCH
	preferred := "universal"
	if arch == "arm64" {
		preferred = "arm64"
	}

	for _, asset := range assets {
		if strings.HasSuffix(asset.Name, ".dmg") && strings.Contains(asset.Name, preferred) {
			return asset.BrowserDownloadURL, asset.Size
		}
	}

	for _, asset := range assets {
		if strings.HasSuffix(asset.Name, ".dmg") {
			return asset.BrowserDownloadURL, asset.Size
		}
	}

	return "", 0
}

func isNewerVersion(latest, current string) bool {
	if current == "dev" || current == "" {
		return true
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

func parseVersion(v string) [3]int {
	v = strings.TrimPrefix(v, "v")
	parts := strings.Split(v, ".")
	var result [3]int
	for i := 0; i < 3 && i < len(parts); i++ {
		fmt.Sscanf(parts[i], "%d", &result[i])
	}
	return result
}

func DownloadUpdate(downloadURL string, progressCallback func(DownloadProgress)) (string, error) {
	resp, err := http.Get(downloadURL)
	if err != nil {
		return "", fmt.Errorf("failed to download update: %w", err)
	}
	defer resp.Body.Close()

	tmpDir := os.TempDir()
	filename := filepath.Base(downloadURL)
	destPath := filepath.Join(tmpDir, filename)

	out, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer out.Close()

	totalBytes := resp.ContentLength
	var bytesDownloaded int64

	buf := make([]byte, 32*1024)
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			_, writeErr := out.Write(buf[:n])
			if writeErr != nil {
				return "", fmt.Errorf("failed to write update: %w", writeErr)
			}
			bytesDownloaded += int64(n)

			if progressCallback != nil && totalBytes > 0 {
				progressCallback(DownloadProgress{
					BytesDownloaded: bytesDownloaded,
					TotalBytes:      totalBytes,
					Percent:         float64(bytesDownloaded) / float64(totalBytes) * 100,
				})
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", fmt.Errorf("failed to download: %w", err)
		}
	}

	return destPath, nil
}

func InstallUpdate(dmgPath string) error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("auto-install only supported on macOS")
	}

	cmd := exec.Command("open", dmgPath)
	return cmd.Start()
}

func OpenReleasePage(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	return cmd.Start()
}
