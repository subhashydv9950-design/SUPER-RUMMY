
/* =========================================================
   SUPER RUMMY — TURN MANAGER
   FILE: js/game/turn-manager.js
   VERSION: 1.0
   ========================================================= */

export const TURN_PHASES = Object.freeze({
  WAITING: "waiting",
  DRAW: "draw",
  DISCARD: "discard",
  FINISHED: "finished"
});

export const DRAW_SOURCES = Object.freeze({
  CLOSED: "closed",
  OPEN: "open"
});

export class TurnManager {
  constructor(options = {}) {
    this.turnDuration = options.turnDuration ?? 30;
    this.onChange = options.onChange ?? (() => {});
    this.onTimeout = options.onTimeout ?? (() => {});

    this.state = {
      players: [],
      currentPlayerIndex: 0,
      phase: TURN_PHASES.WAITING,
      drawnCard: null,
      turnNumber: 0,
      startedAt: null,
      deadline: null,
      finished: false
    };

    this.timerId = null;
  }

  /* INITIALIZE GAME */

  initialize(players, options = {}) {
    if (!Array.isArray(players) ||
        players.length < 2 ||
        players.length > 4) {
      throw new Error("Rummy requires 2 to 4 players.");
    }

    const ids = players.map((player) =>
      String(player.id)
    );

    if (ids.some((id) => id === "undefined" || id === "null")) {
      throw new Error("Every player needs a valid ID.");
    }

    if (new Set(ids).size !== ids.length) {
      throw new Error("Player IDs must be unique.");
    }

    this.stopTimer();

    this.state = {
      players: players.map((player) => ({
        ...player,
        cards: [...(player.cards ?? [])]
      })),
      currentPlayerIndex: 0,
      phase: TURN_PHASES.WAITING,
      drawnCard: null,
      turnNumber: 0,
      startedAt: null,
      deadline: null,
      finished: false,
      turnDuration: options.turnDuration ?? this.turnDuration
    };

    this.emit("initialized");

    return this.getState();
  }

  /* START FIRST TURN */

  start() {
    this.ensureInitialized();

    if (this.state.finished) {
      throw new Error("Game has already finished.");
    }

    if (this.state.phase !== TURN_PHASES.WAITING) {
      throw new Error("Game has already started.");
    }

    this.beginTurn();

    return this.getState();
  }

  /* BEGIN CURRENT PLAYER TURN */

  beginTurn() {
    this.stopTimer();

    this.state.phase = TURN_PHASES.DRAW;
    this.state.drawnCard = null;
    this.state.turnNumber += 1;
    this.state.startedAt = Date.now();

    const duration = this.state.turnDuration;

    this.state.deadline = duration > 0
      ? Date.now() + duration * 1000
      : null;

    this.startTimer();
    this.emit("turn-started");
  }

  /* GET CURRENT PLAYER */

  getCurrentPlayer() {
    if (!this.state.players.length) return null;

    return this.state.players[
      this.state.currentPlayerIndex
    ];
  }

  getCurrentPlayerId() {
    return this.getCurrentPlayer()?.id ?? null;
  }

  /* DRAW A CARD */

  drawCard(card, source, playerId) {
    this.ensureActive();

    if (this.state.phase !== TURN_PHASES.DRAW) {
      throw new Error("You must draw before discarding.");
    }

    if (String(playerId) !== String(this.getCurrentPlayerId())) {
      throw new Error("It is not this player's turn.");
    }

    if (!card || card.id === undefined || card.id === null) {
      throw new Error("Invalid card.");
    }

    if (!Object.values(DRAW_SOURCES).includes(source)) {
      throw new Error("Invalid draw source.");
    }

    if (source === DRAW_SOURCES.OPEN) {
      if (this.state.openDeckTopId === undefined ||
          String(this.state.openDeckTopId) !== String(card.id)) {
        throw new Error("Only the top open-deck card can be drawn.");
      }

      this.state.openDeckTopId = null;
    }

    if (source === DRAW_SOURCES.CLOSED) {
      if (this.state.closedDeckCount !== undefined &&
          this.state.closedDeckCount <= 0) {
        throw new Error("Closed deck is empty.");
      }

      if (this.state.closedDeckCount !== undefined) {
        this.state.closedDeckCount -= 1;
      }
    }

    const player = this.getCurrentPlayer();

    if (player.cards.some(
      (item) => String(item.id) === String(card.id)
    )) {
      throw new Error("This card is already in the player's hand.");
    }

    player.cards.push(card);

    this.state.drawnCard = {
      cardId: card.id,
      source
    };

    this.state.phase = TURN_PHASES.DISCARD;

    this.emit("card-drawn");

    return this.getState();
  }

  /* DISCARD A CARD */

  discardCard(cardId, playerId) {
    this.ensureActive();

    if (this.state.phase !== TURN_PHASES.DISCARD) {
      throw new Error("Draw a card before discarding.");
    }

    if (String(playerId) !== String(this.getCurrentPlayerId())) {
      throw new Error("It is not this player's turn.");
    }

    const player = this.getCurrentPlayer();

    const cardIndex = player.cards.findIndex(
      (card) => String(card.id) === String(cardId)
    );

    if (cardIndex === -1) {
      throw new Error("Card not found in player's hand.");
    }

    const [discardedCard] = player.cards.splice(cardIndex, 1);

    this.state.openDeckTopId = discardedCard.id;
    this.state.lastDiscardedCard = discardedCard;
    this.state.drawnCard = null;

    this.emit("card-discarded");

    this.advanceTurn();

    return discardedCard;
  }

  /* ADVANCE TO NEXT PLAYER */

  advanceTurn() {
    this.ensureActive();
    this.stopTimer();

    const totalPlayers = this.state.players.length;

    this.state.currentPlayerIndex =
      (this.state.currentPlayerIndex + 1) % totalPlayers;

    this.beginTurn();

    return this.getState();
  }

  /* SET DECK INFORMATION */

  setDeckInfo({ closedDeckCount, openDeckTopId } = {}) {
    if (closedDeckCount !== undefined) {
      if (!Number.isInteger(closedDeckCount) ||
          closedDeckCount < 0) {
        throw new Error("Invalid closed deck count.");
      }

      this.state.closedDeckCount = closedDeckCount;
    }

    if (openDeckTopId !== undefined) {
      this.state.openDeckTopId = openDeckTopId;
    }

    this.emit("deck-updated");
  }

  /* FINISH GAME */

  finish(winnerId = null) {
    this.ensureInitialized();

    this.stopTimer();

    this.state.finished = true;
    this.state.phase = TURN_PHASES.FINISHED;
    this.state.winnerId = winnerId;
    this.state.deadline = null;

    this.emit("game-finished");

    return this.getState();
  }

  /* TIMER */

  startTimer() {
    this.stopTimer();

    if (!this.state.deadline) return;

    this.timerId = setInterval(() => {
      if (this.state.finished) {
        this.stopTimer();
        return;
      }

      const remaining = this.getRemainingTime();

      this.emit("timer-tick", { remaining });

      if (remaining <= 0) {
        this.stopTimer();

        const playerId = this.getCurrentPlayerId();

        this.onTimeout({
          playerId,
          turnNumber: this.state.turnNumber
        });

        this.emit("turn-timeout", { playerId });
      }
    }, 250);
  }

  stopTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getRemainingTime() {
    if (!this.state.deadline) return null;

    return Math.max(
      0,
      Math.ceil((this.state.deadline - Date.now()) / 1000)
    );
  }

  /* STATE ACCESS */

  getState() {
    return {
      ...this.state,
      players: this.state.players.map((player) => ({
        ...player,
        cards: [...player.cards]
      })),
      remainingTime: this.getRemainingTime()
    };
  }

  emit(event, extra = {}) {
    this.onChange({
      event,
      state: this.getState(),
      ...extra
    });
  }

  ensureInitialized() {
    if (!this.state.players.length) {
      throw new Error("Initialize the game first.");
    }
  }

  ensureActive() {
    this.ensureInitialized();

    if (this.state.finished) {
      throw new Error("Game is finished.");
    }

    if (this.state.phase === TURN_PHASES.WAITING) {
      throw new Error("Game has not started.");
    }
  }

  destroy() {
    this.stopTimer();

    this.state.players = [];
    this.state.phase = TURN_PHASES.FINISHED;
    this.state.finished = true;
  }
}

/* =========================================================
   FACTORY
   ========================================================= */

export function createTurnManager(options = {}) {
  return new TurnManager(options);
}

/* =========================================================
   FILE END: js/game/turn-manager.js
   ========================================================= */
      
