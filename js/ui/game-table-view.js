
/* =========================================================
   SUPER RUMMY
   FILE 55: game-table-view.js
   PATH: js/ui/game-table-view.js
   PURPOSE: Main Game Table UI Structure
   ========================================================= */

export const TABLE_VIEW_ERRORS = Object.freeze({
  INVALID_CONTAINER: "INVALID_CONTAINER",
  INVALID_PLAYERS: "INVALID_PLAYERS",
  RENDER_FAILED: "RENDER_FAILED"
});

export class GameTableView {
  constructor(options = {}) {
    this.container =
      typeof options.container === "string"
        ? document.querySelector(options.container)
        : options.container || null;

    this.maxPlayers = 4;
    this.playerSeats = [];
    this.elements = {};
    this.state = null;
    this.destroyed = false;

    if (!this.container) {
      throw new Error(TABLE_VIEW_ERRORS.INVALID_CONTAINER);
    }

    this.build();
  }

  createElement(tag, className, text = "") {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text) {
      element.textContent = text;
    }

    return element;
  }

  build() {
    this.container.replaceChildren();
    this.container.classList.add("sr-game-table");

    const header = this.createElement(
      "header",
      "sr-table-header"
    );

    const status = this.createElement(
      "div",
      "sr-table-status",
      "Waiting for players"
    );

    const round = this.createElement(
      "div",
      "sr-table-round",
      "Round 1"
    );

    header.append(status, round);

    const opponents = this.createElement(
      "section",
      "sr-opponent-area"
    );

    opponents.setAttribute("aria-label", "Other players");

    const center = this.createElement(
      "section",
      "sr-table-center"
    );

    const pileArea = this.createElement(
      "div",
      "sr-card-piles"
    );

    const closedPile = this.createElement(
      "div",
      "sr-pile sr-closed-pile"
    );

    closedPile.dataset.pile = "closed";

    const closedLabel = this.createElement(
      "span",
      "sr-pile-label",
      "Closed Deck"
    );

    closedPile.append(closedLabel);

    const openPile = this.createElement(
      "div",
      "sr-pile sr-open-pile"
    );

    openPile.dataset.pile = "open";

    const openLabel = this.createElement(
      "span",
      "sr-pile-label",
      "Open Deck"
    );

    openPile.append(openLabel);

    pileArea.append(closedPile, openPile);

    const turnMessage = this.createElement(
      "div",
      "sr-turn-message",
      "Your turn"
    );

    center.append(pileArea, turnMessage);

    const opponentsBottom = this.createElement(
      "section",
      "sr-opponent-bottom"
    );

    const localPlayer = this.createElement(
      "section",
      "sr-local-player"
    );

    const localInfo = this.createElement(
      "div",
      "sr-local-player-info"
    );

    const localName = this.createElement(
      "span",
      "sr-local-player-name",
      "You"
    );

    const localCount = this.createElement(
      "span",
      "sr-local-card-count",
      "13 Cards"
    );

    localInfo.append(localName, localCount);

    const hand = this.createElement(
      "div",
      "sr-player-hand"
    );

    hand.dataset.role = "player-hand";

    hand.setAttribute(
      "aria-label",
      "Your cards"
    );

    localPlayer.append(localInfo, hand);

    const actions = this.createElement(
      "div",
      "sr-table-actions"
    );

    const sortButton = this.createElement(
      "button",
      "sr-table-button",
      "Sort Cards"
    );

    sortButton.type = "button";
    sortButton.dataset.action = "sort";

    const declareButton = this.createElement(
      "button",
      "sr-table-button sr-declare-button",
      "Declare"
    );

    declareButton.type = "button";
    declareButton.dataset.action = "declare";

    const menuButton = this.createElement(
      "button",
      "sr-table-button",
      "Menu"
    );

    menuButton.type = "button";
    menuButton.dataset.action = "menu";

    actions.append(
      sortButton,
      declareButton,
      menuButton
    );

    this.container.append(
      header,
      opponents,
      center,
      opponentsBottom,
      localPlayer,
      actions
    );

    this.elements = {
      header,
      status,
      round,
      opponents,
      center,
      pileArea,
      closedPile,
      openPile,
      turnMessage,
      opponentsBottom,
      localPlayer,
      localName,
      localCount,
      hand,
      actions,
      sortButton,
      declareButton,
      menuButton
    };

    this.emit("built");
  }

  createPlayerSeat(player, position) {
    const seat = this.createElement(
      "article",
      `sr-player-seat sr-seat-${position}`
    );

    seat.dataset.playerId = String(player.id || "");

    const name = this.createElement(
      "span",
      "sr-seat-player-name",
      player.name || "Player"
    );

    const cardCount = this.createElement(
      "span",
      "sr-seat-card-count",
      `${Number(player.cardCount ?? 13)} Cards`
    );

    const avatar = this.createElement(
      "div",
      "sr-seat-avatar",
      (player.name || "P").slice(0, 1).toUpperCase()
    );

    const indicator = this.createElement(
      "span",
      "sr-seat-indicator",
      player.isTurn ? "Your turn" : ""
    );

    seat.append(
      avatar,
      name,
      cardCount,
      indicator
    );

    return seat;
  }

  renderPlayers(players = [], localPlayerId = null) {
    if (!Array.isArray(players) || players.length < 2 || players.length > 4) {
      throw new Error(TABLE_VIEW_ERRORS.INVALID_PLAYERS);
    }

    this.elements.opponents.replaceChildren();
    this.elements.opponentsBottom.replaceChildren();

    this.playerSeats = [];

    const opponents = players.filter(
      player => player.id !== localPlayerId
    );

    opponents.forEach((player, index) => {
      const positions = [
        "top",
        "left",
        "right"
      ];

      const position = positions[index] || "top";
      const seat = this.createPlayerSeat(player, position);

      if (index === 0) {
        this.elements.opponents.append(seat);
      } else {
        this.elements.opponentsBottom.append(seat);
      }

      this.playerSeats.push(seat);
    });

    const localPlayer = players.find(
      player => player.id === localPlayerId
    );

    if (localPlayer) {
      this.elements.localName.textContent =
        localPlayer.name || "You";

      this.elements.localCount.textContent =
        `${Number(localPlayer.cardCount ?? 13)} Cards`;
    }

    return this.playerSeats.length;
  }

  updateStatus(message) {
    this.elements.status.textContent = String(message || "");
  }

  updateRound(roundNumber) {
    const number = Math.max(
      1,
      Number(roundNumber) || 1
    );

    this.elements.round.textContent =
      `Round ${number}`;
  }

  updateTurn(message) {
    this.elements.turnMessage.textContent =
      String(message || "");
  }

  updateCardCount(count) {
    const safeCount = Math.max(
      0,
      Number(count) || 0
    );

    this.elements.localCount.textContent =
      `${safeCount} Cards`;
  }

  setActionEnabled(action, enabled) {
    const buttons = {
      sort: this.elements.sortButton,
      declare: this.elements.declareButton,
      menu: this.elements.menuButton
    };

    const button = buttons[action];

    if (!button) {
      return false;
    }

    button.disabled = !enabled;
    return true;
  }

  setPileCount(type, count) {
    const pile =
      type === "closed"
        ? this.elements.closedPile
        : type === "open"
          ? this.elements.openPile
          : null;

    if (!pile) {
      return false;
    }

    pile.dataset.count = String(
      Math.max(0, Number(count) || 0)
    );

    return true;
  }

  getHandContainer() {
    return this.elements.hand;
  }

  getElement(name) {
    return this.elements[name] || null;
  }

  onAction(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Callback must be a function");
    }

    const handler = event => {
      const button = event.target.closest(
        "[data-action]"
      );

      if (!button || !this.container.contains(button)) {
        return;
      }

      callback(button.dataset.action, event);
    };

    this.container.addEventListener("click", handler);

    return () => {
      this.container.removeEventListener("click", handler);
    };
  }

  emit(event) {
    this.container.dispatchEvent(
      new CustomEvent("sr-table-view", {
        detail: { event }
      })
    );
  }

  destroy() {
    if (this.destroyed) return;

    this.container.replaceChildren();
    this.container.classList.remove("sr-game-table");

    this.elements = {};
    this.playerSeats = [];
    this.state = null;
    this.destroyed = true;
  }
}

export function createGameTableView(options = {}) {
  return new GameTableView(options);
}

/* ================= FILE ENDING ================= */
      
