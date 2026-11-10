
/* =========================================================
   SUPER RUMMY — ANIMATION COORDINATOR
   FILE: js/animation/animation-coordinator.js
   PURPOSE: Central animation system controller
   ========================================================= */

export class AnimationCoordinator {
  constructor(options = {}) {
    this.managers = {
      animation: options.animationManager || null,
      card: options.cardAnimationController || null,
      transition: options.transitionManager || null,
      particles: options.particleEffectsManager || null
    };

    this.enabled = options.enabled !== false;
    this.paused = false;
    this.destroyed = false;

    this.motionQuery = null;
    this.motionHandler = null;

    this.setupReducedMotion();
    this.applySettings();
  }

  setupReducedMotion() {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    this.motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    this.motionHandler = event => {
      this.setReducedMotion(event.matches);
    };

    this.setReducedMotion(this.motionQuery.matches);

    if (this.motionQuery.addEventListener) {
      this.motionQuery.addEventListener(
        "change",
        this.motionHandler
      );
    } else if (this.motionQuery.addListener) {
      this.motionQuery.addListener(this.motionHandler);
    }
  }

  applySettings() {
    for (const manager of Object.values(this.managers)) {
      if (!manager) continue;

      if (typeof manager.setEnabled === "function") {
        manager.setEnabled(this.enabled && !this.paused);
      }
    }
  }

  setReducedMotion(reduced) {
    const particles = this.managers.particles;

    if (
      particles &&
      typeof particles.setReducedMotion === "function"
    ) {
      particles.setReducedMotion(reduced);
    }

    if (reduced) {
      const animation = this.managers.animation;

      if (animation && typeof animation.cancelAll === "function") {
        animation.cancelAll();
      }

      const card = this.managers.card;

      if (card && typeof card.cancelAll === "function") {
        card.cancelAll();
      }
    }
  }

  setEnabled(enabled) {
    if (this.destroyed) return;

    this.enabled = Boolean(enabled);
    this.applySettings();
  }

  pause() {
    if (this.destroyed || this.paused) return;

    this.paused = true;

    for (const manager of Object.values(this.managers)) {
      if (!manager) continue;

      if (typeof manager.cancelAll === "function") {
        manager.cancelAll();
      }

      if (typeof manager.clear === "function") {
        manager.clear();
      }

      if (typeof manager.setEnabled === "function") {
        manager.setEnabled(false);
      }
    }
  }

  resume() {
    if (this.destroyed) return;

    this.paused = false;
    this.applySettings();
  }

  getManager(name) {
    return this.managers[name] || null;
  }

  async dealCards(elements, options = {}) {
    if (!this.canAnimate()) return false;

    const card = this.managers.card;

    if (!card || typeof card.dealCards !== "function") {
      return false;
    }

    return card.dealCards(elements, options);
  }

  async transitionScreen(oldScreen, newScreen, options = {}) {
    if (!this.canAnimate()) return false;

    const transition = this.managers.transition;

    if (
      !transition ||
      typeof transition.switchScreen !== "function"
    ) {
      return false;
    }

    return transition.switchScreen(
      oldScreen,
      newScreen,
      options
    );
  }

  celebrate(position, count = 65) {
    if (!this.canAnimate()) return 0;

    const particles = this.managers.particles;

    if (!particles || typeof particles.celebrate !== "function") {
      return 0;
    }

    return particles.celebrate(position, count);
  }

  sparkle(position, count = 16) {
    if (!this.canAnimate()) return 0;

    const particles = this.managers.particles;

    if (!particles || typeof particles.sparkle !== "function") {
      return 0;
    }

    return particles.sparkle(position, count);
  }

  canAnimate() {
    return (
      !this.destroyed &&
      this.enabled &&
      !this.paused
    );
  }

  getStatus() {
    return {
      enabled: this.enabled,
      paused: this.paused,
      destroyed: this.destroyed,
      managers: {
        animation: Boolean(this.managers.animation),
        card: Boolean(this.managers.card),
        transition: Boolean(this.managers.transition),
        particles: Boolean(this.managers.particles)
      }
    };
  }

  destroy() {
    if (this.destroyed) return;

    if (this.motionQuery && this.motionHandler) {
      if (this.motionQuery.removeEventListener) {
        this.motionQuery.removeEventListener(
          "change",
          this.motionHandler
        );
      } else if (this.motionQuery.removeListener) {
        this.motionQuery.removeListener(this.motionHandler);
      }
    }

    for (const manager of Object.values(this.managers)) {
      if (manager && typeof manager.cancelAll === "function") {
        manager.cancelAll();
      }
    }

    this.destroyed = true;
    this.managers = {
      animation: null,
      card: null,
      transition: null,
      particles: null
    };

    this.motionQuery = null;
    this.motionHandler = null;
  }
}

export function createAnimationCoordinator(options = {}) {
  return new AnimationCoordinator(options);
}

/* ================= FILE END ================= */
