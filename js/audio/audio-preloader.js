
/* =========================================================
   SUPER RUMMY — AUDIO PRELOADER
   FILE: js/audio/audio-preloader.js
   VERSION: 1.0.0
========================================================= */

import { AUDIO_LIBRARY, getAllAudioFiles } from "./audio-library.js";

const PRELOAD_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  COMPLETE: "complete",
  PARTIAL: "partial",
  FAILED: "failed"
});

class AudioPreloader {
  constructor(options = {}) {
    this.timeout = options.timeout ?? 12000;
    this.concurrency = options.concurrency ?? 4;
    this.status = PRELOAD_STATUS.IDLE;
    this.results = [];
    this.cancelled = false;
    this.activeAudio = new Set();
  }

  async preloadAll(options = {}) {
    if (this.status === PRELOAD_STATUS.LOADING) {
      return this.getSummary();
    }

    this.cancelled = false;
    this.status = PRELOAD_STATUS.LOADING;
    this.results = [];

    const files = getAllAudioFiles();

    if (!files.length) {
      this.status = PRELOAD_STATUS.FAILED;
      return this.getSummary();
    }

    const selectedFiles = options.category
      ? files.filter(file => file.category === options.category)
      : files;

    let index = 0;

    const workers = Array.from(
      {
        length: Math.min(
          this.concurrency,
          selectedFiles.length
        )
      },
      async () => {
        while (
          index < selectedFiles.length &&
          !this.cancelled
        ) {
          const currentIndex = index++;
          const file = selectedFiles[currentIndex];

          const result = await this.preloadFile(file);

          this.results.push(result);

          if (typeof options.onProgress === "function") {
            options.onProgress({
              completed: this.results.length,
              total: selectedFiles.length,
              percentage: Math.round(
                this.results.length /
                selectedFiles.length * 100
              ),
              result
            });
          }
        }
      }
    );

    await Promise.all(workers);

    if (this.cancelled) {
      this.status = PRELOAD_STATUS.IDLE;
    } else {
      const loaded = this.results.filter(
        item => item.success
      ).length;

      if (loaded === selectedFiles.length) {
        this.status = PRELOAD_STATUS.COMPLETE;
      } else if (loaded > 0) {
        this.status = PRELOAD_STATUS.PARTIAL;
      } else {
        this.status = PRELOAD_STATUS.FAILED;
      }
    }

    return this.getSummary();
  }

  preloadFile(file) {
    return new Promise(resolve => {
      if (this.cancelled) {
        resolve({
          name: file.name,
          success: false,
          reason: "cancelled"
        });
        return;
      }

      const audio = new Audio();

      this.activeAudio.add(audio);

      let completed = false;

      const finish = (success, reason = null) => {
        if (completed) return;

        completed = true;

        clearTimeout(timer);

        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("error", onError);

        this.activeAudio.delete(audio);

        resolve({
          category: file.category,
          name: file.name,
          source: file.source,
          success,
          reason
        });
      };

      const onReady = () => finish(true);

      const onError = () => {
        finish(false, "load-error");
      };

      const timer = setTimeout(() => {
        finish(false, "timeout");
      }, this.timeout);

      audio.preload = "auto";

      audio.addEventListener(
        "canplaythrough",
        onReady,
        { once: true }
      );

      audio.addEventListener(
        "error",
        onError,
        { once: true }
      );

      audio.src = file.source;
      audio.load();

      if (audio.readyState >= 4) {
        finish(true);
      }
    });
  }

  preloadMusic() {
    return this.preloadAll({
      category: "music"
    });
  }

  preloadEffects() {
    return this.preloadAll({
      category: "cards"
    });
  }

  cancel() {
    this.cancelled = true;

    this.activeAudio.forEach(audio => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    });

    this.activeAudio.clear();
  }

  getSummary() {
    const successful = this.results.filter(
      item => item.success
    );

    const failed = this.results.filter(
      item => !item.success
    );

    return {
      status: this.status,
      total: this.results.length,
      loaded: successful.length,
      failed: failed.length,
      percentage: this.results.length
        ? Math.round(
            successful.length /
            this.results.length * 100
          )
        : 0,
      failures: failed.map(item => ({
        name: item.name,
        reason: item.reason
      }))
    };
  }

  reset() {
    this.cancel();
    this.results = [];
    this.status = PRELOAD_STATUS.IDLE;
  }
}

/* ---------------- FACTORY ---------------- */

function createAudioPreloader(options = {}) {
  return new AudioPreloader(options);
}

/* ---------------- EXPORTS ---------------- */

export {
  PRELOAD_STATUS,
  AudioPreloader,
  createAudioPreloader
};

/* =============== FILE ENDING =============== */
