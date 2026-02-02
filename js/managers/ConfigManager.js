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

      // Migrate deprecated Theme "fallingStars" -> One-shot effect "fallingStars".
      try {
        const baseFallingStars =
          this.defaults && this.defaults.effects && this.defaults.effects.fallingStars
            ? this.defaults.effects.fallingStars
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.fallingStars
            ? cfg.themes.fallingStars
            : null;

        if (
          legacyTheme &&
          cfg.effects &&
          typeof cfg.effects === "object" &&
          !cfg.effects.fallingStars
        ) {
          const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
          if (migrated && typeof migrated === "object") {
            if ("type" in migrated) delete migrated.type;
            if ("cssOnly" in migrated) delete migrated.cssOnly;
          }
          cfg.effects.fallingStars =
            deepMerge && baseFallingStars ? deepMerge(baseFallingStars, migrated) : migrated;
        } else if (cfg.effects && cfg.effects.fallingStars && deepMerge && baseFallingStars) {
          cfg.effects.fallingStars = deepMerge(baseFallingStars, cfg.effects.fallingStars);
        }

        if (cfg.preferredTheme === "fallingStars") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "fallingStars";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "fallingStars" in cfg.themes) {
          delete cfg.themes.fallingStars;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "snow" -> One-shot effect "snow".
      try {
        const baseSnow =
          this.defaults && this.defaults.effects && this.defaults.effects.snow
            ? this.defaults.effects.snow
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.snow ? cfg.themes.snow : null;

        if (legacyTheme && cfg.effects && typeof cfg.effects === "object" && !cfg.effects.snow) {
          const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
          if (migrated && typeof migrated === "object") {
            if ("type" in migrated) delete migrated.type;
            if ("cssOnly" in migrated) delete migrated.cssOnly;
            if (
              typeof migrated.colorHex !== "string" &&
              Array.isArray(legacyTheme.colors) &&
              typeof legacyTheme.colors[0] === "string"
            ) {
              migrated.colorHex = legacyTheme.colors[0];
            }
            if (typeof migrated.windVariance === "undefined") migrated.windVariance = 12;
            if (typeof migrated.particleLifetimeSec === "undefined")
              migrated.particleLifetimeSec = 30;
          }
          cfg.effects.snow = deepMerge && baseSnow ? deepMerge(baseSnow, migrated) : migrated;
        } else if (cfg.effects && cfg.effects.snow && deepMerge && baseSnow) {
          cfg.effects.snow = deepMerge(baseSnow, cfg.effects.snow);
        }

        if (cfg.preferredTheme === "snow") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "snow";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "snow" in cfg.themes) {
          delete cfg.themes.snow;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "snowflakes" -> One-shot effect "snowflakes".
      try {
        const baseSnowflakes =
          this.defaults && this.defaults.effects && this.defaults.effects.snowflakes
            ? this.defaults.effects.snowflakes
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.snowflakes
            ? cfg.themes.snowflakes
            : null;

        if (
          legacyTheme &&
          cfg.effects &&
          typeof cfg.effects === "object" &&
          !cfg.effects.snowflakes
        ) {
          const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
          if (migrated && typeof migrated === "object") {
            if ("type" in migrated) delete migrated.type;
            if ("cssOnly" in migrated) delete migrated.cssOnly;
            if (
              typeof migrated.colorHex !== "string" &&
              Array.isArray(legacyTheme.colors) &&
              typeof legacyTheme.colors[0] === "string"
            ) {
              migrated.colorHex = legacyTheme.colors[0];
            }
            if (typeof migrated.particleLifetimeSec === "undefined")
              migrated.particleLifetimeSec = 30;
          }
          cfg.effects.snowflakes =
            deepMerge && baseSnowflakes ? deepMerge(baseSnowflakes, migrated) : migrated;
        } else if (cfg.effects && cfg.effects.snowflakes && deepMerge && baseSnowflakes) {
          cfg.effects.snowflakes = deepMerge(baseSnowflakes, cfg.effects.snowflakes);
        }

        if (cfg.preferredTheme === "snowflakes") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "snowflakes";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "snowflakes" in cfg.themes) {
          delete cfg.themes.snowflakes;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "rain" -> One-shot effect "rain".
      try {
        const baseRain =
          this.defaults && this.defaults.effects && this.defaults.effects.rain
            ? this.defaults.effects.rain
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.rain ? cfg.themes.rain : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.rain
            ? cfg.effects.rain
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseRain
              ? deepMerge(baseRain, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
              if (!migrated.mode) migrated.mode = "continuous";
              if (typeof migrated.particleLifeMinSec === "undefined")
                migrated.particleLifeMinSec = 1.2;
              if (typeof migrated.particleLifeMaxSec === "undefined")
                migrated.particleLifeMaxSec = 2.4;
              if (
                typeof migrated.colorHex !== "string" &&
                Array.isArray(legacyTheme.colors) &&
                typeof legacyTheme.colors[0] === "string"
              ) {
                migrated.colorHex = legacyTheme.colors[0];
              }
            }

            if (!next) {
              next = deepMerge && baseRain ? deepMerge(baseRain, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseRain) {
            next = deepMerge ? deepMerge({}, baseRain) : { ...baseRain };
          }

          if (next) {
            cfg.effects.rain = next;
          }
        }

        if (cfg.preferredTheme === "rain") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "rain";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "rain" in cfg.themes) {
          delete cfg.themes.rain;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "bubbles" -> One-shot effect "bubbles".
      try {
        const baseBubbles =
          this.defaults && this.defaults.effects && this.defaults.effects.bubbles
            ? this.defaults.effects.bubbles
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.bubbles
            ? cfg.themes.bubbles
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.bubbles
            ? cfg.effects.bubbles
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseBubbles
              ? deepMerge(baseBubbles, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
              if (!migrated.mode) migrated.mode = "continuous";
              if (
                typeof migrated.colorHex !== "string" &&
                Array.isArray(legacyTheme.colors) &&
                typeof legacyTheme.colors[0] === "string"
              ) {
                migrated.colorHex = legacyTheme.colors[0];
              }
              if (typeof migrated.colorOpacity === "undefined") migrated.colorOpacity = 0.85;
              if (typeof migrated.particleLifeMinSec === "undefined")
                migrated.particleLifeMinSec = 6;
              if (typeof migrated.particleLifeMaxSec === "undefined")
                migrated.particleLifeMaxSec = 12;
              if (
                typeof migrated.strokeWidth === "undefined" &&
                typeof migrated.strokeWidth !== "number"
              ) {
                // no-op (kept for compatibility)
              }
            }

            if (!next) {
              next = deepMerge && baseBubbles ? deepMerge(baseBubbles, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseBubbles) {
            next = deepMerge ? deepMerge({}, baseBubbles) : { ...baseBubbles };
          }

          if (next) {
            cfg.effects.bubbles = next;
          }
        }

        if (cfg.preferredTheme === "bubbles") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "bubbles";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "bubbles" in cfg.themes) {
          delete cfg.themes.bubbles;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "balloons" -> One-shot effect "balloons".
      try {
        const baseBalloons =
          this.defaults && this.defaults.effects && this.defaults.effects.balloons
            ? this.defaults.effects.balloons
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.balloons
            ? cfg.themes.balloons
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.balloons
            ? cfg.effects.balloons
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseBalloons
              ? deepMerge(baseBalloons, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseBalloons ? deepMerge(baseBalloons, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseBalloons) {
            next = deepMerge ? deepMerge({}, baseBalloons) : { ...baseBalloons };
          }

          if (next) {
            cfg.effects.balloons = next;
          }
        }

        if (cfg.preferredTheme === "balloons") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "balloons";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "balloons" in cfg.themes) {
          delete cfg.themes.balloons;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "leaves" -> One-shot effect "leaves".
      try {
        const baseLeaves =
          this.defaults && this.defaults.effects && this.defaults.effects.leaves
            ? this.defaults.effects.leaves
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.leaves
            ? cfg.themes.leaves
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.leaves
            ? cfg.effects.leaves
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseLeaves
              ? deepMerge(baseLeaves, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseLeaves ? deepMerge(baseLeaves, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseLeaves) {
            next = deepMerge ? deepMerge({}, baseLeaves) : { ...baseLeaves };
          }

          if (next) {
            cfg.effects.leaves = next;
          }
        }

        if (cfg.preferredTheme === "leaves") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "leaves";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "leaves" in cfg.themes) {
          delete cfg.themes.leaves;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "fire" -> One-shot effect "fire".
      try {
        const baseFire =
          this.defaults && this.defaults.effects && this.defaults.effects.fire
            ? this.defaults.effects.fire
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.fire ? cfg.themes.fire : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.fire
            ? cfg.effects.fire
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseFire
              ? deepMerge(baseFire, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseFire ? deepMerge(baseFire, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseFire) {
            next = deepMerge ? deepMerge({}, baseFire) : { ...baseFire };
          }

          if (next) {
            cfg.effects.fire = next;
          }
        }

        if (cfg.preferredTheme === "fire") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "fire";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "fire" in cfg.themes) {
          delete cfg.themes.fire;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "wind" -> One-shot effect "wind".
      try {
        const baseWind =
          this.defaults && this.defaults.effects && this.defaults.effects.wind
            ? this.defaults.effects.wind
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.wind ? cfg.themes.wind : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.wind
            ? cfg.effects.wind
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseWind
              ? deepMerge(baseWind, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
              if (typeof migrated.colorMode === "undefined") migrated.colorMode = "palette";
              if (
                typeof migrated.colors === "undefined" &&
                legacyTheme.colors &&
                Array.isArray(legacyTheme.colors)
              ) {
                migrated.colors = legacyTheme.colors.slice();
              }
            }

            if (!next) {
              next = deepMerge && baseWind ? deepMerge(baseWind, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseWind) {
            next = deepMerge ? deepMerge({}, baseWind) : { ...baseWind };
          }

          if (next) {
            cfg.effects.wind = next;
          }
        }

        if (cfg.preferredTheme === "wind") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "wind";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "wind" in cfg.themes) {
          delete cfg.themes.wind;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "electric" -> One-shot effect "electric".
      try {
        const baseElectric =
          this.defaults && this.defaults.effects && this.defaults.effects.electric
            ? this.defaults.effects.electric
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.electric
            ? cfg.themes.electric
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.electric
            ? cfg.effects.electric
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseElectric
              ? deepMerge(baseElectric, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseElectric ? deepMerge(baseElectric, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseElectric) {
            next = deepMerge ? deepMerge({}, baseElectric) : { ...baseElectric };
          }

          if (next) {
            cfg.effects.electric = next;
          }
        }

        if (cfg.preferredTheme === "electric") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "electric";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "electric" in cfg.themes) {
          delete cfg.themes.electric;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "bokeh" -> One-shot effect "bokeh".
      try {
        const baseBokeh =
          this.defaults && this.defaults.effects && this.defaults.effects.bokeh
            ? this.defaults.effects.bokeh
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.bokeh
            ? cfg.themes.bokeh
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.bokeh
            ? cfg.effects.bokeh
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseBokeh
              ? deepMerge(baseBokeh, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseBokeh ? deepMerge(baseBokeh, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseBokeh) {
            next = deepMerge ? deepMerge({}, baseBokeh) : { ...baseBokeh };
          }

          if (next) {
            cfg.effects.bokeh = next;
          }
        }

        if (cfg.preferredTheme === "bokeh") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "bokeh";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "bokeh" in cfg.themes) {
          delete cfg.themes.bokeh;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "strobe" -> One-shot effect "strobe".
      try {
        const baseStrobe =
          this.defaults && this.defaults.effects && this.defaults.effects.strobe
            ? this.defaults.effects.strobe
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.strobe
            ? cfg.themes.strobe
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.strobe
            ? cfg.effects.strobe
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseStrobe
              ? deepMerge(baseStrobe, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseStrobe ? deepMerge(baseStrobe, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseStrobe) {
            next = deepMerge ? deepMerge({}, baseStrobe) : { ...baseStrobe };
          }

          if (next) {
            cfg.effects.strobe = next;
          }
        }

        if (cfg.preferredTheme === "strobe") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "strobe";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "strobe" in cfg.themes) {
          delete cfg.themes.strobe;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "water" -> One-shot effect "water".
      try {
        const baseWater =
          this.defaults && this.defaults.effects && this.defaults.effects.water
            ? this.defaults.effects.water
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.water
            ? cfg.themes.water
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.water
            ? cfg.effects.water
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseWater
              ? deepMerge(baseWater, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseWater ? deepMerge(baseWater, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseWater) {
            next = deepMerge ? deepMerge({}, baseWater) : { ...baseWater };
          }

          if (next) {
            cfg.effects.water = next;
          }
        }

        if (cfg.preferredTheme === "water") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "water";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "water" in cfg.themes) {
          delete cfg.themes.water;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "smoke" -> One-shot effect "smoke".
      try {
        const clampNum = (value, min, max) => Math.max(min, Math.min(max, value));

        const baseSmoke =
          this.defaults && this.defaults.effects && this.defaults.effects.smoke
            ? this.defaults.effects.smoke
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.smoke
            ? cfg.themes.smoke
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.smoke
            ? cfg.effects.smoke
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseSmoke
              ? deepMerge(baseSmoke, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;

              if (
                typeof migrated.intensity !== "undefined" &&
                typeof migrated.opacityScale === "undefined"
              ) {
                migrated.opacityScale = clampNum(Number(migrated.intensity) || 0.4, 0.05, 1.0);
              }
              if (
                typeof migrated.speed !== "undefined" &&
                typeof migrated.riseSpeed === "undefined"
              ) {
                migrated.riseSpeed = clampNum(Number(migrated.speed) || 1.0, 0.1, 5.0);
              }
              if (
                typeof migrated.riseSoftness !== "undefined" &&
                typeof migrated.sizeScale === "undefined"
              ) {
                migrated.sizeScale = clampNum(Number(migrated.riseSoftness) || 1.0, 0.3, 3.0);
              }
              // Legacy `direction` is ignored for the one-shot smoke implementation.
            }

            if (!next) {
              next = deepMerge && baseSmoke ? deepMerge(baseSmoke, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseSmoke) {
            next = deepMerge ? deepMerge({}, baseSmoke) : { ...baseSmoke };
          }

          if (next) {
            cfg.effects.smoke = next;
          }
        }

        if (cfg.preferredTheme === "smoke") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "smoke";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "smoke" in cfg.themes) {
          delete cfg.themes.smoke;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "flames" -> One-shot effect "flames".
      try {
        const baseFlames =
          this.defaults && this.defaults.effects && this.defaults.effects.flames
            ? this.defaults.effects.flames
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.flames
            ? cfg.themes.flames
            : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.flames
            ? cfg.effects.flames
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseFlames
              ? deepMerge(baseFlames, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseFlames ? deepMerge(baseFlames, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseFlames) {
            next = deepMerge ? deepMerge({}, baseFlames) : { ...baseFlames };
          }

          if (next) {
            cfg.effects.flames = next;
          }
        }

        if (cfg.preferredTheme === "flames") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "flames";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "flames" in cfg.themes) {
          delete cfg.themes.flames;
        }
      } catch {
        // ignore
      }

      // Migrate deprecated Theme "burn" -> One-shot effect "burn".
      try {
        const baseBurn =
          this.defaults && this.defaults.effects && this.defaults.effects.burn
            ? this.defaults.effects.burn
            : null;
        const legacyTheme =
          cfg.themes && typeof cfg.themes === "object" && cfg.themes.burn ? cfg.themes.burn : null;

        const existingEffect =
          cfg.effects && typeof cfg.effects === "object" && cfg.effects.burn
            ? cfg.effects.burn
            : null;

        if (cfg.effects && typeof cfg.effects === "object") {
          let next =
            existingEffect && deepMerge && baseBurn
              ? deepMerge(baseBurn, existingEffect)
              : existingEffect;

          if (legacyTheme) {
            const migrated = deepMerge ? deepMerge({}, legacyTheme) : { ...legacyTheme };
            if (migrated && typeof migrated === "object") {
              if ("type" in migrated) delete migrated.type;
              if ("cssOnly" in migrated) delete migrated.cssOnly;
            }

            if (!next) {
              next = deepMerge && baseBurn ? deepMerge(baseBurn, migrated) : migrated;
            } else if (deepMerge) {
              next = deepMerge(next, migrated);
            } else {
              next = { ...next, ...migrated };
            }
          } else if (!next && baseBurn) {
            next = deepMerge ? deepMerge({}, baseBurn) : { ...baseBurn };
          }

          if (next) {
            cfg.effects.burn = next;
          }
        }

        if (cfg.preferredTheme === "burn") {
          cfg.preferredTheme = "none";
          if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
            cfg.preferredEffect = "burn";
          }
        }

        if (cfg.themes && typeof cfg.themes === "object" && "burn" in cfg.themes) {
          delete cfg.themes.burn;
        }
      } catch {
        // ignore
      }

      // Migrate removed Themes -> One-shot effects (must run before dropping unknown themes).
      // Migrate Halloween from Theme -> One-shot effect.
      try {
        if (cfg.themes && cfg.themes.halloween) {
          const base = (this.defaults.effects && this.defaults.effects.halloween) || {};
          const migrated = deepMerge(base, cfg.themes.halloween);

          if (migrated && migrated.style === "ember") migrated.style = "embers";
          if (!migrated.style) migrated.style = base.style || "spiders";
          if (!Array.isArray(migrated.icons) || !migrated.icons.length) {
            migrated.icons = (base.icons && base.icons.slice && base.icons.slice()) || [
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

          cfg.effects = cfg.effects && typeof cfg.effects === "object" ? cfg.effects : {};
          const existing =
            cfg.effects.halloween && typeof cfg.effects.halloween === "object"
              ? cfg.effects.halloween
              : null;
          cfg.effects.halloween = existing ? deepMerge(migrated, existing) : migrated;

          if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme === "halloween") {
            cfg.preferredTheme = "none";
            if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
              cfg.preferredEffect = "halloween";
            }
          }

          try {
            delete cfg.themes.halloween;
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      // Migrate Christmas Lights from Theme -> One-shot effect.
      try {
        if (cfg.themes && cfg.themes.christmasLights) {
          const base = (this.defaults.effects && this.defaults.effects.christmasLights) || {};
          const migrated = deepMerge(base, cfg.themes.christmasLights);

          cfg.effects = cfg.effects && typeof cfg.effects === "object" ? cfg.effects : {};
          const existing =
            cfg.effects.christmasLights && typeof cfg.effects.christmasLights === "object"
              ? cfg.effects.christmasLights
              : null;
          cfg.effects.christmasLights = existing ? deepMerge(migrated, existing) : migrated;

          if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme === "christmasLights") {
            cfg.preferredTheme = "none";
            if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
              cfg.preferredEffect = "christmasLights";
            }
          }

          try {
            delete cfg.themes.christmasLights;
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      // Migrate Easter from Theme -> One-shot effect.
      try {
        if (cfg.themes && cfg.themes.easter) {
          const base = (this.defaults.effects && this.defaults.effects.easter) || {};
          const migrated = deepMerge(base, cfg.themes.easter);

          cfg.effects = cfg.effects && typeof cfg.effects === "object" ? cfg.effects : {};
          const existing =
            cfg.effects.easter && typeof cfg.effects.easter === "object"
              ? cfg.effects.easter
              : null;
          cfg.effects.easter = existing ? deepMerge(migrated, existing) : migrated;

          if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme === "easter") {
            cfg.preferredTheme = "none";
            if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
              cfg.preferredEffect = "easter";
            }
          }

          try {
            delete cfg.themes.easter;
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      // Migrate Flowers from Theme -> One-shot effect.
      try {
        if (cfg.themes && cfg.themes.flowers) {
          const base = (this.defaults.effects && this.defaults.effects.flowers) || {};
          const migrated = deepMerge(base, cfg.themes.flowers);

          cfg.effects = cfg.effects && typeof cfg.effects === "object" ? cfg.effects : {};
          const existing =
            cfg.effects.flowers && typeof cfg.effects.flowers === "object"
              ? cfg.effects.flowers
              : null;
          cfg.effects.flowers = existing ? deepMerge(migrated, existing) : migrated;

          if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme === "flowers") {
            cfg.preferredTheme = "none";
            if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
              cfg.preferredEffect = "flowers";
            }
          }

          try {
            delete cfg.themes.flowers;
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      // Migrate Spinning Rays from Theme -> One-shot effect.
      try {
        if (cfg.themes && cfg.themes.spinningRays) {
          const base = (this.defaults.effects && this.defaults.effects.spinningRays) || {};
          const migrated = deepMerge(base, cfg.themes.spinningRays);

          cfg.effects = cfg.effects && typeof cfg.effects === "object" ? cfg.effects : {};
          const existing =
            cfg.effects.spinningRays && typeof cfg.effects.spinningRays === "object"
              ? cfg.effects.spinningRays
              : null;
          cfg.effects.spinningRays = existing ? deepMerge(migrated, existing) : migrated;

          if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme === "spinningRays") {
            cfg.preferredTheme = "none";
            if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
              cfg.preferredEffect = "spinningRays";
            }
          }

          try {
            delete cfg.themes.spinningRays;
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      // Migrate Storm from Theme -> One-shot effect.
      try {
        if (cfg.themes && cfg.themes.storm) {
          const base = (this.defaults.effects && this.defaults.effects.storm) || {};
          const migrated = deepMerge(base, cfg.themes.storm);

          cfg.effects = cfg.effects && typeof cfg.effects === "object" ? cfg.effects : {};
          const existing =
            cfg.effects.storm && typeof cfg.effects.storm === "object" ? cfg.effects.storm : null;
          cfg.effects.storm = existing ? deepMerge(migrated, existing) : migrated;

          if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme === "storm") {
            cfg.preferredTheme = "none";
            if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
              cfg.preferredEffect = "storm";
            }
          }

          try {
            delete cfg.themes.storm;
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      // Migrate Sine Waves from Theme -> One-shot effect.
      try {
        if (cfg.themes && cfg.themes.sineWaves) {
          const base = (this.defaults.effects && this.defaults.effects.sineWaves) || {};
          const migrated = deepMerge(base, cfg.themes.sineWaves);

          cfg.effects = cfg.effects && typeof cfg.effects === "object" ? cfg.effects : {};
          const existing =
            cfg.effects.sineWaves && typeof cfg.effects.sineWaves === "object"
              ? cfg.effects.sineWaves
              : null;
          cfg.effects.sineWaves = existing ? deepMerge(migrated, existing) : migrated;

          if (typeof cfg.preferredTheme === "string" && cfg.preferredTheme === "sineWaves") {
            cfg.preferredTheme = "none";
            if (!cfg.preferredEffect || cfg.preferredEffect === "none") {
              cfg.preferredEffect = "sineWaves";
            }
          }

          try {
            delete cfg.themes.sineWaves;
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
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

      // Guard halloween effect config (older configs used style "ember").
      try {
        if (cfg.effects && cfg.effects.halloween) {
          const base = (this.defaults.effects && this.defaults.effects.halloween) || {};
          cfg.effects.halloween = deepMerge(base, cfg.effects.halloween);
          if (cfg.effects.halloween.style === "ember") cfg.effects.halloween.style = "embers";
          if (!cfg.effects.halloween.style) cfg.effects.halloween.style = base.style || "spiders";
          if (!Array.isArray(cfg.effects.halloween.icons) || !cfg.effects.halloween.icons.length) {
            cfg.effects.halloween.icons = (base.icons &&
              base.icons.slice &&
              base.icons.slice()) || ["🕸️", "🕷️", "🎃", "⚰️", "🦇", "👻", "💀", "☠️"];
          }
        }
      } catch {
        // ignore
      }

      // Guard easter effect config.
      try {
        if (cfg.effects && cfg.effects.easter) {
          const base = (this.defaults.effects && this.defaults.effects.easter) || {};
          cfg.effects.easter = deepMerge(base, cfg.effects.easter);
          if (!cfg.effects.easter.colorMode)
            cfg.effects.easter.colorMode = base.colorMode || "palette";
        }
      } catch {
        // ignore
      }

      // Guard christmasLights effect config.
      try {
        if (cfg.effects && cfg.effects.christmasLights) {
          const base = (this.defaults.effects && this.defaults.effects.christmasLights) || {};
          cfg.effects.christmasLights = deepMerge(base, cfg.effects.christmasLights);
          if (typeof cfg.effects.christmasLights.showStars !== "boolean") {
            cfg.effects.christmasLights.showStars = !!base.showStars;
          }
          if (typeof cfg.effects.christmasLights.showBokeh !== "boolean") {
            cfg.effects.christmasLights.showBokeh = !!base.showBokeh;
          }
          if (typeof cfg.effects.christmasLights.showLights !== "boolean") {
            cfg.effects.christmasLights.showLights = !!base.showLights;
          }
          if (typeof cfg.effects.christmasLights.showSnow !== "boolean") {
            cfg.effects.christmasLights.showSnow = !!base.showSnow;
          }
          if (typeof cfg.effects.christmasLights.showSnowGround !== "boolean") {
            cfg.effects.christmasLights.showSnowGround = !!base.showSnowGround;
          }
          if (!cfg.effects.christmasLights.bokehColorMode) {
            cfg.effects.christmasLights.bokehColorMode = base.bokehColorMode || "palette";
          }
        }
      } catch {
        // ignore
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
