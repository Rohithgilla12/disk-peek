# Disk Peek — MVP Scope Document

> A macOS disk cleanup utility built with Wails + React
> Part of the "Peek" suite alongside data-peek

---

## Overview

Disk Peek is a lightweight, beautiful disk cleanup app with two modes:

1. **Normal Mode** (default) — Full disk scan showing your entire filesystem hierarchy. Like DaisyDisk but with better UX. For everyone.

2. **Dev Mode** — Targeted scan of developer-specific caches (Xcode, node_modules, Docker, etc.). Fast and focused. For developers.

---

## Target Users

**Normal Mode:**

- Anyone running low on disk space
- Non-technical users who want visual clarity
- People who don't know where their space went

**Dev Mode:**

- macOS developers
- Frustrated by 50GB+ DerivedData folders
- Comfortable with knowing what's being deleted
- Want fast, targeted cleanup without full scan

---

## MVP Features

### 1. Dual Scan Modes

#### Normal Mode (Full Disk Scan)

**What it does:**

- Scans entire disk (or selected folder) recursively
- Builds complete filesystem hierarchy
- Shows ALL files and folders by size
- User can drill down into any directory

**Use case:** "Where did my 500GB go?"

**Implementation:**

- Start from `/` or user home directory
- Recursive walk with size aggregation
- Build tree structure on-the-fly
- Cache results for quick re-navigation

#### Dev Mode (Targeted Scan)

**What it does:**

- Scans predefined developer cache locations only
- Calculates size per category
- Completes in seconds (not minutes)
- Categories are curated and safe to delete

**Use case:** "Clean up my dev caches quickly"

**Categories for Dev Mode:**

| Category             | Paths                                             |
| -------------------- | ------------------------------------------------- |
| Xcode DerivedData    | `~/Library/Developer/Xcode/DerivedData`           |
| Xcode Archives       | `~/Library/Developer/Xcode/Archives`              |
| Xcode Device Support | `~/Library/Developer/Xcode/iOS DeviceSupport`     |
| Simulators           | `~/Library/Developer/CoreSimulator/Devices`       |
| CocoaPods Cache      | `~/Library/Caches/CocoaPods`                      |
| Carthage             | `~/Library/Caches/org.carthage.CarthageKit`       |
| SPM Cache            | `~/Library/Caches/org.swift.swiftpm`              |
| Node Modules         | `**/node_modules` (with depth limit)              |
| npm Cache            | `~/.npm`                                          |
| yarn Cache           | `~/Library/Caches/Yarn`                           |
| pnpm Cache           | `~/Library/pnpm`                                  |
| Homebrew Cache       | `~/Library/Caches/Homebrew`                       |
| Rust target          | `**/target` (Cargo projects)                      |
| Go mod cache         | `~/go/pkg/mod`                                    |
| Gradle               | `~/.gradle/caches`                                |
| Docker               | `~/Library/Containers/com.docker.docker/Data/vms` |
| System Caches        | `~/Library/Caches/*`                              |
| System Logs          | `~/Library/Logs`, `/var/log`                      |

### 2. Visual Disk Breakdown

**What it does:**

- Modern stacked bar showing space distribution at a glance
- Drill-down navigation into subcategories with breadcrumb trail
- Color-coded by category type (dev tools, system, logs)
- Animated transitions between hierarchy levels

**Tech:**

- Vanilla JS/React with CSS transitions (no heavy charting library needed)
- Stacked horizontal bar for overview
- Category cards with mini progress bars
- Smooth fade transitions on drill-down

**UI Pattern:**

- Top: Stacked bar showing proportional sizes
- Below: Grid of category cards (icon, name, size, percentage)
- Click card → drill into subcategories
- Breadcrumb navigation to jump back
- Back button when in subcategory view

### 3. Category Detail View

**What it does:**

- Expandable list showing individual items within a category
- For node_modules: show which project folders contain them
- Show last modified date (helps identify stale caches)
- Select/deselect individual items

### 4. Safe Clean

**What it does:**

- Single "Clean Selected" button
- Confirmation modal showing exactly what will be deleted
- Moves to Trash instead of permanent delete (recoverable)
- Summary after completion: "Freed 34.2 GB"

### 5. Minimal Settings

**What it does:**

- Toggle categories on/off for scanning
- Option to permanently delete vs move to Trash
- Dark/light mode (follow system)

---

## MVP Non-Goals (v2+)

- Malware scanning
- App uninstaller
- Startup item management
- Scheduled/automatic cleaning
- Menu bar mode
- Large & old file finder
- RAM/memory purging
- Cross-platform (Windows/Linux)
- Undo history beyond Trash

---

## Technical Architecture

### Stack

| Layer         | Tech                     |
| ------------- | ------------------------ |
| Framework     | Wails v2                 |
| Backend       | Go 1.21+                 |
| Frontend      | React 18 + TypeScript    |
| UI Components | shadcn/ui + Tailwind     |
| Charts        | Recharts                 |
| State         | Zustand or React Context |
| Build         | Wails CLI                |

### Backend (Go)

```
/internal
├── scanner/
│   ├── scanner.go       # Main scan orchestrator
│   ├── walker.go        # Concurrent directory walking
│   ├── fullscan.go      # Normal mode: full disk scan
│   ├── devscan.go       # Dev mode: targeted category scan
│   ├── categories.go    # Dev mode category definitions
│   └── types.go         # Shared structs
├── cleaner/
│   ├── cleaner.go       # Deletion logic
│   └── trash.go         # Move to Trash (macOS API)
└── app.go               # Wails bindings
```

**Key Go patterns:**

- Worker pool for concurrent scanning (limit to ~10 goroutines)
- Channels for progress updates to frontend
- Context for cancellation support
- Interface for scanner modes (both implement same interface)

### Frontend (React)

```
/frontend/src
├── components/
│   ├── DiskChart/          # Treemap visualization
│   ├── CategoryList/       # Expandable category rows
│   ├── ScanButton/         # Scan trigger + progress
│   ├── CleanConfirm/       # Confirmation modal
│   └── Layout/             # App shell
├── hooks/
│   ├── useScan.ts          # Scan state & actions
│   └── useClean.ts         # Clean state & actions
├── lib/
│   └── wails.ts            # Generated Wails bindings
└── App.tsx
```

### IPC Contract

**Go → JS Events:**

```typescript
// Scan progress
{ type: "scan:progress", category: string, current: number, total: number }

// Scan complete
{ type: "scan:complete", results: CategoryResult[] }

// Clean complete
{ type: "clean:complete", freedBytes: number }
```

**JS → Go Calls:**

```typescript
// Start scan
StartScan(): Promise<void>

// Cancel scan
CancelScan(): Promise<void>

// Clean selected
CleanCategories(ids: string[]): Promise<CleanResult>

// Get category details
GetCategoryItems(id: string): Promise<FileItem[]>
```

---

## UI/UX Specifications

### Mode Switcher

At top of app, simple toggle:

```
[ 🖥️ Normal Mode ] [ 🛠️ Dev Mode ]
```

- Normal Mode selected by default for new users
- App remembers last used mode
- Switching modes clears current scan and prompts new scan

### Main Screen States

1. **Empty State**
   - Mode toggle at top
   - App icon + "Scan to analyze disk space"
   - Single prominent "Scan" button
   - For Normal Mode: option to select folder (default: home directory)

2. **Scanning State**
   - Circular progress indicator
   - Current path being scanned (Normal) or category (Dev)
   - Running total of space analyzed
   - Cancel button

3. **Results State**
   - Mode indicator
   - Stacked bar visualization (top)
   - Drill-down category/folder list (scrollable)
   - Breadcrumb navigation
   - "Clean Selected" button (sticky footer)
   - Total selected size displayed

4. **Cleaning State**
   - Progress bar
   - Current item being processed
   - Cancel button (moves partial to Trash)

5. **Complete State**
   - Success animation
   - "Freed X GB" message
   - "Scan Again" button

### Design Principles

- **Transparent**: Always show exactly what will be deleted
- **Recoverable**: Default to Trash, not permanent delete
- **Fast**: Scan should feel instant (<10s for most systems)
- **Focused**: Developer caches only, no bloat
- **Beautiful**: Satisfying visualizations, smooth animations

### Color Palette (Dark Mode Default)

```
Background:     #0a0a0a
Surface:        #171717
Border:         #262626
Text Primary:   #fafafa
Text Secondary: #a1a1aa
Accent:         #3b82f6 (blue)
Warning:        #f59e0b (amber)
Danger:         #ef4444 (red)
Success:        #22c55e (green)

Category Colors:
- Xcode:        #1e90ff
- Node:         #68a063
- Docker:       #2496ed
- System:       #8b5cf6
- Rust:         #dea584
- Go:           #00add8
```

---

## Development Phases

### Phase 1: Foundation (Week 1)

- [ ] Scaffold Wails + React project
- [ ] Set up shadcn/ui + Tailwind
- [ ] Basic app shell with mode toggle
- [ ] Go scanner for Dev Mode (3 categories: Xcode, node_modules, System Caches)
- [ ] Display results as drill-down list

### Phase 2: Core Features (Week 2)

- [ ] Complete all Dev Mode categories
- [ ] Implement Normal Mode full disk scanner
- [ ] Mode switcher with state persistence
- [ ] Concurrent scanning with progress
- [ ] Stacked bar visualization
- [ ] Category/folder expansion with drill-down
- [ ] Selection state management

### Phase 3: Clean & Polish (Week 3)

- [ ] Implement safe clean (move to Trash)
- [ ] Confirmation modal
- [ ] Success/error states
- [ ] Settings panel
- [ ] Dark/light mode

### Phase 4: Release Prep (Week 4)

- [ ] Code signing & notarization
- [ ] DMG installer
- [ ] Landing page
- [ ] App icon & branding
- [ ] Beta testing

---

## Success Metrics (Post-Launch)

- Scan completes in <10 seconds on typical dev machine
- Successfully identifies >20GB of cleanable space on average
- Zero reports of accidental data loss
- 4.5+ star rating if published to App Store

---

## Open Questions

1. **Pricing model?** Free & open source? Freemium? One-time purchase?
2. **Distribution?** Direct download, App Store, or both?
3. **node_modules scanning** — full disk search is slow. Limit to known project directories?

---

## Appendix: Competitor Analysis

| Feature        | CleanMyMac X | DevCleaner | Disk Peek (MVP) |
| -------------- | ------------ | ---------- | --------------- |
| Price          | $35/yr       | Free       | TBD             |
| Dev-focused    | Partial      | Yes        | Yes             |
| Xcode cleanup  | Yes          | Yes        | Yes             |
| node_modules   | No           | No         | Yes             |
| Docker cleanup | No           | No         | Yes             |
| Visualizations | Basic        | None       | Treemap         |
| Open Source    | No           | No         | TBD             |
| Move to Trash  | Yes          | Yes        | Yes             |

---

_Last updated: December 2024_
