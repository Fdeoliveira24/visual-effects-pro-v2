(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const { clamp } = effectsPro._internals.helpers || {};

  function hexToRgba(hex, alpha) {
    try {
      const clean = String(hex || "").replace("#", "");
      if (clean.length !== 6) return `rgba(255,255,255,${alpha})`;
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    } catch {
      return `rgba(255,255,255,${alpha})`;
    }
  }

  function parseColor(color, fallback) {
    const fb = fallback || { r: 120, g: 180, b: 220, a: 0.48 };
    if (!color || typeof color !== "string") return fb;

    const rgba = color.match(/rgba?\\(([^)]+)\\)/i);
    if (rgba) {
      const parts = rgba[1].split(/[ ,]+/).map((v) => parseFloat(v));
      if (parts.length >= 3) {
        const c = typeof clamp === "function" ? clamp : (v) => v;
        return {
          r: c(parts[0], 0, 255),
          g: c(parts[1], 0, 255),
          b: c(parts[2], 0, 255),
          a: parts.length > 3 ? c(parts[3], 0, 1) : fb.a,
        };
      }
    }

    if (color[0] === "#") {
      const clean = color.replace("#", "");
      if (clean.length === 6) {
        return {
          r: parseInt(clean.substring(0, 2), 16),
          g: parseInt(clean.substring(2, 4), 16),
          b: parseInt(clean.substring(4, 6), 16),
          a: fb.a,
        };
      }
    }

    return fb;
  }

  effectsPro._internals.color = {
    hexToRgba,
    parseColor,
  };
})();
