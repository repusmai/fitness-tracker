// ── SetRow ────────────────────────────────────────────────────────────────────
// A single row in the workout entry card representing one set.

function SetRow({ set, index, onChange, onRemove, hint }) {
  const isFailure = set.rir === "failure";
  const side = set.side || "B";
  const unit = set.unit || "kg";

  // Show previous workout's values as placeholder hints
  const placeholderWeight = (() => {
    if (!hint?.weight) return unit;
    const hintUnit = hint.unit || "kg";
    const hintW    = parseFloat(hint.weight);
    if (!hintW) return unit;
    if (hintUnit === unit) return String(hint.weight);
    const converted = hintUnit === "kg" ? hintW * KG_TO_LBS : hintW * LBS_TO_KG;
    return String(Math.round(converted * 100) / 100);
  })();
  const placeholderReps = hint?.reps ? String(hint.reps) : "reps";

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 4 } },
    React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 6 } },
      // Set number
      React.createElement('span', { style: { width: 24, flexShrink: 0, color: "var(--muted2)", fontSize: 12, fontWeight: 700, textAlign: "center" } }, index + 1),

      // Weight
      React.createElement('div', { style: { flex: 1, position: "relative" } },
        React.createElement(Inp, {
          placeholder: placeholderWeight, type: "number", value: set.weight,
          onChange: e => onChange({ ...set, weight: e.target.value }),
          style: { padding: "8px 6px", fontSize: 13, textAlign: "center" },
        })
      ),

      // Reps
      React.createElement('div', { style: { flex: 1 } },
        React.createElement(Inp, {
          placeholder: placeholderReps, type: "number", value: set.reps,
          onChange: e => onChange({ ...set, reps: e.target.value }),
          style: { padding: "8px 6px", fontSize: 13, textAlign: "center" },
        })
      ),

      // RIR / Failure
      React.createElement('div', { style: { width: 56, flexShrink: 0 } },
        !isFailure
          ? React.createElement(Inp, {
              placeholder: "0", type: "number", value: set.rir,
              onChange: e => onChange({ ...set, rir: e.target.value }),
              style: { padding: "8px 6px", fontSize: 13, textAlign: "center" },
            })
          : React.createElement('div', {
              style: { padding: "8px 4px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 10, fontWeight: 800, color: "#f87171", textAlign: "center" }
            }, "FAIL")
      ),

      // Failure toggle (⚡ icon)
      React.createElement('button', {
        onClick: () => onChange({ ...set, rir: isFailure ? "" : "failure" }),
        title: isFailure ? "Clear failure" : "Mark as failure",
        style: {
          width: 28, height: 28, flexShrink: 0,
          background: isFailure ? "rgba(239,68,68,0.2)" : "var(--surface2)",
          border: "none", borderRadius: 8, padding: 0, cursor: "pointer",
          color: isFailure ? "#f87171" : "var(--muted)",
          display: "flex", alignItems: "center", justifyContent: "center",
        },
      },
        React.createElement('svg', { width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round" },
          React.createElement('path', { d:"M13 2L3 14h9l-1 8 10-12h-9l1-8z" })
        )
      ),

      // Remove set button
      React.createElement('button', {
        onClick: onRemove,
        style: { width: 24, flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--muted2)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" },
      }, React.createElement(Icon, { name: "close", size: 14 }))
    ),

    // Side selector (Both / Left / Right) and unit toggle
    React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 4, paddingLeft: 30 } },
      React.createElement(UnitToggle, { unit, onChange: u => onChange({ ...set, unit: u }), small: true }),
      React.createElement('div', { style: { width: 4 } }),
      SIDE_OPTIONS.map(option => React.createElement('button', {
        key: option.v,
        onClick: () => onChange({ ...set, side: option.v }),
        style: {
          padding: "2px 10px", borderRadius: 20, border: "none", cursor: "pointer",
          fontFamily: "inherit", fontSize: 11, fontWeight: 700, transition: "all 0.15s",
          background: side === option.v ? "var(--border2)" : "transparent",
          color:      side === option.v ? "var(--text)"    : "var(--muted)",
        },
      }, option.label))
    )
  );
}
