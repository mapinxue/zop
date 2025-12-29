#!/bin/bash
# Build script for Zop Agent sidecar (using uv)

echo "Building Zop Agent..."

# Ensure we're in the src-python directory
cd "$(dirname "$0")"

# Install dependencies with uv
echo "Installing dependencies..."
uv sync --dev

# Build with PyInstaller (using uv run)
echo "Building executable..."
uv run pyinstaller zop-agent.spec --clean --noconfirm

# Copy the executable to the Tauri binaries directory
TARGET_DIR="../src-tauri/binaries"
mkdir -p "$TARGET_DIR"

# Determine the target triple based on the OS
case "$(uname -s)" in
    Linux*)
        TARGET_TRIPLE="x86_64-unknown-linux-gnu"
        EXE_NAME="zop-agent"
        ;;
    Darwin*)
        TARGET_TRIPLE="x86_64-apple-darwin"
        EXE_NAME="zop-agent"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        TARGET_TRIPLE="x86_64-pc-windows-msvc"
        EXE_NAME="zop-agent.exe"
        ;;
    *)
        echo "Unknown OS"
        exit 1
        ;;
esac

# Copy with the correct naming convention for Tauri sidecar
cp -f "dist/$EXE_NAME" "$TARGET_DIR/zop-agent-$TARGET_TRIPLE${EXE_NAME##zop-agent}"

echo "Build complete! Executable copied to $TARGET_DIR/zop-agent-$TARGET_TRIPLE${EXE_NAME##zop-agent}"
