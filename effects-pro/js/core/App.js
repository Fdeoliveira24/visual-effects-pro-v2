(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const {
    EventBus,
    State,
    StorageManager,
    ConfigManager,
    CanvasManager,
    ParticleManager,
    CSSEffectManager,
    AuraManager,
    EffectManager,
    ThemeManager,
    TourIntegrationManager,
    Config,
  } = effectsPro._internals;

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = String(el.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return !!el.isContentEditable;
  }

  class App {
    constructor() {
      this.eventBus = new EventBus();
      this.state = new State();

      this.storageManager = new StorageManager(this.eventBus);
      this.configManager = new ConfigManager({
        state: this.state,
        eventBus: this.eventBus,
        storageManager: this.storageManager,
      });

      this.canvasManager = new CanvasManager({ state: this.state, eventBus: this.eventBus });
      this.particleManager = new ParticleManager({ eventBus: this.eventBus });
      this.cssEffectManager = new CSSEffectManager({ eventBus: this.eventBus });
      this.auraManager = new AuraManager({ state: this.state, eventBus: this.eventBus });
      this.themeManager = new ThemeManager({
        state: this.state,
        eventBus: this.eventBus,
        canvasManager: this.canvasManager,
        particleManager: this.particleManager,
        cssEffectManager: this.cssEffectManager,
        configManager: this.configManager,
      });
      this.effectManager = new EffectManager({
        state: this.state,
        eventBus: this.eventBus,
        canvasManager: this.canvasManager,
        particleManager: this.particleManager,
        cssEffectManager: this.cssEffectManager,
        configManager: this.configManager,
      });
      this.tourIntegrationManager = new TourIntegrationManager({
        state: this.state,
        eventBus: this.eventBus,
      });

      this.canvasManager.setDependencies({
        particleManager: this.particleManager,
        themeManager: this.themeManager,
        cssEffectManager: this.cssEffectManager,
        auraManager: this.auraManager,
      });
      this.cssEffectManager.setCanvasManager(this.canvasManager);
      this.auraManager.setCanvasManager(this.canvasManager);

      this._initialized = false;
      this.domEnabled = false;
      this.lastPlayedEffect = null;
      this._lastResetAnimationsToken = null;

      this._bindEvents();
    }

    _bindEvents() {
      this.eventBus.on("particles:added", () => {
        try {
          if (this.canvasManager) {
            this.canvasManager.requestFrame();
          }
        } catch {
          // ignore
        }
      });

      const key = (Config && Config.STORAGE_KEY) || "effectsProConfig";
      try {
        this.storageManager.bindCrossTabStorageEvent(key);
        this.storageManager.startPolling(key, 1000);
      } catch {
        // ignore
      }

      this.eventBus.on("storage:changed", (payload) => {
        try {
          if (!payload || payload.key !== key) return;
          this._handleExternalConfigChange();
        } catch {
          // ignore
        }
      });

      try {
        document.addEventListener("keydown", (event) => {
          const keyName = event && (event.key || event.code);
          if (keyName !== "Escape" && keyName !== "Esc" && event.keyCode !== 27) return;
          if (isTypingTarget(document.activeElement)) return;
          this.stopAll();
        });
      } catch {
        // ignore
      }
    }

    _getConfig() {
      const s = this.state.getState();
      return s && s.config ? s.config : null;
    }

    _getPreferredThemeForAutoStart() {
      const cfg = this._getConfig();
      const theme = cfg && cfg.preferredTheme;
      if (!theme || theme === "none") return null;
      const mode = cfg && cfg.mode ? cfg.mode : "both";
      if (mode !== "dom" && mode !== "both" && mode !== "button") return null;
      return theme;
    }

    _handleExternalConfigChange() {
      const prevCfg = this._getConfig();
      const prevPreferredTheme =
        prevCfg && typeof prevCfg.preferredTheme === "string" ? prevCfg.preferredTheme : "none";
      const prevMode = prevCfg && typeof prevCfg.mode === "string" ? prevCfg.mode : "both";

      this.loadConfig();
      const cfg = this._getConfig();
      if (!cfg) return;

      if (this.canvasManager && this.canvasManager.overlayRoot) {
        this.canvasManager.setZIndex(cfg.zIndex);
      }

      if (!cfg.enabled) {
        this.enableDomOverlay(false);
        return;
      }

      // Keep active theme overlays in sync with external config (ex: halloween controls).
      try {
        if (this.canvasManager && this.canvasManager.overlayRoot) {
          if (this.themeManager && typeof this.themeManager.syncActiveThemeOverlay === "function") {
            this.themeManager.syncActiveThemeOverlay();
          }
        }
      } catch {
        // ignore
      }

      const token =
        cfg && typeof cfg.resetAnimationsToken !== "undefined" ? cfg.resetAnimationsToken : null;
      if (token && token !== this._lastResetAnimationsToken) {
        this._lastResetAnimationsToken = token;
        this._resetAnimationsFromConfig();
        return;
      }

      // Auto-start/switch themes if preferredTheme changed (cross-tab/dashboard updates).
      try {
        if (!this.domEnabled) return;
        if (!this.canvasManager || !this.canvasManager.overlayRoot) return;

        const nextPreferredTheme =
          cfg && typeof cfg.preferredTheme === "string" ? cfg.preferredTheme : "none";
        if (nextPreferredTheme === prevPreferredTheme) return;

        const nextMode = cfg && typeof cfg.mode === "string" ? cfg.mode : "both";
        const modeAllowsThemes = nextMode === "dom" || nextMode === "both" || nextMode === "button";

        if (!modeAllowsThemes || !nextPreferredTheme || nextPreferredTheme === "none") {
          this.stopOverlayTheme();
          return;
        }

        // If mode transitioned from not-allowed -> allowed, still treat as a switch.
        const prevModeAllowsThemes =
          prevMode === "dom" || prevMode === "both" || prevMode === "button";
        if (!prevModeAllowsThemes || nextPreferredTheme !== prevPreferredTheme) {
          this.startOverlayTheme(nextPreferredTheme);
        }
      } catch {
        // ignore
      }
    }

    _resetAnimationsFromConfig() {
      const cfg = this._getConfig();
      if (!cfg || !cfg.enabled) return;
      if (!this.domEnabled) return;
      if (!this.canvasManager || !this.canvasManager.overlayRoot) return;

      const activeTheme =
        this.themeManager && typeof this.themeManager.getActiveTheme === "function"
          ? this.themeManager.getActiveTheme()
          : null;
      if (activeTheme) {
        this.startOverlayTheme(activeTheme);
        return;
      }

      const preferredTheme = this._getPreferredThemeForAutoStart();
      if (preferredTheme) {
        this.startOverlayTheme(preferredTheme);
        return;
      }

      const preferredEffect = cfg && cfg.preferredEffect ? cfg.preferredEffect : "none";
      if (preferredEffect && preferredEffect !== "none") {
        this.playEffect(preferredEffect);
        return;
      }

      try {
        this.stopOverlayTheme();
        if (this.cssEffectManager) {
          this.cssEffectManager.clearEffectLayers();
        }
        if (this.particleManager) {
          this.particleManager.clearAll();
        }
        if (this.canvasManager) {
          this.canvasManager.stopLoop();
          this.canvasManager.clearCanvas();
        }
      } catch {
        // ignore
      }
    }

    initializeEffects(tourObjOptional) {
      try {
        if (tourObjOptional) {
          this.captureTourObject(tourObjOptional);
        }
        this.loadConfig();
        if (this._initialized) return;
        this._initialized = true;
      } catch {
        // ignore
      }
    }

    captureTourObject(obj) {
      return this.tourIntegrationManager &&
        typeof this.tourIntegrationManager.captureTourObject === "function"
        ? this.tourIntegrationManager.captureTourObject(obj)
        : false;
    }

    enableDomOverlay(enabled) {
      try {
        this.domEnabled = !!enabled;
        if (this.domEnabled) {
          this.canvasManager.ensureOverlay();
          const preferredTheme = this._getPreferredThemeForAutoStart();
          if (preferredTheme) {
            this.startOverlayTheme(preferredTheme);
          }
        } else {
          this.canvasManager.removeOverlay();
        }
      } catch {
        // ignore
      }
    }

    isEnabled() {
      const cfg = this._getConfig();
      return !!(this.domEnabled && cfg && cfg.enabled);
    }

    playEffect(effectName, overrides) {
      try {
        const cfg = this._getConfig();
        if (!this.domEnabled || !cfg || !cfg.enabled) return;
        if (!effectName || !this.effectManager.hasEffect(effectName)) return;
        if (!this.canvasManager.ensureOverlay()) return;

        const library = effectsPro && effectsPro._data ? effectsPro._data.EFFECTS_LIBRARY : null;
        const libraryCfg = library && library[effectName] ? library[effectName] : null;
        let stacking = "exclusive";
        if (overrides && overrides.stacking) stacking = overrides.stacking;
        else if (libraryCfg && libraryCfg.stacking) stacking = libraryCfg.stacking;

        if (stacking === "additive") {
          if (
            this.cssEffectManager &&
            typeof this.cssEffectManager.clearEffectLayers === "function"
          ) {
            this.cssEffectManager.clearEffectLayers();
          }
        } else {
          this.stopOverlayTheme();
          // Clear the entire CSS layer (some effects append non-`.tdv-effect-layer` nodes).
          this.cssEffectManager.clear();
          this.particleManager.clearAll();
          this.canvasManager.stopLoop();
          this.canvasManager.clearCanvas();
        }

        this.effectManager.play(effectName, overrides);
        this.lastPlayedEffect = effectName;
      } catch {
        // ignore
      }
    }

    startOverlayTheme(themeName) {
      try {
        const cfg = this._getConfig();
        if (!cfg || !cfg.enabled) return;
        if (!this.domEnabled) this.domEnabled = true;
        if (!this.canvasManager.ensureOverlay()) return;

        // Back-compat: if a theme was migrated to a one-shot effect, route it through playEffect.
        const themeDef =
          this.themeManager && typeof this.themeManager.getThemeDefinition === "function"
            ? this.themeManager.getThemeDefinition(themeName)
            : null;
        if (!themeDef && this.effectManager && this.effectManager.hasEffect(themeName)) {
          this.playEffect(themeName, { stacking: "exclusive" });
          return;
        }

        this.stopOverlayTheme();
        // Clear the entire CSS layer (some effects append non-`.tdv-effect-layer` nodes).
        this.cssEffectManager.clear();
        this.particleManager.clearAll();
        this.canvasManager.stopLoop();
        this.canvasManager.clearCanvas();

        if (!this.themeManager.startTheme(themeName)) return;
        this.lastPlayedEffect = `theme:${themeName}`;
      } catch {
        // ignore
      }
    }

    stopOverlayTheme() {
      try {
        if (this.themeManager) {
          this.themeManager.stopTheme();
        }
      } catch {
        // ignore
      }
    }

    stopAll() {
      try {
        this.stopOverlayTheme();
        this.particleManager.clearAll();
        this.canvasManager.stopLoop();
        this.cssEffectManager.clear();
        this.auraManager.removeAura();
        this.canvasManager.removeOverlay();
      } catch {
        // ignore
      }
    }

    getConfig() {
      return this.configManager.get();
    }

    setConfig(partialConfig) {
      try {
        if (!partialConfig || typeof partialConfig !== "object") return;
        const next = this.configManager.merge(partialConfig);

        if (this.canvasManager && this.canvasManager.overlayRoot) {
          this.canvasManager.setZIndex(next.zIndex);
        }
        if (this.themeManager && typeof this.themeManager.syncActiveThemeOverlay === "function") {
          this.themeManager.syncActiveThemeOverlay();
        }
      } catch {
        // ignore
      }
    }

    resetConfig() {
      this.configManager.reset();
    }

    saveConfig() {
      this.configManager.save();
    }

    loadConfig() {
      this.configManager.load();
      const cfg = this._getConfig();
      if (!cfg) return;
      if (this.canvasManager && this.canvasManager.overlayRoot) {
        this.canvasManager.setZIndex(cfg.zIndex);
      }
    }

    setAura(level) {
      try {
        const normalized = level || "none";
        if (!normalized || normalized === "none") {
          this.setConfig({ aura: { enabled: false, level: "none" } });
          if (this.auraManager) {
            this.auraManager.removeAura();
          }
          return;
        }
        this.setConfig({ aura: { enabled: true, level: normalized } });
        if (this.domEnabled && this.canvasManager && this.canvasManager.ensureOverlay()) {
          if (this.auraManager) {
            this.auraManager.applyFromConfig();
          }
        }
      } catch {
        // ignore
      }
    }

    getDiagnostics() {
      const cfg = this._getConfig();
      return {
        enabled: !!(this.domEnabled && cfg && cfg.enabled),
        overlayExists: !!(this.canvasManager && this.canvasManager.overlayRoot),
        tourObjCaptured: !!(
          this.tourIntegrationManager && this.tourIntegrationManager.isIntegrated()
        ),
        lastPlayedEffect: this.lastPlayedEffect,
        particleCount:
          this.particleManager && this.particleManager.particles
            ? this.particleManager.particles.length
            : 0,
        themeActive: !!(this.themeManager && this.themeManager.isActive()),
        currentTheme:
          this.themeManager && this.themeManager.getActiveTheme
            ? this.themeManager.getActiveTheme()
            : null,
        auraEnabled: !!(cfg && cfg.aura && cfg.aura.enabled),
      };
    }

    getEffectsList() {
      return this.effectManager.getEffectsList();
    }

    getThemesList() {
      return this.themeManager.getThemesList();
    }
  }

  effectsPro._internals.App = App;
})();
