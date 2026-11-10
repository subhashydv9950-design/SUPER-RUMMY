
/* =========================================================
   SUPER RUMMY — GAME SETUP BUILDER
   FILE: js/game/game-setup-builder.js
   PURPOSE: Build and validate a new Rummy game setup
   ========================================================= */

export const GAME_SETUP_CONFIG = Object.freeze({
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  CARDS_PER_PLAYER: 13,
  PACKS_FOR_TWO_PLAYERS: 1,
  PACKS_FOR_THREE_OR_FOUR: 2
});

export const GAME_SETUP_ERRORS = Object.freeze({
  INVALID_PLAYERS: "INVALID_PLAYERS",
  INVALID_DECK: "INVALID_DECK",
  INSUFFICIENT_CARDS: "INSUFFICIENT_CARDS",
  INVALID_PLAYER: "INVALID_PLAYER",
  SETUP_FAILED: "SETUP_FAILED"
});

function clone(value) {
  return structuredClone(value);
}

function shuffle(cards) {
  const result = [...cards];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function validatePlayers(players) {
  if (!Array.isArray(players)) {
    throw new Error(GAME_SETUP_ERRORS.INVALID_PLAYERS);
  }

  if (
    players.length < GAME_SETUP_CONFIG.MIN_PLAYERS ||
    players.length > GAME_SETUP_CONFIG.MAX_PLAYERS
  ) {
    throw new Error(GAME_SETUP_ERRORS.INVALID_PLAYERS);
  }

  const ids = new Set();

  for (const player of players) {
    if (
      !player ||
      typeof player.id !== "string" ||
      !player.id.trim()
    ) {
      throw new Error(GAME_SETUP_ERRORS.INVALID_PLAYER);
    }

    if (ids.has(player.id)) {
      throw new Error("DUPLICATE_PLAYER_ID");
    }

    ids.add(player.id);
  }

  return true;
}

function validateDeck(cards, expectedSize) {
  if (!Array.isArray(cards) || cards.length !== expectedSize) {
    throw new Error(GAME_SETUP_ERRORS.INVALID_DECK);
  }

  const ids = new Set();

  for (const card of cards) {
    if (
      !card ||
      typeof card.id !== "string" ||
      !card.id.trim() ||
      ids.has(card.id)
    ) {
      throw new Error("INVALID_OR_DUPLICATE_CARD");
    }

    ids.add(card.id);
  }

  return true;
}

export class GameSetupBuilder {
  constructor(options = {}) {
    if (typeof options.deckFactory !== "function") {
      throw new Error(
        "GameSetupBuilder requires a deckFactory function."
      );
    }

    this.deckFactory = options.deckFactory;
    this.shuffleCards = options.shuffleCards || shuffle;
    this.cardsPerPlayer =
      options.cardsPerPlayer ||
      GAME_SETUP_CONFIG.CARDS_PER_PLAYER;
  }

  getPackCount(playerCount) {
    return playerCount === 2
      ? GAME_SETUP_CONFIG.PACKS_FOR_TWO_PLAYERS
      : GAME_SETUP_CONFIG.PACKS_FOR_THREE_OR_FOUR;
  }

  build(players, options = {}) {
    try {
      validatePlayers(players);

      const playerCount = players.length;
      const packCount = this.getPackCount(playerCount);

      const originalDeck = this.deckFactory({
        packCount,
        playerCount,
        includePrintedJokers: true
      });

      if (!Array.isArray(originalDeck)) {
        throw new Error(GAME_SETUP_ERRORS.INVALID_DECK);
      }

      const expectedDeckSize = packCount * 54;

      validateDeck(originalDeck, expectedDeckSize);

      const deck = this.shuffleCards(originalDeck);

      if (
        !Array.isArray(deck) ||
        deck.length !== originalDeck.length
      ) {
        throw new Error(GAME_SETUP_ERRORS.INVALID_DECK);
      }

      const requiredCards =
        playerCount * this.cardsPerPlayer;

      if (deck.length <= requiredCards) {
        throw new Error(GAME_SETUP_ERRORS.INSUFFICIENT_CARDS);
      }

      let cursor = 0;

      const startingPlayers = players.map(player => {
        const hand = deck.slice(
          cursor,
          cursor + this.cardsPerPlayer
        );

        cursor += this.cardsPerPlayer;

        return {
          ...clone(player),
          cards: hand,
          cardCount: hand.length,
          status: "active"
        };
      });

      const remainingCards = deck.slice(cursor);

      const openDeck = [
        remainingCards[0]
      ];

      const closedDeck = remainingCards.slice(1);

      const wildCard = closedDeck.find(
        card => card.type !== "joker"
      ) || null;

      if (!wildCard) {
        throw new Error("WILD_CARD_NOT_AVAILABLE");
      }

      const setup = {
        players: startingPlayers,

        deck: {
          closed: closedDeck,
          open: openDeck,
          totalCards: deck.length
        },

        settings: {
          playerCount,
          packCount,
          cardsPerPlayer: this.cardsPerPlayer,
          mode: options.mode || "practice",
          wildRank: wildCard.rank,
          wildCardId: wildCard.id
        },

        currentPlayerId: startingPlayers[0].id,
        phase: "draw",
        status: "ready",

        metadata: {
          createdAt: Date.now(),
          setupVersion: 1
        }
      };

      this.validateSetup(setup);

      return {
        success: true,
        setup
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || GAME_SETUP_ERRORS.SETUP_FAILED,
        setup: null
      };
    }
  }

  validateSetup(setup) {
    if (!setup || !Array.isArray(setup.players)) {
      throw new Error(GAME_SETUP_ERRORS.SETUP_FAILED);
    }

    const allCards = [
      ...setup.players.flatMap(player => player.cards),
      ...setup.deck.closed,
      ...setup.deck.open
    ];

    if (allCards.length !== setup.deck.totalCards) {
      throw new Error("CARD_COUNT_MISMATCH");
    }

    const ids = new Set(allCards.map(card => card.id));

    if (ids.size !== allCards.length) {
      throw new Error("DUPLICATE_CARD_IN_SETUP");
    }

    for (const player of setup.players) {
      if (player.cards.length !== this.cardsPerPlayer) {
        throw new Error("INVALID_STARTING_HAND");
      }
    }

    if (setup.deck.open.length !== 1) {
      throw new Error("INVALID_OPEN_DECK");
    }

    if (!setup.settings.wildRank) {
      throw new Error("INVALID_WILD_RANK");
    }

    return true;
  }
}

export function createGameSetupBuilder(options = {}) {
  return new GameSetupBuilder(options);
}

/* ================= FILE END ================= */
