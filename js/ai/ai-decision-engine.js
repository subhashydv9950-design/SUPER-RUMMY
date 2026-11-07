
/* =========================================================
   SUPER RUMMY — AI DECISION ENGINE
   File: js/ai/ai-decision-engine.js
   Purpose: AI card decisions for practice gameplay.
   ========================================================= */

export const AI_DIFFICULTY = Object.freeze({
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard"
});

export const AI_ERRORS = Object.freeze({
  INVALID_HAND: "INVALID_HAND",
  INVALID_DIFFICULTY: "INVALID_DIFFICULTY",
  INVALID_CARD: "INVALID_CARD",
  NO_DISCARD_CANDIDATE: "NO_DISCARD_CANDIDATE"
});

const FACE_VALUES = Object.freeze({
  J: 11,
  Q: 12,
  K: 13,
  A: 1
});

function randomIndex(length) {
  return Math.floor(Math.random() * length);
}

function getRankValue(card) {
  if (!card) return null;

  if (Number.isInteger(card.value)) {
    return card.value;
  }

  if (FACE_VALUES[card.rank] !== undefined) {
    return FACE_VALUES[card.rank];
  }

  const value = Number(card.rank);

  return Number.isInteger(value) && value >= 2 && value <= 10
    ? value
    : null;
}

function isJoker(card, wildRank = null) {
  if (!card) return false;

  return (
    card.type === "joker" ||
    card.isJoker === true ||
    card.isPrintedJoker === true ||
    (
      wildRank !== null &&
      card.rank === wildRank
    )
  );
}

function getCardPoints(card) {
  if (!card || isJoker(card)) return 0;

  const rank = getRankValue(card);

  if (rank === null) return 10;

  return Math.min(rank, 10);
}

function getSuit(card) {
  return card?.suit || null;
}

function sameSuit(a, b) {
  return (
    getSuit(a) !== null &&
    getSuit(a) === getSuit(b)
  );
}

function isSameRank(a, b) {
  return (
    getRankValue(a) !== null &&
    getRankValue(a) === getRankValue(b)
  );
}

/* ---------------------------------------------------------
   CARD RELATIONSHIP SCORE
   --------------------------------------------------------- */

export function getCardConnectionScore(
  card,
  hand,
  wildRank = null
) {
  if (!card || !Array.isArray(hand)) return 0;

  if (isJoker(card, wildRank)) return 100;

  const rank = getRankValue(card);

  if (rank === null) return 0;

  let score = 0;

  for (const other of hand) {
    if (!other || other.id === card.id) continue;

    if (isJoker(other, wildRank)) {
      score += 1;
      continue;
    }

    const otherRank = getRankValue(other);

    if (otherRank === null) continue;

    if (isSameRank(card, other)) {
      score += 5;
    }

    if (sameSuit(card, other)) {
      const distance = Math.abs(rank - otherRank);

      if (distance === 1) {
        score += 4;
      } else if (distance === 2) {
        score += 2;
      }

      // Ace can also connect with King in an Ace-high sequence.
      if (
        (rank === 1 && otherRank === 13) ||
        (rank === 13 && otherRank === 1)
      ) {
        score += 2;
      }
    }
  }

  return score;
}

/* ---------------------------------------------------------
   DISCARD CANDIDATE SCORING
   --------------------------------------------------------- */

export function evaluateDiscardCandidate(
  card,
  hand,
  options = {}
) {
  const wildRank = options.wildRank ?? null;

  const connection = getCardConnectionScore(
    card,
    hand,
    wildRank
  );

  const points = getCardPoints(card);

  const jokerPenalty = isJoker(card, wildRank)
    ? 1000
    : 0;

  const randomFactor = options.randomFactor
    ? Math.random() * options.randomFactor
    : 0;

  return {
    cardId: card.id,
    connectionScore: connection,
    points,
    discardScore:
      points * 2 -
      connection * 3 +
      randomFactor -
      jokerPenalty
  };
}

/* ---------------------------------------------------------
   DISCARD DECISION
   --------------------------------------------------------- */

export function chooseDiscardCard(hand, options = {}) {
  if (!Array.isArray(hand) || hand.length === 0) {
    throw new Error(AI_ERRORS.INVALID_HAND);
  }

  const difficulty = options.difficulty ||
    AI_DIFFICULTY.MEDIUM;

  if (!Object.values(AI_DIFFICULTY).includes(difficulty)) {
    throw new Error(AI_ERRORS.INVALID_DIFFICULTY);
  }

  if (hand.length === 1) {
    throw new Error(AI_ERRORS.NO_DISCARD_CANDIDATE);
  }

  const candidates = hand
    .filter(card => card && typeof card.id === "string")
    .map(card => ({
      card,
      evaluation: evaluateDiscardCandidate(
        card,
        hand,
        {
          wildRank: options.wildRank,
          randomFactor:
            difficulty === AI_DIFFICULTY.EASY
              ? 18
              : difficulty === AI_DIFFICULTY.MEDIUM
                ? 5
                : 0
        }
      )
    }));

  if (candidates.length === 0) {
    throw new Error(AI_ERRORS.INVALID_CARD);
  }

  if (difficulty === AI_DIFFICULTY.EASY) {
    return candidates[randomIndex(candidates.length)].card.id;
  }

  candidates.sort((a, b) =>
    b.evaluation.discardScore -
    a.evaluation.discardScore
  );

  if (difficulty === AI_DIFFICULTY.MEDIUM) {
    const topCandidates = candidates.slice(
      0,
      Math.min(3, candidates.length)
    );

    return topCandidates[
      randomIndex(topCandidates.length)
    ].card.id;
  }

  return candidates[0].card.id;
}

/* ---------------------------------------------------------
   OPEN PILE DECISION
   --------------------------------------------------------- */

export function shouldTakeOpenCard(
  hand,
  openCard,
  options = {}
) {
  if (
    !Array.isArray(hand) ||
    !openCard ||
    typeof openCard.id !== "string"
  ) {
    return false;
  }

  const difficulty = options.difficulty ||
    AI_DIFFICULTY.MEDIUM;

  if (!Object.values(AI_DIFFICULTY).includes(difficulty)) {
    throw new Error(AI_ERRORS.INVALID_DIFFICULTY);
  }

  if (isJoker(openCard, options.wildRank ?? null)) {
    return true;
  }

  const connection = getCardConnectionScore(
    openCard,
    hand,
    options.wildRank ?? null
  );

  if (difficulty === AI_DIFFICULTY.EASY) {
    return connection >= 5;
  }

  if (difficulty === AI_DIFFICULTY.MEDIUM) {
    return connection >= 3;
  }

  return connection >= 2;
}

/* ---------------------------------------------------------
   AI PROFILE
   --------------------------------------------------------- */

export function createAIProfile(options = {}) {
  const difficulty = options.difficulty ||
    AI_DIFFICULTY.MEDIUM;

  if (!Object.values(AI_DIFFICULTY).includes(difficulty)) {
    throw new Error(AI_ERRORS.INVALID_DIFFICULTY);
  }

  return {
    id: options.id || `ai_${Date.now()}`,
    name: options.name || "SUPER RUMMY AI",
    type: "ai",
    difficulty,
    avatar: options.avatar || "default-ai",
    thinkingDelay:
      difficulty === AI_DIFFICULTY.EASY
        ? 700
        : difficulty === AI_DIFFICULTY.MEDIUM
          ? 1100
          : 1500
  };
}

/* ---------------------------------------------------------
   AI DECISION SUMMARY
   --------------------------------------------------------- */

export function getAIDecisionSummary(hand, options = {}) {
  if (!Array.isArray(hand)) {
    return {
      cardCount: 0,
      jokerCount: 0,
      totalPoints: 0
    };
  }

  const jokerCount = hand.filter(card =>
    isJoker(card, options.wildRank ?? null)
  ).length;

  const totalPoints = hand.reduce(
    (sum, card) => sum + getCardPoints(card),
    0
  );

  return {
    cardCount: hand.length,
    jokerCount,
    totalPoints
  };
}

/* ================= FILE ENDING ================= */
