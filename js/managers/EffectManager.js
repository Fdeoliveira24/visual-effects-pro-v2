(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const helpers = effectsPro._internals.helpers || {};
  const dom = effectsPro._internals.dom || {};
  const particles = effectsPro._internals.particles || {};
  const color = effectsPro._internals.color || {};

  const { deepMerge, isPlainObject, clamp, rand, pick } = helpers;

  function getStageSize(canvasManager) {
    if (canvasManager && typeof canvasManager.getStageSize === "function") {
      return canvasManager.getStageSize();
    }
    return { w: window.innerWidth || 800, h: window.innerHeight || 600 };
  }

  function makeCtx(manager) {
    const cfg = manager._getConfig();
    return {
      config: cfg,
      getConfig: () => manager._getConfig(),
      canvasManager: manager.canvasManager,
      cssEffectManager: manager.cssEffectManager,
      particleManager: manager.particleManager,
      cssLayer:
        manager.canvasManager && typeof manager.canvasManager.getCssLayer === "function"
          ? manager.canvasManager.getCssLayer()
          : null,
      clamp,
      rand,
      pick,
      particles,
      scaleCount: (count, min) =>
        typeof dom.scaleCount === "function"
          ? dom.scaleCount(count, cfg, min)
          : Math.max(typeof min === "number" ? min : 1, typeof count === "number" ? count : 0),
      scaleDuration: (ms, min) =>
        typeof dom.scaleDuration === "function"
          ? dom.scaleDuration(ms, cfg, min)
          : Math.max(min || 120, Math.round(ms || 0)),
      addCssEffect: (className, styles, durationMs, removeAfterMs) =>
        manager.cssEffectManager && typeof manager.cssEffectManager.addCssEffect === "function"
          ? manager.cssEffectManager.addCssEffect(className, styles, durationMs, removeAfterMs)
          : null,
      addParticles: (list) =>
        manager.particleManager && typeof manager.particleManager.addParticles === "function"
          ? manager.particleManager.addParticles(list)
          : undefined,
      buildAsciiText: (fontSizePx) =>
        manager.cssEffectManager && typeof manager.cssEffectManager.buildAsciiText === "function"
          ? manager.cssEffectManager.buildAsciiText(fontSizePx)
          : "",
      getNoiseDataUrl: () =>
        manager.cssEffectManager && typeof manager.cssEffectManager.getNoiseDataUrl === "function"
          ? manager.cssEffectManager.getNoiseDataUrl()
          : null,
      getStageSize: () => getStageSize(manager.canvasManager),
    };
  }

  function effectFlash(ctx, cfg) {
    const { scaleDuration, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 200, 120);
    addCssEffect("tdv-flash", { background: cfg.color || "rgba(255,255,255,0.9)" }, duration);
  }

  function effectFade(ctx, cfg) {
    const { scaleDuration, addCssEffect } = ctx;
    const duration = scaleDuration((cfg && cfg.durationMs) || 900, 200);

    const easingKey = cfg && typeof cfg.easing === "string" ? cfg.easing : "standard";
    const easingMap = {
      standard: "cubic-bezier(0.4,0,0.2,1)",
      linear: "linear",
      easeInOut: "ease-in-out",
      easeOut: "cubic-bezier(0.16,1,0.3,1)",
      easeIn: "cubic-bezier(0.4,0,1,1)",
    };
    const easing =
      easingKey && typeof easingKey === "string"
        ? easingMap[easingKey] || easingKey
        : easingMap.standard;

    const blendMode = cfg && typeof cfg.blendMode === "string" ? cfg.blendMode : "normal";

    let background = cfg && typeof cfg.color === "string" ? cfg.color : "";
    if (!background) {
      const alphaRaw = cfg && typeof cfg.opacity !== "undefined" ? Number(cfg.opacity) : 0.85;
      const alpha = Number.isFinite(alphaRaw) ? clamp(alphaRaw, 0, 1) : 0.85;
      const colorHex = cfg && typeof cfg.colorHex === "string" ? cfg.colorHex : "#000000";
      background =
        color && typeof color.hexToRgba === "function"
          ? color.hexToRgba(colorHex, alpha)
          : `rgba(0,0,0,${alpha})`;
    }

    const styles = { background, "--tdv-fade-ease": easing };
    if (blendMode && blendMode !== "normal") styles.mixBlendMode = blendMode;
    addCssEffect("tdv-fade", styles, duration);
  }

  function effectSweep(ctx, cfg) {
    const { scaleDuration, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 800, 200);
    let directionClass = "tdv-sweep-left";
    let gradientAngle = "90deg";

    if (cfg.direction === "right") {
      directionClass = "tdv-sweep-right";
    } else if (cfg.direction === "top" || cfg.direction === "up") {
      directionClass = "tdv-sweep-top";
      gradientAngle = "180deg";
    } else if (cfg.direction === "bottom" || cfg.direction === "down") {
      directionClass = "tdv-sweep-bottom";
      gradientAngle = "180deg";
    }

    addCssEffect(
      directionClass,
      {
        background: `linear-gradient(${gradientAngle}, rgba(0,0,0,0), ${
          cfg.color || "rgba(255,255,255,0.75)"
        }, rgba(0,0,0,0))`,
      },
      duration
    );
  }

  function effectCinema(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    const duration = scaleDuration(cfg.durationMs || 600, 200);
    const barHeight = `${Math.max(6, Math.min(25, cfg.barHeightPercent || 12))}%`;
    const color = cfg.color || "#000000";

    const topBar = document.createElement("div");
    topBar.className = "tdv-cinema-bar tdv-cinema-top";
    topBar.style.setProperty("--duration", `${duration}ms`);
    topBar.style.setProperty("--bar-height", barHeight);
    topBar.style.setProperty("--color", color);

    const bottomBar = document.createElement("div");
    bottomBar.className = "tdv-cinema-bar tdv-cinema-bottom";
    bottomBar.style.setProperty("--duration", `${duration}ms`);
    bottomBar.style.setProperty("--bar-height", barHeight);
    bottomBar.style.setProperty("--color", color);

    if (cssLayer) {
      cssLayer.appendChild(topBar);
      cssLayer.appendChild(bottomBar);
      setTimeout(() => {
        if (topBar.parentNode) topBar.parentNode.removeChild(topBar);
        if (bottomBar.parentNode) bottomBar.parentNode.removeChild(bottomBar);
      }, duration + 120);
    }
  }

  function effectRadial(ctx, cfg) {
    const { scaleDuration, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 700, 200);
    addCssEffect("tdv-radial", { "--color": cfg.color || "rgba(255,255,255,0.5)" }, duration);
  }

  function effectRipple(ctx, cfg) {
    const { scaleDuration, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 900, 200);
    const rings = Math.max(1, Math.min(6, cfg.rings || 3));
    const spacing = Math.max(60, Math.round(duration / (rings + 1)));
    for (let i = 0; i < rings; i++) {
      const delay = i * spacing;
      addCssEffect(
        "tdv-ripple-ring",
        {
          "--color": cfg.color || "rgba(255,255,255,0.45)",
          "--delay": `${delay}ms`,
        },
        duration,
        duration + delay
      );
    }
  }

  function effectRippleReverse(ctx, cfg) {
    const { scaleDuration, clamp, cssLayer } = ctx;
    if (!cssLayer) return;

    const duration = scaleDuration(cfg.durationMs || 600, 200);
    const color = cfg.color || "#FF384B";
    const reverseDelay = clamp(Number(cfg.reverseDelay) || 0, 0, 2000);
    const holdTime = clamp(Number(cfg.holdTime) || 300, 0, 5000);
    const easing = cfg.easing || "ease-out";
    const updateBackground = cfg.updateBackground === true;
    const origin = cfg.origin || "center";
    const opacity = clamp(Number(cfg.opacity) || 1.0, 0.1, 1.0);
    const borderWidth = clamp(Number(cfg.borderWidth) || 0, 0, 50);
    const borderColor = cfg.borderColor || "#ffffff";

    // Mode: reverse | wobble | liquid (mutually exclusive). Backwards compatibility for old booleans.
    // Mode: reverse | wobble | liquid
    let mode = cfg.mode || "reverse";
    if (typeof cfg.mode === "undefined") {
      // Backwards compatibility
      if (cfg.reverse === false) mode = "none";
      else if (cfg.wobble) mode = "wobble";
      else if (cfg.liquid) mode = "liquid";
    }

    const isReverse = mode === "reverse";
    const isWobble = mode === "wobble";
    const isLiquid = mode === "liquid";

    let container = cssLayer.querySelector(".tdv-ripple-reverse-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "tdv-ripple-reverse-container";
      cssLayer.appendChild(container);
    }

    const ripple = document.createElement("span");
    ripple.className = "tdv-ripple-reverse";
    if (easing === "elastic") ripple.classList.add("elastic");
    if (easing === "bounce") ripple.classList.add("bounce");
    if (isWobble) ripple.classList.add("wobble");
    if (isLiquid) ripple.classList.add("liquid");

    // Calculate origin position
    const positions = {
      "top-left": { x: 0, y: 0 },
      "top-center": { x: window.innerWidth / 2, y: 0 },
      "top-right": { x: window.innerWidth, y: 0 },
      "middle-left": { x: 0, y: window.innerHeight / 2 },
      center: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      "middle-right": { x: window.innerWidth, y: window.innerHeight / 2 },
      "bottom-left": { x: 0, y: window.innerHeight },
      "bottom-center": { x: window.innerWidth / 2, y: window.innerHeight },
      "bottom-right": { x: window.innerWidth, y: window.innerHeight },
    };

    const pos = positions[origin] || positions.center;
    const size = Math.max(window.innerWidth, window.innerHeight) * 2.5;

    ripple.style.left = `${pos.x}px`;
    ripple.style.top = `${pos.y}px`;
    ripple.style.width = "0";
    ripple.style.height = "0";
    ripple.style.backgroundColor = color;
    ripple.style.opacity = String(opacity);
    ripple.style.setProperty("--duration", `${duration}ms`);

    if (borderWidth > 0) {
      ripple.style.border = `${borderWidth}px solid ${borderColor}`;
      ripple.style.boxSizing = "border-box";
    }

    container.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
    });

    if (updateBackground) {
      setTimeout(() => {
        document.body.style.backgroundColor = color;
      }, duration * 0.5);
    }

    // Boomerang timing: expand -> hold -> optional delay -> reverse -> cleanup
    const reverseStart = duration + holdTime + reverseDelay;

    setTimeout(() => {
      if (isReverse) {
        ripple.classList.add("reversing");
        ripple.style.width = "0";
        ripple.style.height = "0";
        ripple.style.opacity = "0";

        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
          if (container.children.length === 0 && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }, duration);
      } else {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
        if (container.children.length === 0 && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    }, reverseStart);
  }

  // eslint-disable-next-line max-lines-per-function
  function effectWaterRipple(ctx, cfg) {
    const { scaleDuration, getStageSize, cssLayer, rand } = ctx;
    const duration = scaleDuration(cfg.durationMs || 3000, 600);
    const resolution = cfg.resolution || 512;
    const perturbance = cfg.perturbance || 0.03;
    const dropCount = Math.min(cfg.dropCount || 5, 10);

    const size = getStageSize();
    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-water-ripple";
    container.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;";

    const canvas = document.createElement("canvas");
    canvas.width = resolution;
    canvas.height = Math.round(resolution * (size.h / size.w));
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const gl =
      canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });

    if (!gl) {
      // CSS fallback - visible ripple circles.
      container.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0;animation:tdv-fade-in-out ${
        duration
      }ms ease-in-out;`;

      for (let i = 0; i < dropCount; i++) {
        const ripple = document.createElement("div");
        const x = rand(20, 80);
        const y = rand(20, 80);
        const delay = (i * duration) / dropCount;
        ripple.style.cssText = `position:absolute;left:${x}%;top:${
          y
        }%;width:0;height:0;border-radius:50%;border:2px solid rgba(100, 180, 255, 0.6);transform:translate(-50%,-50%);animation:tdv-water-ripple-expand 1.5s ease-out ${
          delay
        }ms;`;
        container.appendChild(ripple);
      }

      if (cssLayer) {
        cssLayer.appendChild(container);
        const timerId = setTimeout(() => {
          if (container.parentNode) container.parentNode.removeChild(container);
        }, duration);
        container._tdvStop = function () {
          try {
            clearTimeout(timerId);
          } catch {
            // ignore
          }
          if (container.parentNode) container.parentNode.removeChild(container);
        };
      }
      return;
    }

    // WebGL implementation.
    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_perturbance;
      uniform vec2 u_resolution;
      uniform vec2 u_drops[10];
      uniform float u_dropTimes[10];
      uniform int u_dropCount;

      void main() {
        vec2 uv = vUv;
        vec3 color = vec3(0.0);
        float totalAlpha = 0.0;

        for (int i = 0; i < 10; i++) {
          if (i >= u_dropCount) break;
          vec2 dropPos = u_drops[i];
          float dropTime = u_dropTimes[i];
          float time = u_time - dropTime;

          if (time >= 0.0 && time < 2.0) {
            vec2 diff = uv - dropPos;
            float dist = length(diff);

            for (int j = 0; j < 3; j++) {
              float ringOffset = float(j) * 0.15;
              float waveSpeed = 0.4;
              float waveRadius = (time + ringOffset) * waveSpeed;
              float ringWidth = 0.03;
              float ringDist = abs(dist - waveRadius);
              float ring = smoothstep(ringWidth, ringWidth * 0.3, ringDist);
              float damping = (1.0 - smoothstep(0.0, 2.0, time)) * (1.0 - smoothstep(0.0, 0.8, dist));
              ring *= damping;
              color += vec3(0.3, 0.6, 0.9) * ring * 0.8;
              totalAlpha += ring * 0.5;
            }
          }
        }

        gl_FragColor = vec4(color, min(totalAlpha, 0.7));
      }
    `;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        try {
          console.error("[effectsPro][WaterRipple] Shader error:", gl.getShaderInfoLog(shader));
        } catch {
          // ignore
        }
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      try {
        console.error(
          "[effectsPro][WaterRipple] Program link error:",
          gl.getProgramInfoLog(program)
        );
      } catch {
        // ignore
      }
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uPerturbance = gl.getUniformLocation(program, "u_perturbance");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uDrops = gl.getUniformLocation(program, "u_drops");
    const uDropTimes = gl.getUniformLocation(program, "u_dropTimes");
    const uDropCount = gl.getUniformLocation(program, "u_dropCount");

    gl.uniform1f(uPerturbance, perturbance);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1i(uDropCount, dropCount);

    const drops = [];
    const dropTimes = [];
    for (let i = 0; i < dropCount; i++) {
      drops.push(rand(0.2, 0.8), rand(0.2, 0.8));
      dropTimes.push(i * (duration / 1000 / dropCount));
    }
    while (drops.length < 20) drops.push(0.5, 0.5);
    while (dropTimes.length < 10) dropTimes.push(999.0);

    gl.uniform2fv(uDrops, new Float32Array(drops));
    gl.uniform1fv(uDropTimes, new Float32Array(dropTimes));

    const startTime = Date.now();
    let stopped = false;
    let rafId = null;

    function cleanup() {
      if (stopped) return;
      stopped = true;
      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      try {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      } catch {
        // ignore
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    }
    container._tdvStop = cleanup;

    function render() {
      if (stopped) return;
      const elapsed = (Date.now() - startTime) / 1000.0;
      if (elapsed > duration / 1000) {
        cleanup();
        return;
      }
      gl.uniform1f(uTime, elapsed);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    }

    if (cssLayer) {
      cssLayer.appendChild(container);
      rafId = requestAnimationFrame(render);
    }
  }

  function effectWater(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createShaderWaterOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createShaderWaterOverlay : null;
    if (typeof createShaderWaterOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      const el = overlayEl;
      overlayEl = null;
      if (!el) return;

      try {
        if (typeof el._stopShaderWater === "function") {
          el._stopShaderWater();
          return;
        }
      } catch {
        // ignore
      }

      try {
        el.style.transition = "opacity 240ms ease";
        el.style.opacity = "0";
      } catch {
        // ignore
      }

      setTimeout(() => {
        try {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch {
          // ignore
        }
      }, 260);
    }

    overlayEl = createShaderWaterOverlay(ctx, cfg);
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectConfetti(ctx, cfg) {
    const { scaleCount, scaleDuration, getStageSize, addParticles, rand, pick, particles: p } = ctx;
    const count = scaleCount(cfg.count || 160, 20);
    const duration = scaleDuration(cfg.durationMs || 3500, 600) / 1000;
    const colors = cfg.colors && cfg.colors.length ? cfg.colors : ["#ffffff"];
    const list = [];
    const size = getStageSize();

    // New Controls
    const origin = cfg.origin || "cannon"; // cannon | rain | explosion
    const speedMin = Number(cfg.speedMin) || 40;
    const speedMax = Number(cfg.speedMax) || 120;
    const gravity = Number.isFinite(Number(cfg.gravity)) ? Number(cfg.gravity) : 300;
    const wind = Number(cfg.wind) || 0;
    const shape = cfg.shape || "mixed";
    const sizeMin = Number(cfg.sizeMin) || 6;
    const sizeMax = Number(cfg.sizeMax) || 12;

    for (let i = 0; i < count; i++) {
      let x, y, vxMin, vxMax, vyMin, vyMax;

      if (origin === "rain") {
        x = rand(0, size.w);
        y = rand(-200, 0); // Start above screen
        vxMin = -30;
        vxMax = 30;
        // Rain falls DOWN, so positive vy
        vyMin = speedMin * 2;
        vyMax = speedMax * 2;
      } else if (origin === "explosion") {
        x = size.w / 2;
        y = size.h / 2; // Center burst
        vxMin = -speedMax * 3;
        vxMax = speedMax * 3;
        vyMin = -speedMax * 3;
        vyMax = speedMax * 3;
      } else {
        // "cannon" (Default) - Bottom Up
        x = rand(0, size.w);
        y = rand(size.h * 0.65, size.h);
        vxMin = -140;
        vxMax = 140;
        // Cannon shoots UP, so negative vy
        vyMin = -speedMax * 2.5;
        vyMax = -speedMin;
      }

      list.push(
        new p.ConfettiParticle(x, y, pick(colors), duration, {
          vxMin,
          vxMax,
          vyMin,
          vyMax,
          gravity,
          shape,
          sizeMin,
          sizeMax,
          wind,
        })
      );
    }
    addParticles(list);
  }

  function effectSparkles(ctx, cfg) {
    const { scaleCount, scaleDuration, getStageSize, addParticles, rand, particles: p } = ctx;
    const count = scaleCount(cfg.count || 90, 20);
    const duration = scaleDuration(cfg.durationMs || 2600, 400) / 1000;
    const list = [];
    const size = getStageSize();
    for (let i = 0; i < count; i++) {
      list.push(
        new p.SparkleParticle(rand(0, size.w), rand(0, size.h), cfg.color || "#ffffff", duration)
      );
    }
    addParticles(list);
  }

  function effectGlitter(ctx, cfg) {
    const { scaleCount, scaleDuration, getStageSize, addParticles, rand, pick, particles: p } = ctx;
    const count = scaleCount(cfg.count || 80, 20);
    const duration = scaleDuration(cfg.durationMs || 2500, 400) / 1000;
    const colors = cfg.colors && cfg.colors.length ? cfg.colors : ["#ffffff"];
    const list = [];
    const size = getStageSize();
    for (let i = 0; i < count; i++) {
      list.push(new p.GlitterParticle(rand(0, size.w), rand(0, size.h), pick(colors), duration));
    }
    addParticles(list);
  }

  function effectDust(ctx, cfg) {
    const { scaleCount, scaleDuration, getStageSize, addParticles, rand, particles: p } = ctx;
    const count = scaleCount(cfg.count || 80, 20);
    const duration = scaleDuration(cfg.durationMs || 4000, 600) / 1000;
    const list = [];
    const size = getStageSize();
    for (let i = 0; i < count; i++) {
      list.push(
        new p.DustParticle(
          rand(0, size.w),
          rand(0, size.h),
          cfg.color || "rgba(139,115,85,0.6)",
          duration
        )
      );
    }
    addParticles(list);
  }

  // Rain supports both legacy burst and theme-like continuous modes.
  // eslint-disable-next-line max-lines-per-function
  function effectRain(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;

    if (!p || !p.RainParticle) return;

    const modeRaw = cfg && typeof cfg.mode === "string" ? cfg.mode : "";
    const mode = modeRaw || (typeof cfg.emissionRate !== "undefined" ? "continuous" : "burst");

    const getColors = () => {
      if (Array.isArray(cfg.colors) && cfg.colors.length) {
        const filtered = cfg.colors.filter(Boolean);
        if (filtered.length) return filtered;
      }
      if (typeof cfg.color === "string" && cfg.color) return [cfg.color];
      if (typeof cfg.colorHex === "string" && cfg.colorHex) {
        const rgba =
          color && typeof color.hexToRgba === "function"
            ? color.hexToRgba(cfg.colorHex, 0.7)
            : cfg.colorHex;
        return [rgba];
      }
      return ["rgba(174,194,224,0.7)"];
    };

    // Legacy burst mode (backwards compatible).
    if (mode !== "continuous") {
      const count = scaleCount(Number(cfg.count) || 220, 40);
      const duration = scaleDuration(Number(cfg.durationMs) || 4200, 800) / 1000;
      const colors = getColors();
      const particleCfg = {
        lengthMin: cfg.lengthMin,
        lengthMax: cfg.lengthMax,
        speedMin: cfg.speedMin,
        speedMax: cfg.speedMax,
        drift: cfg.drift,
        windVarMin: cfg.windVarMin,
        windVarMax: cfg.windVarMax,
        thicknessMin: cfg.thicknessMin,
        thicknessMax: cfg.thicknessMax,
        splashes: cfg.splashes,
        direction: cfg.direction,
      };

      const list = [];
      const size = getStageSize();
      for (let i = 0; i < count; i++) {
        list.push(
          new p.RainParticle(rand(0, size.w), rand(-200, 0), pick(colors), duration, particleCfg)
        );
      }
      addParticles(list);
      return;
    }

    // Continuous (theme-like) mode.
    if (!cssLayer || !particleManager) {
      // Graceful fallback to burst if the overlay isn't available.
      effectRain(ctx, { ...cfg, mode: "burst" });
      return;
    }

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);

    let emissionRate = Number(cfg.emissionRate);
    if (!Number.isFinite(emissionRate)) emissionRate = 26;
    emissionRate = scaleCount(emissionRate, 2);

    let maxParticles = Number(cfg.maxParticles);
    if (!Number.isFinite(maxParticles)) maxParticles = 220;
    maxParticles = scaleCount(maxParticles, 30);

    const intensity = typeof cfg.intensity === "string" ? cfg.intensity : "medium";
    if (intensity === "soft") {
      emissionRate *= 0.7;
      maxParticles = Math.max(10, Math.round(maxParticles * 0.7));
    } else if (intensity === "heavy") {
      emissionRate *= 1.2;
      maxParticles = Math.round(maxParticles * 1.2);
    } else if (intensity === "storm") {
      emissionRate *= 1.7;
      maxParticles = Math.round(maxParticles * 1.7);
    }

    const particleLifeMinSec = clamp(Number(cfg.particleLifeMinSec) || 1.2, 0.25, 30);
    const particleLifeMaxSec = clamp(Number(cfg.particleLifeMaxSec) || 2.4, particleLifeMinSec, 45);

    const colors = getColors();
    const particleCfg = {
      lengthMin: cfg.lengthMin,
      lengthMax: cfg.lengthMax,
      speedMin: cfg.speedMin,
      speedMax: cfg.speedMax,
      drift: cfg.drift,
      windVarMin: cfg.windVarMin,
      windVarMax: cfg.windVarMax,
      thicknessMin: cfg.thicknessMin,
      thicknessMax: cfg.thicknessMax,
      splashes: cfg.splashes,
      direction: cfg.direction,
    };

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-rain";
    layerToken.setAttribute("aria-hidden", "true");
    layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    const tag = "rain";

    function countActive() {
      const all = Array.isArray(particleManager.particles) ? particleManager.particles : [];
      let count = 0;
      for (let i = 0; i < all.length; i++) {
        const particle = all[i];
        if (particle && particle._tdvEffectTag === tag) count += 1;
      }
      return count;
    }

    function spawn(toSpawn) {
      if (!toSpawn) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];

      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const lifeSec = rand(particleLifeMinSec, particleLifeMaxSec);
        const particle = new p.RainParticle(
          rand(0, stage.w),
          rand(-200, 0),
          pick(colors),
          lifeSec,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart immediately so users see the effect right away.
    spawn(Math.max(1, Math.min(10, Math.round(emissionRate * 0.35))));
    rafId = requestAnimationFrame(tick);
  }

  // Bubbles as a theme-like one-shot (spawns over time, cleans up after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectBubbles(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;

    if (!p || !p.BubbleParticle) return;

    const modeRaw = cfg && typeof cfg.mode === "string" ? cfg.mode : "";
    const mode = modeRaw || (typeof cfg.emissionRate !== "undefined" ? "continuous" : "burst");

    const getColors = () => {
      const colorMode = cfg && typeof cfg.colorMode === "string" ? cfg.colorMode : "palette";
      if (colorMode !== "palette" && typeof cfg.colorHex === "string" && cfg.colorHex) {
        const alphaRaw = typeof cfg.colorOpacity !== "undefined" ? Number(cfg.colorOpacity) : 0.85;
        const alpha = Number.isFinite(alphaRaw) ? clamp(alphaRaw, 0, 1) : 0.85;
        const rgba =
          color && typeof color.hexToRgba === "function"
            ? color.hexToRgba(cfg.colorHex, alpha)
            : cfg.colorHex;
        return [rgba];
      }
      if (Array.isArray(cfg.colors) && cfg.colors.length) {
        const filtered = cfg.colors.filter(Boolean);
        if (filtered.length) return filtered;
      }
      if (typeof cfg.color === "string" && cfg.color) return [cfg.color];
      if (typeof cfg.colorHex === "string" && cfg.colorHex) {
        const alphaRaw = typeof cfg.colorOpacity !== "undefined" ? Number(cfg.colorOpacity) : 0.85;
        const alpha = Number.isFinite(alphaRaw) ? clamp(alphaRaw, 0, 1) : 0.85;
        const rgba =
          color && typeof color.hexToRgba === "function"
            ? color.hexToRgba(cfg.colorHex, alpha)
            : cfg.colorHex;
        return [rgba];
      }
      return ["rgba(135,206,250,0.85)", "rgba(148,197,255,0.85)", "rgba(186,230,253,0.8)"];
    };

    // If we can't manage timers/cleanup, fall back to a simple burst.
    if (!cssLayer || !particleManager) {
      const count = scaleCount(Number(cfg.count) || 40, 10);
      const colors = getColors();
      const particleCfg = {
        sizeMin: cfg.sizeMin,
        sizeMax: cfg.sizeMax,
        speedMin: cfg.speedMin,
        speedMax: cfg.speedMax,
        drift: cfg.drift,
        strokeWidth: cfg.strokeWidth,
      };
      const size = getStageSize();
      const lifeMin = clamp(Number(cfg.particleLifeMinSec) || 6, 1, 60);
      const lifeMax = clamp(Number(cfg.particleLifeMaxSec) || 12, lifeMin, 90);
      const list = [];
      for (let i = 0; i < count; i++) {
        list.push(
          new p.BubbleParticle(
            rand(0, size.w),
            size.h + rand(20, 80),
            pick(colors),
            rand(lifeMin, lifeMax),
            particleCfg
          )
        );
      }
      addParticles(list);
      return;
    }

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);

    let maxParticles = Number(cfg.maxParticles);
    if (!Number.isFinite(maxParticles)) maxParticles = 120;
    maxParticles = scaleCount(maxParticles, 20);

    let emissionRate = Number(cfg.emissionRate);
    if (!Number.isFinite(emissionRate)) emissionRate = 8;
    emissionRate = scaleCount(emissionRate, 1);

    const count = scaleCount(Number(cfg.count) || 40, 10);
    const particleLifeMinSec = clamp(Number(cfg.particleLifeMinSec) || 6, 1, 60);
    const particleLifeMaxSec = clamp(Number(cfg.particleLifeMaxSec) || 12, particleLifeMinSec, 90);

    const colors = getColors();
    const particleCfg = {
      sizeMin: cfg.sizeMin,
      sizeMax: cfg.sizeMax,
      speedMin: cfg.speedMin,
      speedMax: cfg.speedMax,
      drift: cfg.drift,
      strokeWidth: cfg.strokeWidth,
    };

    const tag = `tdv-bubbles-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const layerToken = document.createElement("div");
    // Must include `.tdv-effect-layer` so CSSEffectManager.clear()/stopAll() can
    // find it and call the attached stop hook.
    layerToken.className = "tdv-effect-layer tdv-effect-bubbles";
    layerToken.dataset.effect = "bubbles";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    function countActive() {
      const list = particleManager && particleManager.particles ? particleManager.particles : [];
      let countActiveParticles = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i] && list[i]._tdvEffectTag === tag) countActiveParticles += 1;
      }
      return countActiveParticles;
    }

    function spawn(toSpawn) {
      if (!toSpawn) return;
      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];

      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const lifeSec = rand(particleLifeMinSec, particleLifeMaxSec);
        const particle = new p.BubbleParticle(
          rand(0, stage.w),
          stage.h + rand(20, 80),
          pick(colors),
          lifeSec,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    if (mode === "continuous") {
      // Kickstart immediately so users see the effect right away.
      spawn(Math.max(1, Math.min(8, Math.round(emissionRate * 0.5))));
      rafId = requestAnimationFrame(tick);
    } else {
      spawn(count);
    }
  }

  const HALLOWEEN_SPIDERS_STYLE_ID = "tdv-halloween-spiders-style";
  const HALLOWEEN_SPIDERS_CSS = `
		    #tdv-effects-root .tdv-halloween-spiders{overflow:hidden;}
		    #tdv-effects-root .tdv-halloween-spiders, #tdv-effects-root .tdv-halloween-spiders *{box-sizing:border-box;}
		    #tdv-effects-root .tdv-halloween-spiders-wrap{position:absolute;inset:0;z-index:1;will-change:transform;animation:tdv-halloween-spiders-enter 420ms cubic-bezier(0.22,0.61,0.36,1) both;}

		    @keyframes tdv-halloween-spiders-enter{
		      from{transform:translate3d(0,-360px,0);}
		      to{transform:translate3d(0,0,0);}
		    }

		    #tdv-effects-root .tdv-halloween-spider{position:absolute;height:40px;width:50px;border-radius:50%;background:#110D04;z-index:2;}
		    #tdv-effects-root .tdv-halloween-spider::before{content:"";position:absolute;width:2px;background:linear-gradient(to bottom, rgba(170, 170, 170, 0.8), rgba(170, 170, 170, 0.3));left:50%;transform:translateX(-50%);top:-320px;height:320px;box-shadow:0 0 2px rgba(255,255,255,0.3);}

	    #tdv-effects-root .tdv-halloween-eye{position:absolute;top:16px;height:14px;width:12px;background:#fff;border-radius:50%;overflow:hidden;}
	    #tdv-effects-root .tdv-halloween-eye.left{left:14px;}
	    #tdv-effects-root .tdv-halloween-eye.right{right:14px;}

	    #tdv-effects-root .tdv-halloween-eye .tdv-halloween-pupil{position:absolute;top:6px;height:5px;width:5px;border-radius:50%;background:#000;transition:all 0.3s ease;}
	    #tdv-effects-root .tdv-halloween-eye.left .tdv-halloween-pupil{right:3px;animation:tdv-halloween-eye-look-left 3s ease-in-out infinite;}
	    #tdv-effects-root .tdv-halloween-eye.right .tdv-halloween-pupil{left:3px;animation:tdv-halloween-eye-look-right 3s ease-in-out infinite;}

	    #tdv-effects-root .tdv-halloween-leg{position:absolute;height:12px;width:14px;border-top:2px solid #110D04;z-index:-1;}
	    #tdv-effects-root .tdv-halloween-leg.left{left:-8px;border-left:2px solid #110D04;border-radius:60% 0 0 0;transform-origin:top right;}
	    #tdv-effects-root .tdv-halloween-leg.right{right:-8px;border-right:2px solid #110D04;border-radius:0 60% 0 0;transform-origin:top left;}

	    #tdv-effects-root .tdv-halloween-leg.left:nth-of-type(1){top:6px;animation:tdv-halloween-legs-wriggle-left 1s 0s infinite;}
	    #tdv-effects-root .tdv-halloween-leg.left:nth-of-type(2){top:14px;left:-11px;animation:tdv-halloween-legs-wriggle-left 1s 0.8s infinite;}
	    #tdv-effects-root .tdv-halloween-leg.left:nth-of-type(3){top:22px;left:-12px;animation:tdv-halloween-legs-wriggle-left 1s 0.2s infinite;}
	    #tdv-effects-root .tdv-halloween-leg.left:nth-of-type(4){top:31px;left:-10px;animation:tdv-halloween-legs-wriggle-left 1s 0.4s infinite;}

	    #tdv-effects-root .tdv-halloween-leg.right:nth-of-type(5){top:6px;animation:tdv-halloween-legs-wriggle-right 1s 0.2s infinite;}
	    #tdv-effects-root .tdv-halloween-leg.right:nth-of-type(6){top:14px;right:-11px;animation:tdv-halloween-legs-wriggle-right 1s 0.4s infinite;}
	    #tdv-effects-root .tdv-halloween-leg.right:nth-of-type(7){top:22px;right:-12px;animation:tdv-halloween-legs-wriggle-right 1s 0.7s infinite;}
	    #tdv-effects-root .tdv-halloween-leg.right:nth-of-type(8){top:31px;right:-10px;animation:tdv-halloween-legs-wriggle-right 1s 0.3s infinite;}

	    #tdv-effects-root .tdv-halloween-spider-0{left:5%;animation:tdv-halloween-spider-move-0 5s infinite ease-in-out;}
	    #tdv-effects-root .tdv-halloween-spider-1{left:20%;animation:tdv-halloween-spider-move-1 5.5s infinite ease-in-out;}
	    #tdv-effects-root .tdv-halloween-spider-2{left:35%;animation:tdv-halloween-spider-move-2 6s infinite ease-in-out;}
	    #tdv-effects-root .tdv-halloween-spider-3{right:35%;margin-top:160px;animation:tdv-halloween-spider-move-3 5.2s infinite ease-in-out;}
	    #tdv-effects-root .tdv-halloween-spider-4{right:20%;margin-top:50px;animation:tdv-halloween-spider-move-4 5.8s infinite ease-in-out;}
	    #tdv-effects-root .tdv-halloween-spider-5{right:5%;margin-top:210px;animation:tdv-halloween-spider-move-5 6.3s infinite ease-in-out;}

	    @keyframes tdv-halloween-legs-wriggle-left{
	      0%,100%{transform:rotate(36deg) skewX(-20deg);}
	      25%,75%{transform:rotate(15deg) skewX(-20deg);}
	      50%{transform:rotate(45deg) skewX(-20deg);}
	    }

	    @keyframes tdv-halloween-legs-wriggle-right{
	      0%,100%{transform:rotate(-36deg) skewX(20deg);}
	      25%,75%{transform:rotate(-15deg) skewX(20deg);}
	      50%{transform:rotate(-45deg) skewX(20deg);}
	    }

	    @keyframes tdv-halloween-eye-look-left{
	      0%,100%{transform:translate(0,0);}
	      25%{transform:translate(-2px,-1px);}
	      50%{transform:translate(1px,0);}
	      75%{transform:translate(-1px,1px);}
	    }

	    @keyframes tdv-halloween-eye-look-right{
	      0%,100%{transform:translate(0,0);}
	      25%{transform:translate(2px,-1px);}
	      50%{transform:translate(-1px,0);}
	      75%{transform:translate(1px,1px);}
	    }

	    @keyframes tdv-halloween-spider-move-0{
	      0%,100%{margin-top:120px;}
	      45%{margin-top:200px;}
	    }

	    @keyframes tdv-halloween-spider-move-1{
	      0%,100%{margin-top:80px;}
	      60%{margin-top:180px;}
	    }

	    @keyframes tdv-halloween-spider-move-2{
	      0%,100%{margin-top:150px;}
	      55%{margin-top:220px;}
	    }

	    @keyframes tdv-halloween-spider-move-3{
	      0%,100%{margin-top:160px;}
	      50%{margin-top:250px;}
	    }

	    @keyframes tdv-halloween-spider-move-4{
	      0%,100%{margin-top:50px;}
	      65%{margin-top:170px;}
	    }

	    @keyframes tdv-halloween-spider-move-5{
	      0%,100%{margin-top:210px;}
	      40%{margin-top:290px;}
	    }

	    #tdv-effects-root .tdv-halloween-web-corner{position:absolute;width:200px;height:200px;opacity:0.1;z-index:1;}
	    #tdv-effects-root .tdv-halloween-web-corner.top-right{top:-10px;right:-10px;background:
	      linear-gradient(135deg, transparent 48%, rgba(170, 170, 170, 0.3) 49%, rgba(170, 170, 170, 0.3) 51%, transparent 52%),
	      linear-gradient(125deg, transparent 48%, rgba(170, 170, 170, 0.2) 49%, rgba(170, 170, 170, 0.2) 51%, transparent 52%),
	      linear-gradient(115deg, transparent 48%, rgba(170, 170, 170, 0.15) 49%, rgba(170, 170, 170, 0.15) 51%, transparent 52%);}
	    #tdv-effects-root .tdv-halloween-web-corner.top-left{top:-10px;left:-10px;background:
	      linear-gradient(45deg, transparent 48%, rgba(170, 170, 170, 0.3) 49%, rgba(170, 170, 170, 0.3) 51%, transparent 52%),
	      linear-gradient(55deg, transparent 48%, rgba(170, 170, 170, 0.2) 49%, rgba(170, 170, 170, 0.2) 51%, transparent 52%),
	      linear-gradient(65deg, transparent 48%, rgba(170, 170, 170, 0.15) 49%, rgba(170, 170, 170, 0.15) 51%, transparent 52%);}

	    #tdv-effects-root .tdv-halloween-ghost{position:absolute;opacity:0;filter:blur(2px);z-index:0;will-change:transform,opacity;}
	    #tdv-effects-root .tdv-halloween-ghost svg{width:100%;height:100%;display:block;}
	    #tdv-effects-root .tdv-halloween-ghost{animation:tdv-halloween-ghost-linear var(--ghost-dur,25s) linear infinite;animation-delay:var(--ghost-delay,0s);}
	    #tdv-effects-root .tdv-halloween-ghost.wavy{animation-name:tdv-halloween-ghost-wavy;animation-timing-function:ease-in-out;}

	    @keyframes tdv-halloween-ghost-linear{
	      0%{transform:translate3d(var(--gx0,-200px),var(--gy0,120px),0);opacity:0;}
	      5%{opacity:var(--gop,0.7);}
	      95%{opacity:var(--gop,0.7);}
	      100%{transform:translate3d(var(--gx1,1200px),var(--gy1,160px),0);opacity:0;}
	    }

	    @keyframes tdv-halloween-ghost-wavy{
	      0%{transform:translate3d(var(--gx0,-200px),var(--gy0,260px),0);opacity:0;}
	      5%{opacity:var(--gop,0.7);}
	      25%{transform:translate3d(var(--gx25,200px),var(--gy25,140px),0);}
	      50%{transform:translate3d(var(--gx50,520px),var(--gy50,280px),0);}
	      75%{transform:translate3d(var(--gx75,840px),var(--gy75,160px),0);}
	      95%{opacity:var(--gop,0.7);}
	      100%{transform:translate3d(var(--gx1,1200px),var(--gy1,240px),0);opacity:0;}
	    }

		    #tdv-effects-root .tdv-halloween-parallax-stage{position:absolute;inset:0;pointer-events:none;perspective:1000px;z-index:0;}
		    #tdv-effects-root .tdv-halloween-parallax-base{transform-style:preserve-3d;width:100%;height:100%;position:absolute;top:0;left:0;}

		    #tdv-effects-root svg.tdv-halloween-parallax-ghost{
		      -webkit-filter:url("#tdv-halloween-parallax-disfilter") blur(3px);
		      filter:url("#tdv-halloween-parallax-disfilter") blur(3px);
		      transform-origin:60% 70%;
		      transform:translateZ(130px) translateY(150px) translateX(700px) scale(.55) rotate(0deg);
		      animation:tdv-halloween-parallax-ghost 25s infinite linear;
		      position:absolute;
		    }

		    #tdv-effects-root svg.tdv-halloween-parallax-ghost.ltr{animation-name:tdv-halloween-parallax-ghost-ltr;}

		    @keyframes tdv-halloween-parallax-ghost{
		      0%{opacity:0;}
		      79.5%{opacity:0;}
		      80%{transform:translateZ(130px) translateY(150px) translateX(700px) scale(.55);opacity:1;}
		      85%{transform:translateZ(150px) translateY(110px) translateX(200px) scale(.65) rotate(5deg);}
		      90%{transform:translateZ(130px) translateY(110px) translateX(-100px) scale(.65) rotate(5deg);}
		      99.5%{transform:translateZ(130px) translateY(170px) translateX(-500px) scale(.65) rotate(-5deg);opacity:1;}
		      100%{transform:translateZ(130px) translateY(170px) translateX(-700px) scale(.65);opacity:0;}
		    }

		    @keyframes tdv-halloween-parallax-ghost-ltr{
		      0%{opacity:0;}
		      79.5%{opacity:0;}
		      80%{transform:translateZ(130px) translateY(150px) translateX(-700px) scale(.55);opacity:1;}
		      85%{transform:translateZ(150px) translateY(110px) translateX(-200px) scale(.65) rotate(-5deg);}
		      90%{transform:translateZ(130px) translateY(110px) translateX(100px) scale(.65) rotate(-5deg);}
		      99.5%{transform:translateZ(130px) translateY(170px) translateX(500px) scale(.65) rotate(5deg);opacity:1;}
		      100%{transform:translateZ(130px) translateY(170px) translateX(700px) scale(.65);opacity:0;}
		    }
		  `;

  const HALLOWEEN_GHOST_SVG = `
      <svg viewBox="0 0 212 140" aria-hidden="true" focusable="false">
        <g transform="translate(1.15,-88.71)">
          <path fill="#ffffff" opacity="0.6" d="m 100.79161,132.69971 c -1.333632,-2.27245 -1.884306,-4.93766 -3.007029,-7.31692 -1.566889,-5.09862 -2.457398,-10.18646 -2.571554,-15.48165 -0.363995,-7.24126 2.769229,-15.092861 9.299183,-17.065643 4.18881,-1.121088 11.59069,1.569454 14.28843,9.371783 2.94433,6.2779 3.44947,13.34521 4.56873,19.40732 0.44669,2.43287 0.55536,4.86948 0.85666,7.32839 0,0 -2.09928,-4.16754 -3.25026,-3.9011 -1.15099,0.26644 -0.0904,8.20137 -0.0904,8.20137 0,0 -4.38506,-8.57875 -5.56606,-7.81757 -1.181,0.76119 1.51308,7.73639 1.51308,7.73639 0,0 -3.19598,-4.50606 -4.13691,-3.68064 -0.94093,0.8254 -0.23147,5.7131 -0.23147,5.7131 0,0 -3.62169,-5.89399 -4.88809,-5.03102 -1.26639,0.86298 0.0892,6.30332 0.42496,7.70133 0,0 -2.80584,-4.133 -3.50905,-3.33685 -0.7032,0.79615 -0.17612,3.33416 -0.17612,3.33416 0,0 -3.28524,-4.0866 -3.5241,-5.16245 z"/>
          <ellipse fill="#000000" cx="93" cy="106" rx="2" ry="4"/>
          <ellipse fill="#000000" cx="105" cy="106" rx="2" ry="4"/>
        </g>
      </svg>
    `;

  const HALLOWEEN_PARALLAX_GHOST_SVG = `
    <svg viewBox="0 0 212 140" aria-hidden="true" focusable="false">
      <defs>
        <filter id="tdv-halloween-parallax-disfilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="2" result="warp">
            <animate attributeType="XML" attributeName="baseFrequency" from="0.03 0.03" to="0.05 0.05" dur="2s" repeatCount="indefinite"></animate>
          </feTurbulence>
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="20" in="SourceGraphic" in2="warp"></feDisplacementMap>
        </filter>
      </defs>
      <g transform="translate(1.15,-88.71)">
        <g>
          <path style="opacity:0.3;fill:#ffffff;fill-rule:evenodd;stroke:none;stroke-width:0.19091424px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 100.79161,132.69971 c -1.333632,-2.27245 -1.884306,-4.93766 -3.007029,-7.31692 -1.566889,-5.09862 -2.457398,-10.18646 -2.571554,-15.48165 -0.363995,-7.24126 2.769229,-15.092861 9.299183,-17.065643 4.18881,-1.121088 11.59069,1.569454 14.28843,9.371783 2.94433,6.2779 3.44947,13.34521 4.56873,19.40732 0.44669,2.43287 0.55536,4.86948 0.85666,7.32839 0,0 -2.09928,-4.16754 -3.25026,-3.9011 -1.15099,0.26644 -0.0904,8.20137 -0.0904,8.20137 0,0 -4.38506,-8.57875 -5.56606,-7.81757 -1.181,0.76119 1.51308,7.73639 1.51308,7.73639 0,0 -3.19598,-4.50606 -4.13691,-3.68064 -0.94093,0.8254 -0.23147,5.7131 -0.23147,5.7131 0,0 -3.62169,-5.89399 -4.88809,-5.03102 -1.26639,0.86298 0.0892,6.30332 0.42496,7.70133 0,0 -2.80584,-4.133 -3.50905,-3.33685 -0.7032,0.79615 -0.17612,3.33416 -0.17612,3.33416 0,0 -3.28524,-4.0866 -3.5241,-5.16245 z"></path>
          <ellipse fill="#ff0000" cx="98.693253" cy="105.81969" rx="2.0475318" ry="4.2458224" transform="matrix(1,0,0.03111267,0.99951588,0,0)"></ellipse>
          <ellipse fill="#000000" cx="98.147614" cy="106.34912" rx="2.0475318" ry="4.2458224" transform="matrix(1,0,0.03111267,0.99951588,0,0)"></ellipse>
          <ellipse fill="#ff0000" cx="89.086861" cy="105.88109" rx="2.0475318" ry="4.3433409" transform="matrix(1,0,0.21289874,0.97707427,0,0)"></ellipse>
          <ellipse fill="#000000" cx="88.44239" cy="106.42267" rx="2.0475318" ry="4.3433409" transform="matrix(1,0,0.21289874,0.97707427,0,0)"></ellipse>
          <path fill="#ff0000" stroke="#000000" stroke-width="0.19091424" d="m 101.25903,114.85223 c 0.36338,-1.60573 2.49577,-2.43815 3.6576,-1.25544 1.00834,0.9066 2.68609,1.06005 3.62958,-0.0347 0.40159,-0.68924 1.23894,-0.47351 1.84663,-0.29923 0.70214,0.28725 1.38874,-0.083 1.79021,-0.69883 0.47633,-0.5191 0.54476,-1.40401 1.18517,-1.75184 0.60181,-0.007 1.20411,0.42134 1.73156,-0.19576 0.48193,-0.3651 1.54588,-1.3397 1.7864,-0.22891 0.0583,0.56536 0.50473,1.00842 0.49076,1.60877 0.10402,1.4453 -0.84599,2.86052 -2.1188,3.33264 -0.75469,0.85366 -0.21777,2.07061 -0.37144,3.09023 -0.0472,1.0268 -1.21074,0.64857 -1.84907,0.59394 -0.907,-0.1249 -1.87046,-0.4983 -2.76822,-0.16272 -0.71464,0.3982 -0.93744,1.57448 -1.85755,1.57939 -0.6336,-0.18067 -1.41644,-0.73959 -1.86516,0.14845 -0.4277,0.62774 -1.04535,1.39233 -1.86835,1.08397 -1.14803,-0.2781 -1.50802,-1.61081 -2.0164,-2.57095 -0.21494,-0.79652 -1.23393,-0.61631 -1.48674,-1.40842 -0.35267,-0.78092 0.29135,-1.52801 0.12602,-2.32612 -0.007,-0.1687 -0.0213,-0.3371 -0.0422,-0.50448 z"></path>
          <path fill="#000000" stroke="#000000" stroke-width="0.19091424" d="m 100.72986,115.3814 c 0.36338,-1.60573 2.49577,-2.43815 3.6576,-1.25544 1.00834,0.9066 2.68609,1.06005 3.62958,-0.0347 0.40159,-0.68924 1.23894,-0.47351 1.84663,-0.29923 0.70214,0.28725 1.38874,-0.083 1.79021,-0.69883 0.47633,-0.5191 0.54476,-1.40401 1.18517,-1.75184 0.60181,-0.007 1.20411,0.42134 1.73156,-0.19576 0.48193,-0.3651 1.54588,-1.3397 1.7864,-0.22891 0.0583,0.56536 0.50473,1.00842 0.49076,1.60877 0.10402,1.4453 -0.84599,2.86052 -2.1188,3.33264 -0.75469,0.85366 -0.21777,2.07061 -0.37144,3.09023 -0.0472,1.0268 -1.21074,0.64857 -1.84907,0.59394 -0.907,-0.1249 -1.87046,-0.4983 -2.76822,-0.16272 -0.71464,0.3982 -0.93744,1.57448 -1.85755,1.57939 -0.6336,-0.18067 -1.41644,-0.73959 -1.86516,0.14845 -0.4277,0.62774 -1.04535,1.39233 -1.86835,1.08397 -1.14803,-0.2781 -1.50802,-1.61081 -2.0164,-2.57095 -0.21494,-0.79652 -1.23393,-0.61631 -1.48674,-1.40842 -0.35267,-0.78092 0.29135,-1.52801 0.12602,-2.32612 -0.007,-0.1687 -0.0213,-0.3371 -0.0422,-0.50448 z"></path>
        </g>
      </g>
    </svg>
  `;

  const HALLOWEEN_GHOST_PATTERNS = [
    { dir: "ltr", dur: 25, delay: 0, op: 0.7, w: 120, h: 150, y0: 0.15, y1: 0.2 },
    { dir: "rtl", dur: 30, delay: 5, op: 0.6, w: 100, h: 130, y0: 0.4, y1: 0.35 },
    { dir: "ltr", dur: 28, delay: 10, op: 0.8, w: 90, h: 120, y0: 0.65, y1: 0.6 },
    { dir: "ltr", dur: 32, delay: 15, op: 0.65, w: 110, h: 140, y0: 0.1, y1: 0.7 },
    { dir: "rtl", dur: 27, delay: 20, op: 0.7, w: 95, h: 125, y0: 0.75, y1: 0.25 },
    { dir: "ltr", dur: 35, delay: 8, op: 0.75, w: 105, h: 135, wavy: true },
  ];

  const HALLOWEEN_PARALLAX_GHOST_FILTER_ID = "tdv-halloween-parallax-disfilter";
  const HALLOWEEN_PARALLAX_GHOST_FILTER_SVG = `
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
	        <filter id="${HALLOWEEN_PARALLAX_GHOST_FILTER_ID}">
	          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="2" result="warp">
	            <animate attributeType="XML" attributeName="baseFrequency" from="0.03 0.03" to="0.05 0.05" dur="2s" repeatCount="indefinite"></animate>
	          </feTurbulence>
	          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="20" in="SourceGraphic" in2="warp"></feDisplacementMap>
	        </filter>
        </defs>
      </svg>
    `;

  const HALLOWEEN_PARALLAX_GHOST_PATTERNS = [
    { dir: "rtl", dur: 25, delay: -19, blur: 3, zIndex: 1 },
    { dir: "rtl", dur: 35, delay: -10, blur: 5, zIndex: 0 },
    { dir: "ltr", dur: 20, delay: -5, blur: 2, zIndex: 5 },
    { dir: "ltr", dur: 18, delay: -2, blur: 1, zIndex: 10 },
    { dir: "rtl", dur: 40, delay: -25, blur: 6, zIndex: 0 },
  ];

  function ensureHalloweenSpidersStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet(
        "css/themes/halloween-spiders.css",
        HALLOWEEN_SPIDERS_STYLE_ID,
        HALLOWEEN_SPIDERS_CSS
      );
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(HALLOWEEN_SPIDERS_CSS, HALLOWEEN_SPIDERS_STYLE_ID);
    }
  }

  function createHalloweenSpider(index) {
    const spider = document.createElement("div");
    spider.className = `tdv-halloween-spider tdv-halloween-spider-${String(index)}`;

    const leftEye = document.createElement("div");
    leftEye.className = "tdv-halloween-eye left";
    const leftPupil = document.createElement("div");
    leftPupil.className = "tdv-halloween-pupil";
    leftEye.appendChild(leftPupil);

    const rightEye = document.createElement("div");
    rightEye.className = "tdv-halloween-eye right";
    const rightPupil = document.createElement("div");
    rightPupil.className = "tdv-halloween-pupil";
    rightEye.appendChild(rightPupil);

    spider.appendChild(leftEye);
    spider.appendChild(rightEye);

    for (let i = 0; i < 4; i++) {
      const leg = document.createElement("span");
      leg.className = "tdv-halloween-leg left";
      spider.appendChild(leg);
    }

    for (let i = 0; i < 4; i++) {
      const leg = document.createElement("span");
      leg.className = "tdv-halloween-leg right";
      spider.appendChild(leg);
    }

    return spider;
  }

  function halloweenLerp(a, b, t) {
    return a + (b - a) * t;
  }

  function normalizeGhostDirectionMode(value) {
    const v = typeof value === "string" ? value : "mixed";
    if (v === "leftToRight" || v === "rightToLeft" || v === "mixed") return v;
    return "mixed";
  }

  // Re-usable ghost overlay generator (copied from the theme implementation).
  // eslint-disable-next-line max-lines-per-function
  function createHalloweenGhostElement(ctx, cfg, index) {
    const stage =
      ctx && typeof ctx.getStageSize === "function" ? ctx.getStageSize() : { w: 800, h: 600 };
    const w = Math.max(320, Number(stage.w) || 800);
    const h = Math.max(240, Number(stage.h) || 600);

    const rawRandomness = Number(cfg && cfg.ghostRandomness);
    const randomness = Number.isFinite(rawRandomness) ? clamp(rawRandomness, 0, 1) : 0;

    const dirMode = normalizeGhostDirectionMode(cfg && cfg.ghostDirection);
    const basePattern = HALLOWEEN_GHOST_PATTERNS[index % HALLOWEEN_GHOST_PATTERNS.length];
    const chosenPattern =
      randomness > 0 && Math.random() < randomness * 0.5
        ? pick(HALLOWEEN_GHOST_PATTERNS)
        : basePattern;

    let dir = chosenPattern.dir || "ltr";
    if (dirMode === "leftToRight") dir = "ltr";
    else if (dirMode === "rightToLeft") dir = "rtl";

    const minSizeRaw = Number(cfg && cfg.ghostSizeMin);
    const maxSizeRaw = Number(cfg && cfg.ghostSizeMax);
    const minSize = Number.isFinite(minSizeRaw) ? clamp(minSizeRaw, 20, 520) : 90;
    const maxSize = Number.isFinite(maxSizeRaw) ? clamp(maxSizeRaw, 20, 520) : 120;
    const sizeLo = Math.min(minSize, maxSize);
    const sizeHi = Math.max(minSize, maxSize);
    const baseW = Number(chosenPattern.w) || 105;
    const baseH = Number(chosenPattern.h) || Math.round(baseW * 1.25);
    const baseMinW = 90;
    const baseMaxW = 120;
    const denom = baseMaxW - baseMinW || 1;
    const t = clamp((baseW - baseMinW) / denom, 0, 1);
    const sizeSpan = sizeHi - sizeLo;
    const jitter =
      sizeSpan > 0 ? rand(-sizeSpan * 0.12 * randomness, sizeSpan * 0.12 * randomness) : 0;
    const width = clamp(sizeLo + t * sizeSpan + jitter, 20, 520);
    const ratio = baseW > 0 ? baseH / baseW : 1.25;
    const height = Math.round(width * ratio);

    const pad = Math.max(200, Math.round(width * 1.6));
    const x0 = dir === "rtl" ? w + pad : -pad;
    const x1 = dir === "rtl" ? -pad : w + pad;

    const ry0 = rand(0.08, 0.82);
    const ry1 = rand(0.08, 0.82);
    const y0p = halloweenLerp(Number(chosenPattern.y0) || 0.15, ry0, randomness);
    const y1p = halloweenLerp(Number(chosenPattern.y1) || 0.2, ry1, randomness);

    const y0 = clamp(Math.round(h * y0p), 0, Math.max(0, h - height));
    const y1 = clamp(Math.round(h * y1p), 0, Math.max(0, h - height));

    const durRand = rand(18, 40);
    const baseDur = Number(chosenPattern.dur) || 28;
    const dur = clamp(halloweenLerp(baseDur, durRand, randomness), 12, 60);

    const delayRand = rand(0, Math.min(24, dur));
    const baseDelay = Number(chosenPattern.delay) || 0;
    const delay = clamp(
      halloweenLerp(baseDelay, delayRand, randomness) + (index > 5 ? (index - 5) * 1.6 : 0),
      0,
      60
    );

    const opRand = rand(0.5, 0.85);
    const baseOp = Number(chosenPattern.op) || 0.7;
    const op = clamp(halloweenLerp(baseOp, opRand, randomness), 0.1, 1);

    const ghost = document.createElement("div");
    ghost.className = `tdv-halloween-ghost${chosenPattern.wavy ? " wavy" : ""}`;
    ghost.style.width = `${Math.round(width)}px`;
    ghost.style.height = `${Math.round(height)}px`;
    ghost.style.setProperty("--ghost-dur", `${dur.toFixed(2)}s`);
    ghost.style.setProperty("--ghost-delay", `${delay.toFixed(2)}s`);
    ghost.style.setProperty("--gop", op.toFixed(2));
    ghost.style.setProperty("--gx0", `${Math.round(x0)}px`);
    ghost.style.setProperty("--gy0", `${y0}px`);
    ghost.style.setProperty("--gx1", `${Math.round(x1)}px`);
    ghost.style.setProperty("--gy1", `${y1}px`);

    if (chosenPattern.wavy) {
      const x25 = x0 + (x1 - x0) * 0.25;
      const x50 = x0 + (x1 - x0) * 0.5;
      const x75 = x0 + (x1 - x0) * 0.75;

      const ry25 = rand(0.12, 0.88);
      const ry50 = rand(0.12, 0.88);
      const ry75 = rand(0.12, 0.88);
      const y25 = clamp(
        Math.round(h * halloweenLerp(0.3, ry25, randomness)),
        0,
        Math.max(0, h - height)
      );
      const y50 = clamp(
        Math.round(h * halloweenLerp(0.55, ry50, randomness)),
        0,
        Math.max(0, h - height)
      );
      const y75 = clamp(
        Math.round(h * halloweenLerp(0.35, ry75, randomness)),
        0,
        Math.max(0, h - height)
      );

      ghost.style.setProperty("--gx25", `${Math.round(x25)}px`);
      ghost.style.setProperty("--gx50", `${Math.round(x50)}px`);
      ghost.style.setProperty("--gx75", `${Math.round(x75)}px`);
      ghost.style.setProperty("--gy25", `${y25}px`);
      ghost.style.setProperty("--gy50", `${y50}px`);
      ghost.style.setProperty("--gy75", `${y75}px`);
    }

    ghost.innerHTML = HALLOWEEN_GHOST_SVG;
    return ghost;
  }

  function createHalloweenGhosts(ctx, cfg) {
    const count = Number.isFinite(Number(cfg && cfg.ghostCount))
      ? clamp(Math.round(Number(cfg.ghostCount)), 0, 12)
      : 0;
    const list = [];
    for (let i = 0; i < count; i++) {
      const ghost = createHalloweenGhostElement(ctx, cfg, i);
      if (ghost) list.push(ghost);
    }
    return list;
  }

  // eslint-disable-next-line max-lines-per-function
  function createHalloweenParallaxGhostElement(cfg, index) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = HALLOWEEN_PARALLAX_GHOST_SVG;
    const svg = wrapper.firstElementChild;
    if (!svg) return null;

    try {
      const defs = svg.querySelector("defs");
      if (defs && defs.parentNode) defs.parentNode.removeChild(defs);
    } catch {
      // ignore
    }

    try {
      if (svg.hasAttribute("id")) svg.removeAttribute("id");
      const idNodes = svg.querySelectorAll("[id]");
      for (let i = 0; i < idNodes.length; i++) {
        idNodes[i].removeAttribute("id");
      }
    } catch {
      // ignore
    }

    svg.classList.add("tdv-halloween-parallax-ghost");

    const rawRandomness = Number(cfg && cfg.ghostRandomness);
    const randomness = Number.isFinite(rawRandomness) ? clamp(rawRandomness, 0, 1) : 0;
    const dirMode = normalizeGhostDirectionMode(cfg && cfg.ghostDirection);

    const basePattern =
      HALLOWEEN_PARALLAX_GHOST_PATTERNS[index % HALLOWEEN_PARALLAX_GHOST_PATTERNS.length];
    const pattern =
      randomness > 0 && Math.random() < randomness * 0.5
        ? pick(HALLOWEEN_PARALLAX_GHOST_PATTERNS)
        : basePattern;

    let dir = pattern.dir || "rtl";
    if (dirMode === "leftToRight") dir = "ltr";
    else if (dirMode === "rightToLeft") dir = "rtl";
    else if (randomness > 0 && Math.random() < randomness * 0.25)
      dir = Math.random() < 0.5 ? "ltr" : "rtl";

    if (dir === "ltr") svg.classList.add("ltr");

    const baseDur = Number(pattern.dur) || 25;
    const durRand = rand(18, 46);
    const dur = clamp(halloweenLerp(baseDur, durRand, randomness), 12, 60);
    svg.style.animationDuration = `${dur.toFixed(2)}s`;

    const baseDelay = Number(pattern.delay) || 0;
    const delayRand = -rand(0, dur);
    const delay = halloweenLerp(baseDelay, delayRand, randomness);
    svg.style.animationDelay = `${delay.toFixed(2)}s`;

    const baseBlur = Number.isFinite(Number(pattern.blur)) ? Number(pattern.blur) : 3;
    const blurRand = rand(1, 7);
    const blur = clamp(halloweenLerp(baseBlur, blurRand, randomness), 0, 10);
    const filterValue = `url("#${HALLOWEEN_PARALLAX_GHOST_FILTER_ID}") blur(${blur.toFixed(1)}px)`;
    svg.style.filter = filterValue;
    svg.style.webkitFilter = filterValue;

    if (Number.isFinite(Number(pattern.zIndex))) {
      svg.style.zIndex = String(Math.round(Number(pattern.zIndex)));
    }

    return svg;
  }

  function createHalloweenParallaxGhostStage(cfg, count) {
    const stage = document.createElement("div");
    stage.className = "tdv-halloween-parallax-stage";
    const base = document.createElement("div");
    base.className = "tdv-halloween-parallax-base";

    try {
      const defsWrap = document.createElement("div");
      defsWrap.innerHTML = HALLOWEEN_PARALLAX_GHOST_FILTER_SVG;
      const defsSvg = defsWrap.firstElementChild;
      if (defsSvg) base.appendChild(defsSvg);
    } catch {
      // ignore
    }

    const requested = Number.isFinite(Number(count)) ? clamp(Math.round(Number(count)), 0, 12) : 0;
    const maxCount = HALLOWEEN_PARALLAX_GHOST_PATTERNS.length || 5;
    const useCount = Math.min(maxCount, requested);
    for (let i = 0; i < useCount; i++) {
      const ghost = createHalloweenParallaxGhostElement(cfg, i);
      if (ghost) base.appendChild(ghost);
    }

    stage.appendChild(base);
    return stage;
  }

  function createHalloweenSpidersOverlay(ctx, cfg) {
    ensureHalloweenSpidersStylesInjected();
    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-theme-layer tdv-halloween-spiders";
    container.setAttribute("aria-hidden", "true");

    const ghosts = createHalloweenGhosts(ctx, cfg);
    for (let i = 0; i < ghosts.length; i++) {
      container.appendChild(ghosts[i]);
    }

    if (ghosts.length) {
      container.appendChild(createHalloweenParallaxGhostStage(cfg, ghosts.length));
    }

    const wrap = document.createElement("div");
    wrap.className = "tdv-halloween-spiders-wrap";

    const cornerRight = document.createElement("div");
    cornerRight.className = "tdv-halloween-web-corner top-right";
    const cornerLeft = document.createElement("div");
    cornerLeft.className = "tdv-halloween-web-corner top-left";
    wrap.appendChild(cornerRight);
    wrap.appendChild(cornerLeft);

    for (let i = 0; i < 6; i++) {
      wrap.appendChild(createHalloweenSpider(i));
    }

    container.appendChild(wrap);
    return container;
  }

  // Halloween as a theme-like one-shot (spiders overlay + optional emoji/embers stream).
  // eslint-disable-next-line max-lines-per-function
  function effectHalloween(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand: ctxRand,
      pick: ctxPick,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;
    if (!p) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const styleRaw = cfg && typeof cfg.style === "string" ? cfg.style : "spiders";
    const style = styleRaw === "ember" ? "embers" : styleRaw;

    const wantsOverlay = style === "spiders" || style === "mixed";
    const wantsEmoji = style === "emoji" || style === "mixed";
    const wantsEmbers = style === "embers";

    const tag = "halloween";
    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let overlayEl = null;
    let lastTs = 0;
    let acc = 0;

    const layerToken = cssLayer ? document.createElement("div") : null;
    if (layerToken && cssLayer) {
      layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-halloween";
      layerToken.setAttribute("aria-hidden", "true");
      layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
      cssLayer.appendChild(layerToken);
    }

    if (wantsOverlay && cssLayer) {
      overlayEl = createHalloweenSpidersOverlay(ctx, cfg);
      if (overlayEl) cssLayer.appendChild(overlayEl);
    }

    const stage = getStageSize();
    const stageW = Math.max(320, Number(stage.w) || 800);
    const stageH = Math.max(240, Number(stage.h) || 600);

    let emissionRate = Number(cfg.emissionRate);
    if (!Number.isFinite(emissionRate)) emissionRate = 8;
    emissionRate = scaleCount(emissionRate, 1);

    let maxParticles = Number(cfg.maxParticles);
    if (!Number.isFinite(maxParticles)) maxParticles = 120;
    maxParticles = scaleCount(maxParticles, 30);

    const colors =
      Array.isArray(cfg.colors) && cfg.colors.length
        ? cfg.colors.filter(Boolean)
        : ["#ff7a00", "#6b21a8", "#111827"];
    const icons =
      Array.isArray(cfg.icons) && cfg.icons.length
        ? cfg.icons.filter(Boolean)
        : ["🕸️", "🕷️", "🎃", "⚰️", "🦇", "👻", "💀", "☠️"];

    function countActive() {
      const list =
        particleManager && Array.isArray(particleManager.particles)
          ? particleManager.particles
          : [];
      let countActiveParticles = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i] && list[i]._tdvEffectTag === tag) countActiveParticles += 1;
      }
      return countActiveParticles;
    }

    function spawn(toSpawn) {
      if (!toSpawn || !addParticles) return;
      if (!particleManager) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const list = [];
      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        let particle = null;
        if (wantsEmbers && p.EmberParticle) {
          particle = new p.EmberParticle(
            ctxRand(0, stageW),
            stageH + ctxRand(10, 40),
            ctxPick(colors),
            ctxRand(1.5, 3)
          );
        } else if (wantsEmoji && p.HalloweenEmojiParticle) {
          particle = new p.HalloweenEmojiParticle(
            ctxRand(0, stageW),
            ctxRand(-60, -10),
            ctxPick(icons),
            ctxRand(7, 16),
            cfg
          );
        }
        if (!particle) continue;
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && particleManager && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
      } catch {
        // ignore
      }
      overlayEl = null;

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      if (wantsEmoji || wantsEmbers) {
        acc += dt * emissionRate;
        const toSpawn = Math.floor(acc);
        if (toSpawn > 0) {
          acc -= toSpawn;
          spawn(toSpawn);
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    if (layerToken) layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart: show something immediately for particle modes.
    if (wantsEmoji || wantsEmbers) {
      spawn(Math.max(1, Math.min(10, Math.round(emissionRate * 0.6))));
      rafId = requestAnimationFrame(tick);
    } else if (!wantsOverlay) {
      // No valid mode selected; nothing to animate.
      stop({ clearParticles: true });
    }
  }

  // Snow as a theme-like one-shot (spawns over time, cleans up after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectSnow(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;

    if (!cssLayer || !p || !p.SnowParticle) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const emissionRate = scaleCount(Number(cfg.emissionRate) || 14, 2);
    const maxParticles = scaleCount(Number(cfg.maxParticles) || 180, 30);

    const particleLifetimeSec = clamp(Number(cfg.particleLifetimeSec) || 30, 4, 120);
    const speedMin = Number.isFinite(Number(cfg.speedMin)) ? Number(cfg.speedMin) : 20;
    const speedMax = Number.isFinite(Number(cfg.speedMax)) ? Number(cfg.speedMax) : 55;

    const drift = Number.isFinite(Number(cfg.drift)) ? Number(cfg.drift) : 18;
    const sizeMin = Number.isFinite(Number(cfg.sizeMin)) ? Number(cfg.sizeMin) : 2;
    const sizeMax = Number.isFinite(Number(cfg.sizeMax)) ? Number(cfg.sizeMax) : 5;
    const direction = typeof cfg.direction === "string" ? cfg.direction : "normal";
    const windStrength = Number.isFinite(Number(cfg.windStrength)) ? Number(cfg.windStrength) : 0;
    const windVariance = Number.isFinite(Number(cfg.windVariance)) ? Number(cfg.windVariance) : 12;
    const colorHex = typeof cfg.colorHex === "string" ? cfg.colorHex : "#ffffff";

    const colors =
      Array.isArray(cfg.colors) && cfg.colors.length
        ? cfg.colors.filter(Boolean)
        : [colorHex].filter(Boolean);

    const particleCfg = {
      drift,
      sizeMin,
      sizeMax,
      direction,
      windStrength,
      windVariance,
    };

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-snow";
    layerToken.setAttribute("aria-hidden", "true");
    layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    const tag = "snow";

    function countActive() {
      const all =
        particleManager && Array.isArray(particleManager.particles)
          ? particleManager.particles
          : [];
      let count = 0;
      for (let i = 0; i < all.length; i++) {
        const particle = all[i];
        if (particle && particle._tdvEffectTag === tag) count += 1;
      }
      return count;
    }

    function spawn(toSpawn) {
      if (!toSpawn || !particleManager) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];
      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const particle = new p.SnowParticle(
          rand(0, stage.w),
          rand(-40, -10),
          pick(colors),
          particleLifetimeSec,
          speedMin,
          speedMax,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && particleManager && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart immediately so users see the effect right away.
    spawn(Math.max(1, Math.min(6, Math.round(emissionRate * 0.3))));
    rafId = requestAnimationFrame(tick);
  }

  // Snow Flakes as a theme-like one-shot (spawns over time, cleans up after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectSnowflakes(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;

    if (!cssLayer || !p || !p.SnowflakeParticle) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const emissionRate = scaleCount(Number(cfg.emissionRate) || 10, 2);
    const maxParticles = scaleCount(Number(cfg.maxParticles) || 140, 30);

    const particleLifetimeSec = clamp(Number(cfg.particleLifetimeSec) || 30, 4, 120);
    const speedMin = Number.isFinite(Number(cfg.speedMin)) ? Number(cfg.speedMin) : 18;
    const speedMax = Number.isFinite(Number(cfg.speedMax)) ? Number(cfg.speedMax) : 50;

    const drift = Number.isFinite(Number(cfg.drift)) ? Number(cfg.drift) : 22;
    const sizeMin = Number.isFinite(Number(cfg.sizeMin)) ? Number(cfg.sizeMin) : 2;
    const sizeMax = Number.isFinite(Number(cfg.sizeMax)) ? Number(cfg.sizeMax) : 6;
    const direction = typeof cfg.direction === "string" ? cfg.direction : "normal";
    const windStrength = Number.isFinite(Number(cfg.windStrength)) ? Number(cfg.windStrength) : 0;
    const colorHex = typeof cfg.colorHex === "string" ? cfg.colorHex : "#ffffff";

    const colors =
      Array.isArray(cfg.colors) && cfg.colors.length
        ? cfg.colors.filter(Boolean)
        : [colorHex].filter(Boolean);

    const particleCfg = {
      drift,
      sizeMin,
      sizeMax,
      direction,
      windStrength,
    };

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-snowflakes";
    layerToken.setAttribute("aria-hidden", "true");
    layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    const tag = "snowflakes";

    function countActive() {
      const all =
        particleManager && Array.isArray(particleManager.particles)
          ? particleManager.particles
          : [];
      let count = 0;
      for (let i = 0; i < all.length; i++) {
        const particle = all[i];
        if (particle && particle._tdvEffectTag === tag) count += 1;
      }
      return count;
    }

    function spawn(toSpawn) {
      if (!toSpawn || !particleManager) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];
      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const particle = new p.SnowflakeParticle(
          rand(0, stage.w),
          rand(-40, -10),
          pick(colors),
          particleLifetimeSec,
          speedMin,
          speedMax,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && particleManager && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart immediately so users see the effect right away.
    spawn(Math.max(1, Math.min(6, Math.round(emissionRate * 0.3))));
    rafId = requestAnimationFrame(tick);
  }

  // Easter Eggs as a theme-like one-shot (spawns over time, cleans up after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectEaster(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;

    if (!cssLayer || !p || !p.EggParticle) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const emissionRate = scaleCount(Number(cfg.emissionRate) || 12, 2);
    const maxParticles = scaleCount(Number(cfg.maxParticles) || 160, 30);

    const sizeMin = Number.isFinite(Number(cfg.sizeMin)) ? Number(cfg.sizeMin) : 12;
    const sizeMax = Number.isFinite(Number(cfg.sizeMax)) ? Number(cfg.sizeMax) : 26;
    const speedMin = Number.isFinite(Number(cfg.speedMin)) ? Number(cfg.speedMin) : 30;
    const speedMax = Number.isFinite(Number(cfg.speedMax)) ? Number(cfg.speedMax) : 90;
    const drift = Number.isFinite(Number(cfg.drift)) ? Number(cfg.drift) : 20;

    const colorMode = typeof cfg.colorMode === "string" ? cfg.colorMode : "palette";
    const colorHex = typeof cfg.colorHex === "string" ? cfg.colorHex : "#f9a8d4";
    const palette =
      Array.isArray(cfg.colors) && cfg.colors.length ? cfg.colors.filter(Boolean) : [colorHex];
    const colors = (colorMode === "custom" ? [colorHex] : palette).filter(Boolean);

    const stage0 = getStageSize();
    const defaultLifetime = speedMin > 0 ? (stage0.h + 120) / Math.max(1, speedMin) : 18;
    const particleLifetimeSec = clamp(
      Number.isFinite(Number(cfg.particleLifetimeSec))
        ? Number(cfg.particleLifetimeSec)
        : defaultLifetime,
      4,
      120
    );

    const particleCfg = {
      sizeMin,
      sizeMax,
      speedMin,
      speedMax,
      drift,
    };

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-easter";
    layerToken.setAttribute("aria-hidden", "true");
    layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    const tag = "easter";

    function countActive() {
      const all =
        particleManager && Array.isArray(particleManager.particles)
          ? particleManager.particles
          : [];
      let count = 0;
      for (let i = 0; i < all.length; i++) {
        const particle = all[i];
        if (particle && particle._tdvEffectTag === tag) count += 1;
      }
      return count;
    }

    function spawn(toSpawn) {
      if (!toSpawn || !particleManager) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];
      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const particle = new p.EggParticle(
          rand(0, stage.w),
          rand(-80, -10),
          pick(colors),
          particleLifetimeSec,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && particleManager && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart immediately so users see the effect right away.
    spawn(Math.max(1, Math.min(6, Math.round(emissionRate * 0.25))));
    rafId = requestAnimationFrame(tick);
  }

  // Leaves as a theme-like one-shot (spawns over time, cleans up after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectLeaves(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;

    if (!cssLayer || !p || !p.LeafParticle) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const maxParticles = scaleCount(Number(cfg.maxParticles) || 140, 30);

    const mode = typeof cfg.mode === "string" ? cfg.mode : "continuous";
    const emissionRate = scaleCount(Number(cfg.emissionRate) || 10, 2);

    const sizeMin = Number.isFinite(Number(cfg.sizeMin)) ? Number(cfg.sizeMin) : 10;
    const sizeMax = Number.isFinite(Number(cfg.sizeMax)) ? Number(cfg.sizeMax) : 24;
    const speedMin = Number.isFinite(Number(cfg.speedMin)) ? Number(cfg.speedMin) : 30;
    const speedMax = Number.isFinite(Number(cfg.speedMax)) ? Number(cfg.speedMax) : 80;
    const drift = Number.isFinite(Number(cfg.drift)) ? Number(cfg.drift) : 28;

    const colorMode = typeof cfg.colorMode === "string" ? cfg.colorMode : "palette";
    const colorHex = typeof cfg.colorHex === "string" ? cfg.colorHex : "#309900";
    const palette =
      Array.isArray(cfg.colors) && cfg.colors.length
        ? cfg.colors.filter(Boolean)
        : [colorHex].filter(Boolean);
    const colors = colorMode === "custom" ? [colorHex].filter(Boolean) : palette;

    const stageNow = getStageSize();
    const defaultLifetimeSec = clamp((stageNow.h + 140) / Math.max(1, speedMin), 4, 120);
    const particleLifetimeSec = clamp(
      Number(cfg.particleLifetimeSec) || defaultLifetimeSec,
      4,
      120
    );

    const particleCfg = {
      sizeMin,
      sizeMax,
      speedMin,
      speedMax,
      drift,
    };

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-leaves";
    layerToken.setAttribute("aria-hidden", "true");
    layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    const tag = "leaves";

    function countActive() {
      const all =
        particleManager && Array.isArray(particleManager.particles)
          ? particleManager.particles
          : [];
      let count = 0;
      for (let i = 0; i < all.length; i++) {
        const particle = all[i];
        if (particle && particle._tdvEffectTag === tag) count += 1;
      }
      return count;
    }

    function spawn(toSpawn) {
      if (!toSpawn || !particleManager) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];
      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const particle = new p.LeafParticle(
          rand(0, stage.w),
          rand(-120, -10),
          pick(colors),
          particleLifetimeSec,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && particleManager && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart immediately so users see the effect right away.
    if (mode === "burst") {
      spawn(maxParticles);
    } else {
      spawn(Math.max(1, Math.min(8, Math.round(emissionRate * 0.35))));
      rafId = requestAnimationFrame(tick);
    }
  }

  // Fire as a theme-like one-shot (spawns over time, cleans up after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectFire(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
    } = ctx;

    if (!cssLayer || !p || !p.FireParticle) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const emissionRate = scaleCount(Number(cfg.emissionRate) || 22, 2);
    const maxParticles = scaleCount(Number(cfg.maxParticles) || 200, 30);

    const sizeMin = Number.isFinite(Number(cfg.sizeMin)) ? Number(cfg.sizeMin) : 8;
    const sizeMax = Number.isFinite(Number(cfg.sizeMax)) ? Number(cfg.sizeMax) : 22;
    const speedMin = Number.isFinite(Number(cfg.speedMin)) ? Number(cfg.speedMin) : 70;
    const speedMax = Number.isFinite(Number(cfg.speedMax)) ? Number(cfg.speedMax) : 160;
    const drift = Number.isFinite(Number(cfg.drift)) ? Number(cfg.drift) : 40;

    const colorMode = typeof cfg.colorMode === "string" ? cfg.colorMode : "palette";
    const colorHex = typeof cfg.colorHex === "string" ? cfg.colorHex : "#ff4500";
    const palette =
      Array.isArray(cfg.colors) && cfg.colors.length
        ? cfg.colors.filter(Boolean)
        : [colorHex].filter(Boolean);
    const colors = colorMode === "custom" ? [colorHex].filter(Boolean) : palette;

    const stageNow = getStageSize();
    const defaultLifetimeSec = clamp((stageNow.h + 180) / Math.max(1, speedMin), 2, 60);
    const particleLifetimeSec = clamp(Number(cfg.particleLifetimeSec) || defaultLifetimeSec, 2, 60);

    const particleCfg = {
      sizeMin,
      sizeMax,
      speedMin,
      speedMax,
      drift,
    };

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-fire";
    layerToken.setAttribute("aria-hidden", "true");
    layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    const tag = "fire";

    function countActive() {
      const all =
        particleManager && Array.isArray(particleManager.particles)
          ? particleManager.particles
          : [];
      let count = 0;
      for (let i = 0; i < all.length; i++) {
        const particle = all[i];
        if (particle && particle._tdvEffectTag === tag) count += 1;
      }
      return count;
    }

    function spawn(toSpawn) {
      if (!toSpawn || !particleManager) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];

      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const particle = new p.FireParticle(
          rand(0, stage.w),
          stage.h + rand(10, 60),
          pick(colors),
          particleLifetimeSec,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && particleManager && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart immediately so users see the effect right away.
    spawn(Math.max(1, Math.min(10, Math.round(emissionRate * 0.35))));
    rafId = requestAnimationFrame(tick);
  }

  function effectElectric(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createElectricOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createElectricOverlay : null;
    if (typeof createElectricOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && typeof overlayEl._stopElectric === "function") {
          overlayEl._stopElectric();
        } else if (overlayEl && typeof overlayEl._tdvStop === "function") {
          overlayEl._tdvStop();
        } else if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
      } catch {
        // ignore
      }

      overlayEl = null;
    }

    overlayEl = createElectricOverlay(ctx, cfg);
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectBokeh(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createBokehOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createCSSBokehOverlay : null;
    if (typeof createBokehOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
      } catch {
        // ignore
      }
      overlayEl = null;
    }

    overlayEl = createBokehOverlay(ctx, cfg);
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectFlames(ctx, cfg) {
    const { scaleDuration, clamp, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 8000, 800);
    const createCSSFireOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createCSSFireOverlay : null;
    if (typeof createCSSFireOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    const intensity = clamp(Number(cfg.intensity) || 1.0, 0.5, 2.0);
    const speed = clamp(Number(cfg.speed) || 1.0, 0.5, 3.0);
    const scale = clamp(Number(cfg.scale) || 1.0, 0.5, 2.0);
    const showBackground = cfg.showBackground === true;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      const el = overlayEl;
      overlayEl = null;
      if (!el) return;

      try {
        el.style.transition = "opacity 240ms ease";
        el.style.opacity = "0";
      } catch {
        // ignore
      }

      setTimeout(() => {
        try {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch {
          // ignore
        }
      }, 260);
    }

    overlayEl = createCSSFireOverlay(ctx, { intensity, speed, scale, showBackground });
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  // Shader burn as a one-shot (auto-cleans after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectBurn(ctx, cfg) {
    const { scaleDuration, clamp, cssLayer, getStageSize, getConfig } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 7000, 800);
    const durationSec = Math.max(0.1, durationMs / 1000);

    const progressSpeed = clamp(Number(cfg.progressSpeed) || 1.0, 0.01, 2.0);
    const flameSpeed = clamp(Number(cfg.flameSpeed) || 1.0, 0.1, 4.0);
    const background = cfg.background === "white" ? "white" : "transparent";
    const loop = cfg.loop === true;

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-effect-burn";
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    if (background === "white") {
      // When using the "burning paper" look, keep the overlay slightly translucent so it
      // doesn't appear as a broken full-white screen at the start of the animation.
      container.style.opacity = "0.85";
    }

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const gl =
      canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;

      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_progress;
      uniform float u_time;
      uniform float u_showBackground;

      float rand(vec2 n) {
          return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
      }
      float noise(vec2 n) {
          const vec2 d = vec2(0., 1.);
          vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
          return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
      }
      float fbm(vec2 n) {
          float total = 0.0, amplitude = .4;
          for (int i = 0; i < 4; i++) {
              total += noise(n) * amplitude;
              n += n;
              amplitude *= 0.6;
          }
          return total;
      }

      void main() {
          vec2 uv = vUv;
          uv.x *= min(1., u_resolution.x / u_resolution.y);
          uv.y *= min(1., u_resolution.y / u_resolution.x);

          float t = u_progress;
          float main_noise = 1. - fbm(.75 * uv + 10. - vec2(.3, .9 * t));

          vec3 fire_color = fbm(6. * uv - vec2(0., .005 * u_time)) * vec3(6., 1.4, .0);
          float show_fire = smoothstep(.4, .9, fbm(10. * uv + 2. - vec2(0., .005 * u_time)));
          show_fire += smoothstep(.7, .8, fbm(.5 * uv + 5. - vec2(0., .001 * u_time)));

          float fire_border = .02 * show_fire;
          float fire_edge = smoothstep(main_noise - fire_border, main_noise - .5 * fire_border, t);
          fire_edge *= (1. - smoothstep(main_noise - .5 * fire_border, main_noise, t));

          if (u_showBackground > 0.5) {
              vec3 color = vec3(1., 1., .95);
              float paper_darkness = smoothstep(main_noise - .1, main_noise, t);
              color -= vec3(.99, .95, .99) * paper_darkness;
              color += fire_color * fire_edge;
              float opacity = 1. - smoothstep(main_noise - .0005, main_noise, t);
              gl_FragColor = vec4(color, opacity);
          } else {
              float paper_darkness = smoothstep(main_noise - .1, main_noise, t);
              vec3 darkColor = vec3(0.05, 0.04, 0.03) * paper_darkness;
              vec3 color = darkColor + fire_color * fire_edge;
              float opacity = max(paper_darkness * 0.8, fire_edge * 0.9);
              opacity *= (1. - smoothstep(main_noise - .0005, main_noise, t));
              gl_FragColor = vec4(color, opacity);
          }
      }
    `;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(vs, fs) {
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        return null;
      }
      return program;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(vertexShader, fragmentShader);
    if (!program) return;

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uProgress = gl.getUniformLocation(program, "u_progress");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uShowBackground = gl.getUniformLocation(program, "u_showBackground");

    let stopped = false;
    let timeoutId = null;
    let rafId = null;
    let resizeTimer = null;

    function resize() {
      const size = getStageSize();
      const dpr =
        dom && typeof dom.getEffectiveDevicePixelRatio === "function"
          ? dom.getEffectiveDevicePixelRatio(getConfig ? getConfig() : null)
          : window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(size.w * dpr));
      canvas.height = Math.max(1, Math.round(size.h * dpr));
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        window.removeEventListener("resize", onResize);
      } catch {
        // ignore
      }

      try {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      } catch {
        // ignore
      }

      try {
        if (container.parentNode) container.parentNode.removeChild(container);
      } catch {
        // ignore
      }
    }

    function onResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (stopped) return;
        resize();
      }, 120);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);
    window.addEventListener("resize", onResize, { passive: true });

    gl.uniform1f(uShowBackground, background === "white" ? 1.0 : 0.0);

    cssLayer.appendChild(container);
    resize();

    const startTime = Date.now();
    function render() {
      if (stopped) return;
      const elapsed = (Date.now() - startTime) / 1000.0;
      if (elapsed >= durationSec) {
        cleanup();
        return;
      }

      const timeMs = elapsed * 1000.0 * flameSpeed;

      let progress;
      const normalized = elapsed / durationSec;
      if (loop) {
        const scaled = normalized * progressSpeed;
        const cycleMod = scaled - Math.floor(scaled / 2.0) * 2.0;
        progress = cycleMod < 1.0 ? cycleMod : 2.0 - cycleMod;
      } else {
        // Always reach 1.0 by the end of the duration; progressSpeed shapes how quickly
        // we get there (higher = faster, lower = slower), without "stalling" below 1.
        const exponent = 1 / Math.max(0.01, progressSpeed);
        progress = Math.pow(Math.min(Math.max(normalized, 0.0), 1.0), exponent);
      }

      gl.uniform1f(uTime, timeMs);
      gl.uniform1f(uProgress, progress);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
  }

  // Wind as a theme-like one-shot (spawns over time, cleans up after duration).
  // eslint-disable-next-line max-lines-per-function
  function effectWind(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      pick,
      clamp,
      particles: p,
      particleManager,
      cssLayer,
      color,
    } = ctx;

    if (!cssLayer || !p || !p.WindParticle) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const emissionRate = scaleCount(Number(cfg.emissionRate) || 14, 2);
    const maxParticles = scaleCount(Number(cfg.maxParticles) || 160, 30);

    const speedMin = Number.isFinite(Number(cfg.speedMin)) ? Number(cfg.speedMin) : 90;
    const speedMax = Number.isFinite(Number(cfg.speedMax)) ? Number(cfg.speedMax) : 180;
    const lengthMin = Number.isFinite(Number(cfg.lengthMin)) ? Number(cfg.lengthMin) : 60;
    const lengthMax = Number.isFinite(Number(cfg.lengthMax)) ? Number(cfg.lengthMax) : 140;
    const drift = Number.isFinite(Number(cfg.drift)) ? Number(cfg.drift) : 32;

    const colorMode = typeof cfg.colorMode === "string" ? cfg.colorMode : "palette";
    const colorHex = typeof cfg.colorHex === "string" ? cfg.colorHex : "#cbd5e1";
    const colorOpacity = Number.isFinite(Number(cfg.colorOpacity))
      ? Number(cfg.colorOpacity)
      : 0.65;

    const fallback =
      color && typeof color.hexToRgba === "function"
        ? color.hexToRgba(colorHex, colorOpacity)
        : colorHex;

    const palette =
      Array.isArray(cfg.colors) && cfg.colors.length ? cfg.colors.filter(Boolean) : [fallback];

    const customColor =
      color && typeof color.hexToRgba === "function"
        ? color.hexToRgba(colorHex, colorOpacity)
        : colorHex;

    const colors = colorMode === "custom" ? [customColor].filter(Boolean) : palette;

    const stageNow = getStageSize();
    const defaultLifetimeSec = clamp((stageNow.w + lengthMax + 220) / Math.max(1, speedMin), 2, 30);
    const particleLifetimeSec = clamp(Number(cfg.particleLifetimeSec) || defaultLifetimeSec, 2, 30);

    const particleCfg = {
      speedMin,
      speedMax,
      lengthMin,
      lengthMax,
      drift,
    };

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-theme-layer tdv-theme-wind";
    layerToken.setAttribute("aria-hidden", "true");
    layerToken.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    cssLayer.appendChild(layerToken);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let acc = 0;

    const tag = "wind";

    function countActive() {
      const all =
        particleManager && Array.isArray(particleManager.particles)
          ? particleManager.particles
          : [];
      let count = 0;
      for (let i = 0; i < all.length; i++) {
        const particle = all[i];
        if (particle && particle._tdvEffectTag === tag) count += 1;
      }
      return count;
    }

    function spawn(toSpawn) {
      if (!toSpawn || !particleManager) return;

      let currentCount = countActive();
      if (currentCount >= maxParticles) return;

      const stage = getStageSize();
      const list = [];
      const xStart = -lengthMax - 120;

      for (let i = 0; i < toSpawn && currentCount < maxParticles; i++) {
        const particle = new p.WindParticle(
          xStart + rand(-60, 20),
          rand(-80, stage.h + 80),
          pick(colors),
          particleLifetimeSec,
          particleCfg
        );
        particle._tdvEffectTag = tag;
        list.push(particle);
        currentCount += 1;
      }

      if (list.length) addParticles(list);
    }

    function stop({ clearParticles } = {}) {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      if (clearParticles && particleManager && typeof particleManager.clearWhere === "function") {
        particleManager.clearWhere((particle) => !!particle && particle._tdvEffectTag === tag);
      }

      try {
        if (layerToken && layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      acc += dt * emissionRate;
      const toSpawn = Math.floor(acc);
      if (toSpawn > 0) {
        acc -= toSpawn;
        spawn(toSpawn);
      }

      rafId = requestAnimationFrame(tick);
    }

    layerToken._tdvStop = () => stop({ clearParticles: true });
    timeoutId = setTimeout(() => stop({ clearParticles: true }), durationMs);

    // Kickstart immediately so users see the effect right away.
    spawn(Math.max(1, Math.min(10, Math.round(emissionRate * 0.5))));
    rafId = requestAnimationFrame(tick);
  }

  const CHRISTMAS_LIGHTS_STYLE_ID = "tdv-christmas-lights-style";
  const CHRISTMAS_LIGHTS_CSS = `
	    #tdv-effects-root .tdv-christmas-lights{position:absolute;inset:0;overflow:hidden;}
    #tdv-effects-root .tdv-christmas-lights, #tdv-effects-root .tdv-christmas-lights *{box-sizing:border-box;}

    #tdv-effects-root .tdv-christmas-lights .stars{position:absolute;top:0;left:0;width:100%;height:60%;z-index:1;}
    #tdv-effects-root .tdv-christmas-lights .star{position:absolute;background:#fff;border-radius:50%;animation:tdv-christmas-lights-twinkle 3s infinite ease-in-out;}
    @keyframes tdv-christmas-lights-twinkle{
      0%,100%{opacity:0.3;transform:scale(1);}
      50%{opacity:1;transform:scale(1.2);}
    }

    #tdv-effects-root .tdv-christmas-lights .bokeh-container{position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;}
    #tdv-effects-root .tdv-christmas-lights .bokeh{position:absolute;border-radius:50%;filter:blur(8px);opacity:0.3;animation:tdv-christmas-lights-bokeh-float 15s infinite ease-in-out;}
    @keyframes tdv-christmas-lights-bokeh-float{
      0%,100%{transform:translateY(0px);}
      50%{transform:translateY(-20px);}
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope{
      text-align:center;
      white-space:nowrap;
      overflow:hidden;
      position:absolute;
      z-index:10;
      top:0;
      left:0;
      width:100%;
      padding:20px 0 0 0;
      margin:0;
      pointer-events:none;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li{
      position:relative;
      animation-fill-mode:both;
      animation-iteration-count:infinite;
      list-style:none;
      margin:0;
      padding:0;
      display:inline-block;
      width:12px;
      height:28px;
      border-radius:50%;
      margin:20px;
      background:rgba(0,247,165,1);
      box-shadow:0px 4.66px 24px 3px rgba(0,247,165,1);
      animation-name:flash-1;
      animation-duration:2s;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:nth-child(5n+1){
      background:rgba(255,50,50,1);
      box-shadow:0px 4.66px 24px 3px rgba(255,50,50,1);
      animation-name:tdv-christmas-lights-flash-red;
      animation-duration:1.5s;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:nth-child(5n+2){
      background:rgba(255,215,0,1);
      box-shadow:0px 4.66px 24px 3px rgba(255,215,0,1);
      animation-name:tdv-christmas-lights-flash-gold;
      animation-duration:1.8s;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:nth-child(5n+3){
      background:rgba(0,150,255,1);
      box-shadow:0px 4.66px 24px 3px rgba(0,150,255,1);
      animation-name:tdv-christmas-lights-flash-blue;
      animation-duration:2.2s;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:nth-child(5n+4){
      background:rgba(0,255,100,1);
      box-shadow:0px 4.66px 24px 3px rgba(0,255,100,1);
      animation-name:tdv-christmas-lights-flash-green;
      animation-duration:1.6s;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:nth-child(5n){
      background:rgba(255,255,255,1);
      box-shadow:0px 4.66px 24px 3px rgba(255,255,255,1);
      animation-name:tdv-christmas-lights-flash-white;
      animation-duration:2.4s;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:before{
      content:"";
      position:absolute;
      background:#222;
      width:10px;
      height:9.33px;
      border-radius:3px;
      top:-4.66px;
      left:1px;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:after{
      content:"";
      top:-14px;
      left:9px;
      position:absolute;
      width:52px;
      height:18.66px;
      border-bottom:solid #222 2px;
      border-radius:50%;
    }

    #tdv-effects-root .tdv-christmas-lights .lightrope li:last-child:after{content:none;}
    #tdv-effects-root .tdv-christmas-lights .lightrope li:first-child{margin-left:-40px;}

    @keyframes tdv-christmas-lights-flash-red{
      0%,100%{background:rgba(255,50,50,1);box-shadow:0px 4.66px 24px 3px rgba(255,50,50,1);}
      50%{background:rgba(255,50,50,0.4);box-shadow:0px 4.66px 24px 3px rgba(255,50,50,0.2);}
    }
    @keyframes tdv-christmas-lights-flash-gold{
      0%,100%{background:rgba(255,215,0,1);box-shadow:0px 4.66px 24px 3px rgba(255,215,0,1);}
      50%{background:rgba(255,215,0,0.4);box-shadow:0px 4.66px 24px 3px rgba(255,215,0,0.2);}
    }
    @keyframes tdv-christmas-lights-flash-blue{
      0%,100%{background:rgba(0,150,255,1);box-shadow:0px 4.66px 24px 3px rgba(0,150,255,1);}
      50%{background:rgba(0,150,255,0.4);box-shadow:0px 4.66px 24px 3px rgba(0,150,255,0.2);}
    }
    @keyframes tdv-christmas-lights-flash-green{
      0%,100%{background:rgba(0,255,100,1);box-shadow:0px 4.66px 24px 3px rgba(0,255,100,1);}
      50%{background:rgba(0,255,100,0.4);box-shadow:0px 4.66px 24px 3px rgba(0,255,100,0.2);}
    }
    @keyframes tdv-christmas-lights-flash-white{
      0%,100%{background:rgba(255,255,255,1);box-shadow:0px 4.66px 24px 3px rgba(255,255,255,1);}
      50%{background:rgba(255,255,255,0.4);box-shadow:0px 4.66px 24px 3px rgba(255,255,255,0.2);}
    }

    #tdv-effects-root .tdv-christmas-lights .snow-container{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;}
    #tdv-effects-root .tdv-christmas-lights .snowflake{position:absolute;top:-10px;background:#fff;border-radius:50%;opacity:0.8;animation:tdv-christmas-lights-fall linear infinite;}
    #tdv-effects-root .tdv-christmas-lights .snowflake.far{opacity:0.4;filter:blur(2px);}
    #tdv-effects-root .tdv-christmas-lights .snowflake.near{opacity:0.9;z-index:15;}

    #tdv-effects-root .tdv-christmas-lights .snow-ground{
      position:absolute;
      bottom:0;
      left:0;
      width:100%;
      height:0px;
      background:linear-gradient(to bottom, #ffffff 0%, #e8f4f8 100%);
      box-shadow:0 -10px 30px rgba(255,255,255,0.6);
      z-index:6;
      animation:tdv-christmas-lights-accumulate var(--tdv-cl-accum-dur,45s) linear forwards;
    }

    #tdv-effects-root .tdv-christmas-lights .snow-ground::before{
      content:"";
      position:absolute;
      top:-20px;
      left:0;
      width:100%;
      height:40px;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.9) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 40%, rgba(255,255,255,0.7) 0%, transparent 50%);
    }

    @keyframes tdv-christmas-lights-fall{
      0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0.8;}
      100%{transform:translateY(110vh) translateX(var(--drift)) rotate(360deg);opacity:0;}
    }

    @keyframes tdv-christmas-lights-accumulate{
      0%{height:0px;}
      100%{height:var(--tdv-cl-accum-height,200px);}
    }
  `;

  const CHRISTMAS_LIGHTS_BOKEH_COLORS = [
    "rgba(255,50,50,0.3)",
    "rgba(255,215,0,0.3)",
    "rgba(0,150,255,0.3)",
    "rgba(0,255,100,0.3)",
    "rgba(255,255,255,0.3)",
  ];

  function ensureChristmasLightsStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet(
        "css/themes/christmas-lights.css",
        CHRISTMAS_LIGHTS_STYLE_ID,
        CHRISTMAS_LIGHTS_CSS
      );
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(CHRISTMAS_LIGHTS_CSS, CHRISTMAS_LIGHTS_STYLE_ID);
    }
  }

  function createChristmasLightsOverlay(cfg, helpers) {
    ensureChristmasLightsStylesInjected();

    const pick = helpers && helpers.pick ? helpers.pick : (arr) => arr[0];

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-effect-christmas-lights tdv-christmas-lights";
    container.setAttribute("aria-hidden", "true");

    const showStars = typeof cfg.showStars === "boolean" ? cfg.showStars : true;
    const showBokeh = typeof cfg.showBokeh === "boolean" ? cfg.showBokeh : true;
    const showLights = typeof cfg.showLights === "boolean" ? cfg.showLights : true;
    const showSnow = typeof cfg.showSnow === "boolean" ? cfg.showSnow : true;
    const showSnowGround = typeof cfg.showSnowGround === "boolean" ? cfg.showSnowGround : true;

    if (showStars) {
      const starsContainer = document.createElement("div");
      starsContainer.className = "stars";
      const starFrag = document.createDocumentFragment();
      const starCount = Number.isFinite(Number(cfg.starsCount))
        ? Math.max(0, Math.round(Number(cfg.starsCount)))
        : 100;
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div");
        star.className = "star";
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 60}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${Math.random() * 2 + 2}s`;
        starFrag.appendChild(star);
      }
      starsContainer.appendChild(starFrag);
      container.appendChild(starsContainer);
    }

    if (showBokeh) {
      const bokehContainer = document.createElement("div");
      bokehContainer.className = "bokeh-container";
      const bokehFrag = document.createDocumentFragment();
      const bokehCount = Number.isFinite(Number(cfg.bokehCount))
        ? Math.max(0, Math.round(Number(cfg.bokehCount)))
        : 15;

      const bokehMode =
        cfg && typeof cfg.bokehColorMode === "string" ? cfg.bokehColorMode : "palette";
      const bokehOpacityRaw =
        cfg && typeof cfg.bokehOpacity !== "undefined" ? Number(cfg.bokehOpacity) : 0.3;
      const bokehOpacity = Number.isFinite(bokehOpacityRaw) ? clamp(bokehOpacityRaw, 0, 1) : 0.3;
      const bokehColorHex = typeof cfg.bokehColorHex === "string" ? cfg.bokehColorHex : "#ffffff";
      const customColor =
        color && typeof color.hexToRgba === "function"
          ? color.hexToRgba(bokehColorHex, bokehOpacity)
          : `rgba(255,255,255,${bokehOpacity})`;

      for (let i = 0; i < bokehCount; i++) {
        const bokeh = document.createElement("div");
        bokeh.className = "bokeh";
        const size = Math.random() * 80 + 40;
        bokeh.style.width = `${size}px`;
        bokeh.style.height = `${size}px`;
        bokeh.style.left = `${Math.random() * 100}%`;
        bokeh.style.top = `${Math.random() * 80}%`;
        bokeh.style.background =
          bokehMode === "custom" ? customColor : pick(CHRISTMAS_LIGHTS_BOKEH_COLORS);
        bokeh.style.opacity = String(bokehOpacity);
        bokeh.style.animationDelay = `${Math.random() * 5}s`;
        bokeh.style.animationDuration = `${Math.random() * 10 + 10}s`;
        bokehFrag.appendChild(bokeh);
      }
      bokehContainer.appendChild(bokehFrag);
      container.appendChild(bokehContainer);
    }

    if (showLights) {
      const lightrope = document.createElement("ul");
      lightrope.className = "lightrope";
      const lightCount = Number.isFinite(Number(cfg.lightCount))
        ? Math.max(0, Math.round(Number(cfg.lightCount)))
        : 40;
      for (let i = 0; i < lightCount; i++) {
        lightrope.appendChild(document.createElement("li"));
      }
      container.appendChild(lightrope);
    }

    if (showSnow) {
      const snowContainer = document.createElement("div");
      snowContainer.className = "snow-container";

      const snowGround = document.createElement("div");
      snowGround.className = "snow-ground";

      const snowAccHeight = Number.isFinite(Number(cfg.snowAccumulateHeight))
        ? Math.max(0, Number(cfg.snowAccumulateHeight))
        : 200;
      const snowAccSec = Number.isFinite(Number(cfg.snowAccumulateSec))
        ? Math.max(1, Number(cfg.snowAccumulateSec))
        : 45;
      snowGround.style.setProperty("--tdv-cl-accum-dur", `${snowAccSec}s`);
      snowGround.style.setProperty("--tdv-cl-accum-height", `${snowAccHeight}px`);

      const snowColorHex = typeof cfg.snowColorHex === "string" ? cfg.snowColorHex : "#ffffff";
      snowGround.style.background = `linear-gradient(to bottom, ${snowColorHex} 0%, #e8f4f8 100%)`;

      if (showSnowGround) snowContainer.appendChild(snowGround);

      const flakeFrag = document.createDocumentFragment();
      const flakeCount = Number.isFinite(Number(cfg.snowflakeCount))
        ? Math.max(0, Math.round(Number(cfg.snowflakeCount)))
        : 150;
      for (let i = 0; i < flakeCount; i++) {
        const flake = document.createElement("div");
        flake.className = "snowflake";

        const layer = Math.random();
        if (layer < 0.3) flake.classList.add("far");
        else if (layer > 0.7) flake.classList.add("near");

        let size;
        if (flake.classList.contains("far")) size = Math.random() * 3 + 1;
        else if (flake.classList.contains("near")) size = Math.random() * 6 + 3;
        else size = Math.random() * 4 + 2;
        flake.style.width = `${size}px`;
        flake.style.height = `${size}px`;

        flake.style.left = `${Math.random() * 100}vw`;

        let duration;
        if (flake.classList.contains("far")) duration = Math.random() * 8 + 12;
        else if (flake.classList.contains("near")) duration = Math.random() * 4 + 4;
        else duration = Math.random() * 5 + 7;
        flake.style.animationDuration = `${duration}s`;
        flake.style.animationDelay = `${Math.random() * 5}s`;

        const drift = (Math.random() - 0.5) * 100;
        flake.style.setProperty("--drift", `${drift}px`);
        flake.style.opacity = String(Math.random() * 0.6 + 0.4);
        flake.style.background = snowColorHex;

        flakeFrag.appendChild(flake);
      }
      snowContainer.appendChild(flakeFrag);
      container.appendChild(snowContainer);
    }

    // Force reflow to prevent animation FOUC (especially for snow/stars).
    void container.offsetWidth;

    return container;
  }

  function effectChristmasLights(ctx, cfg) {
    const { cssLayer, scaleCount, scaleDuration, pick } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);

    const starsRaw = Number(cfg.starsCount);
    const bokehRaw = Number(cfg.bokehCount);
    const snowRaw = Number(cfg.snowflakeCount);
    const lightRaw = Number(cfg.lightCount);

    const effectiveCfg = {
      ...cfg,
      starsCount: scaleCount(Number.isFinite(starsRaw) ? starsRaw : 100, 0),
      bokehCount: scaleCount(Number.isFinite(bokehRaw) ? bokehRaw : 15, 0),
      snowflakeCount: scaleCount(Number.isFinite(snowRaw) ? snowRaw : 150, 0),
      lightCount: scaleCount(Number.isFinite(lightRaw) ? lightRaw : 40, 0),
    };

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
      } catch {
        // ignore
      }
      overlayEl = null;
    }

    overlayEl = createChristmasLightsOverlay(effectiveCfg, { pick });
    cssLayer.appendChild(overlayEl);
    overlayEl._tdvStop = stop;
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectFlowers(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createFlowersOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createFlowersOverlay : null;
    if (typeof createFlowersOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && typeof overlayEl._stopFlowers === "function") {
          overlayEl._stopFlowers();
        } else if (overlayEl && typeof overlayEl._tdvStop === "function") {
          overlayEl._tdvStop();
        } else if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
      } catch {
        // ignore
      }

      overlayEl = null;
    }

    overlayEl = createFlowersOverlay(ctx, cfg);
    if (!overlayEl) return;

    // Ensure the stacking system can stop it (exclusive effects, stopAll, etc).
    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectSpinningRays(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createSpinningRaysOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createSpinningRaysOverlay : null;
    if (typeof createSpinningRaysOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && typeof overlayEl._stopSpinningRays === "function") {
          overlayEl._stopSpinningRays();
        } else if (overlayEl && typeof overlayEl._tdvStop === "function") {
          overlayEl._tdvStop();
        } else if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
      } catch {
        // ignore
      }

      overlayEl = null;
    }

    overlayEl = createSpinningRaysOverlay(ctx, cfg);
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectStorm(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createStormOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createStormOverlay : null;
    if (typeof createStormOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && typeof overlayEl._stopStorm === "function") {
          overlayEl._stopStorm();
        } else if (overlayEl && typeof overlayEl._tdvStop === "function") {
          overlayEl._tdvStop();
        } else if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
      } catch {
        // ignore
      }

      overlayEl = null;
    }

    overlayEl = createStormOverlay(ctx, cfg);
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectSineWaves(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createSineWavesOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createSineWavesOverlay : null;
    if (typeof createSineWavesOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && typeof overlayEl._stopSineWaves === "function") {
          overlayEl._stopSineWaves();
        } else if (overlayEl && typeof overlayEl._tdvStop === "function") {
          overlayEl._tdvStop();
        } else if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
      } catch {
        // ignore
      }

      overlayEl = null;
    }

    overlayEl = createSineWavesOverlay(ctx, cfg);
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectBalloons(ctx, cfg) {
    const { scaleDuration, cssLayer } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const createBalloonsOverlay =
      effectsPro && effectsPro._internals ? effectsPro._internals._createBalloonsOverlay : null;
    if (typeof createBalloonsOverlay !== "function") return;

    let stopped = false;
    let timeoutId = null;
    let overlayEl = null;

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (overlayEl && typeof overlayEl._stopBalloons === "function") {
          overlayEl._stopBalloons();
        } else if (overlayEl && typeof overlayEl._tdvStop === "function") {
          overlayEl._tdvStop();
        } else if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
      } catch {
        // ignore
      }

      overlayEl = null;
    }

    overlayEl = createBalloonsOverlay(ctx, cfg);
    if (!overlayEl) return;

    overlayEl._tdvStop = stop;
    cssLayer.appendChild(overlayEl);
    timeoutId = setTimeout(stop, durationMs);
  }

  function effectSmoke(ctx, cfg) {
    const {
      scaleCount,
      scaleDuration,
      getStageSize,
      addParticles,
      rand,
      particles: p,
      cssLayer,
    } = ctx;

    const hasHybridCfg =
      !!cfg &&
      (typeof cfg.spawnIntervalMs !== "undefined" ||
        typeof cfg.maxParticles !== "undefined" ||
        typeof cfg.particleLifetimeMs !== "undefined" ||
        typeof cfg.colorHex === "string" ||
        typeof cfg.opacityScale !== "undefined" ||
        typeof cfg.blendMode === "string");

    // Backward-compatible fallback: keep the legacy particle-based smoke if the new config keys
    // are not present or if the CSS overlay layer isn't available.
    if (!hasHybridCfg || !cssLayer) {
      const count = scaleCount(cfg.count || 30, 10);
      const duration = scaleDuration(cfg.durationMs || 4200, 800) / 1000;
      const list = [];
      const size = getStageSize();
      for (let i = 0; i < count; i++) {
        list.push(
          new p.SmokeParticle(
            rand(0, size.w),
            size.h + rand(20, 80),
            cfg.color || "rgba(200,200,200,0.35)",
            duration
          )
        );
      }
      addParticles(list);
      return;
    }

    const durationMs = scaleDuration(Number(cfg.durationMs) || 4200, 800);
    const spawnIntervalMsRaw = Number(cfg.spawnIntervalMs);
    const spawnIntervalMs = clamp(
      Number.isFinite(spawnIntervalMsRaw) ? spawnIntervalMsRaw : 40,
      10,
      250
    );

    const maxParticlesRaw = Number(cfg.maxParticles);
    const legacyCountRaw = Number(cfg.count);
    const maxParticlesBase = Number.isFinite(maxParticlesRaw)
      ? maxParticlesRaw
      : Number.isFinite(legacyCountRaw)
        ? legacyCountRaw
        : 100;
    const maxParticles = scaleCount(maxParticlesBase, 10);

    const particleLifetimeMsRaw = Number(cfg.particleLifetimeMs);
    const particleLifetimeMs = clamp(
      Number.isFinite(particleLifetimeMsRaw) ? particleLifetimeMsRaw : 4000,
      200,
      30000
    );

    const riseSpeedRaw = Number(cfg.riseSpeed);
    const riseSpeed = clamp(Number.isFinite(riseSpeedRaw) ? riseSpeedRaw : 1, 0.05, 10);

    const sizeScaleRaw = Number(cfg.sizeScale);
    const sizeScale = clamp(Number.isFinite(sizeScaleRaw) ? sizeScaleRaw : 1, 0.2, 5);

    const opacityScaleRaw = Number(cfg.opacityScale);
    const opacityScale = clamp(Number.isFinite(opacityScaleRaw) ? opacityScaleRaw : 0.4, 0.01, 1);

    const rotationEnabled = cfg.rotation !== false;

    const blendMode = typeof cfg.blendMode === "string" && cfg.blendMode ? cfg.blendMode : "screen";

    const colorHex = typeof cfg.colorHex === "string" && cfg.colorHex ? cfg.colorHex : "#ffffff";
    const rgb =
      color && typeof color.parseColor === "function"
        ? color.parseColor(colorHex, { r: 255, g: 255, b: 255, a: 1 })
        : { r: 255, g: 255, b: 255, a: 1 };

    const config =
      (ctx && typeof ctx.getConfig === "function" ? ctx.getConfig() : ctx.config) || {};
    const dpr =
      dom && typeof dom.getEffectiveDevicePixelRatio === "function"
        ? dom.getEffectiveDevicePixelRatio(config)
        : 1;

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let lastTs = 0;
    let spawnAccMs = 0;

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-effect-smoke";
    container.setAttribute("aria-hidden", "true");
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;";

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    container.appendChild(canvas);
    cssLayer.appendChild(container);

    const g = canvas.getContext("2d", { alpha: true });
    if (!g) return;

    const smokeTexture = (() => {
      try {
        const tex = document.createElement("canvas");
        const tctx = tex.getContext("2d", { alpha: true });
        if (!tctx) return null;

        const size = 64;
        tex.width = size;
        tex.height = size;

        const grad = tctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.9)`);
        grad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        tctx.fillStyle = grad;
        tctx.fillRect(0, 0, size, size);

        const imageData = tctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = rand(-10, 10);
          data[i] = clamp(data[i] + noise, 0, 255);
          data[i + 1] = clamp(data[i + 1] + noise, 0, 255);
          data[i + 2] = clamp(data[i + 2] + noise, 0, 255);
        }
        tctx.putImageData(imageData, 0, 0);
        return tex;
      } catch {
        return null;
      }
    })();

    if (!smokeTexture) {
      try {
        if (container.parentNode) container.parentNode.removeChild(container);
      } catch {
        // ignore
      }
      return;
    }

    let stage = { w: 800, h: 600 };

    function resize() {
      stage = getStageSize();
      const w = Math.max(1, Math.round(stage.w));
      const h = Math.max(1, Math.round(stage.h));
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    const particlesLocal = [];

    function spawn(countToSpawn) {
      if (!countToSpawn) return;

      const emitterX = stage.w / 2;
      const emitterY = stage.h - 50;

      const driftPxPerSecBase = 48;
      const risePxPerSec = 60 * riseSpeed;
      const startSize = 32 * sizeScale;
      const endSize = 150 * sizeScale;

      for (let i = 0; i < countToSpawn && particlesLocal.length < maxParticles; i++) {
        particlesLocal.push({
          x: emitterX + rand(-40, 40),
          y: emitterY + rand(-10, 20),
          vx: rand(-driftPxPerSecBase, driftPxPerSecBase),
          vy: -risePxPerSec * rand(0.85, 1.15),
          angle: rand(0, Math.PI * 2),
          vr: rand(-0.35, 0.35), // radians/sec
          bornMs: performance.now ? performance.now() : Date.now(),
          lifeMs: particleLifetimeMs * rand(0.85, 1.15),
          startSize,
          endSize,
        });
      }
    }

    function stop() {
      if (stopped) return;
      stopped = true;

      try {
        window.removeEventListener("resize", resize);
      } catch {
        // ignore
      }

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      rafId = null;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;

      try {
        if (container && container.parentNode) container.parentNode.removeChild(container);
      } catch {
        // ignore
      }
    }

    function tick(ts) {
      if (stopped) return;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      spawnAccMs += dt * 1000;
      const canSpawn = particlesLocal.length < maxParticles;
      if (canSpawn && spawnAccMs >= spawnIntervalMs) {
        const toSpawn = Math.min(6, Math.floor(spawnAccMs / spawnIntervalMs));
        spawnAccMs -= toSpawn * spawnIntervalMs;
        spawn(toSpawn);
      }

      g.clearRect(0, 0, stage.w, stage.h);

      g.save();
      try {
        g.globalCompositeOperation = blendMode;
      } catch {
        g.globalCompositeOperation = "source-over";
      }

      const nowMs = performance.now ? performance.now() : Date.now();
      for (let i = particlesLocal.length - 1; i >= 0; i--) {
        const particle = particlesLocal[i];
        const ageMs = nowMs - particle.bornMs;
        const t = particle.lifeMs ? clamp(ageMs / particle.lifeMs, 0, 1) : 1;
        if (t >= 1 || particle.y < -200) {
          particlesLocal.splice(i, 1);
          continue;
        }

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (rotationEnabled) {
          particle.angle += particle.vr * dt;
        }

        const size = particle.startSize + (particle.endSize - particle.startSize) * t;
        let alpha = 1 - t;
        if (t > 0.8) alpha *= 0.9;

        g.globalAlpha = alpha * opacityScale;
        g.save();
        g.translate(particle.x, particle.y);
        if (rotationEnabled) g.rotate(particle.angle);
        g.drawImage(smokeTexture, -size / 2, -size / 2, size, size);
        g.restore();
      }
      g.restore();

      rafId = requestAnimationFrame(tick);
    }

    container._tdvStop = stop;
    timeoutId = setTimeout(stop, durationMs);

    // Kickstart quickly so users see smoke immediately.
    spawn(Math.min(12, Math.max(1, Math.round(maxParticles * 0.08))));
    rafId = requestAnimationFrame(tick);
  }

  function effectLaser(ctx, cfg) {
    const { scaleDuration, scaleCount, addCssEffect, rand } = ctx;
    const duration = scaleDuration(cfg.durationMs || 700, 200);
    const thickness = Math.max(2, cfg.thickness || 4);
    const color = cfg.color || "#00ffff";
    const opacity = Math.min(Math.max(cfg.opacity ?? 0.85, 0.05), 1);
    const lines = scaleCount(cfg.lines || 3, 1);
    const staggerMs = Math.max(0, cfg.staggerMs ?? 80);
    const glowPx = Math.max(0, cfg.glowPx ?? 12);
    const offsetRangePct = Math.max(0, cfg.offsetRangePct ?? 40);

    const dir = cfg.direction || "leftToRight";
    const angles = {
      leftToRight: 0,
      rightToLeft: 180,
      topToBottom: 90,
      bottomToTop: 270,
      diagTLBR: 45,
      diagTRBL: 135,
    };
    const angle = (angles[dir] ?? 0) + (dir === "rightToLeft" || dir === "bottomToTop" ? 0 : 0);

    const offsetForLine = () => {
      const delta = rand(-offsetRangePct, offsetRangePct);
      const unit = dir === "topToBottom" || dir === "bottomToTop" ? "vw" : "vh";
      return `${delta}${unit}`;
    };

    for (let i = 0; i < lines; i++) {
      const delay = i * staggerMs;
      const offset = offsetForLine();
      addCssEffect(
        "tdv-laser",
        {
          "--color": color,
          "--angle": `${angle}deg`,
          "--offset": offset,
          "--glow": `${glowPx}px`,
          "--opacity": `${opacity}`,
          height: `${thickness}px`,
          animationDelay: `${delay}ms`,
        },
        duration,
        duration + delay
      );
    }
  }

  function effectFireworks(ctx, cfg) {
    const { scaleDuration, getStageSize, addParticles, rand, pick, particles: p } = ctx;
    const bursts = Math.max(1, cfg.bursts || 5);
    const rays = Math.max(8, cfg.rays || 18);
    const duration = scaleDuration(cfg.durationMs || 3000, 900) / 1000;
    const colors = cfg.colors && cfg.colors.length ? cfg.colors : ["#ffffff"];
    const list = [];
    const size = getStageSize();

    for (let b = 0; b < bursts; b++) {
      const originX = rand(size.w * 0.2, size.w * 0.8);
      const originY = rand(size.h * 0.15, size.h * 0.55);
      for (let r = 0; r < rays; r++) {
        const angle = (Math.PI * 2 * r) / rays + rand(-0.15, 0.15);
        const speed = rand(160, 320);
        list.push(new p.FireworkParticle(originX, originY, pick(colors), duration, angle, speed));
      }
    }

    addParticles(list);
  }

  function effectEnergy(ctx, cfg) {
    const {
      scaleDuration,
      scaleCount,
      getStageSize,
      addCssEffect,
      addParticles,
      rand,
      particles: p,
    } = ctx;
    const duration = scaleDuration(cfg.durationMs || 700, 200);
    const color = cfg.color || "rgba(0,255,255,0.6)";
    const size = getStageSize();
    const baseSize = Math.max(140, Math.min(cfg.sizePx || 220, Math.min(size.w, size.h)));

    addCssEffect(
      "tdv-energy",
      {
        "--size": `${baseSize}px`,
        "--color": color,
      },
      duration
    );

    addCssEffect(
      "tdv-energy",
      {
        "--size": `${Math.round(baseSize * 0.6)}px`,
        "--color": color,
        animationDelay: `${Math.round(duration * 0.15)}ms`,
      },
      duration,
      duration + Math.round(duration * 0.15)
    );

    const sparkleCount = scaleCount(24, 8);
    const sparkles = [];
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push(
        new p.SparkleParticle(
          size.w / 2 + rand(-baseSize * 0.25, baseSize * 0.25),
          size.h / 2 + rand(-baseSize * 0.25, baseSize * 0.25),
          "#ffffff",
          Math.max(0.8, duration / 1000)
        )
      );
    }
    addParticles(sparkles);
  }

  function effectVhs(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 3200, 400);
    const intensity = clamp(Number(cfg.intensity) || 0.6, 0.2, 1.2);
    addCssEffect(
      "tdv-vhs",
      { "--intensity": String(intensity), opacity: String(intensity) },
      duration
    );
  }

  function effectCrt(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 3600, 600);
    const scanline = clamp(Number(cfg.scanlineOpacity) || 0.16, 0.04, 0.4);
    const vignette = clamp(Number(cfg.vignette) || 0.45, 0.1, 0.9);
    addCssEffect(
      "tdv-crt",
      { "--scanline": String(scanline), "--vignette": String(vignette) },
      duration
    );
  }

  function effectAscii(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect, buildAsciiText } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2800, 400);
    const fontSize = clamp(Number(cfg.fontSizePx) || 10, 8, 18);
    const color = cfg.color || "#00ff41";

    const opacityRaw = typeof cfg.opacity !== "undefined" ? Number(cfg.opacity) : 0.85;
    const opacity = Number.isFinite(opacityRaw) ? clamp(opacityRaw, 0, 1) : 0.85;

    const backgroundAlphaRaw =
      typeof cfg.backgroundAlpha !== "undefined" ? Number(cfg.backgroundAlpha) : 0.82;
    const backgroundAlpha = Number.isFinite(backgroundAlphaRaw)
      ? clamp(backgroundAlphaRaw, 0, 1)
      : 0.82;

    const allowedBlendModes = ["normal", "multiply", "screen", "overlay", "soft-light"];
    const blendMode =
      cfg && typeof cfg.blendMode === "string" && allowedBlendModes.includes(cfg.blendMode)
        ? cfg.blendMode
        : "screen";

    const letterSpacingRaw =
      typeof cfg.letterSpacingPx !== "undefined" ? Number(cfg.letterSpacingPx) : 0.5;
    const letterSpacingPx = Number.isFinite(letterSpacingRaw) ? clamp(letterSpacingRaw, 0, 6) : 0.5;

    const lineHeightRaw = typeof cfg.lineHeight !== "undefined" ? Number(cfg.lineHeight) : 1.05;
    const lineHeight = Number.isFinite(lineHeightRaw) ? clamp(lineHeightRaw, 0.8, 2) : 1.05;
    const el = addCssEffect(
      "tdv-ascii",
      {
        "--ascii-size": `${fontSize}px`,
        "--ascii-color": color,
        "--ascii-opacity": String(opacity),
        "--ascii-bg-alpha": String(backgroundAlpha),
        "--ascii-blend": blendMode,
        "--ascii-letter": `${letterSpacingPx}px`,
        "--ascii-line-height": String(lineHeight),
      },
      duration
    );
    if (el) {
      el.textContent = buildAsciiText(fontSize);
    }
  }

  function effectBulge(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2000, 300);
    const scale = clamp(Number(cfg.scale) || 1.35, 1.05, 2.2);

    const centerXRaw = typeof cfg.centerXPercent !== "undefined" ? Number(cfg.centerXPercent) : 50;
    const centerYRaw = typeof cfg.centerYPercent !== "undefined" ? Number(cfg.centerYPercent) : 50;
    const centerX = Number.isFinite(centerXRaw) ? clamp(centerXRaw, 0, 100) : 50;
    const centerY = Number.isFinite(centerYRaw) ? clamp(centerYRaw, 0, 100) : 50;

    const glowAlphaRaw = typeof cfg.glowAlpha !== "undefined" ? Number(cfg.glowAlpha) : 0.2;
    const glowAlpha = Number.isFinite(glowAlphaRaw) ? clamp(glowAlphaRaw, 0, 0.8) : 0.2;

    const radiusRaw = typeof cfg.radiusPercent !== "undefined" ? Number(cfg.radiusPercent) : 60;
    const radiusPercent = Number.isFinite(radiusRaw) ? clamp(radiusRaw, 10, 120) : 60;

    const blurRaw = typeof cfg.blurPx !== "undefined" ? Number(cfg.blurPx) : 1.5;
    const blurPx = Number.isFinite(blurRaw) ? clamp(blurRaw, 0, 12) : 1.5;

    const saturateRaw = typeof cfg.saturate !== "undefined" ? Number(cfg.saturate) : 1.1;
    const saturate = Number.isFinite(saturateRaw) ? clamp(saturateRaw, 0.5, 2.5) : 1.1;

    addCssEffect(
      "tdv-bulge",
      {
        "--scale": String(scale),
        "--bulge-x": `${centerX}%`,
        "--bulge-y": `${centerY}%`,
        "--bulge-glow-alpha": String(glowAlpha),
        "--bulge-radius": `${radiusPercent}%`,
        "--bulge-blur": `${blurPx}px`,
        "--bulge-saturate": String(saturate),
      },
      duration
    );
  }

  function effectGrain(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect, getNoiseDataUrl } = ctx;
    const duration = scaleDuration(cfg.durationMs || 4200, 500);
    const intensity = clamp(Number(cfg.intensity) || 0.18, 0.05, 0.5);
    const el = addCssEffect("tdv-grain", { "--grain-opacity": String(intensity) }, duration);
    if (el) {
      const noiseUrl = getNoiseDataUrl();
      if (noiseUrl) {
        el.style.backgroundImage = `url(${noiseUrl})`;
        el.style.backgroundSize = "120px 120px";
      }
    }
  }

  function effectWatercolor(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 3800, 500);
    const intensity = clamp(Number(cfg.intensity) || 0.65, 0.2, 1);
    addCssEffect("tdv-watercolor", { "--watercolor-opacity": String(intensity) }, duration);
  }

  function effectEightBit(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 3000, 400);
    const pixelSize = clamp(Number(cfg.pixelSize) || 8, 4, 18);
    const intensity = clamp(Number(cfg.intensity) || 0.5, 0.1, 1);

    const blendMode = cfg && typeof cfg.blendMode === "string" ? cfg.blendMode : "multiply";

    const lineAlphaRaw = cfg && typeof cfg.lineAlpha !== "undefined" ? Number(cfg.lineAlpha) : 0.08;
    const lineAlpha = Number.isFinite(lineAlphaRaw) ? clamp(lineAlphaRaw, 0, 1) : 0.08;
    const colorHex = cfg && typeof cfg.colorHex === "string" ? cfg.colorHex : "#000000";
    const lineColor =
      color && typeof color.hexToRgba === "function"
        ? color.hexToRgba(colorHex, lineAlpha)
        : `rgba(0,0,0,${lineAlpha})`;

    const jitterPxRaw = cfg && typeof cfg.jitterPx !== "undefined" ? Number(cfg.jitterPx) : 2;
    const jitterPx = Number.isFinite(jitterPxRaw) ? clamp(jitterPxRaw, 0, 30) : 2;

    const jitterMsRaw = cfg && typeof cfg.jitterMs !== "undefined" ? Number(cfg.jitterMs) : 0;
    const jitterMs = Number.isFinite(jitterMsRaw) ? clamp(jitterMsRaw, 0, 60000) : 0;

    const styles = {
      "--pixel-size": `${pixelSize}px`,
      "--pixel-opacity": String(intensity),
      "--pixel-line-color": lineColor,
      "--pixel-blend": blendMode,
      "--pixel-jitter": `${jitterPx}px`,
    };
    if (jitterMs > 0) styles["--pixel-jitter-ms"] = `${Math.round(jitterMs)}ms`;

    addCssEffect("tdv-eightbit", styles, duration);
  }

  function effectStrobe(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const totalDuration = scaleDuration(cfg.durationMs || 2000, 400);
    const frequency = clamp(Number(cfg.frequency) || 12, 2, 24);
    const periodMs = Math.max(60, Math.round(1000 / frequency));
    addCssEffect(
      "tdv-strobe",
      { background: cfg.color || "rgba(255,255,255,0.6)" },
      periodMs,
      totalDuration
    );
  }

  function effectHardGlitch(ctx, cfg) {
    const { scaleDuration, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 1200, 200);

    const container = addCssEffect(
      "tdv-glitch tdv-glitch-hard",
      { "--duration": `${duration}ms` },
      duration
    );
    if (container) {
      const scanLayer = document.createElement("div");
      scanLayer.className = "tdv-glitch-layer";
      container.appendChild(scanLayer);

      const linesLayer = document.createElement("div");
      linesLayer.className = "tdv-glitch-layer";
      container.appendChild(linesLayer);

      const flickerLayer = document.createElement("div");
      flickerLayer.className = "tdv-glitch-layer";
      container.appendChild(flickerLayer);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  function effectShaderFire(ctx, cfg) {
    const { cssLayer, scaleDuration, clamp, getStageSize } = ctx;
    if (!cssLayer) return;

    const duration = scaleDuration(cfg.durationMs || 4000, 500);
    const intensity = clamp(Number(cfg.intensity) || 0.8, 0.3, 1.5);
    const speed = clamp(Number(cfg.speed) || 1.0, 0.3, 2.0);

    const size = getStageSize();
    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-shader-fire";
    container.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:${intensity};`;

    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const gl =
      canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      #ifdef GL_ES
      precision mediump float;
      #endif

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_intensity;
      uniform float u_riseSoftness;

      float random(in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 2.233))) * 43758.5453123);
      }

      float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(in vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;
        st *= 2.0;

        vec3 a = vec3(0.724, 0.259, 0.400 + sin(u_time));
        vec3 b = vec3(0.580, 0.104, 0.568);
        float motionA = fbm(st - 0.180 * u_time);
        float motionB = fbm(st - 0.028 * 2.900 * u_time);
        float constraints = fbm(st - 0.332 * u_time);

        vec2 q = vec2(0.0);
        vec2 r = vec2(0.410, -0.210) * (u_time * 0.736);
        r.x = fbm(st + 1.0 * q + vec2(-0.410, 0.560) + -0.0178 * u_time);

        float f = fbm(st + r);

        vec3 color = vec3(0.144 * st.x / st.y - -0.612, 0.901, 2.001);
        color = mix(
          f * f + 0.968 * f * f + 0.748 * mix(
            vec3(0.940, 0.940, 0.940) + cos(3.124),
            vec3(1.000, 0.047, 0.009),
            clamp(length(r.x), 0.0, 2.248)
          ),
          vec3(b) - constraints,
          st.y
        );

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compileShader(source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        try {
          console.error(
            "[effectsPro][ShaderFire] Shader compile error:",
            gl.getShaderInfoLog(shader)
          );
        } catch {
          // ignore
        }
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    gl.uniform2f(uResolution, canvas.width, canvas.height);

    cssLayer.appendChild(container);

    const startTime = Date.now();
    let animationId = null;
    let stopped = false;

    function cleanup() {
      if (stopped) return;
      stopped = true;

      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }

      try {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      } catch {
        // ignore
      }

      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
    container._tdvStop = cleanup;

    function render() {
      if (stopped) return;

      const elapsed = (Date.now() - startTime) / 1000.0;

      if (Date.now() - startTime >= duration) {
        cleanup();
        return;
      }

      try {
        gl.uniform1f(uTime, 60.0 * elapsed * 0.03 * speed);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        animationId = requestAnimationFrame(render);
      } catch {
        cleanup();
      }
    }

    render();
  }

  function effectPixelSort(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2000, 300);
    const intensity = clamp(Number(cfg.intensity) || 0.6, 0.2, 1);
    const stripe = Math.round(6 + intensity * 10);
    addCssEffect(
      "tdv-pixelsort",
      { "--pixelsort-opacity": String(intensity), "--stripe": `${stripe}px` },
      duration
    );
  }

  function effectCrtTurnOff(ctx, cfg) {
    const { clamp, cssLayer } = ctx;
    if (!cssLayer) return;

    const speed = clamp(Number(cfg.speed) || 1.0, 0.5, 2.0);
    const verticalDelay = clamp(Number(cfg.verticalDelay) || 100, 0, 500);
    const horizontalDelay = clamp(Number(cfg.horizontalDelay) || 200, 100, 800);

    const verticalDuration = (200 / speed).toFixed(0);
    const horizontalDuration = (200 / speed).toFixed(0);
    const verticalDelayMs = verticalDelay;
    const horizontalDelayMs = horizontalDelay;

    const turnOffLayer = document.createElement("div");
    turnOffLayer.className = "tdv-crt-turnoff";
    turnOffLayer.style.cssText = `
      --vertical-duration: ${verticalDuration}ms;
      --horizontal-duration: ${horizontalDuration}ms;
      --vertical-delay: ${verticalDelayMs}ms;
      --horizontal-delay: ${horizontalDelayMs}ms;
    `;

    // Create 4 bars for the "closing" animation
    const bars = ["top", "bottom", "left", "right"];
    bars.forEach((pos) => {
      const bar = document.createElement("div");
      bar.className = `tdv-crt-bar ${pos}`;
      turnOffLayer.appendChild(bar);
    });

    cssLayer.appendChild(turnOffLayer);

    // Force reflow
    void turnOffLayer.offsetWidth;

    requestAnimationFrame(() => {
      turnOffLayer.classList.add("active");
    });

    // Cleanup after animation (duration + max delay + buffer)
    const cleanupTime =
      Math.max(
        Number(horizontalDelayMs) + Number(horizontalDuration),
        Number(verticalDelayMs) + Number(verticalDuration)
      ) + 200;

    setTimeout(() => {
      if (turnOffLayer.parentNode) {
        turnOffLayer.parentNode.removeChild(turnOffLayer);
      }
    }, cleanupTime);
  }

  function effectCurtains(ctx, cfg) {
    const { clamp, cssLayer, scaleDuration } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 3000, 250);
    const action = typeof cfg.action === "string" ? cfg.action : "open";
    const holdMs = Math.round(clamp(Number(cfg.holdMs) || 0, 0, 10000));

    const color1Hex =
      typeof cfg.color1Hex === "string" && cfg.color1Hex ? cfg.color1Hex : "#8b0000";
    const color2Hex =
      typeof cfg.color2Hex === "string" && cfg.color2Hex ? cfg.color2Hex : "#bf4848";
    const overlayAlpha = clamp(Number(cfg.overlayAlpha), 0, 1);
    const easing = typeof cfg.easing === "string" && cfg.easing ? cfg.easing : "ease-out";

    const rodEnabled = typeof cfg.rodEnabled === "boolean" ? cfg.rodEnabled : true;
    const rodHeightPx = Math.round(clamp(Number(cfg.rodHeightPx) || 30, 0, 120));
    const rodColorHex =
      typeof cfg.rodColorHex === "string" && cfg.rodColorHex ? cfg.rodColorHex : "#6b3b19";

    const openWidthPercent = clamp(Number(cfg.openWidthPercent) || 10, 1, 40);
    const openOffsetPercent = clamp(Number(cfg.openOffsetPercent) || 16, 0, 40);
    const openRotateDeg = clamp(Number(cfg.openRotateDeg) || 7, 0, 20);

    const topPercent = clamp(Number(cfg.topPercent) || -10, -30, 20);
    const heightPercent = clamp(Number(cfg.heightPercent) || 120, 100, 160);

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-curtains";

    layerToken.style.setProperty("--tdv-curtains-duration", `${durationMs}ms`);
    layerToken.style.setProperty("--tdv-curtains-easing", easing);
    layerToken.style.setProperty("--tdv-curtains-color-1", color1Hex);
    layerToken.style.setProperty("--tdv-curtains-color-2", color2Hex);
    layerToken.style.setProperty(
      "--tdv-curtains-alpha",
      String(Number.isFinite(overlayAlpha) ? overlayAlpha : 1)
    );
    layerToken.style.setProperty("--tdv-curtains-open-width", `${openWidthPercent}%`);
    layerToken.style.setProperty("--tdv-curtains-open-offset", `${openOffsetPercent}%`);
    layerToken.style.setProperty("--tdv-curtains-open-rotate", `${openRotateDeg}deg`);
    layerToken.style.setProperty("--tdv-curtains-top", `${topPercent}%`);
    layerToken.style.setProperty("--tdv-curtains-height", `${heightPercent}%`);
    layerToken.style.setProperty("--tdv-curtains-rod-height", `${rodHeightPx}px`);
    layerToken.style.setProperty("--tdv-curtains-rod-color", rodColorHex);

    if (rodEnabled) {
      const rod = document.createElement("div");
      rod.className = "tdv-curtains-rod";
      layerToken.appendChild(rod);
    }

    const left = document.createElement("div");
    left.className = "tdv-curtains-panel tdv-curtains-left";
    const right = document.createElement("div");
    right.className = "tdv-curtains-panel tdv-curtains-right";
    layerToken.appendChild(left);
    layerToken.appendChild(right);

    let stopped = false;
    let rafId = null;
    let phaseTimerId = null;
    let cleanupTimerId = null;

    function cleanup() {
      if (stopped) return;
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (phaseTimerId) clearTimeout(phaseTimerId);
      if (cleanupTimerId) clearTimeout(cleanupTimerId);
      if (layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
    }

    layerToken._tdvStop = cleanup;
    cssLayer.appendChild(layerToken);

    // Initial state depends on action.
    if (action === "close" || action === "closeThenOpen") {
      layerToken.classList.add("is-open");
    }

    rafId = requestAnimationFrame(() => {
      if (stopped) return;

      if (action === "open") {
        layerToken.classList.add("is-open");
        cleanupTimerId = setTimeout(cleanup, durationMs + 200);
        return;
      }

      if (action === "close") {
        layerToken.classList.remove("is-open");
        cleanupTimerId = setTimeout(cleanup, durationMs + holdMs + 200);
        return;
      }

      // closeThenOpen: close -> hold -> open -> cleanup
      layerToken.classList.remove("is-open");
      phaseTimerId = setTimeout(() => {
        if (stopped) return;
        layerToken.classList.add("is-open");
      }, durationMs + holdMs);
      cleanupTimerId = setTimeout(cleanup, durationMs * 2 + holdMs + 200);
    });
  }

  function effectSelfDestruct(ctx, cfg) {
    const { clamp, cssLayer, getConfig, scaleDuration } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 12000, 800);
    const countdownSec = Math.round(clamp(Number(cfg.countdownSec) || 9, 3, 60));
    const messageText =
      typeof cfg.messageText === "string" ? cfg.messageText : "DEVICE SELF-DESTRUCTION";

    const gridOpacity = clamp(Number(cfg.gridOpacity) || 0.12, 0, 1);
    const overlayOpacity = clamp(Number(cfg.overlayOpacity) || 0.35, 0, 1);
    const panelOpacity = clamp(Number(cfg.panelOpacity) || 0.82, 0, 1);

    const warningColorHex =
      typeof cfg.warningColorHex === "string" && cfg.warningColorHex
        ? cfg.warningColorHex
        : "#ff0000";
    const textColorHex =
      typeof cfg.textColorHex === "string" && cfg.textColorHex ? cfg.textColorHex : "#ffffff";

    const showGrid = typeof cfg.showGrid === "boolean" ? cfg.showGrid : true;
    const abortEnabled = !!cfg.abortEnabled;
    const crtEnabled = typeof cfg.crtEnabled === "boolean" ? cfg.crtEnabled : true;

    const crtDelayMs = Math.round(clamp(Number(cfg.crtDelayMs) || 1500, 0, 6000));
    const autoResetMs = Math.round(clamp(Number(cfg.autoResetMs) || 3000, 0, 20000));

    let stopped = false;
    let intervalId = null;
    let timeoutId = null;
    let detonateTimeoutId = null;
    let resetTimeoutId = null;

    const layerToken = document.createElement("div");
    layerToken.className = "tdv-effect-layer tdv-selfdestruct";
    layerToken.style.setProperty("--tdv-selfdestruct-grid-opacity", String(gridOpacity));
    layerToken.style.setProperty("--tdv-selfdestruct-overlay-opacity", String(overlayOpacity));
    layerToken.style.setProperty("--tdv-selfdestruct-panel-opacity", String(panelOpacity));
    const warningBg =
      color && typeof color.hexToRgba === "function"
        ? color.hexToRgba(warningColorHex, panelOpacity)
        : `rgba(255,0,0,${panelOpacity})`;
    const overlayBg =
      color && typeof color.hexToRgba === "function"
        ? color.hexToRgba(warningColorHex, overlayOpacity)
        : `rgba(255,0,0,${overlayOpacity})`;
    layerToken.style.setProperty("--tdv-selfdestruct-warning-bg", warningBg);
    layerToken.style.setProperty("--tdv-selfdestruct-overlay-bg", overlayBg);
    layerToken.style.setProperty("--tdv-selfdestruct-text", textColorHex);

    const reducedMotion =
      (() => {
        const live = getConfig && typeof getConfig === "function" ? getConfig() : null;
        return !!(live && live.reducedMotionRespect);
      })() || false;
    if (reducedMotion) layerToken.dataset.reducedMotion = "true";

    // Important: pointer events are disabled globally for the overlay root; enable only when Abort is requested.
    if (abortEnabled) layerToken.style.pointerEvents = "auto";

    const grid = document.createElement("div");
    grid.className = "tdv-selfdestruct-grid";
    if (!showGrid) grid.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "tdv-selfdestruct-panel";

    const title = document.createElement("div");
    title.className = "tdv-selfdestruct-title";
    title.textContent = "WARNING";

    const msg = document.createElement("div");
    msg.className = "tdv-selfdestruct-msg";
    msg.textContent = messageText;

    const time = document.createElement("div");
    time.className = "tdv-selfdestruct-time";
    time.textContent = String(countdownSec).padStart(2, "0");

    const abort = document.createElement("button");
    abort.type = "button";
    abort.className = "tdv-selfdestruct-abort";
    abort.textContent = "ABORT";
    if (!abortEnabled) abort.style.display = "none";

    const detonate = document.createElement("div");
    detonate.className = "tdv-selfdestruct-detonate";
    detonate.textContent = "DETONATE";

    panel.appendChild(title);
    panel.appendChild(msg);
    panel.appendChild(time);
    panel.appendChild(abort);
    panel.appendChild(detonate);

    layerToken.appendChild(grid);
    layerToken.appendChild(panel);
    cssLayer.appendChild(layerToken);

    function cleanup() {
      if (stopped) return;
      stopped = true;

      try {
        if (intervalId) clearInterval(intervalId);
      } catch {
        // ignore
      }
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      try {
        if (detonateTimeoutId) clearTimeout(detonateTimeoutId);
      } catch {
        // ignore
      }
      try {
        if (resetTimeoutId) clearTimeout(resetTimeoutId);
      } catch {
        // ignore
      }

      try {
        abort.removeEventListener("click", onAbort);
      } catch {
        // ignore
      }

      if (layerToken.parentNode) layerToken.parentNode.removeChild(layerToken);
    }

    function onAbort() {
      cleanup();
    }

    function doDetonate() {
      if (stopped) return;
      time.classList.add("tdv-selfdestruct-crono");
      abort.classList.add("tdv-selfdestruct-hide");
      detonate.classList.add("tdv-selfdestruct-show");

      if (crtEnabled) {
        detonateTimeoutId = setTimeout(() => {
          if (stopped) return;
          const live = getConfig && typeof getConfig === "function" ? getConfig() : null;
          const crtCfg =
            live && live.effects && live.effects.crtTurnOff
              ? live.effects.crtTurnOff
              : { speed: 1.0 };
          effectCrtTurnOff(ctx, crtCfg);
        }, crtDelayMs);
      }

      resetTimeoutId = setTimeout(() => {
        cleanup();
      }, crtDelayMs + autoResetMs);
    }

    layerToken._tdvStop = cleanup;
    abort.addEventListener("click", onAbort);

    // Start countdown immediately.
    let remaining = countdownSec;
    intervalId = setInterval(() => {
      if (stopped) return;
      remaining -= 1;
      time.textContent = String(Math.max(0, remaining)).padStart(2, "0");
      if (remaining <= 0) {
        try {
          if (intervalId) clearInterval(intervalId);
        } catch {
          // ignore
        }
        doDetonate();
      }
    }, 1000);

    // Hard safety cutoff.
    timeoutId = setTimeout(() => {
      cleanup();
    }, durationMs + 200);
  }

  function effectBlur(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2000, 300);
    const amount = clamp(Number(cfg.amountPx) || 12, 2, 40);

    const bgAlphaRaw = typeof cfg.bgAlpha !== "undefined" ? Number(cfg.bgAlpha) : 0.02;
    const bgAlpha = Number.isFinite(bgAlphaRaw) ? clamp(bgAlphaRaw, 0, 0.2) : 0.02;

    const allowedBlendModes = ["normal", "multiply", "screen", "overlay", "soft-light"];
    const blendMode =
      cfg && typeof cfg.blendMode === "string" && allowedBlendModes.includes(cfg.blendMode)
        ? cfg.blendMode
        : "normal";

    const saturateRaw = typeof cfg.saturate !== "undefined" ? Number(cfg.saturate) : 1.0;
    const saturate = Number.isFinite(saturateRaw) ? clamp(saturateRaw, 0.5, 2.5) : 1.0;

    const brightnessRaw = typeof cfg.brightness !== "undefined" ? Number(cfg.brightness) : 1.0;
    const brightness = Number.isFinite(brightnessRaw) ? clamp(brightnessRaw, 0.5, 2) : 1.0;

    addCssEffect(
      "tdv-blur",
      {
        "--blur": `${amount}px`,
        "--blur-bg-alpha": String(bgAlpha),
        "--blur-blend": blendMode,
        "--blur-saturate": String(saturate),
        "--blur-brightness": String(brightness),
      },
      duration
    );
  }

  function effectBleach(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2200, 300);
    const intensity = clamp(Number(cfg.intensity) || 0.5, 0.1, 0.9);

    const allowedBlendModes = ["normal", "multiply", "screen", "overlay", "soft-light"];
    const blendMode =
      cfg && typeof cfg.blendMode === "string" && allowedBlendModes.includes(cfg.blendMode)
        ? cfg.blendMode
        : "screen";

    const colorHex = cfg && typeof cfg.colorHex === "string" ? cfg.colorHex : "#ffffff";
    const bleachBg =
      color && typeof color.hexToRgba === "function"
        ? color.hexToRgba(colorHex, intensity)
        : `rgba(255,255,255,${intensity})`;

    const brightnessRaw = typeof cfg.brightness !== "undefined" ? Number(cfg.brightness) : 1.4;
    const brightness = Number.isFinite(brightnessRaw) ? clamp(brightnessRaw, 0.5, 2) : 1.4;

    const contrastRaw = typeof cfg.contrast !== "undefined" ? Number(cfg.contrast) : 1.3;
    const contrast = Number.isFinite(contrastRaw) ? clamp(contrastRaw, 0.5, 2) : 1.3;

    const saturateRaw = typeof cfg.saturate !== "undefined" ? Number(cfg.saturate) : 0.7;
    const saturate = Number.isFinite(saturateRaw) ? clamp(saturateRaw, 0, 2.5) : 0.7;

    addCssEffect(
      "tdv-bleach",
      {
        "--bleach-alpha": String(intensity),
        "--bleach-bg": bleachBg,
        "--bleach-blend": blendMode,
        "--bleach-brightness": String(brightness),
        "--bleach-contrast": String(contrast),
        "--bleach-saturate": String(saturate),
      },
      duration
    );
  }

  function effectColorCorrection(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2800, 400);
    const brightness = clamp(Number(cfg.brightness) || 1.1, 0.7, 1.8);
    const contrast = clamp(Number(cfg.contrast) || 1.25, 0.7, 2);
    const saturate = clamp(Number(cfg.saturate) || 1.15, 0.6, 2);
    addCssEffect(
      "tdv-color-correction",
      {
        "--brightness": String(brightness),
        "--contrast": String(contrast),
        "--saturate": String(saturate),
      },
      duration
    );
  }

  const MATRIX_DANCE_STYLE_ID = "tdv-matrix-dance-style";
  const MATRIX_DANCE_CSS = `
	    #tdv-effects-root .tdv-matrix-dance{position:absolute;inset:0;pointer-events:none;}
	    #tdv-effects-root .tdv-matrix-dance canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}
	  `;

  function ensureMatrixDanceStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet("css/effects/matrix-dance.css", MATRIX_DANCE_STYLE_ID, MATRIX_DANCE_CSS);
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(MATRIX_DANCE_CSS, MATRIX_DANCE_STYLE_ID);
    }
  }

  function effectMatrixDance(ctx, cfg) {
    const { cssLayer, scaleDuration, clamp, getStageSize } = ctx;
    if (!cssLayer) return;
    ensureMatrixDanceStylesInjected();

    const durationMs = scaleDuration(cfg.durationMs || 5200, 800);
    const fontSize = clamp(Number(cfg.fontSizePx) || 16, 10, 28);
    const trailAlpha = clamp(Number(cfg.trailAlpha) || 0.05, 0.01, 0.2);

    const reducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.config)
        : false;
    const colStep = reducedMotion ? 2 : 1;

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-matrix-dance";
    container.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return;

    cssLayer.appendChild(container);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let resizeTimer = null;
    let columns = 0;
    let drops = [];
    let stageW = 0;
    let stageH = 0;
    let frame = 0;
    const chars = "01";

    function resize() {
      const size = getStageSize();
      stageW = Math.max(1, Math.floor(size.w));
      stageH = Math.max(1, Math.floor(size.h));

      const dpr =
        dom && typeof dom.getEffectiveDevicePixelRatio === "function"
          ? dom.getEffectiveDevicePixelRatio(ctx.config)
          : 1;
      canvas.width = Math.max(1, Math.floor(stageW * dpr));
      canvas.height = Math.max(1, Math.floor(stageH * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }

      ctx2d.font = `bold ${fontSize}px monospace`;
      ctx2d.textAlign = "center";

      columns = Math.max(1, Math.floor(stageW / fontSize));
      drops = new Array(columns);
      for (let i = 0; i < columns; i++) drops[i] = 0;
      ctx2d.clearRect(0, 0, stageW, stageH);
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;
      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      try {
        if (resizeTimer) clearTimeout(resizeTimer);
      } catch {
        // ignore
      }
      try {
        window.removeEventListener("resize", onResize);
      } catch {
        // ignore
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    function onResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!stopped) resize();
      }, 120);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);
    window.addEventListener("resize", onResize, { passive: true });

    resize();

    function draw() {
      // Fade existing glyphs without drawing an opaque background.
      ctx2d.save();
      ctx2d.globalCompositeOperation = "destination-out";
      ctx2d.fillStyle = `rgba(0,0,0,${trailAlpha})`;
      ctx2d.fillRect(0, 0, stageW, stageH);
      ctx2d.restore();

      for (let i = 0; i < columns; i += colStep) {
        const drop = drops[i];
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = (i + 0.5) * fontSize;
        const y = drop * fontSize;

        const brightness = Math.random();
        if (brightness < 0.1) ctx2d.fillStyle = "#fff";
        else if (brightness < 0.3) ctx2d.fillStyle = "#0f0";
        else ctx2d.fillStyle = "#050";

        ctx2d.fillText(char, x, y);

        if (y > stageH && Math.random() > 0.99) drops[i] = 0;
        else drops[i] = drop + 1;
      }
    }

    function tick() {
      if (stopped) return;

      if (document.visibilityState === "visible") {
        if (reducedMotion) {
          frame += 1;
          if (frame % 2 === 0) draw();
        } else {
          draw();
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  // eslint-disable-next-line max-lines-per-function
  function effectFallingStars(ctx, cfg) {
    const { cssLayer, scaleDuration, clamp, getStageSize, scaleCount } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 5200, 800);

    const STAR_THEMES = {
      blue: { hueStart: 200, hueRange: 30, gradient: ["#010810", "#2a4770"] },
      purple: { hueStart: 280, hueRange: 30, gradient: ["#0a0015", "#3d1770"] },
      red: { hueStart: 350, hueRange: 30, gradient: ["#100508", "#702a2a"] },
      orange: { hueStart: 30, hueRange: 30, gradient: ["#100a05", "#704a2a"] },
    };

    const reducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.config)
        : false;

    const config = {
      maxParticles: scaleCount(Number(cfg.maxParticles) || 220, 30),
      spawnRate: clamp(Number(cfg.spawnRate) || 20, 1, 200),
      baseSize: clamp(Number(cfg.baseSize) || 20, 4, 140),
      sizeVariation: clamp(Number(cfg.sizeVariation) || 0.2, 0, 1),
      gravity: clamp(Number(cfg.gravity) || 0.005, 0, 0.2),
      maxVelocity: clamp(Number(cfg.maxVelocity) || 10, 1, 40),
      velocityVariation: clamp(Number(cfg.velocityVariation) || 4, 0, 20),
      rotationSpeed: clamp(Number(cfg.rotationSpeed) || 0.1, 0, 1),
      shrinkRate: clamp(Number(cfg.shrinkRate) || 0.01, 0, 0.2),
      fadeRate: clamp(Number(cfg.fadeRate) || 0.01, 0, 0.2),
      fadeStartPercent: clamp(Number(cfg.fadeStartPercent) || 100, 0, 100),
      theme: typeof cfg.theme === "string" ? cfg.theme : "blue",
      useCustomColor: cfg.useCustomColor === true,
      customColorHex: typeof cfg.customColorHex === "string" ? cfg.customColorHex : "#ffffff",
      screenBlend: cfg.screenBlend !== false,
      shadowBlur: clamp(Number(cfg.shadowBlur) || 20, 0, 60),
      spawnMode: typeof cfg.spawnMode === "string" ? cfg.spawnMode : "rain",
      mouseTrail: cfg.mouseTrail === true,
      mouseRandomness: clamp(Number(cfg.mouseRandomness) || 25, 0, 200),
      clickExplosion: cfg.clickExplosion === true,
      explosionSize: clamp(Number(cfg.explosionSize) || 50, 1, 300),
      reverse: cfg.reverse === true,
      useCircleClip: cfg.useCircleClip === true,
    };

    if (reducedMotion) {
      config.maxParticles = Math.max(20, Math.round(config.maxParticles * 0.45));
      config.spawnRate = Math.round(config.spawnRate * 1.6);
      config.shadowBlur = Math.round(config.shadowBlur * 0.6);
    }

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-falling-stars";
    container.setAttribute("aria-hidden", "true");
    container.style.cssText =
      "position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:1;";

    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
    container.appendChild(canvas);

    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return;

    cssLayer.appendChild(container);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let resizeTimer = null;

    let stageW = 0;
    let stageH = 0;
    let clipRadius = 0;
    let lastSpawnTime = 0;
    const stars = [];

    const pointer = { x: 0, y: 0, has: false };

    function resolveDpr() {
      if (dom && typeof dom.getEffectiveDevicePixelRatio === "function") {
        return dom.getEffectiveDevicePixelRatio(ctx.config);
      }
      return window.devicePixelRatio || 1;
    }

    function resolveThemeKey() {
      const key = String(config.theme || "blue").trim();
      if (key === "mix") {
        const keys = Object.keys(STAR_THEMES);
        return keys[Math.floor(Math.random() * keys.length)];
      }
      return STAR_THEMES[key] ? key : "blue";
    }

    class Star {
      constructor(x, y, kaboom) {
        const fadeStart = clamp(config.fadeStartPercent / 100, 0, 1);
        const themeKey = resolveThemeKey();
        const themeDef = STAR_THEMES[themeKey] || STAR_THEMES.blue;
        this.kaboom = !!kaboom;
        this.fadeStart = this.kaboom ? 0 : fadeStart;

        this.scale = (Math.random() + config.sizeVariation) * config.baseSize;
        this.scaleSpeed = Math.random() / 5 + config.shrinkRate;
        this.opacity = 1;
        this.opacitySpeed = Math.random() / 100 + config.fadeRate;

        this.rotate = Math.random() * Math.PI;
        this.rotateSpeed = (Math.random() - 0.5) * config.rotationSpeed;

        this.x = typeof x === "number" ? x : Math.random() * stageW;
        this.y =
          typeof y === "number" ? y : config.reverse ? stageH + config.baseSize : -config.baseSize;

        this.startY = this.y;
        this.endY = config.reverse ? -config.baseSize : stageH + config.baseSize;

        this.vx = (Math.random() - 0.5) * (this.kaboom ? 10 : config.velocityVariation);
        if (this.kaboom) {
          this.vy = (Math.random() - 0.5) * 10;
        } else {
          this.vy = config.reverse ? -(Math.random() * 3) : Math.random() * 3;
        }

        if (config.useCustomColor) {
          this.color = config.customColorHex || "#ffffff";
        } else {
          this.color = `hsl(${Math.floor(Math.random() * themeDef.hueRange) + themeDef.hueStart}, 60%, 60%)`;
        }

        this.out = [];
        this.inside = [];
        for (let i = 0; i < 5; i++) {
          const ox = Math.cos((i / 5) * Math.PI * 2) * this.scale;
          const oy = Math.sin((i / 5) * Math.PI * 2) * this.scale;
          this.out.push([ox, oy]);

          const ix = Math.cos(((i + 0.5) / 5) * Math.PI * 2) * this.scale * 0.5;
          const iy = Math.sin(((i + 0.5) / 5) * Math.PI * 2) * this.scale * 0.5;
          this.inside.push([ix, iy]);
        }

        this.image = document.createElement("canvas");
        this.image.width = Math.max(1, Math.ceil(this.scale * 4));
        this.image.height = Math.max(1, Math.ceil(this.scale * 4));
        const off = this.image.getContext("2d");
        if (off) {
          off.translate(this.scale * 2, this.scale * 2);
          off.beginPath();
          off.moveTo(this.inside[0][0], this.inside[0][1]);
          for (let i = 0; i < 5; i++) {
            off.bezierCurveTo(
              this.out[i][0],
              this.out[i][1],
              this.out[i][0],
              this.out[i][1],
              this.inside[i][0],
              this.inside[i][1]
            );
          }
          off.bezierCurveTo(
            this.out[0][0],
            this.out[0][1],
            this.out[0][0],
            this.out[0][1],
            this.inside[0][0],
            this.inside[0][1]
          );
          off.closePath();
          off.fillStyle = this.color;
          off.shadowColor = this.color;
          off.shadowBlur = config.shadowBlur;
          off.fill();
        }
      }

      _travelProgress() {
        if (this.kaboom) return 1;
        const total = Math.max(1, Math.abs(this.endY - this.startY));
        const traveled = config.reverse ? this.startY - this.y : this.y - this.startY;
        return clamp(traveled / total, 0, 1);
      }

      update() {
        this.rotate += this.rotateSpeed;

        if (config.reverse) {
          this.vy = Math.max(-config.maxVelocity, this.vy - config.gravity);
        } else {
          this.vy = Math.min(config.maxVelocity, this.vy + config.gravity);
        }

        this.x += this.vx;
        this.y += this.vy;

        const progress = this._travelProgress();
        let fadeFactor = 1;
        if (!this.kaboom) {
          if (this.fadeStart >= 0.999) {
            fadeFactor = progress >= 1 ? 1 : 0;
          } else {
            fadeFactor = clamp((progress - this.fadeStart) / (1 - this.fadeStart), 0, 1);
          }
        }

        this.scale = Math.max(0, this.scale - this.scaleSpeed * fadeFactor);
        this.opacity = Math.max(0, this.opacity - this.opacitySpeed * fadeFactor);
      }

      draw(alpha) {
        if (this.opacity <= 0 || this.scale <= 0) return;
        ctx2d.save();
        ctx2d.globalAlpha = Math.max(0, Math.min(1, this.opacity * alpha));
        ctx2d.translate(this.x, this.y);
        ctx2d.scale(this.scale / config.baseSize, this.scale / config.baseSize);
        ctx2d.rotate(this.rotate);
        ctx2d.drawImage(this.image, -this.scale, -this.scale);
        ctx2d.restore();
      }

      isOutOfBounds() {
        return (
          this.x - this.scale > stageW ||
          this.x + this.scale < 0 ||
          this.y - this.scale > stageH + this.scale ||
          this.y + this.scale < -this.scale ||
          this.opacity <= 0 ||
          this.scale <= 0
        );
      }
    }

    function resize() {
      const size = getStageSize();
      stageW = Math.max(1, Math.floor(size.w));
      stageH = Math.max(1, Math.floor(size.h));
      clipRadius = Math.min(stageW / 2 - 4, stageH / 2 - 4);

      const dpr = resolveDpr();
      canvas.width = Math.max(1, Math.floor(stageW * dpr));
      canvas.height = Math.max(1, Math.floor(stageH * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }

      if (config.screenBlend && navigator.userAgent.toLowerCase().indexOf("firefox") === -1) {
        ctx2d.globalCompositeOperation = "screen";
      } else {
        ctx2d.globalCompositeOperation = "source-over";
      }

      if (!pointer.has) {
        pointer.x = stageW / 2;
        pointer.y = stageH / 2;
        pointer.has = true;
      }
    }

    function scheduleResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!stopped) resize();
      }, 120);
    }

    function setPointer(x, y) {
      pointer.x = x + (Math.random() - 0.5) * config.mouseRandomness;
      pointer.y = y + (Math.random() - 0.5) * config.mouseRandomness;
      pointer.has = true;
    }

    function onMouseMove(e) {
      setPointer(e.clientX, e.clientY);
    }

    function onClick(e) {
      if (!config.clickExplosion) return;
      const x = typeof e.clientX === "number" ? e.clientX : pointer.x;
      const y = typeof e.clientY === "number" ? e.clientY : pointer.y;
      for (let i = 0; i < config.explosionSize && stars.length < config.maxParticles; i++) {
        stars.push(new Star(x, y, true));
      }
    }

    function spawnAt(x, y) {
      if (stars.length >= config.maxParticles) return;
      stars.push(new Star(x, y, false));
    }

    const startAt =
      typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    const fadeOutAt = startAt + durationMs * 0.85;
    const stopAt = startAt + durationMs;

    function render(timestamp) {
      if (stopped) return;
      const now = typeof timestamp === "number" ? timestamp : Date.now();

      const fadeAlpha =
        now <= fadeOutAt ? 1 : clamp(1 - (now - fadeOutAt) / Math.max(1, stopAt - fadeOutAt), 0, 1);

      if (now >= stopAt) {
        cleanup();
        return;
      }

      ctx2d.clearRect(0, 0, stageW, stageH);

      if (config.useCircleClip) {
        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.arc(stageW / 2, stageH / 2, clipRadius, 0, Math.PI * 2, false);
        ctx2d.clip();

        const themeKey = STAR_THEMES[config.theme] ? config.theme : "blue";
        const themeDef = STAR_THEMES[themeKey] || STAR_THEMES.blue;
        const gradient = ctx2d.createRadialGradient(0, 0, 200, 100, stageH / 2, stageW);
        gradient.addColorStop(0, themeDef.gradient[0]);
        gradient.addColorStop(1, themeDef.gradient[1]);
        ctx2d.fillStyle = gradient;
        ctx2d.fillRect(0, 0, stageW, stageH);
        ctx2d.restore();
      }

      const shouldSpawn = now < fadeOutAt;
      if (shouldSpawn && now - lastSpawnTime > config.spawnRate) {
        if (config.spawnMode === "rain") {
          const x = Math.random() * stageW;
          const y = config.reverse ? stageH + config.baseSize : -config.baseSize;
          spawnAt(x, y);
        } else if (config.spawnMode === "mouse" && config.mouseTrail) {
          spawnAt(pointer.x, pointer.y);
        } else if (config.spawnMode === "both") {
          if (Math.random() < 0.5) {
            const x = Math.random() * stageW;
            const y = config.reverse ? stageH + config.baseSize : -config.baseSize;
            spawnAt(x, y);
          } else if (config.mouseTrail) {
            spawnAt(pointer.x, pointer.y);
          }
        }
        lastSpawnTime = now;
      }

      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.update();
        star.draw(fadeAlpha);
        if (star.isOutOfBounds()) stars.splice(i, 1);
      }

      rafId = requestAnimationFrame(render);
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;
      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      try {
        if (resizeTimer) clearTimeout(resizeTimer);
      } catch {
        // ignore
      }
      try {
        window.removeEventListener("resize", scheduleResize);
      } catch {
        // ignore
      }
      try {
        window.removeEventListener("mousemove", onMouseMove);
      } catch {
        // ignore
      }
      try {
        window.removeEventListener("click", onClick);
      } catch {
        // ignore
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);

    resize();
    window.addEventListener("resize", scheduleResize, { passive: true });

    if ((config.spawnMode === "mouse" || config.spawnMode === "both") && config.mouseTrail) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    if (config.clickExplosion) {
      window.addEventListener("click", onClick, { passive: true });
    }

    rafId = requestAnimationFrame(render);
  }

  // eslint-disable-next-line max-lines-per-function
  function effectHexagon(ctx, cfg) {
    const { cssLayer, scaleDuration, clamp, getStageSize, scaleCount } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(Number(cfg.durationMs) || 5200, 800);
    const reducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.config)
        : false;

    const config = {
      originXPercent: clamp(Number(cfg.originXPercent) || 50, 0, 100),
      originYPercent: clamp(Number(cfg.originYPercent) || 50, 0, 100),
      len: clamp(Number(cfg.len) || 20, 4, 80),
      pixelSize: clamp(Number(cfg.pixelSize) || 2, 1, 12),
      count: scaleCount
        ? scaleCount(Number(cfg.count) || 50, 10)
        : clamp(Number(cfg.count) || 50, 10, 600),
      baseTime: clamp(Number(cfg.baseTime) || 10, 1, 80),
      addedTime: clamp(Number(cfg.addedTime) || 10, 0, 120),
      spawnChance: clamp(
        typeof cfg.spawnChance === "number" ? cfg.spawnChance : Number(cfg.spawnChance) || 1,
        0,
        1
      ),
      dieChance: clamp(
        typeof cfg.dieChance === "number" ? cfg.dieChance : Number(cfg.dieChance) || 0.05,
        0,
        1
      ),
      sparkChance: clamp(
        typeof cfg.sparkChance === "number" ? cfg.sparkChance : Number(cfg.sparkChance) || 0.1,
        0,
        1
      ),
      sparkDist: clamp(Number(cfg.sparkDist) || 10, 0, 120),
      sparkSize: clamp(Number(cfg.sparkSize) || 2, 1, 20),
      hueStart: (((Number(cfg.hueStart) || 0) % 360) + 360) % 360,
      hueChange: clamp(Number(cfg.hueChange) || 0.1, 0, 5),
      saturation: clamp(Number(cfg.saturation) || 100, 0, 100),
      baseLight: clamp(Number(cfg.baseLight) || 50, 0, 100),
      addedLight: clamp(Number(cfg.addedLight) || 10, 0, 100),
      shadowToTimePropMult: clamp(Number(cfg.shadowToTimePropMult) || 6, 0, 40),
      repaintAlpha: clamp(Number(cfg.repaintAlpha) || 0.04, 0.005, 0.35),
      compositeOperation:
        typeof cfg.compositeOperation === "string" ? cfg.compositeOperation : "lighter",
    };

    if (reducedMotion) {
      config.count = Math.max(10, Math.round(config.count * 0.45));
      config.sparkChance = Math.min(config.sparkChance, 0.04);
      config.shadowToTimePropMult = Math.round(config.shadowToTimePropMult * 0.6);
    }

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-hexagon";
    container.setAttribute("aria-hidden", "true");
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";

    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
    container.appendChild(canvas);

    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return;

    cssLayer.appendChild(container);

    let stopped = false;
    let rafId = null;
    let timeoutId = null;
    let resizeTimer = null;

    let stageW = 0;
    let stageH = 0;
    let cx = 0;
    let cy = 0;

    const baseRad = (Math.PI * 2) / 6;
    let tick = 0;
    const lines = [];

    function resolveDpr() {
      if (dom && typeof dom.getEffectiveDevicePixelRatio === "function") {
        return dom.getEffectiveDevicePixelRatio(ctx.config);
      }
      return window.devicePixelRatio || 1;
    }

    function resolveCompositeOperation() {
      const op = String(config.compositeOperation || "lighter").toLowerCase();
      if (op === "screen") return "screen";
      if (op === "source-over") return "source-over";
      return "lighter";
    }

    function resize() {
      const size = getStageSize();
      stageW = Math.max(1, Math.floor(size.w));
      stageH = Math.max(1, Math.floor(size.h));

      const dpr = resolveDpr();
      canvas.width = Math.max(1, Math.floor(stageW * dpr));
      canvas.height = Math.max(1, Math.floor(stageH * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }

      cx = (config.originXPercent / 100) * stageW;
      cy = (config.originYPercent / 100) * stageH;
    }

    function scheduleResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!stopped) resize();
      }, 120);
    }

    function hsla(hue, light, alpha) {
      const h = ((hue % 360) + 360) % 360;
      const l = clamp(light, 0, 100);
      const a = clamp(alpha, 0, 1);
      return `hsla(${h},${config.saturation}%,${l}%,${a})`;
    }

    class Line {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = 0;
        this.y = 0;
        this.addedX = 0;
        this.addedY = 0;
        this.rad = 0;
        this.time = 0;
        this.targetTime = 0;
        this.cumulativeTime = 0;
        this.lightInputMultiplier = 0.01 + 0.02 * Math.random();
        this.beginPhase();
      }

      beginPhase() {
        this.x += this.addedX;
        this.y += this.addedY;
        this.time = 0;
        this.targetTime = Math.max(1, (config.baseTime + config.addedTime * Math.random()) | 0);

        this.rad += baseRad * (Math.random() < 0.5 ? 1 : -1);
        this.addedX = Math.cos(this.rad);
        this.addedY = Math.sin(this.rad);

        const screenX = cx + this.x * config.len;
        const screenY = cy + this.y * config.len;
        if (
          Math.random() < config.dieChance ||
          screenX < -stageW * 0.2 ||
          screenX > stageW * 1.2 ||
          screenY < -stageH * 0.2 ||
          screenY > stageH * 1.2
        ) {
          this.reset();
        }
      }

      step(alpha) {
        this.time += 1;
        this.cumulativeTime += 1;

        if (this.time >= this.targetTime) {
          this.beginPhase();
        }

        const prop = this.time / this.targetTime;
        const wave = Math.sin((prop * Math.PI) / 2);
        const offX = this.addedX * wave;
        const offY = this.addedY * wave;

        const px = cx + (this.x + offX) * config.len;
        const py = cy + (this.y + offY) * config.len;

        const hue = config.hueStart + tick * config.hueChange;
        const light =
          config.baseLight +
          config.addedLight * Math.sin(this.cumulativeTime * this.lightInputMultiplier);

        ctx2d.save();
        ctx2d.globalAlpha = alpha;
        ctx2d.shadowBlur = prop * config.shadowToTimePropMult;
        ctx2d.fillStyle = ctx2d.shadowColor = hsla(hue, light, 1);
        ctx2d.fillRect(
          px - config.pixelSize / 2,
          py - config.pixelSize / 2,
          config.pixelSize,
          config.pixelSize
        );

        if (Math.random() < config.sparkChance) {
          const jitterX = (Math.random() < 0.5 ? -1 : 1) * Math.random() * config.sparkDist;
          const jitterY = (Math.random() < 0.5 ? -1 : 1) * Math.random() * config.sparkDist;
          ctx2d.fillRect(
            px + jitterX - config.sparkSize / 2,
            py + jitterY - config.sparkSize / 2,
            config.sparkSize,
            config.sparkSize
          );
        }
        ctx2d.restore();
      }
    }

    const startAt =
      typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    const fadeOutAt = startAt + durationMs * 0.85;
    const stopAt = startAt + durationMs;

    function render(timestamp) {
      if (stopped) return;
      const now = typeof timestamp === "number" ? timestamp : Date.now();

      const fadeAlpha =
        now <= fadeOutAt ? 1 : clamp(1 - (now - fadeOutAt) / Math.max(1, stopAt - fadeOutAt), 0, 1);

      if (now >= stopAt) {
        cleanup();
        return;
      }

      tick += 1;

      ctx2d.save();
      ctx2d.globalCompositeOperation = "destination-out";
      ctx2d.fillStyle = `rgba(0,0,0,${config.repaintAlpha})`;
      ctx2d.fillRect(0, 0, stageW, stageH);
      ctx2d.restore();

      ctx2d.globalCompositeOperation = resolveCompositeOperation();

      const shouldSpawn = now < fadeOutAt;
      if (shouldSpawn && lines.length < config.count && Math.random() < config.spawnChance) {
        lines.push(new Line());
      }

      for (let i = 0; i < lines.length; i++) {
        lines[i].step(fadeAlpha);
      }

      rafId = requestAnimationFrame(render);
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;
      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      try {
        if (resizeTimer) clearTimeout(resizeTimer);
      } catch {
        // ignore
      }
      try {
        window.removeEventListener("resize", scheduleResize);
      } catch {
        // ignore
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);

    resize();
    window.addEventListener("resize", scheduleResize, { passive: true });
    rafId = requestAnimationFrame(render);
  }

  const CRACKED_GLASS_STYLE_ID = "tdv-cracked-glass-style";
  const CRACKED_GLASS_CSS = `
		    #tdv-effects-root .tdv-cracked-glass{position:absolute;inset:0;pointer-events:none;}
		    #tdv-effects-root .tdv-cracked-glass canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}
		    #tdv-effects-root .tdv-cracked-glass .tdv-cracked-glass-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;}
	    #tdv-effects-root .tdv-cracked-glass .tdv-cracked-glass-flash.tdv-active{animation:tdv-cracked-glass-flash 0.3s ease-out;}
	    #tdv-effects-root .tdv-cracked-glass.tdv-cracked-glass-shake{animation:tdv-cracked-glass-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;}
	    #tdv-effects-root .tdv-cracked-glass .tdv-cracked-glass-impact{position:absolute;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);pointer-events:none;animation:tdv-cracked-glass-impact 1s ease-out forwards;}
	    @keyframes tdv-cracked-glass-shake{
	      0%,100%{transform:translate(0,0) rotate(0deg);}
	      10%,30%,50%,70%,90%{transform:translate(-10px,0) rotate(-1deg);}
	      20%,40%,60%,80%{transform:translate(10px,0) rotate(1deg);}
	    }
	    @keyframes tdv-cracked-glass-flash{
	      0%{opacity:var(--flash-opacity,0.7);}
	      100%{opacity:0;}
	    }
	    @keyframes tdv-cracked-glass-impact{
	      0%{transform:scale(0);opacity:1;}
	      100%{transform:scale(3);opacity:0;}
    }
  `;

  function ensureCrackedGlassStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet(
        "css/effects/cracked-glass.css",
        CRACKED_GLASS_STYLE_ID,
        CRACKED_GLASS_CSS
      );
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(CRACKED_GLASS_CSS, CRACKED_GLASS_STYLE_ID);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  function effectCrackedGlass(ctx, cfg) {
    const { cssLayer, scaleDuration, clamp, rand, getStageSize } = ctx;
    if (!cssLayer) return;
    ensureCrackedGlassStylesInjected();

    const durationMs = scaleDuration(cfg.durationMs || 5200, 800);
    const prefersReducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.config)
        : false;
    const opacityRaw = Number(cfg.opacity);
    const opacity = clamp(Number.isFinite(opacityRaw) ? opacityRaw : 1, 0.05, 1);

    const countMode = cfg.countMode === "fixed" ? "fixed" : "random";
    const fixedCountRaw = Number(cfg.count);
    const fixedCount = clamp(Number.isFinite(fixedCountRaw) ? Math.round(fixedCountRaw) : 5, 1, 12);

    const randomMinRaw = Number(cfg.randomMinCount);
    const randomMaxRaw = Number(cfg.randomMaxCount);
    let randomMinCount = clamp(Number.isFinite(randomMinRaw) ? Math.round(randomMinRaw) : 3, 1, 12);
    let randomMaxCount = clamp(Number.isFinite(randomMaxRaw) ? Math.round(randomMaxRaw) : 7, 1, 12);
    if (randomMaxCount < randomMinCount) {
      const tmp = randomMinCount;
      randomMinCount = randomMaxCount;
      randomMaxCount = tmp;
    }

    const distribution = cfg.distribution === "cluster" ? "cluster" : "screen";
    const clusterRadiusPercentRaw = Number(cfg.clusterRadiusPercent);
    const clusterRadiusPercent = clamp(
      Number.isFinite(clusterRadiusPercentRaw) ? clusterRadiusPercentRaw : 35,
      2,
      100
    );

    let originMode = "random";
    if (cfg.origin === "center") {
      originMode = "center";
    } else if (cfg.origin === "custom") {
      originMode = "custom";
    }
    const originXPercentRaw = Number(cfg.originXPercent);
    const originYPercentRaw = Number(cfg.originYPercent);
    const originXPercent = clamp(
      Number.isFinite(originXPercentRaw) ? originXPercentRaw : 50,
      0,
      100
    );
    const originYPercent = clamp(
      Number.isFinite(originYPercentRaw) ? originYPercentRaw : 50,
      0,
      100
    );

    const minIntensityRaw = Number(cfg.minIntensity);
    const maxIntensityRaw = Number(cfg.maxIntensity);
    const minIntensity = clamp(Number.isFinite(minIntensityRaw) ? minIntensityRaw : 0.5, 0.1, 2);
    const maxIntensity = clamp(Number.isFinite(maxIntensityRaw) ? maxIntensityRaw : 1.5, 0.1, 2);

    const delayStepMsRaw = Number(cfg.delayStepMs);
    const delayStepMs = clamp(
      Number.isFinite(delayStepMsRaw) ? Math.round(delayStepMsRaw) : 150,
      0,
      2000
    );

    const flashMode = cfg.flashMode === "strobe" ? "strobe" : "single";
    const flashOpacityRaw = Number(cfg.flashOpacity);
    const flashOpacity = clamp(Number.isFinite(flashOpacityRaw) ? flashOpacityRaw : 0.7, 0.05, 1);
    const strobePulsesRaw = Number(cfg.strobePulses);
    const strobePulses = clamp(
      Number.isFinite(strobePulsesRaw) ? Math.round(strobePulsesRaw) : 3,
      1,
      12
    );
    const strobeIntervalRaw = Number(cfg.strobeIntervalMs);
    const strobeIntervalMs = clamp(
      Number.isFinite(strobeIntervalRaw) ? Math.round(strobeIntervalRaw) : 160,
      60,
      600
    );

    const shakeEnabled = cfg.shakeEnabled !== false && cfg.shakeEnabled !== "false";
    const impactEnabled = cfg.impactEnabled !== false && cfg.impactEnabled !== "false";

    const lineWidthBaseRaw = Number(cfg.lineWidthBase);
    const lineWidthJitterRaw = Number(cfg.lineWidthJitter);
    const lineWidthBase = clamp(Number.isFinite(lineWidthBaseRaw) ? lineWidthBaseRaw : 2, 0.5, 6);
    const lineWidthJitter = clamp(
      Number.isFinite(lineWidthJitterRaw) ? lineWidthJitterRaw : 1,
      0,
      6
    );
    const jaggednessRaw = Number(cfg.jaggednessPx);
    const jaggednessPx = clamp(Number.isFinite(jaggednessRaw) ? jaggednessRaw : 8, 0, 30);

    const branchDepthRaw = Number(cfg.branchDepth);
    const branchDepth = clamp(
      Number.isFinite(branchDepthRaw) ? Math.round(branchDepthRaw) : 2,
      0,
      4
    );
    const shardProbabilityRaw = Number(cfg.shardProbability);
    const shardProbability = clamp(
      Number.isFinite(shardProbabilityRaw) ? shardProbabilityRaw : 0.3,
      0,
      1
    );

    const colorMode = cfg.colorMode === "tint" ? "tint" : "white";
    const hueRaw = Number(cfg.hue);
    const hue = clamp(Number.isFinite(hueRaw) ? hueRaw : 190, 0, 360);
    const hueVarianceRaw = Number(cfg.hueVariance);
    const hueVariance = clamp(Number.isFinite(hueVarianceRaw) ? hueVarianceRaw : 0, 0, 180);
    const saturationRaw = Number(cfg.saturation);
    const saturation = clamp(Number.isFinite(saturationRaw) ? saturationRaw : 70, 0, 100);
    const lightnessRaw = Number(cfg.lightness);
    const lightness = clamp(Number.isFinite(lightnessRaw) ? lightnessRaw : 80, 0, 100);

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-cracked-glass";
    container.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    const flash = document.createElement("div");
    flash.className = "tdv-cracked-glass-flash";
    container.appendChild(canvas);
    container.appendChild(flash);

    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return;

    cssLayer.appendChild(container);

    let stopped = false;
    let stageW = 0;
    let stageH = 0;
    let dpr = 1;
    let rafId = null;
    let timeoutId = null;
    let resizeTimer = null;
    const cracks = [];
    const cleanupTimers = new Set();

    function trackTimeout(fn, delayMs) {
      const id = setTimeout(() => {
        cleanupTimers.delete(id);
        fn();
      }, delayMs);
      cleanupTimers.add(id);
      return id;
    }

    function pickHue() {
      if (colorMode !== "tint") return null;
      if (hueVariance <= 0) return hue;
      return hue + rand(-hueVariance, hueVariance);
    }

    function color(alpha, crackHue) {
      const a = clamp(alpha * opacity, 0, 1);
      if (colorMode === "tint" && crackHue !== null && typeof crackHue !== "undefined") {
        return `hsla(${crackHue},${saturation}%,${lightness}%,${a})`;
      }
      return `rgba(255,255,255,${a})`;
    }

    function getDpr() {
      return dom && typeof dom.getEffectiveDevicePixelRatio === "function"
        ? dom.getEffectiveDevicePixelRatio(ctx.config)
        : 1;
    }

    function resizeCanvas() {
      const size = getStageSize();
      stageW = Math.max(1, Math.floor(size.w));
      stageH = Math.max(1, Math.floor(size.h));
      dpr = Math.max(1, Number(getDpr()) || 1);

      canvas.width = Math.max(1, Math.floor(stageW * dpr));
      canvas.height = Math.max(1, Math.floor(stageH * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }
    }

    class Crack {
      constructor(x, y, intensity, crackHue) {
        this.x = x;
        this.y = y;
        this.intensity = intensity || 1;
        this.hue = crackHue;
        this.rays = [];
        this.progress = 0;
        this.maxProgress = 1;
        this.generateRays();
      }

      generateRays() {
        const numRays = 8 + Math.floor(Math.random() * 12) * this.intensity;
        const angleStep = (Math.PI * 2) / numRays;

        for (let i = 0; i < numRays; i++) {
          const baseAngle = angleStep * i + (Math.random() - 0.5) * 0.5;
          const length = (50 + Math.random() * 150) * this.intensity;

          this.rays.push({
            angle: baseAngle,
            length: length,
            branches: this.generateBranches(baseAngle, length, branchDepth),
          });
        }
      }

      generateBranches(parentAngle, parentLength, depth) {
        if (depth === 0 || Math.random() > 0.7) return [];

        const branches = [];
        const numBranches = Math.floor(Math.random() * 3);

        for (let i = 0; i < numBranches; i++) {
          const branchAngle = parentAngle + ((Math.random() - 0.5) * Math.PI) / 2;
          const branchLength = parentLength * (0.3 + Math.random() * 0.4);
          const branchPoint = 0.3 + Math.random() * 0.5;

          branches.push({
            angle: branchAngle,
            length: branchLength,
            point: branchPoint,
            branches: this.generateBranches(branchAngle, branchLength, depth - 1),
          });
        }

        return branches;
      }

      update(delta) {
        if (this.progress < this.maxProgress) {
          this.progress += delta * 2;
          return true;
        }
        return false;
      }

      draw() {
        ctx2d.save();
        ctx2d.translate(this.x, this.y);

        ctx2d.beginPath();
        ctx2d.arc(0, 0, 4 * this.progress, 0, Math.PI * 2);
        ctx2d.fillStyle = color(0.6 * (1 - this.progress * 0.5), this.hue);
        ctx2d.fill();

        this.rays.forEach((ray) => {
          this.drawRay(0, 0, ray, this.progress);
        });

        ctx2d.restore();
      }

      drawRay(startX, startY, ray, progress) {
        const currentLength = ray.length * Math.min(progress, 1);
        const endX = startX + Math.cos(ray.angle) * currentLength;
        const endY = startY + Math.sin(ray.angle) * currentLength;

        const gradient = ctx2d.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, color(0.8, this.hue));
        gradient.addColorStop(0.5, color(0.5, this.hue));
        gradient.addColorStop(1, color(0.2, this.hue));

        ctx2d.strokeStyle = gradient;
        ctx2d.lineWidth = lineWidthBase + Math.random() * lineWidthJitter;
        ctx2d.lineCap = "round";

        ctx2d.beginPath();
        ctx2d.moveTo(startX, startY);

        const segments = 8;
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const segX = startX + (endX - startX) * t;
          const segY = startY + (endY - startY) * t;
          const offset = (Math.random() - 0.5) * jaggednessPx;
          const denom = ray.length || 1;
          const perpX = -(endY - startY) / denom;
          const perpY = (endX - startX) / denom;

          ctx2d.lineTo(segX + perpX * offset, segY + perpY * offset);
        }

        ctx2d.stroke();

        ctx2d.strokeStyle = color(0.3, this.hue);
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(startX, startY);
        ctx2d.lineTo(endX, endY);
        ctx2d.stroke();

        if (progress > 0.5 && Math.random() < shardProbability) {
          const shardX = startX + (endX - startX) * Math.random();
          const shardY = startY + (endY - startY) * Math.random();
          const shardSize = 3 + Math.random() * 5;

          ctx2d.fillStyle = color(0.2 + Math.random() * 0.3, this.hue);
          ctx2d.beginPath();
          ctx2d.moveTo(shardX, shardY);
          ctx2d.lineTo(shardX + shardSize, shardY + shardSize * 0.5);
          ctx2d.lineTo(shardX + shardSize * 0.5, shardY + shardSize);
          ctx2d.closePath();
          ctx2d.fill();
        }

        if (ray.branches && progress > 0.3) {
          ray.branches.forEach((branch) => {
            const branchStartX = startX + (endX - startX) * branch.point;
            const branchStartY = startY + (endY - startY) * branch.point;
            const branchProgress = Math.max(0, (progress - 0.3) * 1.5);

            if (branchProgress > 0) {
              this.drawRay(branchStartX, branchStartY, branch, branchProgress);
            }
          });
        }
      }
    }

    function clearCanvas() {
      ctx2d.clearRect(0, 0, stageW, stageH);
    }

    function redrawAllCracks() {
      clearCanvas();
      cracks.forEach((crack) => crack.draw());
    }

    function tick() {
      if (stopped) return;

      let needsRedraw = false;
      cracks.forEach((crack) => {
        if (crack.update(0.016)) needsRedraw = true;
      });

      if (needsRedraw) {
        redrawAllCracks();
        rafId = requestAnimationFrame(tick);
        return;
      }

      rafId = null;
    }

    function triggerFlashOnce() {
      if (!flash) return;
      flash.style.setProperty("--flash-opacity", String(flashOpacity));
      flash.classList.remove("tdv-active");
      void flash.offsetWidth;
      flash.classList.add("tdv-active");
      trackTimeout(() => {
        flash.classList.remove("tdv-active");
      }, 320);
    }

    function triggerShake() {
      if (!shakeEnabled || prefersReducedMotion) return;
      container.classList.remove("tdv-cracked-glass-shake");
      void container.offsetWidth;
      container.classList.add("tdv-cracked-glass-shake");
      trackTimeout(() => {
        container.classList.remove("tdv-cracked-glass-shake");
      }, 520);
    }

    function createImpactMarker(x, y, crackHue) {
      if (!impactEnabled) return;
      const impact = document.createElement("div");
      impact.className = "tdv-cracked-glass-impact";
      impact.style.left = `${x - 10}px`;
      impact.style.top = `${y - 10}px`;
      impact.style.background = `radial-gradient(circle, ${color(0.8, crackHue)} 0%, transparent 70%)`;
      container.appendChild(impact);
      trackTimeout(() => {
        if (impact.parentNode) impact.parentNode.removeChild(impact);
      }, 1100);
    }

    function triggerFlashSequence() {
      if (flashMode === "strobe") {
        const pulses = prefersReducedMotion ? Math.min(strobePulses, 3) : strobePulses;
        for (let i = 0; i < pulses; i++) {
          trackTimeout(() => {
            if (stopped) return;
            triggerFlashOnce();
          }, i * strobeIntervalMs);
        }
        return;
      }
      triggerFlashOnce();
    }

    function createCrack(x, y, intensity) {
      const ix = clamp(Number(intensity) || 1, 0.2, 2);
      const crackHue = pickHue();
      cracks.push(new Crack(x, y, ix, crackHue));

      createImpactMarker(x, y, crackHue);
      triggerShake();
      triggerFlashSequence();

      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function schedule(fn, delayMs) {
      return trackTimeout(fn, delayMs);
    }

    function randomSmash() {
      let numCracks =
        countMode === "fixed" ? fixedCount : Math.round(rand(randomMinCount, randomMaxCount));
      if (prefersReducedMotion) numCracks = Math.min(numCracks, 3);

      let baseX = stageW / 2;
      let baseY = stageH / 2;
      if (originMode === "random") {
        baseX = rand(0, stageW);
        baseY = rand(0, stageH);
      } else if (originMode === "custom") {
        baseX = (originXPercent / 100) * stageW;
        baseY = (originYPercent / 100) * stageH;
      }

      const minDim = Math.max(1, Math.min(stageW, stageH));
      const clusterRadiusPx = (minDim * clusterRadiusPercent) / 100 / 2;

      for (let i = 0; i < numCracks; i++) {
        schedule(() => {
          if (stopped) return;
          let x = rand(0, stageW);
          let y = rand(0, stageH);
          if (distribution === "cluster") {
            x = clamp(baseX + rand(-clusterRadiusPx, clusterRadiusPx), 0, stageW);
            y = clamp(baseY + rand(-clusterRadiusPx, clusterRadiusPx), 0, stageH);
          }

          const lo = Math.min(minIntensity, maxIntensity);
          const hi = Math.max(minIntensity, maxIntensity);
          const intensity = lo + Math.random() * (hi - lo);
          createCrack(x, y, intensity);
        }, i * delayStepMs);
      }
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      try {
        if (resizeTimer) clearTimeout(resizeTimer);
      } catch {
        // ignore
      }
      try {
        cleanupTimers.forEach((id) => clearTimeout(id));
        cleanupTimers.clear();
      } catch {
        // ignore
      }
      try {
        window.removeEventListener("resize", onResize);
      } catch {
        // ignore
      }

      if (container.parentNode) container.parentNode.removeChild(container);
    }

    function onResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (stopped) return;
        resizeCanvas();
        redrawAllCracks();
      }, 120);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);
    window.addEventListener("resize", onResize, { passive: true });

    resizeCanvas();
    randomSmash();
  }

  const HEART_PARTICLES_THEMES = {
    red: {
      fill: "#ff1744",
      stroke: "#c51162",
      gradient: ["#ff1744", "#f50057", "#c51162"],
    },
    pink: {
      fill: "#e91e63",
      stroke: "#c2185b",
      gradient: ["#e91e63", "#ec407a", "#f06292"],
    },
    purple: {
      fill: "#9c27b0",
      stroke: "#7b1fa2",
      gradient: ["#9c27b0", "#ba68c8", "#ce93d8"],
    },
    lightpink: {
      fill: "#ff6090",
      stroke: "#ff4081",
      gradient: ["#ff6090", "#ff8fab", "#ffb3c6"],
    },
  };

  function darkenColor(colorHex) {
    const hex = colorHex.replace("#", "");
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  function drawHeart(ctx2d, particle) {
    ctx2d.save();
    ctx2d.globalAlpha = particle.alpha;
    ctx2d.fillStyle = particle.color;
    ctx2d.beginPath();

    const topCurveHeight = particle.size * 0.3;
    ctx2d.moveTo(particle.x, particle.y + topCurveHeight);

    ctx2d.bezierCurveTo(
      particle.x,
      particle.y,
      particle.x - particle.size / 2,
      particle.y,
      particle.x - particle.size / 2,
      particle.y + topCurveHeight
    );

    ctx2d.bezierCurveTo(
      particle.x - particle.size / 2,
      particle.y + (particle.size + topCurveHeight) / 2,
      particle.x,
      particle.y + (particle.size + topCurveHeight) / 2,
      particle.x,
      particle.y + particle.size
    );

    ctx2d.bezierCurveTo(
      particle.x,
      particle.y + (particle.size + topCurveHeight) / 2,
      particle.x + particle.size / 2,
      particle.y + (particle.size + topCurveHeight) / 2,
      particle.x + particle.size / 2,
      particle.y + topCurveHeight
    );

    ctx2d.bezierCurveTo(
      particle.x + particle.size / 2,
      particle.y,
      particle.x,
      particle.y,
      particle.x,
      particle.y + topCurveHeight
    );

    ctx2d.closePath();
    ctx2d.fillStyle = particle.color;
    ctx2d.strokeStyle = particle.strokeColor;
    ctx2d.lineWidth = 2;
    ctx2d.stroke();
    ctx2d.fill();
    ctx2d.restore();
  }

  // eslint-disable-next-line max-lines-per-function
  function effectHeartParticles(ctx, cfg) {
    const { cssLayer } = ctx;
    const { scaleDuration } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(cfg.durationMs || 4000, 1200);
    const density = Math.max(1, Math.floor(cfg.density || 50));
    const blastSize = Math.max(5, cfg.blastSize || 30);
    const minSize = Math.max(2, cfg.minSize || 10);
    const gravity = typeof cfg.gravity !== "undefined" ? cfg.gravity : 0.1;
    const speed = Math.max(0.1, cfg.speed || 4);
    const shrinkRate = Math.max(0.01, cfg.shrinkRate || 0.2);
    const reverse = cfg.reverse === true;
    const fadeRate = Math.max(0.001, cfg.fadeRate || 0.01);
    const themeName = cfg.theme || "red";
    const explosionCount = Math.max(1, Math.floor(cfg.explosionCount || 1));
    const spreadType = cfg.spreadType || "single";

    const theme = HEART_PARTICLES_THEMES[themeName] || HEART_PARTICLES_THEMES.red;

    const container = document.createElement("div");
    container.className = "tdv-heart-particles";
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    cssLayer.appendChild(container);

    let stopped = false;
    let stageW = 0;
    let stageH = 0;
    let dpr = 1;
    let rafId = null;
    let timeoutId = null;
    let lastTime = performance.now();

    const particles = [];

    function getDpr() {
      return dom && typeof dom.getEffectiveDevicePixelRatio === "function"
        ? dom.getEffectiveDevicePixelRatio(ctx.config)
        : 1;
    }

    function resizeCanvas() {
      const size = getStageSize(ctx.canvasManager);
      stageW = Math.max(1, Math.floor(size.w));
      stageH = Math.max(1, Math.floor(size.h));
      dpr = Math.max(1, Number(getDpr()) || 1);

      canvas.width = Math.max(1, Math.floor(stageW * dpr));
      canvas.height = Math.max(1, Math.floor(stageH * dpr));
      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }
    }

    function createParticle(x, y, size, speedX, speedY, colorHex) {
      return {
        x,
        y,
        size,
        speedX,
        speedY,
        color: colorHex,
        strokeColor: darkenColor(colorHex),
        alpha: 1,
      };
    }

    function createExplosion(x, y) {
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const particleSpeed = Math.random() * speed + 1;
        const speedX = Math.cos(angle) * particleSpeed;
        const speedY = Math.sin(angle) * particleSpeed;
        const size = Math.random() * blastSize + minSize;

        const colorIndex = Math.floor(Math.random() * theme.gradient.length);
        const colorHex = theme.gradient[colorIndex];

        particles.push(createParticle(x, y, size, speedX, speedY, colorHex));
      }
    }

    function updateParticles(delta) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX * delta;
        p.y += p.speedY * delta;

        if (reverse) {
          p.size += shrinkRate * delta;
          p.speedY -= gravity * delta;
          p.alpha -= fadeRate * delta;

          if (p.alpha <= 0 || p.y < -100) {
            particles.splice(i, 1);
            i--;
          }
        } else {
          p.size -= shrinkRate * delta;
          p.speedY += gravity * delta;

          if (p.size <= 0 || p.y > stageH + 100) {
            particles.splice(i, 1);
            i--;
          }
        }
      }
    }

    function render() {
      if (stopped) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      ctx2d.clearRect(0, 0, stageW, stageH);
      updateParticles(delta);
      particles.forEach((p) => drawHeart(ctx2d, p));

      rafId = requestAnimationFrame(render);
    }

    function initExplosions() {
      if (spreadType === "single") {
        const x = stageW / 2;
        const y = stageH / 2;
        for (let i = 0; i < explosionCount; i++) {
          createExplosion(x, y);
        }
      } else if (spreadType === "random") {
        for (let i = 0; i < explosionCount; i++) {
          createExplosion(rand(0, stageW), rand(0, stageH));
        }
      } else if (spreadType === "grid") {
        const cols = Math.ceil(Math.sqrt(explosionCount));
        const rows = Math.ceil(explosionCount / cols);
        const dx = stageW / (cols + 1);
        const dy = stageH / (rows + 1);
        let count = 0;
        for (let r = 0; r < rows && count < explosionCount; r++) {
          for (let c = 0; c < cols && count < explosionCount; c++) {
            createExplosion((c + 1) * dx, (r + 1) * dy);
            count++;
          }
        }
      }
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;

      try {
        if (rafId) cancelAnimationFrame(rafId);
      } catch {
        // ignore
      }
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }

      if (container.parentNode) container.parentNode.removeChild(container);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);

    resizeCanvas();
    initExplosions();
    render();
  }

  const AURA_PRESETS = {
    cold: { color: "#5ef3da", intensity: 0.28 },
    warm: { color: "#fb923c", intensity: 0.3 },
    hot: { color: "#f43f5e", intensity: 0.35 },
  };

  function effectAura(ctx, cfg) {
    const { cssLayer, scaleDuration } = ctx;
    if (!cssLayer) return;

    const durationMs = scaleDuration(cfg.durationMs || 3000, 600);
    const level = cfg.level || "warm";
    const preset = AURA_PRESETS[level] || AURA_PRESETS.warm;

    const intensity =
      typeof cfg.intensity !== "undefined" ? clamp(cfg.intensity, 0, 1) : preset.intensity;
    const colorHex = cfg.color || preset.color;
    const opacity = typeof cfg.opacity !== "undefined" ? clamp(cfg.opacity, 0, 1) : 1.0;
    const gradientCenter = cfg.gradientCenter || "50% 40%";
    const gradientRadius = cfg.gradientRadius || "70%";
    const blendMode = cfg.blendMode || "normal";

    const auraColor =
      color && typeof color.hexToRgba === "function"
        ? color.hexToRgba(colorHex, intensity)
        : `rgba(255,255,255,${intensity})`;

    const container = document.createElement("div");
    container.className = "tdv-aura-effect";
    container.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      animation: tdv-aura-fade ${durationMs}ms ease-in-out both;
    `;

    const auraDiv = document.createElement("div");
    auraDiv.style.cssText = `
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at ${gradientCenter}, ${auraColor} 0%, rgba(0,0,0,0) ${gradientRadius});
      opacity: ${opacity};
      mix-blend-mode: ${blendMode};
    `;

    container.appendChild(auraDiv);
    cssLayer.appendChild(container);

    const styleId = "tdv-aura-effect-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes tdv-aura-fade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    function cleanup() {
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    container._tdvStop = cleanup;
    setTimeout(cleanup, durationMs + 120);
  }

  function effectEcgHeartbeat(ctx, cfg) {
    const { cssLayer, scaleDuration, clamp } = ctx;
    if (!cssLayer) return;

    const PULSE_TYPES = {
      pulsar: {
        path: "M0,90L250,90Q257,60 262,87T267,95 270,88 273,92t6,35 7,-60T290,127 297,107s2,-11 10,-10 1,1 8,-10T319,95c6,4 8,-6 10,-17s2,10 9,11h210",
        dasharray: 281,
      },
      jugular: {
        path: "M0,90L250,90Q257,60 262,87T267,95 270,88 273,92t6,35 7,-60T290,127 297,107s2,-11 10,-10 1,1 8,-10T319,95c6,4 8,-6 10,-17s2,10 9,11h210",
        dasharray: 497,
      },
      bleed: {
        path: "M0,90L250,90Q257,60 262,87T267,95 270,88 273,92t6,35 7,-60T290,127 297,107s2,-11 10,-10 1,1 8,-10T319,95c6,4 8,-6 10,-17s2,10 9,11h210",
        dasharray: 437,
      },
      flatline: {
        path: "M0,90 L600,90",
        dasharray: 814,
      },
      longbeat: {
        path: "M0,90L150,90M150,90Q158,60 162,87T167,95 170,88 173,92t6,35 7,-60T190,127 197,107s2,-11 10,-10 1,1 8,-10T219,95c6,4 8,-6 10,-17s2,10 9,11h110",
        dasharray: 378,
      },
    };

    const durationMs = scaleDuration((cfg && cfg.durationMs) || 5000, 800);
    const pulseKey =
      cfg && typeof cfg.pulseType === "string" && PULSE_TYPES[cfg.pulseType]
        ? cfg.pulseType
        : "pulsar";
    const pulseDef = PULSE_TYPES[pulseKey] || PULSE_TYPES.pulsar;

    const cycleSecRaw = cfg && typeof cfg.cycleSec !== "undefined" ? Number(cfg.cycleSec) : 2.5;
    const cycleSec = Number.isFinite(cycleSecRaw) ? clamp(cycleSecRaw, 0.25, 12) : 2.5;
    const cycleMs = Math.round(cycleSec * 1000);

    const strokeWidthRaw =
      cfg && typeof cfg.strokeWidth !== "undefined" ? Number(cfg.strokeWidth) : 2;
    const strokeWidth = Number.isFinite(strokeWidthRaw) ? clamp(strokeWidthRaw, 1, 12) : 2;

    const opacityRaw = cfg && typeof cfg.opacity !== "undefined" ? Number(cfg.opacity) : 1;
    const opacity = Number.isFinite(opacityRaw) ? clamp(opacityRaw, 0, 1) : 1;

    const yPercentRaw = cfg && typeof cfg.yPercent !== "undefined" ? Number(cfg.yPercent) : 50;
    const yPercent = Number.isFinite(yPercentRaw) ? clamp(yPercentRaw, 0, 100) : 50;

    const scaleRaw = cfg && typeof cfg.scale !== "undefined" ? Number(cfg.scale) : 1;
    const scale = Number.isFinite(scaleRaw) ? clamp(scaleRaw, 0.25, 2) : 1;

    const colorHex = cfg && typeof cfg.colorHex === "string" ? cfg.colorHex : "#00ffaa";

    const easingRaw = cfg && typeof cfg.easing === "string" ? cfg.easing : "linear";
    const easing = easingRaw || "linear";
    const reverse = !!(cfg && cfg.reverse);
    const shadowEnabled = cfg ? cfg.shadow !== false : true;
    const glowEnabled = !!(cfg && cfg.glow);

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-ecg-heartbeat";
    container.setAttribute("aria-hidden", "true");
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";

    const wrap = document.createElement("div");
    wrap.style.cssText =
      "position:absolute;left:0;right:0;display:flex;justify-content:center;pointer-events:none;";
    wrap.style.top = `${yPercent}%`;
    wrap.style.transform = `translateY(-50%) scale(${scale})`;
    wrap.style.opacity = String(opacity);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 600 180");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "92vw";
    svg.style.maxWidth = "900px";
    svg.style.height = "auto";
    svg.style.display = "block";

    const keyframeName = `tdv-ecg-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ${keyframeName} {
        from { stroke-dashoffset: ${pulseDef.dasharray}; }
        to { stroke-dashoffset: ${-pulseDef.dasharray}; }
      }
    `;

    if (glowEnabled) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filter.setAttribute("id", "tdv-ecg-glow");
      filter.setAttribute("x", "-50%");
      filter.setAttribute("y", "-50%");
      filter.setAttribute("width", "200%");
      filter.setAttribute("height", "200%");

      const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      blur.setAttribute("stdDeviation", "3");
      blur.setAttribute("result", "coloredBlur");

      const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
      const mergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      mergeNode1.setAttribute("in", "coloredBlur");
      const mergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      mergeNode2.setAttribute("in", "SourceGraphic");
      merge.appendChild(mergeNode1);
      merge.appendChild(mergeNode2);

      filter.appendChild(blur);
      filter.appendChild(merge);
      defs.appendChild(filter);
      svg.appendChild(defs);
    }

    if (shadowEnabled) {
      const shadowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      shadowPath.setAttribute("d", pulseDef.path);
      shadowPath.setAttribute("fill", "none");
      shadowPath.setAttribute("stroke", "rgba(15,0,0,0.3)");
      shadowPath.setAttribute("stroke-width", String(strokeWidth + 1));
      shadowPath.setAttribute("stroke-linecap", "round");
      shadowPath.setAttribute("stroke-linejoin", "round");
      svg.appendChild(shadowPath);
    }

    const mainPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    mainPath.setAttribute("d", pulseDef.path);
    mainPath.setAttribute("fill", "none");
    mainPath.setAttribute("stroke", colorHex);
    mainPath.setAttribute("stroke-width", String(strokeWidth));
    mainPath.setAttribute("stroke-linecap", "round");
    mainPath.setAttribute("stroke-linejoin", "round");
    mainPath.setAttribute("stroke-dasharray", String(pulseDef.dasharray));

    if (glowEnabled) {
      mainPath.setAttribute("filter", "url(#tdv-ecg-glow)");
    }

    mainPath.style.animation = `${keyframeName} ${cycleMs}ms infinite ${easing} ${
      reverse ? "reverse" : "normal"
    }`;

    svg.appendChild(mainPath);
    wrap.appendChild(svg);
    container.appendChild(style);
    container.appendChild(wrap);
    cssLayer.appendChild(container);

    let stopped = false;
    let timeoutId = null;

    function cleanup() {
      if (stopped) return;
      stopped = true;
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);
  }

  const SPIDER_WEB_STYLE_ID = "tdv-spider-web-style";
  const SPIDER_WEB_CSS = `
    #tdv-effects-root .tdv-spider-web{position:absolute;inset:0;pointer-events:none;opacity:0;animation:tdv-spider-web-inout var(--duration, 4500ms) ease-in-out both;}
    #tdv-effects-root .tdv-spider-web canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}
    @keyframes tdv-spider-web-inout{
      0%{opacity:0;}
      4%{opacity:var(--opacity,0.85);}
      92%{opacity:var(--opacity,0.85);}
      100%{opacity:0;}
    }
  `;

  function ensureSpiderWebStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet("css/effects/spider-web.css", SPIDER_WEB_STYLE_ID, SPIDER_WEB_CSS);
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(SPIDER_WEB_CSS, SPIDER_WEB_STYLE_ID);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  function effectSpiderWeb(ctx, cfg) {
    const { cssLayer, scaleDuration, clamp, rand, getStageSize } = ctx;
    if (!cssLayer) return;
    ensureSpiderWebStylesInjected();

    const durationMs = scaleDuration(cfg.durationMs || 4500, 800);
    const opacity = clamp(Number(cfg.opacity) || 0.85, 0.05, 1);
    const intensity = clamp(Number(cfg.intensity) || 1, 0.5, 2);
    const placement = cfg.placement === "center" ? "center" : "random";
    const paddingPercent = clamp(Number(cfg.paddingPercent) || 10, 0, 30);

    const prefersReducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.config)
        : false;
    const qualityBase = clamp(Number(cfg.quality) || 0.75, 0.2, 1);
    const quality = prefersReducedMotion ? Math.min(qualityBase, 0.55) : qualityBase;

    const maxCountRaw = Number(cfg.count);
    const maxCount = clamp(Number.isFinite(maxCountRaw) ? maxCountRaw : 1, 1, 8);
    const webCount = prefersReducedMotion ? Math.min(maxCount, 4) : maxCount;

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-spider-web";
    container.setAttribute("aria-hidden", "true");
    container.style.setProperty("--duration", `${durationMs}ms`);
    container.style.setProperty("--opacity", String(opacity));

    const canvasReflect = document.createElement("canvas");
    const canvasFractures = document.createElement("canvas");
    const canvasMain = document.createElement("canvas");
    const canvasNoise = document.createElement("canvas");

    container.appendChild(canvasReflect);
    container.appendChild(canvasFractures);
    container.appendChild(canvasMain);
    container.appendChild(canvasNoise);

    const ctxReflect = canvasReflect.getContext("2d", { alpha: true });
    const ctxFractures = canvasFractures.getContext("2d", { alpha: true });
    const ctxMain = canvasMain.getContext("2d", { alpha: true });
    const ctxNoise = canvasNoise.getContext("2d", { alpha: true });

    if (!ctxReflect || !ctxFractures || !ctxMain || !ctxNoise) return;

    cssLayer.appendChild(container);

    let stopped = false;
    let timeoutId = null;
    let resizeTimer = null;
    let stageW = 0;
    let stageH = 0;
    let dpr = 1;

    const centersNorm = [];
    const RAD = Math.PI / 180;

    function getDpr() {
      return dom && typeof dom.getEffectiveDevicePixelRatio === "function"
        ? dom.getEffectiveDevicePixelRatio(ctx.config)
        : 1;
    }

    function resizeCanvases() {
      const size = getStageSize();
      stageW = Math.max(1, Math.floor(size.w));
      stageH = Math.max(1, Math.floor(size.h));
      dpr = Math.max(1, Number(getDpr()) || 1);

      const canvases = [canvasReflect, canvasFractures, canvasMain, canvasNoise];
      canvases.forEach((canvas) => {
        canvas.width = Math.max(1, Math.floor(stageW * dpr));
        canvas.height = Math.max(1, Math.floor(stageH * dpr));
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      });

      const contexts = [ctxReflect, ctxFractures, ctxMain, ctxNoise];
      contexts.forEach((c) => {
        try {
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
        } catch {
          // ignore
        }
      });
    }

    function clearAll() {
      [ctxReflect, ctxFractures, ctxMain, ctxNoise].forEach((c) =>
        c.clearRect(0, 0, stageW, stageH)
      );
    }

    function findPointOnCircle(center, radius, angleDeg) {
      const a = angleDeg * RAD;
      return { x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) };
    }

    function describeLinePath(p1, p2) {
      const desc = {};
      desc.dx = p2.x - p1.x;
      desc.dy = p2.y - p1.y;
      desc.dl = Math.sqrt(desc.dx * desc.dx + desc.dy * desc.dy) || 1;

      desc.sx = desc.dx / desc.dl;
      desc.sy = desc.dy / desc.dl;
      desc.tx = desc.dy / desc.dl;
      desc.ty = -desc.dx / desc.dl;

      desc.mpp = Math.random() * 0.5 + 0.3;
      desc.mpl1 = desc.dl * desc.mpp;
      desc.mpl2 = desc.dl - desc.mpl1;

      const ll = Math.log(desc.dl * Math.E);
      const cv = 5 * 0.3;
      desc.cma = Math.random() * ll * cv - (ll * cv) / 2;
      desc.cpt = {
        x: p1.x + desc.sx * desc.mpl1 + desc.tx * desc.cma,
        y: p1.y + desc.sy * desc.mpl1 + desc.ty * desc.cma,
      };

      desc.bbx1 = Math.min(p1.x, p2.x, desc.cpt.x);
      desc.bby1 = Math.min(p1.y, p2.y, desc.cpt.y);
      desc.bbx2 = Math.max(p1.x, p2.x, desc.cpt.x);
      desc.bby2 = Math.max(p1.y, p2.y, desc.cpt.y);
      desc.bbwidth = desc.bbx2 - desc.bbx1;
      desc.bbheight = desc.bby2 - desc.bby1;
      return desc;
    }

    function findWebPaths(center) {
      const lines = [];
      const maxRadius = Math.max(stageW, stageH) * 0.72;
      const maxLevels = Math.round(18 + 12 * quality);
      const num = Math.round(18 + 10 * quality);
      const connectChance = 0.6;
      const diagChance = 0.3;

      const main = [[]];
      let level = 1;
      let radius = 15;
      const ang = 360 / (num + 1);

      for (let i = 0; i < num; i++) {
        const angle = ang * i + 10;
        main[0].push({ angle, point: findPointOnCircle(center, 5, angle) });
      }

      while (radius < maxRadius && level < maxLevels) {
        main[level] = [];
        for (let i = 0; i < num; i++) {
          const prev = main[level - 1][i];
          main[level][i] = null;
          if (!prev) continue;
          const p = prev.point;
          if (p.x <= 0 || p.x >= stageW || p.y <= 0 || p.y >= stageH) continue;

          let newAng = prev.angle + (Math.random() * 10) / num - 5 / num;
          newAng = Math.min(350, newAng);
          const pt2 = findPointOnCircle(
            center,
            radius + (Math.random() * radius) / level - radius / (level * 2),
            newAng
          );
          main[level][i] = { angle: newAng, point: pt2 };
        }
        level += 1;
        radius *= Math.random() * 1.5 + 1;
      }

      for (let l = 1; l < level; l++) {
        for (let g = 0; g < num; g++) {
          const pt1 = main[l - 1][g];
          const pt2 = main[l][g];
          if (!pt1 || !pt2) continue;

          lines.push({
            p1: pt1.point,
            p2: pt2.point,
            desc: describeLinePath(pt1.point, pt2.point),
            depth: l,
          });

          if (Math.random() < connectChance) {
            const nextPt = main[l][(g + 1) % num];
            if (nextPt) {
              lines.push({
                p1: pt2.point,
                p2: nextPt.point,
                desc: describeLinePath(pt2.point, nextPt.point),
                depth: l,
              });
            }
          }

          if (l < level - 1 && Math.random() < diagChance) {
            const diagPt = main[l + 1][(g + 1) % num];
            if (diagPt) {
              lines.push({
                p1: pt2.point,
                p2: diagPt.point,
                desc: describeLinePath(pt2.point, diagPt.point),
                depth: l,
              });
            }
          }
        }
      }

      return lines;
    }

    function renderReflect(line) {
      const { p1, p2, desc } = line;
      const { tx, ty, dl } = desc;
      const dd = dl / 3;
      ctxReflect.globalAlpha = 0.3 * opacity;
      const grd = ctxReflect.createLinearGradient(
        p1.x + dd * tx,
        p1.y + dd * ty,
        p1.x - dd * tx,
        p1.y - dd * ty
      );
      grd.addColorStop(0, "rgba(255,255,255,0)");
      grd.addColorStop(0.5, "rgba(255,255,255,0.5)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      ctxReflect.fillStyle = grd;
      ctxReflect.beginPath();
      ctxReflect.moveTo(p1.x + dd * tx, p1.y + dd * ty);
      ctxReflect.lineTo(p2.x + dd * tx, p2.y + dd * ty);
      ctxReflect.lineTo(p2.x - dd * tx, p2.y - dd * ty);
      ctxReflect.lineTo(p1.x - dd * tx, p1.y - dd * ty);
      ctxReflect.closePath();
      ctxReflect.fill();
    }

    function renderFractures(line) {
      const { p1, desc } = line;
      const { tx, ty, sx, sy, dl, mpp, cma, mpl1, mpl2 } = desc;
      const sz = 33 * intensity;
      const mp = dl / 2;

      ctxFractures.globalAlpha = 0.4 * opacity;
      ctxFractures.lineWidth = 1;

      for (let s = 0; s < dl; s++) {
        let c;
        if (s < mpp * dl) c = cma * (1 - Math.pow((mpl1 - s) / mpl1, 2));
        else c = cma * (1 - Math.pow((mpl2 - (dl - s)) / mpl2, 2));
        c /= 2;

        const p = Math.pow((s > mp ? dl - s : s) / mp, 2);
        const w = Math.random() + 1;
        const h1 = sz - Math.random() * p * sz + 1;
        const h2 = sz - Math.random() * p * sz + 1;
        const t = Math.random() * 20 - 10;

        if (Math.random() > p - sz / mp) {
          ctxFractures.fillStyle = `rgba(255,255,255,${(Math.random() * 8 + 4) / 12})`;
          ctxFractures.beginPath();
          ctxFractures.moveTo(p1.x + s * sx + c * tx, p1.y + s * sy + c * ty);
          ctxFractures.lineTo(
            p1.x + (t + s + w / 2) * sx + h1 * tx + c * tx,
            p1.y + (-t + s + w / 2) * sy + h1 * ty + c * ty
          );
          ctxFractures.lineTo(p1.x + (s + w) * sx + c * tx, p1.y + (s + w) * sy + c * ty);
          ctxFractures.lineTo(
            p1.x + (-t + s + w / 2) * sx - h2 * tx + c * tx,
            p1.y + (t + s + w / 2) * sy - h2 * ty + c * ty
          );
          ctxFractures.closePath();
          ctxFractures.fill();
        }

        s += mp * (p / 2 + 0.5);
      }
    }

    function renderMainLine(line) {
      const { p1, p2, desc } = line;
      const { tx, ty, cpt } = desc;
      ctxMain.globalAlpha = 0.65 * opacity;
      ctxMain.lineWidth = Math.max(0.75, 1 * intensity);
      let st = 14;
      const ns = 3;
      while (st > 0) {
        const tt = Math.random() * ns * 2 - ns;
        ctxMain.strokeStyle = `rgba(255,255,255,${(Math.random() * 8 + 4) / 12})`;
        ctxMain.beginPath();
        ctxMain.moveTo(p1.x + (st + tt) * tx, p1.y + (st - tt) * ty);
        ctxMain.quadraticCurveTo(cpt.x, cpt.y, p2.x + (st - tt) * tx, p2.y + (st + tt) * ty);
        ctxMain.stroke();
        st -= 1;
      }
    }

    function renderNoise(line) {
      const { p1, desc } = line;
      const { tx, ty, sx, sy, dl, mpp, cma, mpl1, mpl2 } = desc;
      const dd = dl / 3;
      const freq = 0.4;
      const step = Math.ceil(dd * (1 - (freq + 0.5) / 1.5) + 1);

      ctxNoise.globalAlpha = 1;
      ctxNoise.lineWidth = 1;

      for (let s = 0; s < dl; s++) {
        let c;
        if (s < mpp * dl) c = cma * (1 - Math.pow((mpl1 - s) / mpl1, 2));
        else c = cma * (1 - Math.pow((mpl2 - (dl - s)) / mpl2, 2));
        c /= 2;

        for (let t = -dd; t < dd; t++) {
          if (Math.random() > Math.abs(t) / dd) {
            let cnt = Math.floor(Math.random() * 4 + 0.5);
            const m = Math.random() * 2 - 1;
            while (cnt >= 0) {
              ctxNoise.strokeStyle = `rgba(255,255,255,${(Math.random() * 10 + 2) / 30})`;
              const pos = Math.floor(Math.random() * 5 + 0.5);
              ctxNoise.beginPath();
              ctxNoise.moveTo(
                p1.x + (s - pos) * sx + (m + t) * tx + c * tx,
                p1.y + (s - pos) * sy + (-m + t) * ty + c * ty
              );
              ctxNoise.lineTo(
                p1.x + (s + pos) * sx + (-m + t) * tx + c * tx,
                p1.y + (s + pos) * sy + (m + t) * ty + c * ty
              );
              ctxNoise.stroke();
              cnt -= 1;
            }
          }
          t += Math.random() * step * 2;
        }
        s += Math.random() * step * 4;
      }
    }

    function renderWeb(center) {
      const paths = findWebPaths(center);
      paths.forEach((line) => {
        renderReflect(line);
        renderFractures(line);
        renderMainLine(line);
        renderNoise(line);
      });
    }

    function renderAll() {
      clearAll();
      for (let i = 0; i < centersNorm.length; i++) {
        const cn = centersNorm[i];
        renderWeb({ x: cn.x * stageW, y: cn.y * stageH });
      }
    }

    function pickCenters() {
      centersNorm.length = 0;
      const paddingPx = (Math.min(stageW, stageH) * paddingPercent) / 100;
      const padX = Math.min(stageW * 0.45, Math.max(0, paddingPx));
      const padY = Math.min(stageH * 0.45, Math.max(0, paddingPx));

      for (let i = 0; i < webCount; i++) {
        let x = stageW / 2;
        let y = stageH / 2;

        if (placement === "random") {
          x = rand(padX, stageW - padX) + (Math.random() - 0.5) * 4;
          y = rand(padY, stageH - padY) + (Math.random() - 0.5) * 4;
        }

        centersNorm.push({ x: clamp(x / stageW, 0, 1), y: clamp(y / stageH, 0, 1) });
      }
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;

      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      try {
        if (resizeTimer) clearTimeout(resizeTimer);
      } catch {
        // ignore
      }
      try {
        window.removeEventListener("resize", onResize);
      } catch {
        // ignore
      }

      if (container.parentNode) container.parentNode.removeChild(container);
    }

    function onResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (stopped) return;
        resizeCanvases();
        pickCenters();
        renderAll();
      }, 120);
    }

    container._tdvStop = cleanup;
    timeoutId = setTimeout(cleanup, durationMs + 120);
    window.addEventListener("resize", onResize, { passive: true });

    resizeCanvases();
    pickCenters();
    renderAll();
  }

  function effectMovieCountdown(ctx, cfg) {
    const { scaleDuration, cssLayer, clamp } = ctx;
    if (!cssLayer) return;

    const startNumberRaw = Number.isFinite(Number(cfg.startNumber)) ? Number(cfg.startNumber) : 10;
    const startNumber = clamp
      ? clamp(Math.round(startNumberRaw), 0, 20)
      : Math.round(startNumberRaw);

    const stepMs = scaleDuration(Number(cfg.stepMs) || 1000, 120);
    const holdMs = scaleDuration(Number(cfg.holdMs) || 0, 0);

    const computedDurationMs = (startNumber + 1) * stepMs + holdMs;
    const durationMs =
      typeof cfg.durationMs === "number"
        ? scaleDuration(Number(cfg.durationMs) || computedDurationMs, 800)
        : Math.max(800, computedDurationMs);

    const sizeMode = cfg.sizeMode === "fixed" ? "fixed" : "responsive";
    const sizeVmin = clamp
      ? clamp(Number(cfg.sizeVmin) || 90, 30, 100)
      : Number(cfg.sizeVmin) || 90;
    const sizePx = Math.max(240, Math.round(Number(cfg.sizePx) || 664));
    const borderPx = Math.max(0, Math.round(Number(cfg.borderPx) || 30));

    const bgOpacityRaw = Number(cfg.bgOpacity);
    const bgOpacity = Number.isFinite(bgOpacityRaw)
      ? clamp
        ? clamp(bgOpacityRaw, 0, 1)
        : bgOpacityRaw
      : 0;

    const boxSpeedMs = scaleDuration(Number(cfg.boxSpeedMs) || 1000, 120);

    const prefersReducedMotion =
      !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const colorMod = effectsPro && effectsPro._internals ? effectsPro._internals.color : null;
    const hexToRgba =
      colorMod && typeof colorMod.hexToRgba === "function" ? colorMod.hexToRgba : null;

    const bgHex = typeof cfg.bgColorHex === "string" ? cfg.bgColorHex : "#11233c";
    const bgRgba =
      bgOpacity > 0 ? (hexToRgba ? hexToRgba(bgHex, bgOpacity) : bgHex) : "transparent";

    let stopped = false;
    let timeoutId = null;
    let root = null;

    function stop() {
      if (stopped) return;
      stopped = true;
      try {
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        // ignore
      }
      timeoutId = null;
      try {
        if (root && root.parentNode) root.parentNode.removeChild(root);
      } catch {
        // ignore
      }
      root = null;
    }

    root = document.createElement("div");
    root.className = "tdv-effect-layer tdv-movie-countdown";
    if (prefersReducedMotion) root.setAttribute("data-reduced-motion", "true");

    root.style.setProperty(
      "--tdv-mc-size",
      sizeMode === "fixed" ? `${sizePx}px` : `${sizeVmin}vmin`
    );
    root.style.setProperty("--tdv-mc-border", `${borderPx}px`);
    root.style.setProperty(
      "--tdv-mc-border-color",
      typeof cfg.borderColorHex === "string" ? cfg.borderColorHex : "#000000"
    );
    root.style.setProperty("--tdv-mc-bg", bgRgba);

    root.style.setProperty(
      "--tdv-mc-box-light",
      typeof cfg.boxLightHex === "string" ? cfg.boxLightHex : "#d7d7d7"
    );
    root.style.setProperty(
      "--tdv-mc-box-dark",
      typeof cfg.boxDarkHex === "string" ? cfg.boxDarkHex : "#bebebe"
    );
    root.style.setProperty(
      "--tdv-mc-box-border",
      typeof cfg.boxBorderHex === "string" ? cfg.boxBorderHex : "#626262"
    );
    root.style.setProperty("--tdv-mc-box-speed-ms", String(Math.max(1, Math.round(boxSpeedMs))));

    const circleBgOpacityRaw = Number(cfg.circleBgOpacity);
    const circleBgOpacity = Number.isFinite(circleBgOpacityRaw)
      ? clamp
        ? clamp(circleBgOpacityRaw, 0, 1)
        : circleBgOpacityRaw
      : 0.4;

    root.style.setProperty("--tdv-mc-circle-bg-opacity", String(circleBgOpacity));
    root.style.setProperty(
      "--tdv-mc-circle-border-color",
      typeof cfg.circleBorderColorHex === "string" ? cfg.circleBorderColorHex : "#ffffff"
    );
    root.style.setProperty(
      "--tdv-mc-circle-border",
      `${Math.max(0, Math.round(Number(cfg.circleBorderPx) || 20))}px`
    );
    root.style.setProperty(
      "--tdv-mc-number-color",
      typeof cfg.numberColorHex === "string" ? cfg.numberColorHex : "#202020"
    );
    root.style.setProperty("--tdv-mc-step-ms", `${stepMs}ms`);

    const frame = document.createElement("div");
    frame.className = "tdv-mc-frame";

    const grid = document.createElement("div");
    grid.className = "tdv-mc-grid";

    function makeBox({ rotated, coverClasses }) {
      const box = document.createElement("div");
      box.className = `tdv-mc-box${rotated ? " is-rotated" : ""}`;
      const cover = document.createElement("div");
      cover.className = `tdv-mc-cover ${coverClasses}`;
      box.appendChild(cover);
      return box;
    }

    grid.appendChild(makeBox({ rotated: true, coverClasses: "cover2 cover-1-tempo" }));
    grid.appendChild(makeBox({ rotated: true, coverClasses: "cover4 cover-2-tempo" }));
    grid.appendChild(makeBox({ rotated: false, coverClasses: "cover2" }));
    grid.appendChild(makeBox({ rotated: false, coverClasses: "cover4" }));

    const circle = document.createElement("div");
    circle.className = "tdv-mc-circle";
    const numbers = document.createElement("div");
    numbers.className = "tdv-mc-numbers";

    for (let i = startNumber; i >= 0; i--) {
      const idx = startNumber - i;
      const el = document.createElement("div");
      el.className = "tdv-mc-number";
      el.textContent = String(i);
      el.style.animationDelay = `${idx * stepMs}ms`;
      numbers.appendChild(el);
    }

    circle.appendChild(numbers);
    frame.appendChild(grid);
    frame.appendChild(circle);
    root.appendChild(frame);

    root._tdvStop = stop;
    cssLayer.appendChild(root);
    timeoutId = setTimeout(stop, durationMs + 120);
  }

  const EFFECT_HANDLERS = {
    flash: effectFlash,
    fade: effectFade,
    sweep: effectSweep,
    cinema: effectCinema,
    confetti: effectConfetti,
    sparkles: effectSparkles,
    rain: effectRain,
    bubbles: effectBubbles,
    snow: effectSnow,
    snowflakes: effectSnowflakes,
    easter: effectEaster,
    leaves: effectLeaves,
    fire: effectFire,
    electric: effectElectric,
    bokeh: effectBokeh,
    flames: effectFlames,
    burn: effectBurn,
    wind: effectWind,
    halloween: effectHalloween,
    christmasLights: effectChristmasLights,
    flowers: effectFlowers,
    spinningRays: effectSpinningRays,
    storm: effectStorm,
    sineWaves: effectSineWaves,
    balloons: effectBalloons,
    smoke: effectSmoke,
    fallingStars: effectFallingStars,
    hexagon: effectHexagon,
    radial: effectRadial,
    ripple: effectRipple,
    rippleReverse: effectRippleReverse,
    waterRipple: effectWaterRipple,
    water: effectWater,
    dust: effectDust,
    glitter: effectGlitter,
    laser: effectLaser,
    fireworks: effectFireworks,
    energy: effectEnergy,
    vhs: effectVhs,
    crt: effectCrt,
    ascii: effectAscii,
    bulge: effectBulge,
    grain: effectGrain,
    watercolor: effectWatercolor,
    eightBit: effectEightBit,
    strobe: effectStrobe,
    hardGlitch: effectHardGlitch,
    shaderFire: effectShaderFire,
    pixelSort: effectPixelSort,
    crtTurnOff: effectCrtTurnOff,
    curtains: effectCurtains,
    selfDestruct: effectSelfDestruct,
    blur: effectBlur,
    bleach: effectBleach,
    colorCorrection: effectColorCorrection,
    matrixDance: effectMatrixDance,
    spiderWeb: effectSpiderWeb,
    crackedGlass: effectCrackedGlass,
    heartParticles: effectHeartParticles,
    ecgHeartbeat: effectEcgHeartbeat,
    aura: effectAura,
    movieCountdown: effectMovieCountdown,
    // Back-compat alias (older configs may still reference this key).
    crackGlass: effectSpiderWeb,
  };

  class EffectManager {
    constructor({
      state,
      eventBus,
      canvasManager,
      particleManager,
      cssEffectManager,
      configManager,
    }) {
      this.state = state;
      this.eventBus = eventBus;
      this.canvasManager = canvasManager;
      this.particleManager = particleManager;
      this.cssEffectManager = cssEffectManager;
      this.configManager = configManager;
    }

    _getConfig() {
      const s =
        this.state && typeof this.state.getState === "function" ? this.state.getState() : null;
      if (s && s.config) return s.config;
      if (this.configManager && typeof this.configManager.get === "function") {
        return this.configManager.get();
      }
      return null;
    }

    hasEffect(effectName) {
      return !!(effectName && EFFECT_HANDLERS[effectName]);
    }

    getEffectsList() {
      const list = Object.keys(EFFECT_HANDLERS).filter((name) => name !== "crackGlass");
      return ["none"].concat(list.filter((name) => name !== "none"));
    }

    play(effectName, overrides) {
      let resolvedName = effectName;
      let resolvedOverrides = overrides;

      // Back-compat: map removed Fade variants to the new configurable Fade.
      if (effectName === "fadeBlack") {
        resolvedName = "fade";
        const legacy = { color: "rgba(0,0,0,0.85)" };
        resolvedOverrides =
          resolvedOverrides && isPlainObject && isPlainObject(resolvedOverrides)
            ? deepMerge(legacy, resolvedOverrides)
            : legacy;
      } else if (effectName === "fadeWhite") {
        resolvedName = "fade";
        const legacy = { color: "rgba(255,255,255,0.9)" };
        resolvedOverrides =
          resolvedOverrides && isPlainObject && isPlainObject(resolvedOverrides)
            ? deepMerge(legacy, resolvedOverrides)
            : legacy;
      }

      const handler = resolvedName ? EFFECT_HANDLERS[resolvedName] : null;
      if (!handler) return false;

      const config = this._getConfig();
      const base =
        config && config.effects && config.effects[resolvedName]
          ? config.effects[resolvedName]
          : {};
      const merged =
        resolvedOverrides && isPlainObject && isPlainObject(resolvedOverrides)
          ? deepMerge(base, resolvedOverrides)
          : base;

      try {
        if (
          this.cssEffectManager &&
          typeof this.cssEffectManager.ensureBaseInjected === "function"
        ) {
          this.cssEffectManager.ensureBaseInjected();
        }
      } catch {
        // ignore
      }

      const ctx = makeCtx(this);
      handler(ctx, merged);

      try {
        if (this.state) {
          this.state.setState({ activeEffect: resolvedName });
        }
      } catch {
        // ignore
      }
      if (this.eventBus) {
        this.eventBus.emit("effect:started", { effect: resolvedName });
      }
      return true;
    }
  }

  effectsPro._internals.EffectManager = EffectManager;
  effectsPro._internals._EFFECT_HANDLERS = EFFECT_HANDLERS;
})();
