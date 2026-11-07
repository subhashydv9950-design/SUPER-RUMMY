
/* =========================================================
   SUPER RUMMY — AI PLAYER MANAGER
   File: js/ai/ai-player-manager.js
   Purpose: Manage AI opponents and their turn decisions.
   ========================================================= */

import {
  AI_DIFFICULTY,
  createAIProfile
} from "./ai-decision-engine.js";

import {
  createAITurnPlan,
  completeAIDrawPlan
} from "./ai-turn-planner.js";

export const AI_PLAYER_STATUS = Object.freeze({
  WAITING: "waiting",
  THINKING: "thinking",
  PLAYING: "playing",
  FINISHED: "finished"
});

export const AI_MANAGER_ERRORS = Object.freeze({
  INVALID_PLAYER: "INVALID_PLAYER",
  DUPLICATE_PLAYER: "DUPLICATE_PLAYER",
  PLAYER_NOT_FOUND: "PLAYER_NOT_FOUND",
  INVALID_DIFFICULTY: "INVALID_DIFFICULTY",
  INVALID_HAND: "INVALID_HAND",
  INVALID_ACTION: "INVALID_ACTION",
  MAX_PLAYERS: "MAX_PLAYERS"
});

const MAX_AI_PLAYERS = 3;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createUniqueId() {
  return `ai_player_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

/* ---------------------------------------------------------
   AI PLAYER MANAGER
   --------------------------------------------------------- */

export class AIPlayerManager {
  constructor(options = {}) {
    this.players = new Map();

    this.defaultDifficulty =
      options.difficulty || AI_DIFFICULTY.MEDIUM;

    this.maxPlayers = options.maxPlayers || MAX_AI_PLAYERS;

    this.onPlayerEvent =
      typeof options.onPlayerEvent === "function"
        ? options.onPlayerEvent
        : null;

    this.validateDifficulty(this.defaultDifficulty);
  }

  /* Validate difficulty */

  validateDifficulty(difficulty) {
    if (!Object.values(AI_DIFFICULTY).includes(difficulty)) {
      throw new Error(AI_MANAGER_ERRORS.INVALID_DIFFICULTY);
    }

    return true;
  }

  /* Emit player event */

  emit(event, player) {
    if (this.onPlayerEvent) {
      this.onPlayerEvent({
        event,
        player: player ? clone(player) : null,
        timestamp: Date.now()
      });
    }
  }

  /* Create AI opponent */

  addPlayer(options = {}) {
    if (this.players.size >= this.maxPlayers) {
      throw new Error(AI_MANAGER_ERRORS.MAX_PLAYERS);
    }

    const id = options.id || createUniqueId();

    if (this.players.has(id)) {
      throw new Error(AI_MANAGER_ERRORS.DUPLICATE_PLAYER);
    }

    const difficulty =
      options.difficulty || this.defaultDifficulty;

    this.validateDifficulty(difficulty);

    const profile = createAIProfile({
      id,
      name: options.name || `AI Player ${this.players.size + 1}`,
      difficulty,
      avatar: options.avatar
    });

    const player = {
      ...profile,
      cards: [],
      status: AI_PLAYER_STATUS.WAITING,
      currentAction: null,
      turnsPlayed: 0,
      createdAt: Date.now()
    };

    this.players.set(id, player);

    this.emit("player_added", player);

    return clone(player);
  }

  /* Remove AI opponent */

  removePlayer(playerId) {
    const player = this.players.get(playerId);

    if (!player) {
      return false;
    }

    this.players.delete(playerId);

    this.emit("player_removed", player);

    return true;
  }

  /* Get one player */

  getPlayer(playerId) {
    const player = this.players.get(playerId);

    return player ? clone(player) : null;
  }

  /* Get all players */

  getPlayers() {
    return [...this.players.values()].map(clone);
  }

  /* Set AI cards */

  setPlayerCards(playerId, cards) {
    const player = this.players.get(playerId);

    if (!player) {
      throw new Error(AI_MANAGER_ERRORS.PLAYER_NOT_FOUND);
    }

    if (!Array.isArray(cards)) {
      throw new Error(AI_MANAGER_ERRORS.INVALID_HAND);
    }

    player.cards = clone(cards);

    this.emit("cards_updated", player);

    return clone(player.cards);
  }

  /* Update player status */

  setPlayerStatus(playerId, status) {
    const player = this.players.get(playerId);

    if (!player) {
      throw new Error(AI_MANAGER_ERRORS.PLAYER_NOT_FOUND);
    }

    if (!Object.values(AI_PLAYER_STATUS).includes(status)) {
      throw new Error(AI_MANAGER_ERRORS.INVALID_ACTION);
    }

    player.status = status;

    this.emit("status_changed", player);

    return true;
  }

  /* Prepare AI turn */

  prepareTurn(playerId, options = {}) {
    const player = this.players.get(playerId);

    if (!player) {
      throw new Error(AI_MANAGER_ERRORS.PLAYER_NOT_FOUND);
    }

    if (player.cards.length !== 13) {
      throw new Error(AI_MANAGER_ERRORS.INVALID_HAND);
    }

    player.status = AI_PLAYER_STATUS.THINKING;

    const plan = createAITurnPlan(player.cards, {
      difficulty: player.difficulty,
      wildRank: options.wildRank ?? null,
      openCard: options.openCard || null,
      closedDeckAvailable:
        options.closedDeckAvailable !== false
    });

    player.currentAction = {
      type: "turn_plan",
      plan: clone(plan),
      createdAt: Date.now()
    };

    this.emit("turn_planned", player);

    return clone(plan);
  }

  /* Complete decision after drawing a card */

  finishDraw(playerId, drawnCard, options = {}) {
    const player = this.players.get(playerId);

    if (!player) {
      throw new Error(AI_MANAGER_ERRORS.PLAYER_NOT_FOUND);
    }

    if (player.cards.length !== 13) {
      throw new Error(AI_MANAGER_ERRORS.INVALID_HAND);
    }

    const decision = completeAIDrawPlan(
      player.cards,
      drawnCard,
      {
        difficulty: player.difficulty,
        wildRank: options.wildRank ?? null
      }
    );

    player.currentAction = {
      type: "discard_plan",
      decision: clone(decision),
      createdAt: Date.now()
    };

    player.status = AI_PLAYER_STATUS.PLAYING;

    this.emit("discard_planned", player);

    return clone(decision);
  }

  /* Confirm completed turn */

  completeTurn(playerId, remainingCards) {
    const player = this.players.get(playerId);

    if (!player) {
      throw new Error(AI_MANAGER_ERRORS.PLAYER_NOT_FOUND);
    }

    if (!Array.isArray(remainingCards) || remainingCards.length !== 13) {
      throw new Error(AI_MANAGER_ERRORS.INVALID_HAND);
    }

    player.cards = clone(remainingCards);
    player.currentAction = null;
    player.status = AI_PLAYER_STATUS.WAITING;
    player.turnsPlayed += 1;

    this.emit("turn_completed", player);

    return clone(player);
  }

  /* Mark player finished */

  finishPlayer(playerId) {
    const player = this.players.get(playerId);

    if (!player) {
      throw new Error(AI_MANAGER_ERRORS.PLAYER_NOT_FOUND);
    }

    player.status = AI_PLAYER_STATUS.FINISHED;
    player.currentAction = null;

    this.emit("player_finished", player);

    return clone(player);
  }

  /* Reset all players for a new round */

  resetRound() {
    for (const player of this.players.values()) {
      player.cards = [];
      player.status = AI_PLAYER_STATUS.WAITING;
      player.currentAction = null;
      player.turnsPlayed = 0;
    }

    this.emit("round_reset", null);

    return true;
  }

  /* Change difficulty */

  setDifficulty(playerId, difficulty) {
    const player = this.players.get(playerId);

    if (!player) {
      throw new Error(AI_MANAGER_ERRORS.PLAYER_NOT_FOUND);
    }

    this.validateDifficulty(difficulty);

    player.difficulty = difficulty;

    this.emit("difficulty_changed", player);

    return clone(player);
  }

  /* Manager summary */

  getSummary() {
    const players = [...this.players.values()];

    return {
      totalPlayers: players.length,
      waiting: players.filter(
        p => p.status === AI_PLAYER_STATUS.WAITING
      ).length,
      thinking: players.filter(
        p => p.status === AI_PLAYER_STATUS.THINKING
      ).length,
      playing: players.filter(
        p => p.status === AI_PLAYER_STATUS.PLAYING
      ).length,
      finished: players.filter(
        p => p.status === AI_PLAYER_STATUS.FINISHED
      ).length
    };
  }

  /* Clear manager */

  clear() {
    this.players.clear();

    this.emit("manager_cleared", null);

    return true;
  }
}

/* ---------------------------------------------------------
   FACTORY
   --------------------------------------------------------- */

export function createAIPlayerManager(options = {}) {
  return new AIPlayerManager(options);
}

/* ================= FILE ENDING ================= */
