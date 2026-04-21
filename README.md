# Fitness Tracker

A personal workout tracking progressive web app (PWA), built with vanilla React and designed to work fully offline. No backend, no accounts — all data lives on your device.

**Live app:** https://repusmai.github.io/fitness-tracker

---

## Features

### Workout Logging
- **Quick Log** — start a workout session instantly, log sets in real time with weight, reps, and RIR (reps in reserve)
- **Manual Entry** — create or edit a workout after the fact with full control over exercises, sets, and dates
- **Templates** — save any workout as a reusable template and start new sessions from it with one tap
- **Exercise history** — set input rows show your last logged weight/reps for that exercise as a reference

### Exercise Library
- Large built-in exercise library organised by muscle group and category
- Create custom exercises with primary and secondary muscle assignments
- Filter by muscle group, category, or search by name

### Stats
- **Strength trends** — per-exercise chart showing estimated 1RM (e1RM) over time, tappable from the Strength Trends panel
- **Group charts** — one chart per muscle group (Chest, Back, Shoulders, Biceps, Triceps, Legs, Core), each plotting a single representative exercise
  - Auto-selects the exercise with the highest all-time e1RM for that group
  - Tap the exercise pill on any chart to override with a different exercise
  - Overrides persist across sessions
- All charts scale the X-axis by actual date, not by number of entries
- Toggle between kg and lbs — all values convert automatically

### Appearance
Six built-in themes: 🌌 Galaxy, 🌊 Ocean, 🌲 Forest, 🌅 Sunset, 🌸 Rose, ⬜ Mono

### Data & Backup
- All data stored locally in `localStorage` with automatic IndexedDB snapshots as a fallback
- **Google Drive backup** — enter your OAuth Client ID in Settings to enable one-tap backup and restore
- **Local backup** — export/import as JSON at any time
- **Auto-backup** — optionally back up to Drive silently on app open if more than 24 hours have passed since the last backup

### PWA
- Installable to home screen on Android and iOS
- Fully offline — all assets cached by the service worker on first load
- Auto-detects updates and prompts to reload

---

## Project Structure

```
fitness-tracker/
├── index.html                  # Entry point — also declares APP_VERSION
├── deploy.sh                   # Version bump + git push script
├── css/
│   └── styles.css
└── js/
    ├── app.js                  # Root React component, routing, nav
    ├── constants.js            # Muscle groups, exercise library, unit constants
    ├── data.js                 # localStorage load/save
    ├── db.js                   # IndexedDB snapshot helpers
    ├── google-drive.js         # Drive OAuth + backup/restore logic
    ├── pwa.js                  # Service worker + PWA manifest generation
    ├── themes.js               # Theme definitions and application
    ├── utils.js                # Hooks, date/set helpers, template helpers
    ├── components/
    │   ├── charts.js           # LineChart, GroupStrengthCharts, StrengthTrendPanel
    │   ├── exercise-picker.js  # Bottom-sheet exercise search modal
    │   ├── install-banner.js   # PWA install prompt banner
    │   ├── muscle-selector.js  # Muscle assignment UI for custom exercises
    │   ├── set-row.js          # Individual set input row
    │   ├── ui.js               # Shared UI primitives (Btn, Icon, Inp, etc.)
    │   └── workout-entry-card.js
    └── screens/
        ├── detail.js           # Workout detail / save-as-template view
        ├── editor.js           # Workout editor (manual entry)
        ├── library.js          # Exercise library browser
        ├── log.js              # Workout history + templates tab
        ├── quick-log.js        # Live workout logging screen
        ├── settings.js         # Settings, backup, appearance
        └── stats.js            # Stats screen layout
```

---

## Local Development

No build step required — the app is plain HTML, CSS, and JS.

```bash
# Clone the repo
git clone https://github.com/repusmai/fitness-tracker.git
cd fitness-tracker

# Serve locally (any static server works)
python3 -m http.server 8080
# then open http://localhost:8080
```

> **Note:** The service worker requires HTTPS or `localhost` to register. It will silently skip on other origins.

---

## Deploying

The app is hosted on GitHub Pages from the `main` branch root.

Use the included `deploy.sh` script to bump the version, commit all changes, and push in one command.

### Version bump commands

```bash
# Bump patch — 1.2.3 → 1.2.4 (default)
./deploy.sh "Fix nav jitter"

# Bump minor — 1.2.3 → 1.3.0
./deploy.sh "Add group charts" --minor

# Bump major — 1.2.3 → 2.0.0
./deploy.sh "Full redesign" --major

# Decrement patch — 1.2.4 → 1.2.3
./deploy.sh "Revert last patch" --patch-down

# Decrement minor — restores last known patch for the previous minor from git log
# e.g. 1.8.0 → 1.7.13 if 1.7.13 was the last 1.7.x commit
./deploy.sh "Roll back minor" --minor-down

# Decrement major — restores last known minor+patch for the previous major from git log
./deploy.sh "Roll back major" --major-down

# Set version manually
./deploy.sh "Hotfix" --set 2.1.0
```

The script reads and writes `APP_VERSION` in `index.html`. This single value flows to two places automatically:
- The **Settings screen** displays it as the app version
- **`pwa.js`** uses it to generate the service worker cache key, so every version bump forces a cache bust

To set a specific major or minor version before deploying, edit `index.html` directly:
```html
<script>const APP_VERSION = "2.0.0";</script>
```
Then run `./deploy.sh` as normal — it will increment the patch from whatever you set.

---

## Google Drive Setup

To enable Drive backup, you need a Google OAuth 2.0 Client ID:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create an OAuth 2.0 Client ID → Web application
4. Add `https://repusmai.github.io` to **Authorised JavaScript origins**
5. Copy the Client ID
6. In the app, go to **Settings → Google Drive Backup** and paste it in

The Client ID is saved to `localStorage` and never leaves your device.

---

## Versioning

Versions follow `MAJOR.MINOR.PATCH`:

| Bump | When to use |
|------|-------------|
| Patch | Bug fixes, small tweaks |
| Minor | New features, meaningful changes |
| Major | Large rewrites, breaking changes |
