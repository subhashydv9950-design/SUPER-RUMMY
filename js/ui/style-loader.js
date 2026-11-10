
/* =========================================================
   SUPER RUMMY — FILE 81
   File: js/ui/style-loader.js
   Purpose: Central UI Stylesheet Loader
   ========================================================= */

export const APP_STYLESHEETS = [
  "css/main.css",
  "css/cards.css",
  "css/game-table.css",
  "css/game-table-overlay.css",
  "css/home-screen.css",
  "css/mode-selection-screen.css",
  "css/profile-screen.css",
  "css/settings-screen.css",
  "css/about-screen.css",
  "css/game-history-screen.css",
  "css/profile-edit-screen.css",
  "css/notification-manager.css"
];

export class StyleLoader {
  constructor(options = {}) {
    this.basePath = options.basePath || "";
    this.loaded = new Set();
    this.loading = new Map();
  }

  normalizePath(path) {
    const cleanPath = String(path || "").trim();

    if (
      !cleanPath ||
      cleanPath.startsWith("javascript:") ||
      cleanPath.startsWith("data:")
    ) {
      throw new Error("Invalid stylesheet path.");
    }

    return `${this.basePath}${cleanPath}`;
  }

  load(path) {
    const href = this.normalizePath(path);

    if (this.loaded.has(href)) {
      return Promise.resolve(href);
    }

    if (this.loading.has(href)) {
      return this.loading.get(href);
    }

    const existing = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    ).find(link => link.href === new URL(href, document.baseURI).href);

    if (existing && existing.sheet) {
      this.loaded.add(href);
      return Promise.resolve(href);
    }

    const promise = new Promise((resolve, reject) => {
      const link = existing || document.createElement("link");

      link.rel = "stylesheet";
      link.href = href;

      const cleanup = () => {
        link.removeEventListener("load", handleLoad);
        link.removeEventListener("error", handleError);
      };

      const handleLoad = () => {
        cleanup();
        this.loaded.add(href);
        this.loading.delete(href);
        resolve(href);
      };

      const handleError = () => {
        cleanup();
        this.loading.delete(href);

        if (!existing) {
          link.remove();
        }

        reject(
          new Error(`Unable to load stylesheet: ${href}`)
        );
      };

      link.addEventListener("load", handleLoad, { once: true });
      link.addEventListener("error", handleError, { once: true });

      if (!existing) {
        document.head.appendChild(link);
      } else if (existing.sheet) {
        handleLoad();
      }
    });

    this.loading.set(href, promise);
    return promise;
  }

  async loadAll(paths = APP_STYLESHEETS) {
    const results = await Promise.allSettled(
      paths.map(path => this.load(path))
    );

    const loaded = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        loaded.push(result.value);
      } else {
        failed.push({
          path: paths[index],
          error: result.reason?.message || "Loading failed"
        });
      }
    });

    return {
      success: failed.length === 0,
      loaded,
      failed
    };
  }

  isLoaded(path) {
    return this.loaded.has(this.normalizePath(path));
  }

  async reload(path) {
    const href = this.normalizePath(path);

    this.loaded.delete(href);

    const link = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    ).find(item => item.href === new URL(href, document.baseURI).href);

    if (link) {
      link.remove();
    }

    this.loading.delete(href);
    return this.load(path);
  }
}

export const appStyleLoader = new StyleLoader();

/* ================= FILE 81 END ================= */
