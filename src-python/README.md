# Zop Agent

Python AI agent sidecar for the Zop application, using the Atomic Agents framework.

## Overview

This is a FastAPI service that provides AI-powered SOP (Standard Operating Procedure) generation using the Atomic Agents framework with Instructor for structured outputs.

## Development Setup

### Prerequisites

- Python 3.10 or higher
- [uv](https://docs.astral.sh/uv/) package manager (recommended)

### Installation

```bash
# Using uv (recommended)
uv sync

# Or with dev dependencies
uv sync --dev
```

### Running in Development

```bash
# Run the FastAPI server
uv run python run.py

# Or with custom port
uv run python run.py 19821
```

The server will start at `http://127.0.0.1:19820` by default.

## API Endpoints

### Health Check

```
GET /health
```

Returns the service health status.

### Generate SOP

```
POST /generate-sop
Content-Type: application/json

{
  "prompt": "Create a process for handling customer support tickets",
  "config": {
    "base_url": "https://api.openai.com/v1",
    "api_key": "your-api-key",
    "model_name": "gpt-4o"
  }
}
```

Returns a structured SOP with title and steps.

## Building for Production

### PyInstaller Build

```bash
# Build executable (uses uv internally)
# On Windows:
build.bat

# On Unix:
./build.sh
```

The built executable will be copied to `src-tauri/binaries/` with the correct naming convention for Tauri sidecar.

## Project Structure

```
src-python/
├── pyproject.toml      # Project configuration (uv compatible)
├── uv.lock             # Lock file (auto-generated)
├── run.py              # Entry point
├── zop-agent.spec      # PyInstaller configuration
├── build.bat           # Windows build script
├── build.sh            # Unix build script
└── zop_agent/
    ├── __init__.py
    ├── main.py         # FastAPI application
    └── sop_agent.py    # SOP Generator agent
```

## Integration with Tauri

The Python agent runs as a Tauri sidecar. When the Tauri app needs to generate an SOP:

1. Rust spawns the sidecar if not already running
2. Rust sends HTTP requests to the FastAPI service
3. The agent uses Instructor with the configured AI provider to generate structured output
4. Results are returned to the Rust backend and forwarded to the frontend

If the sidecar fails to start or respond, the app falls back to the native Rust implementation.
