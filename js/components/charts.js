// ── Line Chart (canvas-based) ─────────────────────────────────────────────────
function LineChart({ points, color = "var(--accent)", height = 120, showDots = true, yLabel = "kg" }) {
  const canvasRef = React.useRef(null);
  const wrapRef   = React.useRef(null);
  const lastSize  = React.useRef({ w: 0, h: 0 });
  const rafRef    = React.useRef(null);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !points.length) return;

    const dpr  = window.devicePixelRatio || 1;
    const W    = wrapRef.current ? wrapRef.current.clientWidth : 320;
    const H    = height;

    // Skip redraw if dimensions haven't actually changed — prevents the
    // ResizeObserver ↔ canvas-resize feedback loop that causes the Stats
    // page to flicker when scrolled to the bottom.
    if (W === lastSize.current.w && H === lastSize.current.h) return;
    lastSize.current = { w: W, h: H };

    canvas.width        = W * dpr;
    canvas.height       = H * dpr;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const vals = points.map(p => p.value);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    const pad  = { t: 10, b: 24, l: 42, r: 10 };
    const iW   = W - pad.l - pad.r;
    const iH   = H - pad.t - pad.b;

    // Map dates to x-positions proportionally by time, not by index.
    const times = points.map(p => new Date(p.date).getTime());
    const tMin  = Math.min(...times);
    const tMax  = Math.max(...times);
    const sx = i => {
      if (points.length < 2 || tMax === tMin) return pad.l + iW / 2;
      return pad.l + iW * (times[i] - tMin) / (tMax - tMin);
    };
    const sy = v => pad.t + (max === min ? iH / 2 : iH * (1 - (v - min) / (max - min)));

    // Resolve CSS variables to actual colors at draw time so canvas can use them.
    // Falls back to legible defaults if resolution fails (e.g. in mono theme).
    const rootStyle  = getComputedStyle(document.documentElement);
    const resolve    = v => rootStyle.getPropertyValue(v.replace(/var\((.+)\)/, '$1')).trim() || v;
    const labelColor = (() => {
      const raw = resolve("var(--muted)");
      // If the color is too dark (luminance < 0.2 on a dark bg), use a lighter fallback.
      // This catches the mono theme where --muted is #444444.
      if (raw.startsWith('#')) {
        const hex = raw.slice(1);
        const r = parseInt(hex.slice(0,2),16)/255, g = parseInt(hex.slice(2,4),16)/255, b = parseInt(hex.slice(4,6),16)/255;
        const lum = 0.2126*r + 0.7152*g + 0.0722*b;
        if (lum < 0.25) return "#aaaaaa";
      }
      return raw || "var(--muted)";
    })();
    const gridColor  = (() => {
      const raw = resolve("var(--surface2)");
      if (raw.startsWith('#')) {
        const hex = raw.slice(1);
        const r = parseInt(hex.slice(0,2),16)/255, g = parseInt(hex.slice(2,4),16)/255, b = parseInt(hex.slice(4,6),16)/255;
        const lum = 0.2126*r + 0.7152*g + 0.0722*b;
        if (lum < 0.15) return "#333333";
      }
      return raw || "var(--surface2)";
    })();
    for (let t = 0; t <= 4; t++) {
      const v = min + (max - min) * t / 4;
      const y = sy(v);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
      ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = labelColor; ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(Math.round(v) + yLabel, pad.l - 4, y);
    }

    // X-axis date labels
    const fmtShort = iso => {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    };
    ctx.fillStyle = labelColor; ctx.font = "9px sans-serif"; ctx.textBaseline = "top";
    if (points.length > 1) {
      ctx.textAlign = "left";  ctx.fillText(fmtShort(points[0].date), pad.l, H - pad.b + 4);
      ctx.textAlign = "right"; ctx.fillText(fmtShort(points[points.length - 1].date), W - pad.r, H - pad.b + 4);
      if (points.length > 3) {
        const tMid = (tMin + tMax) / 2;
        const midIdx = times.reduce((best, t, i) => Math.abs(t - tMid) < Math.abs(times[best] - tMid) ? i : best, 0);
        if (midIdx > 0 && midIdx < points.length - 1) {
          ctx.textAlign = "center"; ctx.fillText(fmtShort(points[midIdx].date), sx(midIdx), H - pad.b + 4);
        }
      }
    }

    // Fill area under curve
    const gradient = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    gradient.addColorStop(0, color + "44"); gradient.addColorStop(1, color + "00");
    ctx.beginPath(); ctx.moveTo(sx(0), sy(points[0].value));
    for (let i = 1; i < points.length; i++) ctx.lineTo(sx(i), sy(points[i].value));
    ctx.lineTo(sx(points.length - 1), H - pad.b); ctx.lineTo(sx(0), H - pad.b);
    ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();

    // Line
    ctx.beginPath(); ctx.moveTo(sx(0), sy(points[0].value));
    for (let i = 1; i < points.length; i++) ctx.lineTo(sx(i), sy(points[i].value));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();

    // Dots
    if (showDots) {
      points.forEach((p, i) => {
        ctx.beginPath(); ctx.arc(sx(i), sy(p.value), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = "var(--bg)"; ctx.lineWidth = 2; ctx.stroke();
      });
    }
  }

  React.useEffect(() => {
    lastSize.current = { w: 0, h: 0 }; // reset so first draw always runs
    draw();
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      // Debounce via rAF so rapid scroll-driven resize events are collapsed
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => draw());
    });
    ro.observe(wrapRef.current);
    return () => { ro.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [points, color, height, showDots]);

  if (!points.length) {
    return React.createElement('div', {
      style: { height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--border2)", fontSize: 12 }
    }, "No data yet — log more workouts");
  }

  return React.createElement('div', { ref: wrapRef, style: { width: "100%" } },
    React.createElement('canvas', { ref: canvasRef, style: { display: "block" } })
  );
}

// ── Group Strength Charts ─────────────────────────────────────────────────────
// Each muscle group plots exactly one "representative" exercise.
// Auto-selects the exercise with the highest all-time e1RM (primary muscle only).
// The user can override per group via a small picker inline on the card.

const GROUP_OVERRIDE_KEY = "group_chart_overrides"; // localStorage key

function loadGroupOverrides() {
  try { return JSON.parse(localStorage.getItem(GROUP_OVERRIDE_KEY) || "{}"); } catch { return {}; }
}
function saveGroupOverrides(overrides) {
  try { localStorage.setItem(GROUP_OVERRIDE_KEY, JSON.stringify(overrides)); } catch {}
}

function GroupStrengthCharts({ workouts, exercises, displayUnit }) {
  const [overrides, setOverrides] = React.useState(() => loadGroupOverrides());
  const [picking, setPicking]     = React.useState(null); // group key currently being overridden

  // For each group, find all exercises whose PRIMARY muscle belongs to this group,
  // that have been logged at least once, with their all-time best e1RM.
  const groupData = React.useMemo(() => {
    return MUSCLE_GROUPS.map(group => {
      // Map exerciseId -> best e1RM (kg), only counting primary muscle match
      const exMap = {};
      for (const workout of workouts) {
        for (const entry of workout.entries) {
          const ex = exercises.find(e => e.id === entry.exerciseId);
          if (!ex) continue;
          // Only count if this group contains the exercise's PRIMARY muscle
          const primaryMuscle = ex.primaryMuscles?.[0] || ex.muscles?.[0];
          if (!group.muscles.includes(primaryMuscle)) continue;
          for (const s of entry.sets) {
            const unit = s.unit || entry.unit || workout.unit || "kg";
            const wKg  = unit === "lbs" ? parseFloat(s.weight) * LBS_TO_KG : parseFloat(s.weight);
            const reps = parseInt(s.reps);
            if (!wKg || !reps) continue;
            const rm = reps === 1 ? wKg : wKg * (1 + reps / 30);
            if (!exMap[entry.exerciseId] || rm > exMap[entry.exerciseId].best1rm) {
              exMap[entry.exerciseId] = { ex, best1rm: rm };
            }
          }
        }
      }

      const logged = Object.entries(exMap)
        .map(([id, v]) => ({ id, name: v.ex.name, best1rm: v.best1rm }))
        .sort((a, b) => b.best1rm - a.best1rm);

      if (!logged.length) return { group, logged, repId: null, pts: [] };

      // Pick representative: manual override if set and still valid, else highest e1RM
      const repId = (overrides[group.key] && logged.find(e => e.id === overrides[group.key]))
        ? overrides[group.key]
        : logged[0].id;

      // Build chart points for repId
      const pts = [];
      for (const w of [...workouts].sort((a, b) => a.date.localeCompare(b.date))) {
        const entry = w.entries.find(e => e.exerciseId === repId);
        if (!entry) continue;
        let best = 0;
        for (const s of entry.sets) {
          const unit = s.unit || entry.unit || w.unit || "kg";
          const wKg  = unit === "lbs" ? parseFloat(s.weight) * LBS_TO_KG : parseFloat(s.weight);
          const reps = parseInt(s.reps);
          if (!wKg || !reps) continue;
          const rm = reps === 1 ? wKg : wKg * (1 + reps / 30);
          if (rm > best) best = rm;
        }
        if (best > 0) {
          const display = displayUnit === "lbs" ? Math.round(best * KG_TO_LBS * 10) / 10 : Math.round(best * 10) / 10;
          pts.push({ date: w.date, value: display });
        }
      }

      return { group, logged, repId, pts };
    }).filter(d => d.pts.length > 0);
  }, [workouts, exercises, overrides, displayUnit]);

  function setOverride(groupKey, exId) {
    const next = { ...overrides, [groupKey]: exId };
    setOverrides(next);
    saveGroupOverrides(next);
    setPicking(null);
  }

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 12 } },
    groupData.map(({ group, logged, repId, pts }) => {
      const col     = resolveCssColor(group.color);
      const latest  = pts[pts.length - 1];
      const repName = logged.find(e => e.id === repId)?.name || "";
      const isPicking = picking === group.key;

      return React.createElement('div', {
        key: group.key,
        style: { background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)" },
      },
        // Header row
        React.createElement('div', { style: { padding: "12px 14px 8px" } },
          React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.06em" } }, group.label),
              React.createElement('div', { style: { fontSize: 18, fontWeight: 900, color: "var(--text)", marginTop: 2 } },
                `${latest.value} ${displayUnit}`)
            ),
            React.createElement('div', { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 } },
              React.createElement('div', { style: { fontSize: 10, color: "var(--muted2)" } }, "best est. 1RM"),
              // Exercise name + override button
              React.createElement('button', {
                onClick: () => setPicking(isPicking ? null : group.key),
                style: { background: isPicking ? col : `${col}22`, border: `1px solid ${col}44`, borderRadius: 8, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }
              },
                React.createElement('span', { style: { fontSize: 11, fontWeight: 600, color: isPicking ? "#fff" : col, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, repName),
                React.createElement('span', { style: { fontSize: 10, color: isPicking ? "rgba(255,255,255,0.7)" : col } }, isPicking ? "✕" : "▾")
              )
            )
          ),

          // Inline exercise picker dropdown
          isPicking && React.createElement('div', { style: { background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border2)", overflow: "hidden", marginBottom: 8 } },
            logged.map((e, i) => React.createElement('button', {
              key: e.id,
              onClick: () => setOverride(group.key, e.id),
              style: {
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", background: e.id === repId ? `${col}22` : "none",
                border: "none", borderBottom: i < logged.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left"
              }
            },
              React.createElement('span', { style: { fontSize: 13, fontWeight: e.id === repId ? 700 : 500, color: e.id === repId ? col : "var(--text)" } }, e.name),
              e.id === repId && React.createElement('span', { style: { fontSize: 11, color: col } }, "✓")
            ))
          )
        ),

        // Chart
        React.createElement('div', { style: { padding: "0 14px 12px" } },
          React.createElement(LineChart, { points: pts, color: col, height: 90, showDots: pts.length <= 20, yLabel: ` ${displayUnit}` })
        )
      );
    })
  );
}

// ── Strength Trend Panel ──────────────────────────────────────────────────────
function StrengthTrendPanel({ workouts, exercises, displayUnit }) {
  const [selected, setSelected] = React.useState(null);

  const loggedExercises = React.useMemo(() => {
    const map = {};
    for (const workout of workouts) {
      for (const entry of workout.entries) {
        const ex = exercises.find(e => e.id === entry.exerciseId);
        if (!ex) continue;
        let best = map[entry.exerciseId]?.best1rm || 0;
        for (const set of entry.sets) {
          const unit = set.unit || entry.unit || workout.unit || "kg";
          const wKg  = unit === "lbs" ? parseFloat(set.weight) * LBS_TO_KG : parseFloat(set.weight);
          const reps  = parseInt(set.reps);
          if (!wKg || !reps) continue;
          const rm = reps === 1 ? wKg : wKg * (1 + reps / 30);
          if (rm > best) best = rm;
        }
        if (best > 0) map[entry.exerciseId] = { name: ex.name, best1rm: best, muscles: ex.muscles };
      }
    }
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.best1rm - a.best1rm);
  }, [workouts, exercises]);

  if (!loggedExercises.length) return null;

  const selectedEx = selected ? exercises.find(e => e.id === selected) : null;
  const chartPoints = selected
    ? (() => {
        const pts = [];
        for (const w of [...workouts].sort((a, b) => a.date.localeCompare(b.date))) {
          const entry = w.entries.find(e => e.exerciseId === selected);
          if (!entry) continue;
          let best = 0;
          for (const s of entry.sets) {
            const unit = s.unit || entry.unit || w.unit || "kg";
            const wKg  = unit === "lbs" ? parseFloat(s.weight) * LBS_TO_KG : parseFloat(s.weight);
            const reps  = parseInt(s.reps);
            if (!wKg || !reps) continue;
            const rm = reps === 1 ? wKg : wKg * (1 + reps / 30);
            if (rm > best) best = rm;
          }
          if (best > 0) {
            const display = displayUnit === "lbs" ? Math.round(best * KG_TO_LBS * 10) / 10 : Math.round(best * 10) / 10;
            pts.push({ date: w.date, value: display });
          }
        }
        return pts;
      })()
    : [];

  const primaryColor = selectedEx ? getColorForMuscle(selectedEx.muscles?.[0] || "") : "var(--accent)";

  return React.createElement('div', { style: { background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" } },
    React.createElement('div', { style: { padding: "14px 14px 10px" } },
      React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 } }, "Strength Trends"),
      React.createElement('div', { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 } },
        loggedExercises.slice(0, 12).map(ex => {
          const col = getColorForMuscle(ex.muscles?.[0] || "");
          const isActive = selected === ex.id;
          const latestDisplay = displayUnit === "lbs"
            ? Math.round(ex.best1rm * KG_TO_LBS * 10) / 10
            : Math.round(ex.best1rm * 10) / 10;
          return React.createElement('button', {
            key: ex.id,
            onClick: () => setSelected(isActive ? null : ex.id),
            style: {
              background: isActive ? col : `${col}18`,
              border: `1px solid ${isActive ? col : col + "44"}`,
              borderRadius: 10, padding: "6px 10px", cursor: "pointer",
              fontFamily: "inherit", display: "flex", flexDirection: "column",
              alignItems: "flex-start", gap: 1, transition: "all 0.15s",
            },
          },
            React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: isActive ? "#fff" : col } }, ex.name),
            React.createElement('span', { style: { fontSize: 10, color: isActive ? "rgba(255,255,255,0.7)" : "var(--muted2)" } },
              `${latestDisplay} ${displayUnit}`)
          );
        })
      ),
      selected && chartPoints.length > 0 && React.createElement(LineChart, {
        points: chartPoints,
        color: primaryColor,
        height: 130,
        yLabel: ` ${displayUnit}`,
      })
    )
  );
}


