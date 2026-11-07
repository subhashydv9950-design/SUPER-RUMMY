
/* =========================================================
   SUPER RUMMY — AI HAND ANALYZER
   File: js/ai/ai-hand-analyzer.js
   Purpose: Analyze AI hand and identify card combinations.
   ========================================================= */

export const HAND_ANALYSIS_TYPES = Object.freeze({
  PURE_SEQUENCE: "pure_sequence",
  POSSIBLE_SEQUENCE: "possible_sequence",
  SET: "set",
  JOKER: "joker",
  UNGROUPED: "ungrouped"
});

const FACE_RANKS = Object.freeze({
  A: 1,
  J: 11,
  Q: 12,
  K: 13
});

function rankValue(card) {
  if (!card) return null;

  if (Number.isInteger(card.value)) {
    return card.value;
  }

  if (FACE_RANKS[card.rank] !== undefined) {
    return FACE_RANKS[card.rank];
  }

  const value = Number(card.rank);

  return Number.isInteger(value) && value >= 2 && value <= 10
    ? value
    : null;
}

function isJoker(card, wildRank = null) {
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

function getSuit(card) {
  return card?.suit || null;
}

function getCardId(card) {
  return card?.id || null;
}

function uniqueCards(cards) {
  const ids = new Set();

  return cards.filter(card => {
    const id = getCardId(card);

    if (!id || ids.has(id)) return false;

    ids.add(id);
    return true;
  });
}

function getCombinations(cards, size) {
  const output = [];

  function build(start, current) {
    if (current.length === size) {
      output.push([...current]);
      return;
    }

    for (let i = start; i < cards.length; i++) {
      current.push(cards[i]);
      build(i + 1, current);
      current.pop();
    }
  }

  build(0, []);

  return output;
}

/* ---------------------------------------------------------
   PURE SEQUENCE CHECK
   --------------------------------------------------------- */

export function isPossiblePureSequence(cards) {
  if (!Array.isArray(cards) || cards.length < 3) {
    return false;
  }

  if (cards.some(card => !card || isJoker(card))) {
    return false;
  }

  const suit = getSuit(cards[0]);

  if (!suit || cards.some(card => getSuit(card) !== suit)) {
    return false;
  }

  const ranks = cards.map(rankValue);

  if (ranks.some(rank => rank === null)) {
    return false;
  }

  ranks.sort((a, b) => a - b);

  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) {
      return false;
    }
  }

  return true;
}

/* ---------------------------------------------------------
   SET CHECK
   --------------------------------------------------------- */

export function isPossibleSet(cards) {
  if (
    !Array.isArray(cards) ||
    cards.length < 3 ||
    cards.length > 4
  ) {
    return false;
  }

  const firstRank = rankValue(cards[0]);

  if (firstRank === null) return false;

  const suits = new Set();

  for (const card of cards) {
    if (!card || isJoker(card)) return false;

    if (rankValue(card) !== firstRank) {
      return false;
    }

    const suit = getSuit(card);

    if (!suit || suits.has(suit)) {
      return false;
    }

    suits.add(suit);
  }

  return true;
}

/* ---------------------------------------------------------
   POSSIBLE SEQUENCE WITH JOKERS
   --------------------------------------------------------- */

export function analyzeSequenceCandidate(
  cards,
  options = {}
) {
  if (!Array.isArray(cards) || cards.length < 3) {
    return {
      possible: false,
      missingCards: 0,
      jokerCount: 0
    };
  }

  const wildRank = options.wildRank ?? null;

  const jokers = cards.filter(card =>
    isJoker(card, wildRank)
  );

  const normalCards = cards.filter(card =>
    !isJoker(card, wildRank)
  );

  if (normalCards.length === 0) {
    return {
      possible: false,
      missingCards: cards.length,
      jokerCount: jokers.length
    };
  }

  const suit = getSuit(normalCards[0]);

  if (
    !suit ||
    normalCards.some(card => getSuit(card) !== suit)
  ) {
    return {
      possible: false,
      missingCards: 0,
      jokerCount: jokers.length
    };
  }

  const ranks = normalCards.map(rankValue);

  if (ranks.some(rank => rank === null)) {
    return {
      possible: false,
      missingCards: 0,
      jokerCount: jokers.length
    };
  }

  ranks.sort((a, b) => a - b);

  const uniqueRanks = [...new Set(ranks)];

  if (uniqueRanks.length !== ranks.length) {
    return {
      possible: false,
      missingCards: 0,
      jokerCount: jokers.length
    };
  }

  const span =
    uniqueRanks[uniqueRanks.length - 1] -
    uniqueRanks[0] + 1;

  const missingCards = span - uniqueRanks.length;

  return {
    possible:
      missingCards <= jokers.length &&
      span <= cards.length,
    missingCards,
    jokerCount: jokers.length,
    suit,
    ranks: uniqueRanks
  };
}

/* ---------------------------------------------------------
   SET CANDIDATE ANALYSIS
   --------------------------------------------------------- */

export function analyzeSetCandidate(cards, options = {}) {
  if (!Array.isArray(cards) || cards.length < 3) {
    return {
      possible: false,
      jokerCount: 0
    };
  }

  const wildRank = options.wildRank ?? null;

  const jokers = cards.filter(card =>
    isJoker(card, wildRank)
  );

  const normalCards = cards.filter(card =>
    !isJoker(card, wildRank)
  );

  if (normalCards.length === 0) {
    return {
      possible: false,
      jokerCount: jokers.length
    };
  }

  if (cards.length > 4) {
    return {
      possible: false,
      jokerCount: jokers.length
    };
  }

  const targetRank = rankValue(normalCards[0]);

  if (
    targetRank === null ||
    normalCards.some(card => rankValue(card) !== targetRank)
  ) {
    return {
      possible: false,
      jokerCount: jokers.length
    };
  }

  const suits = normalCards.map(getSuit);

  if (
    suits.some(suit => !suit) ||
    new Set(suits).size !== suits.length
  ) {
    return {
      possible: false,
      jokerCount: jokers.length
    };
  }

  return {
    possible: true,
    rank: targetRank,
    jokerCount: jokers.length,
    suits
  };
}

/* ---------------------------------------------------------
   CARD POINTS
   --------------------------------------------------------- */

export function getHandCardPoints(card, wildRank = null) {
  if (isJoker(card, wildRank)) return 0;

  const rank = rankValue(card);

  if (rank === null) return 10;

  return Math.min(rank, 10);
}

/* ---------------------------------------------------------
   CARD CONNECTION ANALYSIS
   --------------------------------------------------------- */

export function analyzeCardConnections(
  hand,
  options = {}
) {
  if (!Array.isArray(hand)) return [];

  return hand.map(card => {
    if (isJoker(card, options.wildRank ?? null)) {
      return {
        cardId: card.id,
        type: HAND_ANALYSIS_TYPES.JOKER,
        connectionScore: 100
      };
    }

    let score = 0;

    for (const other of hand) {
      if (card.id === other.id) continue;

      if (isJoker(other, options.wildRank ?? null)) {
        score += 1;
        continue;
      }

      const rankA = rankValue(card);
      const rankB = rankValue(other);

      if (rankA === null || rankB === null) continue;

      if (rankA === rankB) {
        score += 4;
      }

      if (getSuit(card) === getSuit(other)) {
        const distance = Math.abs(rankA - rankB);

        if (distance === 1) score += 4;
        else if (distance === 2) score += 2;
      }
    }

    return {
      cardId: card.id,
      type: score > 0
        ? HAND_ANALYSIS_TYPES.POSSIBLE_SEQUENCE
        : HAND_ANALYSIS_TYPES.UNGROUPED,
      connectionScore: score
    };
  });
}

/* ---------------------------------------------------------
   FULL HAND ANALYSIS
   --------------------------------------------------------- */

export function analyzeAIHand(hand, options = {}) {
  if (!Array.isArray(hand)) {
    throw new Error("AI hand must be an array.");
  }

  const cards = uniqueCards(hand);

  const wildRank = options.wildRank ?? null;

  const jokers = cards.filter(card =>
    isJoker(card, wildRank)
  );

  const normalCards = cards.filter(card =>
    !isJoker(card, wildRank)
  );

  const pureSequences = [];
  const sets = [];
  const possibleSequences = [];

  for (let size = 3; size <= 5; size++) {
    for (const combination of getCombinations(normalCards, size)) {
      if (isPossiblePureSequence(combination)) {
        pureSequences.push(combination);
      }

      if (size <= 4 && isPossibleSet(combination)) {
        sets.push(combination);
      }
    }
  }

  for (let size = 3; size <= 5; size++) {
    for (const combination of getCombinations(cards, size)) {
      const analysis = analyzeSequenceCandidate(
        combination,
        { wildRank }
      );

      if (
        analysis.possible &&
        analysis.jokerCount > 0
      ) {
        possibleSequences.push({
          cards: combination,
          ...analysis
        });
      }
    }
  }

  const connections = analyzeCardConnections(
    cards,
    { wildRank }
  );

  const totalPoints = cards.reduce(
    (sum, card) =>
      sum + getHandCardPoints(card, wildRank),
    0
  );

  return {
    cardCount: cards.length,
    jokerCount: jokers.length,
    totalPoints,
    pureSequences,
    sets,
    possibleSequences,
    connections,
    analyzedAt: Date.now()
  };
}

/* ---------------------------------------------------------
   WEAK CARD IDENTIFICATION
   --------------------------------------------------------- */

export function findWeakCards(hand, options = {}) {
  const connections = analyzeCardConnections(
    hand,
    options
  );

  const weakIds = new Set(
    connections
      .filter(item =>
        item.type === HAND_ANALYSIS_TYPES.UNGROUPED
      )
      .map(item => item.cardId)
  );

  return hand.filter(card => weakIds.has(card.id));
}

/* ================= FILE ENDING ================= */
    
