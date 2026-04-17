// ── Detail Screen ─────────────────────────────────────────────────────────────
// Read-only view of a completed workout, with a tab to save it as a template.

function Detail({ workout, exercises, onBack, onEdit, onDelete, onSaveTemplate, existingTemplate }) {
  const [tab,      setTab]      = React.useState("summary");
  const [tplName,  setTplName]  = React.useState(workout.name);
  const [saved,    setSaved]    = React.useState(false);

  const allMuscles = [...new Set(workout.entries.flatMap(entry => {
    const ex = exercises.find(x => x.id === entry.exerciseId);
    return ex?.muscles || [];
  }))];

  const handleSaveTemplate = () => { onSaveTemplate(workout, tplName); setSaved(true); };

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" } },
    // Header
    React.createElement('div', { style: { padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 } },
      React.createElement('button', { onClick: onBack, style: { background: "none", border: "none", cursor: "pointer", color: "var(--subtle)" } }, React.createElement(Icon, { name: "back", size: 22 })),
      React.createElement('span', { style: { fontWeight: 800, fontSize: 18, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, workout.name),
      React.createElement('button', { onClick: onEdit, style: { background: "var(--surface2)", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "var(--subtle)" } }, React.createElement(Icon, { name: "edit", size: 17 })),
      React.createElement('button', { onClick: onDelete, style: { background: "#450a0a", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "#f87171" } }, React.createElement(Icon, { name: "trash", size: 17 }))
    ),

    // Tabs
    React.createElement('div', { style: { display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg)" } },
      [{ id: "summary", label: "Summary", icon: "list" }, { id: "template", label: "Save as Template", icon: "template" }].map(t => React.createElement('button', {
        key: t.id, onClick: () => setTab(t.id),
        style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 8px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent", color: tab === t.id ? "var(--accent)" : "var(--muted2)", fontWeight: 700, fontSize: 13, marginBottom: "-1px" }
      }, React.createElement(Icon, { name: t.icon, size: 15, color: tab === t.id ? "var(--accent)" : "var(--muted2)" }), t.label))
    ),

    // Summary tab
    tab === "summary" && React.createElement('div', { style: { overflowY: "auto", flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 16 } },
      React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
        React.createElement(Icon, { name: "calendar", size: 16, color: "var(--subtle)" }),
        React.createElement('span', { style: { color: "var(--subtle)", fontSize: 14 } }, formatDate(workout.date)),
        workout.unit && React.createElement('span', { style: { fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: 6 } }, workout.unit.toUpperCase())
      ),
      React.createElement(MusclePills, { muscles: allMuscles }),
      workout.notes && React.createElement('div', { style: { background: "var(--surface2)", borderRadius: 12, padding: "12px 14px" } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 } }, "Session Notes"),
        React.createElement('div', { style: { fontSize: 14, color: "var(--subtle)", lineHeight: 1.5 } }, workout.notes)
      ),
      workout.entries.map((entry, i) => {
        const ex = exercises.find(e => e.id === entry.exerciseId);
        const primaryColor = ex?.muscles?.[0] ? getColorForMuscle(ex.muscles[0]) : "var(--accent)";
        return React.createElement('div', { key: i, style: { background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" } },
          React.createElement('div', { style: { padding: "12px 14px", borderLeft: `3px solid ${primaryColor}`, borderRadius: "16px 16px 0 0" } },
            React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" } },
              React.createElement('div', { style: { fontWeight: 700, fontSize: 15, color: "var(--text)" } }, ex?.name),
              entry.unit && React.createElement('span', { style: { fontSize: 10, fontWeight: 700, color: "var(--muted2)", background: "var(--surface2)", padding: "1px 6px", borderRadius: 5 } }, entry.unit)
            ),
            ex && React.createElement('div', { style: { display: "flex", flexWrap: "wrap", gap: 3 } },
              (ex.primaryMuscles || [ex.muscles?.[0]].filter(Boolean)).map(m => React.createElement('span', { key: m, style: { padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${getColorForMuscle(m)}33`, color: getColorForMuscle(m) } }, m)),
              (ex.secondaryMuscles || ex.muscles?.slice(1) || []).slice(0, 2).map(m => React.createElement('span', { key: m, style: { padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "var(--surface2)", color: "var(--muted)" } }, m))
            )
          ),
          entry.note && React.createElement('div', { style: { margin: "0 14px 8px", background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--subtle)" } }, entry.note),
          React.createElement('div', { style: { padding: "0 14px 14px" } },
            React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4, marginTop: 8 } },
              React.createElement('span', { style: { width: 24, flexShrink: 0, fontSize: 10, fontWeight: 700, color: "var(--muted)", textAlign: "center" } }, "#"),
              React.createElement('span', { style: { flex: 1, fontSize: 10, fontWeight: 700, color: "var(--muted)", textAlign: "center", textTransform: "uppercase" } }, entry.unit || "kg"),
              React.createElement('span', { style: { flex: 1, fontSize: 10, fontWeight: 700, color: "var(--muted)", textAlign: "center", textTransform: "uppercase" } }, "Reps"),
              React.createElement('span', { style: { flex: 1, fontSize: 10, fontWeight: 700, color: "var(--muted)", textAlign: "center", textTransform: "uppercase" } }, "RIR"),
              React.createElement('span', { style: { width: 36, flexShrink: 0, fontSize: 10, fontWeight: 700, color: "var(--muted)", textAlign: "center", textTransform: "uppercase" } }, "Side")
            ),
            entry.sets.map((s, j) => {
              const sideLabel = s.side === "L" ? "L" : s.side === "R" ? "R" : "—";
              const sideColor = (s.side === "L" || s.side === "R") ? "var(--accent)" : "var(--border2)";
              const rirDisplay = s.rir === "failure"
                ? React.createElement('span', { style: { fontSize: 10, fontWeight: 800, color: "#f87171" } }, "FAIL")
                : s.rir !== "" && s.rir != null ? s.rir : "—";
              return React.createElement('div', { key: j, style: { display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: j < entry.sets.length - 1 ? "1px solid var(--border)" : "none" } },
                React.createElement('span', { style: { width: 24, flexShrink: 0, textAlign: "center", fontSize: 12, color: "var(--muted)", fontWeight: 700 } }, j + 1),
                React.createElement('span', { style: { flex: 1, textAlign: "center", fontSize: 14, color: "var(--text)", fontWeight: 600 } }, s.weight || "—"),
                React.createElement('span', { style: { flex: 1, textAlign: "center", fontSize: 14, color: "var(--text)", fontWeight: 600 } }, s.reps || "—"),
                React.createElement('span', { style: { flex: 1, textAlign: "center", fontSize: 13, color: "var(--subtle)" } }, rirDisplay),
                React.createElement('span', { style: { width: 36, flexShrink: 0, textAlign: "center", fontSize: 12, fontWeight: 700, color: sideColor } }, sideLabel)
              );
            })
          )
        );
      })
    ),

    // Template tab
    tab === "template" && React.createElement('div', { style: { overflowY: "auto", overflowX: "hidden", flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 14, WebkitOverflowScrolling: "touch" } },
      React.createElement('div', { style: { background: "var(--surface)", borderRadius: 14, padding: "14px", border: "1px solid var(--border)" } },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } }, React.createElement(Icon, { name: "template", size: 18, color: "var(--accent)" }), React.createElement('span', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, "How templates work")),
        React.createElement('div', { style: { fontSize: 13, color: "var(--subtle)", lineHeight: 1.7 } }, "Saves all exercises and weights from this workout — but clears reps and RIR so you can fill them in fresh each session.")
      ),
      !saved && React.createElement(Inp, { label: "Template Name", value: tplName, onChange: e => setTplName(e.target.value), placeholder: "e.g. Push Day A" }),
      saved
        ? React.createElement('div', { style: { background: "#052e16", border: "1px solid #16a34a", borderRadius: 14, padding: "14px", textAlign: "center" } },
            React.createElement('div', { style: { color: "#22c55e", fontWeight: 700, fontSize: 15, marginBottom: 4 } }, "✓ Template saved!"),
            React.createElement('div', { style: { color: "#4ade80", fontSize: 13 } }, "Find it on the Log screen to start a new session from it."))
        : React.createElement(Btn, { variant: "primary", onClick: handleSaveTemplate, disabled: !tplName.trim(), style: { width: "100%", justifyContent: "center", padding: "13px", fontSize: 14 } },
            React.createElement(Icon, { name: "template", size: 16 }), " Save Template"),
      existingTemplate && !saved && React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", textAlign: "center" } }, "A template already exists for this workout — saving will create an additional one.")
    )
  );
}
