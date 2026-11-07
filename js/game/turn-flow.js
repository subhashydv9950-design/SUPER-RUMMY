
/* =========================================================
   SUPER RUMMY — TURN FLOW MANAGER
   File: js/game/turn-flow.js
   Purpose: Manage turn phases and player rotation
   ========================================================= */

import {
  GAME_STATUS,
  GAME_PHASE,
  updateGameState,
  setGamePhase,
  setCurrentPlayer
} from "./game-state.js";

export function beginFirstTurn(state) {
  ensurePlayableGame(state);

  const activePlayers = getActivePlayers(state);

  if (activePlayers.length < 2) {
    throw new Error("At least two active players are required.");
  }

  const firstPlayer = activePlayers[0];

  let nextState = updateGameState(state, {
    currentPlayerIndex: state.players.findIndex(
      player => player.id === firstPlayer.id
    ),
    currentPlayerId: firstPlayer.id,
    turnNumber: 1
  });

  nextState = setGamePhase(nextState, GAME_PHASE.DRAW);

  return nextState;
}

export function beginDiscardPhase(state, playerId) {
  ensureCurrentPlayer(state, playerId);

  if (state.phase !== GAME_PHASE.DRAW) {
    throw new Error("Player is not in the draw phase.");
  }

  const player = getPlayer(state, playerId);

  if (player.cards.length !== 14) {
    throw new Error("Player must have 14 cards after drawing.");
  }

  return setGamePhase(state, GAME_PHASE.DISCARD);
}

export function finishDiscardAndAdvance(state, playerId) {
  ensureCurrentPlayer(state, playerId);

  if (state.phase !== GAME_PHASE.DISCARD) {
    throw new Error("Player is not in the discard phase.");
  }

  const player = getPlayer(state, playerId);

  if (player.cards.length !== 13) {
    throw new Error("Player must have exactly 13 cards after discarding.");
  }

  const nextPlayer = findNextActivePlayer(state, playerId);

  if (!nextPlayer) {
    throw new Error("No eligible next player was found.");
  }

  let nextState = setCurrentPlayer(state, nextPlayer.id);
  nextState = setGamePhase(nextState, GAME_PHASE.DRAW);

  return nextState;
}

export function findNextActivePlayer(state, currentPlayerId) {
  const players = state.players;

  if (!Array.isArray(players) || players.length < 2) {
    return null;
  }

  const currentIndex = players.findIndex(
    player => player.id === currentPlayerId
  );

  if (currentIndex === -1) {
    throw new Error("Current player does not exist.");
  }

  for (let step = 1; step <= players.length; step++) {
    const index = (currentIndex + step) % players.length;
    const candidate = players[index];

    if (
      candidate.isActive &&
      candidate.id !== currentPlayerId
    ) {
      return { ...candidate };
    }
  }

  return null;
}

export function getActivePlayers(state) {
  return state.players
    .filter(player => player.isActive)
    .map(player => ({ ...player }));
}

export function getRemainingPlayerCount(state) {
  return getActivePlayers(state).length;
}

export function canContinueGame(state) {
  return (
    state.status === GAME_STATUS.PLAYING &&
    getRemainingPlayerCount(state) >= 2
  );
}

export function getTurnProgress(state) {
  const total = state.players.length;
  const active = getActivePlayers(state).length;

  return {
    currentPlayerId: state.currentPlayerId,
    currentPlayerIndex: state.currentPlayerIndex,
    turnNumber: state.turnNumber,
    totalPlayers: total,
    activePlayers: active,
    phase: state.phase
  };
}

function ensurePlayableGame(state) {
  if (!state || !Array.isArray(state.players)) {
    throw new Error("Invalid game state.");
  }

  if (state.status !== GAME_STATUS.PLAYING) {
    throw new Error("Game must be active.");
  }
}

function ensureCurrentPlayer(state, playerId) {
  ensurePlayableGame(state);

  if (state.currentPlayerId !== playerId) {
    throw new Error("It is not this player's turn.");
  }
}

function getPlayer(state, playerId) {
  const player = state.players.find(
    item => item.id === playerId
  );

  if (!player) {
    throw new Error("Player not found.");
  }

  if (!player.isActive) {
    throw new Error("Player is inactive.");
  }

  if (!Array.isArray(player.cards)) {
    throw new Error("Player hand is invalid.");
  }

  return player;
}

/* ================= FILE ENDING ================= */
