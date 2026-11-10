
/* =========================================================
   SUPER RUMMY — ANIMATION MANAGER
   FILE: js/animation/animation-manager.js
   VERSION: 1.0.0
========================================================= */

const ANIMATION_PRESETS = Object.freeze({
  FADE_IN: {
    keyframes: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    duration: 250,
    easing: "ease-out"
  },

  FADE_OUT: {
    keyframes: [
      { opacity: 1 },
      { opacity: 0 }
    ],
    duration: 200,
    easing: "ease-in"
  },

  SLIDE_UP: {
    keyframes: [
      { opacity: 0, transform: "translateY(24px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    duration: 300,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  },

  SLIDE_DOWN: {
    keyframes: [
      { opacity: 0, transform: "translateY(-24px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    duration: 300,
    easing: "ease-out"
  },

  SCALE_IN: {
    keyframes: [
      { opacity: 0, transform: "scale(0.88)" },
      { opacity: 1, transform: "scale(1)" }
    ],
    duration: 250,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  },

  SCALE_OUT: {
    keyframes: [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.9)" }
    ],
    duration: 180,
    easing: "ease-in"
  },

  BOUNCE: {
    keyframes: [
      { transform: "translateY(0)" },
      { transform: "translateY(-8px)" },
      { transform: "translateY(0)" }
    ],
    duration: 450,
    easing: "ease-out"
  },

  SHAKE: {
    keyframes: [
      { transform: "translateX(0)" },
      { transform: "translateX(-5px)" },
      { transform: "translateX(5px)" },
      { transform: "translateX(-3px)" },
      { transform: "translateX(0)" }
    ],
    duration: 350,
    easing: "ease-in-out"
  },

  PULSE: {
    keyframes: [
      { transform: "scale(1)" },
      { transform: "scale(1.05)" },
      { transform: "scale(1)" }
    ],
    duration: 700,
    easing: "ease-in-out"
  },

  FLIP: {
    keyframes: [
      { transform: "rotateY(0deg)" },
      { transform: "rotateY(180deg)" }
    ],
    duration: 450,
    easing: "ease-in-out"
  }
});

class AnimationManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.durationScale = options.durationScale ?? 1;
    this.activeAnimations = new Map();
    this.reducedMotion = false;
    this.destroyed = false;

    this.motionQuery =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    this.updateReducedMotion();

    this.motionListener = () => {
      this.updateReducedMotion();
    };

    this.motionQuery?.addEventListener?.(
      "change",
      this.motionListener
    );
  }

  /* ---------------- MOTION SETTINGS ---------------- */

  updateReducedMotion() {
    this.reducedMotion = Boolean(
      this.motionQuery?.matches
    );
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);

    if (!this.enabled) {
      this.cancelAll();
    }
  }

  setDurationScale(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return false;

    this.durationScale = Math.min(
      2,
      Math.max(0.25, number)
    );

    return true;
  }

  /* ---------------- PLAY ANIMATION ---------------- */

  animate(element, presetName, options = {}) {
    if (
      this.destroyed ||
      !element ||
      typeof element.animate !== "function"
    ) {
      return Promise.resolve(false);
    }

    if (!this.enabled) {
      return Promise.resolve(false);
    }

    const preset = ANIMATION_PRESETS[presetName];

    if (!preset) {
      console.warn(
        `[SUPER RUMMY] Unknown animation: ${presetName}`
      );

      return Promise.resolve(false);
    }

    this.cancel(element);

    const duration = this.reducedMotion
      ? 0
      : Math.max(
          0,
          options.duration ??
          preset.duration * this.durationScale
        );

    const animation = element.animate(
      preset.keyframes,
      {
        duration,
        easing: options.easing || preset.easing,
        delay: options.delay || 0,
        fill: options.fill || "both",
        iterations: options.iterations || 1,
        direction: options.direction || "normal"
      }
    );

    this.activeAnimations.set(element, animation);

    return new Promise(resolve => {
      animation.onfinish = () => {
        this.activeAnimations.delete(element);

        if (options.cleanup === true) {
          animation.cancel();
        }

        resolve(true);
      };

      animation.oncancel = () => {
        this.activeAnimations.delete(element);
        resolve(false);
      };
    });
  }

  /* ---------------- CONVENIENCE METHODS ---------------- */

  fadeIn(element, options = {}) {
    return this.animate(element, "FADE_IN", options);
  }

  fadeOut(element, options = {}) {
    return this.animate(element, "FADE_OUT", options);
  }

  slideUp(element, options = {}) {
    return this.animate(element, "SLIDE_UP", options);
  }

  slideDown(element, options = {}) {
    return this.animate(element, "SLIDE_DOWN", options);
  }

  scaleIn(element, options = {}) {
    return this.animate(element, "SCALE_IN", options);
  }

  scaleOut(element, options = {}) {
    return this.animate(element, "SCALE_OUT", options);
  }

  bounce(element, options = {}) {
    return this.animate(element, "BOUNCE", options);
  }

  shake(element, options = {}) {
    return this.animate(element, "SHAKE", options);
  }

  pulse(element, options = {}) {
    return this.animate(element, "PULSE", {
      ...options,
      iterations: options.iterations || 1
    });
  }

  flip(element, options = {}) {
    return this.animate(element, "FLIP", options);
  }

  /* ---------------- CARD ANIMATIONS ---------------- */

  dealCard(element, index = 0) {
    return this.animate(element, "SLIDE_UP", {
      delay: Math.max(0, index) * 45,
      duration: 280
    });
  }

  discardCard(element) {
    return this.animate(element, "SLIDE_DOWN", {
      duration: 220
    });
  }

  selectCard(element) {
    return this.animate(element, "BOUNCE", {
      duration: 180
    });
  }

  /* ---------------- CANCELLATION ---------------- */

  cancel(element) {
    const animation = this.activeAnimations.get(element);

    if (!animation) return false;

    animation.cancel();
    this.activeAnimations.delete(element);

    return true;
  }

  cancelAll() {
    this.activeAnimations.forEach(animation => {
      animation.cancel();
    });

    this.activeAnimations.clear();
  }

  /* ---------------- STATUS ---------------- */

  getStatus() {
    return {
      enabled: this.enabled,
      reducedMotion: this.reducedMotion,
      durationScale: this.durationScale,
      activeCount: this.activeAnimations.size
    };
  }

  /* ---------------- CLEANUP ---------------- */

  destroy() {
    if (this.destroyed) return;

    this.cancelAll();

    this.motionQuery?.removeEventListener?.(
      "change",
      this.motionListener
    );

    this.destroyed = true;
  }
}

/* ---------------- FACTORY ---------------- */

function createAnimationManager(options = {}) {
  return new AnimationManager(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  ANIMATION_PRESETS,
  AnimationManager,
  createAnimationManager
};

/* =============== FILE ENDING =============== */
