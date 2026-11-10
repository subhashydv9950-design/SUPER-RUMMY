
/* =========================================================
   SUPER RUMMY — HAPTIC FEEDBACK MANAGER
   FILE: js/audio/haptic-manager.js
   VERSION: 1.0.0
========================================================= */

const HAPTIC_PATTERNS = Object.freeze({
  BUTTON:  [12],
  CARD_PICK: [18],
  CARD_DROP: [25],
  CARD_FLIP: [15],
  CARD_SORT: [12, 20, 12],
  TURN: [25, 40, 25],
  NOTIFICATION: [20, 35, 20],
  DECLARE: [30, 50, 30],
  WIN: [25, 40, 25, 40, 60],
  ERROR: [45, 35, 45]
});

const HAPTIC_DEFAULTS = Object.freeze({
  enabled: true,
  intensity: 1,
  storageKey: "super_rummy_haptic_settings_v1"
});

class HapticManager {
  constructor(options = {}) {
    this.settings = {
      ...HAPTIC_DEFAULTS,
      ...options
    };

    this.settings.intensity = this.clamp(
      this.settings.intensity,
      0,
      1
    );

    this.destroyed = false;
    this.supported =
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function";

    this.loadSettings();
  }

  /* ---------------- SUPPORT CHECK ---------------- */

  isSupported() {
    return this.supported;
  }

  isEnabled() {
    return this.settings.enabled;
  }

  /* ---------------- BASIC VIBRATION ---------------- */

  vibrate(pattern) {
    if (
      this.destroyed ||
      !this.settings.enabled ||
      !this.supported
    ) {
      return false;
    }

    try {
      const adjustedPattern = this.adjustPattern(pattern);

      if (!adjustedPattern.length) return false;

      return navigator.vibrate(adjustedPattern);
    } catch (error) {
      console.warn(
        "[SUPER RUMMY] Haptic feedback failed:",
        error
      );

      return false;
    }
  }

  /* ---------------- GAME FEEDBACK ---------------- */

  button() {
    return this.play("BUTTON");
  }

  cardPick() {
    return this.play("CARD_PICK");
  }

  cardDrop() {
    return this.play("CARD_DROP");
  }

  cardFlip() {
    return this.play("CARD_FLIP");
  }

  cardSort() {
    return this.play("CARD_SORT");
  }

  turnAlert() {
    return this.play("TURN");
  }

  notification() {
    return this.play("NOTIFICATION");
  }

  declaration() {
    return this.play("DECLARE");
  }

  win() {
    return this.play("WIN");
  }

  error() {
    return this.play("ERROR");
  }

  play(name) {
    const pattern = HAPTIC_PATTERNS[name];

    if (!pattern) return false;

    return this.vibrate(pattern);
  }

  /* ---------------- CUSTOM FEEDBACK ---------------- */

  custom(pattern) {
    if (!Array.isArray(pattern)) return false;

    const valid = pattern.every(value =>
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1000
    );

    if (!valid || pattern.length > 20) {
      return false;
    }

    return this.vibrate(pattern);
  }

  /* ---------------- INTENSITY ---------------- */

  adjustPattern(pattern) {
    return pattern.map(value => {
      if (value === 0) return 0;

      return Math.max(
        1,
        Math.round(value * this.settings.intensity)
      );
    });
  }

  setIntensity(value) {
    this.settings.intensity = this.clamp(
      value,
      0,
      1
    );

    this.saveSettings();

    return this.settings.intensity;
  }

  getIntensity() {
    return this.settings.intensity;
  }

  /* ---------------- ENABLE / DISABLE ---------------- */

  setEnabled(enabled) {
    this.settings.enabled = Boolean(enabled);

    if (!this.settings.enabled) {
      this.stop();
    }

    this.saveSettings();

    return this.settings.enabled;
  }

  toggle() {
    return this.setEnabled(!this.settings.enabled);
  }

  stop() {
    if (!this.supported) return false;

    try {
      return navigator.vibrate(0);
    } catch {
      return false;
    }
  }

  /* ---------------- SETTINGS STORAGE ---------------- */

  saveSettings() {
    try {
      localStorage.setItem(
        this.settings.storageKey,
        JSON.stringify({
          enabled: this.settings.enabled,
          intensity: this.settings.intensity
        })
      );

      return true;
    } catch {
      return false;
    }
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem(
        this.settings.storageKey
      );

      if (!stored) return false;

      const parsed = JSON.parse(stored);

      if (!parsed || typeof parsed !== "object") {
        return false;
      }

      if (typeof parsed.enabled === "boolean") {
        this.settings.enabled = parsed.enabled;
      }

      if (Number.isFinite(parsed.intensity)) {
        this.settings.intensity = this.clamp(
          parsed.intensity,
          0,
          1
        );
      }

      return true;
    } catch {
      return false;
    }
  }

  resetSettings() {
    this.settings.enabled = HAPTIC_DEFAULTS.enabled;
    this.settings.intensity = HAPTIC_DEFAULTS.intensity;

    this.saveSettings();

    return this.getSettings();
  }

  getSettings() {
    return {
      enabled: this.settings.enabled,
      intensity: this.settings.intensity,
      supported: this.supported
    };
  }

  /* ---------------- UTILITIES ---------------- */

  clamp(value, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) return min;

    return Math.min(max, Math.max(min, number));
  }

  destroy() {
    if (this.destroyed) return;

    this.stop();
    this.destroyed = true;
  }
}

/* ---------------- FACTORY ---------------- */

function createHapticManager(options = {}) {
  return new HapticManager(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  HAPTIC_PATTERNS,
  HAPTIC_DEFAULTS,
  HapticManager,
  createHapticManager
};

/* =============== FILE ENDING =============== */
