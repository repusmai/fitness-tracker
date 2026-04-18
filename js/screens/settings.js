// ── Settings Screen ───────────────────────────────────────────────────────────
// Unified preferences screen: Google Drive backup, local backup/restore,
// local snapshots, app updates, and appearance (theme).

// ── Theme Selector ────────────────────────────────────────────────────────────
function ThemeSelector() {
  const [current, setCurrent] = React.useState(() => loadTheme());

  function pick(id) { applyTheme(id); setCurrent(id); }

  return React.createElement('div', null,
    Object.entries(THEMES).map(([id, theme], i, arr) => {
      const isActive = current === id;
      return React.createElement('button', {
        key: id, onClick: () => pick(id),
        style: { width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }
      },
        React.createElement('div', { style: { display: "flex", gap: 5, flexShrink: 0 } },
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: 4, background: theme.bg, border: `2px solid ${theme.border2}`, flexShrink: 0 } }),
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: 4, background: theme.accent, flexShrink: 0 } }),
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: 4, background: theme.surface2, border: `2px solid ${theme.border2}`, flexShrink: 0 } })
        ),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? theme.accent : "var(--text)" } }, theme.emoji, "  ", theme.name)
        ),
        isActive && React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "var(--accent)", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
          React.createElement('polyline', { points: "20 6 9 17 4 12" }))
      );
    })
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ data, onRestore, isOnline, preferredUnit, onSetPreferredUnit }) {
  const [updateStatus,  setUpdateStatus]  = React.useState(null);
  const [updating,      setUpdating]      = React.useState(false);
  const [importState,   setImportState]   = React.useState(null);
  const [importPreview, setImportPreview] = React.useState(null);
  const [snapshots,     setSnapshots]     = React.useState([]);
  const [showSnapshots, setShowSnapshots] = React.useState(false);
  const [restoreSnap,   setRestoreSnap]   = React.useState(null);
  const [driveStatus,   setDriveStatus]   = React.useState(null);
  const [driveMsg,      setDriveMsg]      = React.useState("");
  const [driveRestore,  setDriveRestore]  = React.useState(null);
  const [autoBackup,    setAutoBackup]    = React.useState(() => getDrivePrefs().autoBackup || false);
  const [lastBackup,    setLastBackup]    = React.useState(() => { const t = getDrivePrefs().lastBackup; return t ? new Date(t) : null; });
  const [collapsed,     setCollapsed]     = React.useState({});
  const [clientId,     setClientId]     = React.useState(() => getGoogleClientId());
  const [clientIdSaved, setClientIdSaved] = React.useState(false);
  const clientIdSet = clientId.trim().length > 20;
  const fileRef = React.useRef(null);

  React.useEffect(() => { listSnapshots().then(snaps => setSnapshots(snaps)); }, []);

  React.useEffect(() => {
    if (!autoBackup || !isOnline || !clientIdSet) return;
    const prefs = getDrivePrefs();
    if (Date.now() - (prefs.lastBackup || 0) > 24 * 60 * 60 * 1000) {
      uploadToDrive(data).then(() => setLastBackup(new Date())).catch(() => {});
    }
  }, []);

  const toggleSection = id => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  function CollapsibleCard({ id, label, children }) {
    const isCollapsed = !!collapsed[id];
    return React.createElement('div', { style: { background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", overflow: "visible" } },
      React.createElement('button', { onClick: () => toggleSection(id), style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", borderBottom: isCollapsed ? "none" : "1px solid var(--border)" } },
        React.createElement('span', { style: { fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" } }, label),
        React.createElement('svg', { width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"var(--subtle)",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0} }, React.createElement('polyline', { points:"6 9 12 15 18 9" }))
      ),
      !isCollapsed && children
    );
  }

  function Row({ icon, title, subtitle, right, onClick, danger, iconBg }) {
    return React.createElement('button', { onClick, disabled: !onClick, style: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: onClick ? "pointer" : "default", fontFamily: "inherit", textAlign: "left", borderBottom: "1px solid var(--border)" } },
      React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: iconBg || (danger ? "rgba(239,68,68,0.12)" : "var(--surface2)"), display: "flex", alignItems: "center", justifyContent: "center" } },
        React.createElement(Icon, { name: icon, size: 18, color: danger ? "#ef4444" : "var(--subtle)" })),
      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
        React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: danger ? "#ef4444" : "var(--text)" } }, title),
        subtitle && React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, subtitle)
      ),
      right && React.createElement('div', { style: { flexShrink: 0, marginLeft: 4 } }, right)
    );
  }

  async function checkForUpdate() {
    setUpdating(true); setUpdateStatus("checking");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        await new Promise(r => setTimeout(r, 1500));
        if (reg.waiting) { reg.waiting.postMessage({ type: "SKIP_WAITING" }); setTimeout(() => window.location.reload(), 300); setUpdateStatus("updated"); }
        else { setUpdateStatus("latest"); setUpdating(false); }
      } else { window.location.reload(true); }
    } catch (_) { window.location.reload(true); }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.workouts || !parsed.exercises) throw new Error("Invalid format");
        setImportPreview(parsed); setImportState("confirm");
      } catch (_) { setImportState("error"); }
    };
    reader.readAsText(file); e.target.value = "";
  }

  function confirmImport() { onRestore(importPreview); setImportState("success"); setImportPreview(null); }

  async function handleDriveBackup() {
    if (!clientIdSet) { setDriveMsg("Please enter your Google Client ID in the Drive settings below"); setDriveStatus("error"); return; }
    setDriveStatus("backing-up"); setDriveMsg("");
    try {
      await uploadToDrive(data);
      const now = new Date(); setLastBackup(now);
      setDriveStatus("success"); setDriveMsg(`Backed up at ${now.toLocaleTimeString()}`);
    } catch (err) { setDriveStatus("error"); setDriveMsg(err.message || "Backup failed"); }
  }

  async function handleDriveRestore() {
    if (!clientIdSet) { setDriveMsg("Please enter your Google Client ID in the Drive settings below"); setDriveStatus("error"); return; }
    setDriveStatus("restoring"); setDriveMsg("");
    try {
      const result = await restoreFromDrive();
      setDriveRestore(result); setDriveStatus("restore-confirm");
    } catch (err) { setDriveStatus("error"); setDriveMsg(err.message || "Restore failed"); }
  }

  function confirmDriveRestore() {
    if (driveRestore?.data) { onRestore(driveRestore.data); setDriveStatus("success"); setDriveMsg("Data restored from Drive"); setDriveRestore(null); }
  }

  function toggleAutoBackup(v) { setAutoBackup(v); saveDrivePrefs({ ...getDrivePrefs(), autoBackup: v }); }

  async function restoreSnapshot(snap) {
    try { const d = JSON.parse(snap.data); onRestore(d); setRestoreSnap(null); setShowSnapshots(false); }
    catch (_) { alert("Snapshot data is corrupted"); }
  }

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" } },
    React.createElement('div', { style: { padding: "24px 16px 16px", borderBottom: "1px solid var(--border)" } },
      React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, "Preferences"),
      React.createElement('div', { style: { fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" } }, "Settings")
    ),
    React.createElement('div', { style: { overflowY: "auto", overflowX: "hidden", flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 14, WebkitOverflowScrolling: "touch" } },

      // ── Google Drive ──────────────────────────────────────────────────────
      React.createElement(CollapsibleCard, { id: "drive", label: "Google Drive Backup" },
        React.createElement('div', { style: { margin: "12px 16px 4px", display: "flex", flexDirection: "column", gap: 8 } },
          React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" } }, "OAuth Client ID"),
          React.createElement('div', { style: { fontSize: 11, color: "var(--muted)", marginBottom: 2, lineHeight: 1.5 } }, clientIdSet ? "✓ Client ID saved" : "Paste your Google OAuth 2.0 Client ID to enable Drive backup."),
          React.createElement('div', { style: { display: "flex", gap: 8 } },
            React.createElement('input', {
              type: "text",
              value: clientId,
              onChange: e => { setClientId(e.target.value); setClientIdSaved(false); },
              placeholder: "xxxxxxxx.apps.googleusercontent.com",
              style: { flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--text)", padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", minWidth: 0 }
            }),
            React.createElement('button', {
              onClick: () => { setGoogleClientId(clientId); setClientIdSaved(true); },
              style: { background: clientIdSet ? "var(--grad)" : "var(--surface2)", border: "none", borderRadius: 10, padding: "9px 14px", cursor: "pointer", color: clientIdSet ? "#fff" : "var(--subtle)", fontSize: 13, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }
            }, clientIdSaved ? "Saved ✓" : "Save")
          )
        ),
        React.createElement('div', { style: { padding: "14px 16px", borderBottom: "1px solid var(--border)" } },
          React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: driveStatus ? "10px" : 0 } },
            React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(26,115,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "cloud", size: 18, color: "#4285f4" })),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: "var(--text)" } }, "Back up to Drive"),
              React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, lastBackup ? `Last backup: ${lastBackup.toLocaleDateString()} ${lastBackup.toLocaleTimeString()}` : "No backup yet")
            ),
            React.createElement(Btn, { variant: "drive", onClick: handleDriveBackup, style: { padding: "7px 14px", fontSize: 12, flexShrink: 0 }, disabled: driveStatus === "backing-up" },
              driveStatus === "backing-up"
                ? React.createElement(React.Fragment, null, React.createElement('div', { style: { width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }), " Saving…")
                : React.createElement(React.Fragment, null, React.createElement(Icon, { name: "upload", size: 13, color: "#fff" }), " Backup"))
          ),
          driveStatus === "success" && React.createElement('div', { style: { fontSize: 12, color: "#22c55e", marginTop: 4 } }, "✓ ", driveMsg),
          driveStatus === "error"   && React.createElement('div', { style: { fontSize: 12, color: "#ef4444", marginTop: 4 } }, "✗ ", driveMsg),
          driveStatus === "restore-confirm" && driveRestore && React.createElement('div', { style: { background: "var(--accent-soft)", border: "1px solid var(--accent-glow)", borderRadius: 12, padding: "12px 14px", marginTop: 8 } },
            React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 } }, "Replace current data?"),
            React.createElement('div', { style: { fontSize: 12, color: "var(--subtle)", marginBottom: 10 } }, "Drive backup from ", React.createElement('strong', { style: { color: "var(--text)" } }, new Date(driveRestore.modifiedTime).toLocaleString()), " — contains ", React.createElement('strong', { style: { color: "var(--text)" } }, driveRestore.data?.workouts?.length || 0, " workouts"), "."),
            React.createElement('div', { style: { display: "flex", gap: 8 } },
              React.createElement('button', { onClick: () => { setDriveStatus(null); setDriveRestore(null); }, style: { flex: 1, background: "var(--surface2)", border: "none", borderRadius: 10, padding: "9px", cursor: "pointer", color: "var(--subtle)", fontSize: 13, fontWeight: 600, fontFamily: "inherit" } }, "Cancel"),
              React.createElement('button', { onClick: confirmDriveRestore, style: { flex: 1, background: "var(--grad)", border: "none", borderRadius: 10, padding: "9px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit" } }, "Restore")
            )
          )
        ),
        React.createElement('div', { style: { padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 } },
          React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(26,115,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "download", size: 18, color: "#4285f4" })),
          React.createElement('div', { style: { flex: 1 } }, React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: "var(--text)" } }, "Restore from Drive"), React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, "Load your latest Drive backup")),
          React.createElement(Btn, { variant: "secondary", onClick: handleDriveRestore, style: { padding: "7px 14px", fontSize: 12, flexShrink: 0 }, disabled: driveStatus === "restoring" },
            driveStatus === "restoring"
              ? React.createElement(React.Fragment, null, React.createElement('div', { style: { width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "var(--subtle)", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }), " Loading…")
              : "Restore")
        ),
        React.createElement('div', { style: { padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 } },
          React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(26,115,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "refresh", size: 18, color: "#4285f4" })),
          React.createElement('div', { style: { flex: 1 } }, React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: "var(--text)" } }, "Auto-backup daily"), React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, "Silently backs up on app open if >24h since last backup")),
          React.createElement('div', { onClick: () => toggleAutoBackup(!autoBackup), style: { width: 44, height: 24, borderRadius: 12, background: autoBackup ? "var(--accent)" : "var(--border2)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 } },
            React.createElement('div', { style: { position: "absolute", top: 2, left: autoBackup ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" } }))
        )
      ),

      // ── Local Backup ──────────────────────────────────────────────────────
      React.createElement(CollapsibleCard, { id: "localbackup", label: "Local Backup" },
        React.createElement(Row, {
          icon: "download", title: "Export backup",
          subtitle: `Downloads a .json file — ${data?.workouts?.length || 0} workouts, ${data?.exercises?.length || 0} exercises`,
          onClick: handleExport,
          right: React.createElement('div', { style: { background: "var(--grad)", borderRadius: 8, padding: "6px 12px" } }, React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: "#fff" } }, "Export")),
        }),
        React.createElement('div', { style: { borderBottom: "1px solid var(--border)" } },
          React.createElement('button', { onClick: () => fileRef.current?.click(), style: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" } },
            React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "upload", size: 18, color: "var(--subtle)" })),
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: "var(--text)" } }, "Restore from file"),
              React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, importState === "success" ? "✓ Restored successfully" : importState === "error" ? "⚠ Invalid file" : "Load a previously exported .json file")
            ),
            React.createElement('div', { style: { background: "var(--surface2)", borderRadius: 8, padding: "6px 12px", flexShrink: 0 } }, React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: "var(--subtle)" } }, "Choose file"))
          ),
          React.createElement('input', { ref: fileRef, type: "file", accept: ".json", onChange: handleFileSelect, style: { display: "none" } }),
          importState === "confirm" && importPreview && React.createElement('div', { style: { margin: "0 14px 14px", background: "var(--accent-soft)", border: "1px solid var(--accent-glow)", borderRadius: 12, padding: "14px" } },
            React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 } }, "Replace current data?"),
            React.createElement('div', { style: { fontSize: 12, color: "var(--subtle)", marginBottom: 12, lineHeight: 1.5 } }, "This backup contains ", React.createElement('strong', { style: { color: "var(--text)" } }, importPreview.workouts?.length || 0, " workouts"), " and ", React.createElement('strong', { style: { color: "var(--text)" } }, importPreview.exercises?.length || 0, " exercises"), ". Your current data will be overwritten."),
            React.createElement('div', { style: { display: "flex", gap: 8 } },
              React.createElement('button', { onClick: () => { setImportState(null); setImportPreview(null); }, style: { flex: 1, background: "var(--surface2)", border: "none", borderRadius: 10, padding: "9px", cursor: "pointer", color: "var(--subtle)", fontSize: 13, fontWeight: 600, fontFamily: "inherit" } }, "Cancel"),
              React.createElement('button', { onClick: confirmImport, style: { flex: 1, background: "var(--grad)", border: "none", borderRadius: 10, padding: "9px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit" } }, "Restore")
            )
          )
        )
      ),

      // ── Local Snapshots ───────────────────────────────────────────────────
      React.createElement(CollapsibleCard, { id: "snapshots", label: "Local Snapshots" },
        React.createElement('div', { style: { borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 } },
          React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, React.createElement(Icon, { name: "history", size: 18, color: "var(--accent-mid)" })),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: "var(--text)" } }, "Local Snapshots"),
            React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, "Auto-saved after every change · last ", Math.min(snapshots.length, MAX_SNAPSHOTS), " kept")
          ),
          React.createElement('svg', { width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"var(--subtle)",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{transform:showSnapshots?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",cursor:"pointer",flexShrink:0},onClick:()=>setShowSnapshots(v=>!v) }, React.createElement('polyline', { points:"6 9 12 15 18 9" }))
        ),
        showSnapshots && React.createElement('div', null,
          snapshots.length === 0 && React.createElement('div', { style: { padding: "16px", fontSize: 13, color: "var(--muted)", textAlign: "center" } }, "No snapshots yet — make any change to create one."),
          snapshots.map((snap, i) => {
            let snapData; try { snapData = JSON.parse(snap.data); } catch (_) { snapData = null; }
            const isPending = restoreSnap === snap.id;
            return React.createElement('div', { key: snap.id, style: { borderBottom: i < snapshots.length - 1 ? "1px solid var(--border)" : "none" } },
              React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" } },
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: "var(--text2)" } }, new Date(snap.ts).toLocaleString()),
                  snapData && React.createElement('div', { style: { fontSize: 11, color: "var(--muted)", marginTop: 2 } }, snapData.workouts?.length || 0, " workouts · ", snapData.exercises?.length || 0, " exercises")
                ),
                React.createElement('button', { onClick: () => setRestoreSnap(isPending ? null : snap.id), style: { background: isPending ? "var(--accent-glow)" : "var(--surface2)", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: isPending ? "var(--accent-mid)" : "var(--subtle)", fontSize: 12, fontWeight: 600, fontFamily: "inherit" } },
                  i === 0 ? "(latest) Restore" : "Restore")
              ),
              isPending && React.createElement('div', { style: { margin: "0 16px 12px", background: "var(--accent-soft)", border: "1px solid var(--accent-glow)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
                React.createElement('span', { style: { fontSize: 12, color: "var(--accent-light)" } }, "Replace current data with this snapshot?"),
                React.createElement('div', { style: { display: "flex", gap: 6, flexShrink: 0 } },
                  React.createElement('button', { onClick: () => setRestoreSnap(null), style: { background: "var(--surface2)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "var(--subtle)", fontSize: 12, fontFamily: "inherit", fontWeight: 600 } }, "Cancel"),
                  React.createElement('button', { onClick: () => restoreSnapshot(snap), style: { background: "var(--accent)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "#fff", fontSize: 12, fontFamily: "inherit", fontWeight: 700 } }, "Restore")
                )
              )
            );
          })
        )
      ),

      // ── App / Updates ─────────────────────────────────────────────────────
      React.createElement(CollapsibleCard, { id: "app", label: "App" },
        React.createElement('div', { style: { borderBottom: "1px solid var(--border)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 } },
          React.createElement('div', { style: { width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
            React.createElement('svg', { width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"var(--accent-mid)",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round" }, React.createElement('path', { d:"M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" }), React.createElement('line', { x1:"4",y1:"21",x2:"20",y2:"21" }))
          ),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: "var(--text)" } }, "Default weight unit"),
            React.createElement('div', { style: { fontSize: 12, color: "var(--muted)", marginTop: 1 } }, "Used for all new workouts and exercises")
          ),
          React.createElement(UnitToggle, { unit: preferredUnit || "kg", onChange: onSetPreferredUnit })
        ),
        React.createElement(Row, {
          icon: "download", title: "Check for updates",
          subtitle: !isOnline ? "No internet connection" : updateStatus === "checking" ? "Checking…" : updateStatus === "updated" ? "Update found — reloading…" : updateStatus === "latest" ? "You're on the latest version ✓" : "Reload the app to fetch any new features",
          onClick: isOnline && !updating ? checkForUpdate : null,
          right: !isOnline
            ? React.createElement('div', { style: { background: "var(--surface2)", borderRadius: 8, padding: "6px 12px" } }, React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: "var(--muted)" } }, "Offline"))
            : updating
              ? React.createElement('div', { style: { width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" } })
              : React.createElement('div', { style: { background: "var(--grad)", borderRadius: 8, padding: "6px 12px" } }, React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: "#fff" } }, "Update")),
        })
      ),

      // ── Appearance ────────────────────────────────────────────────────────
      React.createElement(CollapsibleCard, { id: "theme", label: "Appearance" },
        React.createElement(ThemeSelector, null)
      ),

      React.createElement('div', { style: { textAlign: "center", padding: "8px 0 4px" } },
        React.createElement('span', { style: { fontSize: 11, color: "var(--border2)" } }, "Fitness Tracker · v27"))
    ),
    React.createElement('style', null, `@keyframes spin{to{transform:rotate(360deg)}}`)
  );
}
