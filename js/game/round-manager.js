
/* =========================================================
   SUPER RUMMY — ROUND MANAGER
   File: js/game/round-manager.js
   Purpose: Manage complete round lifecycle and results
   ========================================================= */

export const ROUND_STATUS = Object.freeze({
  WAITING: "waiting",
  ACTIVE: "active",
  DECLARED: "declared",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
});

export class RoundManager {
  constructor(options = {}) {
    this.options = {
      onRoundStart: null,
      onWinner: null,
      onRoundComplete: null,
      onRoundCancel: null,
      onStatusChange: null,
      ...options
    };

    this.roundNumber = 0;
    this.completedRounds = [];
    this.currentRound = null;
  }

  createRound({
    gameId = null,
    mode = "practice",
    playerIds = [],
    wildRank = null,
    metadata = {}
  } = {}) {
    if (this.currentRound &&
        this.currentRound.status === ROUND_STATUS.ACTIVE) {
      throw new Error("An active round already exists.");
    }

    if (!Array.isArray(playerIds) ||
        playerIds.length < 2 ||
        playerIds.length > 4) {
      throw new Error("A round requires 2 to 4 players.");
    }

    const uniqueIds = [...new Set(playerIds)];

    if (uniqueIds.length !== playerIds.length ||
        uniqueIds.some(id => !id)) {
      throw new Error("Player IDs must be unique and valid.");
    }

    this.roundNumber += 1;

    const round = {
      id: this.createRoundId(),
      gameId,
      roundNumber: this.roundNumber,
      mode,
      status: ROUND_STATUS.WAITING,
      playerIds: [...uniqueIds],
      wildRank,
      winnerId: null,
      declaredAt: null,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      results: [],
      metadata: structuredCloneSafe(metadata)
    };

    this.currentRound = round;
    return this.getCurrentRound();
  }

  startRound() {
    const round = this.requireCurrentRound();

    if (round.status !== ROUND_STATUS.WAITING) {
      throw new Error("Only a waiting round can be started.");
    }

    round.status = ROUND_STATUS.ACTIVE;
    round.startedAt = Date.now();

    this.emit("onRoundStart", this.getCurrentRound());
    this.emitStatus();

    return this.getCurrentRound();
  }

  declareWinner(playerId, declarationData = {}) {
    const round = this.requireActiveRound();

    if (!round.playerIds.includes(playerId)) {
      throw new Error("Winner is not part of this round.");
    }

    round.status = ROUND_STATUS.DECLARED;
    round.winnerId = playerId;
    round.declaredAt = Date.now();

    round.declarationData = structuredCloneSafe(
      declarationData
    );

    this.emit("onWinner", {
      round: this.getCurrentRound(),
      winnerId: playerId
    });

    this.emitStatus();

    return this.getCurrentRound();
  }

  completeRound(results = []) {
    const round = this.requireCurrentRound();

    if (
      round.status !== ROUND_STATUS.DECLARED &&
      round.status !== ROUND_STATUS.ACTIVE
    ) {
      throw new Error("This round cannot be completed.");
    }

    if (!Array.isArray(results)) {
      throw new Error("Round results must be an array.");
    }

    const resultPlayerIds = results.map(item => item.playerId);

    if (new Set(resultPlayerIds).size !== resultPlayerIds.length) {
      throw new Error("Duplicate player results are not allowed.");
    }

    for (const result of results) {
      if (!round.playerIds.includes(result.playerId)) {
        throw new Error("Result contains an unknown player.");
      }

      if (
        typeof result.score !== "number" ||
        !Number.isFinite(result.score)
      ) {
        throw new Error("Every result needs a valid numeric score.");
      }
    }

    round.results = results.map(result => ({
      playerId: result.playerId,
      score: result.score,
      points: Number.isFinite(result.points)
        ? result.points
        : 0,
      position: Number.isInteger(result.position)
        ? result.position
        : null,
      details: structuredCloneSafe(result.details || {})
    }));

    round.status = ROUND_STATUS.COMPLETED;
    round.completedAt = Date.now();

    const snapshot = this.getCurrentRound();
    this.completedRounds.push(snapshot);

    this.emit("onRoundComplete", snapshot);
    this.emitStatus();

    return snapshot;
  }

  cancelRound(reason = "Round cancelled") {
    const round = this.requireCurrentRound();

    if (
      round.status === ROUND_STATUS.COMPLETED ||
      round.status === ROUND_STATUS.CANCELLED
    ) {
      throw new Error("This round is already closed.");
    }

    round.status = ROUND_STATUS.CANCELLED;
    round.cancelledAt = Date.now();
    round.cancelReason = String(reason);

    const snapshot = this.getCurrentRound();

    this.emit("onRoundCancel", snapshot);
    this.emitStatus();

    return snapshot;
  }

  setWildRank(rank) {
    const round = this.requireActiveRound();

    if (rank === null || rank === undefined) {
      throw new Error("Wild rank cannot be empty.");
    }

    round.wildRank = rank;
    return this.getCurrentRound();
  }

  isPlayerInRound(playerId) {
    return Boolean(
      this.currentRound &&
      this.currentRound.playerIds.includes(playerId)
    );
  }

  getWinner() {
    if (!this.currentRound) return null;

    return this.currentRound.winnerId;
  }

  getStatus() {
    return this.currentRound
      ? this.currentRound.status
      : ROUND_STATUS.WAITING;
  }

  getCurrentRound() {
    return this.currentRound
      ? structuredCloneSafe(this.currentRound)
      : null;
  }

  getCompletedRounds() {
    return structuredCloneSafe(this.completedRounds);
  }

  getRoundHistory() {
    return this.completedRounds.map(round => ({
      id: round.id,
      roundNumber: round.roundNumber,
      mode: round.mode,
      winnerId: round.winnerId,
      completedAt: round.completedAt,
      results: structuredCloneSafe(round.results)
    }));
  }

  getRoundDuration() {
    const round = this.currentRound;

    if (!round || !round.startedAt) return 0;

    const endTime =
      round.completedAt ||
      round.cancelledAt ||
      Date.now();

    return Math.max(0, endTime - round.startedAt);
  }

  resetCurrentRound() {
    if (
      this.currentRound &&
      this.currentRound.status === ROUND_STATUS.ACTIVE
    ) {
      throw new Error(
        "Complete or cancel the active round before resetting."
      );
    }

    this.currentRound = null;
    return true;
  }

  requireCurrentRound() {
    if (!this.currentRound) {
      throw new Error("No round has been created.");
    }

    return this.currentRound;
  }

  requireActiveRound() {
    const round = this.requireCurrentRound();

    if (round.status !== ROUND_STATUS.ACTIVE) {
      throw new Error("There is no active round.");
    }

    return round;
  }

  createRoundId() {
    return `SR-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  emit(callbackName, payload) {
    const callback = this.options[callbackName];

    if (typeof callback === "function") {
      callback(payload);
    }
  }

  emitStatus() {
    this.emit("onStatusChange", {
      status: this.getStatus(),
      round: this.getCurrentRound()
    });
  }
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function createRoundManager(options = {}) {
  return new RoundManager(options);
}

/* ================= FILE ENDING ================= */
