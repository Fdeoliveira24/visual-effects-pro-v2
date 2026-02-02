(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const dom = effectsPro._internals.dom || {};

  class CanvasManager {
    constructor({ state, eventBus }) {
      this.state = state;
      this.eventBus = eventBus;

      this.overlayRoot = null;
      this.canvas = null;
      this.ctx = null;
      this.cssLayer = null;
      this.size = { w: 0, h: 0, dpr: 1 };

      this.resizeBound = false;
      this.pendingOverlay = false;

      this.rafId = null;
      this.lastTs = 0;

      this._boundResize = this._resizeCanvas.bind(this);
      this._boundLoop = this._loop.bind(this);

      // Injected dependencies (set by App).
      this.particleManager = null;
      this.themeManager = null;
      this.cssEffectManager = null;
      this.auraManager = null;
    }

    setDependencies({ particleManager, themeManager, cssEffectManager, auraManager }) {
      this.particleManager = particleManager || this.particleManager;
      this.themeManager = themeManager || this.themeManager;
      this.cssEffectManager = cssEffectManager || this.cssEffectManager;
      this.auraManager = auraManager || this.auraManager;
    }

    ensureOverlay() {
      if (this.overlayRoot) return true;

      if (!document.body) {
        if (!this.pendingOverlay) {
          this.pendingOverlay = true;
          document.addEventListener(
            "DOMContentLoaded",
            () => {
              this.pendingOverlay = false;
              const cfg = this._getConfig();
              const shouldShow =
                !!cfg &&
                !!cfg.enabled &&
                (cfg.mode === "dom" || cfg.mode === "both" || cfg.mode === "button");
              if (shouldShow) this.ensureOverlay();
            },
            { once: true }
          );
        }
        return false;
      }

      try {
        if (
          this.cssEffectManager &&
          typeof this.cssEffectManager.ensureBaseInjected === "function"
        ) {
          this.cssEffectManager.ensureBaseInjected();
        }

        const cfg = this._getConfig();
        const root = document.createElement("div");
        root.id = "tdv-effects-root";
        root.style.setProperty("--tdv-effects-z", String(cfg && cfg.zIndex ? cfg.zIndex : 999999));
        root.style.zIndex = String(cfg && cfg.zIndex ? cfg.zIndex : 999999);
        root.setAttribute("aria-hidden", "true");

        const canvas = document.createElement("canvas");
        const cssLayer = document.createElement("div");
        cssLayer.className = "tdv-css-overlay";

        root.appendChild(canvas);
        root.appendChild(cssLayer);

        const viewer = document.getElementById("viewer");
        const parent = viewer || document.body;
        if (viewer) {
          root.style.position = "absolute";
          root.style.inset = "0";
        } else {
          root.style.position = "fixed";
          root.style.inset = "0";
        }
        root.style.pointerEvents = "none";
        parent.appendChild(root);

        this.overlayRoot = root;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.cssLayer = cssLayer;

        this._resizeCanvas();
        if (!this.resizeBound) {
          window.addEventListener("resize", this._boundResize);
          this.resizeBound = true;
        }

        this.state.setState({
          canvas: {
            width: this.size.w,
            height: this.size.h,
            dpr: this.size.dpr,
            ctx: this.ctx,
            canvasEl: this.canvas,
          },
          ui: { overlayVisible: true },
        });

        if (this.eventBus) {
          this.eventBus.emit("overlay:ready", { root, canvas, cssLayer });
        }
        return true;
      } catch {
        return false;
      }
    }

    removeOverlay() {
      try {
        this.stopLoop();
        this.clearCanvas();

        if (this.auraManager && typeof this.auraManager.removeAura === "function") {
          this.auraManager.removeAura();
        }

        if (this.cssEffectManager && typeof this.cssEffectManager.clear === "function") {
          this.cssEffectManager.clear();
        } else if (this.cssLayer) {
          this.cssLayer.textContent = "";
        }

        if (this.overlayRoot && this.overlayRoot.parentNode) {
          this.overlayRoot.parentNode.removeChild(this.overlayRoot);
        }

        this.overlayRoot = null;
        this.canvas = null;
        this.ctx = null;
        this.cssLayer = null;
        this.size = { w: 0, h: 0, dpr: 1 };

        if (this.resizeBound) {
          window.removeEventListener("resize", this._boundResize);
          this.resizeBound = false;
        }

        this.state.setState({
          canvas: { width: 0, height: 0, dpr: 1, ctx: null, canvasEl: null },
          ui: { overlayVisible: false },
        });

        if (this.eventBus) {
          this.eventBus.emit("overlay:removed");
        }
      } catch {
        // ignore
      }
    }

    getCssLayer() {
      return this.cssLayer;
    }

    getStageSize() {
      const w = this.size.w || window.innerWidth || 800;
      const h = this.size.h || window.innerHeight || 600;
      return { w, h };
    }

    setZIndex(zIndex) {
      if (!this.overlayRoot) return;
      const z = String(Number(zIndex) || 999999);
      this.overlayRoot.style.setProperty("--tdv-effects-z", z);
      this.overlayRoot.style.zIndex = z;
    }

    clearCanvas() {
      if (!this.ctx || !this.canvas) return;
      try {
        const w = this.size.w || this.canvas.width;
        const h = this.size.h || this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
      } catch {
        // ignore
      }
    }

    startLoop() {
      if (this.rafId) return;
      this.lastTs = 0;
      this.rafId = requestAnimationFrame(this._boundLoop);
    }

    stopLoop() {
      if (!this.rafId) return;
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.lastTs = 0;
    }

    requestFrame() {
      // Called when something starts emitting particles.
      if (!this.rafId) this.startLoop();
    }

    _loop(ts) {
      try {
        if (!this.ctx || !this.canvas) {
          this.rafId = null;
          return;
        }

        const dt = this.lastTs ? Math.min(0.05, (ts - this.lastTs) / 1000) : 0.016;
        this.lastTs = ts;
        const w = this.size.w || this.canvas.width;
        const h = this.size.h || this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);

        if (this.themeManager && typeof this.themeManager.onFrame === "function") {
          this.themeManager.onFrame(dt, w, h);
        }

        if (this.particleManager && typeof this.particleManager.updateAndDraw === "function") {
          this.particleManager.updateAndDraw(this.ctx, dt, w, h);
        }

        const hasParticles =
          this.particleManager && typeof this.particleManager.hasActiveParticles === "function"
            ? this.particleManager.hasActiveParticles()
            : false;
        let themeLoopActive = false;
        if (this.themeManager) {
          if (typeof this.themeManager.isLoopActive === "function") {
            themeLoopActive = this.themeManager.isLoopActive();
          } else if (typeof this.themeManager.isActive === "function") {
            themeLoopActive = this.themeManager.isActive();
          }
        }

        if (hasParticles || themeLoopActive) {
          this.rafId = requestAnimationFrame(this._boundLoop);
        } else {
          this.rafId = null;
          this.lastTs = 0;
        }
      } catch {
        this.rafId = null;
        this.lastTs = 0;
      }
    }

    _resizeCanvas() {
      if (!this.overlayRoot || !this.canvas || !this.ctx) return;
      try {
        const rect = this.overlayRoot.getBoundingClientRect();
        const cfg = this._getConfig();
        const dpr = dom.getEffectiveDevicePixelRatio ? dom.getEffectiveDevicePixelRatio(cfg) : 1;
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);

        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.size = { w, h, dpr };

        this.state.setState({
          canvas: {
            width: w,
            height: h,
            dpr,
            ctx: this.ctx,
            canvasEl: this.canvas,
          },
        });

        if (this.eventBus) {
          this.eventBus.emit("canvas:resized", { width: w, height: h, dpr });
        }
      } catch {
        // ignore
      }
    }

    _getConfig() {
      const s =
        this.state && typeof this.state.getState === "function" ? this.state.getState() : null;
      return s && s.config ? s.config : null;
    }
  }

  effectsPro._internals.CanvasManager = CanvasManager;
})();
