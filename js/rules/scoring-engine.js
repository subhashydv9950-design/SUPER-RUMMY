
/* =========================================================
   SUPER RUMMY — SCORING ENGINE
   FILE: js/rules/scoring-engine.js
   VERSION: 1.0
   ========================================================= */

import {
  validateDeclaration
} from "./declaration-validator.js";

export const SCORING_CONFIG = Object.freeze({
  MAX_POINTS: 80,
  FIRST_DROP: 20,
  MIDDLE_DROP: 40,
  INVALID_DECLARATION: 80,
  WINNER_POINTS: 0
});

export const SCORE_TYPES = Object.freeze({
  WIN: "win",
  LOSS: "loss",
  FIRST_DROP: "first-drop",
  MIDDLE_DROP: "middle-drop",
  INVALID_DECLARATION: "invalid-declaration"
});

/* =========================================================
   CARD POINT VALUES
   ========================================================= */

export function getCardScore(card, wildRank = null) {
  if (!card) return 0;

  // Printed joker
  if (
    card.type === "joker" ||
    card.isPrintedJoker === true
  ) {
    return 0;
  }

  // Wild joker
  if (card.isWildJoker === true) {
    return 0;
  }

  const rank = String(card.rank).toUpperCase();

  if (
    wildRank !== null &&
    wildRank !== undefined &&
    rank === String(wildRank).toUpperCase()
  ) {
    return 0;
  }

  if (rank === "A" || rank === "J" ||
      rank === "Q" || rank === "K") {
    return 10;
  }

  const numericRank = Number(rank);

  if (
    Number.isInteger(numericRank) &&
    numericRank >= 2 &&
    numericRank <= 10
  ) {
    return numericRank;
  }

  return 0;
}

/* =========================================================
   TOTAL HAND POINTS
   ========================================================= */

export function calculateHandPoints(
  cards = [],
  wildRank = null
) {
  if (!Array.isArray(cards)) {
    throw new TypeError("Cards must be an array.");
  }

  return cards.reduce(
    (total, card) =>
      total + getCardScore(card, wildRank),
    0
  );
}

/* =========================================================
   CAP PLAYER PENALTY
   ========================================================= */

export function capPoints(
  points,
  maximum = SCORING_CONFIG.MAX_POINTS
) {
  const value = Number(points);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.min(Math.floor(value), maximum);
}

/* =========================================================
   PLAYER ROUND SCORE
   ========================================================= */

export function calculatePlayerScore({
  cards = [],
  status = SCORE_TYPES.LOSS,
  wildRank = null,
  declarationValid = true
} = {}) {
  if (status === SCORE_TYPES.WIN) {
    return {
      points: SCORING_CONFIG.WINNER_POINTS,
      status,
      breakdown: {
        cardPoints: 0,
        penalty: 0
      }
    };
  }

  if (status === SCORE_TYPES.FIRST_DROP) {
    return {
      points: SCORING_CONFIG.FIRST_DROP,
      status,
      breakdown: {
        cardPoints: 0,
        penalty: SCORING_CONFIG.FIRST_DROP
      }
    };
  }

  if (status === SCORE_TYPES.MIDDLE_DROP) {
    return {
      points: SCORING_CONFIG.MIDDLE_DROP,
      status,
      breakdown: {
        cardPoints: 0,
        penalty: SCORING_CONFIG.MIDDLE_DROP
      }
    };
  }

  if (
    status === SCORE_TYPES.INVALID_DECLARATION ||
    declarationValid === false
  ) {
    return {
      points: SCORING_CONFIG.INVALID_DECLARATION,
      status: SCORE_TYPES.INVALID_DECLARATION,
      breakdown: {
        cardPoints: 0,
        penalty: SCORING_CONFIG.INVALID_DECLARATION
      }
    };
  }

  const cardPoints = calculateHandPoints(
    cards,
    wildRank
  );

  const finalPoints = capPoints(cardPoints);

  return {
    points: finalPoints,
    status: SCORE_TYPES.LOSS,
    breakdown: {
      cardPoints,
      penalty: 0
    }
  };
}

/* =========================================================
   COMPLETE ROUND SCORING
   ========================================================= */

export function calculateRoundScores({
  players = [],
  winnerId,
  wildRank = null
} = {}) {
  if (!Array.isArray(players) || players.length < 2) {
    throw new Error(
      "At least two players are required."
    );
  }

  if (winnerId === undefined || winnerId === null) {
    throw new Error("A winner ID is required.");
  }

  const winner = players.find(
    (player) => String(player.id) === String(winnerId)
  );

  if (!winner) {
    throw new Error("Winner was not found.");
  }

  const results = players.map((player) => {
    const isWinner =
      String(player.id) === String(winnerId);

    if (isWinner) {
      return {
        playerId: player.id,
        playerName: player.name ?? "Player",
        ...calculatePlayerScore({
          status: SCORE_TYPES.WIN
        })
      };
    }

    const result = calculatePlayerScore({
      cards: player.cards ?? [],
      status: player.status ?? SCORE_TYPES.LOSS,
      wildRank,
      declarationValid: player.declarationValid !== false
    });

    return {
      playerId: player.id,
      playerName: player.name ?? "Player",
      ...result
    };
  });

  return {
    winnerId,
    results,
    totalPenalty: results.reduce(
      (total, result) => total + result.points,
      0
    ),
    completedAt: Date.now()
  };
}

/* =========================================================
   VALIDATE AND SCORE DECLARATION
   ========================================================= */

export function validateAndScoreDeclaration({
  hand,
  groups,
  wildRank = null
} = {}) {
  const validation = validateDeclaration({
    hand,
    groups,
    wildRank
  });

  if (!validation.valid) {
    return {
      valid: false,
      validation,
      points: SCORING_CONFIG.INVALID_DECLARATION,
      status: SCORE_TYPES.INVALID_DECLARATION
    };
  }

  return {
    valid: true,
    validation,
    points: 0,
    status: SCORE_TYPES.WIN
  };
}

/* =========================================================
   SCORE SUMMARY
   ========================================================= */

export function createScoreSummary(results = []) {
  if (!Array.isArray(results)) {
    throw new TypeError("Results must be an array.");
  }

  return {
    playerCount: results.length,
    totalPenalty: results.reduce(
      (sum, result) => sum + (result.points || 0),
      0
    ),
    zeroPointPlayers: results.filter(
      (result) => result.points === 0
    ).length,
    highestPenalty: results.reduce(
      (highest, result) =>
        Math.max(highest, result.points || 0),
      0
    )
  };
}

/* =========================================================
   FILE END: js/rules/scoring-engine.js
   ========================================================= */
