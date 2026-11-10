
/* =========================================================
   SUPER RUMMY — GAME TIMER MANAGER
   FILE: js/game/game-timer-manager.js
   PURPOSE: Manage player turn countdown and timeout events
   ========================================================= */

export const TIMER_EVENTS = Object.freeze({
  START: "timer:start",
  TICK: "timer:tick",
  WARNING: "timer:warning",
  EXPIRED: "timer:expired",
  PAUSE: "timer:pause",
  RESUME: "timer:resume",
  STOP: "timer:stop"
});

export class GameTimerManager {
  constructor(options = {}) {
    this.duration = Math.max(
      5,
      Number(options.duration) || 30
    );

    this.warningAt = Math.max(
      0,
      Number(options.warningAt) || 10
    );

    this.onEvent = options.onEvent || (() => {});
    this.onExpire = options.onExpire || (() => {});

    this.remaining = this.duration;
    this.startedAt = null;
    this.intervalId = null;

    this.running = false;
    this.paused = false;
    this.expired = false;
    this.warningSent = false;
    this.destroyed = false;
  }

  emit(event, data = {}) {
    if (this.destroyed) return;

    this.onEvent({
      event,
      remaining: this.remaining,
      timestamp: Date.now(),
      ...data
    });
  }

  start(duration = this.duration) {
    if (this.destroyed) return false;

    this.stop(false);

    this.duration = Math.max(1, Number(duration) || 30);
    this.remaining = this.duration;

    this.running = true;
    this.paused = false;
    this.expired = false;
    this.warningSent = false;

    this.startedAt = Date.now();

    this.emit(TIMER_EVENTS.START);
    this.tick();

    return true;
  }

  tick() {
    if (!this.running || this.paused || this.destroyed) {
      return;
    }

    const elapsed = Math.floor(
      (Date.now() - this.startedAt) / 1000
    );

    this.remaining = Math.max(
      0,
      this.duration - elapsed
    );

    this.emit(TIMER_EVENTS.TICK);

    if (
      !this.warningSent &&
      this.remaining <= this.warningAt &&
      this.remaining > 0
    ) {
      this.warningSent = true;
      this.emit(TIMER_EVENTS.WARNING);
    }

    if (this.remaining <= 0) {
      this.expire();
    }
  }

  startInterval() {
    if (this.intervalId || !this.running || this.paused) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, 250);
  }

  pause() {
    if (!this.running || this.paused || this.destroyed) {
      return false;
    }

    this.tick();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.paused = true;
    this.emit(TIMER_EVENTS.PAUSE);

    return true;
  }

  resume() {
    if (!this.running || !this.paused || this.destroyed) {
      return false;
    }

    this.paused = false;

    this.startedAt =
      Date.now() - (this.duration - this.remaining) * 1000;

    this.emit(TIMER_EVENTS.RESUME);
    this.startInterval();

    return true;
  }

  expire() {
    if (this.expired || this.destroyed) return;

    this.expired = true;
    this.running = false;
    this.paused = false;
    this.remaining = 0;

    this.clearInterval();

    this.emit(TIMER_EVENTS.EXPIRED);

    try {
      this.onExpire({
        remaining: 0,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("SUPER RUMMY timer callback:", error);
    }
  }

  clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  stop(emitEvent = true) {
    this.clearInterval();

    this.running = false;
    this.paused = false;
    this.remaining = this.duration;
    this.startedAt = null;
    this.expired = false;
    this.warningSent = false;

    if (emitEvent) {
      this.emit(TIMER_EVENTS.STOP);
    }
  }

  getRemainingTime() {
    if (this.running && !this.paused) {
      const elapsed = Math.floor(
        (Date.now() - this.startedAt) / 1000
      );

      return Math.max(0, this.duration - elapsed);
    }

    return this.remaining;
  }

  getStatus() {
    return {
      duration: this.duration,
      remaining: this.getRemainingTime(),
      running: this.running,
      paused: this.paused,
      expired: this.expired,
      warningSent: this.warningSent
    };
  }

  destroy() {
    this.stop(false);
    this.destroyed = true;

    this.onEvent = () => {};
    this.onExpire = () => {};
  }
}

export function createGameTimerManager(options = {}) {
  const manager = new GameTimerManager(options);

  // Start the timer interval only after an explicit start().
  const originalStart = manager.start.bind(manager);

  manager.start = (duration) => {
    const result = originalStart(duration);

    if (result && manager.remaining > 0) {
      manager.startInterval();
    }

    return result;
  };

  return manager;
}

/* ================= FILE END ================= */
        
