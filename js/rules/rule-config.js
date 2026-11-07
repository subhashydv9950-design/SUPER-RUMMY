
/* =========================================================
   SUPER RUMMY — RULE CONFIGURATION
   File: js/rules/rule-config.js
   Purpose: Central configuration for all Rummy variants
   ========================================================= */

export const RUMMY_MODES = Object.freeze({
  PRACTICE: "practice",
  POINTS: "points",
  POOL_101: "pool101",
  POOL_201: "pool201",
  DEALS: "deals",
  PRIVATE: "private"
});

export const DEFAULT_RULES = Object.freeze({
  cardsPerPlayer: 13,
  minimumPlayers: 2,
  maximumPlayers: 4,

  minimumSequences: 2,
  minimumPureSequences: 1,

  allowPrintedJokers: true,
  allowWildJokers: true,
  allowAceLowSequence: true,
  allowAceHighSequence: true,

  maximumSetSize: 4,
  maximumPenalty: 80,

  firstDropPoints: 20,
  middleDropPoints: 40,
  invalidDeclarationPoints: 80,

  faceCardPoints: 10,
  acePoints: 10,

  turnDurationSeconds: 30,
  allowRejoin: true
});

export const RUMMY_VARIANTS = Object.freeze({
  [RUMMY_MODES.PRACTICE]: {
    id: RUMMY_MODES.PRACTICE,
    name: "Practice Rummy",
    description: "Practice against computer opponents.",
    scoringType: "practice",
    playerCount: [2, 4],
    deckPacks: {
      2: 1,
      3: 2,
      4: 2
    },
    targetScore: null,
    dealsCount: null,
    entryPoints: 0,
    ...DEFAULT_RULES
  },

  [RUMMY_MODES.POINTS]: {
    id: RUMMY_MODES.POINTS,
    name: "Points Rummy",
    description: "Single-round points-based Rummy.",
    scoringType: "points",
    playerCount: [2, 4],
    deckPacks: {
      2: 1,
      3: 2,
      4: 2
    },
    targetScore: null,
    dealsCount: 1,
    entryPoints: 0,
    ...DEFAULT_RULES
  },

  [RUMMY_MODES.POOL_101]: {
    id: RUMMY_MODES.POOL_101,
    name: "Pool Rummy 101",
    description: "Players compete until the pool limit.",
    scoringType: "pool",
    playerCount: [2, 4],
    deckPacks: {
      2: 1,
      3: 2,
      4: 2
    },
    targetScore: 101,
    dealsCount: null,
    entryPoints: 0,
    ...DEFAULT_RULES
  },

  [RUMMY_MODES.POOL_201]: {
    id: RUMMY_MODES.POOL_201,
    name: "Pool Rummy 201",
    description: "Longer pool format with a 201-point limit.",
    scoringType: "pool",
    playerCount: [2, 4],
    deckPacks: {
      2: 1,
      3: 2,
      4: 2
    },
    targetScore: 201,
    dealsCount: null,
    entryPoints: 0,
    ...DEFAULT_RULES
  },

  [RUMMY_MODES.DEALS]: {
    id: RUMMY_MODES.DEALS,
    name: "Deals Rummy",
    description: "A fixed number of deals.",
    scoringType: "deals",
    playerCount: [2, 4],
    deckPacks: {
      2: 1,
      3: 2,
      4: 2
    },
    targetScore: null,
    dealsCount: 6,
    entryPoints: 0,
    ...DEFAULT_RULES
  },

  [RUMMY_MODES.PRIVATE]: {
    id: RUMMY_MODES.PRIVATE,
    name: "Private Table",
    description: "Play with invited friends.",
    scoringType: "points",
    playerCount: [2, 4],
    deckPacks: {
      2: 1,
      3: 2,
      4: 2
    },
    targetScore: null,
    dealsCount: 1,
    entryPoints: 0,
    ...DEFAULT_RULES
  }
});

export function getRuleConfig(mode, overrides = {}) {
  const base = RUMMY_VARIANTS[mode];

  if (!base) {
    throw new Error(`Unsupported Rummy mode: ${mode}`);
  }

  const config = {
    ...base,
    ...overrides,
    deckPacks: {
      ...base.deckPacks,
      ...(overrides.deckPacks || {})
    }
  };

  validateRuleConfig(config);

  return Object.freeze(config);
}

export function validateRuleConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid rules configuration.");
  }

  const positiveFields = [
    "cardsPerPlayer",
    "minimumPlayers",
    "maximumPlayers",
    "minimumSequences",
    "minimumPureSequences",
    "maximumSetSize",
    "maximumPenalty",
    "turnDurationSeconds"
  ];

  for (const field of positiveFields) {
    if (
      !Number.isInteger(config[field]) ||
      config[field] <= 0
    ) {
      throw new Error(`Invalid rule value: ${field}`);
    }
  }

  if (config.minimumPlayers > config.maximumPlayers) {
    throw new Error("Invalid player count limits.");
  }

  if (config.cardsPerPlayer !== 13) {
    throw new Error("SUPER RUMMY requires 13 cards.");
  }

  if (config.minimumPureSequences > config.minimumSequences) {
    throw new Error("Pure sequence requirement is invalid.");
  }

  if (!Array.isArray(config.playerCount) ||
      config.playerCount.length !== 2) {
    throw new Error("Invalid player count configuration.");
  }

  const [minPlayers, maxPlayers] = config.playerCount;

  if (
    minPlayers < config.minimumPlayers ||
    maxPlayers > config.maximumPlayers ||
    minPlayers > maxPlayers
  ) {
    throw new Error("Player count range is invalid.");
  }

  if (
    config.targetScore !== null &&
    config.targetScore !== undefined &&
    (!Number.isInteger(config.targetScore) ||
      config.targetScore <= 0)
  ) {
    throw new Error("Target score must be a positive integer.");
  }

  if (
    config.dealsCount !== null &&
    config.dealsCount !== undefined &&
    (!Number.isInteger(config.dealsCount) ||
      config.dealsCount <= 0)
  ) {
    throw new Error("Deals count must be a positive integer.");
  }

  for (const count of [2, 3, 4]) {
    const packs = config.deckPacks?.[count];

    if (!Number.isInteger(packs) || packs < 1) {
      throw new Error(`Invalid deck pack count for ${count} players.`);
    }
  }

  return true;
}

export function getDeckPackCount(mode, playerCount) {
  const config = getRuleConfig(mode);

  if (!config.playerCount.includes(playerCount)) {
    throw new Error("Player count is not supported by this mode.");
  }

  return config.deckPacks[playerCount];
}

export function getSupportedModes() {
  return Object.values(RUMMY_VARIANTS).map(mode => ({
    id: mode.id,
    name: mode.name,
    description: mode.description,
    scoringType: mode.scoringType,
    playerCount: [...mode.playerCount]
  }));
}

/* ================= FILE ENDING ================= */
