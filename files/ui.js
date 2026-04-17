// ── Shared UI Primitives ──────────────────────────────────────────────────────

// ── Icon ──────────────────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = "currentColor" }) {
  const p = {
    width: size, height: size,
    viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: "2",
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  const icons = {
    plus:     React.createElement('svg', { ...p, strokeWidth: "2.5" }, React.createElement('line', { x1:"12",y1:"5",x2:"12",y2:"19" }), React.createElement('line', { x1:"5",y1:"12",x2:"19",y2:"12" })),
    trash:    React.createElement('svg', { ...p }, React.createElement('polyline', { points:"3 6 5 6 21 6" }), React.createElement('path', { d:"M19 6l-1 14H6L5 6" }), React.createElement('path', { d:"M10 11v6M14 11v6M9 6V4h6v2" })),
    edit:     React.createElement('svg', { ...p }, React.createElement('path', { d:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" }), React.createElement('path', { d:"M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" })),
    back:     React.createElement('svg', { ...p, strokeWidth:"2.5" }, React.createElement('polyline', { points:"15 18 9 12 15 6" })),
    check:    React.createElement('svg', { ...p, strokeWidth:"2.5" }, React.createElement('polyline', { points:"20 6 9 17 4 12" })),
    dumbbell: React.createElement('svg', { ...p }, React.createElement('path', { d:"M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M5.5 6.5v11M18.5 6.5v11" })),
    calendar: React.createElement('svg', { ...p }, React.createElement('rect', { x:"3",y:"4",width:"18",height:"18",rx:"2" }), React.createElement('line', { x1:"16",y1:"2",x2:"16",y2:"6" }), React.createElement('line', { x1:"8",y1:"2",x2:"8",y2:"6" }), React.createElement('line', { x1:"3",y1:"10",x2:"21",y2:"10" })),
    list:     React.createElement('svg', { ...p }, React.createElement('line', { x1:"8",y1:"6",x2:"21",y2:"6" }), React.createElement('line', { x1:"8",y1:"12",x2:"21",y2:"12" }), React.createElement('line', { x1:"8",y1:"18",x2:"21",y2:"18" }), React.createElement('circle', { cx:"3",cy:"6",r:"1",fill:color }), React.createElement('circle', { cx:"3",cy:"12",r:"1",fill:color }), React.createElement('circle', { cx:"3",cy:"18",r:"1",fill:color })),
    note:     React.createElement('svg', { ...p }, React.createElement('path', { d:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" }), React.createElement('polyline', { points:"14 2 14 8 20 8" }), React.createElement('line', { x1:"16",y1:"13",x2:"8",y2:"13" }), React.createElement('line', { x1:"16",y1:"17",x2:"8",y2:"17" })),
    close:    React.createElement('svg', { ...p, strokeWidth:"2.5" }, React.createElement('line', { x1:"18",y1:"6",x2:"6",y2:"18" }), React.createElement('line', { x1:"6",y1:"6",x2:"18",y2:"18" })),
    fire:     React.createElement('svg', { ...p }, React.createElement('path', { d:"M12 2C6.5 9 4 13.5 4 17a8 8 0 0016 0c0-3.5-2-8.5-8-15z" })),
    search:   React.createElement('svg', { ...p }, React.createElement('circle', { cx:"11",cy:"11",r:"8" }), React.createElement('line', { x1:"21",y1:"21",x2:"16.65",y2:"16.65" })),
    chart:    React.createElement('svg', { ...p }, React.createElement('polyline', { points:"22 12 18 12 15 21 9 3 6 12 2 12" })),
    user:     React.createElement('svg', { ...p }, React.createElement('path', { d:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" }), React.createElement('circle', { cx:"12",cy:"7",r:"4" })),
    download: React.createElement('svg', { ...p }, React.createElement('path', { d:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), React.createElement('polyline', { points:"7 10 12 15 17 10" }), React.createElement('line', { x1:"12",y1:"15",x2:"12",y2:"3" })),
    upload:   React.createElement('svg', { ...p }, React.createElement('path', { d:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" }), React.createElement('polyline', { points:"17 8 12 3 7 8" }), React.createElement('line', { x1:"12",y1:"3",x2:"12",y2:"15" })),
    tag:      React.createElement('svg', { ...p }, React.createElement('path', { d:"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" }), React.createElement('line', { x1:"7",y1:"7",x2:"7.01",y2:"7" })),
    chevron:  React.createElement('svg', { ...p, strokeWidth:"2.5" }, React.createElement('polyline', { points:"9 18 15 12 9 6" })),
    template: React.createElement('svg', { ...p }, React.createElement('rect', { x:"3",y:"3",width:"18",height:"18",rx:"2" }), React.createElement('line', { x1:"3",y1:"9",x2:"21",y2:"9" }), React.createElement('line', { x1:"9",y1:"21",x2:"9",y2:"9" })),
    copy:     React.createElement('svg', { ...p }, React.createElement('rect', { x:"9",y:"9",width:"13",height:"13",rx:"2" }), React.createElement('path', { d:"M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" })),
    play:     React.createElement('svg', { width:size,height:size,viewBox:"0 0 24 24",fill:color,stroke:"none" }, React.createElement('polygon', { points:"5 3 19 12 5 21 5 3" })),
    settings: React.createElement('svg', { ...p }, React.createElement('circle', { cx:"12",cy:"12",r:"3" }), React.createElement('path', { d:"M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" })),
    cloud:    React.createElement('svg', { ...p }, React.createElement('path', { d:"M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" })),
    refresh:  React.createElement('svg', { ...p }, React.createElement('polyline', { points:"23 4 23 10 17 10" }), React.createElement('path', { d:"M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })),
    shield:   React.createElement('svg', { ...p }, React.createElement('path', { d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })),
    history:  React.createElement('svg', { ...p }, React.createElement('polyline', { points:"12 8 12 12 14 14" }), React.createElement('path', { d:"M3.05 11a9 9 0 1 0 .5-4" }), React.createElement('polyline', { points:"3 3 3 7 7 7" })),
  };
  return icons[name] || null;
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Input({ label, ...props }) {
  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 4 } },
    label && React.createElement('label', {
      style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--subtle)" }
    }, label),
    React.createElement('input', {
      ...props,
      style: {
        background: "var(--surface2)", border: "1px solid var(--border2)",
        borderRadius: 10, color: "var(--text)", padding: "10px 12px",
        fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
        ...props.style,
      },
    })
  );
}

// Shorthand alias used throughout the codebase
const Inp = Input;

// ── Textarea ──────────────────────────────────────────────────────────────────
function Textarea({ label, ...props }) {
  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 4 } },
    label && React.createElement('label', {
      style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--subtle)" }
    }, label),
    React.createElement('textarea', {
      ...props,
      style: {
        background: "var(--surface2)", border: "1px solid var(--border2)",
        borderRadius: 10, color: "var(--text)", padding: "10px 12px",
        fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
        resize: "vertical", minHeight: 70, fontFamily: "inherit",
        ...props.style,
      },
    })
  );
}

const TA = Textarea;

// ── Button ────────────────────────────────────────────────────────────────────
function Btn({ children, variant = "primary", style: extraStyle, ...props }) {
  const variantStyles = {
    primary:   { background: "var(--grad)",                         color: "#fff", border: "none" },
    secondary: { background: "var(--surface2)",                     color: "var(--subtle)", border: "1px solid var(--border2)" },
    ghost:     { background: "transparent",                         color: "var(--subtle)", border: "none" },
    green:     { background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", border: "none" },
    drive:     { background: "linear-gradient(135deg,#1a73e8,#4285f4)", color: "#fff", border: "none" },
  };
  return React.createElement('button', {
    ...props,
    style: {
      borderRadius: 12, padding: "10px 18px", fontSize: 14,
      fontWeight: 600, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6,
      fontFamily: "inherit",
      ...variantStyles[variant],
      ...extraStyle,
    },
  }, children);
}

// ── Muscle Pills ──────────────────────────────────────────────────────────────
function MusclePills({ muscles, max = 99 }) {
  const shown = muscles.slice(0, max);
  const overflow = muscles.length - shown.length;
  return React.createElement('div', { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
    shown.map(muscle => React.createElement('span', {
      key: muscle,
      style: {
        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: `${getColorForMuscle(muscle)}22`, color: getColorForMuscle(muscle),
      },
    }, muscle)),
    overflow > 0 && React.createElement('span', {
      style: { padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "var(--surface2)", color: "var(--muted2)" }
    }, `+${overflow}`)
  );
}

// ── Unit Toggle ───────────────────────────────────────────────────────────────
// A compact kg/lbs pill selector used in workout and set headers.
function UnitToggle({ unit, onChange, small = false }) {
  const size = small
    ? { fontSize: 10, padding: "1px 6px", borderRadius: 6, gap: 2 }
    : { fontSize: 11, padding: "2px 8px", borderRadius: 8, gap: 3 };

  return React.createElement('div', {
    style: {
      display: "flex", background: "var(--surface)", borderRadius: small ? 6 : 8,
      border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0,
    },
  },
    ["kg", "lbs"].map(u => React.createElement('button', {
      key: u,
      onClick: () => onChange(u),
      style: {
        ...size, border: "none", cursor: "pointer", fontFamily: "inherit",
        fontWeight: 700, display: "flex", alignItems: "center",
        background: unit === u ? "var(--border2)" : "transparent",
        color:      unit === u ? "var(--text)"    : "var(--muted)",
        transition: "all 0.12s",
      },
    }, u))
  );
}

// ── Date Input ────────────────────────────────────────────────────────────────
// A controlled input that displays dates in dd/mm/yyyy format
// but stores them internally as ISO yyyy-mm-dd strings.
function DateInput({ value, onChange, style }) {
  const toDisplay = iso => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const [raw, setRaw] = React.useState(toDisplay(value));

  React.useEffect(() => setRaw(toDisplay(value)), [value]);

  function handleChange(event) {
    let v = event.target.value.replace(/[^0-9/]/g, "");
    if (v.length === 2 && raw.length === 1) v = v + "/";
    if (v.length === 5 && raw.length === 4) v = v + "/";
    if (v.length > 10) v = v.slice(0, 10);
    setRaw(v);

    const parts = v.split("/");
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!isNaN(new Date(iso))) onChange(iso);
    }
  }

  return React.createElement('input', {
    value: raw, onChange: handleChange,
    placeholder: "dd/mm/yyyy", maxLength: 10, inputMode: "numeric",
    style,
  });
}
