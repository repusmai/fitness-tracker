// ── Workout & Template Model ──────────────────────────────────────────────────
// Data-model functions: set counting, history lookup, template conversions.
// Depends on: today() from utils.js

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
 * Returns set data from the most recent workout that included a given exercise,
 * skipping entries with no logged data. Used as placeholder hints in set input rows.
 */
function getLastSets(workouts, exerciseId) {
  const sorted = [...workouts].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    if (db > da) return 1;
    if (db < da) return -1;
    // same date: tiebreak by id (timestamp ms) so newer session wins
    return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
  });
  for (const workout of sorted) {
    const entry = workout.entries.find(e => e.exerciseId === exerciseId);
    // skip entries with no actual logged data (e.g. template-started workouts saved blank)
    if (entry?.sets?.some(s => s.weight || s.reps)) return entry.sets;
  }
  return null;
}

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
      sets: entry.sets.map(set => ({
        ...set,
        reps: '',
        rir:  '',
        side: set.side || 'B', // explicitly preserve side so it survives template instantiation
      })),
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
    name:    template.name || 'Workout',
    notes:   '',
    unit,
    entries: (template.entries || []).map((entry, index) => ({
      ...entry,
      _key: `${entry.exerciseId}_${index}_tpl`,
      unit: entry.unit || unit,
      sets: (entry.sets || []).map(set => ({
        ...set,
        weight: '',  // cleared; placeholder comes from getLastSets
        reps:   '',
        rir:    '',
        unit: set.unit || unit,
        side: set.side || 'B',
      })),
    })),
  };
}
