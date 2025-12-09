# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zop** is a Tauri desktop application for managing SOPs (Standard Operating Procedures) with support for both todo lists and flowcharts. It combines a Rust backend with SQLite database and a React + TypeScript frontend using React Router and React Flow.

## Architecture

### Frontend (React + TypeScript + Vite)
- **Entry point**: `src/main.tsx` - renders the React app
- **Main component**: `src/App.tsx` - sets up routing with React Router and sidebar layout
- **UI Framework**: Radix UI components (shadcn/ui style: "new-york") with Tailwind CSS v4
- **Routing**: React Router v7 with routes for home, new items, todo/flow details, settings, and about
- **Key libraries**:
  - `@xyflow/react` - Interactive flowchart editor
  - `lucide-react` - Icon library (16 predefined icons for items)
  - `react-router-dom` - Client-side routing
- **Path aliases**:
  - `@/` → `src/`
  - `@/components` → `src/components`
  - `@/lib` → `src/lib`
  - `@/hooks` → `src/hooks`
- **Port**: Frontend dev server runs on port 1420 (fixed port required by Tauri)
- **UI Components**: Located in `src/components/ui/` (Button, Input, Dropdown, Sidebar, etc.)

### Backend (Rust + Tauri + SQLite)
- **Entry point**: `src-tauri/src/main.rs` - calls the library's `run()` function
- **Main logic**: `src-tauri/src/lib.rs` - contains Tauri app setup, command handlers, and state management
- **Database**: `src-tauri/src/db.rs` - SQLite database wrapper using rusqlite
- **Library name**: `zop_lib` (uses `_lib` suffix to avoid Windows naming conflicts)
- **Database location**: `~/.zop/zop.db` (created automatically in user's home directory)
- **State management**: Uses `AppState` with `Mutex<Database>` for thread-safe database access

### Data Model
- **SopItem**: Main entity with fields: `id`, `name`, `icon`, `item_type` ("todo" or "flowchart"), `created_at`, `updated_at`
- **Database table**: `sop_items` with automatic timestamps using chrono
- **Icon system**: 16 predefined Lucide icons (folder, file-text, star, heart, bookmark, flag, zap, target, coffee, music, camera, gift, briefcase, home, settings, users) - stored as string names in database

### Tauri Commands
All commands are defined in `src-tauri/src/lib.rs` and registered in the invoke handler:
- `greet(name: &str)` - Demo command
- `toggle_always_on_top(app: AppHandle)` - Toggles window always-on-top state
- `create_sop_item(state, item: CreateSopItem)` - Creates new todo or flowchart item
- `get_all_sop_items(state)` - Retrieves all items ordered by creation date (newest first)
- `delete_sop_item(state, id: i64)` - Deletes an item by ID

### Window Configuration
- **Decorations**: Disabled (custom titlebar via `decorations: false` in tauri.conf.json)
- **Default size**: 800x600
- **CSP**: Disabled (`csp: null`)

## Development Commands

### Frontend Development
```bash
npm run dev          # Start Vite dev server (http://localhost:1420)
npm run build        # TypeScript check + Vite build (outputs to dist/)
npm run preview      # Preview production build
```

### Tauri Development
```bash
npm run tauri dev    # Start Tauri in development mode (launches desktop app)
npm run tauri build  # Build final desktop application
```

### Rust Backend
```bash
cd src-tauri
cargo check          # Check Rust code for errors
cargo build          # Build Rust backend
cargo build --release # Build optimized release version
```

## Key Configuration Files

- **`tauri.conf.json`**: Tauri configuration with custom window settings (no decorations), build commands, and bundle settings
- **`src-tauri/Cargo.toml`**: Rust dependencies including rusqlite (bundled), chrono, serde, dirs
- **`vite.config.ts`**: Vite configuration with Tailwind CSS v4 plugin and path alias (`@` → `src/`)
- **`tsconfig.json`**: TypeScript strict mode enabled with path alias support
- **`package.json`**: Frontend dependencies and npm scripts
- **`components.json`**: shadcn/ui configuration (style: "new-york", base color: neutral)

## Communication Pattern

Frontend-backend communication uses Tauri's command system:
- Frontend calls Rust functions using `invoke()` from `@tauri-apps/api/core`
- Rust functions are marked with `#[tauri::command]` and registered in the invoke handler (lib.rs:71-77)
- State is managed via `tauri::State<AppState>` parameter
- Database access is protected by `Mutex` for thread safety
- Example: `invoke("create_sop_item", { name, icon, item_type })` calls `create_sop_item` in lib.rs:47

## Build Process

1. **Development**: `npm run tauri dev` runs both frontend dev server and Rust backend
2. **Production**: `npm run tauri build` first builds frontend (`npm run build`), then compiles the complete desktop application
3. **Frontend dist**: Vite builds to `dist/` directory, which Tauri bundles into the final app

## Internationalization (i18n)

The project uses **i18next** with **react-i18next** for internationalization support.

### Configuration
- **i18n setup**: `src/i18n/index.ts` - initializes i18next with language detection
- **Translation files**:
  - `src/i18n/locales/zh.json` - Chinese translations
  - `src/i18n/locales/en.json` - English translations
- **Language detection**: Automatically detects browser language, falls back to English
- **Supported languages**: Chinese (zh) and English (en)

### Usage in Components
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <div>{t('common.loading')}</div>;
}
```

### Important Rules
**CRITICAL**: When modifying or creating frontend code:
1. **NEVER use hardcoded text strings** in JSX or UI components
2. **ALWAYS use `t()` function** from `useTranslation()` hook for all user-facing text
3. **Add translations to BOTH** `zh.json` and `en.json` files when adding new text
4. **Use nested keys** for organization (e.g., `common.loading`, `home.welcome`, `settings.window.title`)
5. **Keep translation keys descriptive** and follow existing naming patterns

### Translation File Structure
- `app.*` - Application-level text (app name, etc.)
- `common.*` - Shared text across components (buttons, actions, states)
- `[page].*` - Page-specific text (home, sidebar, newItem, todoDetail, flowDetail, about, settings)
- `icons.*` - Icon labels and tooltips
