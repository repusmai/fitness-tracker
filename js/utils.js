// ── Utility Functions ─────────────────────────────────────────────────────────

const { useState, useEffect, useRef } = React;

// ── Unit Conversion ───────────────────────────────────────────────────────────


function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'kg' ? value * KG_TO_LBS : value * LBS_TO_KG;
}

// ── Date Helpers ──────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Formatting Helpers ────────────────────────────────────────────────────────

function formatSets(count) {
  // Display numbers >= 1000 with a single decimal (e.g. 1.2k)
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count;
}

// ── Workout / Set Calculations ────────────────────────────────────────────────

/**
 * Counts completed sets (those with at least a weight or rep value)
 * across a list of workout entries.
 */
function countSets(entries, exercises) {
  return entries.reduce((total, entry) => {
    const ex = exercises.find(e => e.id === entry.exerciseId);
    const completedSets = entry.sets.filter(s => s.weight || s.reps).length;
    return total + completedSets;
  }, 0);
}

/** Sums completed sets across all workouts. */
function countSetsWorkouts(workouts, exercises) {
  return workouts.reduce((total, workout) => total + countSets(workout.entries, exercises), 0);
}

/**
 * Returns the set data from the most recent workout that included a given exercise.
 * Used to pre-fill placeholder values in the set input rows.
 */
function getLastSets(workouts, exerciseId) {
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  for (const workout of sorted) {
    const entry = workout.entries.find(e => e.exerciseId === exerciseId);
    if (entry) return entry.sets;
  }
  return null;
}

// ── 1-Rep Max Estimation ──────────────────────────────────────────────────────

/** Brzycki formula for estimated 1RM. */
function estimate1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
}

/**
 * Finds the best estimated 1RM across all workouts for exercises
 * that match a given set of muscle groups.
 */
function getBestByMuscles(workouts, exercises, muscles) {
  let best = 0;
  for (const workout of workouts) {
    for (const entry of workout.entries) {
      const ex = exercises.find(e => e.id === entry.exerciseId);
      if (!ex?.muscles?.some(m => muscles.includes(m))) continue;
      for (const set of entry.sets) {
        const w = parseFloat(set.weight);
        const r = parseInt(set.reps);
        if (!w || !r) continue;
        const rm = estimate1RM(w, r);
        if (rm > best) best = rm;
      }
    }
  }
  return Math.round(best);
}

/** Builds the overall average 1RM history, one data point per workout date. */
function getOverallAverage1RMHistory(workouts, exercises) {
  if (!workouts.length) return [];
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
  return sorted
    .map((workout, index) => {
      const upTo  = sorted.slice(0, index + 1);
      const bests = MUSCLE_STANDARDS.map(s => getBestByMuscles(upTo, exercises, s.muscles)).filter(v => v > 0);
      if (!bests.length) return null;
      const avg = Math.round(bests.reduce((sum, v) => sum + v, 0) / bests.length);
      return { date: workout.date, value: avg };
    })
    .filter(Boolean);
}

// ── Template Helpers ──────────────────────────────────────────────────────────

/**
 * Converts a completed workout into a reusable template.
 * Weights are preserved; reps and RIR are cleared.
 */
function workoutToTemplate(workout, name) {
  return {
    id:          `tpl_${Date.now()}`,
    name:        name || workout.name,
    createdFrom: workout.id,
    unit:        workout.unit || 'kg',
    entries:     workout.entries.map(entry => ({
      ...entry,
      sets: entry.sets.map(set => ({ ...set, reps: '', rir: '' })),
    })),
  };
}

/**
 * Instantiates a template into a new workout object ready for editing.
 */
function templateToWorkout(template, preferredUnit) {
  const unit = template.unit || preferredUnit || 'kg';
  return {
    id:      Date.now().toString(),
    date:    today(),
    name:    template.name,
    notes:   '',
    unit,
    entries: template.entries.map((entry, index) => ({
      ...entry,
      _key: `${entry.exerciseId}_${index}_tpl`,
      unit: entry.unit || unit,
      sets: entry.sets.map(set => ({ ...set, unit: set.unit || unit })),
    })),
  };
}

// ── Custom React Hooks ────────────────────────────────────────────────────────

/**
 * Hides a fixed header when the user scrolls down, reveals it on scroll up.
 * Returns { ref, hidden } — attach ref to the scrollable container.
 */
function useScrollHide(threshold = 8) {
  const ref     = useRef(null);
  const [hidden, setHidden] = useState(false);
  const lastY   = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      if (Math.abs(y - lastY.current) < threshold) return;
      // Don't hide the header when within 60px of the bottom — prevents
      // the padding-top change from shifting content and causing a flicker loop.
      const nearBottom = el.scrollHeight - y - el.clientHeight < 60;
      if (!nearBottom) {
        setHidden(y > lastY.current && y > 50);
      }
      lastY.current = y;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return { ref, hidden };
}

/**
 * Tracks the height of the on-screen keyboard via the Visual Viewport API.
 * Returns a pixel value representing how much the keyboard has pushed the viewport up.
 */
function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const update = () => {
      const height = Math.max(
        0,
        window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
      );
      setKeyboardHeight(height);
    };

    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, []);

  return keyboardHeight;
}

// Alias used throughout the codebase
const fmtSets = formatSets;
