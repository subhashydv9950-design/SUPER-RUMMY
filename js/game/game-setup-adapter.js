
/* =========================================================
   SUPER RUMMY — GAME SETUP ADAPTER
   FILE: js/game/game-setup-adapter.js
   PURPOSE: Connect setup builder with game systems
   ========================================================= */

import { createGameSetupBuilder } from "./game-setup-builder.js";
import { createCompleteDeck } from "../cards/card-model.js";
import { createGameState } from "./game-state.js";

export const SETUP_ADAPTER_ERRORS = Object.freeze({
  INVALID_SETUP: "INVALID_SETUP",
  STATE_CREATION_FAILED: "STATE_CREATION_FAILED",
  DECK_CREATION_FAILED: "DECK_CREATION_FAILED",
  PLAYER_MAPPING_FAILED: "PLAYER_MAPPING_FAILED"
});

function createDeckForPlayers({ packCount }) {
  const cards = [];

  for (let pack = 0; pack < packCount; pack++) {
    const deck = createCompleteDeck();

    if (!Array.isArray(deck)) {
      throw new Error(SETUP_ADAPTER_ERRORS.DECK_CREATION_FAILED);
    }

    for (const card of deck) {
      cards.push({
        ...card,
        id: `${card.id}-pack-${pack + 1}`,
        packNumber: pack + 1
      });
    }
  }

  return cards;
}

function mapPlayers(players) {
  return players.map((player, index) => ({
    ...player,
    id: String(player.id),
    name: player.name || `Player ${index + 1}`,
    type: player.type || "human",
    cards: []
  }));
}

export class GameSetupAdapter {
  constructor(options = {}) {
    this.builder = options.builder ||
      createGameSetupBuilder({
        deckFactory: options.deckFactory || createDeckForPlayers,
        shuffleCards: options.shuffleCards,
        cardsPerPlayer: 13
      });

    this.gameStateFactory =
      options.gameStateFactory || createGameState;
  }

  prepare(players, options = {}) {
    try {
      const normalizedPlayers = mapPlayers(players);

      const result = this.builder.build(
        normalizedPlayers,
        options
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      const setup = result.setup;

      const gameState = this.gameStateFactory({
        players: setup.players,
        settings: {
          ...setup.settings,
          ...options
        },
        deck: setup.deck,
        currentPlayerId: setup.currentPlayerId,
        phase: setup.phase,
        status: setup.status
      });

      if (!gameState) {
        throw new Error(
          SETUP_ADAPTER_ERRORS.STATE_CREATION_FAILED
        );
      }

      return {
        success: true,
        setup,
        gameState
      };

    } catch (error) {
      return {
        success: false,
        error: error.message ||
          SETUP_ADAPTER_ERRORS.INVALID_SETUP,
        setup: null,
        gameState: null
      };
    }
  }

  validate(result) {
    if (
      !result ||
      !result.success ||
      !result.setup ||
      !result.gameState
    ) {
      throw new Error(SETUP_ADAPTER_ERRORS.INVALID_SETUP);
    }

    this.builder.validateSetup(result.setup);

    return true;
  }

  createInitialSnapshot(players, options = {}) {
    const result = this.prepare(players, options);

    if (!result.success) {
      return result;
    }

    try {
      this.validate(result);

      return {
        success: true,
        snapshot: result.gameState,
        setup: result.setup
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        snapshot: null,
        setup: null
      };
    }
  }
}

export function createGameSetupAdapter(options = {}) {
  return new GameSetupAdapter(options);
}

/* ================= FILE END ================= */
