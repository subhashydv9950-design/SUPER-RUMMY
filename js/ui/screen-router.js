
/* =========================================================
   SUPER RUMMY — SCREEN ROUTER
   FILE: js/ui/screen-router.js
   ========================================================= */

export class ScreenRouter {
  constructor(options = {}) {
    this.container = options.container || null;
    this.screens = new Map();
    this.currentScreen = null;
    this.currentInstance = null;
    this.history = [];
    this.maxHistory = 30;
    this.destroyed = false;
  }

  setContainer(container) {
    if (!container) {
      throw new Error("A valid screen container is required.");
    }

    this.container = container;
    return this;
  }

  register(name, ScreenClass, options = {}) {
    if (!name || typeof name !== "string") {
      throw new Error("Screen name must be a string.");
    }

    if (typeof ScreenClass !== "function") {
      throw new Error("ScreenClass must be a constructor.");
    }

    if (this.screens.has(name)) {
      throw new Error(`Screen already registered: ${name}`);
    }

    this.screens.set(name, {
      ScreenClass,
      options: { ...options }
    });

    return this;
  }

  has(name) {
    return this.screens.has(name);
  }

  getRegisteredScreens() {
    return [...this.screens.keys()];
  }

  navigate(name, params = {}) {
    if (this.destroyed) {
      throw new Error("ScreenRouter has been destroyed.");
    }

    if (!this.container) {
      throw new Error("ScreenRouter has no container.");
    }

    const definition = this.screens.get(name);

    if (!definition) {
      throw new Error(`Unknown screen: ${name}`);
    }

    if (this.currentScreen === name) {
      return this.currentInstance;
    }

    const previousScreen = this.currentScreen;

    this.destroyCurrent();

    if (previousScreen) {
      this.history.push(previousScreen);

      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    const ScreenClass = definition.ScreenClass;

    const screenOptions = {
      ...definition.options,
      ...params,
      container: this.container,
      router: this
    };

    const instance = new ScreenClass(screenOptions);

    this.currentScreen = name;
    this.currentInstance = instance;

    try {
      instance.mount(this.container);
    } catch (error) {
      this.currentScreen = null;
      this.currentInstance = null;
      this.container.innerHTML = "";

      throw error;
    }

    return instance;
  }

  back(fallbackScreen = "home") {
    while (this.history.length > 0) {
      const previous = this.history.pop();

      if (this.screens.has(previous)) {
        return this.navigateWithoutHistory(previous);
      }
    }

    if (this.screens.has(fallbackScreen)) {
      return this.navigateWithoutHistory(fallbackScreen);
    }

    return null;
  }

  navigateWithoutHistory(name, params = {}) {
    const definition = this.screens.get(name);

    if (!definition) {
      throw new Error(`Unknown screen: ${name}`);
    }

    this.destroyCurrent();

    const instance = new definition.ScreenClass({
      ...definition.options,
      ...params,
      container: this.container,
      router: this
    });

    this.currentScreen = name;
    this.currentInstance = instance;

    try {
      instance.mount(this.container);
    } catch (error) {
      this.currentScreen = null;
      this.currentInstance = null;
      this.container.innerHTML = "";

      throw error;
    }

    return instance;
  }

  destroyCurrent() {
    if (this.currentInstance) {
      if (typeof this.currentInstance.destroy === "function") {
        this.currentInstance.destroy();
      }
    }

    this.currentInstance = null;
    this.currentScreen = null;
  }

  getCurrentScreen() {
    return this.currentScreen;
  }

  getCurrentInstance() {
    return this.currentInstance;
  }

  clearHistory() {
    this.history = [];
  }

  destroy() {
    this.destroyCurrent();
    this.screens.clear();
    this.history = [];

    if (this.container) {
      this.container.innerHTML = "";
    }

    this.container = null;
    this.destroyed = true;
  }
}

/* ================= FILE ENDING ================= */
