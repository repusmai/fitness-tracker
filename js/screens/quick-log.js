// ── QuickLog Screen ───────────────────────────────────────────────────────────
// Live workout logging mode — starts with a template/blank picker,
// then transitions to an active session editor. Drafts are auto-saved.

function QuickLog({ exercises, templates, workouts, onSave, onCancel, onCreateExercise, preferredUnit }) {
  const pu = preferredUnit || "kg";
  const [step,           setStep]           = React.useState(() => loadDraft()?.step || "pick");
  const [workout,        setWorkout]        = React.useState(() => loadDraft()?.workout || null);
  const [showPicker,     setShowPicker]     = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const { ref: scrollRef, hidden: headerHidden } = useScrollHide();

  React.useEffect(() => { if (step === "workout" && workout) saveDraft(workout, step); }, [workout, step]);

  function startBlank() {
    const w = { id: Date.now().toString(), date: today(), name: "Quick Workout", entries: [], notes: "", unit: pu };
    setWorkout(w); setStep("workout"); saveDraft(w, "workout");
  }
  function startFromTemplate(tpl) {
    const w = templateToWorkout(tpl, pu);
    setWorkout(w); setStep("workout"); saveDraft(w, "workout");
  }
  function addExercise(ex) {
    const wu = workout?.unit || pu;
    setWorkout(p => ({ ...p, entries: [...p.entries, { _key: `${ex.id}_${Date.now()}`, exerciseId: ex.id, sets: [{ weight: "", reps: "", rir: "", side: "B", unit: wu }], note: "", unit: wu }] }));
    setShowPicker(false);
  }
  function updateEntry(i, e) { setWorkout(p => ({ ...p, entries: p.entries.map((x, j) => j === i ? e : x) })); }
  function removeEntry(i)    { setWorkout(p => ({ ...p, entries: p.entries.filter((_, j) => j !== i) })); }
  function moveEntry(i, dir) { setWorkout(p => { const a = [...p.entries]; const t = a[i]; a[i] = a[i + dir]; a[i + dir] = t; return { ...p, entries: a }; }); }
  function finish()  { if (!workout.entries.length) { setConfirmDiscard(true); return; } clearDraft(); onSave(workout); }
  function discard() { clearDraft(); onCancel(); }

  const workoutUnit = workout?.unit || pu;
  function setWorkoutUnit(unit) {
    setWorkout(p => ({ ...p, unit, entries: (p.entries || []).map(e => e.unit === workoutUnit ? { ...e, unit, sets: e.sets.map(s => s.unit === workoutUnit ? { ...s, unit } : s) } : e) }));
  }

  const headerRef = React.useRef(null);
  const [headerH, setHeaderH] = React.useState(0);
  React.useEffect(() => {
    const el = headerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight || 0));
    ro.observe(el); setHeaderH(el.offsetHeight || 0);
    return () => ro.disconnect();
  }, []);

  // ── Step: Pick template or blank ──────────────────────────────────────────
  if (step === "pick") {
    return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" } },
      React.createElement('div', { style: { padding: "24px 16px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 } },
        React.createElement('button', { onClick: onCancel, style: { background: "none", border: "none", cursor: "pointer", color: "var(--subtle)", padding: 4 } }, React.createElement(Icon, { name: "close", size: 22 })),
        React.createElement('span', { style: { fontWeight: 800, fontSize: 18, color: "var(--text)", flex: 1 } }, "Start Workout")
      ),
      React.createElement('div', { style: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, WebkitOverflowScrolling: "touch" } },
        // Resume in-progress draft
        workout?.entries && React.createElement('button', {
          onClick: () => setStep("workout"),
          style: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 16, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%", display: "flex", alignItems: "center", gap: 12 }
        },
          React.createElement('div', { style: { width: 40, height: 40, borderRadius: 10, background: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "play", size: 18, color: "#22c55e" })),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: 14, fontWeight: 800, color: "#22c55e", marginBottom: 2 } }, `Resume "${workout.name}"`),
            React.createElement('div', { style: { fontSize: 12, color: "var(--muted)" } }, workout.entries.length, " exercise", workout.entries.length !== 1 ? "s" : "", " in progress"))
        ),
        // Start blank
        React.createElement('button', { onClick: startBlank, style: { background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))", border: "2px dashed rgba(99,102,241,0.4)", borderRadius: 18, padding: "22px 18px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 14, textAlign: "left", width: "100%" } },
          React.createElement('div', { style: { width: 44, height: 44, borderRadius: 12, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "plus", size: 22, color: "#fff" })),
          React.createElement('div', null, React.createElement('div', { style: { fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 3 } }, "Empty Workout"), React.createElement('div', { style: { fontSize: 13, color: "var(--muted2)" } }, "Start fresh, add exercises as you go"))
        ),
        // Templates
        templates.length > 0 && React.createElement(React.Fragment, null,
          React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 } }, "From a template"),
          templates.map(tpl => {
            const muscles = [...new Set(tpl.entries.flatMap(e => { const ex = exercises.find(x => x.id === e.exerciseId); return ex?.muscles || []; }))];
            return React.createElement('button', { key: tpl.id, onClick: () => startFromTemplate(tpl), style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%", display: "flex", alignItems: "center", gap: 12 } },
              React.createElement('div', { style: { width: 40, height: 40, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "template", size: 18, color: "var(--accent)" })),
              React.createElement('div', { style: { flex: 1, minWidth: 0 } }, React.createElement('div', { style: { fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 } }, tpl.name), React.createElement(MusclePills, { muscles, max: 4 })),
              React.createElement(Icon, { name: "chevron", size: 18, color: "var(--subtle)" })
            );
          })
        )
      )
    );
  }

  // ── Step: Active workout session ──────────────────────────────────────────
  const totalSets = workout ? workout.entries.map(e => ({ ...e, sets: e.sets.filter(s => s.weight || s.reps) })).reduce((sum, e) => {
    let t = 0; for (const s of e.sets) t += s.side === "L" || s.side === "R" ? 0.5 : 1; return sum + t;
  }, 0) : 0;

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)", position: "relative" } },
    // Sticky header
    React.createElement('div', { ref: headerRef, style: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, transform: headerHidden ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.25s ease", willChange: "transform", background: "var(--bg)" } },
      React.createElement('div', { style: { padding: "14px 16px", borderBottom: "1px solid var(--border)" } },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } },
          React.createElement('button', { onClick: () => setConfirmDiscard(true), style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted2)", padding: 4 } }, React.createElement(Icon, { name: "close", size: 20 })),
          React.createElement('span', { style: { flex: 1, fontSize: 12, color: "var(--muted)", fontWeight: 600 } },
            workout?.entries?.length || 0, " exercise", workout?.entries?.length !== 1 ? "s" : "", " · ", fmtSets(totalSets), " set", totalSets !== 1 ? "s" : "", " logged"),
          React.createElement(UnitToggle, { unit: workoutUnit, onChange: setWorkoutUnit }),
          React.createElement(Btn, { variant: "green", onClick: finish, style: { padding: "8px 16px", fontSize: 13, borderRadius: 12 } }, React.createElement(Icon, { name: "check", size: 15, color: "#fff" }), " Finish")
        ),
        React.createElement('div', { style: { display: "flex", gap: 8 } },
          React.createElement('input', { value: workout?.name || "", onChange: e => setWorkout(p => ({ ...p, name: e.target.value })), placeholder: "Workout name…", style: { flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "8px 12px", fontSize: 14, fontWeight: 700, outline: "none", fontFamily: "inherit" } }),
          React.createElement(DateInput, { value: workout?.date || today(), onChange: d => setWorkout(p => ({ ...p, date: d })), style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--subtle)", padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "inherit", width: 120 } })
        )
      )
    ),

    // Content
    React.createElement('div', { ref: scrollRef, style: { flex: 1, overflowY: "auto", paddingTop: headerHidden ? 0 : headerH, transition: "padding-top 0.25s ease", paddingLeft: 14, paddingRight: 16, paddingBottom: 120, display: "flex", flexDirection: "column", gap: 12 } },
      !workout?.entries?.length && React.createElement('div', { style: { textAlign: "center", padding: "50px 20px", color: "var(--border2)", fontSize: 14 } }, "No exercises yet — tap below to add one"),
      (workout?.entries || []).map((entry, i) => React.createElement(WECard, { key: entry._key || i, entry, exercises, workouts, onChange: e => updateEntry(i, e), onRemove: () => removeEntry(i), onMoveUp: () => moveEntry(i, -1), onMoveDown: () => moveEntry(i, 1), isFirst: i === 0, isLast: i === (workout.entries.length - 1) })),
      React.createElement('button', { onClick: () => setShowPicker(true), style: { width: "100%", padding: "14px", background: "var(--surface)", border: "2px dashed #1e293b", borderRadius: 16, cursor: "pointer", color: "var(--accent)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
        React.createElement(Icon, { name: "plus", size: 18, color: "var(--accent)" }), " Add Exercise")
    ),

    // Discard confirmation
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
