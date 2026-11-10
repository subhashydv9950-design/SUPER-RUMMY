
/* =========================================================
   SUPER RUMMY — SCREEN TRANSITION MANAGER
   FILE: js/animation/transition-manager.js
   PURPOSE: Screen and modal transition effects
   ========================================================= */

const TRANSITION_PRESETS = {
  fade: {
    enter: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    exit: [
      { opacity: 1 },
      { opacity: 0 }
    ]
  },

  slideLeft: {
    enter: [
      { opacity: 0, transform: "translateX(35px)" },
      { opacity: 1, transform: "translateX(0)" }
    ],
    exit: [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: "translateX(-35px)" }
    ]
  },

  slideRight: {
    enter: [
      { opacity: 0, transform: "translateX(-35px)" },
      { opacity: 1, transform: "translateX(0)" }
    ],
    exit: [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: "translateX(35px)" }
    ]
  },

  scale: {
    enter: [
      { opacity: 0, transform: "scale(.94)" },
      { opacity: 1, transform: "scale(1)" }
    ],
    exit: [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(.94)" }
    ]
  }
};

const DEFAULTS = {
  duration: 260,
  easing: "ease-in-out",
  preset: "fade",
  enabled: true
};

export class TransitionManager {
  constructor(options = {}) {
    this.options = {
      ...DEFAULTS,
      ...options
    };

    this.activeAnimations = new Map();
    this.destroyed = false;
  }

  getElement(element) {
    if (typeof element === "string") {
      return document.querySelector(element);
    }

    return element instanceof Element ? element : null;
  }

  getPreset(name) {
    return TRANSITION_PRESETS[name] || TRANSITION_PRESETS.fade;
  }

  prefersReducedMotion() {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  cancel(element) {
    const target = this.getElement(element);

    if (!target) return;

    const animation = this.activeAnimations.get(target);

    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(target);
    }
  }

  async animate(element, direction = "enter", options = {}) {
    const target = this.getElement(element);

    if (!target || this.destroyed) {
      return false;
    }

    this.cancel(target);

    const presetName = options.preset || this.options.preset;
    const preset = this.getPreset(presetName);

    const frames = direction === "exit"
      ? preset.exit
      : preset.enter;

    if (!this.options.enabled || this.prefersReducedMotion()) {
      target.style.opacity = direction === "exit" ? "0" : "1";
      return true;
    }

    if (typeof target.animate !== "function") {
      target.style.opacity = direction === "exit" ? "0" : "1";
      return true;
    }

    const animation = target.animate(frames, {
      duration: Math.max(
        0,
        options.duration ?? this.options.duration
      ),
      easing: options.easing || this.options.easing,
      fill: "both"
    });

    this.activeAnimations.set(target, animation);

    try {
      await animation.finished;

      if (direction === "enter") {
        target.style.opacity = "1";
        target.style.transform = "";
      }

      if (direction === "exit") {
        target.style.opacity = "0";
      }

      return true;
    } catch {
      return false;
    } finally {
      if (this.activeAnimations.get(target) === animation) {
        this.activeAnimations.delete(target);
      }
    }
  }

  async enter(element, options = {}) {
    const target = this.getElement(element);

    if (!target) return false;

    target.hidden = false;
    target.style.display = options.display || "";

    return this.animate(target, "enter", options);
  }

  async exit(element, options = {}) {
    const target = this.getElement(element);

    if (!target) return false;

    const completed = await this.animate(target, "exit", options);

    if (completed && options.hide !== false) {
      target.hidden = true;
    }

    return completed;
  }

  async switchScreen(oldScreen, newScreen, options = {}) {
    const oldElement = this.getElement(oldScreen);
    const newElement = this.getElement(newScreen);

    if (!newElement) return false;

    if (oldElement === newElement) {
      return this.enter(newElement, options);
    }

    if (oldElement) {
      await this.exit(oldElement, {
        ...options,
        hide: true
      });
    }

    return this.enter(newElement, options);
  }

  async showModal(modal, options = {}) {
    const element = this.getElement(modal);

    if (!element) return false;

    element.hidden = false;
    element.setAttribute("aria-hidden", "false");

    return this.enter(element, {
      preset: options.preset || "scale",
      duration: options.duration ?? 220
    });
  }

  async hideModal(modal, options = {}) {
    const element = this.getElement(modal);

    if (!element) return false;

    const result = await this.exit(element, {
      preset: options.preset || "scale",
      duration: options.duration ?? 180
    });

    element.setAttribute("aria-hidden", "true");

    return result;
  }

  setEnabled(enabled) {
    this.options.enabled = Boolean(enabled);

    if (!this.options.enabled) {
      this.cancelAll();
    }
  }

  setDuration(duration) {
    this.options.duration = Math.max(0, Number(duration) || 0);
  }

  cancelAll() {
    for (const animation of this.activeAnimations.values()) {
      try {
        animation.cancel();
      } catch {
        // Ignore completed animations.
      }
    }

    this.activeAnimations.clear();
  }

  destroy() {
    this.cancelAll();
    this.destroyed = true;
  }
}

export function createTransitionManager(options = {}) {
  return new TransitionManager(options);
}

/* ================= FILE END ================= */
  
