# Disk Peek

A lightweight macOS disk cleanup utility with a beautiful UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey.svg)

## Features

Disk Peek offers two scanning modes:

### Normal Mode
Full filesystem scan showing your entire directory hierarchy. Like DaisyDisk but with better UX.
- Scans from home directory or any selected folder
- Shows complete directory tree with sizes
- Drill-down navigation into any folder
- Find where your storage space went

### Dev Mode
Targeted scan of developer-specific caches for fast, focused cleanup.
- Completes in seconds (not minutes)
- Scans only predefined safe-to-delete locations
- Categories include:
  - **Xcode**: DerivedData, Archives, iOS DeviceSupport
  - **Simulators**: CoreSimulator Devices
  - **Node.js**: npm cache, yarn cache, pnpm cache
  - **CocoaPods**: Pod cache
  - **Rust**: Cargo target directories
  - **Go**: Module cache
  - **Gradle/Maven**: Build caches
  - **Docker**: VM data
  - **System**: Library Caches, Logs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | [Wails](https://wails.io/) v2 |
| Backend | Go 1.23 |
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |

## Getting Started

### Prerequisites

- Go 1.23+
- Node.js 18+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### Development

```bash
# Install frontend dependencies
cd frontend && npm install && cd ..

# Run in development mode
wails dev
```

### Building

```bash
# Build for current platform
wails build

# Build scripts for specific platforms
./scripts/build-macos-arm.sh     # macOS Apple Silicon
./scripts/build-macos-intel.sh   # macOS Intel
./scripts/build-macos-universal.sh  # macOS Universal
```

Built applications will be in `build/bin/`

## Project Structure

```
disk-peek/
├── main.go                 # Wails app entry point
├── app.go                  # Application backend & exposed methods
├── internal/
│   ├── scanner/            # Core disk scanning logic
│   │   ├── types.go        # Shared data structures
│   │   ├── categories.go   # Dev mode category definitions
│   │   ├── devscan.go      # Dev mode scanner
│   │   ├── normalscan.go   # Normal mode scanner
│   │   └── walker.go       # Directory walking utilities
│   └── cleaner/            # Deletion logic (move to Trash)
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/     # UI components
│   │   └── hooks/          # React hooks
│   └── wailsjs/            # Auto-generated Wails bindings
└── scripts/                # Build scripts
```

## Safety

- **Move to Trash**: Files are moved to Trash by default (recoverable)
- **Safe categories**: Dev mode only targets developer caches that are safe to delete
- **No surprises**: Always shows exactly what will be cleaned before deletion

## Roadmap

- [ ] Implement cleaning functionality (move to Trash)
- [ ] Add progress indicators during cleaning
- [ ] Settings panel (toggle categories, permanent delete option)
- [ ] Menu bar quick-access mode
- [ ] Find node_modules across all projects

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
