// ── Log Screen ────────────────────────────────────────────────────────────────
// The main workout history view with History and Templates sub-tabs.

function Log({ workouts, exercises, templates, onNew, onQuickLog, onView, onNewFromTemplate, onDeleteTemplate, showInstall, onDismissInstall, isOnline, updateReady, onApplyUpdate }) {
  const [section, setSection] = React.useState("log");
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const totalSets = countSetsWorkouts(workouts, exercises);

  const { ref: scrollRef, hidden: headerHidden } = useScrollHide();
  const headerRef = React.useRef(null);
  const [headerH, setHeaderH] = React.useState(0);
  React.useEffect(() => {
    const el = headerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight || 0));
    ro.observe(el); setHeaderH(el.offsetHeight || 0);
    return () => ro.disconnect();
  }, []);

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)", position: "relative" } },
    // Sticky header
    React.createElement('div', { ref: headerRef, style: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, transform: headerHidden ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.25s ease", willChange: "transform", background: "var(--bg)" } },
      React.createElement('div', { style: { padding: "24px 16px 0" } },
        React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 } }, "My Fitness"),
            React.createElement('div', { style: { fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" } }, "Workout Log")
          ),
          React.createElement('div', { style: { display: "flex", gap: 8, alignItems: "center" } },
            React.createElement(Btn, { variant: "primary", onClick: onQuickLog, style: { padding: "10px 14px", borderRadius: 14, gap: 6 } }, React.createElement(Icon, { name: "play", size: 15, color: "#fff" }), " Start"),
            React.createElement('button', { onClick: onNew, style: { width: 38, height: 38, borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted2)" } }, React.createElement(Icon, { name: "edit", size: 16, color: "var(--subtle)" }))
          )
        ),
        // Update ready banner
        updateReady && React.createElement('div', { style: { marginBottom: 12, background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 } },
          React.createElement(Icon, { name: "refresh", size: 16, color: "var(--accent-mid)" }),
          React.createElement('span', { style: { flex: 1, fontSize: 13, color: "#c7d2fe", fontWeight: 600 } }, "Update ready to install"),
          React.createElement('button', { onClick: onApplyUpdate, style: { background: "var(--grad)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "Reload")
        ),
        showInstall && React.createElement(InstallBanner, { onDismiss: onDismissInstall }),
        // Sub-tab switcher
        React.createElement('div', { style: { display: "flex", gap: 0, marginTop: 14, background: "var(--surface)", borderRadius: 12, padding: 3, border: "1px solid var(--border)" } },
          [{ id: "log", label: "History" }, { id: "templates", label: `Templates${templates.length ? ` (${templates.length})` : ""}` }].map(s => React.createElement('button', {
            key: s.id, onClick: () => setSection(s.id),
            style: { flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: section === s.id ? "var(--surface2)" : "transparent", color: section === s.id ? "var(--text)" : "var(--muted2)", transition: "all 0.15s" }
          }, s.label))
        )
      )
    ),

    // Scrollable content
    React.createElement('div', { ref: scrollRef, style: { flex: 1, overflowY: "auto", paddingTop: headerHidden ? 0 : headerH, transition: "padding-top 0.25s ease" } },
      // History section
      section === "log" && React.createElement(React.Fragment, null,
        React.createElement('div', { style: { padding: "14px 16px 0" } },
          React.createElement('div', { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
            [
              { l: "Sessions",   v: workouts.length,                              i: "fire" },
              { l: "Exercises",  v: workouts.reduce((a, w) => a + w.entries.length, 0), i: "dumbbell" },
              { l: "Total Sets", v: fmtSets(totalSets),                           i: "list" },
            ].map(s => React.createElement('div', { key: s.l, style: { background: "var(--surface)", borderRadius: 14, padding: "12px 10px", border: "1px solid var(--border)", textAlign: "center" } },
              React.createElement('div', { style: { color: "var(--accent)", marginBottom: 4 } }, React.createElement(Icon, { name: s.i, size: 18, color: "var(--accent)" })),
              React.createElement('div', { style: { fontSize: 22, fontWeight: 900, color: "var(--text)" } }, s.v),
              React.createElement('div', { style: { fontSize: 10, color: "var(--muted2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" } }, s.l)
            ))
          )
        ),
        React.createElement('div', { style: { padding: "12px 16px 16px" } },
          sorted.length === 0
            ? React.createElement('div', { style: { textAlign: "center", padding: "60px 20px" } },
                React.createElement('div', { style: { marginBottom: 16, opacity: 0.3 } }, React.createElement(Icon, { name: "dumbbell", size: 48, color: "var(--accent)" })),
                React.createElement('div', { style: { fontSize: 18, fontWeight: 700, color: "var(--muted)", marginBottom: 8 } }, "No workouts yet"),
                React.createElement('div', { style: { fontSize: 14, color: "var(--border2)" } }, "Tap + to log your first session"))
            : React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 10 } },
                sorted.map(w => {
                  const muscles = [...new Set(w.entries.flatMap(e => { const ex = exercises.find(x => x.id === e.exerciseId); return ex?.muscles || []; }))];
                  const sets = countSets(w.entries, exercises);
                  return React.createElement('button', { key: w.id, onClick: () => onView(w), style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%" } },
                    React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
                      React.createElement('div', { style: { fontWeight: 800, fontSize: 16, color: "var(--text)" } }, w.name),
                      React.createElement('div', { style: { fontSize: 12, color: "var(--muted2)", flexShrink: 0, marginLeft: 8 } }, formatDate(w.date))
                    ),
                    React.createElement('div', { style: { marginBottom: 8 } }, React.createElement(MusclePills, { muscles, max: 5 })),
                    React.createElement('div', { style: { display: "flex", gap: 14 } },
                      React.createElement('span', { style: { fontSize: 12, color: "var(--muted2)" } }, React.createElement('span', { style: { color: "var(--subtle)", fontWeight: 700 } }, w.entries.length), " exercises"),
                      React.createElement('span', { style: { fontSize: 12, color: "var(--muted2)" } }, React.createElement('span', { style: { color: "var(--subtle)", fontWeight: 700 } }, fmtSets(sets)), " sets")
                    )
                  );
                })
              )
        )
      ),

      // Templates section
      section === "templates" && React.createElement('div', { style: { padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 } },
        templates.length === 0
          ? React.createElement('div', { style: { textAlign: "center", padding: "60px 20px" } },
              React.createElement('div', { style: { marginBottom: 16, opacity: 0.3 } }, React.createElement(Icon, { name: "template", size: 48, color: "var(--accent)" })),
              React.createElement('div', { style: { fontSize: 18, fontWeight: 700, color: "var(--muted)", marginBottom: 8 } }, "No templates yet"),
              React.createElement('div', { style: { fontSize: 14, color: "var(--border2)", lineHeight: 1.6 } }, "Open any workout, go to the ", React.createElement('span', { style: { color: "var(--accent)", fontWeight: 600 } }, "Save as Template"), " tab, and save it."))
          : templates.map(tpl => {
              const muscles   = [...new Set(tpl.entries.flatMap(e => { const ex = exercises.find(x => x.id === e.exerciseId); return ex?.muscles || []; }))];
              const totalSets = tpl.entries.reduce((a, e) => a + e.sets.length, 0);
              return React.createElement('div', { key: tpl.id, style: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" } },
                React.createElement('div', { style: { padding: "14px 14px 10px" } },
                  React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } },
                    React.createElement('div', { style: { fontWeight: 800, fontSize: 16, color: "var(--text)", flex: 1, marginRight: 8 } }, tpl.name),
                    React.createElement('button', { onClick: () => onDeleteTemplate(tpl.id), style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, flexShrink: 0 } }, React.createElement(Icon, { name: "trash", size: 15 }))
                  ),
                  React.createElement('div', { style: { marginBottom: 8 } }, React.createElement(MusclePills, { muscles, max: 5 })),
                  React.createElement('div', { style: { display: "flex", gap: 14 } },
                    React.createElement('span', { style: { fontSize: 12, color: "var(--muted2)" } }, React.createElement('span', { style: { color: "var(--subtle)", fontWeight: 700 } }, tpl.entries.length), " exercises"),
                    React.createElement('span', { style: { fontSize: 12, color: "var(--muted2)" } }, React.createElement('span', { style: { color: "var(--subtle)", fontWeight: 700 } }, totalSets), " sets")
                  )
                ),
                React.createElement('div', { style: { padding: "10px 14px 14px" } },
                  React.createElement(Btn, { variant: "primary", onClick: () => onNewFromTemplate(tpl), style: { width: "100%", justifyContent: "center", padding: "11px", fontSize: 14 } }, React.createElement(Icon, { name: "play", size: 14, color: "#fff" }), " Start Workout")
                )
              );
            })
      )
    )
  );
}
