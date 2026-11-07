
/* =========================================================
   SUPER RUMMY — DECLARATION MANAGER
   File: js/game/declaration-manager.js
   Purpose: Declaration handling and validation workflow.
   ========================================================= */

export const DECLARATION_STATUS = Object.freeze({
  IDLE: "idle",
  SUBMITTED: "submitted",
  VALID: "valid",
  INVALID: "invalid"
});

export const DECLARATION_ERRORS = Object.freeze({
  INVALID_PLAYER: "INVALID_PLAYER",
  INVALID_CARDS: "INVALID_CARDS",
  INVALID_GROUPS: "INVALID_GROUPS",
  INVALID_VALIDATOR: "INVALID_VALIDATOR",
  ALREADY_SUBMITTED: "ALREADY_SUBMITTED",
  DECLARATION_FAILED: "DECLARATION_FAILED"
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function createError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

/* ---------------------------------------------------------
   DECLARATION MANAGER
   --------------------------------------------------------- */

export class DeclarationManager {
  constructor(options = {}) {
    this.validateDeclaration =
      typeof options.validateDeclaration === "function"
        ? options.validateDeclaration
        : null;

    this.onResult =
      typeof options.onResult === "function"
        ? options.onResult
        : null;

    this.status = DECLARATION_STATUS.IDLE;
    this.attempts = [];
    this.currentDeclaration = null;
    this.roundId = null;
  }

  /* Start declaration session */

  startRound(roundId) {
    if (!isNonEmptyString(roundId)) {
      throw createError(
        DECLARATION_ERRORS.INVALID_PLAYER,
        "A valid round ID is required."
      );
    }

    this.roundId = roundId;
    this.status = DECLARATION_STATUS.IDLE;
    this.attempts = [];
    this.currentDeclaration = null;

    return {
      roundId,
      status: this.status
    };
  }

  /* Check basic submission structure */

  validateSubmission(submission) {
    const errors = [];

    if (!submission || typeof submission !== "object") {
      return {
        valid: false,
        errors: [DECLARATION_ERRORS.INVALID_GROUPS]
      };
    }

    if (!isNonEmptyString(submission.playerId)) {
      errors.push(DECLARATION_ERRORS.INVALID_PLAYER);
    }

    if (!Array.isArray(submission.cards)) {
      errors.push(DECLARATION_ERRORS.INVALID_CARDS);
    }

    if (!Array.isArray(submission.groups)) {
      errors.push(DECLARATION_ERRORS.INVALID_GROUPS);
    }

    if (
      Array.isArray(submission.cards) &&
      submission.cards.length !== 13
    ) {
      errors.push(DECLARATION_ERRORS.INVALID_CARDS);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /* Submit declaration */

  submit(submission) {
    if (this.status === DECLARATION_STATUS.SUBMITTED) {
      throw createError(
        DECLARATION_ERRORS.ALREADY_SUBMITTED,
        "A declaration is already being processed."
      );
    }

    const basicCheck = this.validateSubmission(submission);

    if (!basicCheck.valid) {
      return this.recordResult({
        valid: false,
        playerId: submission?.playerId || null,
        errors: basicCheck.errors,
        groups: []
      });
    }

    if (!this.validateDeclaration) {
      throw createError(
        DECLARATION_ERRORS.INVALID_VALIDATOR,
        "Declaration validator has not been connected."
      );
    }

    this.status = DECLARATION_STATUS.SUBMITTED;

    let validation;

    try {
      validation = this.validateDeclaration({
        playerId: submission.playerId,
        cards: clone(submission.cards),
        groups: clone(submission.groups),
        wildCard: submission.wildCard || null,
        wildRank: submission.wildRank || null
      });
    } catch (error) {
      this.status = DECLARATION_STATUS.IDLE;

      throw createError(
        DECLARATION_ERRORS.DECLARATION_FAILED,
        error.message
      );
    }

    if (
      !validation ||
      typeof validation.valid !== "boolean"
    ) {
      this.status = DECLARATION_STATUS.IDLE;

      throw createError(
        DECLARATION_ERRORS.INVALID_VALIDATOR,
        "Validator returned an invalid result."
      );
    }

    return this.recordResult({
      valid: validation.valid,
      playerId: submission.playerId,
      errors: Array.isArray(validation.errors)
        ? validation.errors
        : [],
      groups: submission.groups,
      validationDetails: validation.details || null
    });
  }

  /* Save result */

  recordResult(data) {
    const result = {
      id: `declaration_${Date.now()}_${this.attempts.length + 1}`,
      roundId: this.roundId,
      playerId: data.playerId,
      status: data.valid
        ? DECLARATION_STATUS.VALID
        : DECLARATION_STATUS.INVALID,
      valid: Boolean(data.valid),
      errors: clone(data.errors || []),
      groups: clone(data.groups || []),
      validationDetails: clone(data.validationDetails || null),
      submittedAt: Date.now()
    };

    this.attempts.push(result);
    this.currentDeclaration = clone(result);

    this.status = result.valid
      ? DECLARATION_STATUS.VALID
      : DECLARATION_STATUS.INVALID;

    if (this.onResult) {
      this.onResult(clone(result));
    }

    return clone(result);
  }

  /* Get current declaration */

  getCurrentDeclaration() {
    return this.currentDeclaration
      ? clone(this.currentDeclaration)
      : null;
  }

  /* Get all attempts */

  getAttempts(playerId = null) {
    const list = playerId
      ? this.attempts.filter(
          item => item.playerId === playerId
        )
      : this.attempts;

    return clone(list);
  }

  /* Check if a player has submitted */

  hasSubmitted(playerId) {
    return this.attempts.some(
      item => item.playerId === playerId
    );
  }

  /* Check if a valid declaration exists */

  hasValidDeclaration() {
    return this.attempts.some(item => item.valid);
  }

  /* Get valid declaration */

  getValidDeclaration() {
    const declaration = this.attempts.find(
      item => item.valid
    );

    return declaration ? clone(declaration) : null;
  }

  /* Reset manager */

  reset() {
    this.status = DECLARATION_STATUS.IDLE;
    this.attempts = [];
    this.currentDeclaration = null;
    this.roundId = null;
  }

  /* Export data */

  exportData() {
    return {
      version: 1,
      roundId: this.roundId,
      status: this.status,
      attempts: this.getAttempts()
    };
  }

  /* Import data */

  importData(data) {
    if (
      !data ||
      data.version !== 1 ||
      !Array.isArray(data.attempts)
    ) {
      throw createError(
        DECLARATION_ERRORS.INVALID_GROUPS,
        "Invalid declaration data."
      );
    }

    this.roundId = data.roundId || null;
    this.attempts = clone(data.attempts);
    this.status = Object.values(DECLARATION_STATUS).includes(
      data.status
    )
      ? data.status
      : DECLARATION_STATUS.IDLE;

    this.currentDeclaration =
      this.attempts.length > 0
        ? clone(this.attempts[this.attempts.length - 1])
        : null;

    return true;
  }
}

/* ---------------------------------------------------------
   FACTORY
   --------------------------------------------------------- */

export function createDeclarationManager(options = {}) {
  return new DeclarationManager(options);
}

/* ================= FILE ENDING ================= */
      
