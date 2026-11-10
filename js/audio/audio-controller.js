
/* =========================================================
   SUPER RUMMY — AUDIO CONTROLLER
   FILE: js/audio/audio-controller.js
   VERSION: 1.0.0
========================================================= */

import {
  createAudioManager
} from "./audio-manager.js";

import {
  AUDIO_LIBRARY,
  getAudioConfig
} from "./audio-library.js";

class AudioController {
  constructor(options = {}) {
    this.manager = options.manager || createAudioManager();
    this.currentMusic = null;
    this.initialized = false;
    this.destroyed = false;
  }

  /* ---------------- INITIALIZATION ---------------- */

  initialize() {
    if (this.destroyed) return false;
    if (this.initialized) return true;

    this.manager.initialize();

    this.initialized = true;
    return true;
  }

  /* ---------------- MUSIC CONTROL ---------------- */

  async playHomeMusic() {
    return this.playMusic("HOME");
  }

  async playLobbyMusic() {
    return this.playMusic("LOBBY");
  }

  async playGameMusic() {
    return this.playMusic("GAME");
  }

  async playVictoryMusic() {
    return this.playMusic("VICTORY");
  }

  async playMusic(name) {
    if (this.destroyed) return false;

    const config = getAudioConfig("music", name);

    if (!config) {
      console.warn(`[SUPER RUMMY] Music not found: ${name}`);
      return false;
    }

    this.initialize();

    const success = await this.manager.playMusic(
      config.source,
      {
        loop: config.loop,
        volume: config.volume
      }
    );

    if (success) {
      this.currentMusic = name;
    }

    return success;
  }

  stopMusic() {
    this.manager.stopMusic();
    this.currentMusic = null;
  }

  pauseMusic() {
    this.manager.pauseMusic();
  }

  resumeMusic() {
    return this.manager.resumeMusic();
  }

  /* ---------------- CARD EFFECTS ---------------- */

  playShuffle() {
    return this.playEffect("cards", "SHUFFLE");
  }

  playDeal() {
    return this.playEffect("cards", "DEAL");
  }

  playCardPick() {
    return this.playEffect("cards", "PICK");
  }

  playCardDrop() {
    return this.playEffect("cards", "DROP");
  }

  playCardFlip() {
    return this.playEffect("cards", "FLIP");
  }

  playCardSort() {
    return this.playEffect("cards", "SORT");
  }

  /* ---------------- INTERFACE EFFECTS ---------------- */

  playButton() {
    return this.playEffect("interface", "BUTTON");
  }

  playPopup() {
    return this.playEffect("interface", "POPUP");
  }

  playClose() {
    return this.playEffect("interface", "CLOSE");
  }

  playNotification() {
    return this.playEffect("interface", "NOTIFICATION");
  }

  playError() {
    return this.playEffect("interface", "ERROR");
  }

  /* ---------------- GAME EFFECTS ---------------- */

  playTurn() {
    return this.playEffect("game", "TURN");
  }

  playTimer() {
    return this.playEffect("game", "TIMER");
  }

  playDeclare() {
    return this.playEffect("game", "DECLARE");
  }

  playWin() {
    return this.playEffect("game", "WIN");
  }

  playLose() {
    return this.playEffect("game", "LOSE");
  }

  playRoundStart() {
    return this.playEffect("game", "ROUND_START");
  }

  playRoundEnd() {
    return this.playEffect("game", "ROUND_END");
  }

  /* ---------------- EFFECT PLAYBACK ---------------- */

  playEffect(category, name) {
    if (this.destroyed) return false;

    const config = getAudioConfig(category, name);

    if (!config) {
      console.warn(
        `[SUPER RUMMY] Effect not found: ${category}.${name}`
      );
      return false;
    }

    const soundName = this.getSoundName(category, name);

    if (!this.manager.sounds.has(soundName)) {
      this.manager.registerSound(
        soundName,
        config.source,
        {
          volume: config.volume,
          category: "effects",
          loop: false
        }
      );
    }

    return this.manager.play(soundName);
  }

  getSoundName(category, name) {
    const prefixes = {
      cards: {
        SHUFFLE: "shuffle",
        DEAL: "deal",
        PICK: "card-pick",
        DROP: "card-drop",
        FLIP: "card-flip",
        SORT: "sort"
      },

      interface: {
        BUTTON: "button",
        POPUP: "popup",
        CLOSE: "close",
        NOTIFICATION: "notification",
        ERROR: "error"
      },

      game: {
        TURN: "turn",
        TIMER: "timer",
        DECLARE: "declare",
        WIN: "win",
        LOSE: "lose",
        ROUND_START: "round-start",
        ROUND_END: "round-end"
      }
    };

    return prefixes[category]?.[name] || `${category}-${name.toLowerCase()}`;
  }

  /* ---------------- SETTINGS ---------------- */

  setMasterVolume(value) {
    this.manager.setMasterVolume(value);
  }

  setMusicVolume(value) {
    this.manager.setMusicVolume(value);
  }

  setEffectsVolume(value) {
    this.manager.setEffectsVolume(value);
  }

  setMasterEnabled(value) {
    this.manager.setEnabled(value);
  }

  setMusicEnabled(value) {
    this.manager.setMusicEnabled(value);
  }

  setEffectsEnabled(value) {
    this.manager.setEffectsEnabled(value);
  }

  getSettings() {
    return this.manager.getSettings();
  }

  getStatus() {
    return {
      initialized: this.initialized,
      currentMusic: this.currentMusic,
      audio: this.manager.getStatus()
    };
  }

  /* ---------------- CLEANUP ---------------- */

  destroy() {
    if (this.destroyed) return;

    this.manager.destroy();
    this.currentMusic = null;
    this.initialized = false;
    this.destroyed = true;
  }
}

/* ---------------- FACTORY ---------------- */

function createAudioController(options = {}) {
  return new AudioController(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  AudioController,
  createAudioController
};

/* =============== FILE ENDING =============== */
    
