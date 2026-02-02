(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const { deepClone } = effectsPro._internals.helpers || {};

  function safeStringify(value) {
    try {
      return JSON.stringify(value);
    } catch {
      try {
        return JSON.stringify(deepClone(value));
      } catch {
        return "";
      }
    }
  }

  function safeParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function isStorageAvailable(storage) {
    if (!storage) return false;
    try {
      const key = "__effectsProTest__";
      storage.setItem(key, "1");
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  class StorageManager {
    constructor(eventBus) {
      this.eventBus = eventBus;
      this.memory = new Map();

      this.primary = isStorageAvailable(window.localStorage) ? window.localStorage : null;
      this.secondary = null;
      if (!this.primary && isStorageAvailable(window.sessionStorage)) {
        this.secondary = window.sessionStorage;
      }

      this.isAvailable = !!(this.primary || this.secondary);
      this.isPersistent = !!this.primary || !!this.secondary;

      this._poller = null;
      this._lastHashByKey = new Map();
    }

    load(key) {
      if (!key) return null;
      const text = this._getRaw(key);
      if (typeof text !== "string" || !text) return null;
      return safeParse(text);
    }

    has(key) {
      if (!key) return false;
      if (this.primary && this.primary.getItem(key) !== null) return true;
      if (this.secondary && this.secondary.getItem(key) !== null) return true;
      return this.memory.has(key);
    }

    save(key, data) {
      if (!key) return false;
      const text = safeStringify(data);
      if (!text) return false;

      // Best effort: localStorage -> sessionStorage -> memory.
      if (this.primary) {
        try {
          this.primary.setItem(key, text);
          this._lastHashByKey.set(key, text);
          return true;
        } catch {
          // fall through
        }
      }

      if (this.secondary) {
        try {
          this.secondary.setItem(key, text);
          this._lastHashByKey.set(key, text);
          return true;
        } catch {
          // fall through
        }
      }

      this.memory.set(key, text);
      this._lastHashByKey.set(key, text);
      return true;
    }

    clear(key) {
      if (!key) return;
      try {
        if (this.primary) this.primary.removeItem(key);
      } catch {
        // ignore
      }
      try {
        if (this.secondary) this.secondary.removeItem(key);
      } catch {
        // ignore
      }
      this.memory.delete(key);
      this._lastHashByKey.delete(key);
    }

    bindCrossTabStorageEvent(key) {
      if (!key) return;
      try {
        window.addEventListener("storage", (event) => {
          try {
            if (!event || event.key !== key) return;
            const nextText = typeof event.newValue === "string" ? event.newValue : "";
            // storage event only fires across tabs; safe to treat as external.
            this._lastHashByKey.set(key, nextText);
            const data = safeParse(nextText);
            if (data && this.eventBus) {
              this.eventBus.emit("storage:changed", { key, data });
            }
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore
      }
    }

    startPolling(key, intervalMs) {
      if (!key) return;
      if (this._poller) return;
      const interval = Number(intervalMs) || 1000;

      this._poller = window.setInterval(() => {
        try {
          const currentText = this._getRaw(key) || "";
          const lastText = this._lastHashByKey.get(key) || "";
          if (currentText === lastText) return;
          this._lastHashByKey.set(key, currentText);
          const data = safeParse(currentText);
          if (data && this.eventBus) {
            this.eventBus.emit("storage:changed", { key, data });
          }
        } catch {
          // ignore
        }
      }, interval);
    }

    stopPolling() {
      if (!this._poller) return;
      clearInterval(this._poller);
      this._poller = null;
    }

    _getRaw(key) {
      try {
        if (this.primary) {
          const value = this.primary.getItem(key);
          if (value !== null) return value;
        }
      } catch {
        // ignore
      }
      try {
        if (this.secondary) {
          const value = this.secondary.getItem(key);
          if (value !== null) return value;
        }
      } catch {
        // ignore
      }
      return this.memory.get(key) || null;
    }
  }

  effectsPro._internals.StorageManager = StorageManager;
})();
