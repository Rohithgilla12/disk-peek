package main

import (
	"embed"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application menu
	appMenu := createApplicationMenu(app)

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Disk Peek",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 11, G: 11, B: 13, A: 1},
		OnStartup:        app.startup,
		Menu:             appMenu,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

// createApplicationMenu creates the native application menu with keyboard shortcuts
func createApplicationMenu(app *App) *menu.Menu {
	appMenu := menu.NewMenu()

	// On macOS, add the app menu first (required for standard macOS behavior)
	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.AppMenu())
	}

	// File menu
	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("Scan", keys.CmdOrCtrl("r"), func(_ *menu.CallbackData) {
		// Emit event to frontend to trigger scan
		wailsRuntime.EventsEmit(app.ctx, "menu:scan")
	})
	fileMenu.AddText("Quick Scan", keys.Combo("r", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		// Emit event to frontend to trigger quick scan
		wailsRuntime.EventsEmit(app.ctx, "menu:quickscan")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Clean Selected", keys.CmdOrCtrl("d"), func(_ *menu.CallbackData) {
		// Emit event to frontend to trigger clean
		wailsRuntime.EventsEmit(app.ctx, "menu:clean")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Settings...", keys.CmdOrCtrl(","), func(_ *menu.CallbackData) {
		// Emit event to frontend to open settings
		wailsRuntime.EventsEmit(app.ctx, "menu:settings")
	})

	// On macOS, Edit menu enables standard shortcuts (Cmd+C, Cmd+V, Cmd+Z)
	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.EditMenu())
	}

	// View menu for mode switching
	viewMenu := appMenu.AddSubmenu("View")
	viewMenu.AddText("Dev Clean Mode", keys.CmdOrCtrl("1"), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:mode", "dev")
	})
	viewMenu.AddText("Explorer Mode", keys.CmdOrCtrl("2"), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:mode", "normal")
	})
	viewMenu.AddSeparator()
	viewMenu.AddText("Cancel Operation", keys.Key("Escape"), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:cancel")
	})

	return appMenu
}
