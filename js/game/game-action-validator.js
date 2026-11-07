
/* =========================================================
   SUPER RUMMY — GAME ACTION VALIDATOR
   File: js/game/game-action-validator.js
   Purpose: Validate player actions before execution
   ========================================================= */

import {
  GAME_STATUS,
  GAME_PHASE
} from "./game-state.js";

export const ACTION_TYPES = Object.freeze({
  DRAW_CLOSED: "draw_closed",
  DRAW_OPEN: "draw_open",
  DISCARD: "discard",
  DECLARE: "declare",
  SORT: "sort",
  DROP: "drop"
});

export const ACTION_ERRORS = Object.freeze({
  INVALID_STATE: "INVALID_STATE",
  GAME_NOT_ACTIVE: "GAME_NOT_ACTIVE",
  PLAYER_NOT_FOUND: "PLAYER_NOT_FOUND",
  NOT_PLAYER_TURN: "NOT_PLAYER_TURN",
  PLAYER_INACTIVE: "PLAYER_INACTIVE",
  INVALID_PHASE: "INVALID_PHASE",
  EMPTY_DECK: "EMPTY_DECK",
  EMPTY_OPEN_PILE: "EMPTY_OPEN_PILE",
  CARD_NOT_FOUND: "CARD_NOT_FOUND",
  INVALID_CARD_COUNT: "INVALID_CARD_COUNT",
  INVALID_ACTION: "INVALID_ACTION"
});

export function validateGameAction(
  state,
  playerId,
  action,
  payload = {}
) {
  const failure = (code, message) => ({
    valid: false,
    code,
    message
  });

  if (!state || !Array.isArray(state.players)) {
    return failure(
      ACTION_ERRORS.INVALID_STATE,
      "Game state is invalid."
    );
  }

  if (state.status !== GAME_STATUS.PLAYING) {
    return failure(
      ACTION_ERRORS.GAME_NOT_ACTIVE,
      "The game is not currently active."
    );
  }

  const player = state.players.find(
    item => item.id === playerId
  );

  if (!player) {
    return failure(
      ACTION_ERRORS.PLAYER_NOT_FOUND,
      "Player does not exist in this game."
    );
  }

  if (!player.isActive) {
    return failure(
      ACTION_ERRORS.PLAYER_INACTIVE,
      "This player is inactive."
    );
  }

  if (playerId !== state.currentPlayerId) {
    return failure(
      ACTION_ERRORS.NOT_PLAYER_TURN,
      "It is not this player's turn."
    );
  }

  if (!Object.values(ACTION_TYPES).includes(action)) {
    return failure(
      ACTION_ERRORS.INVALID_ACTION,
      "Unknown game action."
    );
  }

  const handCount = Array.isArray(player.cards)
    ? player.cards.length
    : 0;

  switch (action) {
    case ACTION_TYPES.DRAW_CLOSED:
      if (state.phase !== GAME_PHASE.DRAW) {
        return failure(
          ACTION_ERRORS.INVALID_PHASE,
          "Cards can only be drawn during the draw phase."
        );
      }

      if (!Array.isArray(state.deck?.closed) ||
          state.deck.closed.length === 0) {
        return failure(
          ACTION_ERRORS.EMPTY_DECK,
          "The closed deck is empty."
        );
      }

      if (handCount !== 13) {
        return failure(
          ACTION_ERRORS.INVALID_CARD_COUNT,
          "Player must have 13 cards before drawing."
        );
      }

      break;

    case ACTION_TYPES.DRAW_OPEN:
      if (state.phase !== GAME_PHASE.DRAW) {
        return failure(
          ACTION_ERRORS.INVALID_PHASE,
          "Cards can only be drawn during the draw phase."
        );
      }

      if (!Array.isArray(state.deck?.open) ||
          state.deck.open.length === 0) {
        return failure(
          ACTION_ERRORS.EMPTY_OPEN_PILE,
          "There is no open card to pick."
        );
      }

      if (handCount !== 13) {
        return failure(
          ACTION_ERRORS.INVALID_CARD_COUNT,
          "Player must have 13 cards before drawing."
        );
      }

      break;

    case ACTION_TYPES.DISCARD:
      if (state.phase !== GAME_PHASE.DISCARD) {
        return failure(
          ACTION_ERRORS.INVALID_PHASE,
          "Discard is only allowed during discard phase."
        );
      }

      if (handCount !== 14) {
        return failure(
          ACTION_ERRORS.INVALID_CARD_COUNT,
          "Player must have 14 cards before discarding."
        );
      }

      if (!payload.cardId) {
        return failure(
          ACTION_ERRORS.CARD_NOT_FOUND,
          "Select a card to discard."
        );
      }

      if (!player.cards.some(
        card => card.id === payload.cardId
      )) {
        return failure(
          ACTION_ERRORS.CARD_NOT_FOUND,
          "Selected card is not in the player's hand."
        );
      }

      break;

    case ACTION_TYPES.DECLARE:
      if (
        state.phase !== GAME_PHASE.DECLARATION &&
        state.phase !== GAME_PHASE.DISCARD
      ) {
        return failure(
          ACTION_ERRORS.INVALID_PHASE,
          "Declaration is not allowed at this stage."
        );
      }

      if (handCount !== 13) {
        return failure(
          ACTION_ERRORS.INVALID_CARD_COUNT,
          "A declaration requires exactly 13 cards."
        );
      }

      break;

    case ACTION_TYPES.SORT:
      if (handCount === 0) {
        return failure(
          ACTION_ERRORS.INVALID_CARD_COUNT,
          "There are no cards to sort."
        );
      }

      break;

    case ACTION_TYPES.DROP:
      if (
        state.phase !== GAME_PHASE.DRAW &&
        state.phase !== GAME_PHASE.WAITING
      ) {
        return failure(
          ACTION_ERRORS.INVALID_PHASE,
          "Player cannot drop at this stage."
        );
      }

      break;
  }

  return {
    valid: true,
    code: null,
    message: "Action is valid.",
    action,
    playerId
  };
}

export function assertGameAction(
  state,
  playerId,
  action,
  payload = {}
) {
  const result = validateGameAction(
    state,
    playerId,
    action,
    payload
  );

  if (!result.valid) {
    const error = new Error(result.message);
    error.code = result.code;
    throw error;
  }

  return true;
}

/* ================= FILE ENDING ================= */
          
