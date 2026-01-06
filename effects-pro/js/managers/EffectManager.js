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
          : Math.max(min || 1, count || 0),
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

  function effectRain(ctx, cfg) {
    const { scaleCount, scaleDuration, getStageSize, addParticles, rand, particles: p } = ctx;
    const count = scaleCount(cfg.count || 220, 40);
    const duration = scaleDuration(cfg.durationMs || 4200, 800) / 1000;
    const list = [];
    const size = getStageSize();
    for (let i = 0; i < count; i++) {
      list.push(
        new p.RainParticle(
          rand(0, size.w),
          rand(-200, 0),
          cfg.color || "rgba(174,194,224,0.7)",
          duration
        )
      );
    }
    addParticles(list);
  }

  function effectSmoke(ctx, cfg) {
    const { scaleCount, scaleDuration, getStageSize, addParticles, rand, particles: p } = ctx;
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
    const el = addCssEffect(
      "tdv-ascii",
      { "--ascii-size": `${fontSize}px`, "--ascii-color": color },
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
    addCssEffect("tdv-bulge", { "--scale": String(scale) }, duration);
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
    addCssEffect(
      "tdv-eightbit",
      { "--pixel-size": `${pixelSize}px`, "--pixel-opacity": String(intensity) },
      duration
    );
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

  function effectBlur(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2000, 300);
    const amount = clamp(Number(cfg.amountPx) || 12, 2, 40);
    addCssEffect("tdv-blur", { "--blur": `${amount}px` }, duration);
  }

  function effectBleach(ctx, cfg) {
    const { scaleDuration, clamp, addCssEffect } = ctx;
    const duration = scaleDuration(cfg.durationMs || 2200, 300);
    const intensity = clamp(Number(cfg.intensity) || 0.5, 0.1, 0.9);
    addCssEffect("tdv-bleach", { "--bleach-alpha": String(intensity) }, duration);
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

  const EFFECT_HANDLERS = {
    flash: effectFlash,
    fade: effectFade,
    sweep: effectSweep,
    cinema: effectCinema,
    confetti: effectConfetti,
    sparkles: effectSparkles,
    rain: effectRain,
    smoke: effectSmoke,
    radial: effectRadial,
    ripple: effectRipple,
    rippleReverse: effectRippleReverse,
    waterRipple: effectWaterRipple,
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
    blur: effectBlur,
    bleach: effectBleach,
    colorCorrection: effectColorCorrection,
    matrixDance: effectMatrixDance,
    spiderWeb: effectSpiderWeb,
    crackedGlass: effectCrackedGlass,
    heartParticles: effectHeartParticles,
    aura: effectAura,
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
      const list = Object.keys(EFFECT_HANDLERS).filter(
        (name) => name !== "rain" && name !== "crackGlass"
      );
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
