(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const { hexToRgba } = effectsPro._internals.color || {};

  class AuraManager {
    constructor({ state, eventBus }) {
      this.state = state;
      this.eventBus = eventBus;
      this.canvasManager = null;
      this.auraEl = null;
    }

    setCanvasManager(canvasManager) {
      this.canvasManager = canvasManager;
    }

    removeAura() {
      if (this.auraEl && this.auraEl.parentNode) {
        this.auraEl.parentNode.removeChild(this.auraEl);
      }
      this.auraEl = null;
    }

    applyFromConfig() {
      const cssLayer =
        this.canvasManager && this.canvasManager.getCssLayer
          ? this.canvasManager.getCssLayer()
          : null;
      if (!cssLayer) return;

      this.removeAura();
      const cfg = this.state.getState().config;
      const auraCfg = cfg && cfg.aura ? cfg.aura : null;
      if (!auraCfg || !auraCfg.enabled || auraCfg.level === "none") return;
      const levelCfg = auraCfg[auraCfg.level];
      if (!levelCfg) return;

      const intensity = typeof levelCfg.intensity === "number" ? levelCfg.intensity : 0.3;
      const color = levelCfg.color || "#ffffff";
      const auraColor =
        typeof color === "string" && color.indexOf("#") === 0 && typeof hexToRgba === "function"
          ? hexToRgba(color, intensity)
          : color;

      const el = document.createElement("div");
      el.className = "tdv-aura";
      el.style.background = `radial-gradient(circle at 50% 40%, ${auraColor} 0%, rgba(0,0,0,0) 70%)`;
      el.style.opacity = String(intensity);
      cssLayer.appendChild(el);
      this.auraEl = el;

      if (this.eventBus) {
        this.eventBus.emit("aura:applied", { level: auraCfg.level });
      }
    }

    setAura(level) {
      const normalized = level || "none";
      if (normalized === "none") {
        this.state.setState({ config: { aura: { enabled: false, level: "none" } } });
        this.removeAura();
        if (this.eventBus) {
          this.eventBus.emit("aura:changed", { level: "none" });
        }
        return;
      }

      this.state.setState({ config: { aura: { enabled: true, level: normalized } } });
      this.applyFromConfig();
      if (this.eventBus) {
        this.eventBus.emit("aura:changed", { level: normalized });
      }
    }
  }

  effectsPro._internals.AuraManager = AuraManager;
})();
