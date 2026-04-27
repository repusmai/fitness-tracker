// ── App — Root Component ──────────────────────────────────────────────────────
// APP_VERSION is declared in index.html so pwa.js can also read it.

function App() {
  const [data,          setData]         = React.useState(() => loadData());
  const [tab,           setTab]          = React.useState("log");
  const [screen,        setScreen]       = React.useState(null); // detail | edit | edit-template
  const [active,        setActive]       = React.useState(null);
  const [showInstall,   setShowInstall]  = React.useState(true);
  const [isInstalled,   setIsInstalled]  = React.useState(false);
  const [isOnline,      setIsOnline]     = React.useState(() => navigator.onLine);
  const [updateReady,   setUpdateReady]  = React.useState(() => window._swUpdateReady || false);
  const [dataRestored,  setDataRestored] = React.useState(false);
  const [navHidden,     setNavHidden]    = React.useState(false);
  const [quickLogOpen,      setQuickLogOpen]      = React.useState(() => {
    const draft = loadDraft();
    return !!(draft?.workout?.entries);
  });
  const [quickLogTpl,       setQuickLogTpl]       = React.useState(null);
  const [quickLogMinimised, setQuickLogMinimised] = React.useState(false);
  const [showTplPicker,     setShowTplPicker]     = React.useState(false);

  const { workouts, exercises, bodyweight, templates } = data;

  // ── PWA install detection ─────────────────────────────────────────────────
  React.useEffect(() => {
    const check = () => {
      const installed =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(installed);
      if (installed) try { localStorage.setItem('_pwaInstalled', '1'); } catch (_) {}
    };
    if (localStorage.getItem('_pwaInstalled') === '1') setIsInstalled(true);
    check();
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  // ── Service worker update listener ────────────────────────────────────────
  React.useEffect(() => {
    const handler = () => setUpdateReady(true);
    window.addEventListener('swupdateready', handler);
    return () => window.removeEventListener('swupdateready', handler);
  }, []);

  // ── Auto-restore from IndexedDB if localStorage is empty ─────────────────
  React.useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) || dataRestored) return;
    loadLatestSnapshot().then(snapshot => {
      if (snapshot?.workouts?.length > 0) {
        setData(snapshot);
        saveData(snapshot);
        setDataRestored(true);
      }
    });
  }, []);

  // ── Online / offline listener ─────────────────────────────────────────────
  React.useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Bottom nav hide/show on scroll ────────────────────────────────────────
  const navLastY   = React.useRef(0);
  const navCleanup = React.useRef(null);

  React.useEffect(() => {
    if (screen) { setNavHidden(false); return; }
    const timer = setTimeout(() => {
      const el = document.querySelector('[data-main-scroll]');
      if (!el) return;
      navLastY.current = el.scrollTop;
      const onScroll = () => {
        const y  = el.scrollTop;
        const dy = y - navLastY.current;
        if (Math.abs(dy) < 6) return;
        const nearBottom = el.scrollHeight - y - el.clientHeight < 80;
        if (!nearBottom) setNavHidden(dy > 0 && y > 60);
        navLastY.current = y;
      };
      el.addEventListener('scroll', onScroll, { passive: true });
      navCleanup.current = () => el.removeEventListener('scroll', onScroll);
    }, 50);
    return () => { clearTimeout(timer); navCleanup.current?.(); };
  }, [tab, screen]);

  // ── Data helpers ──────────────────────────────────────────────────────────
  const setW   = fn => setData(prev => { const next = { ...prev, workouts:   typeof fn === "function" ? fn(prev.workouts)   : fn }; saveData(next); return next; });
  const setEx  = fn => setData(prev => { const next = { ...prev, exercises:  typeof fn === "function" ? fn(prev.exercises)  : fn }; saveData(next); return next; });
  const setBW  = bw => setData(prev => { const next = { ...prev, bodyweight: bw };                                                   saveData(next); return next; });
  const setTpl = fn => setData(prev => { const next = { ...prev, templates:  typeof fn === "function" ? fn(prev.templates || []) : fn }; saveData(next); return next; });
  const setPU  = u  => setData(prev => { const next = { ...prev, preferredUnit: u };                                                 saveData(next); return next; });
  const setShowTimer = v => setData(prev => { const next = { ...prev, showTimer: v }; saveData(next); return next; });

  // ── Workout CRUD ──────────────────────────────────────────────────────────
  function saveWorkout(workout) {
    setW(prev => {
      const exists = prev.find(x => x.id === workout.id);
      return exists ? prev.map(x => x.id === workout.id ? workout : x) : [...prev, workout];
    });
    setQuickLogOpen(false);
    setQuickLogTpl(null);
  }
  function deleteWorkout(id) { setW(prev => prev.filter(w => w.id !== id)); setScreen(null); setActive(null); }

  // ── Template CRUD ─────────────────────────────────────────────────────────
  function saveTemplate(workout, name) { setTpl(prev => [...prev, workoutToTemplate(workout, name)]); }
  function deleteTemplate(id)          { setTpl(prev => prev.filter(t => t.id !== id)); }
  function editTemplate(tpl)           { setActive(tpl); setScreen("edit-template"); }
  function saveTemplateEdit(edited) {
    setTpl(prev => prev.map(t => t.id === edited.id ? { ...t, name: edited.name, unit: edited.unit, entries: edited.entries } : t));
    setScreen(null); setActive(null);
  }

  // ── QuickLog ──────────────────────────────────────────────────────────────
  function openQuickLog(tpl) {
    if (quickLogOpen) {
      // Already in workout — restore it
      setQuickLogMinimised(false);
      setTab("log");
      return;
    }
    if (tpl) {
      // Started from a specific template card
      setQuickLogTpl(tpl);
      setQuickLogOpen(true);
      setQuickLogMinimised(false);
      setTab("log");
    } else if ((templates || []).length > 0) {
      // Show template picker
      setShowTplPicker(true);
    } else {
      // No templates — start blank
      setQuickLogTpl(null);
      setQuickLogOpen(true);
      setQuickLogMinimised(false);
      setTab("log");
    }
  }
  function cancelQuickLog() {
    setQuickLogOpen(false);
    setQuickLogTpl(null);
    setQuickLogMinimised(false);
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  // Preserve the log screen state when leaving, restore it when returning.
  const savedScreen = React.useRef(null);
  const savedActive = React.useRef(null);

  function switchTab(newTab) {
    if (newTab === tab) return;
    if (tab === "log" && screen) {
      // Leaving log with a screen open — save it
      savedScreen.current = screen;
      savedActive.current = active;
      setScreen(null);
      setActive(null);
    } else if (newTab === "log" && savedScreen.current) {
      // Returning to log — restore saved screen
      setScreen(savedScreen.current);
      setActive(savedActive.current);
      savedScreen.current = null;
      savedActive.current = null;
    }
    setTab(newTab);
  }

  // ── SW update ─────────────────────────────────────────────────────────────
  function applyUpdate() {
    const reg = window._swReg;
    if (reg?.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    else window.location.reload();
  }

  // ── Screen routing ────────────────────────────────────────────────────────
  const unit = data.preferredUnit || "kg";

  const currentScreen =
    screen === "edit"
      ? React.createElement(Editor, { workout: active, exercises, workouts, preferredUnit: unit, onSave: w => { saveWorkout(w); setScreen(null); setActive(null); setTab("log"); }, onCancel: () => setScreen("detail") })
    : screen === "edit-template"
      ? React.createElement(Editor, { workout: { ...active, date: active.date || today(), notes: active.notes || '' }, exercises, workouts, preferredUnit: unit, onSave: saveTemplateEdit, onCancel: () => { setScreen(null); setActive(null); }, isTemplate: true })
    : screen === "detail"
      ? React.createElement(Detail, { workout: active, exercises, onBack: () => { setScreen(null); setActive(null); }, onEdit: () => setScreen("edit"), onDelete: () => deleteWorkout(active.id), onSaveTemplate: saveTemplate, existingTemplate: (templates || []).some(t => t.createdFrom === active.id) })
    : null;

  const mainContent = currentScreen || (
    tab === "log"      ? React.createElement(Log,        { workouts, exercises, templates: templates || [], onQuickLog: openQuickLog, onView: w => { setActive(w); setScreen("detail"); }, onDeleteTemplate: deleteTemplate, onEditTemplate: editTemplate, showInstall: showInstall && !isInstalled && isOnline, onDismissInstall: () => setShowInstall(false), isOnline, updateReady, onApplyUpdate: applyUpdate, workoutActive: quickLogOpen })
    : tab === "stats"    ? React.createElement(StatsTab,   { workouts, exercises, bodyweight: bodyweight || 80, onSetBW: setBW, preferredUnit: unit, onSetPreferredUnit: setPU })
    : tab === "library"  ? React.createElement(Library,    { exercises, setExercises: setEx })
    : React.createElement(SettingsTab, { data, onRestore: d => { setData(d); saveData(d); }, isOnline, preferredUnit: unit, onSetPreferredUnit: setPU, appVersion: APP_VERSION, showTimer: data.showTimer !== false, onSetShowTimer: setShowTimer })
  );

  const TABS = [
    { id: "log",      label: "Log",      icon: "calendar" },
    { id: "stats",    label: "Stats",    icon: "chart"    },
    { id: "library",  label: "Library",  icon: "list"     },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return React.createElement('div', {
    style: { fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "var(--bg)", color: "var(--text)", height: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", overflow: "hidden" }
  },
    !isOnline && React.createElement('div', { style: { background: "#1c1410", borderBottom: "1px solid #92400e", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } },
      React.createElement('svg', { width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"#f59e0b",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round" },
        React.createElement('line', { x1:"1",y1:"1",x2:"23",y2:"23" }),
        React.createElement('path', { d:"M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" })),
      React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: "#f59e0b" } }, "Offline — all core features available")
    ),
    dataRestored && React.createElement('div', { style: { background: "#052e16", borderBottom: "1px solid #16a34a", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } },
      React.createElement(Icon, { name: "shield", size: 14, color: "#22c55e" }),
      React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: "#22c55e" } }, "Data auto-restored from local backup ✓")
    ),
    React.createElement('div', { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } }, mainContent),

    // Persistent QuickLog overlay
    quickLogOpen && !quickLogMinimised && React.createElement(QuickLog, {
      exercises, workouts,
      onSave:           w => { saveWorkout(w); setQuickLogMinimised(false); },
      onCancel:         cancelQuickLog,
      onCreateExercise: ex => setEx(prev => [...prev, ex]),
      preferredUnit:    unit,
      initialTemplate:  quickLogTpl,
      onMinimise:       () => { setQuickLogMinimised(true); },
      showTimer:        data.showTimer !== false,
    }),

    // Persistent "In Workout" pill — shown when QuickLog is minimised
    quickLogOpen && quickLogMinimised && React.createElement('button', {
      onClick: () => setQuickLogMinimised(false),
      style: { position: "fixed", bottom: "calc(66px + env(safe-area-inset-bottom))", left: "50%", transform: "translate(-50%, 0)", zIndex: 15, background: "var(--grad)", border: "none", borderRadius: 99, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.35)", maxWidth: 390, width: "calc(100% - 32px)", transition: "transform 0.25s ease" }
    },
      React.createElement(Icon, { name: "play", size: 14, color: "#fff" }),
      React.createElement('span', { style: { flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left" } }, "Workout in progress"),
      React.createElement('span', { style: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 } }, "Tap to return")
    ),

    // Template picker sheet — shown when Start is tapped and templates exist
    showTplPicker && React.createElement('div', { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 30, display: "flex", alignItems: "flex-end" } },
      React.createElement('div', { style: { background: "var(--surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "80vh", display: "flex", flexDirection: "column", border: "1px solid var(--border)" } },
        React.createElement('div', { style: { padding: "16px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } },
          React.createElement('span', { style: { fontWeight: 800, fontSize: 16, color: "var(--text)" } }, "Start Workout"),
          React.createElement('button', { onClick: () => setShowTplPicker(false), style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20, padding: 4 } }, "✕")
        ),
        React.createElement('div', { style: { overflowY: "auto", padding: "10px 12px 24px", display: "flex", flexDirection: "column", gap: 8 } },
          // Blank start option
          React.createElement('button', {
            onClick: () => { setShowTplPicker(false); setQuickLogTpl(null); setQuickLogOpen(true); setQuickLogMinimised(false); setTab("log"); },
            style: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }
          },
            React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "var(--accentSoft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              React.createElement(Icon, { name: "plus", size: 18, color: "var(--accent)" })),
            React.createElement('div', null,
              React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, "Blank Workout"),
              React.createElement('div', { style: { fontSize: 12, color: "var(--muted2)", marginTop: 2 } }, "Start from scratch")
            )
          ),
          // Template options
          (templates || []).map(tpl => React.createElement('button', {
            key: tpl.id,
            onClick: () => { setShowTplPicker(false); setQuickLogTpl(tpl); setQuickLogOpen(true); setQuickLogMinimised(false); setTab("log"); },            style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }
          },
            React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 } }, tpl.name),
            React.createElement('div', { style: { fontSize: 12, color: "var(--muted2)" } }, tpl.entries.length, " exercises · ", tpl.entries.reduce((a, e) => a + e.sets.length, 0), " sets")
          ))
        )
      )
    ),

    // Bottom nav — always accessible
    React.createElement('div', {
      style: { position: "fixed", bottom: 0, left: "50%", transform: navHidden ? "translate(-50%, 100%)" : "translate(-50%, 0)", width: "100%", maxWidth: 430, display: "flex", background: "var(--surface)", borderTop: "1px solid var(--border)", padding: `8px 0 max(12px, env(safe-area-inset-bottom))`, transition: "transform 0.25s ease", zIndex: 10 }
    },
      TABS.map(t => React.createElement('button', {
        key: t.id, onClick: () => switchTab(t.id),
        style: { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", fontFamily: "inherit" }
      },
        React.createElement(Icon, { name: t.icon, size: 22, color: tab === t.id ? "var(--accent)" : "var(--subtle)" }),
        React.createElement('span', { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: tab === t.id ? "var(--accent)" : "var(--subtle)" } }, t.label)
      ))
    )
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));
