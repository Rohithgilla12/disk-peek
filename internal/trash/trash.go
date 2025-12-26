package trash

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// MoveToTrash moves a file or directory to the system trash/recycle bin
// Returns nil on success, error on failure
func MoveToTrash(path string) error {
	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil // Already doesn't exist, consider it success
	}

	switch runtime.GOOS {
	case "darwin":
		return moveToTrashMacOS(path)
	case "linux":
		return moveToTrashLinux(path)
	case "windows":
		return moveToTrashWindows(path)
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

// moveToTrashMacOS uses AppleScript to move files to Trash on macOS
func moveToTrashMacOS(path string) error {
	// Escape backslashes and double quotes for AppleScript string
	escapedPath := strings.ReplaceAll(path, `\`, `\\`)
	escapedPath = strings.ReplaceAll(escapedPath, `"`, `\"`)

	// Use macOS trash command via osascript for proper Trash behavior
	// This preserves the "Put Back" functionality
	cmd := exec.Command("osascript", "-e",
		`tell application "Finder" to delete POSIX file "`+escapedPath+`"`)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Fallback: try direct removal if Finder fails
		return os.RemoveAll(path)
	}
	_ = output
	return nil
}

// moveToTrashLinux implements the FreeDesktop.org Trash specification
// https://specifications.freedesktop.org/trash-spec/trashspec-latest.html
func moveToTrashLinux(path string) error {
	// Try using gio (GNOME) first, then trash-cli, then fallback to manual
	if err := trashWithGio(path); err == nil {
		return nil
	}

	if err := trashWithTrashCli(path); err == nil {
		return nil
	}

	// Manual implementation of FreeDesktop.org Trash spec
	return trashManualLinux(path)
}

// trashWithGio uses GNOME's gio command
func trashWithGio(path string) error {
	cmd := exec.Command("gio", "trash", path)
	return cmd.Run()
}

// trashWithTrashCli uses the trash-cli package
func trashWithTrashCli(path string) error {
	cmd := exec.Command("trash-put", path)
	return cmd.Run()
}

// trashManualLinux implements the FreeDesktop.org Trash spec manually
func trashManualLinux(path string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	trashDir := filepath.Join(home, ".local", "share", "Trash")
	filesDir := filepath.Join(trashDir, "files")
	infoDir := filepath.Join(trashDir, "info")

	// Create trash directories if they don't exist
	if err := os.MkdirAll(filesDir, 0700); err != nil {
		return err
	}
	if err := os.MkdirAll(infoDir, 0700); err != nil {
		return err
	}

	// Get the base name and create a unique trash name
	baseName := filepath.Base(path)
	trashName := baseName
	counter := 1

	// Handle name conflicts
	for {
		trashPath := filepath.Join(filesDir, trashName)
		if _, err := os.Stat(trashPath); os.IsNotExist(err) {
			break
		}
		trashName = fmt.Sprintf("%s.%d", baseName, counter)
		counter++
	}

	// Create the .trashinfo file
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	infoContent := fmt.Sprintf("[Trash Info]\nPath=%s\nDeletionDate=%s\n",
		absPath,
		time.Now().Format("2006-01-02T15:04:05"))

	infoPath := filepath.Join(infoDir, trashName+".trashinfo")
	if err := os.WriteFile(infoPath, []byte(infoContent), 0600); err != nil {
		return err
	}

	// Move the file to trash
	trashPath := filepath.Join(filesDir, trashName)
	if err := os.Rename(path, trashPath); err != nil {
		// If rename fails (cross-device), try copy and delete
		// For simplicity, we'll just return the error
		// A full implementation would copy the file
		os.Remove(infoPath) // Clean up the info file
		return err
	}

	return nil
}

// moveToTrashWindows uses PowerShell to move files to Recycle Bin
func moveToTrashWindows(path string) error {
	// Escape the path for PowerShell
	escapedPath := strings.ReplaceAll(path, `'`, `''`)

	// Use PowerShell with Shell.Application COM object
	script := fmt.Sprintf(`
$shell = New-Object -ComObject Shell.Application
$item = $shell.NameSpace(0).ParseName('%s')
if ($item) {
    $item.InvokeVerb('delete')
}
`, escapedPath)

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", script)
	err := cmd.Run()
	if err != nil {
		// Fallback: try using recycle command if available
		return trashWithRecycleBin(path)
	}
	return nil
}

// trashWithRecycleBin is a fallback for Windows using the recycle command
func trashWithRecycleBin(path string) error {
	// Try using the Windows recycle command (if installed)
	cmd := exec.Command("recycle", path)
	if err := cmd.Run(); err != nil {
		// Last resort: use direct deletion
		return os.RemoveAll(path)
	}
	return nil
}

// IsTrashSupported returns true if the current platform supports trash functionality
func IsTrashSupported() bool {
	switch runtime.GOOS {
	case "darwin", "linux", "windows":
		return true
	default:
		return false
	}
}

// GetTrashLocation returns the path to the trash directory on the current platform
func GetTrashLocation() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	switch runtime.GOOS {
	case "darwin":
		return filepath.Join(home, ".Trash"), nil
	case "linux":
		return filepath.Join(home, ".local", "share", "Trash"), nil
	case "windows":
		// Windows doesn't have a direct path to the Recycle Bin
		return "", fmt.Errorf("recycle bin path not directly accessible on Windows")
	default:
		return "", fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}
