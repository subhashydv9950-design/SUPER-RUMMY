
/* =========================================================
   SUPER RUMMY — SCREEN REGISTRY
   FILE: js/ui/screen-registry.js
   ========================================================= */

import { HomeScreen } from "./home-screen.js";
import { ModeSelectionScreen } from "./mode-selection-screen.js";
import { ProfileScreen } from "./profile-screen.js";
import { SettingsScreen } from "./settings-screen.js";
import { AboutScreen } from "./about-screen.js";
import { GameHistoryScreen } from "./game-history-screen.js";

/**
 * Registers the available application screens.
 *
 * @param {ScreenRouter} router
 * @param {Object} dependencies
 * @returns {ScreenRouter}
 */

export function registerAppScreens(router, dependencies = {}) {
  if (!router) {
    throw new Error("A ScreenRouter instance is required.");
  }

  const onBack = () => router.back("home");

  router.register("home", HomeScreen, {
    onPlay: () => router.navigate("mode-selection"),

    onModeSelect: () => router.navigate("mode-selection"),

    onProfile: () => router.navigate("profile"),

    onSettings: () => router.navigate("settings"),

    onAbout: () => router.navigate("about")
  });

  router.register("mode-selection", ModeSelectionScreen, {
    onBack,

    onStart: config => {
      if (typeof dependencies.onStartGame === "function") {
        dependencies.onStartGame(config);
      }
    },

    onPrivateRoom: config => {
      if (typeof dependencies.onPrivateRoom === "function") {
        dependencies.onPrivateRoom(config);
      }
    }
  });

  router.register("profile", ProfileScreen, {
    onBack,

    onHistory: () => router.navigate("game-history"),

    onEdit: profile => {
      if (typeof dependencies.onEditProfile === "function") {
        dependencies.onEditProfile(profile);
      }
    }
  });

  router.register("settings", SettingsScreen, {
    onBack,

    onSettingsChange: change => {
      if (typeof dependencies.onSettingsChange === "function") {
        dependencies.onSettingsChange(change);
      }
    }
  });

  router.register("about", AboutScreen, {
    onBack
  });

  router.register("game-history", GameHistoryScreen, {
    onBack
  });

  return router;
}

/**
 * Creates and configures the application's screen router.
 *
 * @param {Object} options
 * @returns {ScreenRouter}
 */

export function createAppScreenRouter(options = {}) {
  const { ScreenRouter } = options;

  if (typeof ScreenRouter !== "function") {
    throw new Error("ScreenRouter constructor is required.");
  }

  if (!options.container) {
    throw new Error("A screen container is required.");
  }

  const router = new ScreenRouter({
    container: options.container
  });

  registerAppScreens(router, options.dependencies || {});

  return router;
}

/* ================= FILE ENDING ================= */
