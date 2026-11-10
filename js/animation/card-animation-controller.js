
/* =========================================================
   SUPER RUMMY — CARD ANIMATION CONTROLLER
   FILE: js/animation/card-animation-controller.js
   PURPOSE: Card movement and animation sequences
   ========================================================= */

const DEFAULT_OPTIONS = {
  dealDuration: 360,
  discardDuration: 280,
  selectDuration: 180,
  flipDuration: 420,
  staggerDelay: 65,
  enabled: true
};

export class CardAnimationController {
  constructor(options = {}) {
    this.animationManager = options.animationManager || null;

    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };

    this.queue = Promise.resolve();
    this.destroyed = false;
    this.activeAnimations = new Set();
  }

  isAvailable() {
    return (
      !this.destroyed &&
      this.options.enabled &&
      typeof Element !== "undefined"
    );
  }

  getElement(element) {
    if (typeof element === "string") {
      return document.querySelector(element);
    }

    return element instanceof Element ? element : null;
  }

  async runAnimation(element, type, options = {}) {
    const target = this.getElement(element);

    if (!target || this.destroyed) {
      return false;
    }

    if (!this.options.enabled) {
      return true;
    }

    const duration = Math.max(
      0,
      options.duration ?? this.options[`${type}Duration`] ?? 250
    );

    const config = {
      duration,
      easing: options.easing || "ease-out",
      fill: options.fill || "both",
      ...options
    };

    const managerMethods = {
      deal: "dealCard",
      discard: "discardCard",
      select: "selectCard"
    };

    const managerMethod = managerMethods[type];

    if (
      managerMethod &&
      this.animationManager &&
      typeof this.animationManager[managerMethod] === "function"
    ) {
      try {
        await this.animationManager[managerMethod](
          target,
          config
        );

        return true;
      } catch (error) {
        console.warn("SUPER RUMMY animation fallback:", error);
      }
    }

    if (typeof target.animate !== "function") {
      return false;
    }

    const animations = {
      deal: [
        { opacity: 0, transform: "translateY(-35px) scale(.88)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ],

      discard: [
        { opacity: 1, transform: "translateY(0) rotate(0deg)" },
        { opacity: 0, transform: "translateY(-45px) rotate(8deg) scale(.9)" }
      ],

      select: [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-13px) scale(1.04)" }
      ],

      deselect: [
        { transform: "translateY(-13px) scale(1.04)" },
        { transform: "translateY(0) scale(1)" }
      ],

      flip: [
        { transform: "rotateY(0deg)" },
        { transform: "rotateY(180deg)" }
      ]
    };

    const frames = animations[type];

    if (!frames) {
      return false;
    }

    const animation = target.animate(frames, config);
    this.activeAnimations.add(animation);

    try {
      await animation.finished;
      return true;
    } catch {
      return false;
    } finally {
      this.activeAnimations.delete(animation);
    }
  }

  dealCard(element, options = {}) {
    return this.runAnimation(element, "deal", options);
  }

  discardCard(element, options = {}) {
    return this.runAnimation(element, "discard", options);
  }

  selectCard(element, options = {}) {
    return this.runAnimation(element, "select", options);
  }

  deselectCard(element, options = {}) {
    return this.runAnimation(element, "deselect", options);
  }

  flipCard(element, options = {}) {
    return this.runAnimation(element, "flip", options);
  }

  async dealCards(elements, options = {}) {
    const cards = Array.from(elements || []).filter(Boolean);

    if (!cards.length) {
      return [];
    }

    const delay = Math.max(
      0,
      options.staggerDelay ?? this.options.staggerDelay
    );

    const results = [];

    for (let index = 0; index < cards.length; index++) {
      if (this.destroyed) break;

      const result = await this.dealCard(cards[index], options);
      results.push(result);

      if (delay && index < cards.length - 1) {
        await new Promise(resolve => {
          setTimeout(resolve, delay);
        });
      }
    }

    return results;
  }

  async animateHand(elements, options = {}) {
    return this.dealCards(elements, options);
  }

  async flipCards(elements, options = {}) {
    const cards = Array.from(elements || []);

    return Promise.all(
      cards.map((card, index) =>
        this.flipCard(card, {
          ...options,
          delay: index * (options.staggerDelay || 0)
        })
      )
    );
  }

  addToQueue(task) {
    if (typeof task !== "function" || this.destroyed) {
      return Promise.resolve(false);
    }

    this.queue = this.queue
      .then(() => {
        if (this.destroyed) return false;
        return task();
      })
      .catch(error => {
        console.error("SUPER RUMMY animation queue:", error);
        return false;
      });

    return this.queue;
  }

  cancelAll() {
    for (const animation of this.activeAnimations) {
      try {
        animation.cancel();
      } catch {
        // Ignore already completed animations.
      }
    }

    this.activeAnimations.clear();

    if (
      this.animationManager &&
      typeof this.animationManager.cancelAll === "function"
    ) {
      this.animationManager.cancelAll();
    }
  }

  setEnabled(enabled) {
    this.options.enabled = Boolean(enabled);

    if (!this.options.enabled) {
      this.cancelAll();
    }
  }

  setSpeed(multiplier = 1) {
    const speed = Math.max(0.25, Math.min(3, multiplier));

    this.options.dealDuration =
      DEFAULT_OPTIONS.dealDuration / speed;

    this.options.discardDuration =
      DEFAULT_OPTIONS.discardDuration / speed;

    this.options.selectDuration =
      DEFAULT_OPTIONS.selectDuration / speed;

    this.options.flipDuration =
      DEFAULT_OPTIONS.flipDuration / speed;
  }

  destroy() {
    this.cancelAll();
    this.destroyed = true;
    this.animationManager = null;
    this.queue = Promise.resolve();
  }
}

export function createCardAnimationController(options = {}) {
  return new CardAnimationController(options);
}

/* ================= FILE END ================= */
      
