(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  function isPlainObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      (value.constructor === Object || Object.getPrototypeOf(value) === Object.prototype)
    );
  }

  function deepMerge(target, source) {
    const base = isPlainObject(target) ? target : {};
    if (!isPlainObject(source)) return base;

    const out = { ...base };
    Object.keys(source).forEach((key) => {
      const nextVal = source[key];
      const prevVal = out[key];

      if (isPlainObject(prevVal) && isPlainObject(nextVal)) {
        out[key] = deepMerge(prevVal, nextVal);
        return;
      }

      if (Array.isArray(nextVal)) {
        out[key] = nextVal.slice();
        return;
      }

      out[key] = nextVal;
    });
    return out;
  }

  class State {
    constructor(initialState) {
      this._state = deepMerge(State.defaults(), initialState || {});
      this._observers = new Set();
    }

    static defaults() {
      return {
        config: null,
        canvas: { width: 0, height: 0, dpr: 1, ctx: null, canvasEl: null },
        particles: [],
        activeTheme: null,
        activeEffect: null,
        tourObject: null,
        ui: { overlayVisible: false, dashboardOpen: false },
      };
    }

    getState() {
      return this._state;
    }

    setState(partial) {
      const prev = this._state;
      const next = deepMerge(prev, partial || {});
      this._state = next;
      this._notify(next, prev);
      return next;
    }

    subscribe(observer) {
      if (typeof observer !== "function") return () => {};
      this._observers.add(observer);
      return () => this._observers.delete(observer);
    }

    _notify(next, prev) {
      this._observers.forEach((observer) => {
        try {
          observer(next, prev);
        } catch (err) {
          try {
            console.warn("[effectsPro][State] observer error", err);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  effectsPro._internals.State = State;
})();
