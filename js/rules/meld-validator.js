
/* =========================================================
   SUPER RUMMY — MELD VALIDATOR
   FILE: js/rules/meld-validator.js
   VERSION: 1.0
   ========================================================= */

export const MELD_TYPES = Object.freeze({
  PURE_SEQUENCE: "pure-sequence",
  IMPURE_SEQUENCE: "impure-sequence",
  SET: "set",
  INVALID: "invalid"
});

const SUITS = ["clubs", "diamonds", "hearts", "spades"];

const RANK_VALUES = Object.freeze({
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13
});

function getRankValue(card) {
  if (!card) return null;

  const rank = String(card.rank).toUpperCase();

  if (RANK_VALUES[rank] !== undefined) {
    return RANK_VALUES[rank];
  }

  const number = Number(card.rank);

  return Number.isInteger(number) && number >= 1 && number <= 13
    ? number
    : null;
}

function getSuit(card) {
  if (!card || !card.suit) return null;

  return String(card.suit).toLowerCase();
}

function isPrintedJoker(card) {
  return Boolean(
    card &&
    (
      card.type === "joker" ||
      card.isPrintedJoker === true
    )
  );
}

function isWildJoker(card, wildRank) {
  if (!card) return false;

  if (isPrintedJoker(card)) return true;

  if (card.isWildJoker === true) return true;

  if (wildRank === null || wildRank === undefined) {
    return false;
  }

  return getRankValue(card) === getRankValue({ rank: wildRank });
}

function isJoker(card, wildRank) {
  return isWildJoker(card, wildRank);
}

function validateCardArray(cards) {
  if (!Array.isArray(cards)) return false;

  if (cards.length < 3 || cards.length > 13) {
    return false;
  }

  return cards.every((card) =>
    card &&
    typeof card === "object" &&
    card.id !== undefined &&
    card.id !== null
  );
}

function getNaturalCards(cards, wildRank) {
  return cards.filter((card) => !isJoker(card, wildRank));
}

function getJokers(cards, wildRank) {
  return cards.filter((card) => isJoker(card, wildRank));
}

/* =========================================================
   PURE SEQUENCE
   Same suit, consecutive ranks, no jokers.
   ========================================================= */

export function isPureSequence(cards) {
  if (!validateCardArray(cards)) return false;

  if (cards.some(isPrintedJoker)) return false;

  if (cards.some((card) => card.isWildJoker === true)) {
    return false;
  }

  const firstSuit = getSuit(cards[0]);

  if (!SUITS.includes(firstSuit)) return false;

  const suitsMatch = cards.every(
    (card) => getSuit(card) === firstSuit
  );

  if (!suitsMatch) return false;

  const ranks = cards.map(getRankValue);

  if (ranks.some((rank) => rank === null)) return false;

  return checkConsecutiveRanks(ranks);
}

function checkConsecutiveRanks(ranks) {
  const uniqueRanks = new Set(ranks);

  if (uniqueRanks.size !== ranks.length) return false;

  const sorted = [...ranks].sort((a, b) => a - b);

  const lowSequence = sorted.every(
    (rank, index) =>
      index === 0 || rank === sorted[index - 1] + 1
  );

  if (lowSequence) return true;

  // Ace can also be treated as high: J-Q-K-A.
  if (sorted.includes(1)) {
    const highRanks = sorted.map((rank) =>
      rank === 1 ? 14 : rank
    );

    highRanks.sort((a, b) => a - b);

    return highRanks.every(
      (rank, index) =>
        index === 0 || rank === highRanks[index - 1] + 1
    );
  }

  return false;
}

/* =========================================================
   IMPURE SEQUENCE
   Same suit, consecutive ranks, jokers may fill gaps.
   ========================================================= */

export function isImpureSequence(cards, wildRank = null) {
  if (!validateCardArray(cards)) return false;

  const naturalCards = getNaturalCards(cards, wildRank);
  const jokerCount = cards.length - naturalCards.length;

  if (jokerCount === 0) {
    return isPureSequence(cards);
  }

  if (naturalCards.length < 2) return false;

  const suit = getSuit(naturalCards[0]);

  if (!SUITS.includes(suit)) return false;

  if (!naturalCards.every((card) => getSuit(card) === suit)) {
    return false;
  }

  const ranks = naturalCards.map(getRankValue);

  if (ranks.some((rank) => rank === null)) return false;

  if (new Set(ranks).size !== ranks.length) return false;

  if (canCompleteSequence(ranks, jokerCount, false)) {
    return true;
  }

  // Also test Ace as a high card.
  return canCompleteSequence(ranks, jokerCount, true);
}

function canCompleteSequence(ranks, jokerCount, aceHigh) {
  const values = ranks.map((rank) =>
    aceHigh && rank === 1 ? 14 : rank
  );

  values.sort((a, b) => a - b);

  const minimum = values[0];
  const maximum = values[values.length - 1];

  const span = maximum - minimum + 1;
  const missingInside = span - values.length;

  if (missingInside > jokerCount) return false;

  const remainingJokers = jokerCount - missingInside;

  // Extend the sequence with remaining jokers.
  const possibleLengths = [
    values.length + jokerCount
  ];

  for (const length of possibleLengths) {
    const availableStarts = [];

    for (
      let start = Math.max(1, maximum - length + 1);
      start <= Math.min(minimum, 14 - length + 1);
      start++
    ) {
      availableStarts.push(start);
    }

    for (const start of availableStarts) {
      const end = start + length - 1;

      if (minimum < start || maximum > end) continue;

      const slots = new Set();

      values.forEach((value) => slots.add(value));

      let missing = 0;

      for (let rank = start; rank <= end; rank++) {
        if (!slots.has(rank)) missing++;
      }

      if (missing === jokerCount) return true;
    }
  }

  return remainingJokers >= 0 && missingInside <= jokerCount;
}

/* =========================================================
   SET
   Same rank, different suits, jokers can fill missing cards.
   ========================================================= */

export function isValidSet(cards, wildRank = null) {
  if (!validateCardArray(cards)) return false;

  const naturalCards = getNaturalCards(cards, wildRank);
  const jokerCount = cards.length - naturalCards.length;

  if (naturalCards.length < 2) return false;

  const ranks = naturalCards.map(getRankValue);

  if (ranks.some((rank) => rank === null)) return false;

  if (!ranks.every((rank) => rank === ranks[0])) {
    return false;
  }

  const suits = naturalCards.map(getSuit);

  if (suits.some((suit) => !SUITS.includes(suit))) {
    return false;
  }

  if (new Set(suits).size !== suits.length) {
    return false;
  }

  return naturalCards.length + jokerCount === cards.length &&
    cards.length <= 4;
}

/* =========================================================
   GENERAL MELD VALIDATION
   ========================================================= */

export function validateMeld(cards, wildRank = null) {
  if (!validateCardArray(cards)) {
    return {
      valid: false,
      type: MELD_TYPES.INVALID,
      reason: "Invalid card group."
    };
  }

  if (isPureSequence(cards)) {
    return {
      valid: true,
      type: MELD_TYPES.PURE_SEQUENCE,
      reason: "Valid pure sequence."
    };
  }

  if (isImpureSequence(cards, wildRank)) {
    return {
      valid: true,
      type: MELD_TYPES.IMPURE_SEQUENCE,
      reason: "Valid impure sequence."
    };
  }

  if (isValidSet(cards, wildRank)) {
    return {
      valid: true,
      type: MELD_TYPES.SET,
      reason: "Valid set."
    };
  }

  return {
    valid: false,
    type: MELD_TYPES.INVALID,
    reason: "Cards do not form a valid meld."
  };
}

/* =========================================================
   GROUP VALIDATION
   ========================================================= */

export function validateMeldGroups(groups, wildRank = null) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return {
      valid: false,
      results: [],
      reason: "No card groups provided."
    };
  }

  const results = groups.map((group) =>
    validateMeld(group, wildRank)
  );

  const valid = results.every((result) => result.valid);

  return {
    valid,
    results,
    reason: valid
      ? "All groups are valid."
      : "One or more groups are invalid."
  };
}

/* =========================================================
   REQUIRED DECLARATION CHECK
   At least two sequences, including one pure sequence.
   ========================================================= */

export function checkDeclarationGroups(groups, wildRank = null) {
  const validation = validateMeldGroups(groups, wildRank);

  if (!validation.valid) {
    return {
      valid: false,
      hasPureSequence: false,
      sequenceCount: 0,
      reason: "Some groups are invalid."
    };
  }

  const types = validation.results.map((item) => item.type);

  const hasPureSequence = types.includes(
    MELD_TYPES.PURE_SEQUENCE
  );

  const sequenceCount = types.filter((type) =>
    type === MELD_TYPES.PURE_SEQUENCE ||
    type === MELD_TYPES.IMPURE_SEQUENCE
  ).length;

  return {
    valid: hasPureSequence && sequenceCount >= 2,
    hasPureSequence,
    sequenceCount,
    reason:
      hasPureSequence && sequenceCount >= 2
        ? "Minimum declaration sequence requirements met."
        : "A declaration needs at least two sequences, including one pure sequence."
  };
}

/* =========================================================
   FILE END: js/rules/meld-validator.js
   ========================================================= */
      
