// ── QuickLog ──────────────────────────────────────────────────────────────────
// Persistent workout session overlay — lives above the nav, accessible from
// any tab. Rendered by app.js as a fixed bottom sheet that expands full screen.

function QuickLog({ exercises, workouts, onSave, onCancel, onCreateExercise, preferredUnit, initialTemplate }) {
  const pu = preferredUnit || "kg";

  function makeBlank() {
    return { id: Date.now().toString(), date: today(), name: "Quick Workout", entries: [], notes: "", unit: pu };
  }

  const [workout,        setWorkout]        = React.useState(() => {
    const draft = loadDraft();
    if (draft?.workout) return draft.workout;
    if (initialTemplate) return templateToWorkout(initialTemplate, pu);
    return makeBlank();
  });
  const [showPicker,     setShowPicker]     = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const [expanded,       setExpanded]       = React.useState(true);

  const { ref: scrollRef, hidden: headerHidden } = useScrollHide();
  const headerRef = React.useRef(null);
  const [headerH, setHeaderH] = React.useState(0);

  React.useEffect(() => { saveDraft(workout); }, [workout]);

  React.useEffect(() => {
    const el = headerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight || 0));
    ro.observe(el); setHeaderH(el.offsetHeight || 0);
    return () => ro.disconnect();
  }, []);

  function addExercise(ex) {
    const wu = workout.unit || pu;
    setWorkout(p => ({ ...p, entries: [...p.entries, { _key: `${ex.id}_${Date.now()}`, exerciseId: ex.id, sets: [{ weight: "", reps: "", rir: "", side: "B", unit: wu }], note: "", unit: wu }] }));
    setShowPicker(false);
  }
  function updateEntry(i, e) { setWorkout(p => ({ ...p, entries: p.entries.map((x, j) => j === i ? e : x) })); }
  function removeEntry(i)    { setWorkout(p => ({ ...p, entries: p.entries.filter((_, j) => j !== i) })); }
  function moveEntry(i, dir) { setWorkout(p => { const a = [...p.entries]; const t = a[i]; a[i] = a[i + dir]; a[i + dir] = t; return { ...p, entries: a }; }); }

  const workoutUnit = workout.unit || pu;
  function setWorkoutUnit(unit) {
    setWorkout(p => ({ ...p, unit, entries: (p.entries || []).map(e => e.unit === workoutUnit ? { ...e, unit, sets: e.sets.map(s => s.unit === workoutUnit ? { ...s, unit } : s) } : e) }));
  }

  function finish() {
    if (!workout.entries.length) { setConfirmDiscard(true); return; }
    clearDraft(); onSave(workout);
  }
  function discard() { clearDraft(); onCancel(); }

  const totalSets = workout.entries
    .flatMap(e => e.sets.filter(s => s.weight || s.reps))
    .reduce((sum, s) => sum + (s.side === "L" || s.side === "R" ? 0.5 : 1), 0);

  // ── Collapsed pill — shown when user navigates away ───────────────────────
  if (!expanded) {
    return React.createElement('button', {
      onClick: () => setExpanded(true),
      style: { position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "var(--grad)", border: "none", borderRadius: 99, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 390, width: "calc(100% - 32px)" }
    },
      React.createElement(Icon, { name: "play", size: 16, color: "#fff" }),
      React.createElement('span', { style: { flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left" } }, workout.name),
      React.createElement('span', { style: { fontSize: 12, color: "rgba(255,255,255,0.7)" } }, fmtSets(totalSets), " sets")
    );
  }

  // ── Expanded full-screen workout session ──────────────────────────────────
  return React.createElement('div', { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", zIndex: 20, background: "var(--bg)", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" } },
    // Sticky header
    React.createElement('div', { ref: headerRef, style: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, transform: headerHidden ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.25s ease", background: "var(--bg)" } },
      React.createElement('div', { style: { padding: "14px 16px", borderBottom: "1px solid var(--border)" } },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } },
          // Minimise button — collapses to pill, keeps workout alive
          React.createElement('button', { onClick: () => setExpanded(false), style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted2)", padding: 4 } },
            React.createElement('svg', { width:20, height:20, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2.5", strokeLinecap:"round", strokeLinejoin:"round" },
              React.createElement('polyline', { points:"6 9 12 15 18 9" }))
          ),
          React.createElement('span', { style: { flex: 1, fontSize: 12, color: "var(--muted)", fontWeight: 600 } },
            workout.entries.length, " exercise", workout.entries.length !== 1 ? "s" : "", " · ", fmtSets(totalSets), " set", totalSets !== 1 ? "s" : "", " logged"
          ),
          React.createElement(UnitToggle, { unit: workoutUnit, onChange: setWorkoutUnit }),
          React.createElement(Btn, { variant: "green", onClick: finish, style: { padding: "8px 16px", fontSize: 13, borderRadius: 12 } },
            React.createElement(Icon, { name: "check", size: 15, color: "#fff" }), " Finish"
          )
        ),
        React.createElement('div', { style: { display: "flex", gap: 8 } },
          React.createElement('input', { value: workout.name || "", onChange: e => setWorkout(p => ({ ...p, name: e.target.value })), placeholder: "Workout name…", style: { flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "8px 12px", fontSize: 14, fontWeight: 700, outline: "none", fontFamily: "inherit" } }),
          React.createElement(DateInput, { value: workout.date || today(), onChange: d => setWorkout(p => ({ ...p, date: d })), style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--subtle)", padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "inherit", width: 120 } })
        )
      )
    ),

    // Scrollable exercise list
    React.createElement('div', { ref: scrollRef, style: { flex: 1, overflowY: "auto", paddingTop: headerH, paddingLeft: 14, paddingRight: 16, paddingBottom: 120, display: "flex", flexDirection: "column", gap: 12 } },
      !workout.entries.length && React.createElement('div', { style: { textAlign: "center", padding: "50px 20px", color: "var(--border2)", fontSize: 14 } }, "No exercises yet — tap below to add one"),
      (workout.entries || []).map((entry, i) => React.createElement(WECard, { key: entry._key || i, entry, exercises, workouts, onChange: e => updateEntry(i, e), onRemove: () => removeEntry(i), onMoveUp: () => moveEntry(i, -1), onMoveDown: () => moveEntry(i, 1), isFirst: i === 0, isLast: i === (workout.entries.length - 1) })),
      React.createElement('button', { onClick: () => setShowPicker(true), style: { width: "100%", padding: "14px", background: "var(--surface)", border: "2px dashed var(--border2)", borderRadius: 16, cursor: "pointer", color: "var(--accent)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
        React.createElement(Icon, { name: "plus", size: 18, color: "var(--accent)" }), " Add Exercise"
      )
    ),

    // Discard confirmation sheet
    confirmDiscard && React.createElement('div', { style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", zIndex: 50 } },
      React.createElement('div', { style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px 20px 0 0", width: "100%", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement('div', { style: { fontSize: 17, fontWeight: 800, color: "var(--text)" } }, "Discard workout?"),
        React.createElement('div', { style: { fontSize: 14, color: "var(--muted2)" } }, "All sets logged in this session will be lost."),
        React.createElement('div', { style: { display: "flex", gap: 10 } },
          React.createElement(Btn, { variant: "secondary", onClick: () => setConfirmDiscard(false), style: { flex: 1, justifyContent: "center" } }, "Keep going"),
          React.createElement('button', { onClick: discard, style: { flex: 1, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px", cursor: "pointer", color: "#f87171", fontSize: 14, fontWeight: 700, fontFamily: "inherit" } }, "Discard")
        )
      )
    ),
    showPicker && React.createElement(Picker, { exercises, onPick: addExercise, onClose: () => setShowPicker(false), onCreateExercise })
  );
}
