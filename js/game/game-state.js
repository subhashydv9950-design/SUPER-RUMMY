
/* =========================================================
   SUPER RUMMY — GAME STATE MANAGER
   File: js/game/game-state.js
   Purpose: Central game state and state validation
   ========================================================= */

export const GAME_STATUS = Object.freeze({
  LOBBY: "lobby",
  STARTING: "starting",
  PLAYING: "playing",
  PAUSED: "paused",
  FINISHED: "finished",
  CANCELLED: "cancelled"
});

export const GAME_PHASE = Object.freeze({
  WAITING: "waiting",
  DRAW: "draw",
  DISCARD: "discard",
  DECLARATION: "declaration",
  COMPLETE: "complete"
});

export function createGameState({
  gameId = null,
  mode = "practice",
  players = [],
  cardsPerPlayer = 13,
  wildRank = null,
  metadata = {}
} = {}) {
  if (!Array.isArray(players) ||
      players.length < 2 ||
      players.length > 4) {
    throw new Error("Game requires 2 to 4 players.");
  }

  const playerIds = players.map(player => player.id);

  if (
    playerIds.some(id => !id) ||
    new Set(playerIds).size !== playerIds.length
  ) {
    throw new Error("Player IDs must be unique and valid.");
  }

  if (cardsPerPlayer !== 13) {
    throw new Error("SUPER RUMMY requires 13 cards per player.");
  }

  const now = Date.now();

  return {
    gameId: gameId || createGameId(),
    mode,
    status: GAME_STATUS.LOBBY,
    phase: GAME_PHASE.WAITING,

    players: players.map(player => ({
      id: player.id,
      name: player.name || "Player",
      type: player.type || "human",
      cards: [],
      score: 0,
      isActive: true,
      isConnected: true,
      hasDeclared: false
    })),

    cardsPerPlayer,
    wildRank,

    deck: {
      closed: [],
      open: [],
      totalCards: 0
    },

    currentPlayerIndex: 0,
    currentPlayerId: players[0].id,
    turnNumber: 0,

    winnerId: null,
    createdAt: now,
    startedAt: null,
    finishedAt: null,

    settings: {
      turnDurationSeconds: 30,
      autoSort: true,
      soundEnabled: true,
      animationsEnabled: true
    },

    metadata: cloneSafe(metadata),
    version: 1,
    updatedAt: now
  };
}

export function updateGameState(state, updates = {}) {
  validateGameState(state);

  if (!updates || typeof updates !== "object") {
    throw new Error("Updates must be an object.");
  }

  const protectedKeys = [
    "gameId",
    "createdAt",
    "version",
    "updatedAt"
  ];

  for (const key of protectedKeys) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      throw new Error(`${key} cannot be changed directly.`);
    }
  }

  const nextState = {
    ...cloneSafe(state),
    ...cloneSafe(updates),
    version: state.version + 1,
    updatedAt: Date.now()
  };

  validateGameState(nextState);
  return nextState;
}

export function setGameStatus(state, status) {
  if (!Object.values(GAME_STATUS).includes(status)) {
    throw new Error("Invalid game status.");
  }

  const updates = { status };

  if (status === GAME_STATUS.PLAYING && !state.startedAt) {
    updates.startedAt = Date.now();
  }

  if (
    status === GAME_STATUS.FINISHED ||
    status === GAME_STATUS.CANCELLED
  ) {
    updates.finishedAt = Date.now();
  }

  return updateGameState(state, updates);
}

export function setGamePhase(state, phase) {
  if (!Object.values(GAME_PHASE).includes(phase)) {
    throw new Error("Invalid game phase.");
  }

  return updateGameState(state, { phase });
}

export function setCurrentPlayer(state, playerId) {
  const index = state.players.findIndex(
    player => player.id === playerId
  );

  if (index === -1) {
    throw new Error("Player does not belong to this game.");
  }

  if (!state.players[index].isActive) {
    throw new Error("Inactive player cannot take a turn.");
  }

  return updateGameState(state, {
    currentPlayerIndex: index,
    currentPlayerId: playerId,
    turnNumber: state.turnNumber + 1
  });
}

export function updatePlayerCards(state, playerId, cards) {
  if (!Array.isArray(cards)) {
    throw new Error("Player cards must be an array.");
  }

  const players = cloneSafe(state.players);
  const player = players.find(item => item.id === playerId);

  if (!player) {
    throw new Error("Player not found.");
  }

  player.cards = cloneSafe(cards);

  return updateGameState(state, { players });
}

export function updateDeckState(state, {
  closed = state.deck.closed,
  open = state.deck.open
} = {}) {
  if (!Array.isArray(closed) || !Array.isArray(open)) {
    throw new Error("Deck piles must be arrays.");
  }

  const deck = {
    closed: cloneSafe(closed),
    open: cloneSafe(open),
    totalCards: closed.length + open.length
  };

  return updateGameState(state, { deck });
}

export function setWildRank(state, wildRank) {
  if (wildRank === null || wildRank === undefined) {
    throw new Error("Wild rank cannot be empty.");
  }

  return updateGameState(state, { wildRank });
}

export function setWinner(state, playerId) {
  if (!state.players.some(player => player.id === playerId)) {
    throw new Error("Winner must belong to this game.");
  }

  return updateGameState(state, {
    winnerId: playerId,
    status: GAME_STATUS.FINISHED,
    phase: GAME_PHASE.COMPLETE,
    finishedAt: Date.now()
  });
}

export function getPlayerState(state, playerId) {
  const player = state.players.find(
    item => item.id === playerId
  );

  return player ? cloneSafe(player) : null;
}

export function getCurrentPlayerState(state) {
  return getPlayerState(state, state.currentPlayerId);
}

export function getGameSnapshot(state) {
  validateGameState(state);
  return cloneSafe(state);
}

export function validateGameState(state) {
  if (!state || typeof state !== "object") {
    throw new Error("Invalid game state.");
  }

  if (!state.gameId) {
    throw new Error("Game ID is missing.");
  }

  if (!Array.isArray(state.players) ||
      state.players.length < 2 ||
      state.players.length > 4) {
    throw new Error("Invalid player count.");
  }

  const ids = state.players.map(player => player.id);

  if (ids.some(id => !id) ||
      new Set(ids).size !== ids.length) {
    throw new Error("Invalid or duplicate player IDs.");
  }

  if (!state.players.some(
    player => player.id === state.currentPlayerId
  )) {
    throw new Error("Current player does not exist.");
  }

  if (
    !Number.isInteger(state.currentPlayerIndex) ||
    state.currentPlayerIndex < 0 ||
    state.currentPlayerIndex >= state.players.length
  ) {
    throw new Error("Invalid current player index.");
  }

  if (
    state.players[state.currentPlayerIndex].id !==
    state.currentPlayerId
  ) {
    throw new Error("Current player index mismatch.");
  }

  if (!Object.values(GAME_STATUS).includes(state.status)) {
    throw new Error("Invalid game status.");
  }

  if (!Object.values(GAME_PHASE).includes(state.phase)) {
    throw new Error("Invalid game phase.");
  }

  if (!Array.isArray(state.deck?.closed) ||
      !Array.isArray(state.deck?.open)) {
    throw new Error("Invalid deck structure.");
  }

  return true;
}

function createGameId() {
  return `SUPER-RUMMY-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function cloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

/* ================= FILE ENDING ================= */
    
