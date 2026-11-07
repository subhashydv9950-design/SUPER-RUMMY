
/* =========================================================
   SUPER RUMMY — PLAYER MANAGER
   FILE: js/game/player-manager.js
   VERSION: 1.0
   ========================================================= */

export const PLAYER_TYPES = Object.freeze({
  HUMAN: "human",
  AI: "ai"
});

export const PLAYER_STATUS = Object.freeze({
  WAITING: "waiting",
  ACTIVE: "active",
  DROPPED: "dropped",
  FINISHED: "finished",
  DISCONNECTED: "disconnected"
});

export class PlayerManager {
  constructor(options = {}) {
    this.maxPlayers = options.maxPlayers ?? 4;
    this.minPlayers = options.minPlayers ?? 2;
    this.onChange = options.onChange ?? (() => {});

    this.players = [];
    this.currentPlayerId = null;
  }

  /* VALIDATE PLAYER */

  validatePlayer(player) {
    if (!player || typeof player !== "object") {
      throw new Error("Invalid player data.");
    }

    if (
      player.id === undefined ||
      player.id === null ||
      String(player.id).trim() === ""
    ) {
      throw new Error("Player ID is required.");
    }

    if (
      !Object.values(PLAYER_TYPES).includes(
        player.type ?? PLAYER_TYPES.HUMAN
      )
    ) {
      throw new Error("Invalid player type.");
    }

    return true;
  }

  /* ADD PLAYER */

  addPlayer(data) {
    this.validatePlayer(data);

    if (this.players.length >= this.maxPlayers) {
      throw new Error("The table is full.");
    }

    const id = String(data.id);

    if (this.getPlayer(id)) {
      throw new Error("Player already exists.");
    }

    const player = {
      id,
      name: data.name ?? "Player",
      type: data.type ?? PLAYER_TYPES.HUMAN,
      avatar: data.avatar ?? null,
      status: data.status ?? PLAYER_STATUS.WAITING,
      seat: this.players.length,
      cards: [],
      totalPoints: 0,
      roundPoints: 0,
      roundsPlayed: 0,
      roundsWon: 0,
      connected: true,
      joinedAt: Date.now()
    };

    this.players.push(player);

    this.emit("player-added", player);

    return this.copyPlayer(player);
  }

  /* REMOVE PLAYER */

  removePlayer(playerId) {
    const index = this.players.findIndex(
      (player) => player.id === String(playerId)
    );

    if (index === -1) return null;

    const [removed] = this.players.splice(index, 1);

    this.players.forEach((player, seat) => {
      player.seat = seat;
    });

    if (this.currentPlayerId === removed.id) {
      this.currentPlayerId = null;
    }

    this.emit("player-removed", removed);

    return this.copyPlayer(removed);
  }

  /* GET PLAYER */

  getPlayer(playerId) {
    return this.players.find(
      (player) => player.id === String(playerId)
    ) ?? null;
  }

  getPlayers() {
    return this.players.map((player) =>
      this.copyPlayer(player)
    );
  }

  getPlayerCount() {
    return this.players.length;
  }

  getHumanPlayers() {
    return this.getPlayers().filter(
      (player) => player.type === PLAYER_TYPES.HUMAN
    );
  }

  getAIPlayers() {
    return this.getPlayers().filter(
      (player) => player.type === PLAYER_TYPES.AI
    );
  }

  /* SET CURRENT PLAYER */

  setCurrentPlayer(playerId) {
    const player = this.getPlayer(playerId);

    if (!player) {
      throw new Error("Player not found.");
    }

    this.currentPlayerId = player.id;

    this.emit("current-player-changed", player);

    return this.copyPlayer(player);
  }

  getCurrentPlayer() {
    return this.copyPlayer(
      this.getPlayer(this.currentPlayerId)
    );
  }

  /* PLAYER STATUS */

  setPlayerStatus(playerId, status) {
    if (!Object.values(PLAYER_STATUS).includes(status)) {
      throw new Error("Invalid player status.");
    }

    const player = this.getPlayer(playerId);

    if (!player) {
      throw new Error("Player not found.");
    }

    player.status = status;

    this.emit("player-status-changed", player);

    return this.copyPlayer(player);
  }

  setConnectionStatus(playerId, connected) {
    const player = this.getPlayer(playerId);

    if (!player) {
      throw new Error("Player not found.");
    }

    player.connected = Boolean(connected);

    if (!player.connected) {
      player.status = PLAYER_STATUS.DISCONNECTED;
    } else if (player.status === PLAYER_STATUS.DISCONNECTED) {
      player.status = PLAYER_STATUS.ACTIVE;
    }

    this.emit("connection-changed", player);

    return this.copyPlayer(player);
  }

  /* PLAYER CARDS */

  setPlayerCards(playerId, cards = []) {
    const player = this.getPlayer(playerId);

    if (!player) {
      throw new Error("Player not found.");
    }

    if (!Array.isArray(cards)) {
      throw new TypeError("Cards must be an array.");
    }

    player.cards = [...cards];

    this.emit("player-cards-updated", {
      playerId: player.id,
      cardCount: player.cards.length
    });

    return player.cards.length;
  }

  getPlayerCardCount(playerId) {
    const player = this.getPlayer(playerId);

    return player ? player.cards.length : 0;
  }

  /* ROUND SCORING */

  addRoundScore(playerId, points, won = false) {
    const player = this.getPlayer(playerId);

    if (!player) {
      throw new Error("Player not found.");
    }

    const score = Number(points);

    if (!Number.isFinite(score) || score < 0) {
      throw new Error("Invalid score.");
    }

    player.roundPoints = score;
    player.totalPoints += score;
    player.roundsPlayed += 1;

    if (won) {
      player.roundsWon += 1;
    }

    this.emit("player-score-updated", player);

    return {
      roundPoints: player.roundPoints,
      totalPoints: player.totalPoints,
      roundsWon: player.roundsWon
    };
  }

  resetRoundScores() {
    this.players.forEach((player) => {
      player.roundPoints = 0;
      player.cards = [];
    });

    this.emit("round-scores-reset");
  }

  resetAllScores() {
    this.players.forEach((player) => {
      player.totalPoints = 0;
      player.roundPoints = 0;
      player.roundsPlayed = 0;
      player.roundsWon = 0;
      player.cards = [];
    });

    this.emit("all-scores-reset");
  }

  /* TABLE VALIDATION */

  canStartGame() {
    return (
      this.players.length >= this.minPlayers &&
      this.players.length <= this.maxPlayers &&
      this.players.every((player) => player.connected)
    );
  }

  getLeaderboard() {
    return this.getPlayers().sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) {
        return a.totalPoints - b.totalPoints;
      }

      return b.roundsWon - a.roundsWon;
    });
  }

  /* INTERNAL HELPERS */

  copyPlayer(player) {
    if (!player) return null;

    return {
      ...player,
      cards: [...player.cards]
    };
  }

  emit(event, player = null) {
    this.onChange({
      event,
      player: player ? this.copyPlayer(player) : null,
      players: this.getPlayers(),
      currentPlayerId: this.currentPlayerId
    });
  }

  destroy() {
    this.players = [];
    this.currentPlayerId = null;
  }
}

/* =========================================================
   FACTORY
   ========================================================= */

export function createPlayerManager(options = {}) {
  return new PlayerManager(options);
}

/* =========================================================
   FILE END: js/game/player-manager.js
   ========================================================= */
                         
