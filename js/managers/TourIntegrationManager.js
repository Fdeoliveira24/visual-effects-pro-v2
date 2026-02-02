(function () {
  "use strict";

  window.effectsPro = window.effectsPro || {};
  const effectsPro = window.effectsPro;
  effectsPro._internals = effectsPro._internals || {};

  class TourIntegrationManager {
    constructor({ state, eventBus }) {
      this.state = state;
      this.eventBus = eventBus;
    }

    captureTourObject(obj) {
      if (!obj) return false;
      this.state.setState({ tourObject: obj });
      if (this.eventBus) {
        this.eventBus.emit("tour:integrated", { tourObject: obj });
      }
      return true;
    }

    getTourObject() {
      return this.state.getState().tourObject || null;
    }

    isIntegrated() {
      return !!this.getTourObject();
    }
  }

  effectsPro._internals.TourIntegrationManager = TourIntegrationManager;
})();
