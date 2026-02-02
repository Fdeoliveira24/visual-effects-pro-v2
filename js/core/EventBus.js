(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  class EventBus {
    constructor() {
      this._handlers = new Map();
    }

    on(eventName, handler) {
      if (!eventName || typeof handler !== "function") return () => {};
      const list = this._handlers.get(eventName) || [];
      list.push(handler);
      this._handlers.set(eventName, list);
      return () => this.off(eventName, handler);
    }

    once(eventName, handler) {
      if (!eventName || typeof handler !== "function") return () => {};
      const off = this.on(eventName, (payload) => {
        off();
        handler(payload);
      });
      return off;
    }

    off(eventName, handler) {
      const list = this._handlers.get(eventName);
      if (!list || !list.length) return;
      const next = list.filter((h) => h !== handler);
      if (next.length) this._handlers.set(eventName, next);
      else this._handlers.delete(eventName);
    }

    emit(eventName, payload) {
      const list = this._handlers.get(eventName);
      if (!list || !list.length) return;
      // Copy to avoid handler mutation issues.
      const snapshot = list.slice();
      for (let i = 0; i < snapshot.length; i++) {
        const handler = snapshot[i];
        try {
          handler(payload);
        } catch (err) {
          try {
            console.warn("[effectsPro][EventBus] handler error", eventName, err);
          } catch {
            // ignore
          }
        }
      }
    }
  }

  effectsPro._internals.EventBus = EventBus;
})();
