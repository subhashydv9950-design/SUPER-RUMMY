
/* =========================================================
   SUPER RUMMY — GAME HISTORY SCREEN
   FILE: js/ui/game-history-screen.js
   ========================================================= */

const HISTORY_STORAGE_KEY = "super_rummy_game_history";
const MAX_HISTORY_ITEMS = 100;

function readHistory() {
  try {
    const data = JSON.parse(
      localStorage.getItem(HISTORY_STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeHistory(history) {
  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS))
    );
    return true;
  } catch {
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export class GameHistoryScreen {
  constructor(options = {}) {
    this.container = options.container || null;
    this.onBack = options.onBack || (() => {});
    this.history = readHistory();
    this.filter = "all";
    this.element = null;
  }

  static saveResult(result = {}) {
    if (!result || typeof result !== "object") {
      return false;
    }

    const history = readHistory();

    const entry = {
      id: result.id || (
        "game_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8)
      ),
      mode: String(result.mode || "Practice"),
      status: result.status === "won" ? "won" : "completed",
      score: Math.max(0, Number(result.score) || 0),
      players: Math.max(1, Number(result.players) || 1),
      duration: Math.max(0, Number(result.duration) || 0),
      playedAt: result.playedAt || new Date().toISOString()
    };

    history.unshift(entry);

    return writeHistory(history);
  }

  mount(container = this.container) {
    if (!container) {
      throw new Error("GameHistoryScreen requires a container.");
    }

    this.container = container;
    this.history = readHistory();

    this.render();
    this.bindEvents();

    return this;
  }

  getFilteredHistory() {
    if (this.filter === "won") {
      return this.history.filter(item => item.status === "won");
    }

    if (this.filter === "completed") {
      return this.history.filter(item => item.status === "completed");
    }

    return this.history;
  }

  render() {
    if (!this.container) return;

    const records = this.getFilteredHistory();

    this.container.innerHTML = `
      <section class="sr-history-screen">

        <header class="sr-history-header">
          <button
            type="button"
            class="sr-history-back"
            data-action="back"
            aria-label="Go back"
          >←</button>

          <div>
            <p class="sr-history-eyebrow">SUPER RUMMY</p>
            <h1>Game History</h1>
            <p class="sr-history-subtitle">
              Your recent game records
            </p>
          </div>
        </header>

        <div class="sr-history-content">

          <div class="sr-history-stats">
            <div class="sr-history-stat">
              <strong>${this.history.length}</strong>
              <span>Total Games</span>
            </div>

            <div class="sr-history-stat">
              <strong>${this.history.filter(
                item => item.status === "won"
              ).length}</strong>
              <span>Wins</span>
            </div>

            <div class="sr-history-stat">
              <strong>${this.history.reduce(
                (total, item) => total + item.score,
                0
              )}</strong>
              <span>Total Score</span>
            </div>
          </div>

          <div class="sr-history-filters">
            <button
              type="button"
              data-filter="all"
              class="${this.filter === "all" ? "active" : ""}"
            >All</button>

            <button
              type="button"
              data-filter="won"
              class="${this.filter === "won" ? "active" : ""}"
            >Wins</button>

            <button
              type="button"
              data-filter="completed"
              class="${this.filter === "completed" ? "active" : ""}"
            >Completed</button>
          </div>

          <div class="sr-history-list">
            ${
              records.length
                ? records.map(item => this.renderRecord(item)).join("")
                : `
                  <div class="sr-history-empty">
                    <div>🃏</div>
                    <h3>No Games Found</h3>
                    <p>Your completed games will appear here.</p>
                  </div>
                `
            }
          </div>

          ${
            this.history.length
              ? `
                <button
                  type="button"
                  class="sr-history-clear"
                  data-action="clear"
                >Clear Game History</button>
              `
              : ""
          }

        </div>
      </section>
    `;

    this.element = this.container.querySelector(
      ".sr-history-screen"
    );
  }

  renderRecord(item) {
    const won = item.status === "won";

    return `
      <article class="sr-history-record">
        <div class="sr-history-record-top">
          <div>
            <h3>${escapeHTML(item.mode)}</h3>
            <p>${escapeHTML(formatDate(item.playedAt))}</p>
          </div>

          <span class="sr-history-status ${won ? "won" : "completed"}">
            ${won ? "WIN" : "COMPLETED"}
          </span>
        </div>

        <div class="sr-history-details">
          <span>👥 ${escapeHTML(item.players)} Players</span>
          <span>🏆 Score: ${escapeHTML(item.score)}</span>
          <span>⏱ ${escapeHTML(item.duration)} sec</span>
        </div>
      </article>
    `;
  }

  bindEvents() {
    if (!this.element) return;

    this.handleClick = event => {
      const filterButton = event.target.closest("[data-filter]");

      if (filterButton) {
        this.filter = filterButton.dataset.filter;
        this.render();
        return;
      }

      const actionButton = event.target.closest("[data-action]");

      if (!actionButton) return;

      if (actionButton.dataset.action === "back") {
        this.onBack();
      }

      if (actionButton.dataset.action === "clear") {
        this.clearHistory();
      }
    };

    this.element.addEventListener(
      "click",
      this.handleClick
    );
  }

  clearHistory() {
    const confirmed = window.confirm(
      "Clear all saved game history?"
    );

    if (!confirmed) return false;

    this.history = [];
    this.filter = "all";

    const saved = writeHistory([]);

    this.render();
    this.bindEvents();

    return saved;
  }

  refresh() {
    this.history = readHistory();
    this.render();
    this.bindEvents();
  }

  destroy() {
    if (this.element && this.handleClick) {
      this.element.removeEventListener(
        "click",
        this.handleClick
      );
    }

    if (this.container) {
      this.container.innerHTML = "";
    }

    this.element = null;
  }
}

/* ================= FILE ENDING ================= */
