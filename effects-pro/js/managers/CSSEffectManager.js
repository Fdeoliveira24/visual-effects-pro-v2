(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const helpers = effectsPro._internals.helpers || {};
  const dom = effectsPro._internals.dom || {};

  function resolveUrl(path) {
    if (dom && typeof dom.resolveAssetUrl === "function") {
      return dom.resolveAssetUrl(path);
    }
    const baseUrl = (effectsPro && effectsPro.baseUrl) || "";
    const p = typeof path === "string" ? path.trim() : "";
    if (!p) return p;
    if (/^(?:[a-z]+:)?\/\//i.test(p)) return p;
    if (p.indexOf("data:") === 0 || p.indexOf("blob:") === 0) return p;
    if (p[0] === "/") return p;
    if (!baseUrl) return p;
    return baseUrl + p.replace(/^\.\//, "");
  }

  function ensureRuntimeCssFallbackScript() {
    try {
      const head = document.head || document.documentElement || document.body;
      if (!head) return;
      const scriptId = "tdv-effects-pro-styles-css-fallback";
      if (document.getElementById(scriptId)) return;

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = resolveUrl("compat/effects-runtime-fallback.js");
      script.async = true;
      head.appendChild(script);
    } catch {
      // ignore
    }
  }

  class CSSEffectManager {
    constructor({ eventBus }) {
      this.eventBus = eventBus;
      this.canvasManager = null;

      this.stylesInjected = false;
      this.filtersInjected = false;
      this.noiseDataUrl = null;
    }

    setCanvasManager(canvasManager) {
      this.canvasManager = canvasManager;
    }

    ensureBaseInjected() {
      this._injectFilters();
      this._injectStyles();
    }

    clear() {
      const layer = this._getCssLayer();
      if (!layer) return;
      this.clearEffectLayers();
      layer.textContent = "";
    }

    clearEffectLayers() {
      const layer = this._getCssLayer();
      if (!layer) return;
      const layers = layer.querySelectorAll(".tdv-effect-layer");
      for (let i = 0; i < layers.length; i++) {
        const el = layers[i];
        const stopHooks = [
          "_tdvStop",
          "_stopShaderSmoke",
          "_stopShaderBurn",
          "_stopShaderWater",
          "_stopElectric",
          "_stopStorm",
          "_stopSpinningRays",
          "_stopSineWaves",
          "_stopFlowers",
        ];
        for (let j = 0; j < stopHooks.length; j++) {
          const key = stopHooks[j];
          try {
            if (el && typeof el[key] === "function") el[key]();
          } catch {
            // ignore
          }
        }
        try {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch {
          // ignore
        }
      }
    }

    addCssEffect(className, styles, durationMs, removeAfterMs) {
      const layer = this._getCssLayer();
      if (!layer) return null;
      const el = document.createElement("div");
      el.className = `tdv-effect-layer ${className}`;
      if (durationMs) {
        el.style.setProperty("--duration", `${durationMs}ms`);
      }
      if (styles) {
        Object.keys(styles).forEach((key) => {
          if (key.indexOf("--") === 0) el.style.setProperty(key, styles[key]);
          else el.style[key] = styles[key];
        });
      }
      layer.appendChild(el);
      const cleanupMs = typeof removeAfterMs === "number" ? removeAfterMs : durationMs;
      if (cleanupMs) {
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, cleanupMs + 120);
      }
      return el;
    }

    buildAsciiText(fontSizePx) {
      const size =
        this.canvasManager && this.canvasManager.getStageSize
          ? this.canvasManager.getStageSize()
          : { w: window.innerWidth || 800, h: window.innerHeight || 600 };
      const font = Math.max(6, Number(fontSizePx) || 10);
      const cols = Math.max(20, Math.floor(size.w / (font * 0.6)));
      const rows = Math.max(10, Math.floor(size.h / (font * 1.1)));
      const chars = " .,:;irsXA253hMHGS#9B&@";
      let output = "";
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < cols; c++) {
          line += chars[helpers.randInt(0, chars.length - 1)];
        }
        output += line + (r < rows - 1 ? "\n" : "");
      }
      return output;
    }

    getNoiseDataUrl() {
      if (this.noiseDataUrl) return this.noiseDataUrl;
      try {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const image = ctx.createImageData(size, size);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
          const v = Math.floor(Math.random() * 256);
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        this.noiseDataUrl = canvas.toDataURL("image/png");
        return this.noiseDataUrl;
      } catch {
        return null;
      }
    }

    _injectFilters() {
      if (this.filtersInjected) return;
      if (!document.body) return;
      try {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
        svg.innerHTML =
          "<defs>" +
          '<filter id="tdv-filter-bulge">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" result="noise"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G"/>' +
          "</filter>" +
          '<filter id="tdv-filter-watercolor">' +
          '<feGaussianBlur stdDeviation="1.6" result="blur"/>' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise"/>' +
          '<feDisplacementMap in="blur" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G"/>' +
          "</filter>" +
          "</defs>";
        document.body.appendChild(svg);
        this.filtersInjected = true;
      } catch {
        // ignore
      }
    }

    _injectStyles() {
      if (this.stylesInjected) return;
      try {
        const el =
          dom && typeof dom.ensureStylesheet === "function"
            ? dom.ensureStylesheet("css/effects-runtime.css", "tdv-effects-pro-styles")
            : null;

        const link = el || document.getElementById("tdv-effects-pro-styles");
        if (link && link.tagName === "LINK") {
          if (!link.dataset || link.dataset.tdvFallbackBound !== "true") {
            try {
              link.dataset.tdvFallbackBound = "true";
            } catch {
              // ignore
            }
            link.addEventListener("error", ensureRuntimeCssFallbackScript, { once: true });
          }
          this.stylesInjected = true;
          return;
        }

        const head = document.head || document.documentElement || document.body;
        if (!head) return;

        const existing = document.getElementById("tdv-effects-pro-styles");
        if (existing) {
          this.stylesInjected = true;
          return;
        }

        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = resolveUrl("css/effects-runtime.css");
        styleLink.id = "tdv-effects-pro-styles";
        styleLink.addEventListener("error", ensureRuntimeCssFallbackScript, { once: true });
        head.appendChild(styleLink);
        this.stylesInjected = true;
      } catch {
        // ignore
      }
    }

    _getCssLayer() {
      if (!this.canvasManager || typeof this.canvasManager.getCssLayer !== "function") return null;
      return this.canvasManager.getCssLayer();
    }
  }

  effectsPro._internals.CSSEffectManager = CSSEffectManager;
})();
