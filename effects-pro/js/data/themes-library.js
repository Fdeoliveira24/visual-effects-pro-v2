(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._data = effectsPro._data || {};

  /**
   * Continuous themes library.
   * Data-only: no logic in this file.
   */
  effectsPro._data.THEMES_LIBRARY = {
    snow: {
      emissionRate: 14,
      maxParticles: 180,
      type: "snow",
      colors: ["#ffffff"],
      speedMin: 20,
      speedMax: 55,
      direction: "normal", // normal, left, right
      windStrength: 0, // px/sec (applied when direction is left/right)
      drift: 18, // sway amplitude
      sizeMin: 2,
      sizeMax: 5,
    },
    snowflakes: {
      emissionRate: 10,
      maxParticles: 140,
      type: "snowflake",
      colors: ["#ffffff"],
      speedMin: 18,
      speedMax: 50,
      direction: "normal", // normal, left, right
      windStrength: 0, // px/sec (applied when direction is left/right)
      drift: 22, // sway amplitude
      sizeMin: 2,
      sizeMax: 6,
    },
    rain: {
      emissionRate: 26,
      maxParticles: 220,
      type: "rain",
      colors: ["rgba(174,194,224,0.7)", "rgba(196,210,230,0.6)"],
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
      intensity: "medium", // soft, medium, heavy, storm
      direction: "normal", // normal, left, right
    },
    halloween: {
      emissionRate: 8,
      maxParticles: 120,
      type: "halloween",
      style: "spiders", // spiders | emoji | embers | mixed
      colors: ["#ff7a00", "#6b21a8", "#111827"], // used by "embers" style
      icons: ["🕸️", "🕷️", "🎃", "⚰️", "🦇", "👻", "💀", "☠️"],
      speedMin: 40,
      speedMax: 120,
      sizeMin: 18,
      sizeMax: 46,
      drift: 28,
      direction: "normal", // normal, left, right
      windStrength: 0, // px/sec (applied when direction is left/right)
      webLineAlpha: 0.35, // spider string alpha
      webLineWidth: 1, // px
      spiderColor: "#110D04",
      stringLenMin: 180,
      stringLenMax: 520,
      ghostCount: 6,
      ghostSizeMin: 90,
      ghostSizeMax: 120,
      ghostDirection: "mixed", // mixed | leftToRight | rightToLeft
      ghostRandomness: 0, // 0..1
    },
    christmasLights: {
      type: "christmasLights",
      cssOnly: true,
      starsCount: 100,
      bokehCount: 15,
      snowflakeCount: 150,
      lightCount: 40,
      snowAccumulateHeight: 200,
      snowAccumulateSec: 45,
    },
    spinningRays: {
      type: "spinningRays",
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
      type: "sineWaves",
      cssOnly: true,
      speed: 8,
      centerYPercent: 50,
      waveWidthPercent: 95,
      waveLeftPercent: 2.5,
      clearMode: "clear", // clear | trails
      trailAlpha: 0.18, // used when clearMode="trails" (0..1, higher = shorter trails)
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
    flowers: {
      type: "flowers",
      cssOnly: true,
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

      // Animation / lifecycle
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
    easter: {
      emissionRate: 12,
      maxParticles: 160,
      type: "egg",
      colors: ["#f9a8d4", "#86efac", "#93c5fd", "#fde68a", "#d8b4fe", "#fecdd3"],
      sizeMin: 12,
      sizeMax: 26,
      speedMin: 30,
      speedMax: 90,
      drift: 20,
    },
    bubbles: {
      emissionRate: 8,
      maxParticles: 120,
      type: "bubble",
      colors: ["rgba(135,206,250,0.85)", "rgba(148,197,255,0.85)", "rgba(186,230,253,0.8)"],
      sizeMin: 12,
      sizeMax: 60,
      speedMin: 20,
      speedMax: 60,
      drift: 24,
      strokeWidth: 2,
    },
    leaves: {
      emissionRate: 10,
      maxParticles: 140,
      type: "leaf",
      colors: ["#309900", "#005600", "#5e9900", "#2b5600", "#564500"],
      sizeMin: 10,
      sizeMax: 24,
      speedMin: 30,
      speedMax: 80,
      drift: 28,
    },
    fire: {
      emissionRate: 22,
      maxParticles: 200,
      type: "fire",
      colors: ["#ff4500", "#ff8c00", "#ffd166", "#f97316", "#fb7185"],
      sizeMin: 8,
      sizeMax: 22,
      speedMin: 70,
      speedMax: 160,
      drift: 40,
    },
    water: {
      type: "shaderWater",
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
    wind: {
      emissionRate: 14,
      maxParticles: 160,
      type: "wind",
      colors: ["rgba(203,213,225,0.7)", "rgba(148,163,184,0.6)", "rgba(226,232,240,0.6)"],
      speedMin: 90,
      speedMax: 180,
      lengthMin: 60,
      lengthMax: 140,
      drift: 32,
    },
    strobe: {
      type: "strobe",
      cssOnly: true,
      frequency: 8,
      color: "rgba(255,255,255,0.22)",
    },
    smoke: {
      type: "shaderSmoke",
      cssOnly: true,
      intensity: 0.5,
      speed: 0.8,
      riseSoftness: 0.3,
      direction: "up",
    },
    burn: {
      type: "shaderBurn",
      cssOnly: true,
      progressSpeed: 1.0,
      flameSpeed: 1.0,
      background: "white",
      loop: true,
    },
    flames: {
      type: "cssfire",
      cssOnly: true,
      intensity: 1.0,
      speed: 1.0,
      scale: 1.0,
      showBackground: false,
    },
    bokeh: {
      type: "cssbokeh",
      cssOnly: true,
      lightCount: 150,
      lightSize: 75,
      blurLevel: 2,
      speed: 1.0,
      palette: "festive",
    },
    electric: {
      type: "electric",
      cssOnly: true,
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
    storm: {
      type: "storm",
      cssOnly: true,
      backgroundOpacity: 1,
      lightningCycleMs: 6000,
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
      randomBoltStartDelayMs: 8000,
      randomBoltDelayMinMs: 3000,
      randomBoltDelayMaxMs: 7000,
      randomBoltDurationMinMs: 400,
      randomBoltDurationMaxMs: 600,
    },
    fallingStars: {
      type: "fallingStars",
      cssOnly: false,
      maxParticles: 220,
      // Spawning
      spawnRate: 20, // ms between spawns
      baseSize: 20, // Base star size
      sizeVariation: 0.2, // Size randomness (0-1)

      // Physics
      gravity: 0.005, // Gravity strength
      maxVelocity: 10, // Max falling velocity
      velocityVariation: 4, // Random velocity range

      // Animation
      rotationSpeed: 0.1, // Rotation speed
      shrinkRate: 0.01, // How fast stars shrink
      fadeRate: 0.01, // Opacity fade rate
      fadeStartPercent: 100, // Start fade/shrink near the end (0-100)

      // Appearance
      theme: "blue", // blue | purple | red | orange
      useCustomColor: false,
      customColorHex: "#ffffff",
      screenBlend: true, // Use screen blend mode
      shadowBlur: 20, // Glow intensity

      // Spawn mode
      spawnMode: "rain", // rain | mouse | both

      // Interaction
      mouseTrail: false, // Trail follows mouse (when spawnMode is mouse or both)
      mouseRandomness: 25, // Mouse position jitter
      clickExplosion: false, // Spawn burst on click (global listener; disabled by default)
      explosionSize: 50, // Stars per click

      // Direction
      reverse: false, // Float up instead of fall

      // Circle clip
      useCircleClip: false, // Clip to circular area
    },
  };
})();
