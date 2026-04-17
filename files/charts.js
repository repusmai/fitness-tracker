// ── Line Chart (canvas-based) ─────────────────────────────────────────────────
function LineChart({ points, color = "var(--accent)", height = 120, showDots = true, yLabel = "kg" }) {
  const canvasRef = React.useRef(null);
  const wrapRef   = React.useRef(null);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !points.length) return;

    const dpr  = window.devicePixelRatio || 1;
    const W    = wrapRef.current ? wrapRef.current.clientWidth : 320;
    const H    = height;
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

    const sx = i => points.length < 2 ? pad.l + iW / 2 : pad.l + iW * i / (points.length - 1);
    const sy = v => pad.t + (max === min ? iH / 2 : iH * (1 - (v - min) / (max - min)));

    // Y-axis grid lines and labels
    for (let t = 0; t <= 4; t++) {
      const v = min + (max - min) * t / 4;
      const y = sy(v);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
      ctx.strokeStyle = "var(--surface2)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "var(--muted)"; ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(Math.round(v) + yLabel, pad.l - 4, y);
    }

    // X-axis date labels
    const fmtShort = iso => {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    };
    ctx.fillStyle = "var(--muted)"; ctx.font = "9px sans-serif"; ctx.textBaseline = "top";
    if (points.length > 1) {
      ctx.textAlign = "left";  ctx.fillText(fmtShort(points[0].date), pad.l, H - pad.b + 4);
      ctx.textAlign = "right"; ctx.fillText(fmtShort(points[points.length - 1].date), W - pad.r, H - pad.b + 4);
      if (points.length > 3) {
        const mid = Math.floor(points.length / 2);
        ctx.textAlign = "center"; ctx.fillText(fmtShort(points[mid].date), sx(mid), H - pad.b + 4);
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
    draw();
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
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

// ── Group Strength Charts ─────────────────────────────────────────────────────
function GroupStrengthCharts({ workouts, exercises, displayUnit }) {
  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 12 } },
    MUSCLE_GROUPS.map(group => {
      const pts = [];
      const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
      for (const w of sorted) {
        let best = 0;
        for (const entry of w.entries) {
          const ex = exercises.find(e => e.id === entry.exerciseId);
          if (!ex?.muscles?.some(m => group.muscles.includes(m))) continue;
          for (const s of entry.sets) {
            const unit = s.unit || entry.unit || w.unit || "kg";
            const wKg  = unit === "lbs" ? parseFloat(s.weight) * LBS_TO_KG : parseFloat(s.weight);
            const reps  = parseInt(s.reps);
            if (!wKg || !reps) continue;
            const rm = reps === 1 ? wKg : wKg * (1 + reps / 30);
            if (rm > best) best = rm;
          }
        }
        if (best > 0) {
          const display = displayUnit === "lbs" ? Math.round(best * KG_TO_LBS * 10) / 10 : Math.round(best * 10) / 10;
          pts.push({ date: w.date, value: display });
        }
      }
      if (!pts.length) return null;

      const col = resolveCssColor(group.color);
      const latest = pts[pts.length - 1];
      return React.createElement('div', {
        key: group.key,
        style: { background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" },
      },
        React.createElement('div', { style: { padding: "12px 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.06em" } }, group.label),
            React.createElement('div', { style: { fontSize: 18, fontWeight: 900, color: "var(--text)", marginTop: 2 } },
              `${latest.value} ${displayUnit}`)
          ),
          React.createElement('div', { style: { fontSize: 10, color: "var(--muted2)" } }, "best est. 1RM")
        ),
        React.createElement('div', { style: { padding: "0 14px 12px" } },
          React.createElement(LineChart, { points: pts, color: col, height: 90, showDots: pts.length <= 20, yLabel: ` ${displayUnit}` })
        )
      );
    }).filter(Boolean)
  );
}
