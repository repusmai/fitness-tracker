// ── Data Persistence (localStorage) ──────────────────────────────────────────
// Handles loading, saving, and drafting workout data in localStorage.
// IndexedDB snapshots are handled separately in db.js.

const STORAGE_KEY = 'fitnessTracker_v2';
const DRAFT_KEY   = 'fitnessTracker_draft';
const DRIVE_PREFS_KEY = 'fitnessTracker_drivePrefs';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw);
    return {
      workouts:      parsed.workouts      || [],
      exercises:     parsed.exercises     || DEFAULT_EXERCISES,
      bodyweight:    parsed.bodyweight    || 80,
      templates:     parsed.templates     || [],
      preferredUnit: parsed.preferredUnit || 'kg',
    };
  } catch (_) {
    return getDefaultData();
  }
}

function getDefaultData() {
  return {
    workouts:      [],
    exercises:     DEFAULT_EXERCISES,
    bodyweight:    80,
    templates:     [],
    preferredUnit: 'kg',
  };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    saveSnapshot(data); // Also write an IndexedDB snapshot on every save
  } catch (_) {}
}

// ── Draft (in-progress workout) ───────────────────────────────────────────────

function saveDraft(workout, step) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ workout, step }));
  } catch (_) {}
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
}

// ── Google Drive Preferences ──────────────────────────────────────────────────

function getDrivePrefs() {
  try {
    return JSON.parse(localStorage.getItem(DRIVE_PREFS_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function saveDrivePrefs(prefs) {
  try {
    localStorage.setItem(DRIVE_PREFS_KEY, JSON.stringify(prefs));
  } catch (_) {}
}
