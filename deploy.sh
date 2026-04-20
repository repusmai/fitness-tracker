#!/bin/bash
# ── deploy.sh ─────────────────────────────────────────────────────────────────
# Bumps the patch version in index.html, commits, and pushes to GitHub.
# Usage: ./deploy.sh [message]
# Example: ./deploy.sh "Fix chart rendering"

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
INDEX="$REPO_DIR/index.html"

# ── Read current version ──────────────────────────────────────────────────────
CURRENT=$(grep -o 'APP_VERSION = "[0-9]*\.[0-9]*\.[0-9]*"' "$INDEX" | grep -o '[0-9]*\.[0-9]*\.[0-9]*')

if [ -z "$CURRENT" ]; then
  echo "Error: could not find APP_VERSION in index.html"
  exit 1
fi

# ── Bump patch number ─────────────────────────────────────────────────────────
MAJOR=$(echo "$CURRENT" | cut -d. -f1)
MINOR=$(echo "$CURRENT" | cut -d. -f2)
PATCH=$(echo "$CURRENT" | cut -d. -f3)
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

# ── Update index.html ─────────────────────────────────────────────────────────
sed -i "s/APP_VERSION = \"$CURRENT\"/APP_VERSION = \"$NEW_VERSION\"/" "$INDEX"

echo "Version: $CURRENT → $NEW_VERSION"

# ── Commit and push ───────────────────────────────────────────────────────────
cd "$REPO_DIR"
git add -A

MSG="${1:-v$NEW_VERSION}"
git commit -m "v$NEW_VERSION - $MSG"
git push

echo "Done — deployed v$NEW_VERSION"
