(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};
  effectsPro._data = effectsPro._data || {};

  /**
   * Data-only configuration module.
   * - No runtime logic (other than assembling exported objects).
   */
  const STORAGE_KEY = "effectsProConfig";

  const DEFAULTS = {
    enabled: true,
    mode: "both", // "dom" | "button" | "both"
    reducedMotionRespect: true,
    maxDevicePixelRatio: 2,
    zIndex: 999999,
    preferredEffect: "none",
    preferredTheme: "none",
    themeLifetime: "permanent", // "permanent" | "timed"
    themeDurationSec: 30,
    effects: effectsPro._data.EFFECTS_LIBRARY || {},
    themes: effectsPro._data.THEMES_LIBRARY || {},
    aura: {
      enabled: false,
      level: "none",
      cold: { color: "#5ef3da", intensity: 0.28 },
      warm: { color: "#fb923c", intensity: 0.3 },
      hot: { color: "#f43f5e", intensity: 0.35 },
    },
  };

  effectsPro._internals.Config = {
    STORAGE_KEY,
    DEFAULTS,
    VERSION: "1.0.0-next",
  };
})();
