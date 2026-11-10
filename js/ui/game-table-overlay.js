
/* =========================================================
   SUPER RUMMY
   FILE 61: game-table-overlay.js
   PATH: js/ui/game-table-overlay.js
   PURPOSE: Game Table Dialog and Overlay Management
   ========================================================= */

export const OVERLAY_TYPES = Object.freeze({
  PAUSE: "pause",
  CONFIRM: "confirm",
  RESULT: "result",
  MESSAGE: "message",
  RECONNECT: "reconnect"
});

export class GameTableOverlay {
  constructor(options = {}) {
    this.root =
      typeof options.container === "string"
        ? document.querySelector(options.container)
        : options.container || document.body;

    if (!this.root) {
      throw new Error("OVERLAY_CONTAINER_REQUIRED");
    }

    this.activeOverlay = null;
    this.destroyed = false;
    this.closeOnBackdrop = options.closeOnBackdrop !== false;

    this.handleKeydown = event => {
      if (event.key === "Escape") {
        this.close();
      }
    };

    document.addEventListener(
      "keydown",
      this.handleKeydown
    );
  }

  ensureActive() {
    if (this.destroyed) {
      throw new Error("OVERLAY_MANAGER_DESTROYED");
    }
  }

  createElement(tag, className, text = "") {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    element.textContent = String(text);

    return element;
  }

  createButton(label, action, variant = "default") {
    const button = this.createElement(
      "button",
      `sr-overlay-button sr-overlay-${variant}`,
      label
    );

    button.type = "button";
    button.dataset.overlayAction = action;

    return button;
  }

  show(options = {}) {
    this.ensureActive();
    this.close();

    const type = options.type || OVERLAY_TYPES.MESSAGE;
    const title = options.title || "SUPER RUMMY";
    const message = options.message || "";

    const backdrop = this.createElement(
      "div",
      "sr-overlay-backdrop"
    );

    backdrop.setAttribute("role", "presentation");

    const dialog = this.createElement(
      "section",
      "sr-overlay-dialog"
    );

    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "sr-overlay-title");

    const heading = this.createElement(
      "h2",
      "sr-overlay-title",
      title
    );

    heading.id = "sr-overlay-title";

    const content = this.createElement(
      "div",
      "sr-overlay-content",
      message
    );

    const actions = this.createElement(
      "div",
      "sr-overlay-actions"
    );

    const buttons = Array.isArray(options.buttons)
      ? options.buttons
      : [];

    for (const item of buttons) {
      if (!item || typeof item.label !== "string") {
        continue;
      }

      const button = this.createButton(
        item.label,
        item.action || "custom",
        item.variant || "default"
      );

      actions.append(button);
    }

    if (buttons.length === 0) {
      actions.append(
        this.createButton("Close", "close")
      );
    }

    dialog.append(heading, content, actions);
    backdrop.append(dialog);
    this.root.append(backdrop);

    const actionHandler = event => {
      const button = event.target.closest(
        "[data-overlay-action]"
      );

      if (!button || !backdrop.contains(button)) {
        return;
      }

      const action = button.dataset.overlayAction;

      if (action === "close") {
        this.close();
      }

      if (typeof options.onAction === "function") {
        options.onAction(action, {
          type,
          event
        });
      }
    };

    const backdropHandler = event => {
      if (
        this.closeOnBackdrop &&
        event.target === backdrop
      ) {
        this.close();
      }
    };

    actions.addEventListener("click", actionHandler);
    backdrop.addEventListener("click", backdropHandler);

    this.activeOverlay = {
      type,
      element: backdrop,
      dialog,
      cleanup: () => {
        actions.removeEventListener(
          "click",
          actionHandler
        );

        backdrop.removeEventListener(
          "click",
          backdropHandler
        );
      }
    };

    const firstButton = actions.querySelector("button");
    firstButton?.focus();

    return this.activeOverlay;
  }

  showPause(options = {}) {
    return this.show({
      type: OVERLAY_TYPES.PAUSE,
      title: "Game Paused",
      message: "Your game is currently paused.",
      buttons: [
        {
          label: "Resume",
          action: "resume",
          variant: "primary"
        },
        {
          label: "Restart",
          action: "restart"
        },
        {
          label: "Exit Game",
          action: "exit",
          variant: "danger"
        }
      ],
      ...options
    });
  }

  showConfirmation(options = {}) {
    return this.show({
      type: OVERLAY_TYPES.CONFIRM,
      title: options.title || "Are you sure?",
      message: options.message || "",
      buttons: [
        {
          label: options.confirmLabel || "Confirm",
          action: "confirm",
          variant: "primary"
        },
        {
          label: options.cancelLabel || "Cancel",
          action: "cancel"
        }
      ],
      ...options
    });
  }

  showResult(result = {}, options = {}) {
    const winner = result.winnerName || "Player";

    const scoreText = Array.isArray(result.scores)
      ? result.scores
          .map(item => `${item.name || "Player"}: ${Number(item.score) || 0}`)
          .join("\n")
      : "Round completed.";

    return this.show({
      type: OVERLAY_TYPES.RESULT,
      title: options.title || "Round Result",
      message: `Winner: ${winner}\n\n${scoreText}`,
      buttons: [
        {
          label: "Continue",
          action: "continue",
          variant: "primary"
        },
        {
          label: "Close",
          action: "close"
        }
      ],
      ...options
    });
  }

  showMessage(message, options = {}) {
    return this.show({
      type: OVERLAY_TYPES.MESSAGE,
      title: options.title || "Notice",
      message,
      ...options
    });
  }

  showReconnect(options = {}) {
    return this.show({
      type: OVERLAY_TYPES.RECONNECT,
      title: "Connection Interrupted",
      message: options.message ||
        "Trying to reconnect to the game...",
      buttons: [
        {
          label: "Retry",
          action: "retry",
          variant: "primary"
        },
        {
          label: "Close",
          action: "close"
        }
      ],
      ...options
    });
  }

  close() {
    if (!this.activeOverlay) return false;

    const overlay = this.activeOverlay;

    overlay.cleanup();
    overlay.element.remove();

    this.activeOverlay = null;

    return true;
  }

  isOpen() {
    return Boolean(this.activeOverlay);
  }

  getActiveType() {
    return this.activeOverlay?.type || null;
  }

  destroy() {
    if (this.destroyed) return;

    this.close();

    document.removeEventListener(
      "keydown",
      this.handleKeydown
    );

    this.destroyed = true;
  }
}

export function createGameTableOverlay(options = {}) {
  return new GameTableOverlay(options);
}

/* ================= FILE ENDING ================= */
