// ── Fitness Tracker — Pure Function Tests ─────────────────────────────────────
// Run with: node tests/run.js
// Uses Node's built-in test runner — no npm installs required.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const vm     = require('node:vm');
const fs     = require('node:fs');
const path   = require('node:path');

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// constants.js and utils.js are browser scripts (no exports, use const/let).
// const declarations in vm don't attach to the sandbox — so we load both files
// as ONE concatenated script that ends with an explicit export expression.
// That expression is evaluated in the same lexical scope as the consts.

const jsDir = path.join(__dirname, '..', 'js');

const sandbox = {
  // React hooks referenced at the top of utils.js — not used by pure functions
  React: { useState: () => {}, useEffect: () => {}, useRef: () => ({}) },
  // themes.js globals used by resolveCssColor — stub them out
  THEMES: {},
  _activeThemeId: 'galaxy',
  window: {},
  console,
};

const src = [
  fs.readFileSync(path.join(jsDir, 'constants.js'), 'utf8'),
  fs.readFileSync(path.join(jsDir, 'utils.js'),     'utf8'),
  // export expression: evaluated in the same scope where all consts live
  `;({
    KG_TO_LBS, LBS_TO_KG, SIDE_OPTIONS,
    MUSCLE_CATEGORIES, ALL_MUSCLES, MUSCLE_GROUPS, MUSCLE_STANDARDS,
    DEFAULT_EXERCISES, makeExercise,
    getCategoryForMuscle, getColorForMuscle, getColorForCategory, getPrimaryCategory,
    convertWeight, today, formatDate, formatSets, fmtSets,
    countSets, countSetsWorkouts, getLastSets,
    estimate1RM, getBestByMuscles, getOverallAverage1RMHistory,
    workoutToTemplate, templateToWorkout,
    MAX_WORKOUT_SECS, fmtDuration, fmtDurationShort,
  })`,
].join('\n');

const S = vm.runInNewContext(src, sandbox);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Strips vm-realm identity from objects/arrays so deepEqual works reliably.
function norm(v) { return JSON.parse(JSON.stringify(v)); }

function makeSet(weight = '100', reps = '8', opts = {}) {
  return { weight, reps, rir: '', side: 'B', unit: 'kg', ...opts };
}
function makeEntry(exerciseId, sets) {
  return { exerciseId, sets, note: '' };
}
function makeWorkout(id, date, entries) {
  return { id, date, name: 'Test', unit: 'kg', notes: '', entries };
}

// ── constants.js ──────────────────────────────────────────────────────────────

describe('constants', () => {

  test('KG_TO_LBS and LBS_TO_KG are inverses', () => {
    assert.ok(Math.abs(S.KG_TO_LBS * S.LBS_TO_KG - 1) < 0.0001);
  });

  test('DEFAULT_EXERCISES all have id, name, muscles', () => {
    for (const ex of S.DEFAULT_EXERCISES) {
      assert.ok(ex.id,             `missing id: ${ex.name}`);
      assert.ok(ex.name,           `missing name on ${ex.id}`);
      assert.ok(ex.muscles.length, `empty muscles on ${ex.id}`);
    }
  });

  test('DEFAULT_EXERCISES have no duplicate ids', () => {
    const ids = S.DEFAULT_EXERCISES.map(e => e.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('makeExercise sets primaryMuscles and secondaryMuscles correctly', () => {
    const ex = S.makeExercise('x1', 'Test', ['Quads', 'Glutes', 'Hamstrings']);
    assert.deepEqual(norm(ex.primaryMuscles),   ['Quads']);
    assert.deepEqual(norm(ex.secondaryMuscles), ['Glutes', 'Hamstrings']);
  });

  test('MUSCLE_STANDARDS is an alias for MUSCLE_GROUPS', () => {
    assert.equal(S.MUSCLE_STANDARDS, S.MUSCLE_GROUPS);
  });

  test('getCategoryForMuscle returns correct category', () => {
    assert.equal(S.getCategoryForMuscle('Lats'),   'Back');
    assert.equal(S.getCategoryForMuscle('Biceps'), 'Arms');
    assert.equal(S.getCategoryForMuscle('Quads'),  'Legs');
  });

  test('getCategoryForMuscle falls back to the muscle name when unknown', () => {
    assert.equal(S.getCategoryForMuscle('Unknown Muscle'), 'Unknown Muscle');
  });

  test('getPrimaryCategory returns Full Body for null / empty muscles', () => {
    assert.equal(S.getPrimaryCategory(null),          'Full Body');
    assert.equal(S.getPrimaryCategory({ muscles: [] }), 'Full Body');
  });

  test('getPrimaryCategory returns category of first muscle', () => {
    assert.equal(S.getPrimaryCategory({ muscles: ['Lats', 'Biceps'] }), 'Back');
  });

});

// ── convertWeight ─────────────────────────────────────────────────────────────

describe('convertWeight', () => {

  test('same unit returns same value', () => {
    assert.equal(S.convertWeight(100, 'kg',  'kg'),  100);
    assert.equal(S.convertWeight(100, 'lbs', 'lbs'), 100);
  });

  test('kg → lbs', () => {
    assert.ok(Math.abs(S.convertWeight(100, 'kg', 'lbs') - 220.462) < 0.01);
  });

  test('lbs → kg', () => {
    assert.ok(Math.abs(S.convertWeight(220.462, 'lbs', 'kg') - 100) < 0.01);
  });

  test('round trip kg → lbs → kg', () => {
    const result = S.convertWeight(S.convertWeight(85, 'kg', 'lbs'), 'lbs', 'kg');
    assert.ok(Math.abs(result - 85) < 0.001);
  });

});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {

  test('returns empty string for falsy input', () => {
    assert.equal(S.formatDate(''),        '');
    assert.equal(S.formatDate(null),      '');
    assert.equal(S.formatDate(undefined), '');
  });

  test('formats a known date (2024-01-15, en-GB)', () => {
    const result = S.formatDate('2024-01-15');
    assert.ok(result.includes('15'),   `missing day: ${result}`);
    assert.ok(result.includes('Jan'),  `missing month: ${result}`);
    assert.ok(result.includes('2024'), `missing year: ${result}`);
  });

});

// ── formatSets / fmtSets ─────────────────────────────────────────────────────

describe('formatSets', () => {

  test('returns count unchanged below 1000', () => {
    assert.equal(S.formatSets(0),   0);
    assert.equal(S.formatSets(1),   1);
    assert.equal(S.formatSets(999), 999);
  });

  test('formats 1000+ as Nk with one decimal', () => {
    assert.equal(S.formatSets(1000), '1.0k');
    assert.equal(S.formatSets(1500), '1.5k');
    assert.equal(S.formatSets(2345), '2.3k');
  });

  test('fmtSets is an alias for formatSets', () => {
    assert.equal(S.fmtSets, S.formatSets);
  });

});

// ── countSets ─────────────────────────────────────────────────────────────────

describe('countSets', () => {

  test('returns 0 for empty entries', () => {
    assert.equal(S.countSets([], S.DEFAULT_EXERCISES), 0);
  });

  test('counts only sets with weight or reps', () => {
    const entries = [
      makeEntry('e1', [
        makeSet('100', '8'),  // counted
        makeSet('', ''),      // blank — not counted
        makeSet('', '5'),     // has reps — counted
        makeSet('60', ''),    // has weight — counted
      ]),
    ];
    assert.equal(S.countSets(entries, S.DEFAULT_EXERCISES), 3);
  });

  test('sums across multiple entries', () => {
    const entries = [
      makeEntry('e1', [makeSet(), makeSet()]),
      makeEntry('e9', [makeSet()]),
    ];
    assert.equal(S.countSets(entries, S.DEFAULT_EXERCISES), 3);
  });

});

describe('countSetsWorkouts', () => {

  test('returns 0 for empty workouts', () => {
    assert.equal(S.countSetsWorkouts([], S.DEFAULT_EXERCISES), 0);
  });

  test('sums sets across multiple workouts', () => {
    const workouts = [
      makeWorkout('1', '2024-01-01', [makeEntry('e1', [makeSet(), makeSet()])]),
      makeWorkout('2', '2024-01-02', [makeEntry('e9', [makeSet()])]),
    ];
    assert.equal(S.countSetsWorkouts(workouts, S.DEFAULT_EXERCISES), 3);
  });

});

// ── getLastSets ───────────────────────────────────────────────────────────────

describe('getLastSets', () => {

  test('returns null for empty workouts', () => {
    assert.equal(S.getLastSets([], 'e9'), null);
  });

  test('returns null when exercise not present in any workout', () => {
    const workouts = [makeWorkout('1', '2024-01-01', [makeEntry('e1', [makeSet()])])];
    assert.equal(S.getLastSets(workouts, 'e9'), null);
  });

  test('returns sets from the most recent workout', () => {
    const oldSets = [makeSet('85', '8')];
    const newSets = [makeSet('90', '6')];
    const workouts = [
      makeWorkout('1', '2024-01-01', [makeEntry('e9', oldSets)]),
      makeWorkout('2', '2024-01-10', [makeEntry('e9', newSets)]),
    ];
    assert.deepEqual(S.getLastSets(workouts, 'e9'), newSets);
  });

  test('not fooled by array order — always picks latest date', () => {
    const oldSets = [makeSet('85', '8')];
    const newSets = [makeSet('90', '6')];
    // newer workout listed first
    const workouts = [
      makeWorkout('2', '2024-01-10', [makeEntry('e9', newSets)]),
      makeWorkout('1', '2024-01-01', [makeEntry('e9', oldSets)]),
    ];
    assert.deepEqual(S.getLastSets(workouts, 'e9'), newSets);
  });

  test('skips entries where all sets have no weight or reps', () => {
    const blankSets = [makeSet('', '')];
    const realSets  = [makeSet('85', '8')];
    const workouts = [
      makeWorkout('2', '2024-01-10', [makeEntry('e9', blankSets)]),  // newer but blank
      makeWorkout('1', '2024-01-01', [makeEntry('e9', realSets)]),
    ];
    assert.deepEqual(S.getLastSets(workouts, 'e9'), realSets);
  });

  test('tiebreaks same-date workouts by numeric id — higher id wins', () => {
    const morningSets = [makeSet('80', '8')];
    const eveningSets = [makeSet('85', '8')];
    const workouts = [
      makeWorkout('1000', '2024-01-10', [makeEntry('e9', morningSets)]),
      makeWorkout('9000', '2024-01-10', [makeEntry('e9', eveningSets)]),
    ];
    assert.deepEqual(S.getLastSets(workouts, 'e9'), eveningSets);
  });

  test('does not mutate the input workouts array', () => {
    const workouts = [
      makeWorkout('1', '2024-01-01', [makeEntry('e9', [makeSet()])]),
      makeWorkout('2', '2024-01-10', [makeEntry('e9', [makeSet()])]),
    ];
    const original = [...workouts];
    S.getLastSets(workouts, 'e9');
    assert.deepEqual(workouts, original);
  });

});

// ── estimate1RM ───────────────────────────────────────────────────────────────

describe('estimate1RM', () => {

  test('returns 0 for missing or zero inputs', () => {
    assert.equal(S.estimate1RM(0,    8), 0);
    assert.equal(S.estimate1RM(100,  0), 0);
    assert.equal(S.estimate1RM(null, 8), 0);
    assert.equal(S.estimate1RM(100, -1), 0);
  });

  test('returns weight directly for 1 rep', () => {
    assert.equal(S.estimate1RM(100, 1), 100);
  });

  test('Brzycki formula: 100kg × 8 reps ≈ 124.14', () => {
    // 100 * (36 / (37 - 8)) = 100 * 36/29 ≈ 124.14
    assert.ok(Math.abs(S.estimate1RM(100, 8) - 124.14) < 0.1);
  });

  test('higher reps → higher estimated 1RM for same weight', () => {
    assert.ok(S.estimate1RM(100, 10) > S.estimate1RM(100, 5));
  });

  test('higher weight → higher estimated 1RM for same reps', () => {
    assert.ok(S.estimate1RM(120, 8) > S.estimate1RM(100, 8));
  });

});

// ── getBestByMuscles ──────────────────────────────────────────────────────────

describe('getBestByMuscles', () => {

  test('returns 0 for empty workouts', () => {
    assert.equal(S.getBestByMuscles([], S.DEFAULT_EXERCISES, ['Lats']), 0);
  });

  test('returns 0 when no matching exercise exists', () => {
    // e1 = Bench Press (Chest), not matching Lats
    const workouts = [makeWorkout('1', '2024-01-01', [
      makeEntry('e1', [makeSet('100', '8')]),
    ])];
    assert.equal(S.getBestByMuscles(workouts, S.DEFAULT_EXERCISES, ['Lats']), 0);
  });

  test('finds best e1RM for a matching exercise', () => {
    // e9 = Lat Pulldown — muscles include Lats
    const workouts = [makeWorkout('1', '2024-01-01', [
      makeEntry('e9', [makeSet('80', '8'), makeSet('90', '5')]),
    ])];
    const result = S.getBestByMuscles(workouts, S.DEFAULT_EXERCISES, ['Lats']);
    // 90kg × 5 reps → e1RM = 90 * (36/32) = 101.25 → rounds to 101
    assert.equal(result, Math.round(S.estimate1RM(90, 5)));
  });

  test('skips sets with no weight or reps', () => {
    const workouts = [makeWorkout('1', '2024-01-01', [
      makeEntry('e9', [makeSet('', ''), makeSet('', '8')]),
    ])];
    assert.equal(S.getBestByMuscles(workouts, S.DEFAULT_EXERCISES, ['Lats']), 0);
  });

  test('picks the highest e1RM across multiple workouts', () => {
    const workouts = [
      makeWorkout('1', '2024-01-01', [makeEntry('e9', [makeSet('80', '8')])]),
      makeWorkout('2', '2024-01-10', [makeEntry('e9', [makeSet('90', '5')])]),
    ];
    const result = S.getBestByMuscles(workouts, S.DEFAULT_EXERCISES, ['Lats']);
    assert.equal(result, Math.round(S.estimate1RM(90, 5)));
  });

});

// ── workoutToTemplate ─────────────────────────────────────────────────────────

describe('workoutToTemplate', () => {

  const workout = {
    ...makeWorkout('w1', '2024-01-01', [
      makeEntry('e9', [makeSet('80', '8', { rir: '2', side: 'B' })]),
      makeEntry('e1', [makeSet('100', '5', { rir: '1', side: 'B' })]),
    ]),
    name: 'Push Day',
    unit: 'kg',
  };

  test('output has tpl_ id prefix', () => {
    assert.ok(S.workoutToTemplate(workout, 'T').id.startsWith('tpl_'));
  });

  test('uses provided name', () => {
    assert.equal(S.workoutToTemplate(workout, 'My Template').name, 'My Template');
  });

  test('falls back to workout name when no name provided', () => {
    assert.equal(S.workoutToTemplate(workout).name, 'Push Day');
  });

  test('records createdFrom as workout id', () => {
    assert.equal(S.workoutToTemplate(workout, 'T').createdFrom, 'w1');
  });

  test('preserves weight on sets', () => {
    assert.equal(S.workoutToTemplate(workout, 'T').entries[0].sets[0].weight, '80');
  });

  test('clears reps on sets', () => {
    assert.equal(S.workoutToTemplate(workout, 'T').entries[0].sets[0].reps, '');
  });

  test('clears rir on sets', () => {
    assert.equal(S.workoutToTemplate(workout, 'T').entries[0].sets[0].rir, '');
  });

  test('preserves side on sets', () => {
    assert.equal(S.workoutToTemplate(workout, 'T').entries[0].sets[0].side, 'B');
  });

  test('preserves all entries', () => {
    assert.equal(S.workoutToTemplate(workout, 'T').entries.length, 2);
  });

  test('does not mutate original workout', () => {
    const original = JSON.parse(JSON.stringify(workout));
    S.workoutToTemplate(workout, 'T');
    assert.deepEqual(workout, original);
  });

});

// ── templateToWorkout ─────────────────────────────────────────────────────────

describe('templateToWorkout', () => {

  const template = {
    id:      'tpl_123',
    name:    'Pull Day',
    unit:    'kg',
    entries: [
      makeEntry('e9', [makeSet('80', '8', { rir: '2', side: 'L' })]),
      makeEntry('e7', [makeSet('60', '10')]),
    ],
  };

  test('generates a new id — not the template id', () => {
    assert.notEqual(S.templateToWorkout(template, 'kg').id, template.id);
  });

  test('uses template name', () => {
    assert.equal(S.templateToWorkout(template, 'kg').name, 'Pull Day');
  });

  test('clears weight on all sets', () => {
    for (const entry of S.templateToWorkout(template, 'kg').entries)
      for (const set of entry.sets)
        assert.equal(set.weight, '');
  });

  test('clears reps on all sets', () => {
    for (const entry of S.templateToWorkout(template, 'kg').entries)
      for (const set of entry.sets)
        assert.equal(set.reps, '');
  });

  test('clears rir on all sets', () => {
    for (const entry of S.templateToWorkout(template, 'kg').entries)
      for (const set of entry.sets)
        assert.equal(set.rir, '');
  });

  test('preserves side on sets', () => {
    assert.equal(S.templateToWorkout(template, 'kg').entries[0].sets[0].side, 'L');
  });

  test('preserves exerciseId on entries', () => {
    const w = S.templateToWorkout(template, 'kg');
    assert.equal(w.entries[0].exerciseId, 'e9');
    assert.equal(w.entries[1].exerciseId, 'e7');
  });

  test('sets _key on each entry', () => {
    for (const entry of S.templateToWorkout(template, 'kg').entries)
      assert.ok(entry._key, `missing _key on ${entry.exerciseId}`);
  });

  test('uses preferredUnit when template has no unit', () => {
    assert.equal(S.templateToWorkout({ ...template, unit: undefined, entries: [] }, 'lbs').unit, 'lbs');
  });

  test('falls back to kg when no unit anywhere', () => {
    assert.equal(S.templateToWorkout({ ...template, unit: undefined, entries: [] }, undefined).unit, 'kg');
  });

  test('handles template with no entries', () => {
    assert.equal(S.templateToWorkout({ ...template, entries: undefined }, 'kg').entries.length, 0);
  });

  test('does not mutate original template', () => {
    const original = JSON.parse(JSON.stringify(template));
    S.templateToWorkout(template, 'kg');
    assert.deepEqual(template, original);
  });

  test('round trip: workoutToTemplate → templateToWorkout preserves exerciseIds', () => {
    const workout = makeWorkout('w1', '2024-01-01', [
      makeEntry('e9', [makeSet('80', '8')]),
      makeEntry('e1', [makeSet('100', '5')]),
    ]);
    const tpl = S.workoutToTemplate(workout, 'T');
    const w2  = S.templateToWorkout(tpl, 'kg');
    assert.equal(w2.entries.length, workout.entries.length);
    assert.equal(w2.entries[0].exerciseId, workout.entries[0].exerciseId);
    assert.equal(w2.entries[1].exerciseId, workout.entries[1].exerciseId);
  });

});

// ── fmtDuration ───────────────────────────────────────────────────────────────

describe('fmtDuration', () => {

  test('returns null for null / undefined', () => {
    assert.equal(S.fmtDuration(null),      null);
    assert.equal(S.fmtDuration(undefined), null);
  });

  test('0:00 for 0 seconds', () => {
    assert.equal(S.fmtDuration(0), '0:00');
  });

  test('sub-minute', () => {
    assert.equal(S.fmtDuration(45), '0:45');
  });

  test('minutes and seconds', () => {
    assert.equal(S.fmtDuration(90),   '1:30');
    assert.equal(S.fmtDuration(3599), '59:59');
  });

  test('pads seconds to two digits', () => {
    assert.equal(S.fmtDuration(61), '1:01');
  });

  test('hours', () => {
    assert.equal(S.fmtDuration(3600), '1:00:00');
    assert.equal(S.fmtDuration(3661), '1:01:01');
    assert.equal(S.fmtDuration(7384), '2:03:04');
  });

  test('caps at 3:00:00 beyond MAX_WORKOUT_SECS', () => {
    assert.equal(S.fmtDuration(S.MAX_WORKOUT_SECS + 1), '3:00:00');
    assert.equal(S.fmtDuration(99999),                  '3:00:00');
  });

});

// ── fmtDurationShort ──────────────────────────────────────────────────────────

describe('fmtDurationShort', () => {

  test('returns null for null / undefined', () => {
    assert.equal(S.fmtDurationShort(null),      null);
    assert.equal(S.fmtDurationShort(undefined), null);
  });

  test('0m for 0 seconds', () => {
    assert.equal(S.fmtDurationShort(0), '0m');
  });

  test('sub-hour as minutes only', () => {
    assert.equal(S.fmtDurationShort(600),  '10m');
    assert.equal(S.fmtDurationShort(2700), '45m');
  });

  test('whole hours with no minutes', () => {
    assert.equal(S.fmtDurationShort(3600), '1h');
    assert.equal(S.fmtDurationShort(7200), '2h');
  });

  test('hours and minutes together', () => {
    assert.equal(S.fmtDurationShort(5400), '1h 30m');
    assert.equal(S.fmtDurationShort(4980), '1h 23m');
  });

  test('caps at 3h+ beyond MAX_WORKOUT_SECS', () => {
    assert.equal(S.fmtDurationShort(S.MAX_WORKOUT_SECS + 1), '3h+');
    assert.equal(S.fmtDurationShort(99999),                  '3h+');
  });

  test('ignores leftover seconds — rounds down to minutes', () => {
    assert.equal(S.fmtDurationShort(3659), '1h');   // 1h 0m 59s → '1h'
    assert.equal(S.fmtDurationShort(659),  '10m');  // 10m 59s   → '10m'
  });

});
