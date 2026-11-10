
/* =========================================================
   SUPER RUMMY — WILD JOKER MANAGER
   FILE: js/game/wild-joker-manager.js
   PURPOSE: Select and manage wild joker rank
   ========================================================= */

export const WILD_JOKER_ERRORS = Object.freeze({
  INVALID_DECK: "INVALID_DECK",
  NO_VALID_CARD: "NO_VALID_CARD",
  INVALID_RANK: "INVALID_RANK",
  NOT_INITIALIZED: "NOT_INITIALIZED"
});

export class WildJokerManager {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.wildRank = null;
    this.indicatorCard = null;
    this.initialized = false;
  }

  selectIndicatorCard(deck) {
    if (!Array.isArray(deck) || deck.length === 0) {
      throw new Error(WILD_JOKER_ERRORS.INVALID_DECK);
    }

    const validCards = deck.filter(card =>
      card &&
      card.type !== "joker" &&
      card.rank !== undefined &&
      card.rank !== null &&
      String(card.rank).trim() !== ""
    );

    if (validCards.length === 0) {
      throw new Error(WILD_JOKER_ERRORS.NO_VALID_CARD);
    }

    const randomValue = Number(this.random());

    const safeRandom = Number.isFinite(randomValue)
      ? Math.max(0, Math.min(0.999999999, randomValue))
      : 0;

    const index = Math.floor(
      safeRandom * validCards.length
    );

    return validCards[index];
  }

  initialize(deck) {
    try {
      const indicator = this.selectIndicatorCard(deck);

      this.indicatorCard = { ...indicator };
      this.wildRank = indicator.rank;
      this.initialized = true;

      return {
        success: true,
        wildRank: this.wildRank,
        indicatorCard: { ...this.indicatorCard }
      };

    } catch (error) {
      this.reset();

      return {
        success: false,
        error: error.message,
        wildRank: null,
        indicatorCard: null
      };
    }
  }

  isWildCard(card) {
    if (!this.initialized || !card) {
      return false;
    }

    if (card.type === "joker") {
      return true;
    }

    return String(card.rank) === String(this.wildRank);
  }

  isPrintedJoker(card) {
    return Boolean(card && card.type === "joker");
  }

  getWildRank() {
    if (!this.initialized) {
      throw new Error(WILD_JOKER_ERRORS.NOT_INITIALIZED);
    }

    return this.wildRank;
  }

  getIndicatorCard() {
    if (!this.initialized) {
      return null;
    }

    return { ...this.indicatorCard };
  }

  getStatus() {
    return {
      initialized: this.initialized,
      wildRank: this.wildRank,
      indicatorCard: this.getIndicatorCard()
    };
  }

  reset() {
    this.wildRank = null;
    this.indicatorCard = null;
    this.initialized = false;
  }
}

export function createWildJokerManager(options = {}) {
  return new WildJokerManager(options);
}

/* ================= FILE END ================= */
