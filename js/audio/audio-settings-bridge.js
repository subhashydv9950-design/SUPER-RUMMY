
/* =========================================================
   SUPER RUMMY — AUDIO SETTINGS BRIDGE
   FILE: js/audio/audio-settings-bridge.js
   VERSION: 1.0.0
========================================================= */

import { createAudioSettings } from "./audio-settings.js";
import { createAudioManager } from "./audio-manager.js";

class AudioSettingsBridge {
  constructor(options = {}) {
    this.settings = options.settings ||
      createAudioSettings();

    this.audio = options.audio ||
      createAudioManager();

    this.unsubscribe = null;
    this.initialized = false;
    this.destroyed = false;
  }

  /* ---------------- INITIALIZE ---------------- */

  initialize() {
    if (this.destroyed) return false;
    if (this.initialized) return true;

    this.applyAllSettings();

    this.unsubscribe = this.settings.subscribe(
      change => this.handleSettingsChange(change)
    );

    this.initialized = true;

    return true;
  }

  /* ---------------- APPLY SETTINGS ---------------- */

  applyAllSettings() {
    const settings = this.settings.getAll();

    this.audio.setMasterVolume(
      settings.masterVolume
    );

    this.audio.setMusicVolume(
      settings.musicVolume
    );

    this.audio.setEffectsVolume(
      settings.effectsVolume
    );

    this.audio.setEnabled(
      settings.masterEnabled
    );

    this.audio.setMusicEnabled(
      settings.musicEnabled
    );

    this.audio.setEffectsEnabled(
      settings.effectsEnabled
    );

    return true;
  }

  /* ---------------- CHANGE HANDLER ---------------- */

  handleSettingsChange(change) {
    if (this.destroyed || !change) return;

    if (change.key === "reset" || change.key === "import") {
      this.applyAllSettings();
      return;
    }

    const settings = this.settings.getAll();

    switch (change.key) {
      case "masterVolume":
        this.audio.setMasterVolume(
          settings.masterVolume
        );
        break;

      case "musicVolume":
        this.audio.setMusicVolume(
          settings.musicVolume
        );
        break;

      case "effectsVolume":
        this.audio.setEffectsVolume(
          settings.effectsVolume
        );
        break;

      case "masterEnabled":
        this.audio.setEnabled(
          settings.masterEnabled
        );
        break;

      case "musicEnabled":
        this.audio.setMusicEnabled(
          settings.musicEnabled
        );
        break;

      case "effectsEnabled":
        this.audio.setEffectsEnabled(
          settings.effectsEnabled
        );
        break;
    }
  }

  /* ---------------- PUBLIC SETTINGS API ---------------- */

  setMasterVolume(value) {
    return this.settings.setMasterVolume(value);
  }

  setMusicVolume(value) {
    return this.settings.setMusicVolume(value);
  }

  setEffectsVolume(value) {
    return this.settings.setEffectsVolume(value);
  }

  toggleMaster() {
    return this.settings.toggleMaster();
  }

  toggleMusic() {
    return this.settings.toggleMusic();
  }

  toggleEffects() {
    return this.settings.toggleEffects();
  }

  resetSettings() {
    return this.settings.reset();
  }

  getSettings() {
    return this.settings.getAll();
  }

  /* ---------------- AUDIO ACCESS ---------------- */

  getAudioManager() {
    return this.audio;
  }

  /* ---------------- CLEANUP ---------------- */

  destroy() {
    if (this.destroyed) return;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.settings.destroy();
    this.audio.destroy();

    this.initialized = false;
    this.destroyed = true;
  }
}

/* ---------------- FACTORY ---------------- */

function createAudioSettingsBridge(options = {}) {
  return new AudioSettingsBridge(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  AudioSettingsBridge,
  createAudioSettingsBridge
};

/* =============== FILE ENDING =============== */
