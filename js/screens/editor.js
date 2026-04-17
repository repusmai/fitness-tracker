// ── Editor Screen ─────────────────────────────────────────────────────────────
// Full workout editor — used for both creating new workouts and editing existing ones.

function Editor({ workout, exercises, workouts, onSave, onCancel, preferredUnit }) {
  const [w, setW] = React.useState(() => {
    const base = workout || { id: Date.now().toString(), date: today(), name: "", entries: [], notes: "", unit: preferredUnit || "kg" };
    return { ...base, unit: base.unit || preferredUnit || "kg", entries: base.entries.map((e, i) => ({ _key: e._key || `${e.exerciseId}_${i}_init`, ...e, unit: e.unit || base.unit || "kg" })) };
  });
  const [showPicker, setShowPicker] = React.useState(false);
  const workoutUnit = w.unit || "kg";

  function setWorkoutUnit(unit) {
    setW(prev => ({
      ...prev, unit,
      entries: prev.entries.map(e => e.unit === workoutUnit
        ? { ...e, unit, sets: e.sets.map(s => s.unit === workoutUnit ? { ...s, unit } : s) }
        : e)
    }));
  }

  const addExercise = ex => {
    setW(prev => ({ ...prev, entries: [...prev.entries, { _key: `${ex.id}_${Date.now()}`, exerciseId: ex.id, sets: [{ weight: "", reps: "", rir: "", side: "B", unit: workoutUnit }], note: "", unit: workoutUnit }] }));
    setShowPicker(false);
  };
  const updateEntry = (i, e) => setW(prev => ({ ...prev, entries: prev.entries.map((x, j) => j === i ? e : x) }));
  const removeEntry = i => setW(prev => ({ ...prev, entries: prev.entries.filter((_, j) => j !== i) }));
  const moveEntry   = (i, dir) => setW(prev => { const a = [...prev.entries]; const t = a[i]; a[i] = a[i + dir]; a[i + dir] = t; return { ...prev, entries: a }; });

  const allMuscles = [...new Set(w.entries.flatMap(entry => { const ex = exercises.find(x => x.id === entry.exerciseId); return ex?.muscles || []; }))];
  const isValid    = w.name.trim() && w.entries.length > 0;

  const { ref: scrollRef, hidden: headerHidden } = useScrollHide();
  const headerRef = React.useRef(null);
  const [headerH, setHeaderH] = React.useState(0);
  React.useEffect(() => {
    const el = headerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight || 0));
    ro.observe(el);
    setHeaderH(el.offsetHeight || 0);
    return () => ro.disconnect();
  }, []);

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)", position: "relative" } },
    // Sticky header
    React.createElement('div', { ref: headerRef, style: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, transform: headerHidden ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.25s ease", willChange: "transform", background: "var(--bg)" } },
      React.createElement('div', { style: { padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 } },
        React.createElement('button', { onClick: onCancel, style: { background: "none", border: "none", cursor: "pointer", color: "var(--subtle)", padding: 4 } }, React.createElement(Icon, { name: "back", size: 22 })),
        React.createElement('span', { style: { fontWeight: 800, fontSize: 18, color: "var(--text)", flex: 1 } }, workout ? "Edit Workout" : "New Workout"),
        React.createElement(UnitToggle, { unit: workoutUnit, onChange: setWorkoutUnit }),
        React.createElement(Btn, { variant: isValid ? "primary" : "secondary", onClick: () => isValid && onSave(w), style: { opacity: isValid ? 1 : 0.4, padding: "8px 16px", fontSize: 13 } },
          React.createElement(Icon, { name: "check", size: 15 }), " Save")
      )
    ),

    // Scrollable content
    React.createElement('div', { ref: scrollRef, style: { overflowY: "auto", flex: 1, paddingTop: headerHidden ? 0 : headerH, transition: "padding-top 0.25s ease", paddingLeft: 16, paddingRight: 16, paddingBottom: 100, display: "flex", flexDirection: "column", gap: 14 } },
      React.createElement(Inp, { label: "Workout Name", placeholder: "e.g. Push Day, Leg Day...", value: w.name, onChange: e => setW(p => ({ ...p, name: e.target.value })) }),
      React.createElement(DateInput, { value: w.date, onChange: d => setW(p => ({ ...p, date: d })), style: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)", padding: "10px 12px", fontSize: 14, outline: "none", width: "100%", fontFamily: "inherit" } }),
      allMuscles.length > 0 && React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--subtle)", marginBottom: 6 } }, "Muscles Trained"),
        React.createElement(MusclePills, { muscles: allMuscles })
      ),
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--subtle)", marginBottom: 8 } }, "Exercises (", w.entries.length, ")"),
        React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 10 } },
          w.entries.map((entry, i) => React.createElement(WECard, { key: entry._key || i, entry, exercises, workouts, onChange: e => updateEntry(i, e), onRemove: () => removeEntry(i), onMoveUp: () => moveEntry(i, -1), onMoveDown: () => moveEntry(i, 1), isFirst: i === 0, isLast: i === w.entries.length - 1 }))
        ),
        React.createElement('button', {
          onClick: () => setShowPicker(true),
          style: { marginTop: w.entries.length ? 10 : 0, width: "100%", padding: "14px", background: "var(--surface)", border: "2px dashed #334155", borderRadius: 16, cursor: "pointer", color: "var(--accent)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }
        }, React.createElement(Icon, { name: "plus", size: 18, color: "var(--accent)" }), " Add Exercise")
      ),
      React.createElement(TA, { label: "Workout Notes", placeholder: "General notes about this session...", value: w.notes, onChange: e => setW(p => ({ ...p, notes: e.target.value })) })
    ),
    showPicker && React.createElement(Picker, { exercises, onPick: addExercise, onClose: () => setShowPicker(false) })
  );
}
