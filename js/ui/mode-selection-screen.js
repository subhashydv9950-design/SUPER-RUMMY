
/* =========================================================
   SUPER RUMMY
   FILE 65: mode-selection-screen.js
   PATH: js/ui/mode-selection-screen.js
   PURPOSE: Game Mode and Match Configuration
   ========================================================= */

export const MODE_SELECTION_ERRORS = {
  INVALID_CONTAINER: "A valid screen container is required.",
  INVALID_MODE: "Please select a valid game mode.",
  INVALID_PLAYER_COUNT: "Player count must be between 2 and 4.",
  INVALID_DIFFICULTY: "Please select a valid AI difficulty.",
  INVALID_DEALS: "Deals must be between 1 and 10."
};

export const MODE_OPTIONS = [
  {
    id: "practice",
    name: "Practice",
    description: "Play against computer opponents",
    minPlayers: 2,
    maxPlayers: 4,
    ai: true
  },
  {
    id: "points",
    name: "Points Rummy",
    description: "Quick rounds of classic Rummy",
    minPlayers: 2,
    maxPlayers: 4,
    ai: false
  },
  {
    id: "pool101",
    name: "Pool 101",
    description: "Play until the pool limit is reached",
    minPlayers: 2,
    maxPlayers: 4,
    ai: false
  },
  {
    id: "pool201",
    name: "Pool 201",
    description: "Extended Pool Rummy format",
    minPlayers: 2,
    maxPlayers: 4,
    ai: false
  },
  {
    id: "deals",
    name: "Deals Rummy",
    description: "Play a fixed number of deals",
    minPlayers: 2,
    maxPlayers: 4,
    ai: false
  },
  {
    id: "private",
    name: "Private Room",
    description: "Set up a room for invited players",
    minPlayers: 2,
    maxPlayers: 4,
    ai: false
  }
];

export const AI_DIFFICULTY_OPTIONS = [
  { id: "easy", name: "Easy" },
  { id: "medium", name: "Medium" },
  { id: "hard", name: "Hard" }
];

function makeElement(tag, className, text = "") {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text) element.textContent = text;

  return element;
}

export class ModeSelectionScreen {
  constructor(options = {}) {
    this.container = options.container || null;

    this.onStart = options.onStart || (() => {});
    this.onBack = options.onBack || (() => {});
    this.onPrivateRoom = options.onPrivateRoom || (() => {});

    this.mode = options.mode || "practice";
    this.playerCount = 2;
    this.difficulty = "medium";
    this.deals = 3;

    this.root = null;
    this.isMounted = false;

    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  mount() {
    if (!this.container || !this.container.appendChild) {
      throw new Error(MODE_SELECTION_ERRORS.INVALID_CONTAINER);
    }

    this.container.innerHTML = "";

    this.root = makeElement("main", "sr-mode-selection");

    this.root.innerHTML = `
      <header class="sr-mode-header">
        <button type="button" data-action="back"
          class="sr-mode-back" aria-label="Go back">←</button>

        <div>
          <span class="sr-mode-eyebrow">SUPER RUMMY</span>
          <h1>Choose Your Game</h1>
        </div>
      </header>

      <section class="sr-mode-options">
        <h2>SELECT GAME MODE</h2>
        <div class="sr-mode-grid">
          ${MODE_OPTIONS.map(mode => `
            <button
              type="button"
              class="sr-mode-option"
              data-mode="${mode.id}"
              aria-pressed="${mode.id === this.mode}"
            >
              <span class="sr-mode-option-name">${mode.name}</span>
              <span class="sr-mode-option-description">${mode.description}</span>
            </button>
          `).join("")}
        </div>
      </section>

      <section class="sr-mode-settings">
        <h2>MATCH SETTINGS</h2>

        <label class="sr-mode-field">
          <span>Number of Players</span>
          <select data-setting="players">
            <option value="2">2 Players</option>
            <option value="3">3 Players</option>
            <option value="4">4 Players</option>
          </select>
        </label>

        <label class="sr-mode-field" data-ai-setting>
          <span>AI Difficulty</span>
          <select data-setting="difficulty">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label class="sr-mode-field" data-deals-setting hidden>
          <span>Number of Deals</span>
          <select data-setting="deals">
            <option value="1">1 Deal</option>
            <option value="2">2 Deals</option>
            <option value="3" selected>3 Deals</option>
            <option value="5">5 Deals</option>
            <option value="10">10 Deals</option>
          </select>
        </label>

        <div class="sr-mode-free-notice">
          FREE-TO-PLAY · NO REAL-MONEY WAGERING
        </div>
      </section>

      <button type="button" class="sr-mode-start" data-action="start">
        START GAME →
      </button>

      <p class="sr-mode-message" data-mode-message aria-live="polite"></p>
    `;

    this.container.appendChild(this.root);

    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("change", this.handleChange);

    this.updateModeUI();

    this.isMounted = true;
    return this;
  }

  handleClick(event) {
    const button = event.target.closest("button");

    if (!button || !this.root.contains(button)) return;

    if (button.dataset.action === "back") {
      this.onBack();
      return;
    }

    if (button.dataset.action === "start") {
      this.startGame();
      return;
    }

    if (button.dataset.mode) {
      this.selectMode(button.dataset.mode);
    }
  }

  handleChange(event) {
    const setting = event.target.dataset.setting;

    if (!setting) return;

    const value = event.target.value;

    if (setting === "players") {
      this.setPlayerCount(Number(value));
    }

    if (setting === "difficulty") {
      this.setDifficulty(value);
    }

    if (setting === "deals") {
      this.setDeals(Number(value));
    }
  }

  selectMode(modeId) {
    const mode = MODE_OPTIONS.find(item => item.id === modeId);

    if (!mode) {
      return {
        success: false,
        error: MODE_SELECTION_ERRORS.INVALID_MODE
      };
    }

    this.mode = modeId;
    this.updateModeUI();

    return {
      success: true,
      mode: modeId
    };
  }

  setPlayerCount(count) {
    if (!Number.isInteger(count) || count < 2 || count > 4) {
      return {
        success: false,
        error: MODE_SELECTION_ERRORS.INVALID_PLAYER_COUNT
      };
    }

    this.playerCount = count;
    return { success: true, playerCount: count };
  }

  setDifficulty(difficulty) {
    const valid = AI_DIFFICULTY_OPTIONS.some(
      item => item.id === difficulty
    );

    if (!valid) {
      return {
        success: false,
        error: MODE_SELECTION_ERRORS.INVALID_DIFFICULTY
      };
    }

    this.difficulty = difficulty;
    return { success: true, difficulty };
  }

  setDeals(count) {
    if (![1, 2, 3, 5, 10].includes(count)) {
      return {
        success: false,
        error: MODE_SELECTION_ERRORS.INVALID_DEALS
      };
    }

    this.deals = count;
    return { success: true, deals: count };
  }

  updateModeUI() {
    if (!this.root) return;

    const mode = MODE_OPTIONS.find(item => item.id === this.mode);

    this.root.querySelectorAll("[data-mode]").forEach(button => {
      const selected = button.dataset.mode === this.mode;

      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    const aiSettings = this.root.querySelector("[data-ai-setting]");
    const dealsSettings = this.root.querySelector("[data-deals-setting]");
    const message = this.root.querySelector("[data-mode-message]");

    aiSettings.hidden = !mode.ai;
    dealsSettings.hidden = this.mode !== "deals";

    message.textContent = this.mode === "private"
      ? "Private Room setup will open next."
      : "";
  }

  getConfiguration() {
    return {
      mode: this.mode,
      playerCount: this.playerCount,
      difficulty: this.difficulty,
      deals: this.deals,
      cardsPerPlayer: 13,
      freeToPlay: true,
      realMoneyWagering: false
    };
  }

  startGame() {
    const mode = MODE_OPTIONS.find(item => item.id === this.mode);

    if (!mode) {
      return {
        success: false,
        error: MODE_SELECTION_ERRORS.INVALID_MODE
      };
    }

    if (this.playerCount < mode.minPlayers ||
        this.playerCount > mode.maxPlayers) {
      return {
        success: false,
        error: MODE_SELECTION_ERRORS.INVALID_PLAYER_COUNT
      };
    }

    const configuration = this.getConfiguration();

    if (this.mode === "private") {
      this.onPrivateRoom(configuration);

      return {
        success: true,
        action: "private-room",
        configuration
      };
    }

    this.onStart(configuration);

    return {
      success: true,
      action: "start-game",
      configuration
    };
  }

  destroy() {
    if (this.root) {
      this.root.removeEventListener("click", this.handleClick);
      this.root.removeEventListener("change", this.handleChange);
      this.root.remove();
    }

    this.root = null;
    this.isMounted = false;
  }
}

export function createModeSelectionScreen(options = {}) {
  return new ModeSelectionScreen(options);
}

/* ================= FILE ENDING ================= */
    
