(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._data = effectsPro._data || {};

  /**
   * One-shot effects library.
   * Data-only: no logic in this file.
   */
  effectsPro._data.EFFECTS_LIBRARY = {
    flash: { durationMs: 200, color: "rgba(255,255,255,0.95)" },
    fade: {
      durationMs: 900,
      stacking: "additive", // additive | exclusive
      colorHex: "#000000",
      opacity: 0.85,
      easing: "standard", // standard | linear | easeInOut | easeOut | easeIn
      blendMode: "normal", // normal | multiply | screen | overlay | soft-light
    },
    sweep: {
      durationMs: 800,
      direction: "left", // left | right | top | bottom
      color: "rgba(255,255,255,0.75)",
    },
    cinema: { barHeightPercent: 12, durationMs: 600, color: "#000000", stacking: "additive" },
    confetti: {
      count: 160,
      durationMs: 3500,
      colors: ["#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#ffffff"],
      speedMin: 40,
      speedMax: 120,
      gravity: 300,
      sizeMin: 6,
      sizeMax: 12,
      shape: "mixed", // mixed | rect | circle
      wind: 0,
      origin: "cannon", // cannon | rain | explosion
    },
    sparkles: { count: 90, durationMs: 2600, color: "#ffffff" },
    rain: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive

      // Mode:
      // - "continuous": theme-like (spawns over time)
      // - "burst": legacy one-shot (spawns fixed count once)
      mode: "continuous", // continuous | burst

      // Burst (legacy)
      count: 220,

      // Continuous (theme-like)
      emissionRate: 30, // particles per second
      maxParticles: 260,
      particleLifeMinSec: 1.2,
      particleLifeMaxSec: 2.4,

      // Particle tuning (used by RainParticle)
      colors: ["rgba(174,194,224,0.7)", "rgba(196,210,230,0.6)"],
      colorHex: "#aec2e0",
      speedMin: 520,
      speedMax: 920,
      lengthMin: 14,
      lengthMax: 30,
      drift: 60,
      windVarMin: -12,
      windVarMax: 12,
      thicknessMin: 0.8,
      thicknessMax: 1.6,
      splashes: true,
      intensity: "medium", // soft | medium | heavy | storm
      direction: "normal", // normal | left | right
    },
    smoke: {
      durationMs: 4200,
      spawnIntervalMs: 40,
      riseSpeed: 1.0,
      sizeScale: 1.0,
      maxParticles: 100,
      particleLifetimeMs: 4000,
      rotation: true,
      blendMode: "screen", // normal | screen
      colorHex: "#ffffff",
      opacityScale: 0.4,
    },
    bubbles: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      mode: "continuous", // continuous | burst
      count: 40, // burst count
      emissionRate: 8, // particles per second (continuous)
      maxParticles: 120,
      particleLifeMinSec: 6,
      particleLifeMaxSec: 12,
      sizeMin: 12,
      sizeMax: 60,
      speedMin: 20,
      speedMax: 60,
      drift: 24,
      strokeWidth: 2,
      colorMode: "palette", // palette | custom
      colors: ["rgba(135,206,250,0.85)", "rgba(148,197,255,0.85)", "rgba(186,230,253,0.8)"],
      colorHex: "#87cefa",
      colorOpacity: 0.85,
    },
    halloween: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      style: "spiders", // spiders | emoji | embers | mixed
      emissionRate: 8, // particles per second (emoji/embers/mixed)
      maxParticles: 120,
      colors: ["#ff7a00", "#6b21a8", "#111827"], // used by "embers" style
      icons: ["🕸️", "🕷️", "🎃", "⚰️", "🦇", "👻", "💀", "☠️"],
      speedMin: 40,
      speedMax: 120,
      sizeMin: 18,
      sizeMax: 46,
      drift: 28,
      direction: "normal", // normal | left | right
      windStrength: 0, // px/sec (applied when direction is left/right)
      ghostCount: 6,
      ghostSizeMin: 90,
      ghostSizeMax: 120,
      ghostDirection: "mixed", // mixed | leftToRight | rightToLeft
      ghostRandomness: 0, // 0..1
      stringLenMin: 180,
      stringLenMax: 520,
    },
    christmasLights: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive

      // Layer toggles
      showStars: true,
      showBokeh: true,
      showLights: true,
      showSnow: true,
      showSnowGround: true,

      // Counts
      starsCount: 100,
      bokehCount: 15,
      snowflakeCount: 150,
      lightCount: 40,

      // Snow ground animation
      snowAccumulateHeight: 200,
      snowAccumulateSec: 45,

      // Optional color overrides
      snowColorHex: "#ffffff",
      bokehColorMode: "palette", // palette | custom
      bokehColorHex: "#ffffff",
      bokehOpacity: 0.3,
    },
    movieCountdown: {
      durationMs: 11500,
      stacking: "exclusive", // additive | exclusive

      // Countdown
      startNumber: 10,
      stepMs: 1000,
      holdMs: 500,

      // Frame + layout
      sizeMode: "responsive", // responsive | fixed
      sizeVmin: 100,
      sizePx: 664,
      borderPx: 30,
      borderColorHex: "#000000",

      // Background (set opacity to 0 for transparent over tour)
      bgColorHex: "#11233c",
      bgOpacity: 0,

      // Corner boxes
      boxLightHex: "#d7d7d7",
      boxDarkHex: "#bebebe",
      boxBorderHex: "#626262",
      boxSpeedMs: 1000,

      // Center circle + numbers
      circleBgOpacity: 0.4,
      circleBorderPx: 20,
      circleBorderColorHex: "#ffffff",
      numberColorHex: "#202020",
    },
    bokeh: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      cssOnly: true,
      lightCount: 150,
      lightSize: 75,
      blurLevel: 2,
      speed: 1.0,
      palette: "festive", // festive | cool | warm
    },
    flames: {
      durationMs: 8000,
      stacking: "exclusive", // additive | exclusive
      cssOnly: true,
      intensity: 1.0,
      speed: 1.0,
      scale: 1.0,
      showBackground: false,
    },
    burn: {
      durationMs: 7000,
      stacking: "exclusive", // additive | exclusive
      progressSpeed: 1.0, // 0.01..2
      flameSpeed: 1.0, // 0.1..4
      background: "transparent", // white | transparent
      loop: false,
    },
    storm: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      cssOnly: true,

      backgroundOpacity: 1,
      lightningCycleMs: 6000,

      // Rain
      rainCount: 500,
      rainWidth: 1,
      rainLengthMin: 0,
      rainLengthMax: 4,
      rainOpacityMin: 0.1,
      rainOpacityMax: 0.3,
      windXMin: -3,
      windXMax: -1,
      speedYMin: 7,
      speedYMax: 15,

      // Random bolt timing
      randomBoltStartDelayMs: 8000,
      randomBoltDelayMinMs: 3000,
      randomBoltDelayMaxMs: 7000,
      randomBoltDurationMinMs: 400,
      randomBoltDurationMaxMs: 600,
    },
    spinningRays: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      cssOnly: true,
      numRays: 30,
      trailAlpha: 0.2,
      centerMode: "center", // center | random | custom
      centerXPercent: 50,
      centerYPercent: 50,
      hueOffset: 0,
      hueSpeed: 1,
      hueRange: 30,
      saturation: 80,
      lightness: 50,
      glowBlur: 14,
      baseLineWidth: 1,
      lineWidthFactor: 60,
      angularVelMin: 0.0001,
      angularVelMax: 0.005,
      waveSpeedMin: 0.03,
      waveSpeedMax: 0.05,
      waveAccel: 0.0003,
      circleRadiusFactor: 2, // radius = factor * count^2
      circleMaxCount: 100,
      radiantMax: 0.4,
      circleWaveSpeedMin: 0.01,
      circleWaveSpeedMax: 0.02,
      circleWaveScale: 0.1,
    },
    sineWaves: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      cssOnly: true,
      speed: 8,
      centerYPercent: 50,
      waveWidthPercent: 95,
      waveLeftPercent: 2.5,
      clearMode: "clear",
      trailAlpha: 0.18,
      segmentLengthDefault: 10,
      colorMode: "gradient", // gradient | solid
      strokeColor: "rgba(255,255,255,0.25)",
      gradientStartAlpha: 0,
      gradientMidAlpha: 0.5,
      gradientEndAlpha: 0,
      gradientHue: 0,
      gradientSaturation: 0,
      gradientLightness: 100,
      compositeOperation: "lighter", // lighter | source-over
      wave1Enabled: true,
      wave1TimeModifier: 1,
      wave1LineWidth: 3,
      wave1Amplitude: 150,
      wave1Wavelength: 200,
      wave1SegmentLength: 20,
      wave2Enabled: true,
      wave2TimeModifier: 1,
      wave2LineWidth: 2,
      wave2Amplitude: 150,
      wave2Wavelength: 100,
      wave2SegmentLength: 10,
      wave3Enabled: true,
      wave3TimeModifier: 1,
      wave3LineWidth: 1,
      wave3Amplitude: -150,
      wave3Wavelength: 50,
      wave3SegmentLength: 10,
      wave4Enabled: true,
      wave4TimeModifier: 1,
      wave4LineWidth: 0.5,
      wave4Amplitude: -100,
      wave4Wavelength: 100,
      wave4SegmentLength: 10,
    },
    balloons: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      cssOnly: true,
      animate: true,
      direction: "bottom", // bottom | top | left | right | diagonal | mixed
      colorMode: "single", // single | dual | rainbow | custom
      customHue: 210,
      customColorHex: "#4fc3f7",
      minSize: 20,
      maxSize: 70,
      minSpeed: 1.5,
      maxSpeed: 4,
      spawnRate: 37, // frames between spawns (60fps ≈ 1.6 spawns/sec)
      maxBalloons: 37,
      waveAmplitude: 50,
      waveFrequency: 25,
      stringLength: 4.5,
      heightRatio: 1.4,
      showStrings: true,
      showGradient: true,
      stringColor: "#abcdef",
      kappa: 0.5522847498,
    },
    leaves: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      mode: "continuous", // continuous | burst

      // Continuous spawning
      emissionRate: 10, // particles per second
      maxParticles: 140,
      particleLifetimeSec: 18,

      // Particle tuning (LeafParticle)
      colorMode: "palette", // palette | custom
      colorHex: "#309900",
      colors: ["#309900", "#005600", "#5e9900", "#2b5600", "#564500"],
      sizeMin: 10,
      sizeMax: 24,
      speedMin: 30,
      speedMax: 80,
      drift: 28,
    },
    fire: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      emissionRate: 22, // particles per second
      maxParticles: 200,
      particleLifetimeSec: 12,
      colorMode: "palette", // palette | custom
      colorHex: "#ff4500",
      colors: ["#ff4500", "#ff8c00", "#ffd166", "#f97316", "#fb7185"],
      sizeMin: 8,
      sizeMax: 22,
      speedMin: 70,
      speedMax: 160,
      drift: 40,
    },
    electric: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      minDelay: 50,
      maxDelay: 600,
      chaosChance: 0.3,
      boltColor: "#6bfeff",
      branchColor: "#f6de8d",
      flashIntensity: 0.6,
      shakeIntensity: 1.0,
      sparkCount: 12,
      boltWidth: 2,
      displacement: 100,
    },
    wind: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      emissionRate: 14, // particles per second
      maxParticles: 160,
      particleLifetimeSec: 8,
      colorMode: "palette", // palette | custom
      colorHex: "#cbd5e1",
      colorOpacity: 0.65,
      colors: ["rgba(203,213,225,0.7)", "rgba(148,163,184,0.6)", "rgba(226,232,240,0.6)"],
      speedMin: 90,
      speedMax: 180,
      lengthMin: 60,
      lengthMax: 140,
      drift: 32,
    },
    easter: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      emissionRate: 12, // particles per second
      maxParticles: 160,
      particleLifetimeSec: 30, // keep long enough to reach the bottom
      colorMode: "palette", // palette | custom
      colorHex: "#f9a8d4",
      colors: ["#f9a8d4", "#86efac", "#93c5fd", "#fde68a", "#d8b4fe", "#fecdd3"],
      sizeMin: 12,
      sizeMax: 26,
      speedMin: 30,
      speedMax: 90,
      drift: 20,
    },
    flowers: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      style: "ellipse", // ellipse | path | rounded | random

      // Spawning
      spawnMode: "random", // random | bottomBand | custom
      spawnRatePerSec: 0.35,
      initialBurst: 3,
      maxFlowers: 30,

      // Placement
      xPaddingPercent: 5,
      yMinPercent: 55,
      yMaxPercent: 95,
      customXPercent: 50,
      customYPercent: 78,
      spreadXPercent: 40,
      spreadYPercent: 30,

      // Animation / lifecycle (per flower)
      bloomDurationMs: 1200,
      lifeMs: 12000,
      fadeOutMs: 1200,

      // Geometry
      sizeMin: 40,
      sizeMax: 80,
      stemHeightMin: 100,
      stemHeightMax: 250,
      stemCurveMax: 0.3,
      wobbleAmpPx: 3,
      wobbleFreq: 8,
      petalCountMin: 5,
      petalCountMax: 7,
      backPetalCountMin: 4,
      backPetalCountMax: 5,
      backScale: 1.4,
      frontScale: 1,

      // Palette / color controls (HSLA)
      paletteMode: "magenta", // magenta | randomHsl | custom
      petalHue: 300,
      petalHueVariance: 30,
      petalSaturation: 80,
      petalLightness: 60,
      petalAlpha: 0.85,

      backPetalHueOffset: -20,
      backPetalSaturation: 45,
      backPetalLightness: 45,
      backPetalAlpha: 0.7,

      centerHue: 50,
      centerHueVariance: 20,
      centerSaturation: 90,
      centerLightness: 60,
      centerAlpha: 0.9,

      stemHue: 110,
      stemHueVariance: 25,
      stemSaturation: 50,
      stemLightness: 35,
      stemAlpha: 0.9,

      // Glow / highlights
      stemGlowBlur: 5,
      petalGlowBlurFront: 25,
      petalGlowBlurBack: 15,
      centerGlowBlur: 20,
      petalHighlightAlpha: 0.4,
      centerHighlightAlpha: 0.6,
    },
    snow: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      emissionRate: 14, // particles per second
      maxParticles: 180,
      speedMin: 20,
      speedMax: 55,
      direction: "normal", // normal | left | right
      windStrength: 0, // px/sec (applied when direction is left/right)
      windVariance: 12, // random horizontal drift strength
      drift: 18, // sway amplitude
      sizeMin: 2,
      sizeMax: 5,
      particleLifetimeSec: 30, // ensures flakes reach the bottom on slow speeds
      colorHex: "#ffffff",
    },
    snowflakes: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      emissionRate: 10, // particles per second
      maxParticles: 140,
      speedMin: 18,
      speedMax: 50,
      direction: "normal", // normal | left | right
      windStrength: 0, // px/sec (applied when direction is left/right)
      drift: 22, // sway amplitude
      sizeMin: 2,
      sizeMax: 6,
      particleLifetimeSec: 30, // ensures flakes reach the bottom on slow speeds
      colorHex: "#ffffff",
    },
    fallingStars: {
      durationMs: 5200,
      stacking: "additive", // additive | exclusive
      maxParticles: 220,
      spawnRate: 20, // ms between spawns
      baseSize: 20, // Base star size
      sizeVariation: 0.2, // Size randomness (0-1)
      gravity: 0.005, // Gravity strength
      maxVelocity: 10, // Max falling velocity
      velocityVariation: 4, // Random velocity range
      rotationSpeed: 0.1, // Rotation speed
      shrinkRate: 0.01, // How fast stars shrink
      fadeRate: 0.01, // Opacity fade rate
      fadeStartPercent: 100, // Start fade/shrink near the end (0-100)
      theme: "blue", // blue | purple | red | orange | mix
      useCustomColor: false,
      customColorHex: "#ffffff",
      screenBlend: true, // Use screen blend mode
      shadowBlur: 20, // Glow intensity
      spawnMode: "rain", // rain | mouse | both
      mouseTrail: false, // Trail follows mouse (when spawnMode is mouse or both)
      mouseRandomness: 25, // Mouse position jitter
      clickExplosion: false, // Spawn burst on click
      explosionSize: 50, // Stars per click
      reverse: false, // Float up instead of fall
      useCircleClip: false, // Clip to circular area
    },
    radial: { durationMs: 700, color: "rgba(255,255,255,0.5)" },
    ripple: { durationMs: 900, color: "rgba(255,255,255,0.45)", rings: 3 },
    rippleReverse: {
      durationMs: 600,
      color: "#FF384B",
      mode: "reverse", // reverse | wobble | liquid
      reverseDelay: 0,
      holdTime: 300,
      origin: "center",
      opacity: 1.0,
      borderWidth: 0,
      borderColor: "#ffffff",
      easing: "ease-out",
      updateBackground: false,
    },
    waterRipple: {
      durationMs: 3000,
      resolution: 256,
      perturbance: 0.01,
      dropCount: 5,
    },
    water: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive
      cssOnly: true,
      texture: "effects-assets/Water-effect-normal.jpg",
      texture2: "effects-assets/Water-effect-normal.jpg",
      flowSpeed: 1.0,
      flow1: [0.14, -0.09],
      flow2: [-0.11, 0.13],
      tiling1: 2.4,
      tiling2: 1.9,
      rotate1Deg: 28,
      rotate2Deg: -22,
      distortion: 0.03,
      specular: 0.2,
      caustics: 0.14,
      tint: "rgba(120,180,220,0.35)",
      opacity: 0.78,
    },
    dust: { count: 80, durationMs: 4000, color: "rgba(139,115,85,0.6)" },
    glitter: {
      count: 80,
      durationMs: 2500,
      colors: ["#ffd700", "#ffffff", "#c0c0c0", "#ff69b4"],
    },
    laser: {
      thickness: 4,
      durationMs: 700,
      color: "#00ffff",
      opacity: 0.85,
      lines: 3,
      direction: "leftToRight", // leftToRight | rightToLeft | topToBottom | bottomToTop | diagTLBR | diagTRBL
      staggerMs: 80,
      glowPx: 12,
      offsetRangePct: 40,
    },
    fireworks: {
      bursts: 5,
      rays: 18,
      durationMs: 3000,
      colors: ["#ffea00", "#ff4dd2", "#22d3ee", "#f97316", "#22c55e"],
    },
    hexagon: {
      durationMs: 5200,
      stacking: "exclusive", // additive | exclusive
      originXPercent: 50,
      originYPercent: 50,
      len: 20,
      pixelSize: 2,
      count: 50,
      baseTime: 10,
      addedTime: 10,
      spawnChance: 1, // 0-1
      dieChance: 0.05, // 0-1
      sparkChance: 0.1, // 0-1
      sparkDist: 10,
      sparkSize: 2,
      hueStart: 0,
      hueChange: 0.1,
      saturation: 100,
      baseLight: 50,
      addedLight: 10,
      shadowToTimePropMult: 6,
      repaintAlpha: 0.04,
      compositeOperation: "lighter", // lighter | screen | source-over
    },
    energy: { sizePx: 220, durationMs: 700, color: "rgba(0,255,255,0.6)" },
    vhs: { durationMs: 3200, intensity: 0.6 },
    crt: { durationMs: 3600, scanlineOpacity: 0.16, vignette: 0.45 },
    ascii: {
      durationMs: 2800,
      color: "#00ff41",
      fontSizePx: 10,
      opacity: 0.85,
      backgroundAlpha: 0.82,
      blendMode: "screen", // normal | multiply | screen | overlay | soft-light
      letterSpacingPx: 0.5,
      lineHeight: 1.05,
    },
    bulge: {
      durationMs: 2000,
      scale: 1.35,
      centerXPercent: 50,
      centerYPercent: 50,
      glowAlpha: 0.2,
      radiusPercent: 60,
      blurPx: 1.5,
      saturate: 1.1,
    },
    grain: { durationMs: 4200, intensity: 0.18 },
    watercolor: { durationMs: 3800, intensity: 0.65 },
    eightBit: {
      durationMs: 3000,
      pixelSize: 8,
      intensity: 0.5,
      blendMode: "multiply", // normal | multiply | screen | overlay | soft-light
      colorHex: "#000000",
      lineAlpha: 0.08,
      jitterPx: 2,
      jitterMs: 0, // 0 = sync to effect duration
    },
    strobe: { durationMs: 2000, frequency: 12, color: "rgba(255,255,255,0.6)" },
    hardGlitch: { durationMs: 1200, intensity: 1 },
    shaderFire: { durationMs: 4000, intensity: 0.8, speed: 1.0 },
    pixelSort: { durationMs: 2000, intensity: 0.6 },
    crtTurnOff: { durationMs: 700, speed: 1.0, verticalDelay: 100, horizontalDelay: 200 },
    curtains: {
      durationMs: 3000,
      stacking: "exclusive", // additive | exclusive

      action: "open", // open | close | closeThenOpen
      holdMs: 800, // used by closeThenOpen and close

      color1Hex: "#8b0000",
      color2Hex: "#bf4848",
      overlayAlpha: 1,

      easing: "ease-out",

      rodEnabled: true,
      rodHeightPx: 30,
      rodColorHex: "#6b3b19",

      openWidthPercent: 10,
      openOffsetPercent: 16,
      openRotateDeg: 7,

      topPercent: -10,
      heightPercent: 120,
    },
    selfDestruct: {
      durationMs: 12000,
      stacking: "exclusive", // additive | exclusive

      messageText: "DEVICE SELF-DESTRUCTION",
      countdownSec: 9,

      showGrid: true,
      gridOpacity: 0.12,
      overlayOpacity: 0.35,
      panelOpacity: 0.82,

      warningColorHex: "#ff0000",
      textColorHex: "#ffffff",

      abortEnabled: false,

      crtEnabled: true,
      crtDelayMs: 1500,
      autoResetMs: 3000,
    },
    blur: {
      durationMs: 2000,
      amountPx: 12,
      bgAlpha: 0.02,
      blendMode: "normal", // normal | multiply | screen | overlay | soft-light
      saturate: 1.0,
      brightness: 1.0,
    },
    bleach: {
      durationMs: 2200,
      intensity: 0.5,
      colorHex: "#ffffff",
      blendMode: "screen", // normal | multiply | screen | overlay | soft-light
      brightness: 1.4,
      contrast: 1.3,
      saturate: 0.7,
    },
    colorCorrection: {
      durationMs: 2800,
      brightness: 1.1,
      contrast: 1.25,
      saturate: 1.15,
    },
    matrixDance: {
      durationMs: 5200,
      fontSizePx: 16,
      trailAlpha: 0.05,
    },
    spiderWeb: {
      durationMs: 4500,
      count: 1,
      placement: "random", // "random" | "center"
      paddingPercent: 10,
      opacity: 0.85,
      intensity: 1,
      quality: 0.75,
    },
    crackedGlass: {
      durationMs: 5200,
      countMode: "random", // "random" | "fixed"
      randomMinCount: 3,
      randomMaxCount: 7,
      count: 5,
      distribution: "screen", // "screen" | "cluster"
      clusterRadiusPercent: 35,
      origin: "random", // "random" | "center" | "custom"
      originXPercent: 50,
      originYPercent: 50,
      minIntensity: 0.5,
      maxIntensity: 1.5,
      delayStepMs: 150,
      opacity: 1,
      colorMode: "white", // "white" | "tint"
      hue: 190,
      hueVariance: 0,
      saturation: 70,
      lightness: 80,
      flashMode: "single", // "single" | "strobe"
      flashOpacity: 0.7,
      strobePulses: 3,
      strobeIntervalMs: 160,
      shakeEnabled: true,
      impactEnabled: true,
      lineWidthBase: 2,
      lineWidthJitter: 1,
      jaggednessPx: 8,
      branchDepth: 2,
      shardProbability: 0.3,
    },
    heartParticles: {
      durationMs: 4000,
      density: 50,
      blastSize: 30,
      minSize: 10,
      gravity: 0.1,
      speed: 4,
      shrinkRate: 0.2,
      reverse: false,
      fadeRate: 0.01,
      theme: "red", // red | pink | purple | lightpink
      explosionCount: 1, // Number of explosions to create
      spreadType: "single", // single | random | grid
    },
    ecgHeartbeat: {
      durationMs: 5000,
      pulseType: "pulsar", // pulsar | jugular | bleed | flatline | longbeat
      cycleSec: 2.5, // seconds per loop
      strokeWidth: 2,
      colorHex: "#00ffaa",
      easing: "linear", // linear | ease | ease-in | ease-out | ease-in-out
      shadow: true,
      reverse: false,
      glow: false,
      opacity: 1,
      yPercent: 50,
      scale: 1,
    },
    aura: {
      durationMs: 3000,
      level: "warm", // cold | warm | hot
      intensity: 0.3,
      color: "#fb923c", // Auto-set based on level if not provided
      gradientCenter: "50% 40%",
      gradientRadius: "70%",
      opacity: 1.0,
      blendMode: "normal", // normal | screen | multiply | overlay
    },
  };
})();
