// ── WECard — Workout Entry Card ───────────────────────────────────────────────
// Represents a single exercise within an active workout editor session.

function WECard({ entry, exercises, workouts, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [showNote, setShowNote] = React.useState(!!entry.note);
  const exercise    = exercises.find(e => e.id === entry.exerciseId);
  const primaryColor = exercise?.muscles?.[0] ? getColorForMuscle(exercise.muscles[0]) : "var(--accent)";
  const entryUnit    = entry.unit || "kg";
  const lastSets     = workouts ? getLastSets(workouts, entry.exerciseId) : null;

  function setEntryUnit(unit) {
    onChange({ ...entry, unit, sets: entry.sets.map(s => s.unit === entryUnit ? { ...s, unit } : s) });
  }

  const addSet    = () => onChange({ ...entry, sets: [...entry.sets, { weight: "", reps: "", rir: "", side: "B", unit: entryUnit }] });
  const updateSet = (i, s) => onChange({ ...entry, sets: entry.sets.map((x, j) => j === i ? s : x) });
  const removeSet = i => onChange({ ...entry, sets: entry.sets.filter((_, j) => j !== i) });

  return React.createElement('div', { style: { background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" } },
    // Header
    React.createElement('div', {
      style: { padding: "12px 14px", borderLeft: `3px solid ${primaryColor}`, borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }
    },
      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" } },
          React.createElement('div', { style: { fontWeight: 700, fontSize: 15, color: "var(--text)" } }, exercise?.name || "Unknown"),
          React.createElement(UnitToggle, { unit: entryUnit, onChange: setEntryUnit, small: true })
        ),
        exercise && React.createElement('div', { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
          (exercise.primaryMuscles || [exercise.muscles?.[0]].filter(Boolean)).map(m =>
            React.createElement('span', { key: m, style: { padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${getColorForMuscle(m)}33`, color: getColorForMuscle(m) } }, m)
          ),
          (exercise.secondaryMuscles || exercise.muscles?.slice(1) || []).slice(0, 2).map(m =>
            React.createElement('span', { key: m, style: { padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "var(--surface2)", color: "var(--muted)" } }, m)
          )
        )
      ),

      // Controls (reorder + note + delete)
      React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 2, marginLeft: 8, flexShrink: 0 } },
        React.createElement('div', { style: { display: "flex", gap: 2, marginBottom: 2 } },
          React.createElement('button', {
            onClick: onMoveUp, disabled: isFirst,
            style: { background: "none", border: "none", borderRadius: 6, padding: "4px 5px", cursor: isFirst ? "default" : "pointer", color: isFirst ? "var(--surface2)" : "var(--muted)", lineHeight: 0 }
          }, React.createElement('svg', { width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round" }, React.createElement('polyline', { points:"18 15 12 9 6 15" }))),
          React.createElement('button', {
            onClick: onMoveDown, disabled: isLast,
            style: { background: "none", border: "none", borderRadius: 6, padding: "4px 5px", cursor: isLast ? "default" : "pointer", color: isLast ? "var(--surface2)" : "var(--muted)", lineHeight: 0 }
          }, React.createElement('svg', { width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round" }, React.createElement('polyline', { points:"6 9 12 15 18 9" })))
        ),
        React.createElement('div', { style: { display: "flex", gap: 2 } },
          React.createElement('button', {
            onClick: () => setShowNote(!showNote),
            style: { background: showNote ? "#1e3a5f" : "transparent", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: showNote ? "#60a5fa" : "var(--muted2)" }
          }, React.createElement(Icon, { name: "note", size: 16 })),
          React.createElement('button', {
            onClick: onRemove,
            style: { background: "transparent", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "var(--muted2)" }
          }, React.createElement(Icon, { name: "trash", size: 16 }))
        )
      )
    ),

    // Sets
    React.createElement('div', { style: { padding: "0 14px 14px" } },
      showNote && React.createElement('div', { style: { margin: "10px 0" } },
        React.createElement(TA, { placeholder: "Notes...", value: entry.note || "", onChange: e => onChange({ ...entry, note: e.target.value }), style: { minHeight: 54 } })
      ),

      // Column headers
      React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 8 } },
        React.createElement('span', { style: { width: 24, flexShrink: 0 } }),
        React.createElement('span', { style: { flex: 1, fontSize: 10, fontWeight: 700, color: "var(--muted2)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" } }, entryUnit),
        React.createElement('span', { style: { flex: 1, fontSize: 10, fontWeight: 700, color: "var(--muted2)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" } }, "Reps"),
        React.createElement('span', { style: { width: 56, flexShrink: 0, fontSize: 10, fontWeight: 700, color: "var(--muted2)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" } }, "RIR"),
        React.createElement('span', { style: { width: 28, flexShrink: 0 } }),
        React.createElement('span', { style: { width: 24, flexShrink: 0 } })
      ),

      React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 6 } },
        entry.sets.map((s, i) => React.createElement(SetRow, {
          key: i, set: s, index: i,
          onChange: updated => updateSet(i, updated),
          onRemove: () => removeSet(i),
          hint: lastSets?.[i] || lastSets?.[lastSets.length - 1],
        }))
      ),

      React.createElement('button', {
        onClick: addSet,
        style: { marginTop: 10, background: "var(--surface2)", border: "1px dashed var(--border2)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", color: "var(--accent)", fontSize: 13, fontWeight: 600, width: "100%", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }
      }, React.createElement(Icon, { name: "plus", size: 14, color: "var(--accent)" }), " Add Set")
    )
  );
}
