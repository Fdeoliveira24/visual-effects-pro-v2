(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const { clamp } = effectsPro._internals.helpers || {};

  function prefersReducedMotion(config) {
    try {
      const respect = !!(config && config.reducedMotionRespect);
      if (!respect) return false;
      return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }

  function getEffectiveDevicePixelRatio(config) {
    try {
      const raw = Number(window.devicePixelRatio) || 1;
      const max = Number(config && config.maxDevicePixelRatio);
      if (Number.isFinite(max) && max > 0) {
        return Math.max(1, Math.min(raw, max));
      }
      return Math.max(1, raw);
    } catch {
      return 1;
    }
  }

  function getMotionScale(config) {
    if (!prefersReducedMotion(config)) return { count: 1, duration: 1 };
    return { count: 0.4, duration: 0.6 };
  }

  function scaleCount(count, config, min) {
    const scale = getMotionScale(config).count;
    const value = Math.round(Number(count || 0) * scale);
    return Math.max(min || 1, value);
  }

  function scaleDuration(ms, config, min) {
    const scale = getMotionScale(config).duration;
    const value = Math.round(Number(ms || 0) * scale);
    return Math.max(min || 120, value);
  }

  function createElement(tag, props) {
    const el = document.createElement(tag);
    if (props && typeof props === "object") {
      Object.keys(props).forEach((key) => {
        const value = props[key];
        if (key === "style" && value && typeof value === "object") {
          Object.assign(el.style, value);
          return;
        }
        if (key === "className") {
          el.className = value;
          return;
        }
        if (key === "text") {
          el.textContent = value;
          return;
        }
        if (key === "html") {
          el.innerHTML = value;
          return;
        }
        try {
          el[key] = value;
        } catch {
          try {
            el.setAttribute(key, String(value));
          } catch {
            // ignore
          }
        }
      });
    }
    return el;
  }

  function injectStyles(cssText, id) {
    try {
      if (!cssText) return null;
      if (id) {
        const existing = document.getElementById(id);
        if (existing) return existing;
      }
      const style = document.createElement("style");
      if (id) style.id = id;
      style.textContent = cssText;
      (document.head || document.documentElement || document.body).appendChild(style);
      return style;
    } catch {
      return null;
    }
  }

  function resolveAssetUrl(path) {
    const baseUrl = (effectsPro && effectsPro.baseUrl) || "";
    const p = typeof path === "string" ? path.trim() : "";
    if (!p) return p;
    if (/^(?:[a-z]+:)?\/\//i.test(p)) return p;
    if (p.indexOf("data:") === 0 || p.indexOf("blob:") === 0) return p;
    if (p[0] === "/") return p;
    if (!baseUrl) return p;
    return baseUrl + p.replace(/^\.\//, "");
  }

  function ensureStylesheet(path, id, fallbackCssText) {
    try {
      const head = document.head || document.documentElement || document.body;
      if (!head) return null;

      const fallbackId = id ? `${id}-inline` : null;
      const ensureFallback = () => {
        try {
          if (!fallbackCssText) return;
          if (fallbackId && document.getElementById(fallbackId)) return;
          const style = document.createElement("style");
          if (fallbackId) style.id = fallbackId;
          style.textContent = fallbackCssText;
          head.appendChild(style);
        } catch {
          // ignore
        }
      };

      const existing = id ? document.getElementById(id) : null;
      if (existing) {
        if (
          fallbackCssText &&
          existing.tagName === "LINK" &&
          (!existing.dataset || existing.dataset.tdvFallbackBound !== "true")
        ) {
          try {
            existing.dataset.tdvFallbackBound = "true";
          } catch {
            // ignore
          }
          existing.addEventListener("error", ensureFallback, { once: true });
        }
        return existing;
      }

      const href = resolveAssetUrl(path);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      if (id) link.id = id;
      if (fallbackCssText) {
        link.addEventListener("error", ensureFallback, { once: true });
      }

      head.appendChild(link);
      return link;
    } catch {
      return null;
    }
  }

  function removeElement(el) {
    if (!el || !el.parentNode) return;
    try {
      el.parentNode.removeChild(el);
    } catch {
      // ignore
    }
  }

  function getViewportRect(el) {
    if (!el || typeof el.getBoundingClientRect !== "function") return null;
    try {
      return el.getBoundingClientRect();
    } catch {
      return null;
    }
  }

  function constrainNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const cl = typeof clamp === "function" ? clamp(n, min, max) : n;
    return cl;
  }

  effectsPro._internals.dom = {
    prefersReducedMotion,
    getEffectiveDevicePixelRatio,
    getMotionScale,
    scaleCount,
    scaleDuration,
    createElement,
    injectStyles,
    resolveAssetUrl,
    ensureStylesheet,
    removeElement,
    getViewportRect,
    constrainNumber,
  };
})();
