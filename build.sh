#!/bin/bash
# Builds "Urdu Doodles.app" in ./build — run it from Terminal:   ./build.sh
#   ./build.sh --force    remakes all the voice clips (e.g. after changing URDU_VOICE)
set -euo pipefail
cd "$(dirname "$0")"

APP="build/Urdu Doodles.app"

echo ""
echo "  ✏️  Urdu Doodles — building…"
echo ""

# 1. Apple's free command line tools (provides the Swift compiler)
if ! xcode-select -p >/dev/null 2>&1; then
  echo "Apple's Command Line Tools are needed (free, one-time)."
  echo "A window will pop up — click Install, wait for it to finish, then run ./build.sh again."
  xcode-select --install || true
  exit 1
fi

# 2. Urdu voice clips
echo "→ Preparing Urdu voice clips"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv >/dev/null 2>&1 || true
fi
if [ -x .venv/bin/python ]; then
  .venv/bin/python -m pip install --quiet --disable-pip-version-check --upgrade edge-tts >/dev/null 2>&1 \
    || echo "  (couldn't download the neural Urdu voice package — will use the Mac's own voices)"
  .venv/bin/python tools/make_voices.py "$@" || echo "  (voice step had a problem — the game will speak with the Mac's built-in voice instead)"
else
  python3 tools/make_voices.py "$@" || echo "  (voice step had a problem — the game will speak with the Mac's built-in voice instead)"
fi
if [ ! -f game/voice/manifest.js ]; then
  mkdir -p game/voice && echo "window.VOICE_FILES = {};" > game/voice/manifest.js
fi

# 3. Compile the app
echo "→ Compiling"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -swift-version 5 \
  -o "$APP/Contents/MacOS/UrduDoodles" src/main.swift \
  -framework Cocoa -framework WebKit -framework ApplicationServices
cp src/Info.plist "$APP/Contents/Info.plist"
cp -R game "$APP/Contents/Resources/game"

# 4. Icon
if [ -f src/icon.png ] && command -v iconutil >/dev/null 2>&1; then
  ICONSET="$(mktemp -d)/AppIcon.iconset"
  mkdir -p "$ICONSET"
  for s in 16 32 128 256 512; do
    sips -z $s $s src/icon.png --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
    sips -z $((s*2)) $((s*2)) src/icon.png --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
  done
  iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns" || true
fi

# 5. Sign locally (ad-hoc) so macOS is happy to run it
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true

echo ""
echo "  ✓ Built: $APP"
echo "    Drag it into Applications, or just double-click it. Quit with ⌃⌥⌘ + B Y E."
echo ""
open -R "$APP" 2>/dev/null || true
