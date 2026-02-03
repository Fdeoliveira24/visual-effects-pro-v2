(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};
  effectsPro._internals.ui = effectsPro._internals.ui || {};

  function showConfirm(title, message) {
    try {
      const text = (title ? `${title}\n\n` : "") + (message || "");
      // eslint-disable-next-line no-alert
      return window.confirm(text);
    } catch {
      return false;
    }
  }

  function showPrompt(title, message, defaultValue) {
    try {
      const text = (title ? `${title}\n\n` : "") + (message || "");
      // eslint-disable-next-line no-alert
      return window.prompt(text, defaultValue || "");
    } catch {
      return null;
    }
  }

  effectsPro._internals.ui.Modal = {
    showConfirm,
    showPrompt,
  };
})();
