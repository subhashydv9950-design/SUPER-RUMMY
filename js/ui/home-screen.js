
/* =========================================================
   SUPER RUMMY
   FILE 63: home-screen.js
   PATH: js/ui/home-screen.js
   PURPOSE: Main Home Screen UI
   ========================================================= */

export const HOME_SCREEN_ERRORS = {
  INVALID_CONTAINER: "A valid home screen container is required.",
  INVALID_ACTION: "Invalid home screen action."
};

export const HOME_GAME_MODES = [
  {
    id: "practice",
    title: "Practice",
    subtitle: "Play against AI opponents",
    icon: "♟",
    players: "1 Player + AI"
  },
  {
    id: "points",
    title: "Points Rummy",
    subtitle: "Quick 13-card Rummy rounds",
    icon: "◆",
    players: "2–4 Players"
  },
  {
    id: "pool101",
    title: "Pool 101",
    subtitle: "Classic Pool Rummy format",
    icon: "♠",
    players: "2–4 Players"
  },
  {
    id: "pool201",
    title: "Pool 201",
    subtitle: "Extended Pool Rummy format",
    icon: "♥",
    players: "2–4 Players"
  },
  {
    id: "deals",
    title: "Deals Rummy",
    subtitle: "Play a fixed number of deals",
    icon: "♣",
    players: "2–4 Players"
  },
  {
    id: "private",
    title: "Private Room",
    subtitle: "Create or join a private room",
    icon: "⌂",
    players: "Invite Friends"
  }
];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function createElement(tag, className, content = "") {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (content !== "") {
    element.textContent = content;
  }

  return element;
}

export class HomeScreen {
  constructor(options = {}) {
    this.container = options.container || null;

    this.onPlay = options.onPlay || (() => {});
    this.onModeSelect = options.onModeSelect || (() => {});
    this.onProfile = options.onProfile || (() => {});
    this.onSettings = options.onSettings || (() => {});
    this.onAbout = options.onAbout || (() => {});

    this.playerName = options.playerName || "Guest Player";
    this.level = Number(options.level) || 1;
    this.xp = Math.max(0, Number(options.xp) || 0);

    this.selectedMode = "practice";
    this.isMounted = false;

    this.handleClick = this.handleClick.bind(this);
  }

  mount() {
    if (!this.container || !this.container.appendChild) {
      throw new Error(HOME_SCREEN_ERRORS.INVALID_CONTAINER);
    }

    this.container.innerHTML = "";
    this.container.classList.add("sr-home-screen");

    this.container.innerHTML = `
      <main class="sr-home-layout">

        <header class="sr-home-header">

          <div class="sr-home-brand">
            <div class="sr-home-logo">SR</div>

            <div class="sr-home-brand-text">
              <h1>SUPER RUMMY</h1>
              <span>THE CLASSIC CARD EXPERIENCE</span>
            </div>
          </div>

          <div class="sr-home-header-actions">
            <button
              class="sr-home-icon-button"
              type="button"
              data-action="profile"
              aria-label="Open profile"
            >♙</button>

            <button
              class="sr-home-icon-button"
              type="button"
              data-action="settings"
              aria-label="Open settings"
            >⚙</button>
          </div>

        </header>

        <section class="sr-home-welcome">

          <div class="sr-home-welcome-copy">
            <span class="sr-home-eyebrow">WELCOME BACK</span>

            <h2>
              <span data-player-name></span>
            </h2>

            <p>Your next classic Rummy experience awaits.</p>
          </div>

          <div class="sr-home-level">
            <span>LEVEL</span>
            <strong data-player-level></strong>
            <small data-player-xp></small>
          </div>

        </section>

        <section class="sr-home-feature">

          <div class="sr-home-feature-content">
            <span class="sr-home-eyebrow">READY TO PLAY?</span>
            <h2>LET THE GAME BEGIN</h2>
            <p>Enjoy classic Indian 13-card Rummy.</p>

            <button
              class="sr-home-play-button"
              type="button"
              data-action="play"
            >
              PLAY NOW <span aria-hidden="true">→</span>
            </button>
          </div>

          <div class="sr-home-feature-art" aria-hidden="true">
            <span class="sr-home-card-art sr-home-card-one">A♠</span>
            <span class="sr-home-card-art sr-home-card-two">K♥</span>
            <span class="sr-home-card-art sr-home-card-three">Q♦</span>
          </div>

        </section>

        <section class="sr-home-modes">

          <div class="sr-home-section-heading">
            <div>
              <span class="sr-home-eyebrow">CHOOSE YOUR STYLE</span>
              <h2>GAME MODES</h2>
            </div>

            <span class="sr-home-mode-count">6 MODES</span>
          </div>

          <div class="sr-home-mode-grid">
            ${HOME_GAME_MODES.map(mode => `
              <button
                class="sr-home-mode-card"
                type="button"
                data-mode="${escapeHTML(mode.id)}"
                aria-pressed="${mode.id === this.selectedMode}"
              >
                <span class="sr-home-mode-icon" aria-hidden="true">
                  ${escapeHTML(mode.icon)}
                </span>

                <span class="sr-home-mode-title">
                  ${escapeHTML(mode.title)}
                </span>

                <span class="sr-home-mode-subtitle">
                  ${escapeHTML(mode.subtitle)}
                </span>

                <span class="sr-home-mode-players">
                  ${escapeHTML(mode.players)}
                </span>
              </button>
            `).join("")}
          </div>

        </section>

        <footer class="sr-home-footer">

          <span>SUPER RUMMY</span>

          <button
            type="button"
            data-action="about"
          >ABOUT</button>

          <span>FREE-TO-PLAY ENTERTAINMENT</span>

        </footer>

      </main>
    `;

    this.container.addEventListener("click", this.handleClick);

    this.updatePlayer({
      name: this.playerName,
      level: this.level,
      xp: this.xp
    });

    this.isMounted = true;

    return this;
  }

  handleClick(event) {
    const button = event.target.closest("button");

    if (!button || !this.container.contains(button)) {
      return;
    }

    const action = button.dataset.action;

    if (action) {
      switch (action) {
        case "play":
          this.onPlay({
            mode: this.selectedMode
          });
          break;

        case "profile":
          this.onProfile();
          break;

        case "settings":
          this.onSettings();
          break;

        case "about":
          this.onAbout();
          break;

        default:
          break;
      }

      return;
    }

    const modeId = button.dataset.mode;

    if (modeId) {
      this.selectMode(modeId);
    }
  }

  selectMode(modeId) {
    const mode = HOME_GAME_MODES.find(item => item.id === modeId);

    if (!mode) {
      return {
        success: false,
        error: HOME_SCREEN_ERRORS.INVALID_ACTION
      };
    }

    this.selectedMode = modeId;

    this.container
      .querySelectorAll("[data-mode]")
      .forEach(button => {
        const selected = button.dataset.mode === modeId;

        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });

    this.onModeSelect({
      mode: mode.id,
      title: mode.title
    });

    return {
      success: true,
      mode: mode.id
    };
  }

  updatePlayer(data = {}) {
    if (data.name !== undefined) {
      this.playerName = String(data.name || "Guest Player");
    }

    if (data.level !== undefined) {
      this.level = Math.max(1, Number(data.level) || 1);
    }

    if (data.xp !== undefined) {
      this.xp = Math.max(0, Number(data.xp) || 0);
    }

    if (!this.container) return;

    const nameElement = this.container.querySelector("[data-player-name]");
    const levelElement = this.container.querySelector("[data-player-level]");
    const xpElement = this.container.querySelector("[data-player-xp]");

    if (nameElement) {
      nameElement.textContent = this.playerName;
    }

    if (levelElement) {
      levelElement.textContent = String(this.level);
    }

    if (xpElement) {
      xpElement.textContent = `${this.xp} XP`;
    }
  }

  getSelectedMode() {
    return this.selectedMode;
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener("click", this.handleClick);
      this.container.innerHTML = "";
      this.container.classList.remove("sr-home-screen");
    }

    this.isMounted = false;
  }
}

export function createHomeScreen(options = {}) {
  return new HomeScreen(options);
}

/* ================= FILE ENDING ================= */
