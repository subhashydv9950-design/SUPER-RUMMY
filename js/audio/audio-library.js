
/* =========================================================
   SUPER RUMMY — AUDIO LIBRARY
   FILE: js/audio/audio-library.js
   VERSION: 1.0.0
========================================================= */

const AUDIO_BASE_PATH = "assets/audio/";

const AUDIO_LIBRARY = Object.freeze({

  /* BACKGROUND MUSIC */
  music: {
    HOME: {
      source: `${AUDIO_BASE_PATH}music/home-theme.mp3`,
      volume: 0.65,
      loop: true
    },

    GAME: {
      source: `${AUDIO_BASE_PATH}music/game-theme.mp3`,
      volume: 0.45,
      loop: true
    },

    LOBBY: {
      source: `${AUDIO_BASE_PATH}music/lobby-theme.mp3`,
      volume: 0.50,
      loop: true
    },

    VICTORY: {
      source: `${AUDIO_BASE_PATH}music/victory-theme.mp3`,
      volume: 0.80,
      loop: false
    }
  },

  /* CARD SOUNDS */
  cards: {
    SHUFFLE: {
      source: `${AUDIO_BASE_PATH}effects/card-shuffle.mp3`,
      volume: 0.75
    },

    DEAL: {
      source: `${AUDIO_BASE_PATH}effects/card-deal.mp3`,
      volume: 0.80
    },

    PICK: {
      source: `${AUDIO_BASE_PATH}effects/card-pick.mp3`,
      volume: 0.70
    },

    DROP: {
      source: `${AUDIO_BASE_PATH}effects/card-drop.mp3`,
      volume: 0.75
    },

    FLIP: {
      source: `${AUDIO_BASE_PATH}effects/card-flip.mp3`,
      volume: 0.70
    },

    SORT: {
      source: `${AUDIO_BASE_PATH}effects/card-sort.mp3`,
      volume: 0.55
    }
  },

  /* UI SOUNDS */
  interface: {
    BUTTON: {
      source: `${AUDIO_BASE_PATH}effects/button-click.mp3`,
      volume: 0.45
    },

    POPUP: {
      source: `${AUDIO_BASE_PATH}effects/popup-open.mp3`,
      volume: 0.55
    },

    CLOSE: {
      source: `${AUDIO_BASE_PATH}effects/popup-close.mp3`,
      volume: 0.50
    },

    NOTIFICATION: {
      source: `${AUDIO_BASE_PATH}effects/notification.mp3`,
      volume: 0.65
    },

    ERROR: {
      source: `${AUDIO_BASE_PATH}effects/error.mp3`,
      volume: 0.65
    }
  },

  /* GAME EVENTS */
  game: {
    TURN: {
      source: `${AUDIO_BASE_PATH}effects/your-turn.mp3`,
      volume: 0.70
    },

    TIMER: {
      source: `${AUDIO_BASE_PATH}effects/timer-tick.mp3`,
      volume: 0.50
    },

    DECLARE: {
      source: `${AUDIO_BASE_PATH}effects/declaration.mp3`,
      volume: 0.85
    },

    WIN: {
      source: `${AUDIO_BASE_PATH}effects/win.mp3`,
      volume: 0.90
    },

    LOSE: {
      source: `${AUDIO_BASE_PATH}effects/lose.mp3`,
      volume: 0.75
    },

    ROUND_START: {
      source: `${AUDIO_BASE_PATH}effects/round-start.mp3`,
      volume: 0.75
    },

    ROUND_END: {
      source: `${AUDIO_BASE_PATH}effects/round-end.mp3`,
      volume: 0.75
    }
  }
});

/* ---------------- LIBRARY HELPERS ---------------- */

function getAudioConfig(category, name) {
  return AUDIO_LIBRARY[category]?.[name] || null;
}

function getAllAudioFiles() {
  const files = [];

  Object.entries(AUDIO_LIBRARY).forEach(([category, items]) => {
    Object.entries(items).forEach(([name, config]) => {
      files.push({
        category,
        name,
        source: config.source,
        volume: config.volume,
        loop: Boolean(config.loop)
      });
    });
  });

  return files;
}

function getAudioFilesByCategory(category) {
  const items = AUDIO_LIBRARY[category];

  if (!items) return [];

  return Object.entries(items).map(([name, config]) => ({
    name,
    ...config
  }));
}

function registerAudioLibrary(audioManager) {
  if (
    !audioManager ||
    typeof audioManager.registerSound !== "function"
  ) {
    throw new Error("A valid AudioManager is required.");
  }

  const effects = [
    ...Object.values(AUDIO_LIBRARY.cards),
    ...Object.values(AUDIO_LIBRARY.interface),
    ...Object.values(AUDIO_LIBRARY.game)
  ];

  const music = Object.values(AUDIO_LIBRARY.music);

  effects.forEach((config, index) => {
    const name = getEffectName(index);

    audioManager.registerSound(
      name,
      config.source,
      {
        volume: config.volume,
        category: "effects",
        loop: config.loop || false
      }
    );
  });

  music.forEach((config, index) => {
    const name = getMusicName(index);

    audioManager.registerSound(
      name,
      config.source,
      {
        volume: config.volume,
        category: "music",
        loop: config.loop || false
      }
    );
  });

  return {
    registeredEffects: effects.length,
    registeredMusic: music.length
  };
}

/* ---------------- INTERNAL NAME HELPERS ---------------- */

function getEffectName(index) {
  const groups = [
    ["shuffle", "deal", "card-pick", "card-drop", "card-flip", "sort"],
    ["button", "popup", "close", "notification", "error"],
    ["turn", "timer", "declare", "win", "lose", "round-start", "round-end"]
  ];

  const names = groups.flat();

  return names[index] || `effect-${index}`;
}

function getMusicName(index) {
  return [
    "home-music",
    "game-music",
    "lobby-music",
    "victory-music"
  ][index] || `music-${index}`;
}

/* ---------------- VALIDATION ---------------- */

function validateAudioLibrary() {
  const errors = [];

  Object.entries(AUDIO_LIBRARY).forEach(([category, items]) => {
    Object.entries(items).forEach(([name, config]) => {
      if (!config.source) {
        errors.push(`${category}.${name}: Missing source`);
      }

      if (
        typeof config.volume !== "number" ||
        config.volume < 0 ||
        config.volume > 1
      ) {
        errors.push(`${category}.${name}: Invalid volume`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    totalFiles: getAllAudioFiles().length
  };
}

/* ---------------- EXPORTS ---------------- */

export {
  AUDIO_BASE_PATH,
  AUDIO_LIBRARY,
  getAudioConfig,
  getAllAudioFiles,
  getAudioFilesByCategory,
  registerAudioLibrary,
  validateAudioLibrary
};

/* =============== FILE ENDING =============== */
