
/* =========================================================
   SUPER RUMMY — CARD PILE MANAGER
   File: js/game/card-pile-manager.js
   Purpose: Connect card piles with the central game state

   IMPORTANT:
   The last array element is treated as the top card.
   ========================================================= */

import {
  GAME_PHASE,
  GAME_STATUS,
  updateGameState,
  setGamePhase
} from "./game-state.js";

import {
  finishDiscardAndAdvance
} from "./turn-flow.js";

export class CardPileManager {
  constructor(options = {}) {
    this.onCardDrawn = options.onCardDrawn || null;
    this.onCardDiscarded = options.onCardDiscarded || null;
  }

  drawFromClosed(state, playerId) {
    this.validateDraw(state, playerId);

    const closed = [...state.deck.closed];

    if (closed.length === 0) {
      throw new Error("Closed deck is empty.");
    }

    const card = closed.pop();

    return this.completeDraw(
      state,
      playerId,
      card,
      closed,
      [...state.deck.open],
      "closed"
    );
  }

  drawFromOpen(state, playerId) {
    this.validateDraw(state, playerId);

    const open = [...state.deck.open];

    if (open.length === 0) {
      throw new Error("Open pile is empty.");
    }

    const card = open.pop();

    return this.completeDraw(
      state,
      playerId,
      card,
      [...state.deck.closed],
      open,
      "open"
    );
  }

  completeDraw(
    state,
    playerId,
    card,
    closed,
    open,
    source
  ) {
    if (!card || !card.id) {
      throw new Error("Invalid card in deck.");
    }

    const players = cloneSafe(state.players);
    const player = players.find(
      item => item.id === playerId
    );

    if (!player) {
      throw new Error("Player not found.");
    }

    if (player.cards.length !== 13) {
      throw new Error("Player must have 13 cards before drawing.");
    }

    player.cards.push(cloneSafe(card));

    let nextState = updateGameState(state, {
      players,
      deck: {
        closed,
        open,
        totalCards: closed.length + open.length
      }
    });

    nextState = setGamePhase(
      nextState,
      GAME_PHASE.DISCARD
    );

    this.emit(this.onCardDrawn, {
      playerId,
      card: cloneSafe(card),
      source
    });

    return nextState;
  }

  discardFromHand(state, playerId, cardId) {
    this.validateDiscard(state, playerId, cardId);

    const players = cloneSafe(state.players);
    const player = players.find(
      item => item.id === playerId
    );

    const cardIndex = player.cards.findIndex(
      card => card.id === cardId
    );

    const [discardedCard] = player.cards.splice(
      cardIndex,
      1
    );

    const open = [...state.deck.open];
    open.push(cloneSafe(discardedCard));

    let nextState = updateGameState(state, {
      players,
      deck: {
        closed: [...state.deck.closed],
        open,
        totalCards:
          state.deck.closed.length + open.length
      }
    });

    this.emit(this.onCardDiscarded, {
      playerId,
      card: cloneSafe(discardedCard)
    });

    nextState = finishDiscardAndAdvance(
      nextState,
      playerId
    );

    return {
      state: nextState,
      discardedCard: cloneSafe(discardedCard)
    };
  }

  validateDraw(state, playerId) {
    this.validateBaseState(state, playerId);

    if (state.phase !== GAME_PHASE.DRAW) {
      throw new Error("It is not the draw phase.");
    }

    const player = this.getPlayer(state, playerId);

    if (player.cards.length !== 13) {
      throw new Error("Player must have exactly 13 cards.");
    }
  }

  validateDiscard(state, playerId, cardId) {
    this.validateBaseState(state, playerId);

    if (state.phase !== GAME_PHASE.DISCARD) {
      throw new Error("It is not the discard phase.");
    }

    if (!cardId) {
      throw new Error("Card ID is required.");
    }

    const player = this.getPlayer(state, playerId);

    if (player.cards.length !== 14) {
      throw new Error("Player must have exactly 14 cards.");
    }

    if (!player.cards.some(card => card.id === cardId)) {
      throw new Error("Selected card is not in the player's hand.");
    }
  }

  validateBaseState(state, playerId) {
    if (!state || state.status !== GAME_STATUS.PLAYING) {
      throw new Error("Game is not active.");
    }

    if (state.currentPlayerId !== playerId) {
      throw new Error("It is not this player's turn.");
    }

    if (
      !Array.isArray(state.deck?.closed) ||
      !Array.isArray(state.deck?.open)
    ) {
      throw new Error("Game deck is invalid.");
    }
  }

  getPlayer(state, playerId) {
    const player = state.players.find(
      item => item.id === playerId
    );

    if (!player) {
      throw new Error("Player not found.");
    }

    if (!player.isActive) {
      throw new Error("Player is inactive.");
    }

    return player;
  }

  getPileSummary(state) {
    return {
      closedCount: state.deck.closed.length,
      openCount: state.deck.open.length,
      closedTop: getTopCard(state.deck.closed),
      openTop: getTopCard(state.deck.open),
      totalCards:
        state.deck.closed.length + state.deck.open.length
    };
  }

  emit(callback, payload) {
    if (typeof callback === "function") {
      callback(payload);
    }
  }
}

function getTopCard(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  return cloneSafe(cards[cards.length - 1]);
}

function cloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function createCardPileManager(options = {}) {
  return new CardPileManager(options);
}

/* ================= FILE ENDING ================= */
    
