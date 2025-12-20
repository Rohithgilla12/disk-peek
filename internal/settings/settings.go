package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Settings represents user preferences
type Settings struct {
	PermanentDelete    bool              `json:"permanentDelete"`
	DisabledCategories map[string]bool   `json:"disabledCategories"`
}

// DefaultSettings returns the default settings
func DefaultSettings() *Settings {
	return &Settings{
		PermanentDelete:    false,
		DisabledCategories: make(map[string]bool),
	}
}

var (
	current *Settings
	mu      sync.RWMutex
)

// getSettingsPath returns the path to the settings file
func getSettingsPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	configDir := filepath.Join(home, ".config", "disk-peek")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(configDir, "settings.json"), nil
}

// Load loads settings from disk
func Load() (*Settings, error) {
	mu.Lock()
	defer mu.Unlock()

	settingsPath, err := getSettingsPath()
	if err != nil {
		current = DefaultSettings()
		return current, nil
	}

	data, err := os.ReadFile(settingsPath)
	if err != nil {
		if os.IsNotExist(err) {
			current = DefaultSettings()
			return current, nil
		}
		return nil, err
	}

	settings := DefaultSettings()
	if err := json.Unmarshal(data, settings); err != nil {
		current = DefaultSettings()
		return current, nil
	}

	current = settings
	return current, nil
}

// Save saves settings to disk
func Save(settings *Settings) error {
	mu.Lock()
	defer mu.Unlock()

	settingsPath, err := getSettingsPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(settingsPath, data, 0644); err != nil {
		return err
	}

	current = settings
	return nil
}

// Get returns the current settings
func Get() *Settings {
	mu.RLock()
	if current != nil {
		defer mu.RUnlock()
		return current
	}
	mu.RUnlock()

	// Load settings if not already loaded
	s, _ := Load()
	return s
}

// IsCategoryEnabled returns whether a category is enabled
func IsCategoryEnabled(categoryID string) bool {
	settings := Get()
	if settings == nil {
		return true
	}
	return !settings.DisabledCategories[categoryID]
}

// SetCategoryEnabled enables or disables a category
func SetCategoryEnabled(categoryID string, enabled bool) error {
	settings := Get()
	if settings == nil {
		settings = DefaultSettings()
	}

	if enabled {
		delete(settings.DisabledCategories, categoryID)
	} else {
		settings.DisabledCategories[categoryID] = true
	}

	return Save(settings)
}

// SetPermanentDelete sets the permanent delete preference
func SetPermanentDelete(permanent bool) error {
	settings := Get()
	if settings == nil {
		settings = DefaultSettings()
	}

	settings.PermanentDelete = permanent
	return Save(settings)
}

// GetPermanentDelete returns whether permanent delete is enabled
func GetPermanentDelete() bool {
	settings := Get()
	if settings == nil {
		return false
	}
	return settings.PermanentDelete
}
