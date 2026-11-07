
/* =========================================================
   SUPER RUMMY — ROUND RESULT MANAGER
   File: js/game/round-result-manager.js
   Purpose: Round results, rankings and score records.
   ========================================================= */

export const RESULT_STATUS = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
});

export const RESULT_ERRORS = Object.freeze({
  INVALID_PLAYERS: "INVALID_PLAYERS",
  INVALID_WINNER: "INVALID_WINNER",
  INVALID_SCORE: "INVALID_SCORE",
  ROUND_ALREADY_COMPLETED: "ROUND_ALREADY_COMPLETED",
  INVALID_RESULT: "INVALID_RESULT"
});

function makeResult(valid, errors = [], data = {}) {
  return { valid, errors, data };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidPlayer(player) {
  return (
    player &&
    typeof player.id === "string" &&
    player.id.length > 0
  );
}

function normalizeScore(score) {
  const value = Number(score);

  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.floor(value);
}

/* ---------------------------------------------------------
   ROUND RESULT MANAGER
   --------------------------------------------------------- */

export class RoundResultManager {
  constructor(options = {}) {
    this.calculateScore =
      typeof options.calculateScore === "function"
        ? options.calculateScore
        : null;

    this.history = [];
    this.currentResult = null;
    this.status = RESULT_STATUS.PENDING;
    this.roundNumber = 0;
  }

  /* Start a new result session */

  startRound(roundNumber = this.roundNumber + 1) {
    if (
      !Number.isInteger(roundNumber) ||
      roundNumber < 1
    ) {
      throw new Error("Invalid round number.");
    }

    this.roundNumber = roundNumber;
    this.currentResult = null;
    this.status = RESULT_STATUS.PENDING;

    return {
      roundNumber: this.roundNumber,
      status: this.status
    };
  }

  /* Validate result input */

  validate(players, winnerId) {
    const errors = [];

    if (!Array.isArray(players) || players.length < 2) {
      errors.push(RESULT_ERRORS.INVALID_PLAYERS);
    }

    if (Array.isArray(players)) {
      const ids = new Set();

      for (const player of players) {
        if (!isValidPlayer(player)) {
          errors.push(RESULT_ERRORS.INVALID_PLAYERS);
          continue;
        }

        if (ids.has(player.id)) {
          errors.push(RESULT_ERRORS.INVALID_PLAYERS);
        }

        ids.add(player.id);
      }

      if (!ids.has(winnerId)) {
        errors.push(RESULT_ERRORS.INVALID_WINNER);
      }
    }

    return makeResult(errors.length === 0, errors);
  }

  /* Calculate individual player score */

  getPlayerScore(player, winnerId, context = {}) {
    if (this.calculateScore) {
      const calculated = this.calculateScore(
        player,
        winnerId,
        context
      );

      return normalizeScore(calculated);
    }

    return normalizeScore(player.penaltyPoints ?? 0);
  }

  /* Complete a round */

  completeRound(players, winnerId, context = {}) {
    if (this.status === RESULT_STATUS.COMPLETED) {
      throw new Error(RESULT_ERRORS.ROUND_ALREADY_COMPLETED);
    }

    const validation = this.validate(players, winnerId);

    if (!validation.valid) {
      const error = new Error("Invalid round result.");
      error.details = validation.errors;
      throw error;
    }

    const entries = [];

    for (const player of players) {
      const score = player.id === winnerId
        ? 0
        : this.getPlayerScore(player, winnerId, context);

      if (score === null) {
        throw new Error(RESULT_ERRORS.INVALID_SCORE);
      }

      entries.push({
        playerId: player.id,
        playerName: player.name || "Player",
        score,
        isWinner: player.id === winnerId,
        totalScore: normalizeScore(player.totalScore ?? 0)
      });
    }

    for (const entry of entries) {
      if (entry.totalScore === null) {
        throw new Error(RESULT_ERRORS.INVALID_SCORE);
      }

      entry.totalScore += entry.score;
    }

    entries.sort((a, b) => {
      if (a.isWinner !== b.isWinner) {
        return a.isWinner ? -1 : 1;
      }

      return a.totalScore - b.totalScore;
    });

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const result = {
      roundNumber: this.roundNumber,
      winnerId,
      status: RESULT_STATUS.COMPLETED,
      completedAt: Date.now(),
      players: entries
    };

    this.currentResult = clone(result);
    this.history.push(clone(result));
    this.status = RESULT_STATUS.COMPLETED;

    return clone(result);
  }

  /* Cancel current round */

  cancelRound(reason = "Round cancelled") {
    if (this.status === RESULT_STATUS.COMPLETED) {
      return false;
    }

    this.currentResult = {
      roundNumber: this.roundNumber,
      status: RESULT_STATUS.CANCELLED,
      reason: String(reason),
      cancelledAt: Date.now(),
      players: []
    };

    this.history.push(clone(this.currentResult));
    this.status = RESULT_STATUS.CANCELLED;

    return true;
  }

  /* Get current result */

  getCurrentResult() {
    return this.currentResult
      ? clone(this.currentResult)
      : null;
  }

  /* Get all recorded results */

  getHistory() {
    return clone(this.history);
  }

  /* Get a player's total accumulated score */

  getPlayerTotal(playerId) {
    let total = 0;

    for (const round of this.history) {
      if (round.status !== RESULT_STATUS.COMPLETED) {
        continue;
      }

      const player = round.players.find(
        entry => entry.playerId === playerId
      );

      if (player) {
        total += player.score;
      }
    }

    return total;
  }

  /* Get overall leaderboard */

  getLeaderboard() {
    const totals = new Map();

    for (const round of this.history) {
      if (round.status !== RESULT_STATUS.COMPLETED) {
        continue;
      }

      for (const entry of round.players) {
        const existing = totals.get(entry.playerId) || {
          playerId: entry.playerId,
          playerName: entry.playerName,
          totalScore: 0,
          roundsPlayed: 0,
          wins: 0
        };

        existing.totalScore += entry.score;
        existing.roundsPlayed += 1;

        if (entry.isWinner) {
          existing.wins += 1;
        }

        totals.set(entry.playerId, existing);
      }
    }

    return [...totals.values()]
      .sort((a, b) => {
        if (a.totalScore !== b.totalScore) {
          return a.totalScore - b.totalScore;
        }

        return b.wins - a.wins;
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
  }

  /* Export results */

  exportData() {
    return {
      version: 1,
      roundNumber: this.roundNumber,
      status: this.status,
      history: this.getHistory()
    };
  }

  /* Import saved results */

  importData(data) {
    if (
      !data ||
      data.version !== 1 ||
      !Array.isArray(data.history)
    ) {
      throw new Error(RESULT_ERRORS.INVALID_RESULT);
    }

    this.history = clone(data.history);
    this.roundNumber = Number.isInteger(data.roundNumber)
      ? data.roundNumber
      : 0;

    this.status = Object.values(RESULT_STATUS).includes(data.status)
      ? data.status
      : RESULT_STATUS.PENDING;

    this.currentResult = null;

    return true;
  }

  /* Reset all result data */

  reset() {
    this.history = [];
    this.currentResult = null;
    this.status = RESULT_STATUS.PENDING;
    this.roundNumber = 0;
  }
}

/* ---------------------------------------------------------
   FACTORY
   --------------------------------------------------------- */

export function createRoundResultManager(options = {}) {
  return new RoundResultManager(options);
}

/* ================= FILE ENDING ================= */
      
