// ── MuscleSelector ────────────────────────────────────────────────────────────
// A collapsible category-based muscle picker.
// Tap once = primary, tap again = secondary, tap a third time = remove.

function MuscleSelector({ primary = [], secondary = [], onChange }) {
  const [openCategory, setOpenCategory] = React.useState(null);

  function toggleMuscle(muscle) {
    if (primary.includes(muscle)) {
      onChange(primary.filter(m => m !== muscle), [...secondary, muscle]);
    } else if (secondary.includes(muscle)) {
      onChange(primary, secondary.filter(m => m !== muscle));
    } else {
      onChange([...primary, muscle], secondary);
    }
  }

  function getState(muscle) {
    if (primary.includes(muscle))   return "primary";
    if (secondary.includes(muscle)) return "secondary";
    return "none";
  }

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 6 } },
    React.createElement('div', { style: { fontSize: 11, color: "var(--muted)", display: "flex", gap: 12, marginBottom: 2 } },
      React.createElement('span', null, "Tap once = ", React.createElement('strong', { style: { color: "var(--text)" } }, "Primary")),
      React.createElement('span', null, "Tap again = ", React.createElement('strong', { style: { color: "var(--subtle)" } }, "Secondary")),
      React.createElement('span', null, "Third tap = remove")
    ),
    MUSCLE_CATEGORIES.map(cat => {
      const countPrimary   = primary.filter(m => cat.muscles.includes(m)).length;
      const countSecondary = secondary.filter(m => cat.muscles.includes(m)).length;
      const isOpen = openCategory === cat.category;

      return React.createElement('div', {
        key: cat.category,
        style: { background: "var(--surface)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" },
      },
        React.createElement('button', {
          onClick: () => setOpenCategory(isOpen ? null : cat.category),
          style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" },
        },
          React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8 } },
            React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 } }),
            React.createElement('span', { style: { fontSize: 13, fontWeight: 700, color: "var(--text2)" } }, cat.category),
            countPrimary > 0   && React.createElement('span', { style: { fontSize: 10, fontWeight: 700, color: "#fff", background: cat.color, padding: "1px 7px", borderRadius: 20 } }, countPrimary, "P"),
            countSecondary > 0 && React.createElement('span', { style: { fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}33`, padding: "1px 7px", borderRadius: 20 } }, countSecondary, "S")
          ),
          React.createElement('div', { style: { transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "var(--muted)" } },
            React.createElement(Icon, { name: "chevron", size: 16 })
          )
        ),
        isOpen && React.createElement('div', { style: { padding: "4px 12px 12px", display: "flex", flexWrap: "wrap", gap: 6 } },
          cat.muscles.map(muscle => {
            const state = getState(muscle);
            return React.createElement('button', {
              key: muscle,
              onClick: () => toggleMuscle(muscle),
              style: {
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: state === "secondary" ? `1.5px solid ${cat.color}` : "none",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                background: state === "primary" ? cat.color : state === "secondary" ? `${cat.color}22` : "var(--surface2)",
                color:      state === "primary" ? "#fff"   : state === "secondary" ? cat.color      : "var(--muted)",
              },
            }, muscle, state === "primary" ? " ●" : state === "secondary" ? " ○" : "");
          })
        )
      );
    })
  );
}
