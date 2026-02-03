/**
 * Visual Effects Pro for 3DVista Tours
 * Loader entrypoint (no build step).
 *
 * This file loads the modular ES6 codebase in-order and then exposes:
 *   window.effectsPro
 */
(function () {
  "use strict";

  const global = window;
  global.effectsPro = global.effectsPro || {};
  const effectsPro = global.effectsPro;
  if (effectsPro._bootstrapped) return;
  effectsPro._bootstrapped = true;

  const deferred = {};
  effectsPro.ready =
    effectsPro.ready ||
    new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
  effectsPro._deferredReady = deferred;

  function findBaseUrl() {
    try {
      if (document.currentScript && document.currentScript.src) {
        return document.currentScript.src.replace(/[^/]*$/, "");
      }
    } catch {
      // ignore
    }

    try {
      const scripts = document.getElementsByTagName("script");
      for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i] && scripts[i].src ? String(scripts[i].src) : "";
        if (!src) continue;
        if (src.indexOf("effects-core.js") !== -1) {
          return src.replace(/[^/]*$/, "");
        }
      }
    } catch {
      // ignore
    }
    return "";
  }

  const baseUrl = findBaseUrl();
  effectsPro.baseUrl = baseUrl;
  effectsPro._internals = effectsPro._internals || {};
  effectsPro._internals.baseUrl = baseUrl;

  function ensureStylesheet(relativePath, id, fallbackScriptPath) {
    try {
      const head = document.head || document.documentElement || document.body;
      if (!head) return;

      const loadFallbackScript = () => {
        try {
          if (!fallbackScriptPath) return;
          const scriptId = `${id || "tdv-effects-pro"}-css-fallback`;
          if (document.getElementById(scriptId)) return;
          const script = document.createElement("script");
          script.id = scriptId;
          script.async = true;
          script.src = /^(?:[a-z]+:)?\/\//i.test(fallbackScriptPath)
            ? fallbackScriptPath
            : baseUrl + fallbackScriptPath;
          head.appendChild(script);
        } catch {
          // ignore
        }
      };

      const existing = id ? document.getElementById(id) : null;
      if (existing) {
        if (
          fallbackScriptPath &&
          existing.tagName === "LINK" &&
          (!existing.dataset || existing.dataset.tdvFallbackBound !== "true")
        ) {
          try {
            existing.dataset.tdvFallbackBound = "true";
          } catch {
            // ignore
          }
          existing.addEventListener("error", loadFallbackScript, { once: true });
        }
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = baseUrl + relativePath;
      if (id) link.id = id;
      if (fallbackScriptPath) {
        link.addEventListener("error", loadFallbackScript, { once: true });
      }
      head.appendChild(link);
    } catch {
      // ignore
    }
  }

  function preloadScript(relativePath) {
    try {
      const head = document.head || document.documentElement || document.body;
      if (!head) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "script";
      link.href = baseUrl + relativePath;
      head.appendChild(link);
    } catch {
      // ignore
    }
  }

  // Base runtime styles for CSS overlays (loaded early to avoid FOUC/race on first effect).
  ensureStylesheet(
    "css/effects-runtime.css",
    "tdv-effects-pro-styles",
    "compat/effects-runtime-fallback.js"
  );

  const sources = [
    // 1) Core infra
    "js/core/EventBus.js",
    "js/core/State.js",

    // 2) Data
    "js/data/effects-library.js",
    "js/data/themes-library.js",

    // 3) Config (composes defaults from data libraries)
    "js/core/Config.js",

    // 3) Utils
    "js/utils/helpers.js",
    "js/utils/dom.js",
    "js/utils/animation.js",
    "js/utils/color.js",

    // 4) UI helpers
    "js/ui/Toast.js",
    "js/ui/Modal.js",

    // 5) Managers
    "js/managers/StorageManager.js",
    "js/managers/ConfigManager.js",
    "js/managers/CanvasManager.js",
    "js/managers/ParticleManager.js",
    "js/managers/CSSEffectManager.js",
    "js/managers/AuraManager.js",
    "js/managers/EffectManager.js",
    "js/managers/ThemeManager.js",
    "js/managers/TourIntegrationManager.js",

    // 6) App + bootstrap
    "js/core/App.js",
    "js/main.js",
  ];

  // Hint the browser to fetch scripts early; execution order remains controlled by loadAllOrdered().
  for (let i = 0; i < sources.length; i++) preloadScript(sources[i]);

  function loadAllOrdered() {
    if (!sources.length) {
      if (effectsPro._deferredReady && effectsPro._deferredReady.resolve) {
        effectsPro._deferredReady.resolve(effectsPro);
      }
      return;
    }

    const head = document.head || document.documentElement || document.body;
    let remaining = sources.length;
    let failed = false;

    function resolveReady() {
      if (failed) return;
      if (effectsPro._deferredReady && effectsPro._deferredReady.resolve) {
        effectsPro._deferredReady.resolve(effectsPro);
      }
    }

    function rejectReady(err) {
      if (failed) return;
      failed = true;
      if (effectsPro._deferredReady && effectsPro._deferredReady.reject) {
        effectsPro._deferredReady.reject(err);
      }
      try {
        console.error(err);
      } catch {
        // ignore
      }
    }

    for (let i = 0; i < sources.length; i++) {
      const relativePath = sources[i];
      const script = document.createElement("script");
      script.src = baseUrl + relativePath;
      script.async = false; // preserve execution order
      script.defer = false;
      script.onload = () => {
        if (failed) return;
        remaining -= 1;
        if (remaining <= 0) resolveReady();
      };
      script.onerror = () => rejectReady(new Error(`[effectsPro] Failed to load ${relativePath}`));
      head.appendChild(script);
    }
  }

  loadAllOrdered();
})();
