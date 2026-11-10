
/* =========================================================
   SUPER RUMMY
   FILE 56: game-table-controller.js
   PATH: js/ui/game-table-controller.js
   PURPOSE: Game Table UI Controller
   ========================================================= */

export const TABLE_CONTROLLER_ERRORS = Object.freeze({
  INVALID_VIEW: "INVALID_VIEW",
  INVALID_CALLBACK: "INVALID_CALLBACK",
  DESTROYED: "DESTROYED"
});

export class GameTableController {
  constructor(options = {}) {
    if (!options.view) {
      throw new Error(TABLE_CONTROLLER_ERRORS.INVALID_VIEW);
    }

    this.view = options.view;
    this.handManager = options.handManager || null;
    this.gameController = options.gameController || null;

    this.callbacks = {
      onSort: options.onSort || null,
      onDeclare: options.onDeclare || null,
      onMenu: options.onMenu || null,
      onCardSelect: options.onCardSelect || null,
      onDraw: options.onDraw || null,
      onDiscard: options.onDiscard || null
    };

    this.unsubscribeAction = null;
    this.destroyed = false;
    this.lastSnapshot = null;

    this.bindActions();
  }

  bindActions() {
    this.unsubscribeAction = this.view.onAction(
      (action, event) => {
        if (this.destroyed) return;

        switch (action) {
          case "sort":
            this.handleSort(event);
            break;

          case "declare":
            this.handleDeclare(event);
            break;

          case "menu":
            this.handleMenu(event);
            break;

          default:
            break;
        }
      }
    );
  }

  async execute(callback, event, actionName) {
    if (typeof callback !== "function") {
      return {
        success: false,
        error: TABLE_CONTROLLER_ERRORS.INVALID_CALLBACK
      };
    }

    try {
      const result = await callback({
        event,
        action: actionName,
        controller: this
      });

      return {
        success: true,
        result
      };
    } catch (error) {
      console.error(
        `SUPER RUMMY ${actionName} error:`,
        error
      );

      return {
        success: false,
        error
      };
    }
  }

  async handleSort(event) {
    if (this.handManager?.sort) {
      this.handManager.sort("smart");
    }

    return this.execute(
      this.callbacks.onSort,
      event,
      "sort"
    );
  }

  async handleDeclare(event) {
    return this.execute(
      this.callbacks.onDeclare,
      event,
      "declare"
    );
  }

  async handleMenu(event) {
    return this.execute(
      this.callbacks.onMenu,
      event,
      "menu"
    );
  }

  async handleDraw(source) {
    return this.execute(
      this.callbacks.onDraw,
      null,
      `draw-${source}`
    );
  }

  async handleDiscard(card) {
    return this.execute(
      this.callbacks.onDiscard,
      null,
      "discard"
    );
  }

  setPlayers(players, localPlayerId) {
    if (this.destroyed) {
      throw new Error(TABLE_CONTROLLER_ERRORS.DESTROYED);
    }

    return this.view.renderPlayers(
      players,
      localPlayerId
    );
  }

  setGameStatus(status) {
    this.view.updateStatus(status);
  }

  setRound(roundNumber) {
    this.view.updateRound(roundNumber);
  }

  setTurnMessage(message) {
    this.view.updateTurn(message);
  }

  setCardCount(count) {
    this.view.updateCardCount(count);
  }

  setPileCounts(closedCount, openCount) {
    this.view.setPileCount("closed", closedCount);
    this.view.setPileCount("open", openCount);
  }

  setActions(options = {}) {
    if (typeof options.sort === "boolean") {
      this.view.setActionEnabled(
        "sort",
        options.sort
      );
    }

    if (typeof options.declare === "boolean") {
      this.view.setActionEnabled(
        "declare",
        options.declare
      );
    }

    if (typeof options.menu === "boolean") {
      this.view.setActionEnabled(
        "menu",
        options.menu
      );
    }
  }

  update(snapshot = {}) {
    if (this.destroyed) {
      throw new Error(TABLE_CONTROLLER_ERRORS.DESTROYED);
    }

    if (snapshot.status !== undefined) {
      this.setGameStatus(snapshot.status);
    }

    if (snapshot.round !== undefined) {
      this.setRound(snapshot.round);
    }

    if (snapshot.turnMessage !== undefined) {
      this.setTurnMessage(snapshot.turnMessage);
    }

    if (snapshot.cardCount !== undefined) {
      this.setCardCount(snapshot.cardCount);
    }

    if (
      snapshot.closedCount !== undefined ||
      snapshot.openCount !== undefined
    ) {
      this.setPileCounts(
        snapshot.closedCount ?? 0,
        snapshot.openCount ?? 0
      );
    }

    if (snapshot.actions) {
      this.setActions(snapshot.actions);
    }

    if (Array.isArray(snapshot.players)) {
      this.setPlayers(
        snapshot.players,
        snapshot.localPlayerId
      );
    }

    this.lastSnapshot = {
      ...snapshot
    };

    return true;
  }

  getSnapshot() {
    return this.lastSnapshot
      ? { ...this.lastSnapshot }
      : null;
  }

  destroy() {
    if (this.destroyed) return;

    if (typeof this.unsubscribeAction === "function") {
      this.unsubscribeAction();
    }

    this.unsubscribeAction = null;
    this.lastSnapshot = null;
    this.destroyed = true;
  }
}

export function createGameTableController(options = {}) {
  return new GameTableController(options);
}

/* ================= FILE ENDING ================= */
