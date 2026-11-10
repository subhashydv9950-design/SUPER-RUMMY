
/* =========================================================
   SUPER RUMMY — SETTINGS SCREEN
   FILE: js/ui/settings-screen.js
   ========================================================= */

export const DEFAULT_GAME_SETTINGS = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  animationsEnabled: true,
  autoSort: true,
  confirmExit: true,
  theme: "classic",
  cardStyle: "classic"
};

const SETTINGS_STORAGE_KEY = "super_rummy_game_settings";

function safeReadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!saved) return { ...DEFAULT_GAME_SETTINGS };

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_GAME_SETTINGS,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

function safeSaveSettings(settings) {
  try {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings)
    );
    return true;
  } catch {
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

export class SettingsScreen {
  constructor(options = {}) {
    this.container = options.container || null;
    this.onBack = options.onBack || (() => {});
    this.onSettingsChange =
      options.onSettingsChange || (() => {});

    this.settings = safeReadSettings();
    this.element = null;
    this.destroyed = false;
  }

  mount(container = this.container) {
    if (!container) {
      throw new Error("SettingsScreen requires a container.");
    }

    this.container = container;
    this.destroyed = false;

    this.render();
    this.bindEvents();

    return this;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <section class="sr-settings-screen">

        <header class="sr-settings-header">
          <button
            class="sr-settings-back"
            type="button"
            data-action="back"
            aria-label="Go back"
          >←</button>

          <div>
            <p class="sr-settings-eyebrow">SUPER RUMMY</p>
            <h1>Settings</h1>
            <p class="sr-settings-subtitle">
              Customize your game experience
            </p>
          </div>
        </header>

        <div class="sr-settings-content">

          <section class="sr-settings-group">
            <h2>Sound & Feedback</h2>

            ${this.renderToggle(
              "soundEnabled",
              "Sound Effects",
              "Card clicks and game sounds",
              "🔊"
            )}

            ${this.renderToggle(
              "musicEnabled",
              "Background Music",
              "Music during gameplay",
              "🎵"
            )}

            ${this.renderToggle(
              "vibrationEnabled",
              "Vibration",
              "Device vibration feedback",
              "📳"
            )}
          </section>

          <section class="sr-settings-group">
            <h2>Gameplay</h2>

            ${this.renderToggle(
              "animationsEnabled",
              "Animations",
              "Card and screen animations",
              "✨"
            )}

            ${this.renderToggle(
              "autoSort",
              "Auto Sort Cards",
              "Automatically organize your hand",
              "🃏"
            )}

            ${this.renderToggle(
              "confirmExit",
              "Confirm Before Exit",
              "Ask before leaving an active game",
              "⚠️"
            )}
          </section>

          <section class="sr-settings-group">
            <h2>Appearance</h2>

            <div class="sr-settings-option">
              <div class="sr-settings-option-info">
                <span class="sr-settings-icon">🎨</span>
                <div>
                  <strong>Table Theme</strong>
                  <small>Choose your table appearance</small>
                </div>
              </div>

              <select
                class="sr-settings-select"
                data-setting="theme"
                aria-label="Table Theme"
              >
                <option value="classic">Classic Green</option>
                <option value="royal">Royal Gold</option>
                <option value="midnight">Midnight</option>
                <option value="blue">Ocean Blue</option>
              </select>
            </div>

            <div class="sr-settings-option">
              <div class="sr-settings-option-info">
                <span class="sr-settings-icon">🂡</span>
                <div>
                  <strong>Card Style</strong>
                  <small>Choose your card design</small>
                </div>
              </div>

              <select
                class="sr-settings-select"
                data-setting="cardStyle"
                aria-label="Card Style"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="royal">Royal</option>
              </select>
            </div>
          </section>

          <div class="sr-settings-footer">
            <button
              class="sr-settings-reset"
              type="button"
              data-action="reset"
            >Reset to Default</button>

            <p>SUPER RUMMY · Settings</p>
          </div>

        </div>
      </section>
    `;

    this.element = this.container.querySelector(
      ".sr-settings-screen"
    );

    this.syncControls();
  }

  renderToggle(key, title, description, icon) {
    const checked = this.settings[key] ? "checked" : "";

    return `
      <label class="sr-settings-option">
        <div class="sr-settings-option-info">
          <span class="sr-settings-icon">
            ${escapeHTML(icon)}
          </span>

          <div>
            <strong>${escapeHTML(title)}</strong>
            <small>${escapeHTML(description)}</small>
          </div>
        </div>

        <input
          class="sr-settings-toggle"
          type="checkbox"
          data-setting="${escapeHTML(key)}"
          ${checked}
        />

        <span class="sr-settings-switch"></span>
      </label>
    `;
  }

  bindEvents() {
    if (!this.element) return;

    this.handleClick = event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const action = button.dataset.action;

      if (action === "back") {
        this.onBack();
      }

      if (action === "reset") {
        this.resetSettings();
      }
    };

    this.handleChange = event => {
      const control = event.target.closest("[data-setting]");
      if (!control) return;

      const key = control.dataset.setting;

      if (!(key in DEFAULT_GAME_SETTINGS)) return;

      let value;

      if (control.type === "checkbox") {
        value = control.checked;
      } else {
        value = control.value;
      }

      this.updateSetting(key, value);
    };

    this.element.addEventListener(
      "click",
      this.handleClick
    );

    this.element.addEventListener(
      "change",
      this.handleChange
    );
  }

  syncControls() {
    if (!this.element) return;

    Object.entries(this.settings).forEach(([key, value]) => {
      const control = this.element.querySelector(
        `[data-setting="${key}"]`
      );

      if (!control) return;

      if (control.type === "checkbox") {
        control.checked = Boolean(value);
      } else {
        control.value = value;
      }
    });
  }

  updateSetting(key, value) {
    if (!(key in DEFAULT_GAME_SETTINGS)) return false;

    this.settings[key] = value;

    const saved = safeSaveSettings(this.settings);

    this.onSettingsChange({
      key,
      value,
      settings: this.getSettings(),
      saved
    });

    return saved;
  }

  resetSettings() {
    this.settings = { ...DEFAULT_GAME_SETTINGS };

    safeSaveSettings(this.settings);
    this.syncControls();

    this.onSettingsChange({
      key: "reset",
      value: null,
      settings: this.getSettings(),
      saved: true
    });
  }

  getSettings() {
    return { ...this.settings };
  }

  setSettings(newSettings = {}) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };

    safeSaveSettings(this.settings);
    this.syncControls();

    return this.getSettings();
  }

  destroy() {
    if (this.element) {
      this.element.removeEventListener(
        "click",
        this.handleClick
      );

      this.element.removeEventListener(
        "change",
        this.handleChange
      );
    }

    if (this.container) {
      this.container.innerHTML = "";
    }

    this.element = null;
    this.destroyed = true;
  }
}

/* ================= FILE ENDING ================= */
