// ── Install Banner ────────────────────────────────────────────────────────────
// Prompts the user to install the PWA to their home screen.
// Handles both Android (native prompt) and iOS (manual instructions).

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

function InstallBanner({ onDismiss }) {
  const [promptReady, setPromptReady] = React.useState(!!window._installPrompt);
  const [installing,  setInstalling]  = React.useState(false);
  const [showManual,  setShowManual]  = React.useState(false);

  React.useEffect(() => {
    window._onInstallPromptReady = () => setPromptReady(true);
    return () => { window._onInstallPromptReady = null; };
  }, []);

  // iOS — show manual steps
  if (isIOS) {
    return React.createElement('div', {
      style: { margin: "12px 0 0", background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))", border: "1px solid var(--accent-glow)", borderRadius: 16, padding: "14px" }
    },
      React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8 } },
          React.createElement('div', { style: { width: 32, height: 32, borderRadius: 8, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center" } },
            React.createElement(Icon, { name: "download", size: 16, color: "#fff" })),
          React.createElement('div', null,
            React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, "Add to Home Screen"),
            React.createElement('div', { style: { fontSize: 11, color: "var(--subtle)" } }, "Works offline · No browser bar"))
        ),
        React.createElement('button', { onClick: onDismiss, style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted2)", padding: 4 } },
          React.createElement(Icon, { name: "close", size: 16 }))
      ),
      React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 8 } },
        [
          { step: "1", text: "Tap the", highlight: "Share button", icon: "⬆️", note: "at the bottom of Safari" },
          { step: "2", text: "Scroll down and tap", highlight: "Add to Home Screen", icon: "➕" },
          { step: "3", text: "Tap", highlight: "Add", icon: "✓", note: "in the top right" },
        ].map(s => React.createElement('div', { key: s.step, style: { display: "flex", alignItems: "center", gap: 10 } },
          React.createElement('div', { style: { width: 22, height: 22, borderRadius: "50%", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
            React.createElement('span', { style: { fontSize: 11, fontWeight: 800, color: "var(--accent-light)" } }, s.step)),
          React.createElement('div', { style: { fontSize: 13, color: "var(--subtle)", lineHeight: 1.4 } },
            s.text, " ", React.createElement('strong', { style: { color: "var(--text)" } }, s.icon, " ", s.highlight), s.note && React.createElement('span', null, " ", s.note))
        ))
      )
    );
  }

  // Android — show manual fallback instructions
  if (showManual) {
    return React.createElement('div', {
      style: { margin: "12px 0 0", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16, padding: "14px" }
    },
      React.createElement('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
        React.createElement('span', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, "Install manually"),
        React.createElement('button', { onClick: onDismiss, style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted2)" } },
          React.createElement(Icon, { name: "close", size: 16 }))
      ),
      React.createElement('div', { style: { fontSize: 13, color: "var(--subtle)", lineHeight: 1.7 } },
        'In Chrome tap ', React.createElement('strong', { style: { color: "var(--text)" } }, "⋮ menu"),
        ' → ', React.createElement('strong', { style: { color: "var(--text)" } }, '"Install app"'))
    );
  }

  // Android — native prompt
  return React.createElement('div', {
    style: { margin: "12px 0 0", background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))", border: "1px solid var(--accent-glow)", borderRadius: 16, padding: "14px" }
  },
    React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } },
      React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8 } },
        React.createElement('div', { style: { width: 32, height: 32, borderRadius: 8, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center" } },
          React.createElement(Icon, { name: "download", size: 16, color: "#fff" })),
        React.createElement('div', null,
          React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, "Install App"),
          React.createElement('div', { style: { fontSize: 11, color: "var(--subtle)" } }, "Works offline · No browser bar"))
      ),
      React.createElement('button', { onClick: onDismiss, style: { background: "none", border: "none", cursor: "pointer", color: "var(--muted2)" } },
        React.createElement(Icon, { name: "close", size: 16 }))
    ),
    React.createElement(Btn, {
      variant: "green",
      onClick: async () => {
        if (!window._installPrompt) { setShowManual(true); return; }
        setInstalling(true);
        window._installPrompt.prompt();
        const { outcome } = await window._installPrompt.userChoice;
        if (outcome === "accepted") { window._installPrompt = null; onDismiss(); }
        setInstalling(false);
      },
      style: { width: "100%", justifyContent: "center", padding: "9px", fontSize: 13 },
      disabled: installing,
    },
      React.createElement(Icon, { name: "download", size: 14 }), " ",
      installing ? "Installing…" : promptReady ? "Install Now" : "How to Install"
    ),
    !promptReady && React.createElement('div', { style: { fontSize: 11, color: "var(--muted2)", marginTop: 8, textAlign: "center" } },
      "Keep the page open ~30s for the install button to activate")
  );
}
