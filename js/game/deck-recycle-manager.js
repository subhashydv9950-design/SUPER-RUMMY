
/* =========================================================
   SUPER RUMMY — DECK RECYCLE MANAGER
   File: js/game/deck-recycle-manager.js
   Purpose: Recycle and shuffle discarded cards safely
   ========================================================= */

import { shuffleArray } from "../core/utils.js";
import { updateGameState } from "./game-state.js";

export class DeckRecycleManager {
  constructor(options = {}) {
    this.onRecycle = options.onRecycle || null;
  }

  recycle(state) {
    this.validateState(state);

    const closed = [...state.deck.closed];
    const open = [...state.deck.open];

    if (closed.length > 0) {
      return {
        state,
        recycled: false,
        reason: "CLOSED_DECK_NOT_EMPTY",
        recycledCount: 0
      };
    }

    // Keep the latest discarded card on the open pile.
    if (open.length <= 1) {
      return {
        state,
        recycled: false,
        reason: "NOT_ENOUGH_CARDS",
        recycledCount: 0
      };
    }

    const topCard = open.pop();
    const recyclableCards = shuffleArray(open);

    const nextOpen = [topCard];

    const nextState = updateGameState(state, {
      deck: {
        closed: recyclableCards,
        open: nextOpen,
        totalCards: recyclableCards.length + nextOpen.length
      }
    });

    const result = {
      state: nextState,
      recycled: true,
      reason: null,
      recycledCount: recyclableCards.length,
      preservedOpenCardId: topCard.id
    };

    this.emit(result);

    return result;
  }

  validateState(state) {
    if (!state || !state.deck) {
      throw new Error("Invalid game state.");
    }

    if (
      !Array.isArray(state.deck.closed) ||
      !Array.isArray(state.deck.open)
    ) {
      throw new Error("Invalid deck piles.");
    }

    const allCards = [
      ...state.deck.closed,
      ...state.deck.open
    ];

    const ids = allCards.map(card => card?.id);

    if (ids.some(id => !id)) {
      throw new Error("Deck contains an invalid card.");
    }

    if (new Set(ids).size !== ids.length) {
      throw new Error("Duplicate card IDs found in deck piles.");
    }

    return true;
  }

  emit(result) {
    if (typeof this.onRecycle === "function") {
      this.onRecycle({
        recycledCount: result.recycledCount,
        preservedOpenCardId: result.preservedOpenCardId
      });
    }
  }
}

export function recycleDeck(state, options = {}) {
  const manager = new DeckRecycleManager(options);
  return manager.recycle(state);
}

export function createDeckRecycleManager(options = {}) {
  return new DeckRecycleManager(options);
}

/* ================= FILE ENDING ================= */
