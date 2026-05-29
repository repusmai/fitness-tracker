// ── App-Level Overlays ────────────────────────────────────────────────────────
// TemplatePicker: bottom sheet shown when Start is tapped and templates exist.
// WorkoutPill:    floating pill shown when QuickLog is minimised.

function TemplatePicker({ templates, onSelectTemplate, onSelectBlank, onClose }) {
  return React.createElement('div', {
    style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 30, display: "flex", alignItems: "flex-end" }
  },
    React.createElement('div', {
      style: { background: "var(--surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "80vh", display: "flex", flexDirection: "column", border: "1px solid var(--border)" }
    },
      // Header
      React.createElement('div', { style: { padding: "16px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } },
        React.createElement('span', { style: { fontWeight: 800, fontSize: 16, color: "var(--text)" } }, "Start Workout"),
        React.createElement('button', { onClick: onClose, style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20, padding: 4 } }, "✕")
      ),
      // Option list
      React.createElement('div', { style: { overflowY: "auto", padding: "10px 12px 24px", display: "flex", flexDirection: "column", gap: 8 } },
        // Blank workout
        React.createElement('button', {
          onClick: onSelectBlank,
          style: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }
        },
          React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "var(--accentSoft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
            React.createElement(Icon, { name: "plus", size: 18, color: "var(--accent)" })
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, "Blank Workout"),
            React.createElement('div', { style: { fontSize: 12, color: "var(--muted2)", marginTop: 2 } }, "Start from scratch")
          )
        ),
        // Template options
        templates.map(tpl => React.createElement('button', {
          key: tpl.id,
          onClick: () => onSelectTemplate(tpl),
          style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }
        },
          React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 } }, tpl.name),
          React.createElement('div', { style: { fontSize: 12, color: "var(--muted2)" } },
            tpl.entries.length, " exercises · ", tpl.entries.reduce((a, e) => a + e.sets.length, 0), " sets"
          )
        ))
      )
    )
  );
}

function WorkoutPill({ onResume }) {
  return React.createElement('button', {
    onClick: onResume,
    style: { position: "fixed", bottom: "calc(66px + env(safe-area-inset-bottom))", left: "50%", transform: "translate(-50%, 0)", zIndex: 15, background: "var(--grad)", border: "none", borderRadius: 99, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.35)", maxWidth: 390, width: "calc(100% - 32px)", transition: "transform 0.25s ease" }
  },
    React.createElement(Icon, { name: "play", size: 14, color: "#fff" }),
    React.createElement('span', { style: { flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left" } }, "Workout in progress"),
    React.createElement('span', { style: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 } }, "Tap to return")
  );
}
