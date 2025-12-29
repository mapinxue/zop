@echo off
REM Build script for Zop Agent sidecar (using uv)

echo Building Zop Agent...

REM Ensure we're in the src-python directory
cd /d %~dp0

REM Install dependencies with uv
echo Installing dependencies...
uv sync --dev

REM Build with PyInstaller (using uv run)
echo Building executable...
uv run pyinstaller zop-agent.spec --clean --noconfirm

REM Copy the executable to the Tauri binaries directory
set TARGET_DIR=..\src-tauri\binaries
if not exist %TARGET_DIR% mkdir %TARGET_DIR%

REM Determine the target triple for Windows
set TARGET_TRIPLE=x86_64-pc-windows-msvc

REM Copy with the correct naming convention for Tauri sidecar
copy /Y dist\zop-agent.exe %TARGET_DIR%\zop-agent-%TARGET_TRIPLE%.exe

echo Build complete! Executable copied to %TARGET_DIR%\zop-agent-%TARGET_TRIPLE%.exe
