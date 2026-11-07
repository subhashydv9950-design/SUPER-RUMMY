
/* =========================================================
   SUPER RUMMY — PLAYER HAND MANAGER
   FILE: js/cards/hand-manager.js
   VERSION: 1.0
   ========================================================= */

import { createCardElement } from "./card-renderer.js";
import { createCardInteraction } from "./card-interaction.js";
import { smartSort } from "./card-sorter.js";

export class HandManager {
  constructor(container, options = {}) {
    if (!container) {
      throw new Error("HandManager: Container is required.");
    }

    this.container = container;
    this.cards = [];
    this.maxCards = options.maxCards ?? 13;
    this.onChange = options.onChange ?? (() => {});
    this.onSelectionChange =
      options.onSelectionChange ?? (() => {});

    this.interaction = createCardInteraction(container, {
      maxSelection: this.maxCards,
      allowMultiple: true,
      onSelectionChange: (selection) => {
        this.onSelectionChange(selection);
      }
    });

    this.validateOptions();
  }

  validateOptions() {
    if (
      !Number.isInteger(this.maxCards) ||
      this.maxCards < 1
    ) {
      throw new Error("HandManager: Invalid maximum card count.");
    }
  }

  setCards(cards = []) {
    if (!Array.isArray(cards)) {
      throw new TypeError("Cards must be an array.");
    }

    if (cards.length > this.maxCards) {
      throw new Error(
        `A hand cannot contain more than ${this.maxCards} cards.`
      );
    }

    this.validateUniqueCards(cards);

    this.cards = [...cards];

    this.render();
    this.notifyChange("set");
  }

  validateUniqueCards(cards) {
    const ids = cards.map((card) => {
      if (!card || card.id === undefined || card.id === null) {
        throw new Error("Every card must have a valid id.");
      }

      return String(card.id);
    });

    if (new Set(ids).size !== ids.length) {
      throw new Error("Duplicate card IDs are not allowed.");
    }
  }

  addCard(card) {
    if (!card || card.id === undefined || card.id === null) {
      throw new Error("A valid card is required.");
    }

    if (this.cards.length >= this.maxCards) {
      return false;
    }

    const exists = this.cards.some(
      (item) => String(item.id) === String(card.id)
    );

    if (exists) return false;

    this.cards.push(card);

    this.render();
    this.notifyChange("add");

    return true;
  }

  removeCard(cardId) {
    const index = this.cards.findIndex(
      (card) => String(card.id) === String(cardId)
    );

    if (index === -1) return null;

    const [removed] = this.cards.splice(index, 1);

    this.render();
    this.notifyChange("remove");

    return removed;
  }

  removeSelectedCards() {
    const selectedIds = new Set(
      this.interaction.getSelectedIds()
    );

    if (selectedIds.size === 0) return [];

    const removed = [];
    const remaining = [];

    this.cards.forEach((card) => {
      if (selectedIds.has(String(card.id))) {
        removed.push(card);
      } else {
        remaining.push(card);
      }
    });

    this.cards = remaining;

    this.render();
    this.notifyChange("remove-selected");

    return removed;
  }

  sort(mode = "smart") {
    if (mode === "smart") {
      this.cards = smartSort([...this.cards]);
    } else {
      this.cards = smartSort([...this.cards], mode);
    }

    this.render();
    this.notifyChange("sort");

    return this.getCards();
  }

  render() {
    this.interaction.clearSelection();

    const fragment = document.createDocumentFragment();

    this.cards.forEach((card) => {
      const element = createCardElement(card);

      if (element) {
        fragment.appendChild(element);
      }
    });

    this.container.replaceChildren(fragment);

    this.interaction.refresh();

    this.container.classList.add("sr-card-hand");
    this.container.setAttribute(
      "aria-label",
      `Your hand: ${this.cards.length} cards`
    );
  }

  getCards() {
    return [...this.cards];
  }

  getCardCount() {
    return this.cards.length;
  }

  getSelectedCards() {
    const selectedIds = new Set(
      this.interaction.getSelectedIds()
    );

    return this.cards.filter((card) =>
      selectedIds.has(String(card.id))
    );
  }

  getCard(cardId) {
    return (
      this.cards.find(
        (card) => String(card.id) === String(cardId)
      ) ?? null
    );
  }

  hasCard(cardId) {
    return this.cards.some(
      (card) => String(card.id) === String(cardId)
    );
  }

  clear() {
    this.cards = [];
    this.interaction.clearSelection();
    this.container.replaceChildren();

    this.notifyChange("clear");
  }

  setDisabled(disabled) {
    this.interaction.setDisabled(disabled);
  }

  notifyChange(action) {
    this.onChange({
      action,
      cards: this.getCards(),
      count: this.getCardCount()
    });
  }

  destroy() {
    this.interaction.destroy();
    this.cards = [];
    this.container.replaceChildren();
  }
}

/* =========================================================
   FACTORY
   ========================================================= */

export function createHandManager(container, options = {}) {
  return new HandManager(container, options);
}

/* =========================================================
   FILE END: js/cards/hand-manager.js
   ========================================================= */
      
