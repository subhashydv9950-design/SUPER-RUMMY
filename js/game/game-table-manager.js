
/* =========================================================
   SUPER RUMMY — GAME TABLE MANAGER
   FILE: js/game/game-table-manager.js
   PURPOSE: Manage player seats and table positions
   ========================================================= */

export const TABLE_POSITIONS = Object.freeze({
  2: ["bottom", "top"],
  3: ["bottom", "top-left", "top-right"],
  4: ["bottom", "left", "top", "right"]
});

export const TABLE_ERRORS = Object.freeze({
  INVALID_PLAYERS: "INVALID_PLAYERS",
  DUPLICATE_PLAYER: "DUPLICATE_PLAYER",
  PLAYER_NOT_FOUND: "PLAYER_NOT_FOUND",
  TABLE_NOT_INITIALIZED: "TABLE_NOT_INITIALIZED"
});

export class GameTableManager {
  constructor(options = {}) {
    this.maxPlayers = options.maxPlayers || 4;
    this.seats = [];
    this.playerSeats = new Map();
    this.initialized = false;
  }

  initialize(players, localPlayerId) {
    if (
      !Array.isArray(players) ||
      players.length < 2 ||
      players.length > this.maxPlayers
    ) {
      throw new Error(TABLE_ERRORS.INVALID_PLAYERS);
    }

    const ids = new Set();

    for (const player of players) {
      if (!player || typeof player.id !== "string") {
        throw new Error(TABLE_ERRORS.INVALID_PLAYERS);
      }

      if (ids.has(player.id)) {
        throw new Error(TABLE_ERRORS.DUPLICATE_PLAYER);
      }

      ids.add(player.id);
    }

    const localIndex = players.findIndex(
      player => player.id === localPlayerId
    );

    if (localIndex < 0) {
      throw new Error(TABLE_ERRORS.PLAYER_NOT_FOUND);
    }

    const positions = TABLE_POSITIONS[players.length];

    this.seats = [];
    this.playerSeats.clear();

    players.forEach((player, index) => {
      const relativeIndex =
        (index - localIndex + players.length) % players.length;

      const seat = {
        seatNumber: relativeIndex + 1,
        playerId: player.id,
        playerName: player.name || `Player ${index + 1}`,
        position: positions[relativeIndex],
        isLocalPlayer: player.id === localPlayerId,
        playerType: player.type || "human",
        status: player.status || "active",
        cardCount: Array.isArray(player.cards)
          ? player.cards.length
          : 0
      };

      this.seats.push(seat);
      this.playerSeats.set(player.id, seat);
    });

    this.initialized = true;

    return this.getSeats();
  }

  getSeats() {
    return this.seats.map(seat => ({ ...seat }));
  }

  getSeat(playerId) {
    const seat = this.playerSeats.get(playerId);

    return seat ? { ...seat } : null;
  }

  getLocalPlayerSeat() {
    return this.seats.find(
      seat => seat.isLocalPlayer
    ) || null;
  }

  getOpponentSeats() {
    return this.seats
      .filter(seat => !seat.isLocalPlayer)
      .map(seat => ({ ...seat }));
  }

  updatePlayerStatus(playerId, status) {
    const seat = this.playerSeats.get(playerId);

    if (!seat) {
      throw new Error(TABLE_ERRORS.PLAYER_NOT_FOUND);
    }

    seat.status = status;

    return { ...seat };
  }

  updateCardCount(playerId, count) {
    const seat = this.playerSeats.get(playerId);

    if (!seat) {
      throw new Error(TABLE_ERRORS.PLAYER_NOT_FOUND);
    }

    seat.cardCount = Math.max(0, Number(count) || 0);

    return { ...seat };
  }

  updatePlayerName(playerId, name) {
    const seat = this.playerSeats.get(playerId);

    if (!seat) {
      throw new Error(TABLE_ERRORS.PLAYER_NOT_FOUND);
    }

    seat.playerName = String(name || "Player").trim();

    return { ...seat };
  }

  getTableSnapshot() {
    if (!this.initialized) {
      throw new Error(TABLE_ERRORS.TABLE_NOT_INITIALIZED);
    }

    return {
      playerCount: this.seats.length,
      seats: this.getSeats(),
      localPlayer: this.getLocalPlayerSeat()
    };
  }

  reset() {
    this.seats = [];
    this.playerSeats.clear();
    this.initialized = false;
  }
}

export function createGameTableManager(options = {}) {
  return new GameTableManager(options);
}

/* ================= FILE END ================= */
