
/* =========================================================
   SUPER RUMMY — GAME SETUP VALIDATOR
   File: js/game/game-setup-validator.js
   Purpose: Validate game setup before starting a round.
   ========================================================= */

export const SETUP_ERRORS = Object.freeze({
  INVALID_CONFIG: "INVALID_CONFIG",
  INVALID_PLAYER_COUNT: "INVALID_PLAYER_COUNT",
  DUPLICATE_PLAYER: "DUPLICATE_PLAYER",
  INVALID_PLAYER: "INVALID_PLAYER",
  INVALID_DECK: "INVALID_DECK",
  DUPLICATE_CARD: "DUPLICATE_CARD",
  INVALID_CARD: "INVALID_CARD",
  INVALID_HAND: "INVALID_HAND",
  INVALID_PILE: "INVALID_PILE",
  INVALID_WILD_CARD: "INVALID_WILD_CARD",
  INSUFFICIENT_CARDS: "INSUFFICIENT_CARDS"
});

export const SETUP_LIMITS = Object.freeze({
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  CARDS_PER_PLAYER: 13,
  STANDARD_DECK_SIZE: 52,
  JOKERS_PER_PACK: 2,
  CARDS_PER_PACK: 54
});

function result(valid, errors = [], details = {}) {
  return {
    valid,
    errors,
    details
  };
}

function isObject(value) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function getCardId(card) {
  return card && typeof card.id === "string"
    ? card.id
    : null;
}

function getCardList(player) {
  return Array.isArray(player?.cards)
    ? player.cards
    : [];
}

function getAllCards(setup) {
  const cards = [];

  for (const player of setup.players || []) {
    cards.push(...getCardList(player));
  }

  cards.push(...(setup.closedDeck || []));
  cards.push(...(setup.openDeck || []));

  return cards;
}

/* ---------------------------------------------------------
   PLAYER VALIDATION
   --------------------------------------------------------- */

export function validateSetupPlayers(players) {
  const errors = [];

  if (!Array.isArray(players)) {
    return result(false, [
      SETUP_ERRORS.INVALID_PLAYER_COUNT
    ]);
  }

  if (
    players.length < SETUP_LIMITS.MIN_PLAYERS ||
    players.length > SETUP_LIMITS.MAX_PLAYERS
  ) {
    errors.push(SETUP_ERRORS.INVALID_PLAYER_COUNT);
  }

  const playerIds = new Set();

  for (const player of players) {
    if (!isObject(player) || !player.id) {
      errors.push(SETUP_ERRORS.INVALID_PLAYER);
      continue;
    }

    if (playerIds.has(player.id)) {
      errors.push(SETUP_ERRORS.DUPLICATE_PLAYER);
    }

    playerIds.add(player.id);

    if (!Array.isArray(player.cards)) {
      errors.push(SETUP_ERRORS.INVALID_HAND);
    }
  }

  return result(errors.length === 0, errors, {
    playerCount: players.length,
    uniquePlayers: playerIds.size
  });
}

/* ---------------------------------------------------------
   DECK SIZE
   --------------------------------------------------------- */

export function getExpectedDeckSize(playerCount) {
  if (
    !Number.isInteger(playerCount) ||
    playerCount < 2 ||
    playerCount > 4
  ) {
    return 0;
  }

  const packs = playerCount === 2 ? 1 : 2;

  return packs * SETUP_LIMITS.CARDS_PER_PACK;
}

/* ---------------------------------------------------------
   CARD VALIDATION
   --------------------------------------------------------- */

export function validateSetupCards(cards) {
  const errors = [];
  const ids = new Set();

  if (!Array.isArray(cards)) {
    return result(false, [
      SETUP_ERRORS.INVALID_DECK
    ]);
  }

  for (const card of cards) {
    if (!isObject(card)) {
      errors.push(SETUP_ERRORS.INVALID_CARD);
      continue;
    }

    const id = getCardId(card);

    if (!id) {
      errors.push(SETUP_ERRORS.INVALID_CARD);
      continue;
    }

    if (ids.has(id)) {
      errors.push(SETUP_ERRORS.DUPLICATE_CARD);
    }

    ids.add(id);

    if (
      typeof card.suit !== "string" ||
      typeof card.rank !== "string"
    ) {
      if (card.type !== "joker") {
        errors.push(SETUP_ERRORS.INVALID_CARD);
      }
    }
  }

  return result(errors.length === 0, errors, {
    totalCards: cards.length,
    uniqueCards: ids.size
  });
}

/* ---------------------------------------------------------
   PLAYER HAND VALIDATION
   --------------------------------------------------------- */

export function validateStartingHands(players) {
  const errors = [];

  if (!Array.isArray(players)) {
    return result(false, [
      SETUP_ERRORS.INVALID_PLAYER_COUNT
    ]);
  }

  for (const player of players) {
    const cards = getCardList(player);

    if (
      cards.length !== SETUP_LIMITS.CARDS_PER_PLAYER
    ) {
      errors.push({
        code: SETUP_ERRORS.INVALID_HAND,
        playerId: player?.id || null,
        expected: SETUP_LIMITS.CARDS_PER_PLAYER,
        actual: cards.length
      });
    }
  }

  return result(errors.length === 0, errors);
}

/* ---------------------------------------------------------
   PILE VALIDATION
   --------------------------------------------------------- */

export function validateSetupPiles(closedDeck, openDeck) {
  const errors = [];

  if (!Array.isArray(closedDeck)) {
    errors.push(SETUP_ERRORS.INVALID_PILE);
  }

  if (!Array.isArray(openDeck)) {
    errors.push(SETUP_ERRORS.INVALID_PILE);
  }

  if (errors.length > 0) {
    return result(false, errors);
  }

  if (openDeck.length < 1) {
    errors.push(SETUP_ERRORS.INVALID_PILE);
  }

  return result(errors.length === 0, errors, {
    closedCards: closedDeck.length,
    openCards: openDeck.length
  });
}

/* ---------------------------------------------------------
   WILD CARD VALIDATION
   --------------------------------------------------------- */

export function validateWildCard(wildCard) {
  if (!isObject(wildCard)) {
    return result(false, [
      SETUP_ERRORS.INVALID_WILD_CARD
    ]);
  }

  if (
    typeof wildCard.rank !== "string" ||
    !wildCard.rank.length
  ) {
    return result(false, [
      SETUP_ERRORS.INVALID_WILD_CARD
    ]);
  }

  return result(true, [], {
    wildRank: wildCard.rank,
    wildSuit: wildCard.suit || null
  });
}

/* ---------------------------------------------------------
   COMPLETE GAME SETUP VALIDATION
   --------------------------------------------------------- */

export function validateGameSetup(setup) {
  const errors = [];

  if (!isObject(setup)) {
    return result(false, [
      SETUP_ERRORS.INVALID_CONFIG
    ]);
  }

  const playersCheck = validateSetupPlayers(setup.players);

  if (!playersCheck.valid) {
    errors.push(...playersCheck.errors);
  }

  const playerCount = Array.isArray(setup.players)
    ? setup.players.length
    : 0;

  const expectedDeckSize = getExpectedDeckSize(playerCount);

  const handCheck = validateStartingHands(
    setup.players || []
  );

  if (!handCheck.valid) {
    errors.push(...handCheck.errors);
  }

  const pileCheck = validateSetupPiles(
    setup.closedDeck,
    setup.openDeck
  );

  if (!pileCheck.valid) {
    errors.push(...pileCheck.errors);
  }

  const allCards = getAllCards(setup);
  const cardCheck = validateSetupCards(allCards);

  if (!cardCheck.valid) {
    errors.push(...cardCheck.errors);
  }

  if (allCards.length !== expectedDeckSize) {
    errors.push({
      code: SETUP_ERRORS.INSUFFICIENT_CARDS,
      expected: expectedDeckSize,
      actual: allCards.length
    });
  }

  const wildCheck = validateWildCard(setup.wildCard);

  if (!wildCheck.valid) {
    errors.push(...wildCheck.errors);
  }

  return result(errors.length === 0, errors, {
    playerCount,
    expectedDeckSize,
    actualDeckSize: allCards.length,
    cardsPerPlayer: SETUP_LIMITS.CARDS_PER_PLAYER,
    setupReady: errors.length === 0
  });
}

/* ---------------------------------------------------------
   ASSERTION
   --------------------------------------------------------- */

export function assertGameSetup(setup) {
  const validation = validateGameSetup(setup);

  if (!validation.valid) {
    const error = new Error(
      "SUPER RUMMY: Game setup validation failed."
    );

    error.name = "GameSetupError";
    error.code = SETUP_ERRORS.INVALID_CONFIG;
    error.details = validation.errors;

    throw error;
  }

  return true;
}

/* ---------------------------------------------------------
   QUICK SETUP SUMMARY
   --------------------------------------------------------- */

export function getSetupSummary(setup) {
  const validation = validateGameSetup(setup);

  return {
    ready: validation.valid,
    playerCount: validation.details.playerCount,
    totalCards: validation.details.actualDeckSize,
    expectedCards: validation.details.expectedDeckSize,
    cardsPerPlayer: SETUP_LIMITS.CARDS_PER_PLAYER,
    errors: validation.errors
  };
}

/* ================= FILE ENDING ================= */
