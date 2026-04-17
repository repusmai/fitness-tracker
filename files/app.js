// ── App — Root Component ──────────────────────────────────────────────────────
// Wires together all screens and manages top-level state.

function App() {
  const [data,         setData]         = React.useState(() => loadData());
  const [tab,          setTab]          = React.useState("log");
  const [screen,       setScreen]       = React.useState(null);
  const [active,       setActive]       = React.useState(null);
  const [showInstall,  setShowInstall]  = React.useState(true);
  const [isInstalled,  setIsInstalled]  = React.useState(false);
  const [isOnline,     setIsOnline]     = React.useState(() => navigator.onLine);
  const [updateReady,  setUpdateReady]  = React.useState(() => window._swUpdateReady || false);
  const [dataRestored, setDataRestored] = React.useState(false);

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
    const hasData = !!localStorage.getItem(STORAGE_KEY);
    if (!hasData && !dataRestored) {
      loadLatestSnapshot().then(snapshot => {
        if (snapshot?.workouts?.length > 0) {
          setData(snapshot);
          saveData(snapshot);
          setDataRestored(true);
          console.log('[FitnessTracker] Auto-restored from IndexedDB snapshot');
        }
      });
    }
  }, []);

  // ── Online / offline listener ─────────────────────────────────────────────
  React.useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Data update helpers ───────────────────────────────────────────────────
  const setW   = fn => setData(prev => { const next = { ...prev, workouts:   typeof fn === "function" ? fn(prev.workouts)   : fn }; saveData(next); return next; });
  const setEx  = fn => setData(prev => { const next = { ...prev, exercises:  typeof fn === "function" ? fn(prev.exercises)  : fn }; saveData(next); return next; });
  const setBW  = bw => setData(prev => { const next = { ...prev, bodyweight: bw };                                                   saveData(next); return next; });
  const setTpl = fn => setData(prev => { const next = { ...prev, templates:  typeof fn === "function" ? fn(prev.templates || []) : fn }; saveData(next); return next; });
  const setPU  = u  => setData(prev => { const next = { ...prev, preferredUnit: u };                                                 saveData(next); return next; });

  // ── Workout CRUD ──────────────────────────────────────────────────────────
  function saveWorkout(workout) {
    setW(prev => {
      const exists = prev.find(x => x.id === workout.id);
      return exists ? prev.map(x => x.id === workout.id ? workout : x) : [...prev, workout];
    });
    setScreen(null); setActive(null); setTab("log");
  }
  function deleteWorkout(id) { setW(prev => prev.filter(w => w.id !== id)); setScreen(null); setActive(null); }
  function saveTemplate(workout, name) { setTpl(prev => [...prev, workoutToTemplate(workout, name)]); }
  function deleteTemplate(id) { setTpl(prev => prev.filter(t => t.id !== id)); }
  function startFromTemplate(tpl) {
    const w = templateToWorkout(tpl, data.preferredUnit || "kg");
    window._pendingTemplateWorkout = w;
    setActive(w);
    setScreen("new-from-template");
  }

  // ── SW update ─────────────────────────────────────────────────────────────
  function applyUpdate() {
    const reg = window._swReg;
    if (reg?.waiting) { reg.waiting.postMessage({ type: "SKIP_WAITING" }); }
    else { window.location.reload(); }
  }

  // ── Active workout for template start ────────────────────────────────────
  const activeWorkout = active || (screen === "new-from-template" ? window._pendingTemplateWorkout : null);

  // ── Screen routing ────────────────────────────────────────────────────────
  const currentScreen =
    screen === "quicklog"
      ? React.createElement(QuickLog, {
          exercises, workouts, templates: templates || [],
          preferredUnit: data.preferredUnit || "kg",
          onSave: w => { setW(prev => { const e = prev.find(x => x.id === w.id); return e ? prev.map(x => x.id === w.id ? w : x) : [...prev, w]; }); setScreen(null); },
          onCancel: () => setScreen(null),
          onCreateExercise: ex => setEx(prev => [...prev, ex]),
        })
    : screen === "new"
      ? React.createElement(Editor, { exercises, workouts, preferredUnit: data.preferredUnit || "kg", onSave: saveWorkout, onCancel: () => setScreen(null) })
    : screen === "new-from-template" && activeWorkout
      ? React.createElement(Editor, { workout: activeWorkout, exercises, workouts, preferredUnit: data.preferredUnit || "kg", onSave: saveWorkout, onCancel: () => { setScreen(null); setActive(null); window._pendingTemplateWorkout = null; } })
    : screen === "edit"
      ? React.createElement(Editor, { workout: active, exercises, workouts, preferredUnit: data.preferredUnit || "kg", onSave: saveWorkout, onCancel: () => setScreen("detail") })
    : screen === "detail"
      ? React.createElement(Detail, { workout: active, exercises, onBack: () => { setScreen(null); setActive(null); }, onEdit: () => setScreen("edit"), onDelete: () => deleteWorkout(active.id), onSaveTemplate: saveTemplate, existingTemplate: (templates || []).some(t => t.createdFrom === active.id) })
    : null;

  const mainContent = currentScreen || (
    tab === "log"
      ? React.createElement(Log, { workouts, exercises, templates: templates || [], onNew: () => setScreen("new"), onQuickLog: () => setScreen("quicklog"), onView: w => { setActive(w); setScreen("detail"); }, onNewFromTemplate: startFromTemplate, onDeleteTemplate: deleteTemplate, showInstall: showInstall && !isInstalled && isOnline, onDismissInstall: () => setShowInstall(false), isOnline, updateReady, onApplyUpdate: applyUpdate })
    : tab === "stats"
      ? React.createElement(StatsTab, { workouts, exercises, bodyweight: bodyweight || 80, onSetBW: setBW, preferredUnit: data.preferredUnit || "kg", onSetPreferredUnit: setPU })
    : tab === "library"
      ? React.createElement(Library, { exercises, setExercises: setEx })
      : React.createElement(SettingsTab, { data, onRestore: d => { setData(d); saveData(d); }, isOnline, preferredUnit: data.preferredUnit || "kg", onSetPreferredUnit: setPU })
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
    // Offline banner
    !isOnline && React.createElement('div', { style: { background: "#1c1410", borderBottom: "1px solid #92400e", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } },
      React.createElement('svg', { width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"#f59e0b",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round" }, React.createElement('line', { x1:"1",y1:"1",x2:"23",y2:"23" }), React.createElement('path', { d:"M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" })),
      React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: "#f59e0b" } }, "Offline — all core features available")
    ),

    // Data restored banner
    dataRestored && React.createElement('div', { style: { background: "#052e16", borderBottom: "1px solid #16a34a", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } },
      React.createElement(Icon, { name: "shield", size: 14, color: "#22c55e" }),
      React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: "#22c55e" } }, "Data auto-restored from local backup ✓")
    ),

    // Main content
    React.createElement('div', { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } }, mainContent),

    // Bottom nav bar (hidden when a full-screen modal is open)
    !screen && React.createElement('div', {
      style: { display: "flex", background: "var(--surface)", borderTop: "1px solid var(--border)", padding: `8px 0 max(12px, env(safe-area-inset-bottom))` }
    },
      TABS.map(t => React.createElement('button', {
        key: t.id, onClick: () => setTab(t.id),
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
