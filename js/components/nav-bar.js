// ── NavBar ────────────────────────────────────────────────────────────────────
// Fixed bottom navigation bar. Slides off-screen on scroll-down,
// returns on scroll-up. Rendered by App.

const NAV_TABS = [
  { id: "log",      label: "Log",      icon: "calendar" },
  { id: "stats",    label: "Stats",    icon: "chart"    },
  { id: "library",  label: "Library",  icon: "list"     },
  { id: "settings", label: "Settings", icon: "settings" },
];

function NavBar({ activeTab, onChange, hidden }) {
  return React.createElement('div', {
    style: {
      position: "fixed", bottom: 0, left: "50%",
      transform: hidden ? "translate(-50%, 100%)" : "translate(-50%, 0)",
      width: "100%", maxWidth: 430, display: "flex",
      background: "var(--surface)", borderTop: "1px solid var(--border)",
      padding: `8px 0 max(12px, env(safe-area-inset-bottom))`,
      transition: "transform 0.25s ease", zIndex: 10,
    }
  },
    NAV_TABS.map(t => React.createElement('button', {
      key: t.id, onClick: () => onChange(t.id),
      style: { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", fontFamily: "inherit" }
    },
      React.createElement(Icon, { name: t.icon, size: 22, color: activeTab === t.id ? "var(--accent)" : "var(--subtle)" }),
      React.createElement('span', { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: activeTab === t.id ? "var(--accent)" : "var(--subtle)" } }, t.label)
    ))
  );
}
