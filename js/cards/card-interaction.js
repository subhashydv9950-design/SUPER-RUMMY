
/* =========================================================
   SUPER RUMMY — CARD INTERACTION CONTROLLER
   FILE: js/cards/card-interaction.js
   VERSION: 1.0
   ========================================================= */

import {
  setCardSelected,
  setCardDisabled,
  getCardIdFromElement
} from "./card-renderer.js";

export class CardInteraction {
  constructor(rootElement, options = {}) {
    if (!rootElement) {
      throw new Error("CardInteraction: Root element is required.");
    }

    this.root = rootElement;

    this.options = {
      maxSelection: 13,
      allowMultiple: true,
      disabled: false,
      onSelectionChange: () => {},
      onCardClick: () => {},
      ...options
    };

    this.selectedIds = new Set();
    this.cardElements = new Map();
    this.destroyed = false;

    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("keydown", this.handleKeyDown);

    this.refresh();
  }

  refresh() {
    if (this.destroyed) return;

    this.cardElements.clear();

    const cards = this.root.querySelectorAll(".sr-playing-card");

    cards.forEach((element) => {
      const cardId = getCardIdFromElement(element);

      if (!cardId) return;

      this.cardElements.set(String(cardId), element);

      element.setAttribute("tabindex", "0");
      element.setAttribute("role", "button");

      const selected = this.selectedIds.has(String(cardId));

      setCardSelected(element, selected);

      if (this.options.disabled) {
        setCardDisabled(element, true);
      }
    });

    this.removeMissingSelections();
  }

  handleClick(event) {
    if (this.destroyed || this.options.disabled) return;

    const cardElement = event.target.closest(".sr-playing-card");

    if (!cardElement || !this.root.contains(cardElement)) {
      return;
    }

    if (cardElement.classList.contains("is-disabled")) {
      return;
    }

    const cardId = getCardIdFromElement(cardElement);

    if (!cardId) return;

    this.options.onCardClick(cardId, cardElement);

    this.toggle(cardId);
  }

  handleKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;

    const cardElement = event.target.closest(".sr-playing-card");

    if (!cardElement || !this.root.contains(cardElement)) {
      return;
    }

    event.preventDefault();

    if (this.options.disabled) return;

    const cardId = getCardIdFromElement(cardElement);

    if (cardId) {
      this.toggle(cardId);
    }
  }

  toggle(cardId) {
    if (this.destroyed || this.options.disabled) return false;

    const id = String(cardId);
    const element = this.cardElements.get(id);

    if (!element) return false;

    if (element.classList.contains("is-disabled")) {
      return false;
    }

    if (this.selectedIds.has(id)) {
      return this.deselect(id);
    }

    if (!this.options.allowMultiple) {
      this.clearSelection();
    }

    if (this.selectedIds.size >= this.options.maxSelection) {
      return false;
    }

    this.selectedIds.add(id);
    setCardSelected(element, true);

    this.emitChange();

    return true;
  }

  select(cardId) {
    const id = String(cardId);

    if (this.selectedIds.has(id)) return true;

    return this.toggle(id);
  }

  deselect(cardId) {
    const id = String(cardId);

    if (!this.selectedIds.has(id)) return false;

    this.selectedIds.delete(id);

    const element = this.cardElements.get(id);

    if (element) {
      setCardSelected(element, false);
    }

    this.emitChange();

    return true;
  }

  clearSelection() {
    if (this.selectedIds.size === 0) return;

    this.selectedIds.forEach((id) => {
      const element = this.cardElements.get(id);

      if (element) {
        setCardSelected(element, false);
      }
    });

    this.selectedIds.clear();

    this.emitChange();
  }

  setSelection(cardIds = []) {
    this.clearSelection();

    const uniqueIds = [...new Set(cardIds.map(String))];

    uniqueIds
      .slice(0, this.options.maxSelection)
      .forEach((id) => {
        const element = this.cardElements.get(id);

        if (!element || element.classList.contains("is-disabled")) {
          return;
        }

        this.selectedIds.add(id);
        setCardSelected(element, true);
      });

    this.emitChange();
  }

  getSelectedIds() {
    return [...this.selectedIds];
  }

  getSelectionCount() {
    return this.selectedIds.size;
  }

  isSelected(cardId) {
    return this.selectedIds.has(String(cardId));
  }

  setDisabled(disabled) {
    this.options.disabled = Boolean(disabled);

    this.cardElements.forEach((element) => {
      setCardDisabled(element, this.options.disabled);
    });

    if (this.options.disabled) {
      this.clearSelection();
    }
  }

  setMaxSelection(limit) {
    const value = Number(limit);

    if (!Number.isInteger(value) || value < 1) {
      throw new Error("Maximum selection must be a positive integer.");
    }

    this.options.maxSelection = value;

    if (this.selectedIds.size > value) {
      const keep = [...this.selectedIds].slice(0, value);
      this.setSelection(keep);
    }
  }

  removeMissingSelections() {
    const existing = new Set(this.cardElements.keys());

    [...this.selectedIds].forEach((id) => {
      if (!existing.has(id)) {
        this.selectedIds.delete(id);
      }
    });
  }

  emitChange() {
    this.options.onSelectionChange({
      selectedIds: this.getSelectedIds(),
      count: this.getSelectionCount()
    });
  }

  destroy() {
    if (this.destroyed) return;

    this.root.removeEventListener("click", this.handleClick);
    this.root.removeEventListener("keydown", this.handleKeyDown);

    this.selectedIds.clear();
    this.cardElements.clear();

    this.destroyed = true;
  }
}

/* =========================================================
   FACTORY FUNCTION
   ========================================================= */

export function createCardInteraction(rootElement, options = {}) {
  return new CardInteraction(rootElement, options);
}

/* =========================================================
   FILE END: js/cards/card-interaction.js
   ========================================================= */
