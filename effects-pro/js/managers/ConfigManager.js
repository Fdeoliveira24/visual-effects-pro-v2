(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const { deepClone, deepMerge, isPlainObject } = effectsPro._internals.helpers || {};
  const { Config } = effectsPro._internals;
  const color = effectsPro._internals.color || {};

  function getExternalConfig() {
    try {
      const external = window.effectsProConfig;
      if (!external) return null;
      if (typeof external === "string") return JSON.parse(external);
      if (typeof external === "object") return external;
    } catch {
      return null;
    }
    return null;
  }

  class ConfigManager {
    constructor({ state, eventBus, storageManager }) {
      this.state = state;
      this.eventBus = eventBus;
      this.storage = storageManager;
      this.storageKey = (Config && Config.STORAGE_KEY) || "effectsProConfig";
      this.defaults = (Config && Config.DEFAULTS) || {};
    }

    load() {
      let cfg = deepClone ? deepClone(this.defaults) : { ...this.defaults };

      const external = getExternalConfig();
      if (external && isPlainObject && isPlainObject(external)) {
        cfg = deepMerge(cfg, external);
      }

      const saved =
        this.storage && typeof this.storage.load === "function"
          ? this.storage.load(this.storageKey)
          : null;
      if (saved && isPlainObject && isPlainObject(saved)) {
        cfg = deepMerge(cfg, saved);
      }

      cfg = this.validate(cfg);
      this.state.setState({ config: cfg });
      if (this.eventBus) {
        this.eventBus.emit("config:loaded", cfg);
      }
      return cfg;
    }

    save() {
      const current = this.get();
      const cfg = this.validate(current);
      this.state.setState({ config: cfg });

      if (this.storage && typeof this.storage.save === "function") {
        this.storage.save(this.storageKey, cfg);
      }
      if (this.eventBus) {
        this.eventBus.emit("config:saved", cfg);
      }
      return cfg;
    }

    reset() {
      const cfg = deepClone ? deepClone(this.defaults) : { ...this.defaults };
      const validated = this.validate(cfg);
      this.state.setState({ config: validated });
      if (this.eventBus) {
        this.eventBus.emit("config:reset", validated);
      }
      return validated;
    }

    merge(partial) {
      if (!partial || typeof partial !== "object") return this.get();
      const current = this.get();
      const next = this.validate(deepMerge(current, partial));
      this.state.setState({ config: next });
      if (this.eventBus) {
        this.eventBus.emit("config:changed", { config: next, patch: partial });
      }
      return next;
    }

    applyExternal(externalConfig) {
      if (!externalConfig || typeof externalConfig !== "object") return this.get();
      const next = this.validate(deepMerge(this.get(), externalConfig));
      this.state.setState({ config: next });
      if (this.eventBus) {
        this.eventBus.emit("config:changed:external", { config: next, external: externalConfig });
      }
      return next;
    }

    get() {
      const current = this.state.getState().config;
      return deepClone ? deepClone(current) : current;
    }

    validate(config) {
      const cfg = config && typeof config === "object" ? config : {};

      // Ensure core keys exist.
      if (typeof cfg.enabled !== "boolean") cfg.enabled = !!this.defaults.enabled;
      if (!cfg.mode) cfg.mode = this.defaults.mode || "both";
      if (typeof cfg.reducedMotionRespect !== "boolean")
        cfg.reducedMotionRespect = !!this.defaults.reducedMotionRespect;
      if (!Number.isFinite(Number(cfg.maxDevicePixelRatio)))
        cfg.maxDevicePixelRatio = Number(this.defaults.maxDevicePixelRatio) || 2;
      if (!Number.isFinite(Number(cfg.zIndex))) cfg.zIndex = Number(this.defaults.zIndex) || 999999;

      if (!cfg.preferredEffect) cfg.preferredEffect = "none";
      if (!cfg.preferredTheme) cfg.preferredTheme = "none";

      if (!cfg.themeLifetime) cfg.themeLifetime = this.defaults.themeLifetime || "permanent";
      if (!Number.isFinite(Number(cfg.themeDurationSec)))
        cfg.themeDurationSec = Number(this.defaults.themeDurationSec) || 30;

      // Ensure nested objects exist.
      if (!cfg.effects || typeof cfg.effects !== "object") {
        cfg.effects = deepClone ? deepClone(this.defaults.effects) : { ...this.defaults.effects };
      }
      if (!cfg.themes || typeof cfg.themes !== "object") {
        cfg.themes = deepClone ? deepClone(this.defaults.themes) : { ...this.defaults.themes };
      }

      // Migrate deprecated effect key "crackGlass" -> "spiderWeb".
      if (cfg.effects && typeof cfg.effects === "object") {
        try {
          if (cfg.effects.crackGlass && !cfg.effects.spiderWeb) {
            cfg.effects.spiderWeb = deepMerge
              ? deepMerge({}, cfg.effects.crackGlass)
              : { ...cfg.effects.crackGlass };
          }
          if (cfg.preferredEffect === "crackGlass") {
            cfg.preferredEffect = "spiderWeb";
          }
          if ("crackGlass" in cfg.effects) {
            delete cfg.effects.crackGlass;
          }

          // Migrate deprecated Fade variants -> "fade" (keeps configs clean after removing them).
          const baseFade =
            this.defaults && this.defaults.effects && this.defaults.effects.fade
              ? this.defaults.effects.fade
              : null;
          const legacyFade = cfg.effects.fadeBlack || cfg.effects.fadeWhite;
          if (legacyFade && !cfg.effects.fade) {
            cfg.effects.fade = deepMerge && baseFade ? deepMerge(baseFade, legacyFade) : legacyFade;
          } else if (cfg.effects.fade && deepMerge && baseFade) {
            cfg.effects.fade = deepMerge(baseFade, cfg.effects.fade);
          }

          if (cfg.effects.fade && typeof cfg.effects.fade === "object") {
            const fadeCfg = cfg.effects.fade;
            const legacyColor =
              (legacyFade && typeof legacyFade.color === "string" ? legacyFade.color : null) ||
              (typeof fadeCfg.color === "string" ? fadeCfg.color : null);

            if (legacyColor && typeof fadeCfg.colorHex !== "string") {
              const parsed =
                color && typeof color.parseColor === "function"
                  ? color.parseColor(legacyColor, { r: 0, g: 0, b: 0, a: 0.85 })
                  : null;
              if (parsed && typeof parsed === "object") {
                const toHex = (n) => {
                  const v = Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
                  return v.toString(16).padStart(2, "0");
                };
                fadeCfg.colorHex = `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
                fadeCfg.opacity =
                  typeof fadeCfg.opacity === "undefined" ? parsed.a : fadeCfg.opacity;
              }
            }

            if (typeof fadeCfg.color === "string") {
              delete fadeCfg.color;
            }
          }

          if (cfg.preferredEffect === "fadeBlack" || cfg.preferredEffect === "fadeWhite") {
            cfg.preferredEffect = "fade";
          }
          if ("fadeBlack" in cfg.effects) delete cfg.effects.fadeBlack;
          if ("fadeWhite" in cfg.effects) delete cfg.effects.fadeWhite;
        } catch {
          // ignore
        }
      }

      // Drop unknown themes from persisted configs (keeps removed themes from resurfacing).
      const defaultThemes =
        this.defaults && this.defaults.themes && typeof this.defaults.themes === "object"
          ? this.defaults.themes
          : null;
      if (cfg.themes && defaultThemes) {
        Object.keys(cfg.themes).forEach((key) => {
          if (key in defaultThemes) return;
          try {
            delete cfg.themes[key];
          } catch {
            // ignore
          }
        });
      }

      // Ensure preferredTheme points to an available theme.
      if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme !== "none") {
        const themeKey = cfg.preferredTheme;
        if (!defaultThemes || !(themeKey in defaultThemes)) {
          cfg.preferredTheme = "none";
        }
      }

      // Guard theme type invariants.
      if (cfg.themes && cfg.themes.easter) {
        const base = (this.defaults.themes && this.defaults.themes.easter) || {};
        cfg.themes.easter = deepMerge(base, cfg.themes.easter);
        if (cfg.themes.easter.type !== "egg") cfg.themes.easter.type = "egg";
      }

      // Migrate/guard halloween theme (older configs used type "ember").
      if (cfg.themes && cfg.themes.halloween) {
        const base = (this.defaults.themes && this.defaults.themes.halloween) || {};
        cfg.themes.halloween = deepMerge(base, cfg.themes.halloween);
        cfg.themes.halloween.type = "halloween";
        if (!cfg.themes.halloween.style) cfg.themes.halloween.style = base.style || "spiders";
        if (!Array.isArray(cfg.themes.halloween.icons) || !cfg.themes.halloween.icons.length) {
          cfg.themes.halloween.icons = (base.icons && base.icons.slice && base.icons.slice()) || [
            "🕸️",
            "🕷️",
            "🎃",
            "⚰️",
            "🦇",
            "👻",
            "💀",
            "☠️",
          ];
        }
      }

      if (!cfg.aura || typeof cfg.aura !== "object") {
        cfg.aura = deepClone ? deepClone(this.defaults.aura) : { ...this.defaults.aura };
      } else {
        const baseAura = this.defaults.aura || {};
        cfg.aura = deepMerge(baseAura, cfg.aura);
        if (typeof cfg.aura.enabled !== "boolean") cfg.aura.enabled = !!baseAura.enabled;
        if (!cfg.aura.level) cfg.aura.level = "none";
      }

      return cfg;
    }
  }

  effectsPro._internals.ConfigManager = ConfigManager;
})();
