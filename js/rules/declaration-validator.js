
/* =========================================================
   SUPER RUMMY — DECLARATION VALIDATOR
   FILE: js/rules/declaration-validator.js
   VERSION: 1.0
   ========================================================= */

import {
  MELD_TYPES,
  validateMeld,
  checkDeclarationGroups
} from "./meld-validator.js";

export const DECLARATION_STATUS = Object.freeze({
  VALID: "valid",
  INVALID: "invalid"
});

export const DECLARATION_ERRORS = Object.freeze({
  INVALID_HAND: "INVALID_HAND",
  INVALID_GROUPS: "INVALID_GROUPS",
  MISSING_CARDS: "MISSING_CARDS",
  DUPLICATE_CARDS: "DUPLICATE_CARDS",
  EXTRA_CARDS: "EXTRA_CARDS",
  NO_PURE_SEQUENCE: "NO_PURE_SEQUENCE",
  INSUFFICIENT_SEQUENCES: "INSUFFICIENT_SEQUENCES",
  INVALID_MELD: "INVALID_MELD"
});

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function getCardId(card) {
  if (!card || card.id === undefined || card.id === null) {
    return null;
  }

  return String(card.id);
}

function getAllGroupCards(groups) {
  return groups.flat();
}

function createError(code, message, details = {}) {
  return {
    code,
    message,
    ...details
  };
}

/* =========================================================
   CHECK ORIGINAL HAND
   ========================================================= */

function validateOriginalHand(hand) {
  if (!Array.isArray(hand)) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.INVALID_HAND,
        "Player hand must be an array."
      )
    };
  }

  if (hand.length !== 13) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.INVALID_HAND,
        "A standard Indian Rummy hand must contain exactly 13 cards.",
        { actualCount: hand.length }
      )
    };
  }

  const ids = hand.map(getCardId);

  if (ids.some((id) => id === null)) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.INVALID_HAND,
        "Every card must have a valid ID."
      )
    };
  }

  if (new Set(ids).size !== ids.length) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.DUPLICATE_CARDS,
        "The original hand contains duplicate card IDs."
      )
    };
  }

  return { valid: true, error: null };
}

/* =========================================================
   CHECK GROUP STRUCTURE
   ========================================================= */

function validateGroupsStructure(groups) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.INVALID_GROUPS,
        "At least one card group is required."
      )
    };
  }

  for (let index = 0; index < groups.length; index++) {
    const group = groups[index];

    if (!Array.isArray(group) || group.length < 3) {
      return {
        valid: false,
        error: createError(
          DECLARATION_ERRORS.INVALID_GROUPS,
          `Group ${index + 1} must contain at least 3 cards.`,
          { groupIndex: index }
        )
      };
    }
  }

  return { valid: true, error: null };
}

/* =========================================================
   CHECK EVERY CARD IS USED EXACTLY ONCE
   ========================================================= */

function validateCardDistribution(hand, groups) {
  const handIds = new Set(hand.map(getCardId));
  const groupedCards = getAllGroupCards(groups);

  const groupedIds = groupedCards.map(getCardId);

  if (groupedIds.some((id) => id === null)) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.INVALID_GROUPS,
        "A grouped card has no valid ID."
      )
    };
  }

  const uniqueGroupedIds = new Set(groupedIds);

  if (uniqueGroupedIds.size !== groupedIds.length) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.DUPLICATE_CARDS,
        "A card has been used in more than one group."
      )
    };
  }

  const extraCards = groupedIds.filter(
    (id) => !handIds.has(id)
  );

  if (extraCards.length > 0) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.EXTRA_CARDS,
        "Groups contain cards that are not in the player's hand.",
        { extraCardIds: extraCards }
      )
    };
  }

  const missingCards = [...handIds].filter(
    (id) => !uniqueGroupedIds.has(id)
  );

  if (missingCards.length > 0) {
    return {
      valid: false,
      error: createError(
        DECLARATION_ERRORS.MISSING_CARDS,
        "Every card in the hand must be included in a group.",
        { missingCardIds: missingCards }
      )
    };
  }

  return {
    valid: true,
    error: null,
    groupedCardCount: groupedIds.length
  };
}

/* =========================================================
   VALIDATE ALL MELDS
   ========================================================= */

function validateAllMelds(groups, wildRank) {
  const results = groups.map((group, index) => {
    const result = validateMeld(group, wildRank);

    return {
      groupIndex: index,
      groupNumber: index + 1,
      cardIds: group.map(getCardId),
      ...result
    };
  });

  const invalidGroups = results.filter(
    (result) => !result.valid
  );

  return {
    valid: invalidGroups.length === 0,
    results,
    invalidGroups
  };
}

/* =========================================================
   COMPLETE DECLARATION VALIDATION
   ========================================================= */

export function validateDeclaration({
  hand,
  groups,
  wildRank = null
} = {}) {
  const handCheck = validateOriginalHand(hand);

  if (!handCheck.valid) {
    return {
      status: DECLARATION_STATUS.INVALID,
      valid: false,
      errors: [handCheck.error],
      groupResults: []
    };
  }

  const structureCheck = validateGroupsStructure(groups);

  if (!structureCheck.valid) {
    return {
      status: DECLARATION_STATUS.INVALID,
      valid: false,
      errors: [structureCheck.error],
      groupResults: []
    };
  }

  const distributionCheck = validateCardDistribution(
    hand,
    groups
  );

  if (!distributionCheck.valid) {
    return {
      status: DECLARATION_STATUS.INVALID,
      valid: false,
      errors: [distributionCheck.error],
      groupResults: []
    };
  }

  const meldCheck = validateAllMelds(groups, wildRank);

  if (!meldCheck.valid) {
    return {
      status: DECLARATION_STATUS.INVALID,
      valid: false,
      errors: meldCheck.invalidGroups.map((group) =>
        createError(
          DECLARATION_ERRORS.INVALID_MELD,
          `Group ${group.groupNumber}: ${group.reason}`,
          { groupIndex: group.groupIndex }
        )
      ),
      groupResults: meldCheck.results
    };
  }

  const sequenceCheck = checkDeclarationGroups(
    groups,
    wildRank
  );

  const errors = [];

  const hasPureSequence = meldCheck.results.some(
    (result) => result.type === MELD_TYPES.PURE_SEQUENCE
  );

  const sequenceCount = meldCheck.results.filter(
    (result) =>
      result.type === MELD_TYPES.PURE_SEQUENCE ||
      result.type === MELD_TYPES.IMPURE_SEQUENCE
  ).length;

  if (!hasPureSequence) {
    errors.push(
      createError(
        DECLARATION_ERRORS.NO_PURE_SEQUENCE,
        "At least one pure sequence is required."
      )
    );
  }

  if (sequenceCount < 2) {
    errors.push(
      createError(
        DECLARATION_ERRORS.INSUFFICIENT_SEQUENCES,
        "At least two sequences are required."
      )
    );
  }

  const valid = errors.length === 0 && sequenceCheck.valid;

  return {
    status: valid
      ? DECLARATION_STATUS.VALID
      : DECLARATION_STATUS.INVALID,

    valid,

    errors,

    summary: {
      totalCards: hand.length,
      groupedCards: distributionCheck.groupedCardCount,
      totalGroups: groups.length,
      pureSequences: meldCheck.results.filter(
        (item) => item.type === MELD_TYPES.PURE_SEQUENCE
      ).length,
      impureSequences: meldCheck.results.filter(
        (item) => item.type === MELD_TYPES.IMPURE_SEQUENCE
      ).length,
      sets: meldCheck.results.filter(
        (item) => item.type === MELD_TYPES.SET
      ).length,
      sequenceCount
    },

    groupResults: meldCheck.results,

    message: valid
      ? "Declaration is valid."
      : "Declaration is invalid."
  };
}

/* =========================================================
   SIMPLE VALIDATION HELPER
   ========================================================= */

export function isValidDeclaration(data) {
  return validateDeclaration(data).valid;
}

/* =========================================================
   FILE END: js/rules/declaration-validator.js
   ========================================================= */
        
