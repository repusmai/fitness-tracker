#!/bin/bash
# ── deploy.sh ─────────────────────────────────────────────────────────────────
# Usage:
#   ./deploy.sh [message]                — bump patch
#   ./deploy.sh [message] --minor        — bump minor, reset patch to 0
#   ./deploy.sh [message] --major        — bump major, reset minor+patch to 0
#   ./deploy.sh [message] --patch-down   — decrement patch
#   ./deploy.sh [message] --minor-down   — decrement minor, restore last patch from git log
#   ./deploy.sh [message] --major-down   — decrement major, restore last minor+patch from git log
#   ./deploy.sh [message] --set X.Y.Z   — set version to exactly X.Y.Z

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
INDEX="$REPO_DIR/index.html"

CURRENT=$(grep -o 'APP_VERSION = "[0-9]*\.[0-9]*\.[0-9]*"' "$INDEX" | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
if [ -z "$CURRENT" ]; then echo "Error: could not find APP_VERSION in index.html"; exit 1; fi

MAJOR=$(echo "$CURRENT" | cut -d. -f1)
MINOR=$(echo "$CURRENT" | cut -d. -f2)
PATCH=$(echo "$CURRENT" | cut -d. -f3)

MSG=""
BUMP="patch"
SET_VER=""

for arg in "$@"; do
  case "$arg" in
    --major)      BUMP="major"      ;;
    --minor)      BUMP="minor"      ;;
    --patch-down) BUMP="patch-down" ;;
    --minor-down) BUMP="minor-down" ;;
    --major-down) BUMP="major-down" ;;
    --set)        BUMP="set"        ;;
    *)
      if [ "$BUMP" = "set" ] && [ -z "$SET_VER" ]; then
        SET_VER="$arg"
      else
        MSG="$arg"
      fi
      ;;
  esac
done

last_ver_for_prefix() {
  git -C "$REPO_DIR" log --oneline | grep -o "v$1\.[0-9]*" | head -1 | grep -o '[0-9]*\.[0-9]*\.[0-9]*'
}

case "$BUMP" in
  major)      MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0; NEW_VERSION="$MAJOR.$MINOR.$PATCH" ;;
  minor)      MINOR=$((MINOR + 1)); PATCH=0;           NEW_VERSION="$MAJOR.$MINOR.$PATCH" ;;
  patch)      PATCH=$((PATCH + 1));                    NEW_VERSION="$MAJOR.$MINOR.$PATCH" ;;
  patch-down)
    if [ "$PATCH" -le 0 ]; then echo "Error: patch is already 0"; exit 1; fi
    PATCH=$((PATCH - 1)); NEW_VERSION="$MAJOR.$MINOR.$PATCH" ;;
  minor-down)
    if [ "$MINOR" -le 0 ]; then echo "Error: minor is already 0"; exit 1; fi
    NEW_MINOR=$((MINOR - 1))
    FOUND=$(last_ver_for_prefix "$MAJOR\.$NEW_MINOR")
    if [ -n "$FOUND" ]; then NEW_VERSION="$FOUND"; echo "Restored from git log: $FOUND"
    else NEW_VERSION="$MAJOR.$NEW_MINOR.0"; echo "No previous patch found — defaulting to 0"; fi ;;
  major-down)
    if [ "$MAJOR" -le 0 ]; then echo "Error: major is already 0"; exit 1; fi
    NEW_MAJOR=$((MAJOR - 1))
    FOUND=$(last_ver_for_prefix "$NEW_MAJOR\.")
    if [ -n "$FOUND" ]; then NEW_VERSION="$FOUND"; echo "Restored from git log: $FOUND"
    else NEW_VERSION="$NEW_MAJOR.0.0"; echo "No previous version found — defaulting to 0.0"; fi ;;
  set)
    if [ -z "$SET_VER" ]; then echo "Error: --set requires a version e.g. --set 2.1.0"; exit 1; fi
    if ! echo "$SET_VER" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
      echo "Error: version must be in format X.Y.Z"; exit 1; fi
    NEW_VERSION="$SET_VER" ;;
esac

sed -i "s/APP_VERSION = \"$CURRENT\"/APP_VERSION = \"$NEW_VERSION\"/" "$INDEX"
sed -i "s/?v=[0-9]*\.[0-9]*\.[0-9]*/?v=$NEW_VERSION/g" "$INDEX"
sed -i "s/__VERSION__/$NEW_VERSION/g" "$INDEX"

echo "Version: $CURRENT → $NEW_VERSION"

cd "$REPO_DIR"
git add -A
git commit -m "v$NEW_VERSION - ${MSG:-update}"
git push

echo "Pushed — waiting for GitHub Pages to deploy..."
DEPLOY_START=$(date +%s)

LIVE_URL="https://repusmai.github.io/fitness-tracker/index.html"
MAX_ATTEMPTS=12
ATTEMPT=0
VERIFIED=false
CONFIRM=0

# Initial wait — GitHub Pages takes ~30s just to start the build
sleep 20

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  sleep 10
  ATTEMPT=$((ATTEMPT + 1))
  LIVE_VERSION=$(curl -s --max-time 10 "$LIVE_URL" | grep -o 'APP_VERSION = "[0-9]*\.[0-9]*\.[0-9]*"' | grep -o '[0-9]*\.[0-9]*\.[0-9]*' 2>/dev/null || echo "")
  if
[ "$LIVE_VERSION" = "$NEW_VERSION" ]; then
    CONFIRM=$((CONFIRM + 1))
    if [ $CONFIRM -ge 2 ]; then
      VERIFIED=true
      break
    fi
    echo "  (${ATTEMPT}/${MAX_ATTEMPTS}) Version matches — confirming..."
  else
    CONFIRM=0
  fi
  echo "  (${ATTEMPT}/${MAX_ATTEMPTS}) Live version is ${LIVE_VERSION:-unknown}, waiting..."
done

ELAPSED=$(( $(date +%s) - DEPLOY_START ))
MINS=$((ELAPSED / 60))
SECS=$((ELAPSED % 60))
TIME_STR="${SECS}s"
if [ $MINS -gt 0 ]; then TIME_STR="${MINS}m ${SECS}s"; fi

if $VERIFIED; then
  echo "✓ Verified — v$NEW_VERSION is live (${TIME_STR})"
else
  echo "⚠ Warning: live site still shows v${LIVE_VERSION:-unknown} after ${TIME_STR}."
  echo "  Check https://github.com/repusmai/fitness-tracker/actions"
fi
