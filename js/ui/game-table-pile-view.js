
/* =========================================================
   SUPER RUMMY
   FILE 59: game-table-pile-view.js
   PATH: js/ui/game-table-pile-view.js
   PURPOSE: Closed and Open Card Pile Rendering
   ========================================================= */

import {
  renderCard
} from "../cards/card-renderer.js";

export class GameTablePileView {
  constructor(options = {}) {
    this.closedContainer = this.resolveElement(
      options.closedContainer
    );

    this.openContainer = this.resolveElement(
      options.openContainer
    );

    if (!this.closedContainer || !this.openContainer) {
      throw new Error("CARD_PILE_CONTAINERS_REQUIRED");
    }

    this.closedCount = 0;
    this.openCount = 0;
    this.openTopCard = null;
    this.destroyed = false;

    this.onPileClick = options.onPileClick || null;

    this.bindEvents();
  }

  resolveElement(value) {
    if (typeof value === "string") {
      return document.querySelector(value);
    }

    return value || null;
  }

  bindEvents() {
    this.closedHandler = event => {
      if (this.destroyed) return;

      this.onClick("closed", event);
    };

    this.openHandler = event => {
      if (this.destroyed) return;

      this.onClick("open", event);
    };

    this.closedContainer.addEventListener(
      "click",
      this.closedHandler
    );

    this.openContainer.addEventListener(
      "click",
      this.openHandler
    );
  }

  onClick(source, event) {
    if (typeof this.onPileClick !== "function") {
      return;
    }

    this.onPileClick({
      source,
      event,
      count:
        source === "closed"
          ? this.closedCount
          : this.openCount
    });
  }

  updateCounts(closedCount, openCount) {
    this.ensureActive();

    this.closedCount = Math.max(
      0,
      Number(closedCount) || 0
    );

    this.openCount = Math.max(
      0,
      Number(openCount) || 0
    );

    this.renderCounts();

    return this.getSummary();
  }

  renderCounts() {
    this.closedContainer.dataset.count =
      String(this.closedCount);

    this.openContainer.dataset.count =
      String(this.openCount);

    this.closedContainer.setAttribute(
      "aria-label",
      `Closed deck, ${this.closedCount} cards`
    );

    this.openContainer.setAttribute(
      "aria-label",
      `Open deck, ${this.openCount} cards`
    );

    this.renderCountLabel(
      this.closedContainer,
      this.closedCount
    );

    this.renderCountLabel(
      this.openContainer,
      this.openCount
    );
  }

  renderCountLabel(container, count) {
    let label = container.querySelector(
      ".sr-pile-count"
    );

    if (!label) {
      label = document.createElement("span");
      label.className = "sr-pile-count";
      container.append(label);
    }

    label.textContent = String(count);
  }

  renderOpenTopCard(card) {
    this.ensureActive();

    this.openTopCard = card || null;

    const oldCard = this.openContainer.querySelector(
      ".sr-pile-top-card"
    );

    if (oldCard) {
      oldCard.remove();
    }

    if (!card) {
      this.openContainer.classList.remove(
        "has-top-card"
      );

      return false;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "sr-pile-top-card";

    wrapper.innerHTML = renderCard(card, {
      faceUp: true,
      selectable: false
    });

    this.openContainer.append(wrapper);

    this.openContainer.classList.add(
      "has-top-card"
    );

    return true;
  }

  setPileEnabled(source, enabled) {
    this.ensureActive();

    const container =
      source === "closed"
        ? this.closedContainer
        : source === "open"
          ? this.openContainer
          : null;

    if (!container) return false;

    container.dataset.disabled = String(!enabled);
    container.setAttribute(
      "aria-disabled",
      String(!enabled)
    );

    container.style.pointerEvents =
      enabled ? "" : "none";

    container.style.opacity =
      enabled ? "" : "0.5";

    return true;
  }

  getSummary() {
    return {
      closedCount: this.closedCount,
      openCount: this.openCount,
      hasOpenTopCard: Boolean(this.openTopCard)
    };
  }

  ensureActive() {
    if (this.destroyed) {
      throw new Error("CARD_PILE_VIEW_DESTROYED");
    }
  }

  destroy() {
    if (this.destroyed) return;

    this.closedContainer.removeEventListener(
      "click",
      this.closedHandler
    );

    this.openContainer.removeEventListener(
      "click",
      this.openHandler
    );

    const oldCard = this.openContainer.querySelector(
      ".sr-pile-top-card"
    );

    oldCard?.remove();

    this.onPileClick = null;
    this.openTopCard = null;
    this.destroyed = true;
  }
}

export function createGameTablePileView(options = {}) {
  return new GameTablePileView(options);
}

/* ================= FILE ENDING ================= */
