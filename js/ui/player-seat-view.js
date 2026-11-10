
/* =========================================================
   SUPER RUMMY
   FILE 60: player-seat-view.js
   PATH: js/ui/player-seat-view.js
   PURPOSE: Player Seat Rendering and Updates
   ========================================================= */

export const PLAYER_SEAT_ERRORS = Object.freeze({
  INVALID_CONTAINER: "INVALID_CONTAINER",
  INVALID_PLAYERS: "INVALID_PLAYERS",
  DUPLICATE_PLAYER: "DUPLICATE_PLAYER",
  DESTROYED: "DESTROYED"
});

export class PlayerSeatView {
  constructor(options = {}) {
    this.container =
      typeof options.container === "string"
        ? document.querySelector(options.container)
        : options.container || null;

    if (!this.container) {
      throw new Error(PLAYER_SEAT_ERRORS.INVALID_CONTAINER);
    }

    this.maxPlayers = 4;
    this.seats = new Map();
    this.localPlayerId = null;
    this.destroyed = false;

    this.container.classList.add(
      "sr-player-seat-container"
    );
  }

  ensureActive() {
    if (this.destroyed) {
      throw new Error(PLAYER_SEAT_ERRORS.DESTROYED);
    }
  }

  createElement(tag, className, text = "") {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    element.textContent = text;

    return element;
  }

  createSeat(player, position) {
    const seat = this.createElement(
      "article",
      `sr-player-seat sr-seat-${position}`
    );

    seat.dataset.playerId = String(player.id);

    const avatar = this.createElement(
      "div",
      "sr-seat-avatar",
      this.getInitial(player.name)
    );

    avatar.setAttribute("aria-hidden", "true");

    const info = this.createElement(
      "div",
      "sr-seat-info"
    );

    const name = this.createElement(
      "span",
      "sr-seat-player-name",
      player.name || "Player"
    );

    const cardCount = this.createElement(
      "span",
      "sr-seat-card-count",
      `${this.getCardCount(player)} Cards`
    );

    const turn = this.createElement(
      "span",
      "sr-seat-indicator",
      ""
    );

    const connection = this.createElement(
      "span",
      "sr-seat-connection",
      ""
    );

    info.append(name, cardCount, turn, connection);
    seat.append(avatar, info);

    this.updateSeatElement(seat, player);

    return seat;
  }

  getInitial(name) {
    const value = String(name || "P").trim();

    return value
      ? Array.from(value)[0].toUpperCase()
      : "P";
  }

  getCardCount(player) {
    if (Number.isFinite(player.cardCount)) {
      return Math.max(0, player.cardCount);
    }

    if (Array.isArray(player.cards)) {
      return player.cards.length;
    }

    return 13;
  }

  getConnectionStatus(player) {
    if (player.connected === false) {
      return "Disconnected";
    }

    return "Connected";
  }

  updateSeatElement(seat, player) {
    const name = seat.querySelector(
      ".sr-seat-player-name"
    );

    const avatar = seat.querySelector(
      ".sr-seat-avatar"
    );

    const cardCount = seat.querySelector(
      ".sr-seat-card-count"
    );

    const turn = seat.querySelector(
      ".sr-seat-indicator"
    );

    const connection = seat.querySelector(
      ".sr-seat-connection"
    );

    name.textContent = player.name || "Player";

    avatar.textContent = this.getInitial(player.name);

    cardCount.textContent =
      `${this.getCardCount(player)} Cards`;

    turn.textContent = player.isTurn
      ? "YOUR TURN"
      : "";

    connection.textContent =
      this.getConnectionStatus(player);

    seat.classList.toggle(
      "is-active",
      Boolean(player.isTurn)
    );

    seat.classList.toggle(
      "is-disconnected",
      player.connected === false
    );

    seat.classList.toggle(
      "is-local-player",
      player.id === this.localPlayerId
    );

    seat.dataset.status = String(
      player.status || "active"
    );

    seat.setAttribute(
      "aria-label",
      `${player.name || "Player"}, ${this.getCardCount(player)} cards`
    );
  }

  getPosition(index, total) {
    if (total === 2) {
      return index === 0 ? "top" : "bottom";
    }

    if (total === 3) {
      return ["top", "left", "right"][index];
    }

    return ["top", "left", "right", "bottom"][index];
  }

  render(players, localPlayerId = null) {
    this.ensureActive();

    if (
      !Array.isArray(players) ||
      players.length < 2 ||
      players.length > this.maxPlayers
    ) {
      throw new Error(PLAYER_SEAT_ERRORS.INVALID_PLAYERS);
    }

    const ids = players.map(player => player.id);

    if (
      ids.some(id => id === undefined || id === null) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error(PLAYER_SEAT_ERRORS.DUPLICATE_PLAYER);
    }

    this.localPlayerId = localPlayerId;

    this.container.replaceChildren();
    this.seats.clear();

    players.forEach((player, index) => {
      const position = this.getPosition(
        index,
        players.length
      );

      const seat = this.createSeat(
        player,
        position
      );

      this.container.append(seat);
      this.seats.set(String(player.id), seat);
    });

    return this.getSummary();
  }

  updatePlayer(playerId, updates = {}) {
    this.ensureActive();

    const seat = this.seats.get(String(playerId));

    if (!seat) return false;

    const player = {
      id: playerId,
      name: seat.querySelector(
        ".sr-seat-player-name"
      ).textContent,
      cardCount: Number(
        seat.querySelector(
          ".sr-seat-card-count"
        ).textContent.match(/\d+/)?.[0] || 0
      ),
      connected: !seat.classList.contains(
        "is-disconnected"
      ),
      isTurn: seat.classList.contains("is-active"),
      ...updates
    };

    this.updateSeatElement(seat, player);

    return true;
  }

  setActivePlayer(playerId) {
    this.ensureActive();

    for (const [id, seat] of this.seats) {
      const active = id === String(playerId);

      seat.classList.toggle("is-active", active);

      const indicator = seat.querySelector(
        ".sr-seat-indicator"
      );

      indicator.textContent = active
        ? "YOUR TURN"
        : "";
    }
  }

  setConnection(playerId, connected) {
    return this.updatePlayer(playerId, {
      connected: Boolean(connected)
    });
  }

  removePlayer(playerId) {
    this.ensureActive();

    const id = String(playerId);
    const seat = this.seats.get(id);

    if (!seat) return false;

    seat.remove();
    this.seats.delete(id);

    return true;
  }

  getSeat(playerId) {
    return this.seats.get(String(playerId)) || null;
  }

  getSummary() {
    return {
      totalPlayers: this.seats.size,
      localPlayerId: this.localPlayerId,
      playerIds: Array.from(this.seats.keys())
    };
  }

  destroy() {
    if (this.destroyed) return;

    this.container.replaceChildren();

    this.container.classList.remove(
      "sr-player-seat-container"
    );

    this.seats.clear();
    this.localPlayerId = null;
    this.destroyed = true;
  }
}

export function createPlayerSeatView(options = {}) {
  return new PlayerSeatView(options);
}

/* ================= FILE ENDING ================= */
