
/* =========================================================
   SUPER RUMMY — ABOUT SCREEN
   FILE: js/ui/about-screen.js
   ========================================================= */

export class AboutScreen {
  constructor(options = {}) {
    this.container = options.container || null;
    this.onBack = options.onBack || (() => {});
    this.element = null;
  }

  mount(container = this.container) {
    if (!container) {
      throw new Error("AboutScreen requires a container.");
    }

    this.container = container;
    this.render();
    this.bindEvents();

    return this;
  }

  render() {
    this.container.innerHTML = `
      <section class="sr-about-screen">

        <header class="sr-about-header">
          <button
            type="button"
            class="sr-about-back"
            data-action="back"
            aria-label="Go back"
          >←</button>

          <div>
            <p class="sr-about-eyebrow">SUPER RUMMY</p>
            <h1>About Game</h1>
          </div>
        </header>

        <div class="sr-about-content">

          <div class="sr-about-brand">
            <div class="sr-about-logo">♠</div>
            <h2>SUPER RUMMY</h2>
            <p>Play Smart. Think Ahead.</p>
            <span class="sr-about-version">
              VERSION 1.0
            </span>
          </div>

          <section class="sr-about-card">
            <h3>About SUPER RUMMY</h3>
            <p>
              SUPER RUMMY is a card game experience
              designed around strategy, observation
              and smart decision-making.
            </p>
            <p>
              Enjoy practice games, different game
              modes, card customization and a
              premium playing environment.
            </p>
          </section>

          <section class="sr-about-card">
            <h3>Game Features</h3>

            <ul class="sr-about-features">
              <li>♠ Practice with computer opponents</li>
              <li>♣ Multiple Rummy game modes</li>
              <li>♥ Premium card and table themes</li>
              <li>♦ Smooth card animations</li>
              <li>★ Player profile and game statistics</li>
              <li>♫ Customizable sound settings</li>
            </ul>
          </section>

          <section class="sr-about-card sr-about-founder">
            <p class="sr-about-label">DEVELOPED BY</p>
            <h3>Subhash Yadav</h3>
            <p class="sr-about-role">
              Founder & Developer
            </p>

            <div class="sr-about-social">
              <span>Instagram</span>
              <strong>@iamsubhash177</strong>
            </div>

            <div class="sr-about-social">
              <span>Email</span>
              <strong>yahu9950@gmail.com</strong>
            </div>
          </section>

          <section class="sr-about-card sr-about-notice">
            <h3>Fair Play & Safety</h3>
            <p>
              SUPER RUMMY is designed for entertainment
              and skill-based practice. It does not
              provide real-money betting, deposits,
              cash prizes or cash withdrawals.
            </p>
            <p>
              Play responsibly and enjoy the game.
            </p>
          </section>

          <footer class="sr-about-footer">
            <p>Made with passion for card game lovers</p>
            <p>© SUPER RUMMY</p>
          </footer>

        </div>
      </section>
    `;

    this.element = this.container.querySelector(
      ".sr-about-screen"
    );
  }

  bindEvents() {
    if (!this.element) return;

    this.handleClick = event => {
      const button = event.target.closest(
        '[data-action="back"]'
      );

      if (button) {
        this.onBack();
      }
    };

    this.element.addEventListener(
      "click",
      this.handleClick
    );
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
