(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const helpers = effectsPro._internals.helpers || {};
  const dom = effectsPro._internals.dom || {};
  const particles = effectsPro._internals.particles || {};
  const Config = effectsPro._internals.Config || {};

  const { deepMerge, clamp, rand, pick } = helpers;

  const resolveAssetUrl =
    dom && typeof dom.resolveAssetUrl === "function" ? dom.resolveAssetUrl : (path) => path;

  function getStageSize(canvasManager) {
    if (canvasManager && typeof canvasManager.getStageSize === "function") {
      return canvasManager.getStageSize();
    }
    return { w: window.innerWidth || 800, h: window.innerHeight || 600 };
  }

  function createShaderBurnOverlay(ctx, cfg) {
    const { getStageSize } = ctx;
    const progressSpeed = clamp(Number(cfg.progressSpeed) || 0.08, 0.01, 2.0);
    const flameSpeed = clamp(Number(cfg.flameSpeed) || 1.0, 0.1, 4.0);
    const background = cfg.background === "transparent" ? "transparent" : "white";
    const loop = cfg.loop !== false;

    const size = getStageSize();
    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-shader-burn";
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;";

    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const gl =
      canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return null;

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

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

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

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uShowBackground, background === "white" ? 1.0 : 0.0);

    const startTime = Date.now();
    let stopped = false;
    container._stopShaderBurn = function () {
      stopped = true;
    };

    function render() {
      if (stopped) return;
      try {
        const elapsed = (Date.now() - startTime) / 1000.0;
        const timeMs = elapsed * 1000.0 * flameSpeed;

        let progress;
        if (loop) {
          const cycle = elapsed * progressSpeed;
          const cycleMod = cycle - Math.floor(cycle / 2.0) * 2.0;
          progress = cycleMod < 1.0 ? cycleMod : 2.0 - cycleMod;
        } else {
          progress = Math.min(elapsed * progressSpeed, 1.0);
          if (progress >= 1.0) progress = 1.0;
        }

        gl.uniform1f(uTime, timeMs);
        gl.uniform1f(uProgress, progress);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
      } catch {
        stopped = true;
      }
    }

    requestAnimationFrame(render);
    return container;
  }

  // eslint-disable-next-line max-lines-per-function
  function createShaderSmokeOverlay(ctx, cfg) {
    const { getStageSize } = ctx;
    const intensity = clamp(Number(cfg.intensity) || 0.5, 0.1, 1.0);
    const speed = clamp(Number(cfg.speed) || 0.8, 0.3, 2.0);
    const riseSoftness = clamp(Number(cfg.riseSoftness) || 0.3, 0.1, 0.6);
    const direction = cfg.direction || "up";

    const size = getStageSize();
    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-shader-smoke";
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;";

    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const gl =
      canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });

    if (!gl) {
      const puffCount = 14;
      const baseDur = 8 / Math.max(0.3, speed);
      for (let i = 0; i < puffCount; i++) {
        const puff = document.createElement("div");
        puff.className = "puff";
        const puffSize = Math.round(80 + Math.random() * 240);
        const left = Math.round(Math.random() * 100);
        const delay = `${(Math.random() * 6).toFixed(2)}s`;
        const drift = `${(Math.random() * 120 - 60).toFixed(0)}px`;
        const x = `${(Math.random() * 80 - 40).toFixed(0)}px`;
        const dur = `${(baseDur * (0.7 + Math.random() * 0.8)).toFixed(2)}s`;
        const alpha = Math.min(0.9, Math.max(0.15, intensity * (0.35 + Math.random() * 0.4)));
        puff.style.cssText = `left:${left}%;width:${puffSize}px;height:${puffSize}px;--dur:${dur};--delay:${delay};--alpha:${alpha};--drift:${drift};--x:${x};`;
        container.appendChild(puff);
      }
      container.classList.add("tdv-css-smoke");
      return container;
    }

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
      uniform float u_direction;

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

        vec2 q = vec2(0.0);
        vec2 r = vec2(0.410, -0.210) * (u_time * 0.736);
        r.x = fbm(st + 1.0 * q + vec2(-0.410, 0.560) + -0.0178 * u_time);

        float f = fbm(st + r);
        float constraints = fbm(st - 0.332 * u_time);

        float smokeDensity = f * f + 0.968 * f * f + 0.748 * clamp(length(r.x), 0.0, 2.248);
        smokeDensity = mix(smokeDensity, 1.0 - constraints, st.y * 0.5);

        float dirNorm;
        if (u_direction < 0.5) {
          dirNorm = gl_FragCoord.y / u_resolution.y;
        } else if (u_direction < 1.5) {
          dirNorm = 1.0 - (gl_FragCoord.y / u_resolution.y);
        } else if (u_direction < 2.5) {
          dirNorm = 1.0 - (gl_FragCoord.x / u_resolution.x);
        } else {
          dirNorm = gl_FragCoord.x / u_resolution.x;
        }

        float riseHeight = u_riseSoftness + min(u_time * 0.4, 0.8);
        float rise = smoothstep(0.0, riseHeight, dirNorm);

        float fadeIn = smoothstep(0.0, 3.0, u_time);
        float intensityMapped = 0.3 + 0.7 * pow(u_intensity, 0.6);
        float alpha = rise * fadeIn * clamp(pow(smokeDensity, 1.2) * intensityMapped, 0.0, 1.0);

        vec3 color = vec3(smokeDensity);
        gl_FragColor = vec4(color, alpha);
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

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

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
    const uTime = gl.getUniformLocation(program, "u_time");
    const uIntensityLoc = gl.getUniformLocation(program, "u_intensity");
    const uRiseSoftnessLoc = gl.getUniformLocation(program, "u_riseSoftness");
    const uDirectionLoc = gl.getUniformLocation(program, "u_direction");

    const directionMap = { up: 0, down: 1, left: 2, right: 3 };
    const directionValue = directionMap[direction] !== undefined ? directionMap[direction] : 0;

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uIntensityLoc, intensity);
    gl.uniform1f(uRiseSoftnessLoc, riseSoftness);
    gl.uniform1f(uDirectionLoc, directionValue);

    const startTime = Date.now();
    let stopped = false;
    container._stopShaderSmoke = function () {
      stopped = true;
    };

    function render() {
      if (stopped) return;
      try {
        const elapsed = (Date.now() - startTime) / 1000.0;
        gl.uniform1f(uTime, 60.0 * elapsed * 0.03 * speed);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
      } catch {
        stopped = true;
      }
    }

    requestAnimationFrame(render);
    return container;
  }

  function createCSSFireOverlay(_ctx, cfg) {
    const intensity = clamp(Number(cfg.intensity) || 1.0, 0.5, 2.0);
    const speed = clamp(Number(cfg.speed) || 1.0, 0.5, 3.0);
    const scale = clamp(Number(cfg.scale) || 1.0, 0.5, 2.0);
    const showBackground = cfg.showBackground !== false;

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-fire";

    const brightness = 3.7 * intensity;
    const contrast = 6.0 * Math.pow(intensity, 0.8);
    const blur = Math.max(4, 7 * intensity);
    const baseDuration = 1.75 / speed;

    const glitterSize1 = Math.round(350 * scale);
    const glitterHeight1 = Math.round(500 * scale);
    const glitterSize2 = Math.round(400 * scale);
    const glitterHeight2 = Math.round(650 * scale);

    const flameMid =
      intensity > 1.3
        ? `rgba(220, 188, 22, ${Math.min(1, 0.9 * intensity)})`
        : `rgba(220, 188, 22, ${0.6 * intensity})`;

    const flameGlow = intensity > 1.3 ? "#ff9551" : "#63bbc5";
    const bgColor = showBackground ? "rgba(0,0,0,0.4)" : "transparent";
    const fireOpacity = 0.5 + intensity * 0.25;

    const glitterTexture = `url('${resolveAssetUrl("effects-assets/silver-glitter-background.png")}')`;

    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      --glitter-texture: ${glitterTexture};
      --glitter-size-1: ${glitterSize1}px;
      --glitter-height-1: ${glitterHeight1}px;
      --glitter-size-2: ${glitterSize2}px;
      --glitter-height-2: ${glitterHeight2}px;
      --brightness: ${brightness};
      --contrast: ${contrast};
      --blur: ${blur}px;
      --fire-duration: ${baseDuration}s;
      --flame-mid: ${flameMid};
      --flame-glow: ${flameGlow};
      --bg-color: ${bgColor};
      --fire-opacity: ${fireOpacity};
    `;

    return container;
  }

  function createCSSBokehOverlay(_ctx, cfg) {
    const lightCount = clamp(Number(cfg.lightCount) || 150, 50, 300);
    const lightSize = clamp(Number(cfg.lightSize) || 75, 50, 150);
    const blurLevel = clamp(Number(cfg.blurLevel) || 2, 1, 5);
    const speed = clamp(Number(cfg.speed) || 1.0, 0.5, 2.0);
    const palette = cfg.palette || "festive";

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-bokeh";

    const palettes = {
      festive: [
        "#D00010",
        "#FEC641",
        "#63C13B",
        "#FE0016",
        "#5C6C94",
        "#6B0D05",
        "#7D0006",
        "#DB1913",
        "#FEE34A",
        "#2F8A27",
      ],
      cool: ["#0AB1AA", "#30398D", "#5C6C94", "#ADFEDD", "#FDFEE4", "#2F8A27", "#63C13B"],
      warm: [
        "#F4A43B",
        "#FF5F24",
        "#F42618",
        "#FD361B",
        "#FEE086",
        "#FEF14F",
        "#FEC641",
        "#FEE34A",
      ],
    };

    const colors = palettes[palette] || palettes.festive;

    container.style.setProperty("--bokeh-opacity-1", "0.6");
    container.style.setProperty("--bokeh-opacity-2", "0.75");
    container.style.setProperty("--bokeh-opacity-3", "0.5");

    for (let i = 0; i < lightCount; i++) {
      const light = document.createElement("div");
      light.className = "tdv-bokeh-light";

      const size = lightSize + Math.floor(Math.random() * 25);
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const blur = blurLevel + Math.floor(Math.random() * blurLevel);
      const delay = (10 + Math.random() * 25) / speed;
      const animationNum = 1 + Math.floor(Math.random() * 5);
      const color = colors[Math.floor(Math.random() * colors.length)];

      light.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        top: ${top}%;
        left: ${left}%;
        background: ${color};
        filter: blur(${blur}px);
        animation: tdv-bokeh-${animationNum} ${delay}s linear infinite;
      `;

      container.appendChild(light);
    }

    return container;
  }

  const SPINNING_RAYS_STYLE_ID = "tdv-spinning-rays-style";
  const SPINNING_RAYS_CSS = `
    #tdv-effects-root .tdv-spinning-rays{position:absolute;inset:0;pointer-events:none;}
    #tdv-effects-root .tdv-spinning-rays canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}
  `;

  function ensureSpinningRaysStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet(
        "css/themes/spinning-rays.css",
        SPINNING_RAYS_STYLE_ID,
        SPINNING_RAYS_CSS
      );
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(SPINNING_RAYS_CSS, SPINNING_RAYS_STYLE_ID);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  function createSpinningRaysOverlay(ctx, cfg) {
    ensureSpinningRaysStylesInjected();

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-spinning-rays";
    container.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return container;

    const prefersReducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.getConfig && ctx.getConfig())
        : false;

    let stopped = false;
    let rafId = null;
    let resizeTimer = null;

    let w = 1;
    let h = 1;
    let dpr = 1;
    let cx = 0;
    let cy = 0;
    let maxRadius = 1;
    let tick = 0;
    let frame = 0;

    function getDpr() {
      return dom && typeof dom.getEffectiveDevicePixelRatio === "function"
        ? dom.getEffectiveDevicePixelRatio(ctx.getConfig && ctx.getConfig())
        : 1;
    }

    function readNum(key, fallback) {
      const v = Number(cfg && cfg[key]);
      return Number.isFinite(v) ? v : fallback;
    }

    function clamp01(value, fallback) {
      const v = Number(value);
      if (!Number.isFinite(v)) return fallback;
      return clamp(v, 0, 1);
    }

    function computeCenter() {
      let mode = "center";
      if (cfg && cfg.centerMode === "custom") {
        mode = "custom";
      } else if (cfg && cfg.centerMode === "random") {
        mode = "random";
      }
      if (mode === "center") {
        cx = w / 2;
        cy = h / 2;
        return;
      }
      if (mode === "custom") {
        const px = clamp(readNum("centerXPercent", 50), 0, 100) / 100;
        const py = clamp(readNum("centerYPercent", 50), 0, 100) / 100;
        cx = px * w;
        cy = py * h;
        return;
      }
      cx = rand(0, w);
      cy = rand(0, h);
    }

    class Ray {
      constructor(
        circleRadiusFactor,
        circleMaxCount,
        radiantMax,
        circleWaveSpeedMin,
        circleWaveSpeedMax,
        circleWaveScale
      ) {
        this.rotation = Math.random() * Math.PI * 2;
        const avMin = Math.abs(readNum("angularVelMin", 0.0001));
        const avMax = Math.abs(readNum("angularVelMax", 0.005));
        const av = rand(Math.min(avMin, avMax), Math.max(avMin, avMax));
        this.angularVel = av * (Math.random() < 0.5 ? 1 : -1);
        this.wavePhase = Math.random() * Math.PI * 2;
        const wsMin = readNum("waveSpeedMin", 0.03);
        const wsMax = readNum("waveSpeedMax", 0.05);
        this.waveSpeed = rand(Math.min(wsMin, wsMax), Math.max(wsMin, wsMax));
        this.circles = this.createCircles(
          circleRadiusFactor,
          circleMaxCount,
          radiantMax,
          circleWaveSpeedMin,
          circleWaveSpeedMax,
          circleWaveScale
        );
      }

      createCircles(
        circleRadiusFactor,
        circleMaxCount,
        radiantMax,
        circleWaveSpeedMin,
        circleWaveSpeedMax,
        circleWaveScale
      ) {
        const circles = [];
        let count = 0;
        let radius = 0;

        while (radius < maxRadius && count < circleMaxCount) {
          radius = circleRadiusFactor * Math.pow(count, 2);
          circles.push({
            radius: radius,
            waveInput: Math.random() * Math.PI * 2,
            waveSpeed:
              rand(circleWaveSpeedMin, circleWaveSpeedMax) *
              (Math.random() < 0.5 ? 1 : -1) *
              circleWaveScale *
              count,
            radiant: rand(0, radiantMax) * (Math.random() < 0.5 ? 1 : -1),
          });
          count += 1;
        }

        return circles;
      }

      update(waveAccel, radiantMax) {
        this.wavePhase += this.waveSpeed;
        this.angularVel += Math.sin(this.wavePhase) * waveAccel;
        this.rotation += this.angularVel;

        this.circles.forEach((circle) => {
          circle.waveInput += circle.waveSpeed;
          circle.radiant = Math.sin(circle.waveInput) * radiantMax;
        });
      }

      // eslint-disable-next-line max-params
      draw(hueBase, sat, light, glowBlur, baseLineWidth, lineWidthFactor, hueRange) {
        let rot = this.rotation;
        let x = cx;
        let y = cy;

        const avAbs = Math.max(0.000001, Math.abs(this.angularVel));
        ctx2d.lineWidth =
          Math.min(0.00001 / avAbs, (10 / 60) * 60) * (lineWidthFactor / 60) + baseLineWidth;

        ctx2d.beginPath();
        ctx2d.moveTo(x, y);

        for (let i = 0; i < this.circles.length; i++) {
          const circle = this.circles[i];
          rot += circle.radiant;

          const x2 = cx + Math.sin(rot) * circle.radius;
          const y2 = cy + Math.cos(rot) * circle.radius;
          const mx = (x + x2) / 2;
          const my = (y + y2) / 2;

          ctx2d.quadraticCurveTo(x, y, mx, my);

          x = x2;
          y = y2;
        }

        const hue = ((((rot + this.rotation) / 2) % (Math.PI * 2)) / Math.PI) * hueRange + hueBase;
        const rayColor = `hsl(${hue}, ${sat}%, ${light}%)`;
        ctx2d.shadowBlur = glowBlur;
        ctx2d.shadowColor = rayColor;
        ctx2d.strokeStyle = rayColor;
        ctx2d.stroke();
      }
    }

    let rays = [];

    function initRays() {
      const numRays = clamp(Math.round(readNum("numRays", 30)), 1, 240);
      const circleRadiusFactor = Math.max(0.25, readNum("circleRadiusFactor", 2));
      const circleMaxCount = clamp(Math.round(readNum("circleMaxCount", 100)), 8, 200);
      const radiantMax = clamp(readNum("radiantMax", 0.4), 0, 2);
      const circleWaveSpeedMin = Math.max(0, readNum("circleWaveSpeedMin", 0.01));
      const circleWaveSpeedMax = Math.max(0, readNum("circleWaveSpeedMax", 0.02));
      const circleWaveScale = Math.max(0, readNum("circleWaveScale", 0.1));

      rays = [];
      for (let i = 0; i < numRays; i++) {
        rays.push(
          new Ray(
            circleRadiusFactor,
            circleMaxCount,
            radiantMax,
            circleWaveSpeedMin,
            circleWaveSpeedMax,
            circleWaveScale
          )
        );
      }
    }

    function resize() {
      const size = ctx.getStageSize
        ? ctx.getStageSize()
        : { w: window.innerWidth || 800, h: window.innerHeight || 600 };
      w = Math.max(1, Math.floor(size.w));
      h = Math.max(1, Math.floor(size.h));
      dpr = Math.max(1, Number(getDpr()) || 1);

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }

      maxRadius = Math.sqrt((w * w) / 4 + (h * h) / 4);
      computeCenter();
      initRays();
    }

    function fadeTrails(alpha) {
      ctx2d.globalCompositeOperation = "destination-out";
      ctx2d.shadowBlur = 0;
      ctx2d.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx2d.fillRect(0, 0, w, h);
    }

    function drawFrame() {
      tick += readNum("hueSpeed", 1);

      const trailAlpha = clamp01(cfg && cfg.trailAlpha, 0.2);
      fadeTrails(trailAlpha);

      ctx2d.globalCompositeOperation = "lighter";

      const hueOffset = readNum("hueOffset", 0);
      const hueRange = clamp(readNum("hueRange", 30), 0, 240);
      const sat = clamp(readNum("saturation", 80), 0, 100);
      const light = clamp(readNum("lightness", 50), 0, 100);
      const glowBlur = clamp(readNum("glowBlur", 14), 0, 120);
      const baseLineWidth = clamp(readNum("baseLineWidth", 1), 0, 12);
      const lineWidthFactor = clamp(readNum("lineWidthFactor", 60), 1, 240);
      const waveAccel = clamp(readNum("waveAccel", 0.0003), 0, 0.01);
      const radiantMax = clamp(readNum("radiantMax", 0.4), 0, 2);

      for (let i = 0; i < rays.length; i++) {
        rays[i].update(waveAccel, radiantMax);
        rays[i].draw(
          tick + hueOffset,
          sat,
          light,
          glowBlur,
          baseLineWidth,
          lineWidthFactor,
          hueRange
        );
      }
    }

    function loop() {
      if (stopped) return;
      if (!container.isConnected) {
        stop();
        return;
      }

      if (document.visibilityState === "visible") {
        if (prefersReducedMotion) {
          frame += 1;
          if (frame % 2 === 0) drawFrame();
        } else {
          drawFrame();
        }
      }

      rafId = requestAnimationFrame(loop);
    }

    function onResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (stopped) return;
        resize();
      }, 120);
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      try {
        if (rafId) cancelAnimationFrame(rafId);
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

    container._stopSpinningRays = stop;
    window.addEventListener("resize", onResize, { passive: true });
    resize();
    rafId = requestAnimationFrame(loop);

    return container;
  }

  const SINE_WAVES_STYLE_ID = "tdv-sine-waves-style";
  const SINE_WAVES_CSS = `
		    #tdv-effects-root .tdv-sine-waves{position:absolute;inset:0;pointer-events:none;}
		    #tdv-effects-root .tdv-sine-waves canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}
		  `;

  function ensureSineWavesStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet("css/themes/sine-waves.css", SINE_WAVES_STYLE_ID, SINE_WAVES_CSS);
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(SINE_WAVES_CSS, SINE_WAVES_STYLE_ID);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  function createSineWavesOverlay(ctx, cfg) {
    ensureSineWavesStylesInjected();

    const initialCfg = cfg || {};
    function getLiveCfg() {
      try {
        if (ctx && typeof ctx.getConfig === "function") {
          const rootCfg = ctx.getConfig();
          const live = rootCfg && rootCfg.themes ? rootCfg.themes.sineWaves : null;
          if (live && typeof live === "object") return live;
        }
      } catch {
        // ignore
      }
      return initialCfg;
    }

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-sine-waves";
    container.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return container;

    const prefersReducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.getConfig && ctx.getConfig())
        : false;

    let stopped = false;
    let rafId = null;
    let resizeTimer = null;
    let time = 0;
    let frame = 0;
    let liveCfg = initialCfg;

    let w = 1;
    let h = 1;
    let dpr = 1;
    let waveWidth = 1;
    let waveLeft = 0;
    let centerY = 0;

    function getDpr() {
      return dom && typeof dom.getEffectiveDevicePixelRatio === "function"
        ? dom.getEffectiveDevicePixelRatio(ctx.getConfig && ctx.getConfig())
        : 1;
    }

    function readNum(key, fallback) {
      const v = Number(liveCfg && liveCfg[key]);
      return Number.isFinite(v) ? v : fallback;
    }

    function clamp01(key, fallback) {
      const v = Number(liveCfg && liveCfg[key]);
      if (!Number.isFinite(v)) return fallback;
      return clamp(v, 0, 1);
    }

    function parseBool(value, fallback) {
      if (typeof value === "boolean") return value;
      if (value === "true") return true;
      if (value === "false") return false;
      return fallback;
    }

    function resize() {
      liveCfg = getLiveCfg();
      const size = ctx.getStageSize
        ? ctx.getStageSize()
        : { w: window.innerWidth || 800, h: window.innerHeight || 600 };
      w = Math.max(1, Math.floor(size.w));
      h = Math.max(1, Math.floor(size.h));
      dpr = Math.max(1, Number(getDpr()) || 1);

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }

      const waveWidthPercent = clamp(readNum("waveWidthPercent", 95), 10, 100) / 100;
      const waveLeftPercent = clamp(readNum("waveLeftPercent", 2.5), 0, 45) / 100;
      waveWidth = w * waveWidthPercent;
      waveLeft = w * waveLeftPercent;

      const centerYPercent = clamp(readNum("centerYPercent", 50), 0, 100) / 100;
      centerY = h * centerYPercent;
    }

    function buildStroke() {
      const colorMode = liveCfg && liveCfg.colorMode === "solid" ? "solid" : "gradient";
      if (colorMode === "solid")
        return (liveCfg && liveCfg.strokeColor) || "rgba(255,255,255,0.25)";

      const startA = clamp01("gradientStartAlpha", 0);
      const midA = clamp01("gradientMidAlpha", 0.5);
      const endA = clamp01("gradientEndAlpha", 0);

      const hue = clamp(readNum("gradientHue", 0), 0, 360);
      const sat = clamp(readNum("gradientSaturation", 0), 0, 100);
      const light = clamp(readNum("gradientLightness", 100), 0, 100);

      const gradient = ctx2d.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, `hsla(${hue},${sat}%,${light}%,${startA})`);
      gradient.addColorStop(0.5, `hsla(${hue},${sat}%,${light}%,${midA})`);
      gradient.addColorStop(1, `hsla(${hue},${sat}%,${light}%,${endA})`);
      return gradient;
    }

    function ease(percent, amplitude) {
      return amplitude * (Math.sin(percent * Math.PI * 2 - Math.PI / 2) + 1) * 0.5;
    }

    function drawWave(wave, speed, strokeStyle, segmentLengthDefault) {
      const amplitude = Number.isFinite(Number(wave.amplitude)) ? Number(wave.amplitude) : 50;
      const wavelength = Math.max(
        1,
        Number.isFinite(Number(wave.wavelength)) ? Number(wave.wavelength) : 50
      );
      const lineWidth = Math.max(
        0.1,
        Number.isFinite(Number(wave.lineWidth)) ? Number(wave.lineWidth) : 2
      );
      const segmentLength = Math.max(
        1,
        Number.isFinite(Number(wave.segmentLength))
          ? Number(wave.segmentLength)
          : segmentLengthDefault
      );
      const timeModifier = Number.isFinite(Number(wave.timeModifier))
        ? Number(wave.timeModifier)
        : 1;

      ctx2d.lineWidth = lineWidth;
      ctx2d.strokeStyle = strokeStyle;
      ctx2d.lineCap = "round";
      ctx2d.lineJoin = "round";
      ctx2d.beginPath();

      ctx2d.moveTo(0, centerY);
      ctx2d.lineTo(waveLeft, centerY);

      for (let i = 0; i < waveWidth; i += segmentLength) {
        const x = time * timeModifier * speed + (-centerY + i) / wavelength;
        const y = Math.sin(x);
        const amp = ease(i / waveWidth, amplitude);
        ctx2d.lineTo(i + waveLeft, amp * y + centerY);
      }

      ctx2d.lineTo(w, centerY);
      ctx2d.stroke();
    }

    function buildWaves() {
      const list = [];
      const segDefault = Math.max(1, Math.round(readNum("segmentLengthDefault", 10)));
      for (let i = 1; i <= 4; i++) {
        const enabled = parseBool(liveCfg && liveCfg[`wave${i}Enabled`], true);
        if (!enabled) continue;
        list.push({
          timeModifier: readNum(`wave${i}TimeModifier`, 1),
          lineWidth: readNum(`wave${i}LineWidth`, 2),
          amplitude: readNum(`wave${i}Amplitude`, 150),
          wavelength: readNum(`wave${i}Wavelength`, 100),
          segmentLength: readNum(`wave${i}SegmentLength`, segDefault),
        });
      }
      return list;
    }

    function clearFrame(clearMode, trailAlpha) {
      if (clearMode === "trails") {
        ctx2d.globalCompositeOperation = "destination-out";
        ctx2d.fillStyle = `rgba(0,0,0,${trailAlpha})`;
        ctx2d.fillRect(0, 0, w, h);
        return;
      }
      ctx2d.globalCompositeOperation = "source-over";
      ctx2d.clearRect(0, 0, w, h);
    }

    function drawFrame() {
      liveCfg = getLiveCfg();
      const speed = readNum("speed", 8);
      const clearMode = liveCfg && liveCfg.clearMode === "trails" ? "trails" : "clear";
      const trailAlpha = clamp01("trailAlpha", 0.18);
      clearFrame(clearMode, trailAlpha);

      const composite =
        liveCfg && liveCfg.compositeOperation === "source-over" ? "source-over" : "lighter";
      ctx2d.globalCompositeOperation = composite;

      const strokeStyle = buildStroke();
      const waves = buildWaves();
      const segDefault = Math.max(1, Math.round(readNum("segmentLengthDefault", 10)));

      for (let i = 0; i < waves.length; i++) {
        drawWave(waves[i], speed, strokeStyle, segDefault);
      }

      time -= 0.007;
    }

    function loop() {
      if (stopped) return;
      if (!container.isConnected) {
        stop();
        return;
      }

      if (document.visibilityState === "visible") {
        if (prefersReducedMotion) {
          frame += 1;
          if (frame % 2 === 0) drawFrame();
        } else {
          drawFrame();
        }
      }

      rafId = requestAnimationFrame(loop);
    }

    function onResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (stopped) return;
        resize();
      }, 120);
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      try {
        if (rafId) cancelAnimationFrame(rafId);
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

    container._stopSineWaves = stop;
    window.addEventListener("resize", onResize, { passive: true });
    resize();
    rafId = requestAnimationFrame(loop);
    return container;
  }

  // eslint-disable-next-line max-lines-per-function
  function createShaderWaterOverlay(ctx, cfg) {
    const { getStageSize } = ctx;

    function parseColor(color) {
      const fallback = { r: 120, g: 180, b: 220, a: 0.48 };
      if (!color || typeof color !== "string") return fallback;

      const rgba = color.match(/rgba?\(([^)]+)\)/i);
      if (rgba) {
        const parts = rgba[1].split(/[ ,]+/).map((v) => parseFloat(v));
        if (parts.length >= 3) {
          return {
            r: clamp(parts[0], 0, 255),
            g: clamp(parts[1], 0, 255),
            b: clamp(parts[2], 0, 255),
            a: parts.length > 3 ? clamp(parts[3], 0, 1) : fallback.a,
          };
        }
      }

      if (color[0] === "#") {
        const hex = color.replace("#", "");
        if (hex.length === 6) {
          return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: fallback.a,
          };
        }
      }

      return fallback;
    }

    const textureUrl = resolveAssetUrl(cfg.texture || "effects-assets/Water-normal.jpg");
    const textureUrl2 = resolveAssetUrl(
      cfg.texture2 || cfg.texture || "effects-assets/Water-effect-normal.jpg"
    );
    const flowSpeed = clamp(Number(cfg.flowSpeed) || 1.0, 0.1, 3.0);
    const flow1 = Array.isArray(cfg.flow1) ? cfg.flow1 : [0.08, 0.03];
    const flow2 = Array.isArray(cfg.flow2) ? cfg.flow2 : [-0.05, 0.06];
    const tiling1 = clamp(Number(cfg.tiling1) || 2.1, 0.5, 8.0);
    const tiling2 = clamp(Number(cfg.tiling2) || 1.7, 0.5, 8.0);
    const rot1 = ((cfg.rotate1Deg || 18) * Math.PI) / 180;
    const rot2 = ((cfg.rotate2Deg || -12) * Math.PI) / 180;
    const distortion = clamp(Number(cfg.distortion) || 0.03, 0.005, 0.25);
    const specular = clamp(Number(cfg.specular) || 0.2, 0.0, 2.0);
    const caustics = clamp(Number(cfg.caustics) || 0.14, 0.0, 1.5);
    const opacity = clamp(Number(cfg.opacity) || 0.78, 0.05, 1.0);
    const tint = parseColor(cfg.tint || "rgba(120,180,220,0.35)");

    const size = getStageSize();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-water-shader";
    container.style.cssText =
      "position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:0;transition:opacity 1.2s ease-in;";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.style.opacity = "1";
      });
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(320, Math.round(size.w * dpr));
    canvas.height = Math.max(240, Math.round(size.h * dpr));
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const gl =
      canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });

    if (!gl) {
      const fallback = document.createElement("div");
      fallback.className = "tdv-effect-layer tdv-water-fallback";
      fallback.style.setProperty(
        "--water-fallback-duration",
        `${Math.round(4000 / Math.max(0.4, flowSpeed))}ms`
      );
      container.appendChild(fallback);
      return container;
    }

    function compileShader(src, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexSrc = `
      attribute vec2 position;
      varying vec2 vUv;
      void main(){
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentSrc = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D u_height1;
      uniform sampler2D u_height2;
      uniform float u_time;
      uniform vec2 u_flow1;
      uniform vec2 u_flow2;
      uniform float u_tiling1;
      uniform float u_tiling2;
      uniform float u_rot1;
      uniform float u_rot2;
      uniform float u_distortion;
      uniform vec3 u_tint;
      uniform float u_specular;
      uniform float u_caustics;
      uniform float u_opacity;

      mat2 rot(float a){
        float c=cos(a), s=sin(a);
        return mat2(c,-s,s,c);
      }

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      vec3 sampleNormal(sampler2D tex, vec2 uv) {
        vec3 n = texture2D(tex, uv).xyz * 2.0 - 1.0;
        n.xy *= u_distortion * 1.2;
        n.z = max(0.2, n.z);
        return normalize(n);
      }

      void main() {
        vec2 turbulence = vec2(
          noise(vUv * 3.5 + u_time * 0.18),
          noise(vUv * 3.5 + u_time * 0.22 + 100.0)
        ) * 0.2 - 0.1;

        float swell = sin(u_time * 0.6) * 0.02;
        vec2 baseUv = vUv + vec2(swell, swell * 0.6) + turbulence * 0.4;

        vec2 uv1 = rot(u_rot1) * (baseUv * u_tiling1 + u_flow1 * u_time);
        vec2 uv2 = rot(u_rot2) * (baseUv * u_tiling2 + u_flow2 * u_time - turbulence * 0.3);

        vec3 n1 = sampleNormal(u_height1, uv1);
        vec3 n2 = sampleNormal(u_height2, uv2 + vec2(0.015, -0.01));
        vec3 normal = normalize(mix(n1, n2, 0.5));

        vec3 lightDir = normalize(vec3(-0.32, 0.44, 1.0));
        float ndotl = max(dot(normal, lightDir), 0.0);

        float fresnel = pow(1.0 - max(dot(normal, vec3(0.0,0.0,1.0)), 0.0), 3.0);
        float spec = pow(ndotl, 18.0) * (0.35 + u_specular) + fresnel * 0.12;

        float caustic = u_caustics * (sin((uv1.x + uv2.y) * 14.0 + u_time * 3.2) * 0.5 + 0.5) * (0.35 + 0.65 * ndotl);

        vec3 base = u_tint * (0.55 + 0.45 * normal.z);
        vec3 color = base + vec3(0.9, 1.0, 1.05) * spec + vec3(1.05, 1.0, 0.92) * caustic;

        float vfade = mix(0.9, 0.65, vUv.y);
        float alpha = clamp(u_opacity * (0.6 + 0.4 * normal.z) * vfade, 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const vtx = compileShader(vertexSrc, gl.VERTEX_SHADER);
    const frg = compileShader(fragmentSrc, gl.FRAGMENT_SHADER);
    if (!vtx || !frg) {
      const fallback = document.createElement("div");
      fallback.className = "tdv-effect-layer tdv-water-fallback";
      container.appendChild(fallback);
      return container;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vtx);
    gl.attachShader(program, frg);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const fallback = document.createElement("div");
      fallback.className = "tdv-effect-layer tdv-water-fallback";
      container.appendChild(fallback);
      return container;
    }

    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, "position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uHeight1 = gl.getUniformLocation(program, "u_height1");
    const uHeight2 = gl.getUniformLocation(program, "u_height2");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uFlow1 = gl.getUniformLocation(program, "u_flow1");
    const uFlow2 = gl.getUniformLocation(program, "u_flow2");
    const uTiling1 = gl.getUniformLocation(program, "u_tiling1");
    const uTiling2 = gl.getUniformLocation(program, "u_tiling2");
    const uRot1 = gl.getUniformLocation(program, "u_rot1");
    const uRot2 = gl.getUniformLocation(program, "u_rot2");
    const uDistortion = gl.getUniformLocation(program, "u_distortion");
    const uTint = gl.getUniformLocation(program, "u_tint");
    const uSpecular = gl.getUniformLocation(program, "u_specular");
    const uCaustics = gl.getUniformLocation(program, "u_caustics");
    const uOpacity = gl.getUniformLocation(program, "u_opacity");

    gl.uniform2f(uFlow1, flow1[0], flow1[1]);
    gl.uniform2f(uFlow2, flow2[0], flow2[1]);
    gl.uniform1f(uTiling1, tiling1);
    gl.uniform1f(uTiling2, tiling2);
    gl.uniform1f(uRot1, rot1);
    gl.uniform1f(uRot2, rot2);
    gl.uniform1f(uDistortion, distortion);
    gl.uniform3f(uTint, tint.r / 255, tint.g / 255, tint.b / 255);
    gl.uniform1f(uSpecular, specular);
    gl.uniform1f(uCaustics, caustics);
    gl.uniform1f(uOpacity, opacity);

    const texture1 = gl.createTexture();
    const texture2 = gl.createTexture();
    function initTexture(tex) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    initTexture(texture1);
    initTexture(texture2);

    const startTime = performance.now();
    let rafId = null;
    let stopped = false;

    function render() {
      if (stopped) return;
      const t = (performance.now() - startTime) / 1000;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    }

    function startRender() {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.uniform1i(uHeight1, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texture2);
      gl.uniform1i(uHeight2, 1);
      render();
    }

    function handleTextureError() {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      const fallback = document.createElement("div");
      fallback.className = "tdv-effect-layer tdv-water-fallback";
      container.appendChild(fallback);
    }

    let loaded = 0;
    function tryStart() {
      loaded += 1;
      if (loaded === 2) startRender();
    }

    function loadTexture(tex, url) {
      const img = new Image();
      img.onload = function () {
        try {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          tryStart();
        } catch {
          handleTextureError();
        }
      };
      img.onerror = handleTextureError;
      img.src = url;
    }

    loadTexture(texture1, textureUrl);
    loadTexture(texture2, textureUrl2);

    container._stopShaderWater = () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      container.style.opacity = "0";
      container.style.transition = "opacity 1.0s ease-out";
      setTimeout(() => {
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 1000);
    };

    return container;
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

  const HALLOWEEN_GHOST_SVG = `
    <svg viewBox="0 0 212 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <g transform="translate(1.15,-88.71)">
        <path fill="#ffffff" opacity="0.6" d="m 100.79161,132.69971 c -1.333632,-2.27245 -1.884306,-4.93766 -3.007029,-7.31692 -1.566889,-5.09862 -2.457398,-10.18646 -2.571554,-15.48165 -0.363995,-7.24126 2.769229,-15.092861 9.299183,-17.065643 4.18881,-1.121088 11.59069,1.569454 14.28843,9.371783 2.94433,6.2779 3.44947,13.34521 4.56873,19.40732 0.44669,2.43287 0.55536,4.86948 0.85666,7.32839 0,0 -2.09928,-4.16754 -3.25026,-3.9011 -1.15099,0.26644 -0.0904,8.20137 -0.0904,8.20137 0,0 -4.38506,-8.57875 -5.56606,-7.81757 -1.181,0.76119 1.51308,7.73639 1.51308,7.73639 0,0 -3.19598,-4.50606 -4.13691,-3.68064 -0.94093,0.8254 -0.23147,5.7131 -0.23147,5.7131 0,0 -3.62169,-5.89399 -4.88809,-5.03102 -1.26639,0.86298 0.0892,6.30332 0.42496,7.70133 0,0 -2.80584,-4.133 -3.50905,-3.33685 -0.7032,0.79615 -0.17612,3.33416 -0.17612,3.33416 0,0 -3.28524,-4.0866 -3.5241,-5.16245 z"/>
        <ellipse fill="#000000" cx="93" cy="106" rx="2" ry="4"/>
        <ellipse fill="#000000" cx="105" cy="106" rx="2" ry="4"/>
      </g>
    </svg>
  `;

  const HALLOWEEN_PARALLAX_GHOST_SVG = `
	    <svg viewBox="0 0 212 140" id="tdv-halloween-parallax-ghost" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
	      <defs>
	        <filter id="disfilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="2" result="warp">
            <animate attributeType="XML" attributeName="baseFrequency" from="0.03 0.03" to="0.05 0.05" dur="2s" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="20" in="SourceGraphic" in2="warp"/>
        </filter>
      </defs>
      <g transform="translate(1.15,-88.71)">
        <g id="ghost1">
          <path style="opacity:0.3;fill:#ffffff;fill-rule:evenodd;stroke:none;stroke-width:0.19091424px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 100.79161,132.69971 c -1.333632,-2.27245 -1.884306,-4.93766 -3.007029,-7.31692 -1.566889,-5.09862 -2.457398,-10.18646 -2.571554,-15.48165 -0.363995,-7.24126 2.769229,-15.092861 9.299183,-17.065643 4.18881,-1.121088 11.59069,1.569454 14.28843,9.371783 2.94433,6.2779 3.44947,13.34521 4.56873,19.40732 0.44669,2.43287 0.55536,4.86948 0.85666,7.32839 0,0 -2.09928,-4.16754 -3.25026,-3.9011 -1.15099,0.26644 -0.0904,8.20137 -0.0904,8.20137 0,0 -4.38506,-8.57875 -5.56606,-7.81757 -1.181,0.76119 1.51308,7.73639 1.51308,7.73639 0,0 -3.19598,-4.50606 -4.13691,-3.68064 -0.94093,0.8254 -0.23147,5.7131 -0.23147,5.7131 0,0 -3.62169,-5.89399 -4.88809,-5.03102 -1.26639,0.86298 0.0892,6.30332 0.42496,7.70133 0,0 -2.80584,-4.133 -3.50905,-3.33685 -0.7032,0.79615 -0.17612,3.33416 -0.17612,3.33416 0,0 -3.28524,-4.0866 -3.5241,-5.16245 z" id="path8656"/>
          <ellipse transform="matrix(1,0,0.03111267,0.99951588,0,0)" ry="4.2458224" rx="2.0475318" cy="105.81969" cx="98.693253" id="ellipse9337" style="opacity:1;fill:#ff0000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.28869617;stroke-linecap:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"/>
          <ellipse transform="matrix(1,0,0.03111267,0.99951588,0,0)" ry="4.2458224" rx="2.0475318" cy="106.34912" cx="98.147614" id="path8677" style="opacity:1;fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.28869617;stroke-linecap:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"/>
          <ellipse style="opacity:1;fill:#ff0000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.29199275;stroke-linecap:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" id="ellipse9339" cx="89.086861" cy="105.88109" rx="2.0475318" ry="4.3433409" transform="matrix(1,0,0.21289874,0.97707427,0,0)"/>
          <ellipse transform="matrix(1,0,0.21289874,0.97707427,0,0)" ry="4.3433409" rx="2.0475318" cy="106.42267" cx="88.44239" id="ellipse8679" style="opacity:1;fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.29199275;stroke-linecap:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"/>
          <path id="path9341" d="m 101.25903,114.85223 c 0.36338,-1.60573 2.49577,-2.43815 3.6576,-1.25544 1.00834,0.9066 2.68609,1.06005 3.62958,-0.0347 0.40159,-0.68924 1.23894,-0.47351 1.84663,-0.29923 0.70214,0.28725 1.38874,-0.083 1.79021,-0.69883 0.47633,-0.5191 0.54476,-1.40401 1.18517,-1.75184 0.60181,-0.007 1.20411,0.42134 1.73156,-0.19576 0.48193,-0.3651 1.54588,-1.3397 1.7864,-0.22891 0.0583,0.56536 0.50473,1.00842 0.49076,1.60877 0.10402,1.4453 -0.84599,2.86052 -2.1188,3.33264 -0.75469,0.85366 -0.21777,2.07061 -0.37144,3.09023 -0.0472,1.0268 -1.21074,0.64857 -1.84907,0.59394 -0.907,-0.1249 -1.87046,-0.4983 -2.76822,-0.16272 -0.71464,0.3982 -0.93744,1.57448 -1.85755,1.57939 -0.6336,-0.18067 -1.41644,-0.73959 -1.86516,0.14845 -0.4277,0.62774 -1.04535,1.39233 -1.86835,1.08397 -1.14803,-0.2781 -1.50802,-1.61081 -2.0164,-2.57095 -0.21494,-0.79652 -1.23393,-0.61631 -1.48674,-1.40842 -0.35267,-0.78092 0.29135,-1.52801 0.12602,-2.32612 -0.007,-0.1687 -0.0213,-0.3371 -0.0422,-0.50448 z" style="fill:#ff0000;fill-rule:evenodd;stroke:#000000;stroke-width:0.19091424px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"/>
          <path style="fill:#000000;fill-rule:evenodd;stroke:#000000;stroke-width:0.19091424px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="m 100.72986,115.3814 c 0.36338,-1.60573 2.49577,-2.43815 3.6576,-1.25544 1.00834,0.9066 2.68609,1.06005 3.62958,-0.0347 0.40159,-0.68924 1.23894,-0.47351 1.84663,-0.29923 0.70214,0.28725 1.38874,-0.083 1.79021,-0.69883 0.47633,-0.5191 0.54476,-1.40401 1.18517,-1.75184 0.60181,-0.007 1.20411,0.42134 1.73156,-0.19576 0.48193,-0.3651 1.54588,-1.3397 1.7864,-0.22891 0.0583,0.56536 0.50473,1.00842 0.49076,1.60877 0.10402,1.4453 -0.84599,2.86052 -2.1188,3.33264 -0.75469,0.85366 -0.21777,2.07061 -0.37144,3.09023 -0.0472,1.0268 -1.21074,0.64857 -1.84907,0.59394 -0.907,-0.1249 -1.87046,-0.4983 -2.76822,-0.16272 -0.71464,0.3982 -0.93744,1.57448 -1.85755,1.57939 -0.6336,-0.18067 -1.41644,-0.73959 -1.86516,0.14845 -0.4277,0.62774 -1.04535,1.39233 -1.86835,1.08397 -1.14803,-0.2781 -1.50802,-1.61081 -2.0164,-2.57095 -0.21494,-0.79652 -1.23393,-0.61631 -1.48674,-1.40842 -0.35267,-0.78092 0.29135,-1.52801 0.12602,-2.32612 -0.007,-0.1687 -0.0213,-0.3371 -0.0422,-0.50448 z" id="path8681"/>
        </g>
      </g>
    </svg>
  `;

  const HALLOWEEN_GHOST_PATTERNS = [
    { dir: "ltr", dur: 25, delay: 0, op: 0.7, y0: 0.15, y1: 0.2, w: 120, h: 150 },
    { dir: "rtl", dur: 30, delay: 5, op: 0.6, y0: 0.4, y1: 0.35, w: 100, h: 130 },
    { dir: "ltr", dur: 28, delay: 10, op: 0.8, y0: 0.65, y1: 0.6, w: 90, h: 120 },
    { dir: "ltr", dur: 32, delay: 15, op: 0.65, y0: 0.1, y1: 0.7, w: 110, h: 140 },
    { dir: "rtl", dur: 27, delay: 20, op: 0.7, y0: 0.75, y1: 0.25, w: 95, h: 125 },
    {
      dir: "ltr",
      dur: 35,
      delay: 8,
      op: 0.75,
      y0: 0.5,
      y1: 0.45,
      w: 105,
      h: 135,
      wavy: true,
      y25: 0.3,
      y50: 0.55,
      y75: 0.35,
    },
  ];

  const HALLOWEEN_PARALLAX_GHOST_FILTER_ID = "tdv-halloween-parallax-disfilter";
  const HALLOWEEN_PARALLAX_GHOST_FILTER_SVG = `
	    <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden;">
	      <defs>
	        <filter id="${HALLOWEEN_PARALLAX_GHOST_FILTER_ID}">
	          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="2" result="warp">
	            <animate attributeType="XML" attributeName="baseFrequency" from="0.03 0.03" to="0.05 0.05" dur="2s" repeatCount="indefinite"/>
	          </feTurbulence>
	          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="20" in="SourceGraphic" in2="warp"/>
	        </filter>
	      </defs>
	    </svg>
	  `;

  const HALLOWEEN_PARALLAX_GHOST_PATTERNS = [
    // Keep the original single-ghost timing as the default.
    { dir: "rtl", dur: 25, delay: -19, blur: 3, zIndex: 0 },
    { dir: "rtl", dur: 35, delay: -10, blur: 5, zIndex: 0 },
    { dir: "ltr", dur: 20, delay: -5, blur: 2, zIndex: 5 },
    { dir: "ltr", dur: 18, delay: -2, blur: 1, zIndex: 10 },
    { dir: "rtl", dur: 40, delay: -25, blur: 6, zIndex: 0 },
  ];

  function halloweenLerp(a, b, t) {
    return a + (b - a) * t;
  }

  function normalizeGhostDirectionMode(value) {
    const v = typeof value === "string" ? value : "mixed";
    if (v === "leftToRight" || v === "rightToLeft" || v === "mixed") return v;
    return "mixed";
  }

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

      const ry25 = rand(0.08, 0.82);
      const ry50 = rand(0.08, 0.82);
      const ry75 = rand(0.08, 0.82);
      const y25p = halloweenLerp(Number(chosenPattern.y25) || 0.3, ry25, randomness);
      const y50p = halloweenLerp(Number(chosenPattern.y50) || 0.55, ry50, randomness);
      const y75p = halloweenLerp(Number(chosenPattern.y75) || 0.35, ry75, randomness);
      const y25 = clamp(Math.round(h * y25p), 0, Math.max(0, h - height));
      const y50 = clamp(Math.round(h * y50p), 0, Math.max(0, h - height));
      const y75 = clamp(Math.round(h * y75p), 0, Math.max(0, h - height));

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
    const rawCount = Number(cfg && cfg.ghostCount);
    const requested = Number.isFinite(rawCount) ? clamp(Math.round(rawCount), 0, 12) : 6;

    let count = requested;
    const globalCfg = ctx && typeof ctx.getConfig === "function" ? ctx.getConfig() : null;
    if (dom && typeof dom.getMotionScale === "function") {
      const scale = dom.getMotionScale(globalCfg).count;
      count = Math.max(0, Math.round(count * scale));
    }

    if (!count) return [];
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(createHalloweenGhostElement(ctx, cfg, i));
    }
    return list;
  }

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
    container.className = "tdv-effect-layer tdv-halloween-spiders";
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
    // Force reflow to ensure animations start from correct initial position (prevent FOUC)
    void container.offsetWidth;
    return container;
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

  const ELECTRIC_STYLE_ID = "tdv-electric-style";
  const ELECTRIC_CSS = `
	    #tdv-effects-root .tdv-electric{position:absolute;inset:0;pointer-events:none;}
	    #tdv-effects-root .tdv-electric-shake{animation:tdv-electric-shake 240ms linear;}

	    @keyframes tdv-electric-shake{
	      0%{transform:translate3d(0,0,0);}
	      10%{transform:translate3d(calc(-2px * var(--shake-intensity,1)),calc(1px * var(--shake-intensity,1)),0);}
	      20%{transform:translate3d(calc(2px * var(--shake-intensity,1)),calc(-1px * var(--shake-intensity,1)),0);}
	      30%{transform:translate3d(calc(-3px * var(--shake-intensity,1)),calc(2px * var(--shake-intensity,1)),0);}
	      40%{transform:translate3d(calc(3px * var(--shake-intensity,1)),calc(-2px * var(--shake-intensity,1)),0);}
	      55%{transform:translate3d(calc(-2px * var(--shake-intensity,1)),calc(1px * var(--shake-intensity,1)),0);}
	      70%{transform:translate3d(calc(2px * var(--shake-intensity,1)),calc(-1px * var(--shake-intensity,1)),0);}
	      100%{transform:translate3d(0,0,0);}
	    }

	    @keyframes tdv-electric-spark-shoot{
	      0%{opacity:0;transform:translate3d(0,0,0) scale(0.2);}
	      8%{opacity:1;transform:translate3d(calc(var(--tx) * 0.2),calc(var(--ty) * 0.2),0) scale(0.8);}
	      100%{opacity:0;transform:translate3d(var(--tx),var(--ty),0) scale(0.2);}
	    }
	  `;

  function ensureElectricStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet("css/themes/electric.css", ELECTRIC_STYLE_ID, ELECTRIC_CSS);
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(ELECTRIC_CSS, ELECTRIC_STYLE_ID);
    }
  }

  const FLOWERS_STYLE_ID = "tdv-flowers-style";
  const FLOWERS_CSS = `
			    #tdv-effects-root .tdv-flowers{position:absolute;inset:0;pointer-events:none;}
			    #tdv-effects-root .tdv-flowers canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}
			  `;

  function ensureFlowersStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet("css/themes/flowers.css", FLOWERS_STYLE_ID, FLOWERS_CSS);
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(FLOWERS_CSS, FLOWERS_STYLE_ID);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  function createFlowersOverlay(ctx, cfg) {
    ensureFlowersStylesInjected();

    const initialCfg = cfg || {};
    function getLiveCfg() {
      try {
        if (ctx && typeof ctx.getConfig === "function") {
          const rootCfg = ctx.getConfig();
          const live = rootCfg && rootCfg.themes ? rootCfg.themes.flowers : null;
          if (live && typeof live === "object") return live;
        }
      } catch {
        // ignore
      }
      return initialCfg;
    }

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-flowers";
    container.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const ctx2d = canvas.getContext("2d", { alpha: true });
    if (!ctx2d) return container;

    const prefersReducedMotion =
      dom && typeof dom.prefersReducedMotion === "function"
        ? dom.prefersReducedMotion(ctx.getConfig && ctx.getConfig())
        : false;

    let stopped = false;
    let rafId = null;
    let resizeTimer = null;
    let frame = 0;

    let w = 1;
    let h = 1;
    let dpr = 1;

    const flowers = [];
    let spawnAccumulatorMs = 0;
    let lastTs = performance.now();

    function clampNum(value, min, max, fallback) {
      const v = Number(value);
      if (!Number.isFinite(v)) return fallback;
      return clamp(v, min, max);
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function hsla(hue, sat, light, alpha) {
      const h2 = ((Number(hue) % 360) + 360) % 360;
      return `hsla(${h2},${clampNum(sat, 0, 100, 0)}%,${clampNum(light, 0, 100, 50)}%,${clampNum(alpha, 0, 1, 1)})`;
    }

    function getDpr() {
      return dom && typeof dom.getEffectiveDevicePixelRatio === "function"
        ? dom.getEffectiveDevicePixelRatio(ctx.getConfig && ctx.getConfig())
        : 1;
    }

    function resize() {
      const size = ctx.getStageSize
        ? ctx.getStageSize()
        : { w: window.innerWidth || 800, h: window.innerHeight || 600 };
      w = Math.max(1, Math.floor(size.w));
      h = Math.max(1, Math.floor(size.h));
      dpr = Math.max(1, Number(getDpr()) || 1);

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      try {
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }
    }

    function computePalette(liveCfg, hueT) {
      const mode = liveCfg && liveCfg.paletteMode ? String(liveCfg.paletteMode) : "magenta";
      const petalHueBase =
        mode === "randomHsl"
          ? rand(0, 360)
          : clampNum(liveCfg.petalHue, 0, 360, 300) +
            (hueT - 0.5) * 2 * clampNum(liveCfg.petalHueVariance, 0, 180, 30);

      const petalSat = clampNum(liveCfg.petalSaturation, 0, 100, 80);
      const petalLight = clampNum(liveCfg.petalLightness, 0, 100, 60);
      const petalAlpha = clampNum(liveCfg.petalAlpha, 0, 1, 0.85);

      const backHue = petalHueBase + clampNum(liveCfg.backPetalHueOffset, -180, 180, -20);
      const backSat = clampNum(liveCfg.backPetalSaturation, 0, 100, 45);
      const backLight = clampNum(liveCfg.backPetalLightness, 0, 100, 45);
      const backAlpha = clampNum(liveCfg.backPetalAlpha, 0, 1, 0.7);

      const centerHueBase =
        clampNum(liveCfg.centerHue, 0, 360, 50) +
        (hueT - 0.5) * 2 * clampNum(liveCfg.centerHueVariance, 0, 180, 20);
      const centerSat = clampNum(liveCfg.centerSaturation, 0, 100, 90);
      const centerLight = clampNum(liveCfg.centerLightness, 0, 100, 60);
      const centerAlpha = clampNum(liveCfg.centerAlpha, 0, 1, 0.9);

      return {
        petal: { h: petalHueBase, s: petalSat, l: petalLight, a: petalAlpha },
        back: { h: backHue, s: backSat, l: backLight, a: backAlpha },
        center: { h: centerHueBase, s: centerSat, l: centerLight, a: centerAlpha },
      };
    }

    class Flower {
      constructor(x, y, bornAt, seed) {
        this.x = x;
        this.y = y;
        this.bornAt = bornAt;
        this.seed = seed;
        this.sizeSeed = Math.random();
        this.styleSeed = Math.random();
        this.petalSeed = Math.random();
        this.backPetalSeed = Math.random();
      }

      isExpired(now, liveCfg) {
        const bloomMs = clampNum(liveCfg.bloomDurationMs, 200, 6000, 1200);
        const lifeMs = clampNum(liveCfg.lifeMs, 0, 600000, 12000);
        const fadeMs = clampNum(liveCfg.fadeOutMs, 0, 60000, 1200);
        return now >= this.bornAt + bloomMs + lifeMs + fadeMs;
      }

      getProgress(now, liveCfg) {
        const bloomMs = clampNum(liveCfg.bloomDurationMs, 200, 6000, 1200);
        if (bloomMs <= 0) return 1;
        return clamp((now - this.bornAt) / bloomMs, 0, 1);
      }

      getOpacity(now, liveCfg) {
        const bloomMs = clampNum(liveCfg.bloomDurationMs, 200, 6000, 1200);
        const lifeMs = clampNum(liveCfg.lifeMs, 0, 600000, 12000);
        const fadeMs = clampNum(liveCfg.fadeOutMs, 0, 60000, 1200);
        const t = now - this.bornAt;
        if (t <= bloomMs + lifeMs) return 1;
        if (fadeMs <= 0) return 0;
        return clamp(1 - (t - (bloomMs + lifeMs)) / fadeMs, 0, 1);
      }

      // eslint-disable-next-line max-lines-per-function
      draw(now, liveCfg) {
        const opacity = this.getOpacity(now, liveCfg);
        if (opacity <= 0) return;

        const p = this.getProgress(now, liveCfg);

        const sizeMin = clampNum(liveCfg.sizeMin, 8, 400, 40);
        const sizeMax = clampNum(liveCfg.sizeMax, 8, 400, 80);
        const size = sizeMin + (sizeMax - sizeMin) * this.sizeSeed;
        const wobbleAmpDeg = clampNum(liveCfg.wobbleAmpPx, 0, 45, 3);
        const wobbleFreq = clampNum(liveCfg.wobbleFreq, 0, 30, 8);
        const wobbleRad = (wobbleAmpDeg * Math.PI) / 180;
        const wobble = Math.sin(now * 0.001 * wobbleFreq + this.seed * 20) * wobbleRad;

        const configuredStyle = liveCfg && liveCfg.style ? String(liveCfg.style) : "ellipse";
        let petalStyle = configuredStyle;
        if (configuredStyle === "random") {
          if (this.styleSeed < 1 / 3) {
            petalStyle = "ellipse";
          } else if (this.styleSeed < 2 / 3) {
            petalStyle = "path";
          } else {
            petalStyle = "rounded";
          }
        }

        const petalMin = Math.round(clampNum(liveCfg.petalCountMin, 1, 24, 5));
        const petalMax = Math.round(clampNum(liveCfg.petalCountMax, 1, 24, 7));
        const petalLo = Math.min(petalMin, petalMax);
        const petalHi = Math.max(petalMin, petalMax);
        const petalCount = clamp(
          Math.floor(petalLo + this.petalSeed * (petalHi - petalLo + 1)),
          petalLo,
          petalHi
        );

        const backMin = Math.round(clampNum(liveCfg.backPetalCountMin, 1, 24, 4));
        const backMax = Math.round(clampNum(liveCfg.backPetalCountMax, 1, 24, 5));
        const backLo = Math.min(backMin, backMax);
        const backHi = Math.max(backMin, backMax);
        const backPetalCount = clamp(
          Math.floor(backLo + this.backPetalSeed * (backHi - backLo + 1)),
          backLo,
          backHi
        );
        const backScale = clampNum(liveCfg.backScale, 0.2, 3, 1.4);
        const frontScale = clampNum(liveCfg.frontScale, 0.2, 3, 1);

        const palette = computePalette(liveCfg, this.seed);

        const petalColor = hsla(
          palette.petal.h,
          palette.petal.s,
          palette.petal.l,
          palette.petal.a * opacity
        );
        const backColor = hsla(
          palette.back.h,
          palette.back.s,
          palette.back.l,
          palette.back.a * opacity
        );
        const centerColor = hsla(
          palette.center.h,
          palette.center.s,
          palette.center.l,
          palette.center.a * opacity
        );

        // Petals-only: anchor the bloom at the spawn point.
        const flowerX = this.x;
        const flowerY = this.y;
        const bloomRotation = ((45 * Math.PI) / 180) * p;
        const baseRotation = bloomRotation + wobble;

        function drawPetals(count, rotation, scale, color, progress, isBack) {
          if (progress <= 0) return;

          const currentSize = size * scale * Math.pow(progress, 0.3);
          ctx2d.save();
          ctx2d.translate(flowerX, flowerY);
          ctx2d.rotate(rotation);

          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            ctx2d.save();
            ctx2d.rotate(angle);

            const petalDistance = currentSize * 0.35;
            const petalSize = currentSize * 0.45;
            ctx2d.shadowBlur = isBack
              ? clampNum(liveCfg.petalGlowBlurBack, 0, 80, 15)
              : clampNum(liveCfg.petalGlowBlurFront, 0, 120, 25);
            ctx2d.shadowColor = color;

            const gradient = ctx2d.createRadialGradient(
              0,
              -petalDistance,
              0,
              0,
              -petalDistance,
              petalSize
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.6, color);
            gradient.addColorStop(
              1,
              color.replace("hsla(", "hsla(").replace(/,([0-9.]+)\)$/, ",0)")
            );

            ctx2d.fillStyle = gradient;
            ctx2d.beginPath();
            if (petalStyle === "path" || petalStyle === "rounded") {
              const petalLen = petalDistance + petalSize * 0.55;
              const s = Math.max(0.001, petalLen / 22);
              ctx2d.save();
              ctx2d.scale(s, s);
              ctx2d.moveTo(0, 0);
              if (petalStyle === "rounded") {
                ctx2d.quadraticCurveTo(-10, -10, -5, -20);
                ctx2d.quadraticCurveTo(0, -22, 5, -20);
                ctx2d.quadraticCurveTo(10, -10, 0, 0);
              } else {
                ctx2d.quadraticCurveTo(-8, -12, 0, -22);
                ctx2d.quadraticCurveTo(8, -12, 0, 0);
              }
              ctx2d.closePath();
              ctx2d.restore();
            } else {
              const rx = petalSize * 0.55;
              const ry = petalSize * 0.85;
              ctx2d.ellipse(0, -petalDistance, rx, ry, 0, 0, Math.PI * 2);
            }
            ctx2d.fill();

            if (!isBack) {
              ctx2d.shadowBlur = 0;
              const highlightAlpha = clampNum(liveCfg.petalHighlightAlpha, 0, 1, 0.4) * opacity;
              const highlightGradient = ctx2d.createRadialGradient(
                -petalSize * 0.2,
                -petalDistance - petalSize * 0.2,
                0,
                0,
                -petalDistance,
                petalSize * 0.6
              );
              highlightGradient.addColorStop(0, `rgba(255,255,255,${highlightAlpha})`);
              highlightGradient.addColorStop(1, "rgba(255,255,255,0)");
              ctx2d.fillStyle = highlightGradient;
              ctx2d.beginPath();
              ctx2d.arc(0, -petalDistance, petalSize * 0.6, 0, Math.PI * 2);
              ctx2d.fill();
            }

            ctx2d.restore();
          }

          ctx2d.restore();
        }

        const backProgress = Math.max(0, (p - 0.15) * 2.5);
        const angleOffset = Math.sin(p * Math.PI) * 0.15;
        drawPetals(
          backPetalCount,
          baseRotation + angleOffset,
          backScale,
          backColor,
          backProgress,
          true
        );

        const frontProgress = Math.max(0, (p - 0.25) * 2);
        drawPetals(petalCount, baseRotation, frontScale, petalColor, frontProgress, false);

        if (p > 0.3) {
          const centerProgress = (p - 0.3) / 0.7;
          const centerSize = size * 0.25 * clamp(centerProgress, 0, 1);
          ctx2d.save();
          ctx2d.shadowBlur = clampNum(liveCfg.centerGlowBlur, 0, 120, 20);
          ctx2d.shadowColor = centerColor;
          const centerGradient = ctx2d.createRadialGradient(
            flowerX - centerSize * 0.2,
            flowerY - centerSize * 0.2,
            0,
            flowerX,
            flowerY,
            centerSize
          );
          centerGradient.addColorStop(0, centerColor);
          centerGradient.addColorStop(0.7, centerColor);
          centerGradient.addColorStop(
            1,
            centerColor.replace("hsla(", "hsla(").replace(/,([0-9.]+)\)$/, ",0.5)")
          );
          ctx2d.fillStyle = centerGradient;
          ctx2d.beginPath();
          ctx2d.arc(flowerX, flowerY, centerSize, 0, Math.PI * 2);
          ctx2d.fill();

          ctx2d.shadowBlur = 0;
          const ch = clampNum(liveCfg.centerHighlightAlpha, 0, 1, 0.6) * opacity;
          ctx2d.fillStyle = `rgba(255,255,255,${ch})`;
          ctx2d.beginPath();
          ctx2d.arc(
            flowerX - centerSize * 0.15,
            flowerY - centerSize * 0.15,
            centerSize * 0.4,
            0,
            Math.PI * 2
          );
          ctx2d.fill();
          ctx2d.restore();
        }
      }
    }

    function pickSpawnPoint(liveCfg) {
      const mode = liveCfg && liveCfg.spawnMode ? String(liveCfg.spawnMode) : "random";
      const xPadding = clampNum(liveCfg.xPaddingPercent, 0, 45, 5) / 100;
      const xMin = w * xPadding;
      const xMax = w * (1 - xPadding);

      const yMin = clampNum(liveCfg.yMinPercent, 0, 100, 55) / 100;
      const yMax = clampNum(liveCfg.yMaxPercent, 0, 100, 95) / 100;
      const yyMin = h * Math.min(yMin, yMax);
      const yyMax = h * Math.max(yMin, yMax);

      if (mode === "custom") {
        const cx = (clampNum(liveCfg.customXPercent, 0, 100, 50) / 100) * w;
        const cy = (clampNum(liveCfg.customYPercent, 0, 100, 78) / 100) * h;
        const sx = (clampNum(liveCfg.spreadXPercent, 0, 100, 40) / 100) * w;
        const sy = (clampNum(liveCfg.spreadYPercent, 0, 100, 30) / 100) * h;
        return {
          x: clamp(cx + rand(-sx * 0.5, sx * 0.5), xMin, xMax),
          y: clamp(cy + rand(-sy * 0.5, sy * 0.5), 0, h),
        };
      }

      if (mode === "bottomBand") {
        const bandMin = clampNum(liveCfg.yMinPercent, 0, 100, 70) / 100;
        const bandMax = clampNum(liveCfg.yMaxPercent, 0, 100, 95) / 100;
        const byMin = h * Math.min(bandMin, bandMax);
        const byMax = h * Math.max(bandMin, bandMax);
        return { x: rand(xMin, xMax), y: rand(byMin, byMax) };
      }

      return { x: rand(xMin, xMax), y: rand(yyMin, yyMax) };
    }

    function spawnFlower(now, liveCfg) {
      const maxFlowers = Math.round(clampNum(liveCfg.maxFlowers, 0, 200, 30));
      if (maxFlowers <= 0) return false;
      while (flowers.length >= maxFlowers) flowers.shift();

      const point = pickSpawnPoint(liveCfg);
      flowers.push(new Flower(point.x, point.y, now, Math.random()));
      return true;
    }

    function draw(now, liveCfg) {
      ctx2d.clearRect(0, 0, w, h);
      for (let i = 0; i < flowers.length; i++) {
        flowers[i].draw(now, liveCfg);
      }
    }

    function loop(now) {
      if (stopped) return;
      if (!container.isConnected) {
        stop();
        return;
      }

      const liveCfg = getLiveCfg();
      const dt = Math.max(0, now - lastTs);
      lastTs = now;

      const spawnRate = clampNum(liveCfg.spawnRatePerSec, 0, 10, 0.35);
      const spawnInterval = spawnRate > 0 ? 1000 / spawnRate : Infinity;
      spawnAccumulatorMs += dt;

      let needsRedraw = false;

      if (!prefersReducedMotion) {
        while (spawnAccumulatorMs >= spawnInterval) {
          spawnAccumulatorMs -= spawnInterval;
          if (spawnFlower(now, liveCfg)) needsRedraw = true;
        }
      }

      // Clean up expired flowers and check if any are animating or fading.
      let hasActive = false;
      for (let i = flowers.length - 1; i >= 0; i--) {
        const flower = flowers[i];
        if (flower.isExpired(now, liveCfg)) {
          flowers.splice(i, 1);
          needsRedraw = true;
          continue;
        }
        hasActive = true;
        const p = flower.getProgress(now, liveCfg);
        const o = flower.getOpacity(now, liveCfg);
        if (p < 1 || o < 1) needsRedraw = true;
      }

      // Reduced motion: render at ~30fps and never auto-spawn.
      if (prefersReducedMotion) {
        frame += 1;
        if (frame % 2 === 0 && (hasActive || needsRedraw)) {
          draw(now, liveCfg);
        }
      } else if (needsRedraw) {
        draw(now, liveCfg);
      }

      rafId = requestAnimationFrame(loop);
    }

    function onResize() {
      if (stopped) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (stopped) return;
        resize();
      }, 120);
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      try {
        if (rafId) cancelAnimationFrame(rafId);
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

    container._stopFlowers = stop;
    window.addEventListener("resize", onResize, { passive: true });
    resize();

    // Optional initial burst for quick visual feedback.
    const burst = Math.round(clampNum(getLiveCfg().initialBurst, 0, 50, 3));
    for (let i = 0; i < burst; i++) {
      spawnFlower(performance.now(), getLiveCfg());
    }

    rafId = requestAnimationFrame(loop);
    return container;
  }

  const STORM_STYLE_ID = "tdv-storm-style";
  const STORM_CSS = `
			    #tdv-effects-root .tdv-storm{position:absolute;inset:0;overflow:hidden;}

		    #tdv-effects-root .tdv-storm .tdv-storm-bg{
		      background:linear-gradient(to bottom, #0a0e27 0%, #1a1f3a 50%, #0d1221 100%);
		      width:100%;
		      height:100%;
		      position:absolute;
		      top:0;
		      left:0;
		      z-index:100;
		      transition:ease-out 250ms;
		      animation:tdv-storm-lightning var(--tdv-storm-cycle,6000ms) infinite;
		    }

		    #tdv-effects-root .tdv-storm canvas.tdv-storm-rain{
		      width:100%;
		      height:100%;
		      position:absolute;
		      top:0;
		      left:0;
		      z-index:200;
		      pointer-events:none;
		    }

		    #tdv-effects-root .tdv-storm .tdv-storm-bolt{
		      position:absolute;
		      width:100%;
		      height:100%;
		      top:0;
		      left:0;
		      z-index:150;
		      pointer-events:none;
		      opacity:0;
		    }

		    #tdv-effects-root .tdv-storm .tdv-storm-bolt svg{width:100%;height:100%;}

		    @keyframes tdv-storm-lightning{
		      0%,100%{filter:opacity(0.5) grayscale(80%) contrast(4) brightness(0.2);}
		      8%{filter:opacity(0.5) grayscale(80%) contrast(4) brightness(0.2);}
		      9.5%{filter:opacity(1) grayscale(0%) contrast(1) brightness(1);}
		      10%{filter:opacity(0.5) grayscale(80%) contrast(4) brightness(0.2);}
		      73%{filter:opacity(0.5) grayscale(80%) contrast(4) brightness(0.2);}
		      75%{filter:opacity(1) grayscale(0%) contrast(1) brightness(1);}
		      77%{filter:opacity(0.5) grayscale(80%) contrast(4) brightness(0.2);}
		      80%{filter:opacity(1) grayscale(0%) contrast(1) brightness(1);}
		      90%{filter:opacity(0.5) grayscale(80%) contrast(4) brightness(0.2);}
		    }

		    @keyframes tdv-storm-bolt-flash{
		      0%,100%{opacity:0;}
		      10%{opacity:1;}
		      15%{opacity:0;}
		      20%{opacity:0.8;}
		      25%{opacity:0;}
		    }

		    #tdv-effects-root .tdv-storm .tdv-storm-bolt.bolt-1{animation:tdv-storm-bolt-flash 500ms;animation-delay:0.57s;}
		    #tdv-effects-root .tdv-storm .tdv-storm-bolt.bolt-2{animation:tdv-storm-bolt-flash 600ms;animation-delay:4.5s;}
		    #tdv-effects-root .tdv-storm .tdv-storm-bolt.bolt-3{animation:tdv-storm-bolt-flash 550ms;animation-delay:4.65s;}
		    #tdv-effects-root .tdv-storm .tdv-storm-bolt.bolt-4{animation:tdv-storm-bolt-flash 500ms;animation-delay:4.8s;}
		  `;

  function ensureStormStylesInjected() {
    if (!dom) return;
    if (typeof dom.ensureStylesheet === "function") {
      dom.ensureStylesheet("css/themes/storm.css", STORM_STYLE_ID, STORM_CSS);
      return;
    }
    if (typeof dom.injectStyles === "function") {
      dom.injectStyles(STORM_CSS, STORM_STYLE_ID);
    }
  }

  // eslint-disable-next-line max-lines-per-function
  function createStormOverlay(ctx, cfg) {
    ensureStormStylesInjected();

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-storm";
    container.setAttribute("aria-hidden", "true");

    const bgOpacity = clamp(Number(cfg.backgroundOpacity), 0, 1);
    const lightningCycleMs = Math.max(1000, Math.round(Number(cfg.lightningCycleMs) || 6000));

    const background = document.createElement("div");
    background.className = "tdv-storm-bg";
    background.style.opacity = Number.isFinite(bgOpacity) ? String(bgOpacity) : "0.35";
    background.style.setProperty("--tdv-storm-cycle", `${lightningCycleMs}ms`);
    container.appendChild(background);

    function createBoltSvg(pathD, preserveAspect, opacity, glowId) {
      return (
        `<svg viewBox="0 0 100 100" preserveAspectRatio="${preserveAspect}">` +
        `<defs><filter id="${glowId}">` +
        `<feGaussianBlur stdDeviation="2" result="coloredBlur"/>` +
        `<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>` +
        `</filter></defs>` +
        `<path d="${pathD}" fill="#fff" filter="url(#${glowId})" opacity="${opacity}"/>` +
        `</svg>`
      );
    }

    const bolts = [];
    const boltDefs = [
      {
        className: "bolt-1",
        preserve: "xMidYMin slice",
        opacity: "0.9",
        path: "M 50 0 L 45 30 L 48 30 L 42 55 L 46 55 L 40 80 L 50 50 L 46 50 L 52 25 L 48 25 Z",
      },
      {
        className: "bolt-2",
        preserve: "xMaxYMin slice",
        opacity: "0.85",
        path: "M 70 0 L 65 25 L 68 25 L 60 45 L 64 45 L 55 70 L 65 40 L 61 40 L 68 18 L 64 18 Z",
      },
      {
        className: "bolt-3",
        preserve: "xMidYMin slice",
        opacity: "0.8",
        path: "M 55 5 L 50 28 L 53 28 L 47 50 L 51 50 L 43 75 L 53 48 L 49 48 L 56 22 L 52 22 Z",
      },
      {
        className: "bolt-4",
        preserve: "xMinYMin slice",
        opacity: "0.9",
        path: "M 30 0 L 26 32 L 29 32 L 22 58 L 26 58 L 18 85 L 28 52 L 24 52 L 32 20 L 28 20 Z",
      },
    ];

    for (let i = 0; i < boltDefs.length; i++) {
      const boltCfg = boltDefs[i];
      const bolt = document.createElement("div");
      bolt.className = `tdv-storm-bolt ${boltCfg.className}`;
      const glowId =
        helpers && typeof helpers.generateId === "function"
          ? helpers.generateId("tdv-storm-glow")
          : "tdv-storm-glow";
      bolt.innerHTML = createBoltSvg(boltCfg.path, boltCfg.preserve, boltCfg.opacity, glowId);
      container.appendChild(bolt);
      bolts.push(bolt);
    }

    const canvas = document.createElement("canvas");
    canvas.className = "tdv-storm-rain";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    const ctxRain = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let rafId = null;
    let stopped = false;

    const configAll = ctx && typeof ctx.getConfig === "function" ? ctx.getConfig() : null;

    const requestedCount = Math.round(Number(cfg.rainCount) || 500);
    const scaledCount =
      dom && typeof dom.scaleCount === "function"
        ? dom.scaleCount(requestedCount, configAll, 120)
        : requestedCount;
    const rainCount = clamp(scaledCount, 40, 1600);

    const width = clamp(Number(cfg.rainWidth) || 1, 0.5, 4);
    const lengthMin = Number.isFinite(Number(cfg.rainLengthMin)) ? Number(cfg.rainLengthMin) : 0;
    const lengthMax = Number.isFinite(Number(cfg.rainLengthMax)) ? Number(cfg.rainLengthMax) : 4;
    const opacityMin = clamp(Number(cfg.rainOpacityMin), 0, 1);
    const opacityMax = clamp(Number(cfg.rainOpacityMax), 0, 1);

    const windXMin = Number.isFinite(Number(cfg.windXMin)) ? Number(cfg.windXMin) : -3;
    const windXMax = Number.isFinite(Number(cfg.windXMax)) ? Number(cfg.windXMax) : -1;
    const speedYMin = Number.isFinite(Number(cfg.speedYMin)) ? Number(cfg.speedYMin) : 7;
    const speedYMax = Number.isFinite(Number(cfg.speedYMax)) ? Number(cfg.speedYMax) : 15;

    const boltStartDelayMs = Math.max(0, Math.round(Number(cfg.randomBoltStartDelayMs) || 8000));
    const boltDelayMinMs = Math.max(0, Math.round(Number(cfg.randomBoltDelayMinMs) || 3000));
    const boltDelayMaxMs = Math.max(
      boltDelayMinMs,
      Math.round(Number(cfg.randomBoltDelayMaxMs) || 7000)
    );
    const boltDurMinMs = Math.max(60, Math.round(Number(cfg.randomBoltDurationMinMs) || 400));
    const boltDurMaxMs = Math.max(
      boltDurMinMs,
      Math.round(Number(cfg.randomBoltDurationMaxMs) || 600)
    );

    let boltTimer = null;
    let boltStartTimer = null;

    const rainArray = [];

    function randRange(a, b) {
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      return rand(min, max);
    }

    function populateRain() {
      rainArray.length = 0;
      const opacityLo = Number.isFinite(opacityMin) ? opacityMin : 0.1;
      const opacityHi = Number.isFinite(opacityMax) ? opacityMax : 0.3;
      for (let i = 0; i < rainCount; i++) {
        rainArray.push({
          x: Math.random() * w * 1.2,
          y: Math.random() * h,
          width: width,
          length: randRange(lengthMin, lengthMax),
          opacity: randRange(opacityLo, opacityHi),
          speedX: randRange(windXMin, windXMax),
          speedY: randRange(speedYMin, speedYMax),
        });
      }
    }

    function resize() {
      const size =
        ctx && typeof ctx.getStageSize === "function"
          ? ctx.getStageSize()
          : { w: window.innerWidth, h: window.innerHeight };
      w = Math.max(1, Math.round(size.w || window.innerWidth || 800));
      h = Math.max(1, Math.round(size.h || window.innerHeight || 600));
      dpr =
        dom && typeof dom.getEffectiveDevicePixelRatio === "function"
          ? dom.getEffectiveDevicePixelRatio(configAll)
          : Number(window.devicePixelRatio) || 1;
      dpr = Math.max(1, dpr);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      try {
        ctxRain.setTransform(dpr, 0, 0, dpr, 0, 0);
      } catch {
        // ignore
      }
      populateRain();
    }

    function moveRaindrops() {
      for (let i = 0; i < rainArray.length; i++) {
        const raindrop = rainArray[i];
        raindrop.x += raindrop.speedX;
        raindrop.y += raindrop.speedY;
        if (raindrop.y > h) {
          raindrop.x = Math.random() * w * 1.2;
          raindrop.y = -20;
        }
      }
    }

    function drawRaindrops() {
      for (let i = 0; i < rainArray.length; i++) {
        const raindrop = rainArray[i];
        const startX = raindrop.x;
        const startY = raindrop.y;
        const endX = raindrop.x + raindrop.speedX * raindrop.length;
        const endY = raindrop.y + raindrop.speedY * raindrop.length;
        const grad = ctxRain.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, `rgba(255,255,255,${raindrop.opacity})`);
        ctxRain.beginPath();
        ctxRain.moveTo(startX, startY);
        ctxRain.lineTo(endX, endY);
        ctxRain.strokeStyle = grad;
        ctxRain.lineWidth = raindrop.width;
        ctxRain.lineCap = "round";
        ctxRain.stroke();
      }
    }

    function updateRain() {
      ctxRain.clearRect(0, 0, w, h);
      moveRaindrops();
      drawRaindrops();
    }

    function animate() {
      if (stopped || !container.parentNode) return;
      updateRain();
      rafId = requestAnimationFrame(animate);
    }

    function triggerRandomBolt() {
      if (stopped || !container.parentNode) return;
      if (!bolts.length) return;
      const randomBolt = bolts[Math.floor(Math.random() * bolts.length)];
      randomBolt.style.animation = "none";
      void randomBolt.offsetWidth;
      const duration = Math.round(randRange(boltDurMinMs, boltDurMaxMs));
      randomBolt.style.animation = `tdv-storm-bolt-flash ${duration}ms`;
      const nextDelay = Math.round(randRange(boltDelayMinMs, boltDelayMaxMs));
      boltTimer = setTimeout(triggerRandomBolt, nextDelay);
    }

    const onResizeHandler = () => resize();
    window.addEventListener("resize", onResizeHandler);

    resize();
    rafId = requestAnimationFrame(animate);
    boltStartTimer = setTimeout(triggerRandomBolt, boltStartDelayMs);

    container._stopStorm = () => {
      stopped = true;
      try {
        window.removeEventListener("resize", onResizeHandler);
      } catch {
        // ignore
      }
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (boltTimer) clearTimeout(boltTimer);
      boltTimer = null;
      if (boltStartTimer) clearTimeout(boltStartTimer);
      boltStartTimer = null;
      if (container.parentNode) container.parentNode.removeChild(container);
    };

    return container;
  }

  // eslint-disable-next-line max-lines-per-function
  function createFallingStarsOverlay(ctx, cfg) {
    const { getStageSize } = ctx;
    const size = getStageSize();

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-falling-stars";
    container.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";

    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return container;

    // Star themes
    const STAR_THEMES = {
      blue: {
        hueStart: 200,
        hueRange: 30,
        gradient: ["#010810", "#2a4770"],
      },
      purple: {
        hueStart: 280,
        hueRange: 30,
        gradient: ["#0a0015", "#3d1770"],
      },
      red: {
        hueStart: 350,
        hueRange: 30,
        gradient: ["#100508", "#702a2a"],
      },
      orange: {
        hueStart: 30,
        hueRange: 30,
        gradient: ["#100a05", "#704a2a"],
      },
    };

    // Configuration
    const config = {
      spawnRate: Number(cfg.spawnRate) || 20,
      baseSize: Number(cfg.baseSize) || 20,
      sizeVariation: Number(cfg.sizeVariation) || 0.2,
      gravity: Number(cfg.gravity) || 0.005,
      maxVelocity: Number(cfg.maxVelocity) || 10,
      velocityVariation: Number(cfg.velocityVariation) || 4,
      rotationSpeed: Number(cfg.rotationSpeed) || 0.1,
      shrinkRate: Number(cfg.shrinkRate) || 0.01,
      fadeRate: Number(cfg.fadeRate) || 0.01,
      theme: cfg.theme || "blue",
      screenBlend: cfg.screenBlend !== false,
      shadowBlur: Number(cfg.shadowBlur) || 20,
      spawnMode: cfg.spawnMode || "rain",
      mouseTrail: cfg.mouseTrail !== false,
      mouseRandomness: Number(cfg.mouseRandomness) || 25,
      explosionSize: Number(cfg.explosionSize) || 50,
      reverse: cfg.reverse === true,
      useCircleClip: cfg.useCircleClip === true,
    };

    const stars = [];
    const mouse = {
      x: size.w / 2,
      y: -10,
    };
    let lastSpawnTime = 0;
    let clipSize = Math.min(size.w / 2 - 4, size.h / 2 - 4);
    let animationFrame = null;
    let isAnimating = true;
    const currentSize = { w: size.w, h: size.h };

    // Star class
    class Star {
      constructor(x, y, kaboom = false) {
        const theme = STAR_THEMES[config.theme] || STAR_THEMES.blue;
        this.scale = (Math.random() + config.sizeVariation) * config.baseSize;
        this.scaleSpeed = Math.random() / 5 + config.shrinkRate;
        this.x = x !== undefined ? x : Math.random() * currentSize.w;
        this.y = y !== undefined ? y : Math.random() * currentSize.h;
        this.vx = (Math.random() - 0.5) * (kaboom ? 10 : config.velocityVariation);

        if (kaboom) {
          this.vy = (Math.random() - 0.5) * 10;
        } else {
          this.vy = config.reverse ? -(Math.random() * 3) : Math.random() * 3;
        }

        this.opacity = 1;
        this.opacitySpeed = Math.random() / 100 + config.fadeRate;
        this.rotate = Math.random() * Math.PI;
        this.rotateSpeed = (Math.random() - 0.5) * config.rotationSpeed;
        this.color = `hsl(${~~(Math.random() * theme.hueRange) + theme.hueStart}, 60%, 60%)`;

        // Calculate star points
        this.out = [];
        this.in = [];
        for (let i = 0; i < 5; i++) {
          const x = Math.cos((i / 5) * Math.PI * 2) * this.scale;
          const y = Math.sin((i / 5) * Math.PI * 2) * this.scale;
          this.out.push([x, y]);

          const x2 = Math.cos(((i + 0.5) / 5) * Math.PI * 2) * this.scale * 0.5;
          const y2 = Math.sin(((i + 0.5) / 5) * Math.PI * 2) * this.scale * 0.5;
          this.in.push([x2, y2]);
        }

        this.createStarImage();
      }

      createStarImage() {
        this.image = document.createElement("canvas");
        this.image.width = this.scale * 4;
        this.image.height = this.scale * 4;
        const ctx = this.image.getContext("2d");
        if (!ctx) return;

        ctx.translate(this.scale * 2, this.scale * 2);
        ctx.beginPath();
        ctx.moveTo(this.in[0][0], this.in[0][1]);

        for (let i = 0; i < 5; i++) {
          ctx.bezierCurveTo(
            this.out[i][0],
            this.out[i][1],
            this.out[i][0],
            this.out[i][1],
            this.in[i][0],
            this.in[i][1]
          );
        }

        ctx.bezierCurveTo(
          this.out[0][0],
          this.out[0][1],
          this.out[0][0],
          this.out[0][1],
          this.in[0][0],
          this.in[0][1]
        );

        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = config.shadowBlur;
        ctx.fill();
      }

      update() {
        this.rotate += this.rotateSpeed;
        this.scale = Math.max(0, this.scale - this.scaleSpeed);

        if (config.reverse) {
          this.vy = Math.max(-config.maxVelocity, this.vy - config.gravity);
        } else {
          this.vy = Math.min(config.maxVelocity, this.vy + config.gravity);
        }

        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= this.opacitySpeed;
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(this.opacity, 0);
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale / config.baseSize, this.scale / config.baseSize);
        ctx.rotate(this.rotate);
        ctx.drawImage(this.image, -this.scale, -this.scale);
        ctx.restore();
      }

      isOutOfBounds() {
        return (
          this.x - this.scale > currentSize.w ||
          this.x + this.scale < 0 ||
          this.y - this.scale > currentSize.h ||
          this.y + this.scale < 0 ||
          this.opacity <= 0
        );
      }
    }

    // Resize
    function resize() {
      const newSize = getStageSize();
      canvas.width = newSize.w;
      canvas.height = newSize.h;
      currentSize.w = newSize.w;
      currentSize.h = newSize.h;
      clipSize = Math.min(newSize.w / 2 - 4, newSize.h / 2 - 4);

      canvasCtx.shadowBlur = config.shadowBlur;

      if (config.screenBlend && navigator.userAgent.toLowerCase().indexOf("firefox") === -1) {
        canvasCtx.globalCompositeOperation = "screen";
      } else {
        canvasCtx.globalCompositeOperation = "source-over";
      }

      if (config.useCircleClip) {
        canvasCtx.arc(newSize.w / 2, newSize.h / 2, clipSize, 0, Math.PI * 2, false);
        canvasCtx.clip();
      }
    }

    // Mouse handling
    function handleMouseMove(e) {
      mouse.x = e.clientX + (Math.random() - 0.5) * config.mouseRandomness;
      mouse.y = e.clientY + (Math.random() - 0.5) * config.mouseRandomness;

      if (config.useCircleClip) {
        mouse.x = Math.min(
          (currentSize.w - clipSize * 2) / 2 + clipSize * 2,
          Math.max(mouse.x, (currentSize.w - clipSize * 2) / 2)
        );
      }
    }

    function handleClick() {
      for (let i = 0; i < config.explosionSize; i++) {
        stars.push(new Star(mouse.x, mouse.y, true));
      }
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    // Animation loop
    function render(timestamp) {
      if (!isAnimating) return;

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      if (config.useCircleClip) {
        canvasCtx.beginPath();
        canvasCtx.arc(canvas.width / 2, canvas.height / 2, clipSize, 0, Math.PI * 2, false);

        const theme = STAR_THEMES[config.theme] || STAR_THEMES.blue;
        const gradient = canvasCtx.createRadialGradient(
          0,
          0,
          200,
          100,
          canvas.height / 2,
          canvas.width
        );
        gradient.addColorStop(0, theme.gradient[0]);
        gradient.addColorStop(1, theme.gradient[1]);
        canvasCtx.fillStyle = gradient;
        canvasCtx.fill();
      }

      // Spawn stars based on mode
      if (timestamp - lastSpawnTime > config.spawnRate) {
        if (config.spawnMode === "rain") {
          // Spawn from top of screen
          const x = Math.random() * canvas.width;
          const y = -config.baseSize;
          stars.push(new Star(x, y));
        } else if (config.spawnMode === "mouse" && config.mouseTrail) {
          // Spawn from mouse position
          stars.push(new Star(mouse.x, mouse.y));
        } else if (config.spawnMode === "both") {
          // Spawn from both top and mouse
          if (Math.random() < 0.5) {
            const x = Math.random() * canvas.width;
            const y = -config.baseSize;
            stars.push(new Star(x, y));
          } else if (config.mouseTrail) {
            stars.push(new Star(mouse.x, mouse.y));
          }
        }
        lastSpawnTime = timestamp;
      }

      // Update and draw stars
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.update();
        star.draw(canvasCtx);

        if (star.isOutOfBounds()) {
          stars.splice(i, 1);
        }
      }

      animationFrame = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    animationFrame = requestAnimationFrame(render);

    // Cleanup
    container._stopFallingStars = function () {
      isAnimating = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    return container;
  }

  // eslint-disable-next-line max-lines-per-function
  function createElectricOverlay(ctx, cfg) {
    ensureElectricStylesInjected();

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-electric";

    const minDelay = Number(cfg.minDelay) || 50;
    const maxDelay = Number(cfg.maxDelay) || 600;
    const chaosChance = clamp(Number(cfg.chaosChance) || 0.3, 0, 1);
    const boltColor = cfg.boltColor || "#6bfeff";
    const branchColor = cfg.branchColor || "#f6de8d";
    const flashIntensity = clamp(Number(cfg.flashIntensity) || 0.6, 0, 1);
    const shakeIntensity = clamp(Number(cfg.shakeIntensity) || 1.0, 0, 2);
    const sparkCount = clamp(Number(cfg.sparkCount) || 12, 0, 50);
    const boltWidth = clamp(Number(cfg.boltWidth) || 2, 1, 10);
    const displacement = clamp(Number(cfg.displacement) || 100, 20, 300);

    // Create SVG for lightning bolts
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";

    // Add SVG filters
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <filter id="tdv-electric-glow">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0 0 0 0 1 0 0 0 0 18 -7" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
      </filter>
      <filter id="tdv-electric-distort">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" result="turbulence"></feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="20" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
      </filter>
    `;
    svg.appendChild(defs);

    // Create flash overlay
    const flashOverlay = document.createElement("div");
    flashOverlay.style.cssText = `position:absolute;inset:0;background:white;opacity:0;pointer-events:none;mix-blend-mode:overlay;transition:opacity 0.2s ease-out;`;

    // Create spark container
    const sparkContainer = document.createElement("div");
    sparkContainer.style.cssText = "position:absolute;inset:0;pointer-events:none;";

    container.appendChild(svg);
    container.appendChild(flashOverlay);
    container.appendChild(sparkContainer);

    function generateBoltPath(startX, startY, endX, endY, displace) {
      let path = `M ${startX} ${startY}`;
      const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const segments = Math.floor(dist / 15);

      const dx = (endX - startX) / segments;
      const dy = (endY - startY) / segments;

      let currentX = startX;
      let currentY = startY;

      for (let i = 0; i < segments; i++) {
        const offsetX = (Math.random() - 0.5) * displace;
        const offsetY = (Math.random() - 0.5) * displace;

        currentX += dx + offsetX;
        currentY += dy + offsetY;

        path += ` L ${currentX} ${currentY}`;
      }

      path += ` L ${endX} ${endY}`;
      return path;
    }

    function createExplosionSparks(x, y) {
      const count = sparkCount + Math.random() * (sparkCount / 2);
      for (let i = 0; i < count; i++) {
        const spark = document.createElement("div");
        spark.style.cssText = `position:absolute;background:#fff;border-radius:50%;box-shadow:0 0 8px ${boltColor};opacity:0;animation:tdv-electric-spark-shoot 0.5s ease-out forwards;`;

        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        const size = 2 + Math.random() * 3;
        spark.style.width = `${size}px`;
        spark.style.height = `${size}px`;

        const angle = Math.random() * Math.PI * 2;
        const velocity = 30 + Math.random() * 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        spark.style.setProperty("--tx", `${tx}px`);
        spark.style.setProperty("--ty", `${ty}px`);

        sparkContainer.appendChild(spark);

        setTimeout(() => {
          if (spark.parentNode) spark.parentNode.removeChild(spark);
        }, 600);
      }
    }

    function triggerLightning() {
      const { w, h } = ctx.getStageSize();

      // Clear old paths
      const oldPaths = svg.querySelectorAll("path");
      oldPaths.forEach((p) => p.parentNode.removeChild(p));

      // Decide number of bolts
      const numBolts = Math.random() < chaosChance ? Math.floor(Math.random() * 3) + 2 : 1;

      const anchorX = Math.random() * w;
      const anchorY = Math.random() * h;

      for (let i = 0; i < numBolts; i++) {
        const startX = i === 0 ? Math.random() * w : anchorX;
        const startY = i === 0 ? Math.random() * h : anchorY;
        const endX = i === 0 ? anchorX : Math.random() * w;
        const endY = i === 0 ? anchorY : Math.random() * h;

        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", generateBoltPath(startX, startY, endX, endY, displacement));
        pathElement.setAttribute("stroke", boltColor);
        pathElement.setAttribute("stroke-width", Math.random() * boltWidth + 1);
        pathElement.setAttribute("fill", "none");
        pathElement.setAttribute("filter", "url(#tdv-electric-distort)");
        pathElement.style.mixBlendMode = "screen";

        svg.appendChild(pathElement);

        setTimeout(() => {
          pathElement.style.transition = "opacity 0.1s";
          pathElement.style.opacity = "0";
          setTimeout(() => {
            if (pathElement.parentNode) pathElement.parentNode.removeChild(pathElement);
          }, 100);
        }, 50);

        // Branch occasionally
        if (Math.random() > 0.5) {
          const branch = document.createElementNS("http://www.w3.org/2000/svg", "path");
          branch.setAttribute(
            "d",
            generateBoltPath(
              anchorX,
              anchorY,
              Math.random() * w,
              Math.random() * h,
              displacement * 0.4
            )
          );
          branch.setAttribute("stroke", branchColor);
          branch.setAttribute("stroke-width", "1");
          branch.setAttribute("fill", "none");
          branch.setAttribute("filter", "url(#tdv-electric-distort)");
          branch.style.mixBlendMode = "screen";
          svg.appendChild(branch);

          setTimeout(() => {
            if (branch.parentNode) branch.parentNode.removeChild(branch);
          }, 50);
        }
      }

      // Flash
      flashOverlay.style.transition = "none";
      flashOverlay.style.opacity = flashIntensity;
      setTimeout(() => {
        flashOverlay.style.transition = "opacity 0.2s ease-out";
        flashOverlay.style.opacity = "0";
      }, 40);

      // Screen shake
      if (shakeIntensity > 0) {
        container.classList.remove("tdv-electric-shake");
        void container.offsetWidth;
        container.style.setProperty("--shake-intensity", shakeIntensity);
        container.classList.add("tdv-electric-shake");
      }

      // Sparks
      if (sparkCount > 0) {
        createExplosionSparks(anchorX, anchorY);
      }
    }

    function mainLoop() {
      if (!container.parentNode) return; // Stop if removed
      triggerLightning();
      const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      container._electricTimeout = setTimeout(mainLoop, delay);
    }

    // Start the loop after the element is appended to the DOM (prevents a no-op first run).
    container._electricTimeout = setTimeout(mainLoop, 0);

    // Cleanup function
    container._stopElectric = function () {
      if (container._electricTimeout) {
        clearTimeout(container._electricTimeout);
        container._electricTimeout = null;
      }
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    return container;
  }

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

  function createChristmasLightsOverlay(ctx, cfg) {
    ensureChristmasLightsStylesInjected();

    const container = document.createElement("div");
    container.className = "tdv-effect-layer tdv-christmas-lights";
    container.setAttribute("aria-hidden", "true");

    const starsContainer = document.createElement("div");
    starsContainer.className = "stars";
    const starFrag = document.createDocumentFragment();
    const starCount = Number.isFinite(Number(cfg && cfg.starsCount))
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

    const bokehContainer = document.createElement("div");
    bokehContainer.className = "bokeh-container";
    const bokehFrag = document.createDocumentFragment();
    const bokehCount = Number.isFinite(Number(cfg && cfg.bokehCount))
      ? Math.max(0, Math.round(Number(cfg.bokehCount)))
      : 15;
    for (let i = 0; i < bokehCount; i++) {
      const bokeh = document.createElement("div");
      bokeh.className = "bokeh";
      const size = Math.random() * 80 + 40;
      bokeh.style.width = `${size}px`;
      bokeh.style.height = `${size}px`;
      bokeh.style.left = `${Math.random() * 100}%`;
      bokeh.style.top = `${Math.random() * 80}%`;
      bokeh.style.background = pick(CHRISTMAS_LIGHTS_BOKEH_COLORS);
      bokeh.style.animationDelay = `${Math.random() * 5}s`;
      bokeh.style.animationDuration = `${Math.random() * 10 + 10}s`;
      bokehFrag.appendChild(bokeh);
    }
    bokehContainer.appendChild(bokehFrag);

    const lightrope = document.createElement("ul");
    lightrope.className = "lightrope";
    const lightCount = Number.isFinite(Number(cfg && cfg.lightCount))
      ? Math.max(0, Math.round(Number(cfg.lightCount)))
      : 40;
    for (let i = 0; i < lightCount; i++) {
      lightrope.appendChild(document.createElement("li"));
    }

    const snowContainer = document.createElement("div");
    snowContainer.className = "snow-container";
    const snowGround = document.createElement("div");
    snowGround.className = "snow-ground";

    const snowAccHeight = Number.isFinite(Number(cfg && cfg.snowAccumulateHeight))
      ? Math.max(0, Number(cfg.snowAccumulateHeight))
      : 200;
    const snowAccSec = Number.isFinite(Number(cfg && cfg.snowAccumulateSec))
      ? Math.max(1, Number(cfg.snowAccumulateSec))
      : 45;
    snowGround.style.setProperty("--tdv-cl-accum-dur", `${snowAccSec}s`);
    snowGround.style.setProperty("--tdv-cl-accum-height", `${snowAccHeight}px`);

    snowContainer.appendChild(snowGround);

    const flakeFrag = document.createDocumentFragment();
    const flakeCount = Number.isFinite(Number(cfg && cfg.snowflakeCount))
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
      flake.style.opacity = Math.random() * 0.6 + 0.4;

      flakeFrag.appendChild(flake);
    }
    snowContainer.appendChild(flakeFrag);

    container.appendChild(starsContainer);
    container.appendChild(bokehContainer);
    container.appendChild(lightrope);
    container.appendChild(snowContainer);

    // Force reflow to prevent animation FOUC (especially for snow/stars)
    void container.offsetWidth;

    return container;
  }

  class ThemeManager {
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

      this.activeTheme = null;
      this.themeTimer = null;
      this.themeOverlayEl = null;
      this._halloweenOverlaySig = null;
      this._stormOverlaySig = null;
      this._themeCfgSig = null;

      this._fallingStarsPointer = { x: 0, y: 0 };
      this._fallingStarsHasPointer = false;
      this._fallingStarsMoveBound = false;
      this._fallingStarsClickBound = false;
      this._boundFallingStarsMove = this._handleFallingStarsMove.bind(this);
      this._boundFallingStarsClick = this._handleFallingStarsClick.bind(this);
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

    _getFallingStarsClientPoint(event) {
      if (!event) return null;
      const touch = event.touches && event.touches[0] ? event.touches[0] : null;
      const point = touch || event;
      const x = Number(point.clientX);
      const y = Number(point.clientY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    }

    _getFallingStarsStageRect() {
      try {
        const s =
          this.state && typeof this.state.getState === "function" ? this.state.getState() : null;
        const canvasEl = s && s.canvas ? s.canvas.canvasEl : null;
        const el =
          (canvasEl && typeof canvasEl.getBoundingClientRect === "function" && canvasEl) ||
          document.getElementById("viewer");
        if (el && typeof el.getBoundingClientRect === "function") {
          return el.getBoundingClientRect();
        }
      } catch {
        // ignore
      }
      return {
        left: 0,
        top: 0,
        width: window.innerWidth || 800,
        height: window.innerHeight || 600,
      };
    }

    _getFallingStarsStagePoint(event, stageW, stageH) {
      const client = this._getFallingStarsClientPoint(event);
      if (!client) return null;
      const rect = this._getFallingStarsStageRect();
      const rw = Math.max(1, rect.width || stageW || 1);
      const rh = Math.max(1, rect.height || stageH || 1);
      const nx = (client.x - rect.left) / rw;
      const ny = (client.y - rect.top) / rh;
      return {
        x: clamp(nx, 0, 1) * (stageW || rw),
        y: clamp(ny, 0, 1) * (stageH || rh),
      };
    }

    _syncFallingStarsInput(cfg) {
      const isFallingStars = !!cfg && cfg.type === "fallingStars";
      if (!isFallingStars) {
        this._releaseFallingStarsInput();
        return;
      }

      const wantsMouse =
        !!cfg && !!cfg.mouseTrail && (cfg.spawnMode === "mouse" || cfg.spawnMode === "both");
      const wantsClick = !!cfg && !!cfg.clickExplosion;

      const usePointer = !!window.PointerEvent;
      const moveEvent = usePointer ? "pointermove" : "mousemove";
      const clickEvent = usePointer ? "pointerdown" : "mousedown";

      if (wantsMouse && !this._fallingStarsMoveBound) {
        window.addEventListener(moveEvent, this._boundFallingStarsMove, { passive: true });
        if (!usePointer) {
          window.addEventListener("touchmove", this._boundFallingStarsMove, { passive: true });
        }
        this._fallingStarsMoveBound = true;
      } else if (!wantsMouse && this._fallingStarsMoveBound) {
        window.removeEventListener(moveEvent, this._boundFallingStarsMove, { passive: true });
        if (!usePointer) {
          window.removeEventListener("touchmove", this._boundFallingStarsMove, { passive: true });
        }
        this._fallingStarsMoveBound = false;
      }

      if (wantsClick && !this._fallingStarsClickBound) {
        window.addEventListener(clickEvent, this._boundFallingStarsClick, { passive: true });
        if (!usePointer) {
          window.addEventListener("touchstart", this._boundFallingStarsClick, { passive: true });
        }
        this._fallingStarsClickBound = true;
      } else if (!wantsClick && this._fallingStarsClickBound) {
        window.removeEventListener(clickEvent, this._boundFallingStarsClick, { passive: true });
        if (!usePointer) {
          window.removeEventListener("touchstart", this._boundFallingStarsClick, { passive: true });
        }
        this._fallingStarsClickBound = false;
      }
    }

    _releaseFallingStarsInput() {
      const usePointer = !!window.PointerEvent;
      const moveEvent = usePointer ? "pointermove" : "mousemove";
      const clickEvent = usePointer ? "pointerdown" : "mousedown";

      if (this._fallingStarsMoveBound) {
        try {
          window.removeEventListener(moveEvent, this._boundFallingStarsMove, { passive: true });
        } catch {
          // ignore
        }
        if (!usePointer) {
          try {
            window.removeEventListener("touchmove", this._boundFallingStarsMove, { passive: true });
          } catch {
            // ignore
          }
        }
        this._fallingStarsMoveBound = false;
      }

      if (this._fallingStarsClickBound) {
        try {
          window.removeEventListener(clickEvent, this._boundFallingStarsClick, { passive: true });
        } catch {
          // ignore
        }
        if (!usePointer) {
          try {
            window.removeEventListener("touchstart", this._boundFallingStarsClick, {
              passive: true,
            });
          } catch {
            // ignore
          }
        }
        this._fallingStarsClickBound = false;
      }
    }

    _handleFallingStarsMove(event) {
      const theme = this.activeTheme;
      if (!theme || !theme.cfg || theme.cfg.type !== "fallingStars") return;
      const cfg = theme.cfg;
      if (!cfg.mouseTrail || (cfg.spawnMode !== "mouse" && cfg.spawnMode !== "both")) return;

      const stage = getStageSize(this.canvasManager);
      const pt = this._getFallingStarsStagePoint(event, stage.w, stage.h);
      if (!pt) return;

      const viewer = document.getElementById("viewer");
      if (viewer && event && event.target && !viewer.contains(event.target)) return;

      this._fallingStarsPointer = pt;
      this._fallingStarsHasPointer = true;
    }

    _handleFallingStarsClick(event) {
      const theme = this.activeTheme;
      if (!theme || !theme.cfg || theme.cfg.type !== "fallingStars") return;
      const cfg = theme.cfg;
      if (!cfg.clickExplosion) return;

      const viewer = document.getElementById("viewer");
      if (viewer && event && event.target && !viewer.contains(event.target)) return;

      if (!this.particleManager || typeof this.particleManager.addParticles !== "function") return;
      if (!particles || typeof particles.FallingStarParticle !== "function") return;

      const stage = getStageSize(this.canvasManager);
      const pt = this._getFallingStarsStagePoint(event, stage.w, stage.h);
      if (!pt) return;

      this._fallingStarsPointer = pt;
      this._fallingStarsHasPointer = true;

      const config = this._getConfig();
      const scaleCount = (count, min) =>
        typeof dom.scaleCount === "function"
          ? dom.scaleCount(count, config, min)
          : Math.max(min || 1, Math.round(Number(count || 0)));

      const requested = Number(cfg.explosionSize);
      const count = scaleCount(Number.isFinite(requested) ? requested : 50, 5);
      const list = [];
      for (let i = 0; i < count; i++) {
        const p = new particles.FallingStarParticle(pt.x, pt.y, cfg, true);
        p.isTheme = true;
        list.push(p);
      }

      if (list.length) {
        this.particleManager.addParticles(list);
        if (this.canvasManager && typeof this.canvasManager.requestFrame === "function") {
          this.canvasManager.requestFrame();
        }
      }
    }

    _stableStringify(value) {
      const t = typeof value;
      if (value === null) return "null";
      if (t === "string") return JSON.stringify(value);
      if (t === "number") return Number.isFinite(value) ? String(value) : "null";
      if (t === "boolean") return value ? "true" : "false";
      if (Array.isArray(value)) return `[${value.map((v) => this._stableStringify(v)).join(",")}]`;
      if (t === "object") {
        const keys = Object.keys(value).sort();
        return `{${keys
          .map((k) => `${JSON.stringify(k)}:${this._stableStringify(value[k])}`)
          .join(",")}}`;
      }
      return "null";
    }

    _getThemeModeFlags(cfg) {
      const style = cfg && cfg.type === "halloween" ? cfg.style || "spiders" : null;
      const wantsHalloweenOverlay = !!(
        cfg &&
        cfg.type === "halloween" &&
        (style === "spiders" || style === "mixed")
      );
      const cssOnly =
        !!cfg &&
        (!!cfg.cssOnly ||
          cfg.type === "strobe" ||
          (cfg.type === "halloween" && style === "spiders"));
      return { cssOnly, wantsOverlay: cssOnly || wantsHalloweenOverlay };
    }

    _computeThemeCfgSig(cfg, flags) {
      if (!cfg) return null;
      const f = flags || this._getThemeModeFlags(cfg);
      return `${String(cfg.type || "")}|${String(!!f.cssOnly)}|${this._stableStringify(cfg)}`;
    }

    _computeHalloweenOverlaySig(cfg) {
      if (!cfg || cfg.type !== "halloween") return null;
      const style = cfg.style || "spiders";
      if (style !== "spiders" && style !== "mixed") return null;
      return [
        style,
        String(cfg.ghostCount),
        String(cfg.ghostSizeMin),
        String(cfg.ghostSizeMax),
        String(cfg.ghostDirection),
        String(cfg.ghostRandomness),
      ].join("|");
    }

    _computeStormOverlaySig(cfg) {
      if (!cfg || cfg.type !== "storm") return null;
      return [
        String(cfg.backgroundOpacity),
        String(cfg.lightningCycleMs),
        String(cfg.rainCount),
        String(cfg.rainWidth),
        String(cfg.rainLengthMin),
        String(cfg.rainLengthMax),
        String(cfg.rainOpacityMin),
        String(cfg.rainOpacityMax),
        String(cfg.windXMin),
        String(cfg.windXMax),
        String(cfg.speedYMin),
        String(cfg.speedYMax),
        String(cfg.randomBoltStartDelayMs),
        String(cfg.randomBoltDelayMinMs),
        String(cfg.randomBoltDelayMaxMs),
        String(cfg.randomBoltDurationMinMs),
        String(cfg.randomBoltDurationMaxMs),
      ].join("|");
    }

    syncActiveThemeOverlay() {
      try {
        if (!this.activeTheme) return;

        const updated = this.getThemeDefinition(this.activeTheme.name);
        if (!updated) return;

        const nextFlags = this._getThemeModeFlags(updated);
        const nextSig = this._computeThemeCfgSig(updated, nextFlags);

        // Keep timed themes in sync if duration/lifetime changes.
        this._setupThemeTimer();

        if (!nextSig || nextSig === this._themeCfgSig) return;

        // If the theme changes between CSS-only and particle mode (ex: halloween spiders <-> embers),
        // restart it to keep behavior consistent.
        if (!!nextFlags.cssOnly !== !!(this.activeTheme && this.activeTheme.cssOnly)) {
          this.startTheme(this.activeTheme.name);
          return;
        }

        // Update config reference for immediate spawn/tuning changes.
        this.activeTheme.cfg = updated;
        this._themeCfgSig = nextSig;

        // Update overlay (covers cssOnly themes + halloween mixed overlay).
        if (nextFlags.wantsOverlay) {
          this._applyThemeOverlay(updated);
        } else {
          this._clearThemeOverlay();
        }

        if (updated.type === "fallingStars") {
          this._syncFallingStarsInput(updated);
        } else {
          this._releaseFallingStarsInput();
        }

        // For particle themes, clear current particles so changes take effect immediately.
        if (
          !nextFlags.cssOnly &&
          this.particleManager &&
          typeof this.particleManager.clearWhere === "function"
        ) {
          this.particleManager.clearWhere((p) => !!p && !!p.isTheme);
          if (this.activeTheme) this.activeTheme.acc = 0;
          if (this.canvasManager && typeof this.canvasManager.requestFrame === "function") {
            this.canvasManager.requestFrame();
          }
        }

        // Keep legacy overlay signatures updated (used by older logic / debugging).
        this._halloweenOverlaySig = this._computeHalloweenOverlaySig(updated);
        this._stormOverlaySig = this._computeStormOverlaySig(updated);
      } catch {
        // ignore
      }
    }

    getThemeDefinition(themeName) {
      if (!themeName) return null;
      const current = this._getConfig();
      const fromConfig = current && current.themes ? current.themes[themeName] : null;
      const fromDefaults =
        Config && Config.DEFAULTS && Config.DEFAULTS.themes
          ? Config.DEFAULTS.themes[themeName]
          : null;

      let merged = null;
      if (fromDefaults && fromConfig) merged = deepMerge(fromDefaults, fromConfig);
      else if (fromConfig) merged = deepMerge({}, fromConfig);
      else if (fromDefaults) merged = deepMerge({}, fromDefaults);

      if (!merged) return null;

      if (themeName === "water") {
        merged.type = "shaderWater";
        merged.cssOnly = true;
        merged.texture = merged.texture || "effects-assets/Water-effect-normal.jpg";
        merged.texture2 = merged.texture2 || "effects-assets/Water-effect-normal.jpg";
        merged.flowSpeed = merged.flowSpeed || 1.0;
        merged.flow1 = merged.flow1 || [0.14, -0.09];
        merged.flow2 = merged.flow2 || [-0.11, 0.13];
        merged.tiling1 = merged.tiling1 || 2.4;
        merged.tiling2 = merged.tiling2 || 1.9;
        merged.rotate1Deg = merged.rotate1Deg || 28;
        merged.rotate2Deg = merged.rotate2Deg || -22;
        merged.distortion = merged.distortion || 0.03;
        merged.specular = merged.specular || 0.2;
        merged.caustics = merged.caustics || 0.14;
        merged.tint = merged.tint || "rgba(120,180,220,0.35)";
        merged.opacity = merged.opacity || 0.78;
      }

      if (themeName === "easter") {
        merged.type = "egg";
      }

      if (themeName === "fallingStars") {
        merged.type = "fallingStars";
        merged.cssOnly = false;
        if (typeof merged.maxParticles === "undefined") merged.maxParticles = 220;
        if (typeof merged.spawnRate === "undefined") merged.spawnRate = 20;
        if (typeof merged.spawnMode === "undefined") merged.spawnMode = "rain";
        if (typeof merged.mouseTrail === "undefined") merged.mouseTrail = false;
        if (typeof merged.clickExplosion === "undefined") merged.clickExplosion = false;
      }

      return merged;
    }

    getThemesList() {
      const cfg = this._getConfig();
      let list = Object.keys((cfg && cfg.themes) || {});
      if (!list.length && Config && Config.DEFAULTS && Config.DEFAULTS.themes) {
        list = Object.keys(Config.DEFAULTS.themes);
      }
      return ["none"].concat(list.filter((name) => name !== "none"));
    }

    isActive() {
      return !!this.activeTheme;
    }

    isLoopActive() {
      return !!(this.activeTheme && !this.activeTheme.cssOnly);
    }

    getActiveTheme() {
      return this.activeTheme ? this.activeTheme.name : null;
    }

    startTheme(themeName) {
      const cfg = this.getThemeDefinition(themeName);
      if (!cfg) return false;

      this.stopTheme();

      const flags = this._getThemeModeFlags(cfg);
      this.activeTheme = { name: themeName, cfg, acc: 0, cssOnly: !!flags.cssOnly };
      if (this.state) {
        this.state.setState({ activeTheme: themeName });
      }

      if (flags.wantsOverlay) {
        this._applyThemeOverlay(cfg);
      }

      if (cfg.type === "fallingStars") {
        this._syncFallingStarsInput(cfg);
      } else {
        this._releaseFallingStarsInput();
      }

      this._halloweenOverlaySig = this._computeHalloweenOverlaySig(cfg);
      this._stormOverlaySig = this._computeStormOverlaySig(cfg);
      this._themeCfgSig = this._computeThemeCfgSig(cfg, flags);

      if (
        !flags.cssOnly &&
        this.canvasManager &&
        typeof this.canvasManager.requestFrame === "function"
      ) {
        this.canvasManager.requestFrame();
      }

      this._setupThemeTimer();
      if (this.eventBus) {
        this.eventBus.emit("theme:started", { theme: themeName });
      }
      return true;
    }

    stopTheme() {
      if (!this.activeTheme) return;
      this._clearThemeTimer();
      this.activeTheme = null;
      this._halloweenOverlaySig = null;
      this._stormOverlaySig = null;
      this._themeCfgSig = null;
      this._releaseFallingStarsInput();
      try {
        if (this.state) {
          this.state.setState({ activeTheme: null });
        }
      } catch {
        // ignore
      }
      this._clearThemeOverlay();

      if (this.particleManager && typeof this.particleManager.clearWhere === "function") {
        this.particleManager.clearWhere((p) => !!p && !!p.isTheme);
      }

      if (this.eventBus) {
        this.eventBus.emit("theme:stopped");
      }
    }

    onFrame(dt, w, h) {
      if (!this.activeTheme || this.activeTheme.cssOnly) return;
      this._emitTheme(dt, w, h);
    }

    // eslint-disable-next-line max-lines-per-function
    _emitTheme(dt, w, h) {
      const theme = this.activeTheme;
      if (!theme || !theme.cfg || theme.cssOnly) return;

      const cfg = theme.cfg;
      const config = this._getConfig();
      const scaleCount = (count, min) =>
        typeof dom.scaleCount === "function"
          ? dom.scaleCount(count, config, min)
          : Math.max(min || 1, count || 0);

      const type = cfg.type || "snow";

      if (type === "fallingStars") {
        if (!particles || typeof particles.FallingStarParticle !== "function") return;

        const maxParticles = scaleCount(cfg.maxParticles || 220, 30);
        const spawnRateMs = clamp(Number(cfg.spawnRate) || 20, 1, 500);
        const basePerSec = 1000 / Math.max(1, spawnRateMs);
        const ratePerSec = scaleCount(basePerSec, 1);

        theme.acc += dt * ratePerSec;
        const toSpawn = Math.floor(theme.acc);
        if (toSpawn <= 0) return;
        theme.acc -= toSpawn;

        let currentThemeCount = 0;
        const all =
          this.particleManager && this.particleManager.particles
            ? this.particleManager.particles
            : [];
        for (let i = 0; i < all.length; i++) {
          if (all[i] && all[i].isTheme) currentThemeCount += 1;
        }

        if (!this._fallingStarsHasPointer) {
          this._fallingStarsPointer = { x: w / 2, y: h / 2 };
        }

        const list = [];
        const spawnMode = cfg.spawnMode || "rain";
        const wantsMouse = !!cfg.mouseTrail && (spawnMode === "mouse" || spawnMode === "both");
        const jitter = Number(cfg.mouseRandomness) || 0;
        const baseSize = Number(cfg.baseSize) || 20;

        for (let i = 0; i < toSpawn && currentThemeCount < maxParticles; i++) {
          let x = 0;
          let y = 0;
          const useRain = spawnMode === "rain" || (spawnMode === "both" && Math.random() < 0.5);
          const useMouse =
            !useRain && wantsMouse && (spawnMode === "mouse" || spawnMode === "both");

          if (useRain) {
            x = rand(0, w);
            y = cfg.reverse ? h + baseSize : -baseSize;
          } else if (useMouse) {
            x = this._fallingStarsPointer.x + (Math.random() - 0.5) * jitter;
            y = this._fallingStarsPointer.y + (Math.random() - 0.5) * jitter;
            x = clamp(x, 0, w);
            y = clamp(y, 0, h);
          } else {
            continue;
          }

          const particle = new particles.FallingStarParticle(x, y, cfg, false);
          particle.isTheme = true;
          list.push(particle);
          currentThemeCount += 1;
        }

        if (
          list.length &&
          this.particleManager &&
          typeof this.particleManager.addParticles === "function"
        ) {
          this.particleManager.addParticles(list);
        }
        return;
      }

      const rate = scaleCount(cfg.emissionRate || 12, 2);
      const maxParticles = scaleCount(cfg.maxParticles || 150, 30);
      theme.acc += dt * rate;
      const toSpawn = Math.floor(theme.acc);
      if (toSpawn <= 0) return;
      theme.acc -= toSpawn;

      const colors = cfg.colors && cfg.colors.length ? cfg.colors : ["#ffffff"];

      let currentThemeCount = 0;
      const all =
        this.particleManager && this.particleManager.particles
          ? this.particleManager.particles
          : [];
      for (let i = 0; i < all.length; i++) {
        if (all[i] && all[i].isTheme) currentThemeCount += 1;
      }

      const list = [];
      for (let i = 0; i < toSpawn && currentThemeCount < maxParticles; i++) {
        let particle = null;
        if (type === "snow") {
          particle = new particles.SnowParticle(
            rand(0, w),
            rand(-40, -10),
            pick(colors),
            rand(8, 16),
            cfg.speedMin || 20,
            cfg.speedMax || 55,
            cfg
          );
        } else if (type === "snowflake") {
          particle = new particles.SnowflakeParticle(
            rand(0, w),
            rand(-40, -10),
            pick(colors),
            rand(8, 16),
            cfg.speedMin || 18,
            cfg.speedMax || 50,
            cfg
          );
        } else if (type === "halloween") {
          const style = cfg.style || "spiders";
          if (style === "embers") {
            particle = new particles.EmberParticle(
              rand(0, w),
              h + rand(10, 40),
              pick(colors),
              rand(1.5, 3)
            );
          } else if (style === "emoji") {
            const icons =
              Array.isArray(cfg.icons) && cfg.icons.length
                ? cfg.icons
                : ["🕸️", "🕷️", "🎃", "⚰️", "🦇", "👻", "💀", "☠️"];
            particle = new particles.HalloweenEmojiParticle(
              rand(0, w),
              rand(-60, -10),
              pick(icons),
              rand(7, 16),
              cfg
            );
          } else if (style === "mixed") {
            // "Mixed" = CSS spiders overlay + emoji rain (no canvas spiders).
            const icons =
              Array.isArray(cfg.icons) && cfg.icons.length
                ? cfg.icons
                : ["🕸️", "🕷️", "🎃", "⚰️", "🦇", "👻", "💀", "☠️"];
            particle = new particles.HalloweenEmojiParticle(
              rand(0, w),
              rand(-60, -10),
              pick(icons),
              rand(7, 16),
              cfg
            );
          } else {
            // spiders (default) are implemented as a DOM/CSS overlay (no particles).
            particle = null;
          }
        } else if (type === "rain") {
          particle = new particles.RainParticle(
            rand(0, w),
            rand(-200, 0),
            pick(colors),
            rand(1.2, 2.4),
            cfg
          );
        } else if (type === "sparkle") {
          particle = new particles.SparkleParticle(
            rand(0, w),
            rand(0, h),
            pick(colors),
            rand(1.5, 3)
          );
        } else if (type === "ember") {
          particle = new particles.EmberParticle(
            rand(0, w),
            h + rand(10, 40),
            pick(colors),
            rand(1.5, 3)
          );
        } else if (type === "bubble") {
          particle = new particles.BubbleParticle(
            rand(0, w),
            h + rand(20, 80),
            pick(colors),
            rand(6, 12),
            cfg
          );
        } else if (type === "leaf") {
          particle = new particles.LeafParticle(
            rand(0, w),
            rand(-80, -20),
            pick(colors),
            rand(6, 12),
            cfg
          );
        } else if (type === "egg") {
          particle = new particles.EggParticle(
            rand(0, w),
            rand(-80, -20),
            pick(colors),
            rand(6, 12),
            cfg
          );
        } else if (type === "fire") {
          particle = new particles.FireParticle(
            rand(0, w),
            h + rand(10, 60),
            pick(colors),
            rand(1.2, 2.4),
            cfg
          );
        } else if (type === "water") {
          particle = new particles.WaterParticle(
            rand(0, w),
            rand(-200, -20),
            pick(colors),
            rand(1.2, 2.2),
            cfg
          );
        } else if (type === "wind") {
          particle = new particles.WindParticle(
            -rand(40, 120),
            rand(0, h),
            pick(colors),
            rand(1.4, 2.6),
            cfg
          );
        } else {
          particle = new particles.ConfettiParticle(
            rand(0, w),
            rand(-40, -10),
            pick(colors),
            rand(3, 5),
            {
              vxMin: -40,
              vxMax: 40,
              vyMin: 40,
              vyMax: 120,
              gravity: 40,
            }
          );
        }

        if (particle) {
          particle.isTheme = true;
          list.push(particle);
          currentThemeCount += 1;
        }
      }

      if (
        list.length &&
        this.particleManager &&
        typeof this.particleManager.addParticles === "function"
      ) {
        this.particleManager.addParticles(list);
      }
    }

    _applyThemeOverlay(cfg) {
      this._clearThemeOverlay();
      const cssLayer =
        this.canvasManager && typeof this.canvasManager.getCssLayer === "function"
          ? this.canvasManager.getCssLayer()
          : null;
      if (!cssLayer || !cfg) return;

      const ctx = {
        getStageSize: () => getStageSize(this.canvasManager),
        getConfig: () => this._getConfig(),
      };

      if (cfg.type === "strobe") {
        const frequency = clamp(Number(cfg.frequency) || 8, 1, 30);
        const periodMs = Math.max(80, Math.round(1000 / frequency));
        const el = document.createElement("div");
        el.className = "tdv-effect-layer tdv-theme-strobe";
        el.style.setProperty("--duration", `${periodMs}ms`);
        el.style.background = cfg.color || "rgba(255,255,255,0.22)";
        cssLayer.appendChild(el);
        this.themeOverlayEl = el;
        return;
      }

      let el = null;
      if (cfg.type === "shaderBurn") el = createShaderBurnOverlay(ctx, cfg);
      else if (cfg.type === "shaderSmoke") el = createShaderSmokeOverlay(ctx, cfg);
      else if (cfg.type === "shaderWater") el = createShaderWaterOverlay(ctx, cfg);
      else if (cfg.type === "cssfire") el = createCSSFireOverlay(ctx, cfg);
      else if (cfg.type === "cssbokeh") el = createCSSBokehOverlay(ctx, cfg);
      else if (cfg.type === "spinningRays") el = createSpinningRaysOverlay(ctx, cfg);
      else if (cfg.type === "sineWaves") el = createSineWavesOverlay(ctx, cfg);
      else if (cfg.type === "flowers") el = createFlowersOverlay(ctx, cfg);
      else if (cfg.type === "storm") el = createStormOverlay(ctx, cfg);
      else if (cfg.type === "electric") el = createElectricOverlay(ctx, cfg);
      else if (cfg.type === "christmasLights") el = createChristmasLightsOverlay(ctx, cfg);
      else if (cfg.type === "fallingStars") el = createFallingStarsOverlay(ctx, cfg);
      else if (cfg.type === "halloween") {
        const style = cfg.style || "spiders";
        if (style === "spiders" || style === "mixed") {
          el = createHalloweenSpidersOverlay(ctx, cfg);
        }
      }

      if (el) {
        cssLayer.appendChild(el);
        this.themeOverlayEl = el;
      }
    }

    _clearThemeOverlay() {
      const el = this.themeOverlayEl;
      if (!el) return;
      this.themeOverlayEl = null;

      let handledRemoval = false;
      try {
        if (el && typeof el._stopShaderSmoke === "function") el._stopShaderSmoke();
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopShaderBurn === "function") el._stopShaderBurn();
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopShaderWater === "function") {
          handledRemoval = true;
          el._stopShaderWater();
        }
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopElectric === "function") {
          handledRemoval = true;
          el._stopElectric();
        }
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopStorm === "function") {
          handledRemoval = true;
          el._stopStorm();
        }
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopSpinningRays === "function") {
          handledRemoval = true;
          el._stopSpinningRays();
        }
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopSineWaves === "function") {
          handledRemoval = true;
          el._stopSineWaves();
        }
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopFlowers === "function") {
          handledRemoval = true;
          el._stopFlowers();
        }
      } catch {
        // ignore
      }
      try {
        if (el && typeof el._stopFallingStars === "function") {
          handledRemoval = true;
          el._stopFallingStars();
        }
      } catch {
        // ignore
      }

      if (!handledRemoval) {
        if (el && el.parentNode) {
          try {
            el.parentNode.removeChild(el);
          } catch {
            // ignore
          }
        }
      }
    }

    _setupThemeTimer() {
      this._clearThemeTimer();
      const config = this._getConfig();
      if (!config || config.themeLifetime !== "timed") return;
      const durationSec = Number(config.themeDurationSec) || 30;
      if (durationSec <= 0) return;
      this.themeTimer = setTimeout(() => this.stopTheme(), durationSec * 1000);
    }

    _clearThemeTimer() {
      if (!this.themeTimer) return;
      try {
        clearTimeout(this.themeTimer);
      } catch {
        // ignore
      }
      this.themeTimer = null;
    }
  }

  effectsPro._internals.ThemeManager = ThemeManager;
})();
