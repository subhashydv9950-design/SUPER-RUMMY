
/* =========================================================
   SUPER RUMMY
   FILE 67: profile-screen.js
   PATH: js/ui/profile-screen.js
   PURPOSE: Player Profile Screen
   ========================================================= */

export const PROFILE_ERRORS = {
  INVALID_CONTAINER: "A valid profile container is required.",
  INVALID_DATA: "Invalid profile data."
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

const DEFAULT_PROFILE = {
  name: "Guest Player",
  playerId: "SR-GUEST-001",
  avatar: "",
  level: 1,
  xp: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  bestScore: 0,
  joinDate: "New Player"
};

export class ProfileScreen {
  constructor(options = {}) {
    this.container = options.container || null;

    this.onBack = options.onBack || (() => {});
    this.onEdit = options.onEdit || (() => {});
    this.onHistory = options.onHistory || (() => {});

    this.profile = {
      ...DEFAULT_PROFILE,
      ...(options.profile || {})
    };

    this.root = null;
    this.isMounted = false;

    this.handleClick = this.handleClick.bind(this);
  }

  mount() {
    if (!this.container || !this.container.appendChild) {
      throw new Error(PROFILE_ERRORS.INVALID_CONTAINER);
    }

    this.container.innerHTML = "";

    this.root = document.createElement("main");
    this.root.className = "sr-profile-screen";

    this.render();

    this.container.appendChild(this.root);
    this.root.addEventListener("click", this.handleClick);

    this.isMounted = true;
    return this;
  }

  render() {
    const profile = this.profile;

    const winRate = profile.gamesPlayed > 0
      ? Math.round(
          (profile.gamesWon / profile.gamesPlayed) * 100
        )
      : 0;

    const avatarMarkup = profile.avatar
      ? `<img src="${escapeHTML(profile.avatar)}"
          alt="Player avatar"
          class="sr-profile-avatar-image">`
      : `<span class="sr-profile-avatar-placeholder"
          aria-hidden="true">♙</span>`;

    this.root.innerHTML = `
      <header class="sr-profile-header">
        <button type="button" data-action="back"
          class="sr-profile-back" aria-label="Go back">←</button>

        <div>
          <span>SUPER RUMMY</span>
          <h1>My Profile</h1>
        </div>
      </header>

      <section class="sr-profile-hero">

        <div class="sr-profile-avatar">
          ${avatarMarkup}
        </div>

        <h2 data-profile-name></h2>

        <p class="sr-profile-id">
          PLAYER ID: <strong data-profile-id></strong>
        </p>

        <div class="sr-profile-level">
          <span>LEVEL</span>
          <strong data-profile-level></strong>
          <span data-profile-xp></span>
        </div>

        <button type="button"
          class="sr-profile-edit-button"
          data-action="edit">
          EDIT PROFILE
        </button>

      </section>

      <section class="sr-profile-statistics">

        <h2>GAME STATISTICS</h2>

        <div class="sr-profile-stat-grid">

          <article class="sr-profile-stat">
            <span>GAMES PLAYED</span>
            <strong data-stat="played"></strong>
          </article>

          <article class="sr-profile-stat">
            <span>GAMES WON</span>
            <strong data-stat="won"></strong>
          </article>

          <article class="sr-profile-stat">
            <span>WIN RATE</span>
            <strong data-stat="rate"></strong>
          </article>

          <article class="sr-profile-stat">
            <span>BEST SCORE</span>
            <strong data-stat="best"></strong>
          </article>

        </div>

      </section>

      <section class="sr-profile-details">

        <h2>PLAYER DETAILS</h2>

        <div class="sr-profile-detail-row">
          <span>Member Since</span>
          <strong data-profile-joined></strong>
        </div>

        <div class="sr-profile-detail-row">
          <span>Account Type</span>
          <strong>Guest</strong>
        </div>

        <div class="sr-profile-detail-row">
          <span>Game Type</span>
          <strong>Free-to-Play</strong>
        </div>

      </section>

      <button type="button"
        class="sr-profile-history-button"
        data-action="history">
        VIEW GAME HISTORY →
      </button>
    `;

    this.updateDisplay(winRate);
  }

  updateDisplay(winRate) {
    const profile = this.profile;

    const setText = (selector, value) => {
      const element = this.root.querySelector(selector);
      if (element) element.textContent = String(value);
    };

    setText("[data-profile-name]", profile.name);
    setText("[data-profile-id]", profile.playerId);
    setText("[data-profile-level]", profile.level);
    setText("[data-profile-xp]", `${profile.xp} XP`);
    setText("[data-profile-joined]", profile.joinDate);

    setText('[data-stat="played"]', profile.gamesPlayed);
    setText('[data-stat="won"]', profile.gamesWon);
    setText('[data-stat="rate"]', `${winRate}%`);
    setText('[data-stat="best"]', profile.bestScore);
  }

  updateProfile(data = {}) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        error: PROFILE_ERRORS.INVALID_DATA
      };
    }

    this.profile = {
      ...this.profile,
      ...data
    };

    if (this.root) {
      this.render();
    }

    return {
      success: true,
      profile: { ...this.profile }
    };
  }

  handleClick(event) {
    const button = event.target.closest("[data-action]");

    if (!button || !this.root.contains(button)) return;

    switch (button.dataset.action) {
      case "back":
        this.onBack();
        break;

      case "edit":
        this.onEdit({ ...this.profile });
        break;

      case "history":
        this.onHistory();
        break;

      default:
        break;
    }
  }

  getProfile() {
    return { ...this.profile };
  }

  destroy() {
    if (this.root) {
      this.root.removeEventListener("click", this.handleClick);
      this.root.remove();
    }

    this.root = null;
    this.isMounted = false;
  }
}

export function createProfileScreen(options = {}) {
  return new ProfileScreen(options);
}

/* ================= FILE ENDING ================= */
