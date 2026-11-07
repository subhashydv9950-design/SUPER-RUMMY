
/* =========================================================
   SUPER RUMMY — GAME SESSION MANAGER
   File: js/game/game-session-manager.js
   Purpose: Manage complete game session lifecycle.
   ========================================================= */

export const SESSION_STATUS = Object.freeze({
  IDLE: "idle",
  PREPARING: "preparing",
  READY: "ready",
  PLAYING: "playing",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ERROR: "error"
});

export const SESSION_ERRORS = Object.freeze({
  INVALID_CONFIG: "INVALID_CONFIG",
  INVALID_BUILDER: "INVALID_BUILDER",
  INVALID_SETUP: "INVALID_SETUP",
  INVALID_STATE: "INVALID_STATE",
  SESSION_ALREADY_ACTIVE: "SESSION_ALREADY_ACTIVE",
  SESSION_NOT_ACTIVE: "SESSION_NOT_ACTIVE",
  SESSION_NOT_PAUSED: "SESSION_NOT_PAUSED",
  SESSION_NOT_READY: "SESSION_NOT_READY"
});

function createId() {
  return `session_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isFunction(value) {
  return typeof value === "function";
}

/* ---------------------------------------------------------
   GAME SESSION MANAGER
   --------------------------------------------------------- */

export class GameSessionManager {
  constructor(options = {}) {
    this.buildSetup = options.buildSetup || null;
    this.validateSetup = options.validateSetup || null;
    this.applySetup = options.applySetup || null;

    this.controller = options.controller || null;

    this.onStatusChange = isFunction(options.onStatusChange)
      ? options.onStatusChange
      : null;

    this.onSessionEvent = isFunction(options.onSessionEvent)
      ? options.onSessionEvent
      : null;

    this.status = SESSION_STATUS.IDLE;
    this.session = null;
    this.history = [];
  }

  /* -------------------------------------------------------
     INTERNAL STATUS HANDLER
     ------------------------------------------------------- */

  setStatus(status, details = {}) {
    this.status = status;

    const event = {
      sessionId: this.session?.id || null,
      status,
      timestamp: Date.now(),
      details: clone(details)
    };

    if (this.onStatusChange) {
      this.onStatusChange(event);
    }

    if (this.onSessionEvent) {
      this.onSessionEvent(event);
    }

    return event;
  }

  /* -------------------------------------------------------
     CONFIGURATION VALIDATION
     ------------------------------------------------------- */

  validateDependencies() {
    if (!isFunction(this.buildSetup)) {
      throw new Error(SESSION_ERRORS.INVALID_BUILDER);
    }

    if (!isFunction(this.validateSetup)) {
      throw new Error(SESSION_ERRORS.INVALID_SETUP);
    }

    if (!isFunction(this.applySetup)) {
      throw new Error(SESSION_ERRORS.INVALID_CONFIG);
    }
  }

  /* -------------------------------------------------------
     PREPARE NEW SESSION
     ------------------------------------------------------- */

  async prepare(config = {}) {
    if (
      this.status === SESSION_STATUS.PLAYING ||
      this.status === SESSION_STATUS.PAUSED ||
      this.status === SESSION_STATUS.PREPARING ||
      this.status === SESSION_STATUS.READY
    ) {
      throw new Error(
        SESSION_ERRORS.SESSION_ALREADY_ACTIVE
      );
    }

    this.validateDependencies();

    const session = {
      id: createId(),
      status: SESSION_STATUS.PREPARING,
      config: clone(config),
      setup: null,
      startedAt: null,
      completedAt: null,
      duration: 0,
      result: null,
      error: null,
      createdAt: Date.now()
    };

    this.session = session;
    this.setStatus(SESSION_STATUS.PREPARING);

    try {
      const setup = await this.buildSetup(
        clone(config),
        session.id
      );

      if (!setup || typeof setup !== "object") {
        throw new Error(SESSION_ERRORS.INVALID_SETUP);
      }

      const validation = await this.validateSetup(setup);

      if (
        validation !== true &&
        (!validation || validation.valid !== true)
      ) {
        const error = new Error(
          SESSION_ERRORS.INVALID_SETUP
        );

        error.details = validation?.errors || [];
        throw error;
      }

      session.setup = clone(setup);
      session.status = SESSION_STATUS.READY;

      this.setStatus(SESSION_STATUS.READY, {
        sessionId: session.id
      });

      return this.getSession();
    } catch (error) {
      session.status = SESSION_STATUS.ERROR;
      session.error = error.message || "Setup failed";

      this.setStatus(SESSION_STATUS.ERROR, {
        error: session.error
      });

      throw error;
    }
  }

  /* -------------------------------------------------------
     START SESSION
     ------------------------------------------------------- */

  async start() {
    if (
      !this.session ||
      this.status !== SESSION_STATUS.READY
    ) {
      throw new Error(SESSION_ERRORS.SESSION_NOT_READY);
    }

    try {
      await this.applySetup(
        clone(this.session.setup),
        this.controller
      );

      if (
        this.controller &&
        isFunction(this.controller.startGame)
      ) {
        await this.controller.startGame();
      }

      this.session.startedAt = Date.now();
      this.session.status = SESSION_STATUS.PLAYING;

      this.setStatus(SESSION_STATUS.PLAYING);

      return this.getSession();
    } catch (error) {
      this.session.status = SESSION_STATUS.ERROR;
      this.session.error = error.message || "Start failed";

      this.setStatus(SESSION_STATUS.ERROR, {
        error: this.session.error
      });

      throw error;
    }
  }

  /* -------------------------------------------------------
     PAUSE SESSION
     ------------------------------------------------------- */

  pause() {
    if (this.status !== SESSION_STATUS.PLAYING) {
      throw new Error(SESSION_ERRORS.SESSION_NOT_ACTIVE);
    }

    if (
      this.controller &&
      isFunction(this.controller.pauseGame)
    ) {
      this.controller.pauseGame();
    }

    this.session.status = SESSION_STATUS.PAUSED;

    this.setStatus(SESSION_STATUS.PAUSED);

    return true;
  }

  /* -------------------------------------------------------
     RESUME SESSION
     ------------------------------------------------------- */

  resume() {
    if (this.status !== SESSION_STATUS.PAUSED) {
      throw new Error(SESSION_ERRORS.SESSION_NOT_PAUSED);
    }

    if (
      this.controller &&
      isFunction(this.controller.resumeGame)
    ) {
      this.controller.resumeGame();
    }

    this.session.status = SESSION_STATUS.PLAYING;

    this.setStatus(SESSION_STATUS.PLAYING);

    return true;
  }

  /* -------------------------------------------------------
     COMPLETE SESSION
     ------------------------------------------------------- */

  complete(result = null) {
    if (
      this.status !== SESSION_STATUS.PLAYING &&
      this.status !== SESSION_STATUS.PAUSED
    ) {
      throw new Error(SESSION_ERRORS.SESSION_NOT_ACTIVE);
    }

    const completedAt = Date.now();

    this.session.completedAt = completedAt;
    this.session.duration = this.session.startedAt
      ? Math.max(0, completedAt - this.session.startedAt)
      : 0;

    this.session.result = result
      ? clone(result)
      : null;

    this.session.status = SESSION_STATUS.COMPLETED;

    this.history.push(this.getSession());

    this.setStatus(SESSION_STATUS.COMPLETED, {
      duration: this.session.duration
    });

    return this.getSession();
  }

  /* -------------------------------------------------------
     CANCEL SESSION
     ------------------------------------------------------- */

  cancel(reason = "Session cancelled") {
    if (
      this.status === SESSION_STATUS.IDLE ||
      this.status === SESSION_STATUS.COMPLETED ||
      this.status === SESSION_STATUS.CANCELLED
    ) {
      return false;
    }

    if (
      this.controller &&
      isFunction(this.controller.cancelGame)
    ) {
      this.controller.cancelGame();
    }

    this.session.status = SESSION_STATUS.CANCELLED;
    this.session.completedAt = Date.now();
    this.session.error = String(reason);

    if (this.session.startedAt) {
      this.session.duration = Math.max(
        0,
        this.session.completedAt - this.session.startedAt
      );
    }

    this.history.push(this.getSession());

    this.setStatus(SESSION_STATUS.CANCELLED, {
      reason: String(reason)
    });

    return true;
  }

  /* -------------------------------------------------------
     SESSION INFORMATION
     ------------------------------------------------------- */

  getSession() {
    return this.session
      ? clone(this.session)
      : null;
  }

  getStatus() {
    return this.status;
  }

  isActive() {
    return (
      this.status === SESSION_STATUS.PLAYING ||
      this.status === SESSION_STATUS.PAUSED
    );
  }

  getHistory() {
    return clone(this.history);
  }

  /* -------------------------------------------------------
     RESET
     ------------------------------------------------------- */

  reset() {
    if (this.isActive()) {
      throw new Error(SESSION_ERRORS.SESSION_ALREADY_ACTIVE);
    }

    this.session = null;
    this.status = SESSION_STATUS.IDLE;

    this.setStatus(SESSION_STATUS.IDLE);

    return true;
  }

  /* -------------------------------------------------------
     EXPORT
     ------------------------------------------------------- */

  exportData() {
    return {
      version: 1,
      status: this.status,
      session: this.getSession(),
      history: this.getHistory()
    };
  }
}

/* ---------------------------------------------------------
   FACTORY
   --------------------------------------------------------- */

export function createGameSessionManager(options = {}) {
  return new GameSessionManager(options);
}

/* ================= FILE ENDING ================= */
  
