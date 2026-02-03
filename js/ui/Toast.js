(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  function ensureToastHost() {
    const existing = document.getElementById("effectsProToastHost");
    if (existing) return existing;
    const host = document.createElement("div");
    host.id = "effectsProToastHost";
    host.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483647;display:grid;gap:10px;pointer-events:none;";
    (document.body || document.documentElement).appendChild(host);
    return host;
  }

  function show(message, type, durationMs) {
    try {
      const host = ensureToastHost();
      const el = document.createElement("div");
      const safeType = type || "info";
      let border = "rgba(45,212,191,0.9)";
      if (safeType === "error") {
        border = "rgba(248,113,113,0.9)";
      } else if (safeType === "success") {
        border = "rgba(34,197,94,0.9)";
      }
      el.style.cssText = `max-width:340px;background:rgba(15,23,42,0.9);border:1px solid ${
        border
      };color:#eef2f8;padding:10px 12px;border-radius:12px;box-shadow:0 14px 30px rgba(0,0,0,0.35);opacity:0;transform:translateY(10px);transition:opacity 180ms ease,transform 180ms ease;pointer-events:none;font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;`;
      el.textContent = String(message || "");
      host.appendChild(el);
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
      const hold = Number(durationMs);
      const ms = Number.isFinite(hold) ? hold : 2200;
      setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(10px)";
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 220);
      }, ms);
    } catch {
      // ignore
    }
  }

  effectsPro._internals.ui = effectsPro._internals.ui || {};
  effectsPro._internals.ui.Toast = { show };
})();
