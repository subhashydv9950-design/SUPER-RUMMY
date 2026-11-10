
/* =========================================================
   SUPER RUMMY — GAME FEEDBACK MANAGER
   FILE: js/audio/game-feedback-manager.js
   VERSION: 1.0.0
========================================================= */

import { createAudioController } from "./audio-controller.js";
import { createHapticManager } from "./haptic-manager.js";

const FEEDBACK_EVENTS = Object.freeze({
  BUTTON: "BUTTON",
  CARD_PICK: "CARD_PICK",
  CARD_DROP: "CARD_DROP",
  CARD_FLIP: "CARD_FLIP",
  CARD_SORT: "CARD_SORT",
  TURN: "TURN",
  NOTIFICATION: "NOTIFICATION",
  DECLARE: "DECLARE",
  WIN: "WIN",
  LOSE: "LOSE",
  ERROR: "ERROR",
  ROUND_START: "ROUND_START",
  ROUND_END: "ROUND_END"
});

class GameFeedbackManager {
  constructor(options = {}) {
    this.audio = options.audio ||
      createAudioController();

    this.haptics = options.haptics ||
      createHapticManager();

    this.enabled = options.enabled !== false;
    this.eventOverrides = new Map();
    this.destroyed = false;

    this.eventMap = {
      BUTTON: ["playButton", "button"],
      CARD_PICK: ["playCardPick", "cardPick"],
      CARD_DROP: ["playCardDrop", "cardDrop"],
      CARD_FLIP: ["playCardFlip", "cardFlip"],
      CARD_SORT: ["playCardSort", "cardSort"],
      TURN: ["playTurn", "turnAlert"],
      NOTIFICATION: ["playNotification", "notification"],
      DECLARE: ["playDeclare", "declaration"],
      WIN: ["playWin", "win"],
      LOSE: ["playLose", null],
      ERROR: ["playError", "error"],
      ROUND_START: ["playRoundStart", null],
      ROUND_END: ["playRoundEnd", null]
    };
  }

  /* ---------------- INITIALIZATION ---------------- */

  initialize() {
    if (this.destroyed) return false;

    this.audio.initialize();

    return true;
  }

  /* ---------------- PLAY EVENT ---------------- */

  play(eventName, options = {}) {
    if (
      this.destroyed ||
      !this.enabled
    ) {
      return false;
    }

    const event = String(eventName).toUpperCase();

    if (!FEEDBACK_EVENTS[event]) {
      return false;
    }

    const override = this.eventOverrides.get(event);

    if (override?.enabled === false) {
      return false;
    }

    const mapping = this.eventMap[event];

    if (!mapping) return false;

    const [audioMethod, hapticMethod] = mapping;

    const audioEnabled =
      options.audio !== false &&
      override?.audio !== false;

    const hapticEnabled =
      options.haptic !== false &&
      override?.haptic !== false;

    let audioResult = false;
    let hapticResult = false;

    if (
      audioEnabled &&
      typeof this.audio[audioMethod] === "function"
    ) {
      audioResult = this.audio[audioMethod]();
    }

    if (
      hapticEnabled &&
      hapticMethod &&
      typeof this.haptics[hapticMethod] === "function"
    ) {
      hapticResult = this.haptics[hapticMethod]();
    }

    return {
      event,
      audio: audioResult,
      haptic: hapticResult
    };
  }

  /* ---------------- CONVENIENCE METHODS ---------------- */

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

  declare() {
    return this.play("DECLARE");
  }

  win() {
    return this.play("WIN");
  }

  lose() {
    return this.play("LOSE");
  }

  error() {
    return this.play("ERROR");
  }

  roundStart() {
    return this.play("ROUND_START");
  }

  roundEnd() {
    return this.play("ROUND_END");
  }

  /* ---------------- EVENT SETTINGS ---------------- */

  configureEvent(eventName, options = {}) {
    const event = String(eventName).toUpperCase();

    if (!FEEDBACK_EVENTS[event]) {
      return false;
    }

    const previous = this.eventOverrides.get(event) || {};

    this.eventOverrides.set(event, {
      ...previous,
      enabled: options.enabled ?? previous.enabled,
      audio: options.audio ?? previous.audio,
      haptic: options.haptic ?? previous.haptic
    });

    return true;
  }

  resetEventSettings(eventName) {
    const event = String(eventName).toUpperCase();

    return this.eventOverrides.delete(event);
  }

  /* ---------------- GLOBAL SETTINGS ---------------- */

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    return this.enabled;
  }

  toggle() {
    return this.setEnabled(!this.enabled);
  }

  setMusicVolume(value) {
    this.audio.setMusicVolume(value);
  }

  setEffectsVolume(value) {
    this.audio.setEffectsVolume(value);
  }

  setHapticEnabled(enabled) {
    return this.haptics.setEnabled(enabled);
  }

  setHapticIntensity(value) {
    return this.haptics.setIntensity(value);
  }

  /* ---------------- STATUS ---------------- */

  getStatus() {
    return {
      enabled: this.enabled,
      destroyed: this.destroyed,
      haptics: this.haptics.getSettings(),
      eventOverrides: Object.fromEntries(
        this.eventOverrides
      )
    };
  }

  /* ---------------- CLEANUP ---------------- */

  destroy() {
    if (this.destroyed) return;

    this.audio.destroy();
    this.haptics.destroy();

    this.eventOverrides.clear();
    this.destroyed = true;
  }
}

/* ---------------- FACTORY ---------------- */

function createGameFeedbackManager(options = {}) {
  return new GameFeedbackManager(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  FEEDBACK_EVENTS,
  GameFeedbackManager,
  createGameFeedbackManager
};

/* =============== FILE ENDING =============== */
                     
