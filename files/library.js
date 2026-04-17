// ── Library Screen ────────────────────────────────────────────────────────────
// Browse, search, and manage the exercise library. Supports custom exercise creation.

function Library({ exercises, setExercises }) {
  const [selectedCat,    setSelectedCat]    = React.useState("All");
  const [selectedMuscle, setSelectedMuscle] = React.useState(null);
  const [query,          setQuery]          = React.useState("");
  const [adding,         setAdding]         = React.useState(false);
  const [editMode,       setEditMode]       = React.useState(false);
  const [newName,        setNewName]        = React.useState("");
  const [newPrimary,     setNewPrimary]     = React.useState([]);
  const [newSecondary,   setNewSecondary]   = React.useState([]);
  const [confirmDelete,  setConfirmDelete]  = React.useState(null);

  const catMuscles = selectedCat === "All" ? null : MUSCLE_CATEGORIES.find(c => c.category === selectedCat)?.muscles;
  const filtered = exercises.filter(e => {
    if (!e.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (selectedMuscle) return e.muscles?.includes(selectedMuscle);
    if (selectedCat !== "All") return e.muscles?.some(m => catMuscles?.includes(m));
    return true;
  });
  const grouped = {};
  filtered.forEach(ex => { const cat = getPrimaryCategory(ex); if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(ex); });

  const hiddenCount    = DEFAULT_EXERCISES.filter(d => !exercises.some(e => e.id === d.id)).length;
  const restoreDefaults = () => setExercises(prev => { const ids = new Set(prev.map(e => e.id)); return [...prev, ...DEFAULT_EXERCISES.filter(e => !ids.has(e.id))]; });

  const addCustom = () => {
    if (!newName.trim() || !newPrimary.length) return;
    setExercises(prev => [...prev, { id: "c" + Date.now(), name: newName.trim(), muscles: [...newPrimary, ...newSecondary], primaryMuscles: newPrimary, secondaryMuscles: newSecondary }]);
    setNewName(""); setNewPrimary([]); setNewSecondary([]); setAdding(false);
  };
  const deleteExercise = id => { setExercises(prev => prev.filter(e => e.id !== id)); setConfirmDelete(null); };

  const { ref: scrollRef, hidden: headerHidden } = useScrollHide();
  const headerRef = React.useRef(null);
  const [headerH, setHeaderH] = React.useState(0);
  React.useEffect(() => {
    const el = headerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight || 0));
    ro.observe(el); setHeaderH(el.offsetHeight || 0);
    return () => ro.disconnect();
  }, []);
  const kbHeight = useKeyboardHeight();

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: `calc(100% - ${kbHeight}px)`, background: "var(--bg)", transition: "height 0.15s ease", position: "relative" } },
    // Sticky header
    React.createElement('div', { ref: headerRef, style: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, transform: headerHidden ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.25s ease", willChange: "transform", background: "var(--bg)" } },
      React.createElement('div', { style: { padding: "20px 16px 12px", borderBottom: "1px solid var(--border)" } },
        React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
          React.createElement('span', { style: { fontWeight: 800, fontSize: 20, color: "var(--text)" } }, "Exercise Library"),
          React.createElement('div', { style: { display: "flex", gap: 6 } },
            React.createElement('button', {
              onClick: () => { setEditMode(v => !v); setAdding(false); setConfirmDelete(null); },
              style: { background: editMode ? "rgba(239,68,68,0.15)" : "var(--surface2)", border: editMode ? "1px solid rgba(239,68,68,0.3)" : "1px solid transparent", borderRadius: 10, padding: "7px 12px", cursor: "pointer", color: editMode ? "#f87171" : "var(--subtle)", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }
            }, editMode ? "Done" : "Edit"),
            React.createElement(Btn, { variant: "primary", onClick: () => { setAdding(v => !v); setEditMode(false); }, style: { padding: "7px 12px", fontSize: 12 } }, React.createElement(Icon, { name: "plus", size: 14 }), " Custom")
          )
        ),
        React.createElement('div', { style: { position: "relative", marginBottom: 10 } },
          React.createElement('input', { value: query, onChange: e => setQuery(e.target.value), placeholder: "Search...", style: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)", padding: "9px 12px 9px 34px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" } }),
          React.createElement('div', { style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" } }, React.createElement(Icon, { name: "search", size: 16, color: "var(--subtle)" }))
        ),
        React.createElement('div', { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 } },
          ["All", ...MUSCLE_CATEGORIES.map(c => c.category)].map(cat => React.createElement('button', {
            key: cat, onClick: () => { setSelectedCat(cat); setSelectedMuscle(null); },
            style: { flexShrink: 0, padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: selectedCat === cat ? (getColorForCategory(cat) || "var(--accent)") : "var(--surface2)", color: selectedCat === cat ? "#fff" : "var(--subtle)" }
          }, cat))
        ),
        selectedCat !== "All" && catMuscles && React.createElement('div', { style: { display: "flex", gap: 6, overflowX: "auto", paddingTop: 6 } },
          React.createElement('button', { onClick: () => setSelectedMuscle(null), style: { flexShrink: 0, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1px solid var(--border2)", cursor: "pointer", fontFamily: "inherit", background: !selectedMuscle ? "var(--border2)" : "transparent", color: !selectedMuscle ? "var(--text)" : "var(--muted2)" } }, "All"),
          catMuscles.map(m => React.createElement('button', { key: m, onClick: () => setSelectedMuscle(selectedMuscle === m ? null : m), style: { flexShrink: 0, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: selectedMuscle === m ? getColorForMuscle(m) : `${getColorForMuscle(m)}22`, color: selectedMuscle === m ? "#fff" : getColorForMuscle(m) } }, m))
        )
      )
    ),

    React.createElement('div', { ref: scrollRef, style: { overflowY: "auto", flex: 1, paddingTop: headerHidden ? 0 : headerH, transition: "padding-top 0.25s ease" } },
      editMode && React.createElement('div', { style: { margin: "12px 16px 4px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
        React.createElement('span', { style: { fontSize: 12, color: "#fca5a5", lineHeight: 1.4 } }, "Tap the trash icon to remove any exercise."),
        hiddenCount > 0 && React.createElement('button', { onClick: restoreDefaults, style: { flexShrink: 0, background: "rgba(239,68,68,0.18)", border: "none", borderRadius: 8, padding: "5px 10px", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" } }, "Restore ", hiddenCount, " default", hiddenCount > 1 ? "s" : "")
      ),
      adding && React.createElement('div', { style: { margin: 16, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 12 } },
        React.createElement(Inp, { label: "Exercise Name", value: newName, onChange: e => setNewName(e.target.value), placeholder: "e.g. Sissy Squat" }),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--subtle)", marginBottom: 8 } }, "Muscles ", React.createElement('span', { style: { color: "var(--muted)", fontWeight: 500, textTransform: "none", fontSize: 11 } }, "(at least one primary)")),
          React.createElement(MuscleSelector, { primary: newPrimary, secondary: newSecondary, onChange: (p, s) => { setNewPrimary(p); setNewSecondary(s); } })
        ),
        React.createElement('div', { style: { display: "flex", gap: 8 } },
          React.createElement(Btn, { variant: "primary", onClick: addCustom, style: { flex: 1, justifyContent: "center" }, disabled: !newName.trim() || !newPrimary.length }, "Add Exercise"),
          React.createElement(Btn, { variant: "secondary", onClick: () => { setAdding(false); setNewPrimary([]); setNewSecondary([]); setNewName(""); }, style: { flex: 1, justifyContent: "center" } }, "Cancel")
        )
      ),
      Object.keys(grouped).length === 0 && !adding && React.createElement('div', { style: { color: "var(--muted2)", textAlign: "center", padding: "40px 20px", fontSize: 14 } }, "No exercises found"),
      Object.entries(grouped).map(([cat, exs]) => React.createElement('div', { key: cat },
        React.createElement('div', { style: { padding: "12px 16px 4px", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, background: "var(--bg)", zIndex: 1 } },
          React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: getColorForCategory(cat) } }),
          React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: getColorForCategory(cat), textTransform: "uppercase", letterSpacing: "0.08em" } }, cat),
          React.createElement('span', { style: { fontSize: 11, color: "var(--muted)" } }, "(", exs.length, ")")
        ),
        exs.map(ex => {
          const isCustom  = ex.id.startsWith("c");
          const isPending = confirmDelete === ex.id;
          return React.createElement('div', { key: ex.id, style: { borderBottom: "1px solid var(--surface)" } },
            React.createElement('div', { style: { padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 } },
              React.createElement('div', { style: { width: 34, height: 34, borderRadius: 10, background: `${getColorForMuscle(ex.muscles?.[0] || "")}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
                React.createElement(Icon, { name: "dumbbell", size: 16, color: getColorForMuscle(ex.muscles?.[0] || "") })),
              React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 } },
                  React.createElement('span', { style: { fontSize: 14, fontWeight: 600, color: "var(--text2)" } }, ex.name),
                  isCustom && React.createElement('span', { style: { fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 6px", borderRadius: 6 } }, "custom")
                ),
                React.createElement('div', { style: { display: "flex", flexWrap: "wrap", gap: 3 } },
                  (ex.primaryMuscles || [ex.muscles?.[0]].filter(Boolean)).map(m => React.createElement('span', { key: m, style: { padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${getColorForMuscle(m)}33`, color: getColorForMuscle(m) } }, m)),
                  (ex.secondaryMuscles || ex.muscles?.slice(1) || []).slice(0, 2).map(m => React.createElement('span', { key: m, style: { padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "var(--surface2)", color: "var(--muted)" } }, m))
                )
              ),
              editMode && React.createElement('button', { onClick: () => setConfirmDelete(isPending ? null : ex.id), style: { background: isPending ? "rgba(239,68,68,0.12)" : "none", border: "none", borderRadius: 8, cursor: "pointer", color: isPending ? "#ef4444" : "var(--muted)", padding: "6px 8px", flexShrink: 0, transition: "all 0.15s" } },
                React.createElement(Icon, { name: "trash", size: 15, color: isPending ? "#ef4444" : "var(--muted)" }))
            ),
            isPending && editMode && React.createElement('div', { style: { margin: "0 16px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
              React.createElement('span', { style: { fontSize: 12, color: "#fca5a5" } }, "Delete ", React.createElement('strong', null, ex.name), "?", !isCustom && " You can restore it later."),
              React.createElement('div', { style: { display: "flex", gap: 6, flexShrink: 0 } },
                React.createElement('button', { onClick: () => setConfirmDelete(null), style: { background: "var(--surface2)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "var(--subtle)", fontSize: 12, fontFamily: "inherit", fontWeight: 600 } }, "Cancel"),
                React.createElement('button', { onClick: () => deleteExercise(ex.id), style: { background: "#ef4444", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "#fff", fontSize: 12, fontFamily: "inherit", fontWeight: 700 } }, "Delete")
              )
            )
          );
        })
      ))
    )
  );
}
