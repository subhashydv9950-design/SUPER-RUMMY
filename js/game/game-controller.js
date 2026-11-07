
/* =========================================================
   SUPER RUMMY — MAIN GAME CONTROLLER
   File: js/game/game-controller.js
   Purpose: Coordinate the core game systems
   ========================================================= */

import {
  GAME_STATUS,
  setGameStatus,
  setWinner
} from "./game-state.js";

import {
  CardPileManager
} from "./card-pile-manager.js";

import {
  DeckRecycleManager
} from "./deck-recycle-manager.js";

import {
  validateGameAction,
  ACTION_TYPES
} from "./game-action-validator.js";

import {
  beginFirstTurn
} from "./turn-flow.js";

import {
  GameEventLog,
  GAME_EVENTS
} from "./game-event-log.js";

export class GameController {
  constructor(state, options = {}) {
    if (!state || !Array.isArray(state.players)) {
      throw new Error("A valid game state is required.");
    }

    this.state = cloneSafe(state);

    this.options = {
      onStateChange: null,
      onError: null,
      onGameStart: null,
      onGamePause: null,
      onGameResume: null,
      onWinner: null,
      ...options
    };

    this.cardPiles = new CardPileManager({
      onCardDrawn: event => {
        this.notifyStateChange("card_drawn", event);
      },
      onCardDiscarded: event => {
        this.notifyStateChange("card_discarded", event);
      }
    });

    this.deckRecycle = new DeckRecycleManager({
      onRecycle: event => {
        this.eventLog.record(
          GAME_EVENTS.CARDS_SORTED,
          {
            operation: "deck_recycled",
            ...event
          }
        );
      }
    });

    this.eventLog = new GameEventLog({
      gameId: this.state.gameId
    });
  }

  startGame() {
    this.ensureStatus(GAME_STATUS.LOBBY);

    this.state = setGameStatus(
      this.state,
      GAME_STATUS.PLAYING
    );

    this.state = beginFirstTurn(this.state);

    this.eventLog.record(GAME_EVENTS.GAME_STARTED, {
      playerCount: this.state.players.length,
      mode: this.state.mode
    });

    this.notifyStateChange("game_started");

    this.emit("onGameStart", this.getState());

    return this.getState();
  }

  drawCard(playerId, source = "closed") {
    this.ensureStatus(GAME_STATUS.PLAYING);

    let action;
    let nextState;

    if (source === "closed") {
      action = ACTION_TYPES.DRAW_CLOSED;

      // Try recycling the deck if no closed cards remain.
      if (this.state.deck.closed.length === 0) {
        const recycleResult = this.deckRecycle.recycle(
          this.state
        );

        if (recycleResult.recycled) {
          this.state = recycleResult.state;
          this.notifyStateChange("deck_recycled");
        }
      }

      this.validateAction(playerId, action);

      nextState = this.cardPiles.drawFromClosed(
        this.state,
        playerId
      );
    } else if (source === "open") {
      action = ACTION_TYPES.DRAW_OPEN;

      this.validateAction(playerId, action);

      nextState = this.cardPiles.drawFromOpen(
        this.state,
        playerId
      );
    } else {
      throw new Error("Unknown card draw source.");
    }

    this.state = nextState;

    const player = this.getPlayer(playerId);
    const drawnCard = player.cards[player.cards.length - 1];

    this.eventLog.recordCardDraw(
      playerId,
      drawnCard.id,
      source
    );

    this.notifyStateChange("card_drawn");

    return {
      state: this.getState(),
      card: cloneSafe(drawnCard)
    };
  }

  discardCard(playerId, cardId) {
    this.ensureStatus(GAME_STATUS.PLAYING);

    this.validateAction(
      playerId,
      ACTION_TYPES.DISCARD,
      { cardId }
    );

    const result = this.cardPiles.discardFromHand(
      this.state,
      playerId,
      cardId
    );

    this.state = result.state;

    this.eventLog.recordCardDiscard(
      playerId,
      result.discardedCard.id
    );

    this.eventLog.record(
      GAME_EVENTS.TURN_STARTED,
      {
        nextPlayerId: this.state.currentPlayerId,
        turnNumber: this.state.turnNumber
      }
    );

    this.notifyStateChange("card_discarded");

    return {
      state: this.getState(),
      discardedCard: result.discardedCard,
      nextPlayerId: this.state.currentPlayerId
    };
  }

  validateAction(playerId, action, payload = {}) {
    const result = validateGameAction(
      this.state,
      playerId,
      action,
      payload
    );

    if (!result.valid) {
      const error = new Error(result.message);
      error.code = result.code;

      this.emit("onError", error);
      throw error;
    }

    return result;
  }

  pauseGame() {
    this.ensureStatus(GAME_STATUS.PLAYING);

    this.state = setGameStatus(
      this.state,
      GAME_STATUS.PAUSED
    );

    this.eventLog.record(GAME_EVENTS.GAME_PAUSED);

    this.notifyStateChange("game_paused");
    this.emit("onGamePause", this.getState());

    return this.getState();
  }

  resumeGame() {
    this.ensureStatus(GAME_STATUS.PAUSED);

    this.state = setGameStatus(
      this.state,
      GAME_STATUS.PLAYING
    );

    this.eventLog.record(GAME_EVENTS.GAME_RESUMED);

    this.notifyStateChange("game_resumed");
    this.emit("onGameResume", this.getState());

    return this.getState();
  }

  finishGame(winnerId) {
    this.ensureStatus(GAME_STATUS.PLAYING);

    this.state = setWinner(this.state, winnerId);

    this.eventLog.record(GAME_EVENTS.GAME_COMPLETED, {
      winnerId
    });

    this.notifyStateChange("game_completed");

    this.emit("onWinner", {
      winnerId,
      state: this.getState()
    });

    return this.getState();
  }

  cancelGame(reason = "Game cancelled") {
    if (
      this.state.status === GAME_STATUS.FINISHED ||
      this.state.status === GAME_STATUS.CANCELLED
    ) {
      throw new Error("Game is already closed.");
    }

    this.state = setGameStatus(
      this.state,
      GAME_STATUS.CANCELLED
    );

    this.eventLog.record(GAME_EVENTS.ROUND_CANCELLED, {
      reason
    });

    this.notifyStateChange("game_cancelled");

    return this.getState();
  }

  getPlayer(playerId) {
    const player = this.state.players.find(
      item => item.id === playerId
    );

    if (!player) {
      throw new Error("Player not found.");
    }

    return player;
  }

  getState() {
    return cloneSafe(this.state);
  }

  getHistory(filters = {}) {
    return this.eventLog.getEvents(filters);
  }

  exportHistory() {
    return this.eventLog.exportHistory();
  }

  subscribeToEvents(listener) {
    return this.eventLog.subscribe(listener);
  }

  ensureStatus(expectedStatus) {
    if (this.state.status !== expectedStatus) {
      throw new Error(
        `Expected game status: ${expectedStatus}`
      );
    }
  }

  notifyStateChange(reason, details = null) {
    this.emit("onStateChange", {
      reason,
      details: cloneSafe(details),
      state: this.getState()
    });
  }

  emit(callbackName, payload) {
    const callback = this.options[callbackName];

    if (typeof callback === "function") {
      callback(payload);
    }
  }
}

function cloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function createGameController(state, options = {}) {
  return new GameController(state, options);
}

/* ================= FILE ENDING ================= */
