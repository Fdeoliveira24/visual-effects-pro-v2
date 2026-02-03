(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};
  // Ensure a stable shared registry exists before other modules capture a reference.
  effectsPro._internals.particles = effectsPro._internals.particles || {};

  const { rand, randInt, clamp } = effectsPro._internals.helpers || {};

  function adjustColor(color, amount) {
    if (typeof color !== "string" || color.indexOf("#") !== 0 || color.length < 7) {
      return color;
    }
    const clampFn =
      typeof clamp === "function" ? clamp : (v, min, max) => Math.min(max, Math.max(min, v));
    const hex = color.replace("#", "");
    if (hex.length !== 6) return color;
    const r = clampFn(parseInt(hex.substring(0, 2), 16) + amount, 0, 255);
    const g = clampFn(parseInt(hex.substring(2, 4), 16) + amount, 0, 255);
    const b = clampFn(parseInt(hex.substring(4, 6), 16) + amount, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  function directionToTilt(direction) {
    if (direction === "left") return -1;
    if (direction === "right") return 1;
    return 0;
  }

  class ConfettiParticle {
    constructor(x, y, color, life, options) {
      const opts = options || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.vx = rand(opts.vxMin || -120, opts.vxMax || 120);
      this.vy = rand(opts.vyMin || -220, opts.vyMax || -60);
      this.gravity = typeof opts.gravity === "number" ? opts.gravity : 300;
      this.rotation = rand(0, Math.PI * 2);
      this.rotationSpeed = rand(-6, 6);

      // Shape Logic
      const shapeOpt = opts.shape || "mixed";
      if (shapeOpt === "rect") this.shape = "rect";
      else if (shapeOpt === "circle") this.shape = "circle";
      else this.shape = Math.random() < 0.6 ? "rect" : "circle";

      // Size Logic
      const sMin = typeof opts.sizeMin === "number" ? opts.sizeMin : 6;
      const sMax = typeof opts.sizeMax === "number" ? opts.sizeMax : 12;
      this.size = rand(Math.min(sMin, sMax), Math.max(sMin, sMax));

      this.drag = rand(0.98, 0.995);
      this.wobblePhase = rand(0, Math.PI * 2);
      this.wobbleSpeed = rand(8, 14);
      this.tiltAngle = rand(0, Math.PI * 2);
      this.tiltSpeed = rand(2, 5);
      this.wind = typeof opts.wind === "number" ? opts.wind : 0;
    }

    update(dt, w, h) {
      this.age += dt;
      this.vy += this.gravity * dt;
      this.vx *= this.drag;
      this.wobblePhase += this.wobbleSpeed * dt;
      this.tiltAngle += this.tiltSpeed * dt;
      const wobbleDrift = Math.sin(this.wobblePhase) * 0.4;
      this.x += (this.vx + wobbleDrift * 30 + this.wind) * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotationSpeed * dt * (0.6 + 0.4 * Math.cos(this.tiltAngle));
      if (this.age >= this.life || this.y > h + 40) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 8);
      const fadeOut = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      const alpha = fadeIn * fadeOut;
      const tiltFactor = 0.3 + 0.7 * Math.abs(Math.cos(this.tiltAngle));
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(1, tiltFactor);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = this.color;
      if (this.shape === "rect") {
        ctx.fillRect(-this.size / 2, -this.size / 3, this.size, this.size / 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class SparkleParticle {
    constructor(x, y, color, life) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.size = rand(2, 4.5);
      this.twinkle = rand(6, 12);
      this.twinkleOffset = rand(0, Math.PI * 2);
      this.rotation = rand(0, Math.PI * 2);
      this.rotationSpeed = rand(-3, 3);
      this.pulsePhase = rand(0, Math.PI * 2);
    }

    update(dt) {
      this.age += dt;
      this.rotation += this.rotationSpeed * dt;
      this.pulsePhase += dt * 4;
      if (this.age >= this.life) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 6);
      const fadeOut = t > 0.6 ? 1 - ((t - 0.6) / 0.4) * ((t - 0.6) / 0.4) : 1;
      const lifeAlpha = fadeIn * fadeOut;
      const flicker = 0.4 + 0.6 * Math.sin(this.age * this.twinkle + this.twinkleOffset);
      const sizeVar = 1 + 0.15 * Math.sin(this.pulsePhase);
      const s = this.size * sizeVar;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.lineCap = "round";
      ctx.globalAlpha = lifeAlpha * flicker * 0.35;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-s * 1.3, 0);
      ctx.lineTo(s * 1.3, 0);
      ctx.moveTo(0, -s * 1.3);
      ctx.lineTo(0, s * 1.3);
      ctx.stroke();
      ctx.globalAlpha = lifeAlpha * flicker;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(s, 0);
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
      ctx.stroke();
      ctx.restore();
    }
  }

  class GlitterParticle {
    constructor(x, y, color, life) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.size = rand(3, 6);
      this.twinkle = rand(8, 14);
      this.twinkleOffset = rand(0, Math.PI * 2);
      this.secondaryTwinkle = rand(3, 6);
      this.rotation = rand(0, Math.PI * 2);
      this.rotationSpeed = rand(-4, 4);
    }

    update(dt) {
      this.age += dt;
      this.rotation += this.rotationSpeed * dt;
      if (this.age >= this.life) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 5);
      const fadeOut = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      const alpha = fadeIn * fadeOut;
      const twinkle = 0.4 + 0.6 * Math.sin(this.age * this.twinkle + this.twinkleOffset);
      const pulse = 0.5 + 0.5 * Math.sin(this.age * this.secondaryTwinkle);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = alpha * twinkle;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size * 0.6, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = alpha * twinkle * pulse * 0.6;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class DustParticle {
    constructor(x, y, color, life, options) {
      const cfg = options || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.size = rand(1.5, 4);
      this.vx = rand(-20, 20);
      this.vy = rand(-30, -10);
      this.drift = cfg.drift || 12;
      this.spin = rand(-2, 2);
      this.angle = rand(0, Math.PI * 2);
      this.opacity = rand(0.25, 0.8);
    }

    update(dt, w) {
      this.age += dt;
      this.angle += this.spin * dt;
      this.vx += Math.sin(this.angle) * this.drift * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.age >= this.life || this.y < -30 || this.x < -30 || this.x > w + 30) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 6);
      const fadeOut = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
      const alpha = fadeIn * fadeOut * this.opacity;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class RainParticle {
    constructor(x, y, color, life, cfg) {
      const opts = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;

      this.length = rand(Number(opts.lengthMin) || 12, Number(opts.lengthMax) || 28);
      this.speed = rand(Number(opts.speedMin) || 500, Number(opts.speedMax) || 900);

      // Apply direction-based drift (keeps v1 semantics).
      const baseDrift = Number(opts.drift) || 60;
      let windMin;
      let windMax;
      if (opts.direction === "left") {
        windMin = baseDrift * 0.8;
        windMax = baseDrift * 1.5;
      } else if (opts.direction === "right") {
        windMin = -baseDrift * 1.5;
        windMax = -baseDrift * 0.8;
      } else {
        windMin = typeof opts.windMin === "number" ? opts.windMin : -baseDrift;
        windMax = typeof opts.windMax === "number" ? opts.windMax : baseDrift;
      }

      this.wind = rand(windMin, windMax);
      this.thickness = rand(Number(opts.thicknessMin) || 0.8, Number(opts.thicknessMax) || 1.4);
      this.windVar = rand(Number(opts.windVarMin) || -8, Number(opts.windVarMax) || 8);
      this.fade = rand(0.5, 0.9);

      this.splashes = opts.splashes !== false;
      this.splashing = false;
      this.splashAge = 0;
      this.splashDuration = 0.15;
      this.groundY = 0;
    }

    update(dt, w, h) {
      this.age += dt;

      if (this.splashing) {
        this.splashAge += dt;
        if (this.splashAge >= this.splashDuration) {
          this.alive = false;
        }
        return;
      }

      // Add subtle wind variability for a more natural rain sheet.
      this.wind += this.windVar * dt;
      this.x += this.wind * dt;
      this.y += this.speed * dt;

      if (this.splashes && this.y >= h - this.length) {
        this.splashing = true;
        this.groundY = h;
        return;
      }

      if (this.age >= this.life || this.y > h + 60 || this.x < -120 || this.x > w + 120) {
        this.alive = false;
      }
    }

    draw(ctx) {
      if (this.splashing) {
        const splashT = this.splashAge / this.splashDuration;
        const splashAlpha = (1 - splashT) * 0.6;
        const splashSize = splashT * 8;

        ctx.save();
        ctx.globalAlpha = splashAlpha;
        ctx.strokeStyle = this.color;
        ctx.lineCap = "round";

        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const spread = splashSize * (0.8 + Math.random() * 0.4);
          ctx.lineWidth = this.thickness * (1 - splashT * 0.5);
          ctx.beginPath();
          ctx.moveTo(this.x, this.groundY);
          ctx.lineTo(
            this.x + Math.cos(angle) * spread,
            this.groundY - Math.abs(Math.sin(angle)) * spread * 0.5
          );
          ctx.stroke();
        }

        ctx.restore();
        return;
      }

      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 10);
      const fadeOut = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const alpha = fadeIn * fadeOut * this.fade;

      const endX = this.x + this.wind * 0.04;
      const endY = this.y + this.length;

      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineCap = "round";
      ctx.lineWidth = this.thickness;

      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.lineWidth = this.thickness * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.length * 0.3);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.restore();
    }
  }

  class SmokeParticle {
    constructor(x, y, color, life) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.radius = rand(10, 30);
      this.vx = rand(-18, 18);
      this.vy = rand(-12, -22);
      this.spin = rand(-1, 1);
      this.phase = rand(0, Math.PI * 2);
    }

    update(dt) {
      this.age += dt;
      this.phase += dt * 1.7;
      this.x += (this.vx + Math.sin(this.phase) * 16) * dt;
      this.y += this.vy * dt;
      this.radius += dt * 8;
      if (this.age >= this.life || this.y < -80) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 4);
      const fadeOut = t > 0.55 ? 1 - (t - 0.55) / 0.45 : 1;
      const alpha = fadeIn * fadeOut * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class HalloweenEmojiParticle {
    constructor(x, y, icon, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.icon = icon || "🎃";
      this.life = life;
      this.age = 0;
      this.alive = true;

      const rawSizeMin = Number(c.sizeMin);
      const rawSizeMax = Number(c.sizeMax);
      const sizeMin = Number.isFinite(rawSizeMin) ? rawSizeMin : 18;
      const sizeMax = Number.isFinite(rawSizeMax) ? rawSizeMax : 46;
      this.size = rand(Math.min(sizeMin, sizeMax), Math.max(sizeMin, sizeMax));

      const rawSpeedMin = Number(c.speedMin);
      const rawSpeedMax = Number(c.speedMax);
      const fallMin = Number.isFinite(rawSpeedMin) ? rawSpeedMin : 40;
      const fallMax = Number.isFinite(rawSpeedMax) ? rawSpeedMax : 120;
      this.vy = rand(Math.min(fallMin, fallMax), Math.max(fallMin, fallMax));

      this.vx = rand(-18, 18);
      const rawDrift = Number(c.drift);
      this.drift = Number.isFinite(rawDrift) ? rawDrift : 28;

      this.phase = rand(0, Math.PI * 2);
      this.spin = rand(-1.2, 1.2);
      this.rotation = rand(0, Math.PI * 2);

      const direction = c.direction || "normal";
      const dirTilt = directionToTilt(direction);
      const rawWindStrength = Number(c.windStrength);
      const windStrength = Number.isFinite(rawWindStrength) ? rawWindStrength : 0;
      this.wind = dirTilt * windStrength;
    }

    update(dt, w, h) {
      this.age += dt;
      this.phase += dt * (0.7 + Math.random() * 0.3);
      this.rotation += this.spin * dt;
      this.x += (this.vx + Math.sin(this.phase) * this.drift + this.wind) * dt;
      this.y += this.vy * dt;

      if (this.x < -80) this.x = w + 80;
      if (this.x > w + 80) this.x = -80;
      if (this.age >= this.life || this.y > h + 80) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 6);
      const fadeOut = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const alpha = fadeIn * fadeOut;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = alpha;

      // Prefer platform emoji fonts but fall back gracefully.
      ctx.font = `${
        this.size
      }px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.icon, 0, 0);

      ctx.restore();
    }
  }

  class SpiderDropParticle {
    constructor(x, y, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.life = life;
      this.age = 0;
      this.alive = true;

      const rawSpeedMin = Number(c.speedMin);
      const rawSpeedMax = Number(c.speedMax);
      const fallMin = Number.isFinite(rawSpeedMin) ? rawSpeedMin : 40;
      const fallMax = Number.isFinite(rawSpeedMax) ? rawSpeedMax : 120;
      this.vy = rand(Math.min(fallMin, fallMax), Math.max(fallMin, fallMax));

      const rawSizeMin = Number(c.sizeMin);
      const rawSizeMax = Number(c.sizeMax);
      const sizeMin = Number.isFinite(rawSizeMin) ? rawSizeMin : 18;
      const sizeMax = Number.isFinite(rawSizeMax) ? rawSizeMax : 46;
      this.scale = rand(Math.min(sizeMin, sizeMax), Math.max(sizeMin, sizeMax)) / 40;

      const rawDrift = Number(c.drift);
      this.drift = Number.isFinite(rawDrift) ? rawDrift : 28;
      this.phase = rand(0, Math.PI * 2);
      this.swingSpeed = rand(0.7, 1.3);

      const direction = c.direction || "normal";
      const dirTilt = directionToTilt(direction);
      const rawWindStrength = Number(c.windStrength);
      const windStrength = Number.isFinite(rawWindStrength) ? rawWindStrength : 0;
      this.wind = dirTilt * windStrength;

      const lenMin = Number.isFinite(Number(c.stringLenMin)) ? Number(c.stringLenMin) : 180;
      const lenMax = Number.isFinite(Number(c.stringLenMax)) ? Number(c.stringLenMax) : 520;
      this.stringLen = rand(Math.min(lenMin, lenMax), Math.max(lenMin, lenMax));

      this.color = typeof c.spiderColor === "string" && c.spiderColor ? c.spiderColor : "#110D04";
      this.webAlpha = Number.isFinite(Number(c.webLineAlpha)) ? Number(c.webLineAlpha) : 0.35;
      this.webWidth = Number.isFinite(Number(c.webLineWidth)) ? Number(c.webLineWidth) : 1;

      this.legPhase = rand(0, Math.PI * 2);
      this.legSpeed = rand(6, 9);
    }

    update(dt, w, h) {
      this.age += dt;
      this.phase += this.swingSpeed * dt;
      this.legPhase += this.legSpeed * dt;
      this.x += (Math.sin(this.phase) * this.drift + this.wind) * dt;
      this.y += this.vy * dt;

      if (this.x < -120) this.x = w + 120;
      if (this.x > w + 120) this.x = -120;
      if (this.age >= this.life || this.y > h + 100) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 5);
      const fadeOut = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const alpha = fadeIn * fadeOut;

      const bodyR = 10 * this.scale;
      const headR = 6.5 * this.scale;
      const legLen = 14 * this.scale;
      const legSpread = 10 * this.scale;
      const swing = Math.sin(this.legPhase) * 0.25;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Web string.
      ctx.strokeStyle = `rgba(255,255,255,${this.webAlpha})`;
      ctx.lineWidth = this.webWidth;
      ctx.beginPath();
      ctx.moveTo(this.x, Math.max(0, this.y - this.stringLen));
      ctx.lineTo(this.x, this.y - bodyR);
      ctx.stroke();

      // Spider body.
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, 2 * this.scale);

      // Legs (simple animated arcs).
      for (let i = 0; i < 4; i++) {
        const yOff = (-3 + i * 3.2) * this.scale;
        const k = (i + 1) / 4;
        const bend = (0.35 + 0.25 * k) * (1 + swing);
        // Left
        ctx.beginPath();
        ctx.moveTo(this.x - bodyR * 0.6, this.y + yOff);
        ctx.quadraticCurveTo(
          this.x - (bodyR + legSpread) * (0.7 + 0.2 * k),
          this.y + yOff + legLen * bend,
          this.x - (bodyR + legSpread + legLen) * (0.55 + 0.2 * k),
          this.y + yOff + legLen * (0.9 + 0.1 * k)
        );
        ctx.stroke();
        // Right
        ctx.beginPath();
        ctx.moveTo(this.x + bodyR * 0.6, this.y + yOff);
        ctx.quadraticCurveTo(
          this.x + (bodyR + legSpread) * (0.7 + 0.2 * k),
          this.y + yOff + legLen * bend,
          this.x + (bodyR + legSpread + legLen) * (0.55 + 0.2 * k),
          this.y + yOff + legLen * (0.9 + 0.1 * k)
        );
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, bodyR, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y - bodyR * 0.85, headR, 0, Math.PI * 2);
      ctx.fill();

      // Eyes.
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = alpha * 0.9;
      ctx.beginPath();
      ctx.arc(this.x - headR * 0.35, this.y - bodyR * 0.95, headR * 0.18, 0, Math.PI * 2);
      ctx.arc(this.x + headR * 0.35, this.y - bodyR * 0.95, headR * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  class SnowflakeParticle {
    // eslint-disable-next-line max-params
    constructor(x, y, color, life, speedMin, speedMax, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;

      const rawSizeMin = Number(c.sizeMin);
      const rawSizeMax = Number(c.sizeMax);
      const sizeMin = Number.isFinite(rawSizeMin) ? rawSizeMin : 2;
      const sizeMax = Number.isFinite(rawSizeMax) ? rawSizeMax : 6;
      const sizeLow = Math.min(sizeMin, sizeMax);
      const sizeHigh = Math.max(sizeMin, sizeMax);
      this.size = rand(sizeLow, sizeHigh);

      const rawSpeedMin = Number(speedMin);
      const rawSpeedMax = Number(speedMax);
      const fallMin = Number.isFinite(rawSpeedMin) ? rawSpeedMin : 18;
      const fallMax = Number.isFinite(rawSpeedMax) ? rawSpeedMax : 50;
      this.speed = rand(Math.min(fallMin, fallMax), Math.max(fallMin, fallMax));

      this.wobble = rand(0, Math.PI * 2);
      this.wobbleSpeed = rand(1, 2.5);

      const rawDrift = Number(c.drift);
      const drift = Number.isFinite(rawDrift) ? rawDrift : 22;
      this.wobbleAmp = rand(drift * 0.6, drift * 1.6);

      this.wobble2 = rand(0, Math.PI * 2);
      this.wobble2Speed = rand(0.3, 0.8);
      this.shimmer = rand(3, 6);

      const direction = c.direction || "normal";
      const dirTilt = directionToTilt(direction);
      const rawWindStrength = Number(c.windStrength);
      const windStrength = Number.isFinite(rawWindStrength) ? rawWindStrength : 0;
      this.wind = dirTilt * windStrength;
    }

    update(dt, w, h) {
      this.age += dt;
      this.wobble += this.wobbleSpeed * dt;
      this.wobble2 += this.wobble2Speed * dt;
      const primarySway = Math.sin(this.wobble) * this.wobbleAmp;
      const secondarySway = Math.sin(this.wobble2) * this.wobbleAmp * 0.25;
      this.x += (primarySway + secondarySway + this.wind) * dt;
      this.y += this.speed * dt;

      if (this.x < -80) this.x = w + 80;
      if (this.x > w + 80) this.x = -80;

      if (this.age >= this.life || this.y > h + 20) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 5);
      const fadeOut = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
      const baseAlpha = fadeIn * fadeOut * 0.85;
      const shimmerMod = 0.9 + 0.1 * Math.sin(this.age * this.shimmer);

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = baseAlpha * shimmerMod;
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size * 0.3;
      ctx.lineCap = "round";

      // Draw 6 radial arms of the snowflake.
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);

        // Main arm.
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.size * 2.5);
        ctx.stroke();

        // Side branches.
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 1.2);
        ctx.lineTo(-this.size * 0.7, -this.size * 1.8);
        ctx.moveTo(0, -this.size * 1.2);
        ctx.lineTo(this.size * 0.7, -this.size * 1.8);
        ctx.stroke();

        // Small dots at ends.
        ctx.beginPath();
        ctx.arc(0, -this.size * 2.5, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center crystal.
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  class SnowParticle {
    // eslint-disable-next-line max-params
    constructor(x, y, color, life, speedMin, speedMax, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;

      const rawSizeMin = Number(c.sizeMin);
      const rawSizeMax = Number(c.sizeMax);
      const sizeMin = Number.isFinite(rawSizeMin) ? rawSizeMin : 2;
      const sizeMax = Number.isFinite(rawSizeMax) ? rawSizeMax : 5;
      this.size = rand(Math.min(sizeMin, sizeMax), Math.max(sizeMin, sizeMax));

      const rawSpeedMin = Number(speedMin);
      const rawSpeedMax = Number(speedMax);
      const fallMin = Number.isFinite(rawSpeedMin) ? rawSpeedMin : 20;
      const fallMax = Number.isFinite(rawSpeedMax) ? rawSpeedMax : 55;
      this.vy = rand(Math.min(fallMin, fallMax), Math.max(fallMin, fallMax));

      const rawWindVar = Number(c.windVariance);
      const windVar = Number.isFinite(rawWindVar) ? Math.max(0, rawWindVar) : 12;
      this.vx = rand(-windVar, windVar);
      this.phase = rand(0, Math.PI * 2);
      this.spin = rand(-1.5, 1.5);
      this.rotation = rand(0, Math.PI * 2);

      const rawDrift = Number(c.drift);
      this.drift = Number.isFinite(rawDrift) ? rawDrift : 18;

      const direction = c.direction || "normal";
      const dirTilt = directionToTilt(direction);
      const rawWindStrength = Number(c.windStrength);
      const windStrength = Number.isFinite(rawWindStrength) ? rawWindStrength : 0;
      this.wind = dirTilt * windStrength;
    }

    update(dt, w, h) {
      this.age += dt;
      this.phase += dt * (0.8 + Math.random() * 0.2);
      this.rotation += this.spin * dt;
      this.x += (this.vx + Math.sin(this.phase) * this.drift + this.wind) * dt;
      this.y += this.vy * dt;
      if (this.y > h + 30 || this.age >= this.life) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 5);
      const fadeOut = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
      ctx.save();
      ctx.globalAlpha = fadeIn * fadeOut;
      ctx.fillStyle = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class BubbleParticle {
    constructor(x, y, color, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.size = rand(Number(c.sizeMin) || 12, Number(c.sizeMax) || 60);
      this.vy = -rand(Number(c.speedMin) || 20, Number(c.speedMax) || 60);
      this.vx = rand(-12, 12);
      this.drift = Number(c.drift) || 24;
      this.phase = rand(0, Math.PI * 2);
      this.strokeWidth = Number(c.strokeWidth) || 2;
    }

    update(dt, w) {
      this.age += dt;
      this.phase += dt * 1.4;
      this.x += (this.vx + Math.sin(this.phase) * this.drift) * dt;
      this.y += this.vy * dt;
      if (this.age >= this.life || this.y < -this.size - 40 || this.x < -80 || this.x > w + 80) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 4);
      const fadeOut = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const alpha = fadeIn * fadeOut;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.strokeWidth;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        this.x - this.size * 0.12,
        this.y - this.size * 0.12,
        this.size * 0.12,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  class LeafParticle {
    constructor(x, y, color, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;

      this.width = rand(Number(c.sizeMin) || 10, Number(c.sizeMax) || 24);
      this.height = this.width * rand(1.2, 1.8);
      this.speed = rand(Number(c.speedMin) || 30, Number(c.speedMax) || 80);

      const driftBase = Number(c.drift) || 28;
      this.drift = rand(-driftBase, driftBase);
      this.wobble = rand(0, Math.PI * 2);
      this.wobbleSpeed = rand(0.6, 1.6);
      this.wobbleAmp = rand(8, 18);

      this.rotation = rand(0, Math.PI * 2);
      this.rotationSpeed = rand(-3, 3);
      this.rotationAccel = rand(-4, 4);
      this.tumblePhase = rand(0, Math.PI * 2);
      this.tumbleSpeed = rand(1.5, 3);
    }

    update(dt, w, h) {
      this.age += dt;

      this.wobble += this.wobbleSpeed * dt;
      this.tumblePhase += this.tumbleSpeed * dt;

      // Variable rotation speed creates a tumbling effect.
      this.rotationSpeed += this.rotationAccel * dt;
      this.rotationSpeed = Math.max(-8, Math.min(8, this.rotationSpeed));
      this.rotationSpeed *= 0.98;

      // Periodic flip acceleration.
      const tumbleForce = Math.sin(this.tumblePhase) * 6;
      this.rotation += (this.rotationSpeed + tumbleForce * dt) * dt;

      this.x += (this.drift + Math.sin(this.wobble) * this.wobbleAmp) * dt;
      this.y += this.speed * dt;

      if (this.age >= this.life || this.y > h + this.height * 2) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 4);
      const fadeOut = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const alpha = fadeIn * fadeOut * 0.9;
      const w = this.width;
      const h = this.height;
      ctx.save();

      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      const light = adjustColor(this.color, 25);
      const dark = adjustColor(this.color, -35);
      const gradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      gradient.addColorStop(0, light);
      gradient.addColorStop(1, dark);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(w / 2, -h / 4, w / 2, h / 4, 0, h / 2);
      ctx.bezierCurveTo(-w / 2, h / 4, -w / 2, -h / 4, 0, -h / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = dark;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Midrib / vein
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = dark;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(0, h / 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  class EggParticle {
    constructor(x, y, color, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.width = rand(Number(c.sizeMin) || 12, Number(c.sizeMax) || 26);
      this.height = this.width * rand(1.25, 1.6);
      this.vy = rand(Number(c.speedMin) || 30, Number(c.speedMax) || 90);
      this.vx = rand(-12, 12);
      this.drift = Number(c.drift) || 20;
      this.rotation = rand(-0.4, 0.4);
      this.rotationSpeed = rand(-1.2, 1.2);
      this.phase = rand(0, Math.PI * 2);
      this.wobbleSpeed = rand(0.6, 1.4);
      this.wobbleAmp = rand(6, 16);

      // Pattern decoration
      this.pattern = Math.random() < 0.55 ? "dots" : "stripes";
      this.patternColor = this.adjustColor(this.color, 45);
      this.patternDark = this.adjustColor(this.color, -25);

      if (this.pattern === "dots") {
        const dotCount = randInt(3, 5);
        this.dots = [];
        for (let i = 0; i < dotCount; i++) {
          this.dots.push({
            x: rand(-0.28, 0.28) * this.width,
            y: rand(-0.22, 0.22) * this.height,
            r: rand(1.2, 2.6),
          });
        }
      } else {
        this.stripeCount = randInt(2, 3);
      }
    }

    adjustColor(hexColor, percent) {
      // Parse hex color
      const hex = hexColor.replace("#", "");
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      // Adjust by percent
      r = Math.max(0, Math.min(255, r + (r * percent) / 100));
      g = Math.max(0, Math.min(255, g + (g * percent) / 100));
      b = Math.max(0, Math.min(255, b + (b * percent) / 100));

      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    update(dt, w, h) {
      this.age += dt;
      this.rotation += this.rotationSpeed * dt;
      this.phase += this.wobbleSpeed * dt;
      this.x += (this.vx + Math.sin(this.phase) * this.wobbleAmp) * dt;
      this.y += this.vy * dt;
      if (this.y > h + 80 || this.age >= this.life) {
        this.alive = false;
      }
      if (this.x < -60) this.x = w + 60;
      if (this.x > w + 60) this.x = -60;
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 4);
      const fadeOut = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const alpha = fadeIn * fadeOut;
      const w = this.width;
      const h = this.height;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      // Create gradient for egg shading
      const light = this.adjustColor(this.color, 30);
      const dark = this.adjustColor(this.color, -35);
      const gradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      gradient.addColorStop(0, light);
      gradient.addColorStop(1, dark);

      // Draw egg shape
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw egg outline
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw decorative patterns
      if (this.pattern === "dots" && this.dots) {
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = this.patternColor;
        this.dots.forEach((dot) => {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        ctx.globalAlpha = alpha * 0.75;
        ctx.strokeStyle = this.patternDark;
        ctx.lineWidth = Math.max(1, w * 0.08);
        for (let i = 0; i < this.stripeCount; i++) {
          const offset = (i - (this.stripeCount - 1) / 2) * (h * 0.2);
          ctx.beginPath();
          ctx.moveTo(-w * 0.45, offset);
          ctx.quadraticCurveTo(0, offset + h * 0.05, w * 0.45, offset - h * 0.05);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  class FireParticle {
    constructor(x, y, color, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.size = rand(Number(c.sizeMin) || 8, Number(c.sizeMax) || 22);
      const drift = Number(c.drift) || 40;
      this.vx = rand(-drift, drift);
      this.vy = -rand(Number(c.speedMin) || 70, Number(c.speedMax) || 160);
      this.wobble = rand(0, Math.PI * 2);
      this.wobbleSpeed = rand(2, 4);
      this.shrink = rand(6, 12);
    }

    update(dt) {
      this.age += dt;
      this.wobble += this.wobbleSpeed * dt;
      this.x += (this.vx + Math.sin(this.wobble) * 12) * dt;
      this.y += this.vy * dt;
      this.size -= this.shrink * dt;
      if (this.age >= this.life || this.size <= 1 || this.y < -this.size) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 5);
      const fadeOut = t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1;
      const alpha = fadeIn * fadeOut;
      const shimmer = Math.sin(this.age * 8) * 0.15;

      ctx.save();
      ctx.translate(this.x, this.y);

      // Outer flame glow (orange/red)
      const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 1.4);
      outerGlow.addColorStop(0, "rgba(255, 200, 50, 0.8)");
      outerGlow.addColorStop(0.4, "rgba(255, 100, 30, 0.6)");
      outerGlow.addColorStop(1, "rgba(255, 50, 0, 0)");
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Organic flame body (bezier)
      const flameHeight = this.size * 1.8;
      const flameWidth = this.size * 0.8;
      const wobble1 = Math.sin(this.wobble) * this.size * 0.2;
      const wobble2 = Math.cos(this.wobble * 1.3) * this.size * 0.15;

      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, flameHeight * 0.1);
      ctx.bezierCurveTo(
        -flameWidth + wobble1,
        flameHeight * 0.3,
        -flameWidth * 0.6 + wobble2,
        -flameHeight * 0.5,
        wobble1 * 0.5,
        -flameHeight
      );
      ctx.bezierCurveTo(
        flameWidth * 0.6 + wobble2,
        -flameHeight * 0.5,
        flameWidth + wobble1,
        flameHeight * 0.3,
        0,
        flameHeight * 0.1
      );
      ctx.closePath();
      ctx.fill();

      // Inner bright core (yellow/white)
      const innerCore = ctx.createRadialGradient(0, shimmer * this.size, 0, 0, 0, this.size * 0.6);
      innerCore.addColorStop(0, "rgba(255, 255, 220, 0.9)");
      innerCore.addColorStop(0.5, "rgba(255, 220, 100, 0.7)");
      innerCore.addColorStop(1, "rgba(255, 150, 50, 0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = innerCore;
      ctx.beginPath();
      ctx.ellipse(0, shimmer * this.size, this.size * 0.5, this.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  class WaterParticle {
    constructor(x, y, color, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.size = rand(8, 22);
      this.vy = rand(Number(c.speedMin) || 20, Number(c.speedMax) || 60);
      this.vx = rand(-20, 20);
      this.phase = rand(0, Math.PI * 2);
      this.drift = Number(c.drift) || 16;
    }

    update(dt, w, h) {
      this.age += dt;
      this.phase += dt * 1.6;
      this.x += (this.vx + Math.sin(this.phase) * this.drift) * dt;
      this.y += this.vy * dt;
      if (this.age >= this.life || this.y > h + 60 || this.x < -60 || this.x > w + 60) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 4);
      const fadeOut = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
      const alpha = fadeIn * fadeOut * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  class WindParticle {
    constructor(x, y, color, life, cfg) {
      const c = cfg || {};
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.length = rand(Number(c.lengthMin) || 60, Number(c.lengthMax) || 140);
      this.vx = rand(Number(c.speedMin) || 90, Number(c.speedMax) || 180);
      const driftBase = Number(c.drift) || 32;
      this.drift = rand(-driftBase, driftBase);
      this.phase = rand(0, Math.PI * 2);
      this.lineWidth = rand(0.8, 1.6);

      // Direction + "gust" modulation to make streaks turn/swerve.
      this.heading = rand(-0.15, 0.15);
      this.turnStrength = rand(0.8, 1.6);
      this.gustPhase = rand(0, Math.PI * 2);

      // Ensure streaks can traverse the full screen regardless of viewport size.
      this._minLife = null;
      this._lastW = 0;
    }

    update(dt, w, h) {
      this.age += dt;

      if (!this._minLife || Math.abs(w - this._lastW) > 1) {
        this._lastW = w;
        const minHorizontalSpeed = Math.max(60, this.vx * 0.75);
        this._minLife = (w + this.length + 200) / minHorizontalSpeed;
        if (this._minLife > this.life) this.life = this._minLife;
      }

      this.phase += dt * 2.6;
      const gust = 1 + Math.sin(this.phase * 0.6 + this.gustPhase) * 0.18;
      const speed = this.vx * gust;

      const turn = Math.sin(this.phase * 1.15) * (this.drift / 120) * this.turnStrength;
      this.heading += turn * dt;
      this.heading = Math.max(-0.6, Math.min(0.6, this.heading));
      this.heading *= 0.985;

      this.x += Math.cos(this.heading) * speed * dt;
      this.y += Math.sin(this.heading) * speed * dt;
      this.y += Math.sin(this.phase * 2.2) * (this.drift * 0.15) * dt;

      // Soft wrap so gusts keep filling the screen vertically.
      if (Number.isFinite(h) && h > 0) {
        if (this.y < -80) this.y = h + 80;
        if (this.y > h + 80) this.y = -80;
      }

      if (this.age >= this.life || this.x > w + this.length) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeIn = Math.min(1, t * 4);
      const fadeOut = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      const alpha = fadeIn * fadeOut * 0.6;
      const baseAmp = Math.max(10, Math.abs(this.drift) * 0.35);
      const segments = 6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Soft under-stroke for a more "gusty" look.
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth = this.lineWidth * 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      for (let i = 1; i <= segments; i++) {
        const p = i / segments;
        const x = this.x + this.length * p;
        const wave1 = Math.sin(this.phase + p * 4.2);
        const wave2 = Math.sin(this.phase * 0.7 + p * 7.1);
        const y = this.y + wave1 * baseAmp * p + wave2 * baseAmp * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Main stroke.
      ctx.globalAlpha = alpha;
      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      for (let i = 1; i <= segments; i++) {
        const p = i / segments;
        const x = this.x + this.length * p;
        const wave1 = Math.sin(this.phase + p * 4.2);
        const wave2 = Math.sin(this.phase * 0.7 + p * 7.1);
        const y = this.y + wave1 * baseAmp * p + wave2 * baseAmp * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  class EmberParticle {
    constructor(x, y, color, life) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.baseSize = rand(2.5, 6);
      this.size = this.baseSize;
      this.vx = rand(-40, 40);
      this.vy = -rand(80, 160);
      this.drag = rand(0.96, 0.99);
      this.gravity = rand(40, 120);
      this.sparkle = rand(4, 10);
      this.prevX = x;
      this.prevY = y;
    }

    update(dt) {
      this.age += dt;
      this.prevX = this.x;
      this.prevY = this.y;
      this.vx *= this.drag;
      this.vy = this.vy * this.drag + this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const t = this.age / this.life;
      this.size = this.baseSize * (1 - t * 0.6);
      if (this.age >= this.life) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeOut = t > 0.3 ? 1 - ((t - 0.3) / 0.7) * ((t - 0.3) / 0.7) : 1;
      const sparkle = 0.7 + 0.3 * Math.sin(this.age * this.sparkle);
      const alpha = fadeOut * sparkle;
      const dx = this.x - this.prevX;
      const dy = this.y - this.prevY;
      const trailLen = Math.sqrt(dx * dx + dy * dy);
      ctx.save();
      if (trailLen > 1 && t < 0.7) {
        ctx.globalAlpha = alpha * 0.35;
        ctx.strokeStyle = this.color;
        ctx.lineCap = "round";
        ctx.lineWidth = this.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
      }
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      if (t < 0.4) {
        ctx.globalAlpha = alpha * (1 - t / 0.4) * 0.8;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FireworkParticle {
    constructor(x, y, color, life, angle, speed) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = life;
      this.age = 0;
      this.alive = true;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity = 120;
      this.size = rand(1.2, 2.2);
      this.fade = rand(0.6, 1);
      this.prevX = x;
      this.prevY = y;
      this.sparkle = rand(10, 18);
    }

    update(dt) {
      this.age += dt;
      this.prevX = this.x;
      this.prevY = this.y;
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.age >= this.life) {
        this.alive = false;
      }
    }

    draw(ctx) {
      const t = this.age / this.life;
      const fadeOut = 1 - t;
      const sparkle = 0.5 + 0.5 * Math.sin(this.age * this.sparkle);
      const alpha = fadeOut * sparkle * this.fade;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.color;
      ctx.lineCap = "round";
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const FALLING_STAR_THEMES = {
    blue: { hueStart: 200, hueRange: 30 },
    purple: { hueStart: 280, hueRange: 30 },
    red: { hueStart: 350, hueRange: 30 },
    orange: { hueStart: 30, hueRange: 30 },
  };

  class FallingStarParticle {
    constructor(x, y, cfg, kaboom) {
      const useCustomColor = !!(cfg && cfg.useCustomColor);
      const customColor = cfg && typeof cfg.customColorHex === "string" ? cfg.customColorHex : "";

      let themeKey = cfg && cfg.theme ? String(cfg.theme) : "blue";
      if (themeKey === "mix") {
        const keys = Object.keys(FALLING_STAR_THEMES);
        if (keys.length) themeKey = keys[Math.floor(Math.random() * keys.length)];
      }
      const theme = FALLING_STAR_THEMES[themeKey] || FALLING_STAR_THEMES.blue;

      const baseSize = Number(cfg && cfg.baseSize) || 20;
      const sizeVar =
        cfg && typeof cfg.sizeVariation !== "undefined" ? Number(cfg.sizeVariation) : 0.2;
      const sizeVariation = Number.isFinite(sizeVar) ? clamp(sizeVar, 0, 1) : 0.2;

      const gravity = Number(cfg && cfg.gravity);
      const maxVelocity = Number(cfg && cfg.maxVelocity);
      const velocityVariation = Number(cfg && cfg.velocityVariation);
      const rotationSpeed = Number(cfg && cfg.rotationSpeed);
      const shrinkRate = Number(cfg && cfg.shrinkRate);
      const fadeRate = Number(cfg && cfg.fadeRate);

      this.x = x;
      this.y = y;
      this.alive = true;
      this.kaboom = !!kaboom;

      this.baseSize = baseSize;
      this.size = (Math.random() + sizeVariation) * baseSize;
      this.sizeSpeed = Math.random() / 5 + (Number.isFinite(shrinkRate) ? shrinkRate : 0.01);

      const vxVar = Number.isFinite(velocityVariation) ? velocityVariation : 4;
      const vel = kaboom ? 10 : vxVar;
      this.vx = (Math.random() - 0.5) * vel;

      if (kaboom) {
        this.vy = (Math.random() - 0.5) * 10;
      } else {
        this.vy = cfg && cfg.reverse ? -(Math.random() * 3) : Math.random() * 3;
      }

      this.gravity = Number.isFinite(gravity) ? gravity : 0.005;
      this.maxVelocity = Number.isFinite(maxVelocity) ? maxVelocity : 10;

      this.opacity = 1;
      this.opacitySpeed = Math.random() / 100 + (Number.isFinite(fadeRate) ? fadeRate : 0.01);

      const fadeStartRaw = Number(cfg && cfg.fadeStartPercent);
      const fadeStartPercent = Number.isFinite(fadeStartRaw) ? clamp(fadeStartRaw, 0, 100) : 0;
      this.fadeStart = fadeStartPercent / 100;

      this.rotate = Math.random() * Math.PI;
      const rot = Number.isFinite(rotationSpeed) ? rotationSpeed : 0.1;
      this.rotateSpeed = (Math.random() - 0.5) * rot;

      if (useCustomColor) {
        this.color = customColor ? adjustColor(customColor, 0) : "rgba(255,255,255,0.9)";
      } else {
        const hue = Math.floor(Math.random() * theme.hueRange) + theme.hueStart;
        this.color = `hsl(${hue}, 60%, 60%)`;
      }

      this.screenBlend = !(cfg && cfg.screenBlend === false);
      this.shadowBlur = Number.isFinite(Number(cfg && cfg.shadowBlur))
        ? Number(cfg.shadowBlur)
        : 20;
      this.useCircleClip = !!(cfg && cfg.useCircleClip);
      this.reverse = !!(cfg && cfg.reverse);

      this._lastW = 0;
      this._lastH = 0;
    }

    update(dt, w, h) {
      const dtScale = dt / 0.016;
      this._lastW = w;
      this._lastH = h;

      const gravitySign = this.reverse ? -1 : 1;
      this.vy += this.gravity * dtScale * gravitySign;

      const maxV = Math.max(0.1, this.maxVelocity);
      if (this.vy > maxV) this.vy = maxV;
      if (this.vy < -maxV) this.vy = -maxV;

      this.x += this.vx * dtScale;
      this.y += this.vy * dtScale;

      this.rotate += this.rotateSpeed * dtScale;

      let progress = 0;
      if (h > 0) {
        const pos = this.y / h;
        progress = this.reverse ? 1 - pos : pos;
        progress = clamp(progress, 0, 1);
      }

      const canDecay = this.kaboom || progress >= this.fadeStart;
      if (canDecay) {
        this.size -= this.sizeSpeed * dtScale;
        this.opacity -= this.opacitySpeed * dtScale;
      }

      const out =
        this.opacity <= 0 ||
        this.size <= 0 ||
        this.x < -120 ||
        this.x > w + 120 ||
        (!this.reverse && this.y > h + 120) ||
        (this.reverse && this.y < -120);

      if (out) this.alive = false;
    }

    draw(ctx) {
      if (this.opacity <= 0 || this.size <= 0) return;

      const opacity = Math.max(0, Math.min(1, this.opacity));

      ctx.save();

      if (this.screenBlend) {
        ctx.globalCompositeOperation = "screen";
      }

      if (this.shadowBlur > 0) {
        ctx.shadowBlur = this.shadowBlur;
        ctx.shadowColor = this.color;
      }

      ctx.globalAlpha = opacity;
      ctx.translate(this.x, this.y);

      if (this.useCircleClip) {
        const centerX = this._lastW / 2;
        const centerY = this._lastH / 2;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const radius = Math.max(10, Math.min(centerX, centerY) - 4);
        if (dx * dx + dy * dy > radius * radius) {
          ctx.restore();
          return;
        }
      }

      ctx.rotate(this.rotate);

      const spikes = 5;
      const outerRadius = this.size;
      const innerRadius = this.size * 0.45;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  class ParticleManager {
    constructor({ eventBus }) {
      this.eventBus = eventBus;
      this.particles = [];

      effectsPro._internals.particles = effectsPro._internals.particles || {};
      Object.assign(effectsPro._internals.particles, {
        ConfettiParticle,
        SparkleParticle,
        GlitterParticle,
        DustParticle,
        RainParticle,
        SmokeParticle,
        HalloweenEmojiParticle,
        SpiderDropParticle,
        SnowflakeParticle,
        SnowParticle,
        BubbleParticle,
        LeafParticle,
        EggParticle,
        FireParticle,
        WaterParticle,
        WindParticle,
        EmberParticle,
        FireworkParticle,
        FallingStarParticle,
      });
    }

    addParticles(list) {
      if (!Array.isArray(list) || !list.length) return;
      this.particles.push(...list);
      if (this.eventBus) {
        this.eventBus.emit("particles:added", { count: list.length });
      }
    }

    clearAll() {
      if (!this.particles.length) return;
      this.particles.length = 0;
      if (this.eventBus) {
        this.eventBus.emit("particles:cleared");
      }
    }

    clearWhere(predicate) {
      if (typeof predicate !== "function" || !this.particles.length) return;
      this.particles = this.particles.filter((p) => !predicate(p));
      if (this.eventBus) {
        this.eventBus.emit("particles:filtered");
      }
    }

    hasActiveParticles() {
      return this.particles.length > 0;
    }

    updateAndDraw(ctx, dt, w, h) {
      const particles = this.particles;
      let writeIndex = 0;
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.update(dt, w, h);
        if (particle.alive) {
          particle.draw(ctx);
          particles[writeIndex++] = particle;
        }
      }
      particles.length = writeIndex;
    }
  }

  effectsPro._internals.ParticleManager = ParticleManager;
})();
