#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_PATH="$SCRIPT_DIR"
BUILD_PATH="${SCRIPT_DIR}/../web/Build"
LOG_PATH="${SCRIPT_DIR}/Logs/build.log"

UNITY_PATH="${UNITY_PATH:-}"

if [ -z "$UNITY_PATH" ]; then
    if [ -d "/Applications/Unity/Hub/Editor" ]; then
        UNITY_PATH=$(find /Applications/Unity/Hub/Editor -name "Unity" -path "*/MacOS/*" 2>/dev/null | head -1)
    fi
fi

if [ -z "$UNITY_PATH" ] || [ ! -f "$UNITY_PATH" ]; then
    echo "Error: Unity Editor not found."
    echo "Set UNITY_PATH environment variable to Unity executable path."
    echo "Example: export UNITY_PATH=\"/Applications/Unity/Hub/Editor/2022.3.20f1/Unity.app/Contents/MacOS/Unity\""
    exit 1
fi

echo "=== Unity WebGL Build ==="
echo "Unity: ${UNITY_PATH}"
echo "Project: ${PROJECT_PATH}"
echo "Output: ${BUILD_PATH}"

mkdir -p "$(dirname "$LOG_PATH")"
mkdir -p "$BUILD_PATH"

echo "Starting build..."

"$UNITY_PATH" \
    -batchmode \
    -nographics \
    -quit \
    -projectPath "$PROJECT_PATH" \
    -executeMethod BuildScript.BuildWebGL \
    -buildTarget WebGL \
    -logFile "$LOG_PATH" \
    || { echo "Build failed. See ${LOG_PATH}"; cat "$LOG_PATH" | tail -50; exit 1; }

echo "Build complete."

if command -v brotli &> /dev/null; then
    echo "Compressing with Brotli..."
    find "$BUILD_PATH" -name "*.wasm" ! -name "*.br" -exec brotli -9 -k -f {} \;
    find "$BUILD_PATH" -name "*.js" -size +50k ! -name "*.br" -exec brotli -9 -k -f {} \;
    find "$BUILD_PATH" -name "*.data" ! -name "*.br" -exec brotli -9 -k -f {} \;
elif command -v gzip &> /dev/null; then
    echo "Compressing with gzip..."
    find "$BUILD_PATH" -name "*.wasm" ! -name "*.gz" -exec gzip -9 -k -f {} \;
    find "$BUILD_PATH" -name "*.js" -size +50k ! -name "*.gz" -exec gzip -9 -k -f {} \;
fi

echo ""
echo "=== Build Summary ==="
du -sh "$BUILD_PATH"
echo ""
echo "Files:"
ls -lah "$BUILD_PATH" 2>/dev/null || ls -la "$BUILD_PATH"
