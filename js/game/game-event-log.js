
/* =========================================================
   SUPER RUMMY — GAME EVENT LOGGER
   File: js/game/game-event-log.js
   Purpose: Record game events for history and replay
   ========================================================= */

export const GAME_EVENTS = Object.freeze({
  GAME_CREATED: "game_created",
  GAME_STARTED: "game_started",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",
  PLAYER_RECONNECTED: "player_reconnected",
  ROUND_STARTED: "round_started",
  TURN_STARTED: "turn_started",
  CARD_DRAWN: "card_drawn",
  CARD_DISCARDED: "card_discarded",
  CARDS_SORTED: "cards_sorted",
  PLAYER_DECLARED: "player_declared",
  DECLARATION_VALIDATED: "declaration_validated",
  DECLARATION_REJECTED: "declaration_rejected",
  PLAYER_DROPPED: "player_dropped",
  PLAYER_TIMEOUT: "player_timeout",
  ROUND_COMPLETED: "round_completed",
  ROUND_CANCELLED: "round_cancelled",
  GAME_PAUSED: "game_paused",
  GAME_RESUMED: "game_resumed",
  GAME_COMPLETED: "game_completed"
});

export class GameEventLog {
  constructor(options = {}) {
    this.maxEvents = Number.isInteger(options.maxEvents)
      ? Math.max(100, options.maxEvents)
      : 10000;

    this.events = [];
    this.sequence = 0;
    this.gameId = options.gameId || null;
    this.listeners = new Set();
  }

  record(type, data = {}, options = {}) {
    if (!Object.values(GAME_EVENTS).includes(type)) {
      throw new Error(`Unknown game event: ${type}`);
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Event data must be an object.");
    }

    const event = Object.freeze({
      id: this.createEventId(),
      sequence: ++this.sequence,
      gameId: this.gameId,
      type,
      timestamp: Date.now(),
      playerId: options.playerId || null,
      roundId: options.roundId || null,
      data: cloneSafe(data)
    });

    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    this.notify(event);

    return cloneSafe(event);
  }

  recordCardDraw(playerId, cardId, source) {
    return this.record(
      GAME_EVENTS.CARD_DRAWN,
      { cardId, source },
      { playerId }
    );
  }

  recordCardDiscard(playerId, cardId) {
    return this.record(
      GAME_EVENTS.CARD_DISCARDED,
      { cardId },
      { playerId }
    );
  }

  recordTurn(playerId, turnNumber) {
    return this.record(
      GAME_EVENTS.TURN_STARTED,
      { turnNumber },
      { playerId }
    );
  }

  recordDeclaration(playerId, declarationId = null) {
    return this.record(
      GAME_EVENTS.PLAYER_DECLARED,
      { declarationId },
      { playerId }
    );
  }

  getEvents(filters = {}) {
    let result = [...this.events];

    if (filters.type) {
      result = result.filter(
        event => event.type === filters.type
      );
    }

    if (filters.playerId) {
      result = result.filter(
        event => event.playerId === filters.playerId
      );
    }

    if (filters.roundId) {
      result = result.filter(
        event => event.roundId === filters.roundId
      );
    }

    if (Number.isFinite(filters.fromTime)) {
      result = result.filter(
        event => event.timestamp >= filters.fromTime
      );
    }

    if (Number.isFinite(filters.toTime)) {
      result = result.filter(
        event => event.timestamp <= filters.toTime
      );
    }

    if (Number.isInteger(filters.limit) && filters.limit >= 0) {
      result = result.slice(-filters.limit);
    }

    return cloneSafe(result);
  }

  getLatestEvent() {
    const event = this.events[this.events.length - 1];
    return event ? cloneSafe(event) : null;
  }

  getEventCount() {
    return this.events.length;
  }

  getPlayerTimeline(playerId) {
    return this.getEvents({ playerId });
  }

  getRoundTimeline(roundId) {
    return this.getEvents({ roundId });
  }

  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("Listener must be a function.");
    }

    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(cloneSafe(event));
      } catch (error) {
        console.error("Game event listener error:", error);
      }
    }
  }

  exportHistory() {
    return {
      format: "SUPER_RUMMY_EVENT_LOG",
      version: 1,
      gameId: this.gameId,
      exportedAt: Date.now(),
      totalEvents: this.events.length,
      events: this.getEvents()
    };
  }

  importHistory(history) {
    if (
      !history ||
      history.format !== "SUPER_RUMMY_EVENT_LOG" ||
      !Array.isArray(history.events)
    ) {
      throw new Error("Invalid event history format.");
    }

    const validEvents = history.events.filter(event =>
      event &&
      Object.values(GAME_EVENTS).includes(event.type) &&
      Number.isFinite(event.timestamp) &&
      Number.isInteger(event.sequence)
    );

    this.events = cloneSafe(validEvents).slice(-this.maxEvents);

    this.sequence = this.events.reduce(
      (maximum, event) => Math.max(maximum, event.sequence),
      0
    );

    this.gameId = history.gameId || this.gameId;

    return this.getEventCount();
  }

  clear() {
    this.events = [];
    this.sequence = 0;
  }

  createEventId() {
    return `EV-${Date.now()}-${this.sequence + 1}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }
}

function cloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function createGameEventLog(options = {}) {
  return new GameEventLog(options);
}

/* ================= FILE ENDING ================= */
      
