# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Tauri desktop application** that combines a Rust backend with a React + TypeScript frontend. The project uses Vite for frontend development and build tooling.

## Architecture

### Frontend (React + Vite)
- **Entry point**: `src/main.tsx` - renders the React app
- **Main component**: `src/App.tsx` - contains the UI and demonstrates Tauri command invocation
- **Build system**: Vite with React plugin
- **Port**: Frontend dev server runs on port 1420 (fixed port required by Tauri)

### Backend (Rust + Tauri)
- **Entry point**: `src-tauri/src/main.rs` - calls the library's `run()` function
- **Main logic**: `src-tauri/src/lib.rs` - contains Tauri app setup and command handlers
- **Library name**: `zop_lib` (uses suffix to avoid Windows naming conflicts)
- **Commands**: Currently has a `greet` command that demonstrates frontend-backend communication

### Project Structure
```
├── src/                    # React frontend source
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri configuration
│   └── icons/             # Application icons
├── public/                # Static assets
└── dist/                  # Frontend build output (created by Vite)
```

## Development Commands

### Frontend Development
```bash
npm run dev          # Start Vite dev server (http://localhost:1420)
npm run build        # Build frontend for production (outputs to dist/)
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

- **`tauri.conf.json`**: Main Tauri configuration including window settings, build commands, and app metadata
- **`Cargo.toml`**: Rust dependencies and build configuration
- **`vite.config.ts`**: Frontend build configuration optimized for Tauri development
- **`package.json`**: Frontend dependencies and npm scripts

## Communication Pattern

The app uses Tauri's command system for frontend-backend communication:
- Frontend calls Rust functions using `invoke()` from `@tauri-apps/api/core`
- Rust functions are marked with `#[tauri::command]` and registered in the invoke handler
- Example: `invoke("greet", { name })` calls the `greet` function in `lib.rs:3`

## Build Process

1. **Development**: `npm run tauri dev` runs both frontend dev server and Rust backend
2. **Production**: `npm run tauri build` first builds frontend (`npm run build`), then compiles the complete desktop application
3. **Frontend dist**: Vite builds to `dist/` directory, which Tauri bundles into the final app