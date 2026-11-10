
/* =========================================================
   SUPER RUMMY
   FILE 54: game-runtime.js
   PATH: js/game/game-runtime.js
   PURPOSE: Central Game Runtime Integration
   ========================================================= */

export const RUNTIME_STATUS = Object.freeze({
  IDLE: "idle",
  PREPARING: "preparing",
  READY: "ready",
  RUNNING: "running",
  PAUSED: "paused",
  FINISHED: "finished",
  ERROR: "error"
});

export const RUNTIME_ERRORS = Object.freeze({
  INVALID_CONFIG: "INVALID_CONFIG",
  MISSING_DEPENDENCY: "MISSING_DEPENDENCY",
  PREPARE_FAILED: "PREPARE_FAILED",
  START_FAILED: "START_FAILED",
  PAUSE_FAILED: "PAUSE_FAILED",
  RESUME_FAILED: "RESUME_FAILED",
  FINISH_FAILED: "FINISH_FAILED",
  INVALID_STATE: "INVALID_STATE"
});

export class GameRuntimeManager {
  constructor(options = {}) {
    this.session = options.session || null;
    this.controller = options.controller || null;
    this.setupBuilder = options.setupBuilder || null;
    this.setupAdapter = options.setupAdapter || null;

    this.status = RUNTIME_STATUS.IDLE;
    this.currentSetup = null;
    this.lastError = null;
    this.listeners = new Set();
    this.history = [];

    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
  }

  subscribe(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Listener must be a function");
    }

    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(event, data = {}) {
    this.updatedAt = Date.now();

    const payload = {
      event,
      status: this.status,
      timestamp: this.updatedAt,
      data,
      error: this.lastError
    };

    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error("Runtime listener error:", error);
      }
    }
  }

  setStatus(status) {
    this.status = status;
    this.emit("status-changed");
  }

  setError(code, message, originalError = null) {
    this.lastError = {
      code,
      message,
      originalError:
        originalError instanceof Error
          ? originalError.message
          : null,
      timestamp: Date.now()
    };

    this.status = RUNTIME_STATUS.ERROR;
    this.emit("runtime-error", this.lastError);

    return this.lastError;
  }

  validateDependencies() {
    const missing = [];

    if (!this.controller) {
      missing.push("controller");
    }

    if (!this.setupBuilder) {
      missing.push("setupBuilder");
    }

    if (!this.setupAdapter) {
      missing.push("setupAdapter");
    }

    if (missing.length) {
      throw new Error(
        `Missing runtime dependencies: ${missing.join(", ")}`
      );
    }

    return true;
  }

  async prepare(config = {}) {
    if (
      this.status === RUNTIME_STATUS.RUNNING ||
      this.status === RUNTIME_STATUS.PAUSED
    ) {
      throw new Error(RUNTIME_ERRORS.INVALID_STATE);
    }

    try {
      this.validateDependencies();

      this.setStatus(RUNTIME_STATUS.PREPARING);
      this.lastError = null;

      const setup = await this.setupBuilder.build(config);

      if (!setup || typeof setup !== "object") {
        throw new Error("Setup builder returned invalid setup");
      }

      const validation =
        await this.setupAdapter.validate?.(setup);

      if (validation && validation.valid === false) {
        throw new Error(
          validation.message || "Game setup validation failed"
        );
      }

      this.currentSetup = setup;

      this.emit("setup-prepared", {
        setup
      });

      this.setStatus(RUNTIME_STATUS.READY);

      return {
        success: true,
        setup
      };
    } catch (error) {
      this.setError(
        RUNTIME_ERRORS.PREPARE_FAILED,
        "Unable to prepare the game.",
        error
      );

      return {
        success: false,
        error: this.lastError
      };
    }
  }

  async start() {
    if (this.status !== RUNTIME_STATUS.READY) {
      return {
        success: false,
        error: RUNTIME_ERRORS.INVALID_STATE
      };
    }

    try {
      const gameState =
        await this.setupAdapter.apply(this.currentSetup);

      if (!gameState) {
        throw new Error("Game state could not be created");
      }

      const result = await this.controller.startGame();

      if (result && result.success === false) {
        throw new Error(
          result.message || "Controller failed to start"
        );
      }

      this.history.push({
        action: "start",
        timestamp: Date.now()
      });

      this.setStatus(RUNTIME_STATUS.RUNNING);
      this.emit("game-started", {
        gameState
      });

      return {
        success: true,
        gameState
      };
    } catch (error) {
      this.setError(
        RUNTIME_ERRORS.START_FAILED,
        "Unable to start the game.",
        error
      );

      return {
        success: false,
        error: this.lastError
      };
    }
  }

  async pause() {
    if (this.status !== RUNTIME_STATUS.RUNNING) {
      return {
        success: false,
        error: RUNTIME_ERRORS.INVALID_STATE
      };
    }

    try {
      await this.controller.pauseGame?.();

      this.history.push({
        action: "pause",
        timestamp: Date.now()
      });

      this.setStatus(RUNTIME_STATUS.PAUSED);
      this.emit("game-paused");

      return { success: true };
    } catch (error) {
      this.setError(
        RUNTIME_ERRORS.PAUSE_FAILED,
        "Unable to pause the game.",
        error
      );

      return {
        success: false,
        error: this.lastError
      };
    }
  }

  async resume() {
    if (this.status !== RUNTIME_STATUS.PAUSED) {
      return {
        success: false,
        error: RUNTIME_ERRORS.INVALID_STATE
      };
    }

    try {
      await this.controller.resumeGame?.();

      this.history.push({
        action: "resume",
        timestamp: Date.now()
      });

      this.setStatus(RUNTIME_STATUS.RUNNING);
      this.emit("game-resumed");

      return { success: true };
    } catch (error) {
      this.setError(
        RUNTIME_ERRORS.RESUME_FAILED,
        "Unable to resume the game.",
        error
      );

      return {
        success: false,
        error: this.lastError
      };
    }
  }

  async finish(result = {}) {
    if (
      this.status !== RUNTIME_STATUS.RUNNING &&
      this.status !== RUNTIME_STATUS.PAUSED
    ) {
      return {
        success: false,
        error: RUNTIME_ERRORS.INVALID_STATE
      };
    }

    try {
      await this.controller.finishGame?.(result);

      this.history.push({
        action: "finish",
        result,
        timestamp: Date.now()
      });

      this.setStatus(RUNTIME_STATUS.FINISHED);
      this.emit("game-finished", result);

      return {
        success: true,
        result
      };
    } catch (error) {
      this.setError(
        RUNTIME_ERRORS.FINISH_FAILED,
        "Unable to finish the game.",
        error
      );

      return {
        success: false,
        error: this.lastError
      };
    }
  }

  getStatus() {
    return this.status;
  }

  getCurrentSetup() {
    return this.currentSetup
      ? structuredClone(this.currentSetup)
      : null;
  }

  getHistory() {
    return this.history.map(item => ({
      ...item
    }));
  }

  getSnapshot() {
    return {
      status: this.status,
      hasSetup: Boolean(this.currentSetup),
      lastError: this.lastError,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      historyCount: this.history.length
    };
  }

  reset() {
    if (
      this.status === RUNTIME_STATUS.RUNNING ||
      this.status === RUNTIME_STATUS.PAUSED
    ) {
      throw new Error(
        "Finish or stop the current game before resetting."
      );
    }

    this.currentSetup = null;
    this.lastError = null;
    this.history = [];

    this.setStatus(RUNTIME_STATUS.IDLE);
    this.emit("runtime-reset");

    return true;
  }

  destroy() {
    this.listeners.clear();
    this.currentSetup = null;
    this.history = [];
    this.status = RUNTIME_STATUS.IDLE;
  }
}

export function createGameRuntime(options = {}) {
  return new GameRuntimeManager(options);
}

/* ================= FILE ENDING ================= */
      
