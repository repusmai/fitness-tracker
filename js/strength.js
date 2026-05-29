// ── Strength & 1-Rep Max Calculations ─────────────────────────────────────────
// 1RM estimation and per-muscle strength history.
// Depends on: MUSCLE_STANDARDS from constants.js

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
