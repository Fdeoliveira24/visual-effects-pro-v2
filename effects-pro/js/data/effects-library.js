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
    cinema: { barHeightPercent: 12, durationMs: 600, color: "#000000" },
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
    rain: { count: 220, durationMs: 4200, color: "rgba(174,194,224,0.7)" },
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
    energy: { sizePx: 220, durationMs: 700, color: "rgba(0,255,255,0.6)" },
    vhs: { durationMs: 3200, intensity: 0.6 },
    crt: { durationMs: 3600, scanlineOpacity: 0.16, vignette: 0.45 },
    ascii: { durationMs: 2800, color: "#00ff41", fontSizePx: 10 },
    bulge: { durationMs: 2000, scale: 1.35 },
    grain: { durationMs: 4200, intensity: 0.18 },
    watercolor: { durationMs: 3800, intensity: 0.65 },
    eightBit: { durationMs: 3000, pixelSize: 8, intensity: 0.5 },
    strobe: { durationMs: 2000, frequency: 12, color: "rgba(255,255,255,0.6)" },
    hardGlitch: { durationMs: 1200, intensity: 1 },
    shaderFire: { durationMs: 4000, intensity: 0.8, speed: 1.0 },
    pixelSort: { durationMs: 2000, intensity: 0.6 },
    crtTurnOff: { durationMs: 700, speed: 1.0, verticalDelay: 100, horizontalDelay: 200 },
    blur: { durationMs: 2000, amountPx: 12 },
    bleach: { durationMs: 2200, intensity: 0.5 },
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
