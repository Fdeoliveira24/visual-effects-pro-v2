(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  function isPlainObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value.constructor === Object || Object.getPrototypeOf(value) === Object.prototype)
    );
  }

  function deepClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function deepMerge(target, source) {
    const out = isPlainObject(target) ? { ...target } : {};
    if (!isPlainObject(source)) return out;

    Object.keys(source).forEach((key) => {
      const value = source[key];
      if (isPlainObject(value)) {
        out[key] = deepMerge(out[key], value);
      } else if (Array.isArray(value)) {
        out[key] = value.slice();
      } else {
        out[key] = value;
      }
    });
    return out;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function pick(list) {
    if (!Array.isArray(list) || !list.length) return undefined;
    return list[randInt(0, list.length - 1)];
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function generateId(prefix) {
    const safePrefix = typeof prefix === "string" && prefix ? prefix : "id";
    return `${safePrefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  }

  effectsPro._internals.helpers = {
    isPlainObject,
    deepClone,
    deepMerge,
    clamp,
    rand,
    randInt,
    pick,
    lerp,
    generateId,
  };
})();
