
/* =========================================================
   SUPER RUMMY — GAME PERSISTENCE MANAGER
   File: js/game/game-persistence.js
   Purpose: Save and restore local game progress
   ========================================================= */

const STORAGE_PREFIX = "SUPER_RUMMY_SAVE_";
const SAVE_FORMAT = "SUPER_RUMMY_GAME_SAVE";
const SAVE_VERSION = 1;
const MAX_SLOTS = 5;

export class GamePersistence {
  constructor(options = {}) {
    this.storage = options.storage || getBrowserStorage();
    this.prefix = options.prefix || STORAGE_PREFIX;
    this.maxSlots = options.maxSlots || MAX_SLOTS;
  }

  save(slotId, gameState, metadata = {}) {
    this.validateSlot(slotId);
    this.validateState(gameState);

    const saveData = {
      format: SAVE_FORMAT,
      version: SAVE_VERSION,
      slotId,
      savedAt: Date.now(),
      gameId: gameState.gameId,
      metadata: cloneSafe(metadata),
      state: cloneSafe(gameState)
    };

    const serialized = JSON.stringify(saveData);

    try {
      this.storage.setItem(
        this.getKey(slotId),
        serialized
      );
    } catch (error) {
      throw new Error(
        `Unable to save game: ${error.message}`
      );
    }

    return {
      success: true,
      slotId,
      savedAt: saveData.savedAt,
      gameId: saveData.gameId
    };
  }

  load(slotId) {
    this.validateSlot(slotId);

    const serialized = this.storage.getItem(
      this.getKey(slotId)
    );

    if (!serialized) {
      return null;
    }

    let saveData;

    try {
      saveData = JSON.parse(serialized);
    } catch {
      throw new Error("Saved game data is corrupted.");
    }

    this.validateSaveData(saveData);

    return {
      slotId: saveData.slotId,
      savedAt: saveData.savedAt,
      gameId: saveData.gameId,
      metadata: cloneSafe(saveData.metadata),
      state: cloneSafe(saveData.state)
    };
  }

  remove(slotId) {
    this.validateSlot(slotId);

    const key = this.getKey(slotId);
    const existed = this.storage.getItem(key) !== null;

    this.storage.removeItem(key);

    return existed;
  }

  hasSave(slotId) {
    this.validateSlot(slotId);

    return this.storage.getItem(
      this.getKey(slotId)
    ) !== null;
  }

  listSaves() {
    const saves = [];

    for (let slot = 1; slot <= this.maxSlots; slot++) {
      const serialized = this.storage.getItem(
        this.getKey(slot)
      );

      if (!serialized) continue;

      try {
        const data = JSON.parse(serialized);

        if (
          data.format !== SAVE_FORMAT ||
          !data.state
        ) {
          continue;
        }

        saves.push({
          slotId: slot,
          gameId: data.gameId || null,
          savedAt: data.savedAt || null,
          status: data.state.status || null,
          mode: data.state.mode || null,
          playerCount: Array.isArray(data.state.players)
            ? data.state.players.length
            : 0
        });
      } catch {
        saves.push({
          slotId: slot,
          corrupted: true
        });
      }
    }

    return saves;
  }

  clearAll() {
    let removed = 0;

    for (let slot = 1; slot <= this.maxSlots; slot++) {
      if (this.remove(slot)) {
        removed++;
      }
    }

    return removed;
  }

  getKey(slotId) {
    return `${this.prefix}${slotId}`;
  }

  validateSlot(slotId) {
    if (
      !Number.isInteger(slotId) ||
      slotId < 1 ||
      slotId > this.maxSlots
    ) {
      throw new Error(
        `Slot must be between 1 and ${this.maxSlots}.`
      );
    }
  }

  validateState(state) {
    if (!state || typeof state !== "object") {
      throw new Error("Invalid game state.");
    }

    if (!state.gameId || !Array.isArray(state.players)) {
      throw new Error("Incomplete game state.");
    }

    if (
      state.players.length < 2 ||
      state.players.length > 4
    ) {
      throw new Error("Invalid player count.");
    }
  }

  validateSaveData(data) {
    if (!data || data.format !== SAVE_FORMAT) {
      throw new Error("Invalid save file format.");
    }

    if (data.version !== SAVE_VERSION) {
      throw new Error("Unsupported save version.");
    }

    if (!data.state || !data.slotId) {
      throw new Error("Save file is incomplete.");
    }

    this.validateState(data.state);
  }
}

function getBrowserStorage() {
  try {
    if (typeof localStorage === "undefined") {
      throw new Error("Browser storage is unavailable.");
    }

    const testKey = "__sr_storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);

    return localStorage;
  } catch {
    throw new Error(
      "Local storage is unavailable or disabled."
    );
  }
}

function cloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function createGamePersistence(options = {}) {
  return new GamePersistence(options);
}

/* ================= FILE ENDING ================= */
                                
