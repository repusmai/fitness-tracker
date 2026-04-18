// ── Exercise Picker ───────────────────────────────────────────────────────────
// Bottom-sheet modal for searching and selecting an exercise.
// Also supports inline creation of a new custom exercise.

function Picker({ exercises, onPick, onClose, onCreateExercise }) {
  const [query,        setQuery]        = React.useState("");
  const [selectedCat,  setSelectedCat]  = React.useState("All");
  const [selectedMuscle, setSelectedMuscle] = React.useState(null);
  const [creating,     setCreating]     = React.useState(false);
  const [newName,      setNewName]      = React.useState("");
  const [newPrimary,   setNewPrimary]   = React.useState([]);
  const [newSecondary, setNewSecondary] = React.useState([]);

  const catMuscles = selectedCat === "All" ? null : MUSCLE_CATEGORIES.find(c => c.category === selectedCat)?.muscles;

  const filtered = exercises.filter(e => {
    if (!e.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (selectedMuscle) return e.muscles?.includes(selectedMuscle);
    if (selectedCat !== "All") return e.muscles?.some(m => catMuscles?.includes(m));
    return true;
  });

  const grouped = {};
  filtered.forEach(ex => {
    const cat = getPrimaryCategory(ex);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ex);
  });

  function handleCreate() {
    if (!newName.trim() || !newPrimary.length) return;
    const ex = { id: "c" + Date.now(), name: newName.trim(), muscles: [...newPrimary, ...newSecondary], primaryMuscles: newPrimary, secondaryMuscles: newSecondary };
    onCreateExercise?.(ex);
    onPick(ex);
  }

  const kbHeight = useKeyboardHeight();

  return React.createElement('div', { style: { position: "fixed", inset: 0, bottom: kbHeight, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", transition: "bottom 0.15s ease" } },
    React.createElement('div', {
      style: { background: "var(--surface)", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "92%", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid var(--border)" }
    },
      // Header
      React.createElement('div', { style: { padding: "20px 16px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 } },
        React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
          React.createElement('span', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)" } }, creating ? "New Exercise" : "Add Exercise"),
          React.createElement('div', { style: { display: "flex", gap: 8 } },
            onCreateExercise && !creating && React.createElement('button', {
              onClick: () => setCreating(true),
              style: { background: "var(--grad)", border: "none", borderRadius: 8, padding: "6px 11px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }
            }, React.createElement(Icon, { name: "plus", size: 13, color: "#fff" }), " New"),
            React.createElement('button', {
              onClick: creating ? () => { setCreating(false); setNewName(""); setNewPrimary([]); setNewSecondary([]); } : onClose,
              style: { background: "var(--surface2)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--subtle)" }
            }, React.createElement(Icon, { name: creating ? "back" : "close", size: 18 }))
          )
        ),
        !creating && React.createElement(React.Fragment, null,
          // Search box
          React.createElement('div', { style: { position: "relative", marginBottom: 10 } },
            React.createElement('input', {
              value: query, onChange: e => setQuery(e.target.value), placeholder: "Search exercises...",
              style: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)", padding: "9px 12px 9px 34px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" }
            }),
            React.createElement('div', { style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" } },
              React.createElement(Icon, { name: "search", size: 16, color: "var(--subtle)" }))
          ),
          // Category filters
          React.createElement('div', { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 } },
            ["All", ...MUSCLE_CATEGORIES.map(c => c.category)].map(cat => React.createElement('button', {
              key: cat,
              onClick: () => { setSelectedCat(cat); setSelectedMuscle(null); },
              style: { flexShrink: 0, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: selectedCat === cat ? (getColorForCategory(cat) || "var(--accent)") : "var(--surface2)", color: selectedCat === cat ? "#fff" : "var(--subtle)" }
            }, cat))
          ),
          // Muscle sub-filters
          selectedCat !== "All" && catMuscles && React.createElement('div', { style: { display: "flex", gap: 6, overflowX: "auto", paddingTop: 6 } },
            React.createElement('button', {
              onClick: () => setSelectedMuscle(null),
              style: { flexShrink: 0, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1px solid var(--border2)", cursor: "pointer", fontFamily: "inherit", background: !selectedMuscle ? "var(--border2)" : "transparent", color: !selectedMuscle ? "var(--text)" : "var(--muted2)" }
            }, "All muscles"),
            catMuscles.map(m => React.createElement('button', {
              key: m, onClick: () => setSelectedMuscle(selectedMuscle === m ? null : m),
              style: { flexShrink: 0, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: selectedMuscle === m ? getColorForMuscle(m) : `${getColorForMuscle(m)}22`, color: selectedMuscle === m ? "#fff" : getColorForMuscle(m) }
            }, m))
          )
        )
      ),

      // Create form
      creating && React.createElement('div', { style: { overflowY: "auto", overflowX: "hidden", flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 14, WebkitOverflowScrolling: "touch" } },
        React.createElement(Inp, { label: "Exercise Name", value: newName, onChange: e => setNewName(e.target.value), placeholder: "e.g. Sissy Squat", style: { fontSize: 15 } }),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--subtle)", marginBottom: 8 } }, "Muscles ", React.createElement('span', { style: { color: "var(--muted)", fontWeight: 500, textTransform: "none", fontSize: 11 } }, "(at least one primary)")),
          React.createElement(MuscleSelector, { primary: newPrimary, secondary: newSecondary, onChange: (p, s) => { setNewPrimary(p); setNewSecondary(s); } })
        ),
        newPrimary.length > 0 && React.createElement('div', null, React.createElement('div', { style: { fontSize: 10, color: "var(--muted2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 } }, "Primary"), React.createElement(MusclePills, { muscles: newPrimary })),
        newSecondary.length > 0 && React.createElement('div', null, React.createElement('div', { style: { fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 } }, "Secondary"), React.createElement(MusclePills, { muscles: newSecondary })),
        React.createElement(Btn, {
          variant: "primary", onClick: handleCreate,
          style: { justifyContent: "center", opacity: newName.trim() && newPrimary.length ? 1 : 0.4 },
          disabled: !newName.trim() || !newPrimary.length,
        }, React.createElement(Icon, { name: "plus", size: 15, color: "#fff" }), " Create & Add to Workout")
      ),

      // Exercise list
      !creating && React.createElement('div', { style: { overflowY: "auto", overflowX: "hidden", flex: 1, paddingBottom: 24, WebkitOverflowScrolling: "touch" } },
        Object.keys(grouped).length === 0 && React.createElement('div', { style: { color: "var(--muted2)", textAlign: "center", padding: 30, fontSize: 14 } },
          "No exercises found",
          onCreateExercise && React.createElement('div', { style: { marginTop: 10, fontSize: 13, color: "var(--muted)" } }, "Tap ", React.createElement('strong', { style: { color: "var(--accent)" } }, "+ New"), " to create one")
        ),
        Object.entries(grouped).map(([cat, exs]) => React.createElement('div', { key: cat },
          React.createElement('div', { style: { padding: "10px 16px 4px", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 } },
            React.createElement('div', { style: { width: 7, height: 7, borderRadius: "50%", background: getColorForCategory(cat) } }),
            React.createElement('span', { style: { fontSize: 11, fontWeight: 700, color: getColorForCategory(cat), textTransform: "uppercase", letterSpacing: "0.08em" } }, cat)
          ),
          exs.map(ex => React.createElement('button', {
            key: ex.id, onClick: () => onPick(ex),
            style: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)", textAlign: "left", fontFamily: "inherit" }
          },
            React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: `${getColorForMuscle(ex.muscles?.[0] || "")}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement(Icon, { name: "dumbbell", size: 17, color: getColorForMuscle(ex.muscles?.[0] || "") })
            ),
            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
              React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 3 } },
                React.createElement('span', { style: { fontWeight: 600, fontSize: 14, color: "var(--text)" } }, ex.name),
                ex.id.startsWith("c") && React.createElement('span', { style: { fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 6px", borderRadius: 6 } }, "custom")
              ),
              React.createElement(MusclePills, { muscles: ex.muscles || [], max: 3 })
            )
          ))
        ))
      )
    )
  );
}
