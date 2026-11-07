
/* =========================================================
   SUPER RUMMY — AI TURN PLANNER
   File: js/ai/ai-turn-planner.js
   Purpose: Plan AI draw and discard decisions.
   ========================================================= */

import {
  AI_DIFFICULTY,
  chooseDiscardCard,
  shouldTakeOpenCard
} from "./ai-decision-engine.js";

import {
  analyzeAIHand,
  getHandCardPoints
} from "./ai-hand-analyzer.js";

export const AI_DRAW_SOURCE = Object.freeze({
  CLOSED: "closed",
  OPEN: "open"
});

export const AI_PLAN_ERRORS = Object.freeze({
  INVALID_HAND: "INVALID_HAND",
  INVALID_OPTIONS: "INVALID_OPTIONS",
  INVALID_DIFFICULTY: "INVALID_DIFFICULTY",
  EMPTY_DECK: "EMPTY_DECK",
  INVALID_OPEN_CARD: "INVALID_OPEN_CARD",
  NO_DISCARD_CARD: "NO_DISCARD_CARD"
});

function isValidCard(card) {
  return Boolean(
    card &&
    typeof card.id === "string" &&
    card.id.length > 0
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getJoker(card, wildRank) {
  return Boolean(
    card &&
    (
      card.type === "joker" ||
      card.isJoker === true ||
      card.isPrintedJoker === true ||
      (
        wildRank !== null &&
        card.rank === wildRank
      )
    )
  );
}

function validateHand(hand) {
  if (!Array.isArray(hand) || hand.length !== 13) {
    throw new Error(AI_PLAN_ERRORS.INVALID_HAND);
  }

  const ids = new Set();

  for (const card of hand) {
    if (!isValidCard(card) || ids.has(card.id)) {
      throw new Error(AI_PLAN_ERRORS.INVALID_HAND);
    }

    ids.add(card.id);
  }

  return true;
}

function validateDifficulty(difficulty) {
  if (!Object.values(AI_DIFFICULTY).includes(difficulty)) {
    throw new Error(AI_PLAN_ERRORS.INVALID_DIFFICULTY);
  }
}

/* ---------------------------------------------------------
   DRAW DECISION
   --------------------------------------------------------- */

export function planAIDraw(hand, options = {}) {
  validateHand(hand);

  const difficulty = options.difficulty ||
    AI_DIFFICULTY.MEDIUM;

  validateDifficulty(difficulty);

  const wildRank = options.wildRank ?? null;
  const openCard = options.openCard || null;
  const closedDeckAvailable =
    options.closedDeckAvailable !== false;

  if (!closedDeckAvailable && !openCard) {
    throw new Error(AI_PLAN_ERRORS.EMPTY_DECK);
  }

  if (openCard && !isValidCard(openCard)) {
    throw new Error(AI_PLAN_ERRORS.INVALID_OPEN_CARD);
  }

  if (openCard && hand.some(card => card.id === openCard.id)) {
    throw new Error(AI_PLAN_ERRORS.INVALID_OPEN_CARD);
  }

  const takeOpen = openCard
    ? shouldTakeOpenCard(hand, openCard, {
        difficulty,
        wildRank
      })
    : false;

  if (takeOpen) {
    return {
      source: AI_DRAW_SOURCE.OPEN,
      cardId: openCard.id,
      reason: "Open card improves the hand.",
      requiresRecycle: false
    };
  }

  if (closedDeckAvailable) {
    return {
      source: AI_DRAW_SOURCE.CLOSED,
      cardId: null,
      reason: "Draw from the closed deck.",
      requiresRecycle: false
    };
  }

  return {
    source: AI_DRAW_SOURCE.OPEN,
    cardId: openCard.id,
    reason: "No closed cards are available.",
    requiresRecycle: false
  };
}

/* ---------------------------------------------------------
   DISCARD DECISION
   --------------------------------------------------------- */

export function planAIDiscard(hand, options = {}) {
  if (!Array.isArray(hand) || hand.length !== 14) {
    throw new Error(AI_PLAN_ERRORS.INVALID_HAND);
  }

  const difficulty = options.difficulty ||
    AI_DIFFICULTY.MEDIUM;

  validateDifficulty(difficulty);

  const wildRank = options.wildRank ?? null;
  const drawnCardId = options.drawnCardId || null;

  const validCards = hand.filter(isValidCard);

  if (validCards.length !== 14) {
    throw new Error(AI_PLAN_ERRORS.INVALID_HAND);
  }

  const ids = new Set(validCards.map(card => card.id));

  if (ids.size !== 14) {
    throw new Error(AI_PLAN_ERRORS.INVALID_HAND);
  }

  let candidates = validCards;

  // Prefer not to discard the card just picked from the open pile.
  if (drawnCardId && options.drawnFromOpen === true) {
    candidates = validCards.filter(
      card => card.id !== drawnCardId
    );
  }

  if (candidates.length === 0) {
    throw new Error(AI_PLAN_ERRORS.NO_DISCARD_CARD);
  }

  const discardId = chooseDiscardCard(candidates, {
    difficulty,
    wildRank
  });

  if (!discardId) {
    throw new Error(AI_PLAN_ERRORS.NO_DISCARD_CARD);
  }

  const discardedCard = validCards.find(
    card => card.id === discardId
  );

  if (!discardedCard) {
    throw new Error(AI_PLAN_ERRORS.NO_DISCARD_CARD);
  }

  return {
    cardId: discardId,
    card: clone(discardedCard),
    points: getHandCardPoints(discardedCard, wildRank),
    reason: "Selected using AI hand evaluation."
  };
}

/* ---------------------------------------------------------
   COMPLETE TURN PLAN
   --------------------------------------------------------- */

export function createAITurnPlan(hand, options = {}) {
  validateHand(hand);

  const difficulty = options.difficulty ||
    AI_DIFFICULTY.MEDIUM;

  validateDifficulty(difficulty);

  const wildRank = options.wildRank ?? null;

  const draw = planAIDraw(hand, {
    difficulty,
    wildRank,
    openCard: options.openCard || null,
    closedDeckAvailable:
      options.closedDeckAvailable !== false
  });

  let hypotheticalHand = [...hand];

  if (draw.source === AI_DRAW_SOURCE.OPEN) {
    hypotheticalHand.push(options.openCard);
  } else if (options.simulatedClosedCard) {
    if (!isValidCard(options.simulatedClosedCard)) {
      throw new Error(AI_PLAN_ERRORS.INVALID_OPTIONS);
    }

    hypotheticalHand.push(options.simulatedClosedCard);
  }

  const analysis = analyzeAIHand(
    hypotheticalHand,
    { wildRank }
  );

  let discard = null;

  // A real closed-deck card is unknown until drawn.
  if (hypotheticalHand.length === 14) {
    discard = planAIDiscard(hypotheticalHand, {
      difficulty,
      wildRank,
      drawnCardId:
        draw.source === AI_DRAW_SOURCE.OPEN
          ? draw.cardId
          : options.simulatedClosedCard?.id || null,
      drawnFromOpen: draw.source === AI_DRAW_SOURCE.OPEN
    });
  }

  return {
    difficulty,
    draw,
    discard,
    analysis,
    requiresDiscardPlanning: discard === null,
    createdAt: Date.now()
  };
}

/* ---------------------------------------------------------
   FINAL DECISION AFTER CLOSED DRAW
   --------------------------------------------------------- */

export function completeAIDrawPlan(
  originalHand,
  drawnCard,
  options = {}
) {
  validateHand(originalHand);

  if (!isValidCard(drawnCard)) {
    throw new Error(AI_PLAN_ERRORS.INVALID_OPTIONS);
  }

  if (originalHand.some(card => card.id === drawnCard.id)) {
    throw new Error(AI_PLAN_ERRORS.INVALID_OPTIONS);
  }

  const updatedHand = [
    ...originalHand,
    drawnCard
  ];

  const discard = planAIDiscard(updatedHand, {
    difficulty: options.difficulty ||
      AI_DIFFICULTY.MEDIUM,
    wildRank: options.wildRank ?? null,
    drawnCardId: drawnCard.id,
    drawnFromOpen: false
  });

  return {
    discard,
    analysis: analyzeAIHand(updatedHand, {
      wildRank: options.wildRank ?? null
    }),
    remainingCardCount: 13
  };
}

/* ---------------------------------------------------------
   AI THINKING PROFILE
   --------------------------------------------------------- */

export function getAIThinkingProfile(difficulty) {
  validateDifficulty(difficulty);

  const profiles = {
    [AI_DIFFICULTY.EASY]: {
      minDelay: 500,
      maxDelay: 1000,
      strategy: "basic"
    },

    [AI_DIFFICULTY.MEDIUM]: {
      minDelay: 900,
      maxDelay: 1600,
      strategy: "balanced"
    },

    [AI_DIFFICULTY.HARD]: {
      minDelay: 1300,
      maxDelay: 2200,
      strategy: "advanced"
    }
  };

  return clone(profiles[difficulty]);
}

/* ================= FILE ENDING ================= */
