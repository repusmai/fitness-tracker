#!/bin/bash
# ── deploy.sh ─────────────────────────────────────────────────────────────────
# Usage:
#   ./deploy.sh [message]               — bumps patch (1.2.3 → 1.2.4)
#   ./deploy.sh [message] --minor       — bumps minor (1.2.3 → 1.3.0)
#   ./deploy.sh [message] --major       — bumps major (1.2.3 → 2.0.0)

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
for arg in "$@"; do
  case "$arg" in
    --major) BUMP="major" ;;
    --minor) BUMP="minor" ;;
    *)       MSG="$arg"   ;;
  esac
done

case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0           ;;
  patch) PATCH=$((PATCH + 1))                    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
sed -i "s/APP_VERSION = \"$CURRENT\"/APP_VERSION = \"$NEW_VERSION\"/" "$INDEX"
echo "Version: $CURRENT → $NEW_VERSION"

cd "$REPO_DIR"
git add -A
git commit -m "v$NEW_VERSION - ${MSG:-update}"
git push

echo "Done — deployed v$NEW_VERSION"
