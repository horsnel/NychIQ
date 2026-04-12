#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# NychIQ Extension — Cross-Browser Build Script
# Packages both Chrome (.zip) and Firefox (.zip + .xpi) versions
# Usage: ./scripts/build-extension.sh [chrome|firefox|all]
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$EXT_DIR/dist"
TARGET="${1:-all}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${CYAN}[BUILD]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Clean dist ──
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# ── Shared files (used by both Chrome and Firefox) ──
SHARED_FILES=(
  "popup.html"
  "popup.js"
  "content.css"
  "content.legacy.js"
  "icons/icon16.png"
  "icons/icon48.png"
  "icons/icon128.png"
  "src/content-scripts/youtube-watch.js"
  "src/content-scripts/youtube-trending.js"
  "src/content-scripts/youtube-studio.js"
  "src/content-scripts/social-twitter.js"
  "src/content-scripts/social-tiktok.js"
  "src/content-scripts/social-instagram.js"
  "src/content-scripts/utils.js"
  "src/background/auth-bridge.js"
  "src/background/background.js"
  "src/background/sync-manager.js"
  "src/background/offline-queue.js"
  "src/background/proxy-rotator.js"
  "src/background/token-cache.js"
  "src/ai/sentiment-analysis.js"
  "src/ai/content-classification.js"
  "src/ai/hook-scoring.js"
  "src/ai/title-optimizer.js"
  "src/ai/embeddings.js"
  "src/storage/chroma-client.js"
  "src/storage/indexeddb.js"
  "src/storage/sync-state.js"
)

copy_shared() {
  local dest="$1"
  log_info "Copying shared files to $dest"
  for file in "${SHARED_FILES[@]}"; do
    local dir="$(dirname "$dest/$file")"
    mkdir -p "$dir"
    cp "$EXT_DIR/$file" "$dest/$file"
  done
}

# ═══════════════════════════════════════════════════════════════
# CHROME BUILD
# ═══════════════════════════════════════════════════════════════

build_chrome() {
  log_info "Building Chrome extension..."
  local dest="$DIST_DIR/chrome"
  mkdir -p "$dest"

  # Copy shared files
  copy_shared "$dest"

  # Chrome-specific files
  cp "$EXT_DIR/manifest.json" "$dest/manifest.json"
  cp "$EXT_DIR/offscreen.html" "$dest/offscreen.html"
  cp "$EXT_DIR/offscreen.js" "$dest/offscreen.js"
  cp "$EXT_DIR/cors_rules.json" "$dest/cors_rules.json"
  cp "$EXT_DIR/src/ai/transformers-client.js" "$dest/src/ai/transformers-client.js"

  # Package as zip
  cd "$DIST_DIR"
  zip -r "nychiq-chrome-$(jq -r .version "$dest/manifest.json").zip" chrome/ -x "chrome/.DS_Store"
  cd - > /dev/null

  log_ok "Chrome extension built: dist/nychiq-chrome-$(jq -r .version "$EXT_DIR/manifest.json").zip"
}

# ═══════════════════════════════════════════════════════════════
# FIREFOX BUILD
# ═══════════════════════════════════════════════════════════════

build_firefox() {
  log_info "Building Firefox addon..."
  local dest="$DIST_DIR/firefox"
  mkdir -p "$dest"

  # Copy shared files
  copy_shared "$dest"

  # Firefox-specific manifest
  cp "$EXT_DIR/manifest.firefox.json" "$dest/manifest.json"

  # Firefox polyfill
  mkdir -p "$dest/src/polyfill"
  cp "$EXT_DIR/src/polyfill/browser-polyfill.js" "$dest/src/polyfill/browser-polyfill.js"

  # Firefox CORS handler (replaces declarativeNetRequest)
  cp "$EXT_DIR/src/background/cors-handler.js" "$dest/src/background/cors-handler.js"

  # Firefox AI Worker (replaces offscreen document)
  cp "$EXT_DIR/src/ai/ai-worker.js" "$dest/src/ai/ai-worker.js"
  cp "$EXT_DIR/src/ai/transformers-client.firefox.js" "$dest/src/ai/transformers-client.js"

  # Patch: Add CORS handler import to background.js
  # Insert cors-handler.js import at the top of background.js
  local bg_file="$dest/src/background/background.js"
  if ! grep -q "cors-handler" "$bg_file"; then
    sed -i '1s|^|/* Firefox: CORS handler loaded via polyfill */\n|' "$bg_file"
  fi

  # Package as zip (for AMO submission)
  cd "$DIST_DIR"
  local version="$(jq -r .version "$dest/manifest.json")"
  zip -r "nychiq-firefox-${version}.zip" firefox/ -x "firefox/.DS_Store"
  # Also create .xpi (just a renamed zip)
  cp "nychiq-firefox-${version}.zip" "nychiq-firefox-${version}.xpi"
  cd - > /dev/null

  log_ok "Firefox addon built: dist/nychiq-firefox-${version}.zip"
  log_ok "Firefox addon (XPI): dist/nychiq-firefox-${version}.xpi"
}

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

case "$TARGET" in
  chrome)
    build_chrome
    ;;
  firefox)
    build_firefox
    ;;
  all)
    build_chrome
    echo ""
    build_firefox
    ;;
  *)
    log_error "Unknown target: $TARGET"
    echo "Usage: $0 [chrome|firefox|all]"
    exit 1
    ;;
esac

echo ""
log_ok "Build complete! Output in: $DIST_DIR/"
echo ""
echo "  Chrome:  $DIST_DIR/chrome/  (manifest.json — MV3 service_worker)"
echo "  Firefox: $DIST_DIR/firefox/ (manifest.json — MV3 scripts + gecko)"
echo ""
echo "  Upload Chrome  → https://chrome.google.com/webstore/devconsole"
echo "  Upload Firefox → https://addons.mozilla.org/developers/"
echo ""