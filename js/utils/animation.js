(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  function createRafLoop(onFrame) {
    let rafId = null;
    let lastTs = 0;

    function tick(ts) {
      if (!rafId) return;
      const t = Number(ts) || 0;
      const dt = lastTs ? Math.min(0.05, (t - lastTs) / 1000) : 0;
      lastTs = t;
      try {
        onFrame(dt, t);
      } catch {
        // Fail silent: loop should keep running.
      }
      rafId = requestAnimationFrame(tick);
    }

    return {
      start() {
        if (rafId) return;
        lastTs = 0;
        rafId = requestAnimationFrame(tick);
      },
      stop() {
        if (!rafId) return;
        cancelAnimationFrame(rafId);
        rafId = null;
        lastTs = 0;
      },
      isRunning() {
        return !!rafId;
      },
    };
  }

  effectsPro._internals.animation = {
    createRafLoop,
  };
})();
