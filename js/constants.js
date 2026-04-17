// ── Muscle Group Taxonomy ─────────────────────────────────────────────────────
// Defines all muscle categories, their display colors (via CSS vars), and
// the muscles that belong to each category.

const MUSCLE_CATEGORIES = [
  { category: "Chest",     color: "var(--mc-chest)",     muscles: ["Pectoralis Major", "Pectoralis Minor", "Serratus Anterior"] },
  { category: "Back",      color: "var(--mc-back)",      muscles: ["Lats", "Upper Traps", "Mid Traps", "Lower Traps", "Rhomboids", "Erector Spinae", "Multifidus"] },
  { category: "Shoulders", color: "var(--mc-shoulders)", muscles: ["Front Delt", "Side Delt", "Rear Delt", "Rotator Cuff"] },
  { category: "Arms",      color: "var(--mc-arms)",      muscles: ["Biceps", "Brachialis", "Brachioradialis", "Triceps", "Wrist Flexors", "Wrist Extensors", "Pronators", "Supinators"] },
  { category: "Legs",      color: "var(--mc-legs)",      muscles: ["Quads", "Hamstrings", "Glutes", "Adductors", "Abductors", "Calves", "Tibialis Anterior", "Hip Flexors"] },
  { category: "Core",      color: "var(--mc-core)",      muscles: ["Rectus Abdominis", "Obliques", "Transverse Abdominis", "Hip Flexors"] },
  { category: "Full Body", color: "var(--mc-fullbody)",  muscles: ["Full Body"] },
  { category: "Cardio",    color: "var(--mc-cardio)",    muscles: ["Cardio"] },
];

// Flat list of all muscles with their parent category and colour
const ALL_MUSCLES = MUSCLE_CATEGORIES.flatMap(category =>
  category.muscles.map(muscle => ({
    muscle,
    category: category.category,
    color: category.color,
  }))
);

// ── Muscle Colour Helpers ─────────────────────────────────────────────────────

function getCategoryForMuscle(muscle) {
  return ALL_MUSCLES.find(x => x.muscle === muscle)?.category || muscle;
}

/**
 * Resolves a CSS variable like "var(--mc-chest)" to the actual hex colour
 * from the currently active theme. Needed when colours are used in canvas
 * drawing or other contexts where CSS vars don't work.
 */
function resolveCssColor(cssVar) {
  if (!cssVar || !cssVar.startsWith('var(')) return cssVar;
  const key = cssVar.slice(4, -1); // e.g. "--mc-chest"
  const indexMap = {
    '--mc-chest': 0, '--mc-back': 1, '--mc-shoulders': 2, '--mc-arms': 3,
    '--mc-legs': 4, '--mc-core': 5, '--mc-fullbody': 6, '--mc-cardio': 7,
  };
  const index = indexMap[key];
  if (index === undefined) return cssVar;
  const theme = THEMES[_activeThemeId] || THEMES.galaxy;
  return theme.muscleColors?.[index] || cssVar;
}

function getColorForMuscle(muscle) {
  const cssVar = ALL_MUSCLES.find(x => x.muscle === muscle)?.color || 'var(--accent)';
  return resolveCssColor(cssVar);
}

function getColorForCategory(category) {
  const cssVar = MUSCLE_CATEGORIES.find(c => c.category === category)?.color || 'var(--accent)';
  return resolveCssColor(cssVar);
}

function getPrimaryCategory(exercise) {
  if (!exercise?.muscles?.length) return "Full Body";
  return getCategoryForMuscle(exercise.muscles[0]);
}

// ── Default Exercise Library ──────────────────────────────────────────────────

function makeExercise(id, name, muscles) {
  return {
    id,
    name,
    muscles,
    primaryMuscles:   [muscles[0]],
    secondaryMuscles: muscles.slice(1),
  };
}

const DEFAULT_EXERCISES = [
  // Chest
  makeExercise("e1",  "Bench Press",           ["Pectoralis Major", "Front Delt", "Triceps"]),
  makeExercise("e2",  "Incline Dumbbell Press", ["Pectoralis Major", "Front Delt", "Triceps"]),
  makeExercise("e3",  "Cable Fly",              ["Pectoralis Major", "Pectoralis Minor"]),
  makeExercise("e4",  "Push-Up",               ["Pectoralis Major", "Triceps", "Serratus Anterior"]),
  makeExercise("e5",  "Dips",                  ["Pectoralis Major", "Triceps", "Front Delt"]),
  // Back
  makeExercise("e6",  "Deadlift",              ["Erector Spinae", "Glutes", "Hamstrings", "Lats", "Upper Traps"]),
  makeExercise("e7",  "Barbell Row",           ["Lats", "Rhomboids", "Mid Traps", "Biceps"]),
  makeExercise("e8",  "Pull-Up",              ["Lats", "Biceps", "Rhomboids"]),
  makeExercise("e9",  "Lat Pulldown",          ["Lats", "Biceps", "Mid Traps"]),
  makeExercise("e10", "Seated Cable Row",      ["Rhomboids", "Mid Traps", "Lats", "Biceps"]),
  makeExercise("e11", "Face Pull",             ["Rear Delt", "Rotator Cuff", "Mid Traps"]),
  makeExercise("e12", "Good Morning",          ["Erector Spinae", "Hamstrings", "Glutes"]),
  makeExercise("e13", "Hyperextension",        ["Erector Spinae", "Multifidus", "Glutes"]),
  // Shoulders
  makeExercise("e14", "Overhead Press",        ["Front Delt", "Side Delt", "Triceps", "Upper Traps"]),
  makeExercise("e15", "Lateral Raise",         ["Side Delt"]),
  makeExercise("e16", "Front Raise",           ["Front Delt"]),
  makeExercise("e17", "Reverse Fly",           ["Rear Delt", "Rhomboids"]),
  makeExercise("e18", "Arnold Press",          ["Front Delt", "Side Delt", "Rear Delt", "Triceps"]),
  makeExercise("e19", "Upright Row",           ["Side Delt", "Upper Traps", "Biceps"]),
  // Arms
  makeExercise("e20", "Barbell Curl",          ["Biceps", "Brachialis"]),
  makeExercise("e21", "Hammer Curl",           ["Brachialis", "Brachioradialis", "Biceps"]),
  makeExercise("e22", "Preacher Curl",         ["Biceps", "Brachialis"]),
  makeExercise("e23", "Concentration Curl",    ["Biceps"]),
  makeExercise("e24", "Reverse Curl",          ["Brachioradialis", "Wrist Extensors"]),
  makeExercise("e25", "Wrist Curl",            ["Wrist Flexors"]),
  makeExercise("e26", "Wrist Extension",       ["Wrist Extensors"]),
  makeExercise("e27", "Tricep Pushdown",       ["Triceps"]),
  makeExercise("e28", "Skull Crusher",         ["Triceps"]),
  makeExercise("e29", "Overhead Tricep Ext.",  ["Triceps"]),
  makeExercise("e30", "Close-Grip Bench",      ["Triceps", "Pectoralis Major", "Front Delt"]),
  // Legs
  makeExercise("e31", "Squat",                 ["Quads", "Glutes", "Hamstrings", "Adductors"]),
  makeExercise("e32", "Romanian Deadlift",     ["Hamstrings", "Glutes", "Erector Spinae"]),
  makeExercise("e33", "Leg Press",             ["Quads", "Glutes", "Hamstrings"]),
  makeExercise("e34", "Leg Curl",              ["Hamstrings"]),
  makeExercise("e35", "Leg Extension",         ["Quads"]),
  makeExercise("e36", "Bulgarian Split Squat", ["Quads", "Glutes", "Hamstrings", "Hip Flexors"]),
  makeExercise("e37", "Hip Thrust",            ["Glutes", "Hamstrings"]),
  makeExercise("e38", "Sumo Deadlift",         ["Adductors", "Glutes", "Hamstrings", "Quads"]),
  makeExercise("e39", "Adductor Machine",      ["Adductors"]),
  makeExercise("e40", "Abductor Machine",      ["Abductors", "Glutes"]),
  makeExercise("e41", "Calf Raise",            ["Calves"]),
  makeExercise("e42", "Tibialis Raise",        ["Tibialis Anterior"]),
  makeExercise("e43", "Nordic Curl",           ["Hamstrings"]),
  makeExercise("e44", "Hack Squat",            ["Quads", "Glutes"]),
  // Core
  makeExercise("e45", "Plank",                 ["Transverse Abdominis", "Rectus Abdominis"]),
  makeExercise("e46", "Cable Crunch",          ["Rectus Abdominis"]),
  makeExercise("e47", "Hanging Leg Raise",     ["Rectus Abdominis", "Hip Flexors"]),
  makeExercise("e48", "Russian Twist",         ["Obliques"]),
  makeExercise("e49", "Ab Wheel",              ["Rectus Abdominis", "Transverse Abdominis"]),
  makeExercise("e50", "Side Plank",            ["Obliques", "Transverse Abdominis"]),
  // Cardio
  makeExercise("e51", "Running",              ["Cardio"]),
  makeExercise("e52", "Cycling",              ["Cardio"]),
  makeExercise("e53", "Rowing Machine",       ["Cardio"]),
  makeExercise("e54", "Jump Rope",            ["Cardio"]),
];

// ── Muscle Groups (used for stats / strength standards) ───────────────────────

const MUSCLE_GROUPS = [
  { key: "chest",     label: "Chest",     color: "var(--mc-chest)",     muscles: ["Pectoralis Major", "Pectoralis Minor", "Serratus Anterior"] },
  { key: "back",      label: "Back",      color: "var(--mc-back)",      muscles: ["Lats", "Upper Traps", "Mid Traps", "Lower Traps", "Rhomboids", "Erector Spinae", "Multifidus"] },
  { key: "shoulders", label: "Shoulders", color: "var(--mc-shoulders)", muscles: ["Front Delt", "Side Delt", "Rear Delt", "Rotator Cuff"] },
  { key: "biceps",    label: "Biceps",    color: "var(--mc-arms)",      muscles: ["Biceps", "Brachialis", "Brachioradialis"] },
  { key: "triceps",   label: "Triceps",   color: "var(--mc-arms)",      muscles: ["Triceps"] },
  { key: "legs",      label: "Legs",      color: "var(--mc-legs)",      muscles: ["Quads", "Hamstrings", "Glutes", "Adductors", "Abductors", "Calves", "Tibialis Anterior", "Hip Flexors"] },
  { key: "core",      label: "Core",      color: "var(--mc-core)",      muscles: ["Rectus Abdominis", "Obliques", "Transverse Abdominis"] },
];

// Alias used in stats calculations
const MUSCLE_STANDARDS = MUSCLE_GROUPS;

// ── Unit Constants ────────────────────────────────────────────────────────────

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;
const SIDE_OPTIONS = [
  { v: "B", label: "Both" },
  { v: "L", label: "L" },
  { v: "R", label: "R" },
];
