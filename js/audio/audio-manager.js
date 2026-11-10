
/* =========================================================
   SUPER RUMMY — AUDIO MANAGER
   FILE: js/audio/audio-manager.js
   VERSION: 1.0.0
   PURPOSE:
   Background music, sound effects, volume and mute control
========================================================= */

const AUDIO_EVENTS = Object.freeze({
  BUTTON: "button",
  CARD_PICK: "card-pick",
  CARD_DROP: "card-drop",
  CARD_FLIP: "card-flip",
  SHUFFLE: "shuffle",
  DEAL: "deal",
  TURN: "turn",
  TIMER: "timer",
  DECLARE: "declare",
  WIN: "win",
  LOSE: "lose",
  ERROR: "error",
  NOTIFICATION: "notification"
});

const DEFAULT_AUDIO_SETTINGS = Object.freeze({
  enabled: true,
  musicEnabled: true,
  effectsEnabled: true,
  masterVolume: 0.75,
  musicVolume: 0.35,
  effectsVolume: 0.8,
  fadeDuration: 700,
  storageKey: "super_rummy_audio_settings_v1"
});

class AudioManager {
  constructor(options = {}) {
    this.settings = {
      ...DEFAULT_AUDIO_SETTINGS,
      ...options
    };

    this.audioContext = null;
    this.musicElement = null;
    this.musicFadeTimer = null;
    this.initialized = false;
    this.unlocked = false;
    this.destroyed = false;

    this.sounds = new Map();
    this.activeSources = new Set();

    this.settings = {
      ...this.settings,
      ...this.loadSettings()
    };

    this.boundUnlock = () => this.unlockAudio();
    this.boundVisibility = () => this.handleVisibility();

    this.registerBrowserEvents();
  }

  /* ---------------- INITIALIZATION ---------------- */

  initialize() {
    if (this.destroyed) return false;

    if (this.initialized) return true;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.warn("[SUPER RUMMY AUDIO] Initialization failed:", error);
      return false;
    }
  }

  registerBrowserEvents() {
    if (typeof window === "undefined") return;

    const unlockEvents = [
      "pointerdown",
      "touchstart",
      "keydown"
    ];

    unlockEvents.forEach(eventName => {
      window.addEventListener(
        eventName,
        this.boundUnlock,
        { passive: true }
      );
    });

    document.addEventListener(
      "visibilitychange",
      this.boundVisibility
    );
  }

  async unlockAudio() {
    if (this.unlocked || this.destroyed) return true;

    this.initialize();

    try {
      if (
        this.audioContext &&
        this.audioContext.state === "suspended"
      ) {
        await this.audioContext.resume();
      }

      this.unlocked = true;

      return true;
    } catch (error) {
      console.warn("[SUPER RUMMY AUDIO] Unlock failed:", error);
      return false;
    }
  }

  /* ---------------- SOUND REGISTRATION ---------------- */

  registerSound(name, source, options = {}) {
    if (!name || !source) return false;

    this.sounds.set(name, {
      source,
      volume: this.clamp(options.volume ?? 1, 0, 1),
      loop: Boolean(options.loop),
      category: options.category || "effects",
      preload: options.preload !== false
    });

    return true;
  }

  registerSounds(soundList = {}) {
    Object.entries(soundList).forEach(([name, config]) => {
      if (typeof config === "string") {
        this.registerSound(name, config);
      } else {
        this.registerSound(
          name,
          config.source,
          config
        );
      }
    });

    return this.sounds.size;
  }

  /* ---------------- SOUND PLAYBACK ---------------- */

  async play(name, options = {}) {
    if (
      this.destroyed ||
      !this.settings.enabled ||
      !this.settings.effectsEnabled
    ) {
      return false;
    }

    const sound = this.sounds.get(name);

    if (!sound) {
      console.warn(`[SUPER RUMMY AUDIO] Sound not found: ${name}`);
      return false;
    }

    const unlocked = await this.unlockAudio();

    if (!unlocked) return false;

    try {
      const audio = new Audio(sound.source);

      audio.preload = "auto";
      audio.loop = options.loop ?? sound.loop;

      const volume =
        options.volume ?? sound.volume;

      audio.volume = this.calculateVolume(
        volume,
        "effects"
      );

      this.activeSources.add(audio);

      const cleanup = () => {
        this.activeSources.delete(audio);
      };

      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener("error", cleanup, { once: true });

      await audio.play();

      return audio;
    } catch (error) {
      console.warn(`[SUPER RUMMY AUDIO] Playback failed: ${name}`, error);
      return false;
    }
  }

  playEffect(eventName, options = {}) {
    const soundName = AUDIO_EVENTS[eventName] || eventName;
    return this.play(soundName, options);
  }

  /* ---------------- BACKGROUND MUSIC ---------------- */

  async playMusic(source, options = {}) {
    if (
      this.destroyed ||
      !this.settings.enabled ||
      !this.settings.musicEnabled ||
      !source
    ) {
      return false;
    }

    const unlocked = await this.unlockAudio();

    if (!unlocked) return false;

    this.stopMusic();

    try {
      const music = new Audio(source);

      music.loop = options.loop !== false;
      music.preload = "auto";
      music.volume = 0;

      this.musicElement = music;

      await music.play();

      this.fadeMusicTo(
        this.calculateVolume(
          options.volume ?? 1,
          "music"
        ),
        options.fadeDuration ?? this.settings.fadeDuration
      );

      return true;
    } catch (error) {
      console.warn("[SUPER RUMMY AUDIO] Music playback failed:", error);
      this.musicElement = null;
      return false;
    }
  }

  stopMusic(options = {}) {
    if (!this.musicElement) return;

    const music = this.musicElement;

    if (options.fade === false) {
      music.pause();
      music.currentTime = 0;
      this.musicElement = null;
      return;
    }

    this.fadeMusicTo(0, options.fadeDuration ?? 300);

    const duration = options.fadeDuration ?? 300;

    setTimeout(() => {
      if (music !== this.musicElement) {
        music.pause();
        music.currentTime = 0;
      }
    }, duration + 50);

    this.musicElement = null;
  }

  pauseMusic() {
    if (this.musicElement) {
      this.musicElement.pause();
    }
  }

  resumeMusic() {
    if (
      this.musicElement &&
      this.settings.enabled &&
      this.settings.musicEnabled
    ) {
      return this.musicElement.play().catch(() => false);
    }

    return false;
  }

  fadeMusicTo(targetVolume, duration = 700) {
    if (!this.musicElement) return;

    if (this.musicFadeTimer) {
      clearInterval(this.musicFadeTimer);
    }

    const music = this.musicElement;
    const target = this.clamp(targetVolume, 0, 1);
    const start = music.volume;
    const steps = 20;
    const interval = Math.max(10, duration / steps);
    let currentStep = 0;

    this.musicFadeTimer = setInterval(() => {
      if (music !== this.musicElement) {
        clearInterval(this.musicFadeTimer);
        this.musicFadeTimer = null;
        return;
      }

      currentStep++;

      const progress = Math.min(currentStep / steps, 1);

      music.volume = this.clamp(
        start + (target - start) * progress,
        0,
        1
      );

      if (progress >= 1) {
        clearInterval(this.musicFadeTimer);
        this.musicFadeTimer = null;
      }
    }, interval);
  }

  /* ---------------- VOLUME CONTROL ---------------- */

  calculateVolume(soundVolume, category) {
    const categoryVolume =
      category === "music"
        ? this.settings.musicVolume
        : this.settings.effectsVolume;

    return this.clamp(
      soundVolume *
      categoryVolume *
      this.settings.masterVolume,
      0,
      1
    );
  }

  setMasterVolume(value) {
    this.settings.masterVolume = this.clamp(value, 0, 1);
    this.updateActiveVolumes();
    this.saveSettings();
  }

  setMusicVolume(value) {
    this.settings.musicVolume = this.clamp(value, 0, 1);

    if (this.musicElement) {
      this.musicElement.volume = this.calculateVolume(
        1,
        "music"
      );
    }

    this.saveSettings();
  }

  setEffectsVolume(value) {
    this.settings.effectsVolume = this.clamp(value, 0, 1);
    this.saveSettings();
  }

  updateActiveVolumes() {
    this.activeSources.forEach(audio => {
      audio.volume = this.calculateVolume(1, "effects");
    });

    if (this.musicElement) {
      this.musicElement.volume = this.calculateVolume(
        1,
        "music"
      );
    }
  }

  /* ---------------- TOGGLES ---------------- */

  setEnabled(enabled) {
    this.settings.enabled = Boolean(enabled);

    if (!this.settings.enabled) {
      this.stopAll();
    }

    this.saveSettings();
  }

  setMusicEnabled(enabled) {
    this.settings.musicEnabled = Boolean(enabled);

    if (!enabled) {
      this.stopMusic();
    }

    this.saveSettings();
  }

  setEffectsEnabled(enabled) {
    this.settings.effectsEnabled = Boolean(enabled);

    if (!enabled) {
      this.stopEffects();
    }

    this.saveSettings();
  }

  toggleMaster() {
    this.setEnabled(!this.settings.enabled);
    return this.settings.enabled;
  }

  toggleMusic() {
    this.setMusicEnabled(!this.settings.musicEnabled);
    return this.settings.musicEnabled;
  }

  toggleEffects() {
    this.setEffectsEnabled(!this.settings.effectsEnabled);
    return this.settings.effectsEnabled;
  }

  /* ---------------- STOP CONTROLS ---------------- */

  stopEffects() {
    this.activeSources.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    this.activeSources.clear();
  }

  stopAll() {
    this.stopEffects();
    this.stopMusic({ fade: false });
  }

  /* ---------------- BROWSER VISIBILITY ---------------- */

  handleVisibility() {
    if (document.hidden) {
      this.pauseMusic();
      this.stopEffects();
    } else {
      this.resumeMusic();
    }
  }

  /* ---------------- SETTINGS STORAGE ---------------- */

  loadSettings() {
    try {
      const saved = localStorage.getItem(
        this.settings?.storageKey ||
        DEFAULT_AUDIO_SETTINGS.storageKey
      );

      if (!saved) return {};

      const parsed = JSON.parse(saved);

      if (!parsed || typeof parsed !== "object") {
        return {};
      }

      return {
        enabled: Boolean(parsed.enabled),
        musicEnabled: Boolean(parsed.musicEnabled),
        effectsEnabled: Boolean(parsed.effectsEnabled),
        masterVolume: this.clamp(parsed.masterVolume, 0, 1),
        musicVolume: this.clamp(parsed.musicVolume, 0, 1),
        effectsVolume: this.clamp(parsed.effectsVolume, 0, 1)
      };
    } catch {
      return {};
    }
  }

  saveSettings() {
    try {
      const data = {
        enabled: this.settings.enabled,
        musicEnabled: this.settings.musicEnabled,
        effectsEnabled: this.settings.effectsEnabled,
        masterVolume: this.settings.masterVolume,
        musicVolume: this.settings.musicVolume,
        effectsVolume: this.settings.effectsVolume
      };

      localStorage.setItem(
        this.settings.storageKey,
        JSON.stringify(data)
      );

      return true;
    } catch (error) {
      console.warn("[SUPER RUMMY AUDIO] Settings save failed:", error);
      return false;
    }
  }

  getSettings() {
    return { ...this.settings };
  }

  getStatus() {
    return {
      initialized: this.initialized,
      unlocked: this.unlocked,
      musicPlaying: Boolean(
        this.musicElement && !this.musicElement.paused
      ),
      activeEffects: this.activeSources.size,
      settings: this.getSettings()
    };
  }

  /* ---------------- UTILITIES ---------------- */

  clamp(value, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.min(max, Math.max(min, number));
  }

  destroy() {
    if (this.destroyed) return;

    this.stopAll();

    if (typeof window !== "undefined") {
      ["pointerdown", "touchstart", "keydown"].forEach(eventName => {
        window.removeEventListener(
          eventName,
          this.boundUnlock
        );
      });

      document.removeEventListener(
        "visibilitychange",
        this.boundVisibility
      );
    }

    if (this.musicFadeTimer) {
      clearInterval(this.musicFadeTimer);
    }

    if (
      this.audioContext &&
      this.audioContext.state !== "closed"
    ) {
      this.audioContext.close().catch(() => {});
    }

    this.sounds.clear();
    this.initialized = false;
    this.destroyed = true;
  }
}

/* ---------------- FACTORY ---------------- */

function createAudioManager(options = {}) {
  return new AudioManager(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  AUDIO_EVENTS,
  DEFAULT_AUDIO_SETTINGS,
  AudioManager,
  createAudioManager
};

/* =============== FILE ENDING =============== */
    
