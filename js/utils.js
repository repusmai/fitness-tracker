// ── Utility Functions ─────────────────────────────────────────────────────────
// Pure utilities: unit conversion, date/number formatting, duration, React hooks.
// Depends on: KG_TO_LBS, LBS_TO_KG from constants.js; React globals.

const { useState, useEffect, useRef } = React;

// ── Unit Conversion ───────────────────────────────────────────────────────────

function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'kg' ? value * KG_TO_LBS : value * LBS_TO_KG;
}

// ── Date Helpers ──────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Number Formatting ─────────────────────────────────────────────────────────

function formatSets(count) {
  // Display numbers >= 1000 with a single decimal (e.g. 1.2k)
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count;
}

// Alias used throughout the codebase
const fmtSets = formatSets;

// ── Duration Formatting ───────────────────────────────────────────────────────

const MAX_WORKOUT_SECS = 3 * 60 * 60; // 3 hours

function fmtDuration(secs) {
  if (!secs && secs !== 0) return null;
  if (secs > MAX_WORKOUT_SECS) return "3:00:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function fmtDurationShort(secs) {
  if (!secs && secs !== 0) return null;
  if (secs > MAX_WORKOUT_SECS) return "3h+";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m || 0}m`;
}

// ── React Hooks ───────────────────────────────────────────────────────────────

/**
 * Hides a fixed header when the user scrolls down, reveals it on scroll up.
 * Returns { ref, hidden } — attach ref to the scrollable container.
 */
function useScrollHide(threshold = 8) {
  const ref   = useRef(null);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      if (Math.abs(y - lastY.current) < threshold) return;
      const nearBottom = el.scrollHeight - y - el.clientHeight < 60;
      if (!nearBottom) setHidden(y > lastY.current && y > 50);
      lastY.current = y;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return { ref, hidden };
}

/**
 * Tracks the height of the on-screen keyboard via the Visual Viewport API.
 * Returns a pixel value representing how much the keyboard has pushed the viewport up.
 */
function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;
    const update = () => {
      const height = Math.max(
        0,
        window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
      );
      setKeyboardHeight(height);
    };
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, []);

  return keyboardHeight;
}
