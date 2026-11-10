
/* =========================================================
   SUPER RUMMY — AUDIO SETTINGS
   FILE: js/audio/audio-settings.js
   VERSION: 1.0.0
========================================================= */

const AUDIO_SETTINGS_DEFAULTS = Object.freeze({
  masterVolume: 0.75,
  musicVolume: 0.35,
  effectsVolume: 0.80,
  masterEnabled: true,
  musicEnabled: true,
  effectsEnabled: true
});

const AUDIO_SETTINGS_KEY = "super_rummy_audio_settings_v1";

class AudioSettings {
  constructor(options = {}) {
    this.storageKey = options.storageKey || AUDIO_SETTINGS_KEY;

    this.settings = {
      ...AUDIO_SETTINGS_DEFAULTS
    };

    this.listeners = new Set();

    this.load();
  }

  /* ---------------- GET SETTINGS ---------------- */

  getAll() {
    return { ...this.settings };
  }

  get(key) {
    return Object.hasOwn(this.settings, key)
      ? this.settings[key]
      : undefined;
  }

  /* ---------------- UPDATE SETTINGS ---------------- */

  set(key, value) {
    if (!Object.hasOwn(this.settings, key)) {
      return false;
    }

    if (key.toLowerCase().includes("volume")) {
      value = this.clamp(value, 0, 1);
    } else {
      value = Boolean(value);
    }

    if (this.settings[key] === value) {
      return true;
    }

    this.settings[key] = value;

    this.save();
    this.notify(key, value);

    return true;
  }

  setMasterVolume(value) {
    return this.set("masterVolume", value);
  }

  setMusicVolume(value) {
    return this.set("musicVolume", value);
  }

  setEffectsVolume(value) {
    return this.set("effectsVolume", value);
  }

  setMasterEnabled(value) {
    return this.set("masterEnabled", value);
  }

  setMusicEnabled(value) {
    return this.set("musicEnabled", value);
  }

  setEffectsEnabled(value) {
    return this.set("effectsEnabled", value);
  }

  /* ---------------- TOGGLES ---------------- */

  toggleMaster() {
    return this.toggle("masterEnabled");
  }

  toggleMusic() {
    return this.toggle("musicEnabled");
  }

  toggleEffects() {
    return this.toggle("effectsEnabled");
  }

  toggle(key) {
    if (typeof this.settings[key] !== "boolean") {
      return false;
    }

    return this.set(key, !this.settings[key]);
  }

  /* ---------------- PERSISTENCE ---------------- */

  save() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.settings)
      );

      return true;
    } catch (error) {
      console.warn(
        "[SUPER RUMMY] Audio settings save failed:",
        error
      );

      return false;
    }
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);

      if (!stored) return false;

      const parsed = JSON.parse(stored);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return false;
      }

      Object.keys(AUDIO_SETTINGS_DEFAULTS).forEach(key => {
        if (!Object.hasOwn(parsed, key)) return;

        const defaultValue = AUDIO_SETTINGS_DEFAULTS[key];

        if (typeof defaultValue === "number") {
          this.settings[key] = this.clamp(
            parsed[key],
            0,
            1
          );
        } else if (typeof parsed[key] === "boolean") {
          this.settings[key] = parsed[key];
        }
      });

      return true;
    } catch {
      return false;
    }
  }

  reset() {
    this.settings = {
      ...AUDIO_SETTINGS_DEFAULTS
    };

    this.save();

    this.notify("reset", this.getAll());

    return this.getAll();
  }

  /* ---------------- IMPORT / EXPORT ---------------- */

  exportSettings() {
    return JSON.stringify(
      this.settings,
      null,
      2
    );
  }

  importSettings(json) {
    try {
      const parsed = typeof json === "string"
        ? JSON.parse(json)
        : json;

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return false;
      }

      Object.keys(AUDIO_SETTINGS_DEFAULTS).forEach(key => {
        if (!Object.hasOwn(parsed, key)) return;

        const defaultValue = AUDIO_SETTINGS_DEFAULTS[key];

        if (typeof defaultValue === "number") {
          this.settings[key] = this.clamp(
            parsed[key],
            0,
            1
          );
        } else if (typeof parsed[key] === "boolean") {
          this.settings[key] = parsed[key];
        }
      });

      this.save();

      this.notify("import", this.getAll());

      return true;
    } catch {
      return false;
    }
  }

  /* ---------------- SUBSCRIPTIONS ---------------- */

  subscribe(callback) {
    if (typeof callback !== "function") {
      return () => {};
    }

    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  notify(key, value) {
    this.listeners.forEach(callback => {
      try {
        callback({
          key,
          value,
          settings: this.getAll()
        });
      } catch (error) {
        console.error(
          "[SUPER RUMMY] Audio settings listener error:",
          error
        );
      }
    });
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
    this.listeners.clear();
  }
}

/* ---------------- FACTORY ---------------- */

function createAudioSettings(options = {}) {
  return new AudioSettings(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  AUDIO_SETTINGS_DEFAULTS,
  AUDIO_SETTINGS_KEY,
  AudioSettings,
  createAudioSettings
};

/* =============== FILE ENDING =============== */
        
