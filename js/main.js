(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  const { App } = effectsPro._internals;
  if (!App) return;

  if (!effectsPro._app) {
    effectsPro._app = new App();
  }
  const app = effectsPro._app;

  // Load config early so dashboards and tour integrations can read immediately.
  try {
    app.loadConfig();
  } catch {
    // ignore
  }

  // Optional auto-enable for tour pages when mode requires DOM.
  try {
    const cfg = app.getConfig();
    if (cfg && cfg.enabled && (cfg.mode === "dom" || cfg.mode === "both")) {
      app.enableDomOverlay(true);
    }
  } catch {
    // ignore
  }

  // Public API surface (kept compatible with v1 where possible).
  effectsPro.initializeEffects = app.initializeEffects.bind(app);
  effectsPro.enableDomOverlay = app.enableDomOverlay.bind(app);
  effectsPro.isEnabled = app.isEnabled.bind(app);
  effectsPro.playEffect = app.playEffect.bind(app);
  effectsPro.startOverlayTheme = app.startOverlayTheme.bind(app);
  effectsPro.stopOverlayTheme = app.stopOverlayTheme.bind(app);
  effectsPro.stopAll = app.stopAll.bind(app);
  effectsPro.getConfig = app.getConfig.bind(app);
  effectsPro.setConfig = app.setConfig.bind(app);
  effectsPro.resetConfig = app.resetConfig.bind(app);
  effectsPro.saveConfig = app.saveConfig.bind(app);
  effectsPro.loadConfig = app.loadConfig.bind(app);
  effectsPro.setAura = app.setAura.bind(app);
  effectsPro.getDiagnostics = app.getDiagnostics.bind(app);
  effectsPro.getEffectsList = app.getEffectsList.bind(app);
  effectsPro.getThemesList = app.getThemesList.bind(app);
  effectsPro.captureTourObject = app.captureTourObject.bind(app);

  // Compatibility alias for existing dashboards / integrations.
  try {
    window.tourEffectsFunctions = effectsPro;
  } catch {
    // ignore
  }
})();
