# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development (hot reload)
wails dev

# Build with version info
task build

# Build for development/debug
task build-dev

# Frontend only
cd frontend && npm run dev      # Vite dev server
cd frontend && npm run build    # Production build
cd frontend && npm run lint     # ESLint

# Run Go tests
go test ./internal/...          # All internal packages
go test ./internal/scanner/...  # Scanner tests only

# Version management
task version                    # Show current version
task bump-patch                 # 0.1.0 -> 0.1.1
task bump-minor                 # 0.1.0 -> 0.2.0
task release                    # Bump patch + push (triggers GitHub Actions)
```

## Architecture

This is a **Wails v2** desktop app with a Go backend and React/TypeScript frontend.

### Backend (Go)

- `app.go` - Main application struct exposing methods to frontend via Wails bindings
- `internal/scanner/` - Core disk scanning logic:
  - `devscan.go` - Dev mode scanner (targets developer caches)
  - `normalscan.go` - Normal mode scanner (full filesystem tree)
  - `categories.go` - Predefined dev cache categories (Xcode, npm, Docker, etc.)
  - `types.go` - Shared data structures (`Category`, `FileNode`, `ScanResult`)
  - `walker.go` - Parallel directory walking utilities
  - `duplicates.go`, `largefile.go`, `nodemodules.go` - Advanced scanning features
  - `trends.go` - Disk usage trend tracking
- `internal/cache/` - Caches scan results to disk
- `internal/trash/` - Cross-platform trash operations
- `internal/settings/` - User preferences persistence
- `internal/updater/` - GitHub Releases auto-update

### Frontend (React/TypeScript)

- `frontend/src/App.tsx` - Main component orchestrating scan/clean workflows
- `frontend/src/components/disk-peek/` - Feature components:
  - `ScanResults.tsx` - Dev mode results with category cards and charts
  - `FileTreeResults.tsx` - Normal mode tree navigation
  - `ToolsPanel.tsx` - Advanced tools (large files, duplicates, node_modules, trends)
  - `DonutChart.tsx`, `Treemap.tsx` - Visualization components
- `frontend/src/components/ui/` - shadcn/ui primitives and motion utilities
- `frontend/src/hooks/` - React hooks for scan/clean state management
- `frontend/src/lib/formatters.ts` - Shared utility functions (use this for `formatSize`)
- `frontend/wailsjs/` - Auto-generated Wails bindings (regenerated on Go changes)

### Frontend-Backend Communication

Go methods in `app.go` are exposed via Wails and callable from `frontend/wailsjs/go/main/App.js`. Events are emitted for async progress updates:
- `scan:progress`, `scan:completed`, `scan:cancelled`
- `clean:progress`, `clean:completed`

## Key Patterns

- **Two scan modes**: "dev" (category-based cleanup) and "normal" (full filesystem tree)
- **Cancellable operations**: All scans/cleans use Go contexts for cancellation
- **Progress callbacks**: Long operations emit events for real-time UI updates
- **Move to Trash**: Default delete behavior; permanent delete is optional setting
- **Shared formatters**: Import `formatSize` from `@/lib/formatters` - don't duplicate

## Git Commit Conventions

Uses conventional commits: `type(scope): description`
- `feat(ui):`, `feat(charts):`, `feat(scanner):`
- `fix(...)`, `refactor(...)`, `chore(...)`
