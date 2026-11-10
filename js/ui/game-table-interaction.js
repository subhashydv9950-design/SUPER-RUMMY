
/* =========================================================
   SUPER RUMMY
   FILE 58: game-table-interaction.js
   PATH: js/ui/game-table-interaction.js
   PURPOSE: Game Table User Interactions
   ========================================================= */

export const TABLE_INTERACTION_ERRORS = Object.freeze({
  INVALID_VIEW: "INVALID_VIEW",
  INVALID_CALLBACK: "INVALID_CALLBACK",
  INVALID_SOURCE: "INVALID_SOURCE",
  DESTROYED: "DESTROYED"
});

export class GameTableInteraction {
  constructor(options = {}) {
    if (!options.view) {
      throw new Error(TABLE_INTERACTION_ERRORS.INVALID_VIEW);
    }

    this.view = options.view;
    this.handManager = options.handManager || null;

    this.callbacks = {
      onDraw: options.onDraw || null,
      onCardSelect: options.onCardSelect || null,
      onDiscard: options.onDiscard || null,
      onPileClick: options.onPileClick || null
    };

    this.cleanups = [];
    this.destroyed = false;

    this.bindPileEvents();
    this.bindCardEvents();
  }

  ensureActive() {
    if (this.destroyed) {
      throw new Error(TABLE_INTERACTION_ERRORS.DESTROYED);
    }
  }

  async execute(callback, payload) {
    if (typeof callback !== "function") {
      return {
        success: false,
        error: TABLE_INTERACTION_ERRORS.INVALID_CALLBACK
      };
    }

    try {
      const result = await callback(payload);

      return {
        success: true,
        result
      };
    } catch (error) {
      console.error("Table interaction error:", error);

      return {
        success: false,
        error
      };
    }
  }

  bindPileEvents() {
    const closedPile = this.view.getElement("closedPile");
    const openPile = this.view.getElement("openPile");

    if (!closedPile || !openPile) return;

    const closedHandler = event => {
      if (this.destroyed) return;

      this.handlePileClick("closed", event);
    };

    const openHandler = event => {
      if (this.destroyed) return;

      this.handlePileClick("open", event);
    };

    closedPile.addEventListener("click", closedHandler);
    openPile.addEventListener("click", openHandler);

    this.cleanups.push(() => {
      closedPile.removeEventListener("click", closedHandler);
      openPile.removeEventListener("click", openHandler);
    });
  }

  bindCardEvents() {
    const hand = this.view.getHandContainer();

    if (!hand) return;

    const handler = event => {
      if (this.destroyed) return;

      const cardElement = event.target.closest(
        "[data-card-id]"
      );

      if (!cardElement || !hand.contains(cardElement)) {
        return;
      }

      const cardId = cardElement.dataset.cardId;

      if (!cardId) return;

      this.handleCardClick(cardId, cardElement, event);
    };

    hand.addEventListener("click", handler);

    this.cleanups.push(() => {
      hand.removeEventListener("click", handler);
    });
  }

  async handlePileClick(source, event) {
    this.ensureActive();

    if (source !== "closed" && source !== "open") {
      return {
        success: false,
        error: TABLE_INTERACTION_ERRORS.INVALID_SOURCE
      };
    }

    const payload = {
      source,
      event,
      timestamp: Date.now()
    };

    const customResult = await this.execute(
      this.callbacks.onPileClick,
      payload
    );

    if (
      this.callbacks.onDraw &&
      (!customResult.success || customResult.result !== false)
    ) {
      return this.execute(this.callbacks.onDraw, payload);
    }

    return customResult;
  }

  async handleCardClick(cardId, element, event) {
    this.ensureActive();

    let selected = false;

    if (this.handManager?.toggleSelection) {
      selected = this.handManager.toggleSelection(cardId);
    } else {
      selected = element.classList.toggle("is-selected");
    }

    const payload = {
      cardId,
      element,
      selected,
      event,
      timestamp: Date.now()
    };

    return this.execute(
      this.callbacks.onCardSelect,
      payload
    );
  }

  async requestDiscard(cardId) {
    this.ensureActive();

    if (!cardId) {
      return {
        success: false,
        error: "INVALID_CARD_ID"
      };
    }

    return this.execute(
      this.callbacks.onDiscard,
      {
        cardId,
        timestamp: Date.now()
      }
    );
  }

  setCallbacks(callbacks = {}) {
    this.ensureActive();

    for (const key of Object.keys(this.callbacks)) {
      if (typeof callbacks[key] === "function") {
        this.callbacks[key] = callbacks[key];
      }
    }
  }

  destroy() {
    if (this.destroyed) return;

    for (const cleanup of this.cleanups) {
      cleanup();
    }

    this.cleanups = [];
    this.callbacks = {};
    this.destroyed = true;
  }
}

export function createGameTableInteraction(options = {}) {
  return new GameTableInteraction(options);
}

/* ================= FILE ENDING ================= */
