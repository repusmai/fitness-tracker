#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# fix-repo.sh
# Run this from the ROOT of your git repository.
# It reorganizes the flat file layout into the subfolder structure that
# index.html and pwa.js expect, downloads React, and removes the dead
# icons.js reference.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "▶ Creating folder structure..."
mkdir -p css js/components js/screens

echo "▶ Moving CSS..."
mv styles.css css/styles.css

echo "▶ Moving root-level JS..."
mv pwa.js       js/pwa.js
mv db.js        js/db.js
mv themes.js    js/themes.js
mv data.js      js/data.js
mv google-drive.js js/google-drive.js
mv utils.js     js/utils.js
mv constants.js js/constants.js
mv app.js       js/app.js

echo "▶ Moving component JS..."
mv ui.js                js/components/ui.js
mv charts.js            js/components/charts.js
mv muscle-selector.js   js/components/muscle-selector.js
mv exercise-picker.js   js/components/exercise-picker.js
mv set-row.js           js/components/set-row.js
mv workout-entry-card.js js/components/workout-entry-card.js
mv install-banner.js    js/components/install-banner.js

echo "▶ Moving screen JS..."
mv editor.js    js/screens/editor.js
mv detail.js    js/screens/detail.js
mv quick-log.js js/screens/quick-log.js
mv log.js       js/screens/log.js
mv stats.js     js/screens/stats.js
mv library.js   js/screens/library.js
mv settings.js  js/screens/settings.js

echo "▶ Downloading React 19 production build..."
curl -fsSL "https://unpkg.com/react@19/umd/react.production.min.js" \
     -o js/react.production.min.js
echo "   React downloaded: $(wc -c < js/react.production.min.js) bytes"

echo "▶ Patching index.html — removing dead icons.js reference..."
# Remove the line that loads icons.js (it doesn't exist; Icon is in ui.js)
sed -i '/<script src="js\/components\/icons.js"><\/script>/d' index.html

echo "▶ Patching pwa.js — removing icons.js from SW cache list..."
sed -i "/'\.\/js\/components\/icons\.js',/d" js/pwa.js

echo "▶ Bumping service worker cache version in pwa.js..."
# Increments the version number, e.g. fitness-v27 → fitness-v28
sed -i "s/const CACHE_VERSION = 'fitness-v\([0-9]*\)'/\"const CACHE_VERSION = 'fitness-v\$((\1+1))'\"/e" js/pwa.js

echo ""
echo "✅ Done! Verify the result:"
echo "   ls -R . | head -60"
echo ""
echo "▶ Stage and commit..."
git add -A
git status

echo ""
echo "Run the following to commit and push:"
echo "  git commit -m 'fix: reorganize into js/css subfolders, add React, fix SW cache'"
echo "  git push"
