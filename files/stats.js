// ── Stats Screen ──────────────────────────────────────────────────────────────

function StatsTab({ workouts, exercises, bodyweight, onSetBW, preferredUnit, onSetPreferredUnit }) {
  const [editBodyweight, setEditBodyweight] = React.useState(false);
  const [bwInput,        setBwInput]        = React.useState(String(bodyweight));
  const [displayUnit,    setDisplayUnit]    = React.useState(preferredUnit || "kg");
  const totalSets = countSetsWorkouts(workouts, exercises);

  function handleUnitToggle(unit) { setDisplayUnit(unit); onSetPreferredUnit(unit); }

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" } },
    React.createElement('div', { style: { padding: "24px 16px 16px", borderBottom: "1px solid var(--border)" } },
      React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" } },
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, "Performance"),
          React.createElement('div', { style: { fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" } }, "Stats")
        ),
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } },
          React.createElement('span', { style: { fontSize: 11, color: "var(--muted)", fontWeight: 600 } }, "Charts in"),
          React.createElement(UnitToggle, { unit: displayUnit, onChange: handleUnitToggle })
        )
      )
    ),

    React.createElement('div', { style: { overflowY: "auto", overflowX: "hidden", flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 14, WebkitOverflowScrolling: "touch" } },
      // Bodyweight card
      React.createElement('div', { style: { background: "var(--surface)", borderRadius: 16, padding: "14px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10 } },
          React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement(Icon, { name: "user", size: 18, color: "var(--subtle)" })),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.06em" } }, "Your Bodyweight"),
            editBodyweight
              ? React.createElement('div', { style: { display: "flex", gap: 6, alignItems: "center", marginTop: 4 } },
                  React.createElement('input', { value: bwInput, onChange: e => setBwInput(e.target.value), type: "number", style: { background: "var(--surface2)", border: "1px solid #6366f1", borderRadius: 8, color: "var(--text)", padding: "4px 8px", fontSize: 14, width: 70, outline: "none" } }),
                  React.createElement('span', { style: { color: "var(--subtle)", fontSize: 13 } }, "kg"),
                  React.createElement('button', { onClick: () => { onSetBW(parseFloat(bwInput) || 80); setEditBodyweight(false); }, style: { background: "var(--accent)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "OK")
                )
              : React.createElement('div', { style: { fontSize: 18, fontWeight: 800, color: "var(--text)", marginTop: 2 } },
                  bodyweight, " ", React.createElement('span', { style: { fontSize: 13, color: "var(--muted2)", fontWeight: 500 } }, "kg"))
          )
        ),
        !editBodyweight && React.createElement('button', { onClick: () => { setBwInput(String(bodyweight)); setEditBodyweight(true); }, style: { background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--subtle)" } }, React.createElement(Icon, { name: "edit", size: 15 }))
      ),

      // Lifetime stats grid
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 } }, "Lifetime Stats"),
        React.createElement('div', { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          [
            { label: "Workouts",   value: workouts.length, sub: "total" },
            { label: "Total Sets", value: fmtSets(totalSets), sub: "all time" },
            { label: "Avg Sets",   value: workouts.length ? fmtSets(Math.round(totalSets / workouts.length * 10) / 10) : 0, sub: "per session" },
            { label: "Exercises",  value: workouts.reduce((a, w) => a + w.entries.length, 0), sub: "logged" },
          ].map(s => React.createElement('div', { key: s.label, style: { background: "var(--surface)", borderRadius: 14, padding: "14px", border: "1px solid var(--border)" } },
            React.createElement('div', { style: { fontSize: 24, fontWeight: 900, color: "var(--text)" } }, s.value),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: "var(--muted2)", marginTop: 2 } }, s.label),
            React.createElement('div', { style: { fontSize: 10, color: "var(--border2)", marginTop: 1 } }, s.sub)
          ))
        )
      ),

      workouts.length > 0 && React.createElement(GroupStrengthCharts, { workouts, exercises, displayUnit }),
      React.createElement(StrengthTrendPanel, { workouts, exercises, displayUnit })
    )
  );
}
