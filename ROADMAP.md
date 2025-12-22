# Disk Peek - Roadmap & Improvements

This document outlines the current state of the project, areas for improvement, and a prioritized roadmap for future development.

## Current State Summary

**Version**: v0.1.0
**Tech Stack**: Wails v2 (Go 1.23 + React 18 + TypeScript + Tailwind CSS v4)
**Lines of Code**: ~4,400 (1,600 Go + 2,800 React/TypeScript)

### Implemented Features
- Dev Clean Mode: 14+ developer cache categories with hierarchical navigation
- Explorer Mode: Full filesystem traversal with lazy-loaded children
- Parallel scanning (8 workers) with real-time progress
- Safe deletion (move to Trash via AppleScript)
- Dark theme with modern UI (shadcn/ui components)
- macOS CI/CD with code signing and notarization

---

## Areas for Improvement

### 1. Testing (Critical Gap)

**Current State**: No automated tests exist.

| Area | Priority | Effort |
|------|----------|--------|
| Go unit tests for scanner logic | High | Medium |
| Walker function tests | High | Low |
| Size calculation tests | High | Low |
| React hook tests (useScan, useClean) | Medium | Medium |
| Component tests with Vitest | Medium | Medium |
| E2E tests with Playwright | Low | High |

**Recommended Actions**:
- Add Go tests for `internal/scanner/` package
- Add Vitest + Testing Library for React components
- Aim for 70% coverage on core logic

### 2. User Experience Improvements

| Feature | Description | Priority |
|---------|-------------|----------|
| Scan cancellation | Allow users to cancel ongoing scans | High |
| Clean cancellation | Allow users to cancel ongoing cleanup | High |
| Error context | Show detailed error messages with affected paths | Medium |
| Keyboard shortcuts | Add shortcuts for common actions (scan, clean, toggle) | Medium |
| Resizable window | Remember window size/position | Low |
| Light theme option | Support system theme detection | Low |

### 3. Settings & Configuration

**Current State**: No settings panel. All behavior is hardcoded.

| Setting | Description | Priority |
|---------|-------------|----------|
| Toggle categories | Enable/disable specific dev categories | High |
| Permanent delete option | Bypass Trash for faster cleanup | High |
| Custom paths | Add user-defined directories to scan | Medium |
| Scan depth limit | Limit Explorer mode depth | Medium |
| Exclusion patterns | Skip specific directories (e.g., `.git`) | Medium |
| Startup behavior | Remember last mode and scan results | Low |

### 4. Performance Optimizations

| Optimization | Description | Impact |
|--------------|-------------|--------|
| Incremental scanning | Only rescan changed directories | High |
| Result caching | Persist scan results to disk | Medium |
| Background scanning | Scan on app launch in background | Medium |
| Worker pool tuning | Dynamic worker count based on CPU | Low |
| Memory optimization | Stream large directory results | Low |

### 5. Code Quality

| Area | Issue | Recommendation |
|------|-------|----------------|
| Error handling | Frontend shows generic error messages | Add error codes and user-friendly messages |
| Logging | No structured logging | Add slog with levels for debugging |
| Type generation | Manual Wails type sync | Automate with wails generate |
| Component size | App.tsx is 220 lines | Extract more logic to hooks |
| State management | Props drilling in some places | Consider context for deep state |

---

## Feature Roadmap

### Phase 1: Foundation (v0.2.0) ✅ COMPLETED
*Focus: Testing, stability, and essential UX*

- [x] **Add Go unit tests** for scanner package
  - Test `WalkDirectory`, `WalkDirectoryFast`
  - Test size calculations with mocked filesystems
  - Test category matching logic

- [x] **Add scan/clean cancellation**
  - Add context.Context to scanning functions
  - Add "Cancel" button to progress UI
  - Clean up partial results on cancel

- [x] **Settings panel (basic)**
  - Create settings modal/drawer
  - Toggle permanent delete vs. Trash
  - Toggle individual dev categories on/off
  - Persist settings to JSON file

- [x] **Improve error handling**
  - Add error codes and user-friendly messages
  - Show affected paths in error dialogs
  - Add "Retry" option for transient failures

### Phase 2: Enhanced Features (v0.3.0) - IN PROGRESS
*Focus: Power user features and productivity*

- [x] **Application menu with keyboard shortcuts**
  - Native macOS application menu (File, Edit, View)
  - Quick scan/clean from menu
  - Keyboard shortcuts for common actions

- [x] **Keyboard shortcuts**
  - `Cmd+R` - Rescan
  - `Cmd+Shift+R` - Quick Scan
  - `Cmd+D` - Clean selected
  - `Cmd+1/2` - Switch modes
  - `Cmd+,` - Open settings
  - `Escape` - Cancel operation

- [x] **Find node_modules across projects**
  - Dedicated scanner for node_modules
  - Show project name and last modified date
  - Bulk delete with project selection
  - Backend complete (UI pending)

- [x] **Result persistence**
  - Cache scan results to disk
  - Quick reload without rescanning
  - Version-aware cache invalidation

- [ ] **Custom paths support** (planned for v0.3.1)
  - Add user-defined directories to Dev Clean
  - Create custom categories
  - Import/export category configurations

### Phase 3: Cross-Platform (v0.4.0) - IN PROGRESS
*Focus: Linux and Windows support*

- [x] **Cross-platform trash functionality**
  - Unified trash package (`internal/trash/trash.go`)
  - macOS: AppleScript with Finder for "Put Back" support
  - Linux: gio/trash-cli with FreeDesktop.org Trash spec fallback
  - Windows: PowerShell with Shell.Application COM object

- [x] **Platform-agnostic categories**
  - Refactored categories.go for multi-platform support
  - Cross-platform categories (Node.js, Rust, Go, Gradle, Maven, Android)
  - Platform-specific categories (Xcode/Homebrew on macOS, Snap/Flatpak on Linux, VS Code/NuGet on Windows)
  - Platform detection and path resolution

- [x] **Linux support** (core implementation)
  - Linux-specific cache paths (~/.cache, ~/.local/share)
  - Categories: Docker, Snap, Flatpak, Thumbnails, Trash
  - FreeDesktop.org Trash specification support

- [x] **Windows support** (core implementation)
  - Windows-specific paths (%LOCALAPPDATA%, %APPDATA%, %TEMP%)
  - Categories: Temp files, Docker, VS Code, NuGet, Edge/Chrome cache
  - PowerShell-based Recycle Bin integration

- [ ] **Platform packaging** (pending)
  - Linux: .deb and .AppImage packages
  - Windows: .msi and portable packages
  - Platform testing on Ubuntu/Fedora, Windows 10/11

### Phase 4: Advanced Features (v0.5.0)
*Focus: Intelligence and automation*

- [ ] **Scheduled cleanup**
  - Background service for periodic scans
  - Configurable schedule (daily, weekly)
  - Notifications when cleanup threshold reached

- [ ] **Duplicate file detection**
  - Hash-based duplicate finding
  - Show duplicate groups with sizes
  - Smart selection (keep newest, largest, etc.)

- [ ] **Large file finder**
  - Find files larger than X GB
  - Filter by file type
  - Quick preview for media files

- [ ] **Disk usage trends**
  - Track disk usage over time
  - Show growth charts
  - Alert on rapid growth

- [ ] **Smart recommendations**
  - ML-based suggestions for cleanup
  - Learn from user deletion patterns
  - Prioritize by age and access frequency

---

## Technical Debt

| Item | Description | Effort |
|------|-------------|--------|
| Add structured logging | Use Go's slog package | Low |
| Improve TypeScript types | Reduce `any` usage | Low |
| Add ESLint strict rules | Enforce code quality | Low |
| Document Go API | Add GoDoc comments | Medium |
| Refactor App.tsx | Extract to smaller components | Medium |
| Add GitHub issue templates | Bug reports, feature requests | Low |
| Add CONTRIBUTING.md | Development setup guide | Low |

---

## Metrics & Success Criteria

### v0.2.0 Goals
- 70% test coverage on Go scanner package
- Scan cancellation working
- Settings panel with 3+ options
- Zero critical bugs

### v0.3.0 Goals
- Menu bar mode functional
- node_modules finder working
- 5+ keyboard shortcuts
- Result caching implemented

### v0.4.0 Goals
- Linux builds passing CI
- Windows builds passing CI
- 3+ platform-specific categories each

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

Priority areas for contribution:
1. Writing tests for scanner package
2. Linux/Windows platform support
3. UI/UX improvements
4. Documentation

---

*Last updated: December 2024*
