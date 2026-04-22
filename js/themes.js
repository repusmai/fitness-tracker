// ── Themes ────────────────────────────────────────────────────────────────────
// Each theme defines all CSS custom property values.
// Muscle colors map to: [chest, back, shoulders, arms, legs, core, fullbody, cardio]

const THEME_STORAGE_KEY = 'fitnessTracker_theme';

let _activeThemeId = 'galaxy';

const THEMES = {
  galaxy: {
    name: "Galaxy", emoji: "🌌",
    bg: "#0a0f1e", surface: "#0f172a", surface2: "#1e293b",
    border: "#26304a", border2: "#334155",
    muted: "#475569", muted2: "#64748b", subtle: "#94a3b8",
    text: "#f1f5f9", text2: "#e2e8f0",
    accent: "#6366f1", accent2: "#8b5cf6",
    accentSoft: "rgba(99,102,241,0.12)", accentGlow: "rgba(99,102,241,0.25)",
    accentLight: "#a5b4fc", accentMid: "#818cf8",
    grad: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    muscleColors: ["#ef4444","#3b82f6","#a855f7","#f97316","#22c55e","#eab308","#ec4899","#06b6d4"],
  },
  ocean: {
    name: "Ocean", emoji: "🌊",
    bg: "#040d18", surface: "#071524", surface2: "#0d2137",
    border: "#152e4a", border2: "#1a3a54",
    muted: "#2d5a7a", muted2: "#4a7a9b", subtle: "#7ab0c8",
    text: "#e8f4f8", text2: "#d0e8f0",
    accent: "#06b6d4", accent2: "#0891b2",
    accentSoft: "rgba(6,182,212,0.12)", accentGlow: "rgba(6,182,212,0.25)",
    accentLight: "#67e8f9", accentMid: "#22d3ee",
    grad: "linear-gradient(135deg,#06b6d4,#0891b2)",
    muscleColors: ["#f87171","#38bdf8","#c084fc","#fb923c","#34d399","#fde047","#f9a8d4","#22d3ee"],
  },
  forest: {
    name: "Forest", emoji: "🌲",
    bg: "#060f08", surface: "#091510", surface2: "#0f2218",
    border: "#183020", border2: "#1e3a28",
    muted: "#2d5a3a", muted2: "#3d7a4e", subtle: "#6aab7e",
    text: "#e8f5ec", text2: "#d0edda",
    accent: "#22c55e", accent2: "#16a34a",
    accentSoft: "rgba(34,197,94,0.12)", accentGlow: "rgba(34,197,94,0.25)",
    accentLight: "#86efac", accentMid: "#4ade80",
    grad: "linear-gradient(135deg,#22c55e,#16a34a)",
    muscleColors: ["#f87171","#60a5fa","#c084fc","#fb923c","#4ade80","#facc15","#f472b6","#34d3eb"],
  },
  sunset: {
    name: "Sunset", emoji: "🌅",
    bg: "#120608", surface: "#1c0a0a", surface2: "#2d1212",
    border: "#3d1a18", border2: "#4a2020",
    muted: "#7a3030", muted2: "#9b4a4a", subtle: "#c87a7a",
    text: "#f8eeee", text2: "#f0d8d8",
    accent: "#f97316", accent2: "#ea580c",
    accentSoft: "rgba(249,115,22,0.12)", accentGlow: "rgba(249,115,22,0.25)",
    accentLight: "#fdba74", accentMid: "#fb923c",
    grad: "linear-gradient(135deg,#f97316,#ef4444)",
    muscleColors: ["#fca5a5","#7dd3fc","#d8b4fe","#fdba74","#86efac","#fde047","#f9a8d4","#67e8f9"],
  },
  rose: {
    name: "Rose", emoji: "🌸",
    bg: "#120810", surface: "#1c0f1a", surface2: "#2d1828",
    border: "#3d1e34", border2: "#4a2840",
    muted: "#7a3060", muted2: "#9b4a7a", subtle: "#c87aaa",
    text: "#f8eef6", text2: "#f0d8ec",
    accent: "#ec4899", accent2: "#db2777",
    accentSoft: "rgba(236,72,153,0.12)", accentGlow: "rgba(236,72,153,0.25)",
    accentLight: "#f9a8d4", accentMid: "#f472b6",
    grad: "linear-gradient(135deg,#ec4899,#db2777)",
    muscleColors: ["#fca5a5","#93c5fd","#d8b4fe","#fdba74","#86efac","#fde047","#f9a8d4","#67e8f9"],
  },
  mono: {
    name: "Mono", emoji: "⬜",
    bg: "#0a0a0a", surface: "#111111", surface2: "#1c1c1c",
    border: "#272727", border2: "#333333",
    muted: "#444444", muted2: "#5a5a5a", subtle: "#808080",
    text: "#f2f2f2", text2: "#d4d4d4",
    accent: "#e2e8f0", accent2: "#94a3b8",
    accentSoft: "rgba(226,232,240,0.10)", accentGlow: "rgba(226,232,240,0.20)",
    accentLight: "#ffffff", accentMid: "#cbd5e1",
    grad: "linear-gradient(135deg,#94a3b8,#64748b)",
    muscleColors: ["#d4d4d4","#a3a3a3","#e5e5e5","#c4c4c4","#b4b4b4","#e0e0e0","#d0d0d0","#c0c0c0"],
  },
};

// Names that map to each index in muscleColors
const MUSCLE_COLOR_KEYS = [
  '--mc-chest', '--mc-back', '--mc-shoulders', '--mc-arms',
  '--mc-legs', '--mc-core', '--mc-fullbody', '--mc-cardio',
];

function applyTheme(themeId) {
  _activeThemeId = themeId;
  const theme = THEMES[themeId] || THEMES.galaxy;
  const root = document.documentElement.style;

  // Apply all CSS variables
  root.setProperty('--bg',          theme.bg);
  root.setProperty('--surface',     theme.surface);
  root.setProperty('--surface2',    theme.surface2);
  root.setProperty('--border',      theme.border);
  root.setProperty('--border2',     theme.border2);
  root.setProperty('--muted',       theme.muted);
  root.setProperty('--muted2',      theme.muted2);
  root.setProperty('--subtle',      theme.subtle);
  root.setProperty('--text',        theme.text);
  root.setProperty('--text2',       theme.text2);
  root.setProperty('--accent',      theme.accent);
  root.setProperty('--accent2',     theme.accent2);
  root.setProperty('--accent-soft', theme.accentSoft);
  root.setProperty('--accent-glow', theme.accentGlow);
  root.setProperty('--accent-light',theme.accentLight);
  root.setProperty('--accent-mid',  theme.accentMid);
  root.setProperty('--grad',        theme.grad);

  // Apply muscle group colours
  const muscleColors = theme.muscleColors || THEMES.galaxy.muscleColors;
  MUSCLE_COLOR_KEYS.forEach((key, index) => root.setProperty(key, muscleColors[index]));

  // Sync the PWA theme-color meta tag
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.content = theme.bg;

  try { localStorage.setItem(THEME_STORAGE_KEY, themeId); } catch (_) {}
}

function loadTheme() {
  try { return localStorage.getItem(THEME_STORAGE_KEY) || 'galaxy'; } catch (_) { return 'galaxy'; }
}

// Apply the saved (or default) theme immediately on script load
applyTheme(loadTheme());
