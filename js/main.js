
/* =====================================================
   SUPER RUMMY — APPLICATION ENTRY POINT
   FILE: js/main.js
   VERSION: 1.0
===================================================== */

import {
    APP_CONFIG,
    APP_ROUTES,
    STORAGE_KEYS,
    validateAppConfig
} from "./config.js";


/* ---------- 1. APPLICATION STATE ---------- */

const App = {

    initialized: false,

    currentScreen: APP_ROUTES.HOME,

    config: APP_CONFIG,

    routes: APP_ROUTES,

    elements: {},

    events: new EventTarget()

};


/* ---------- 2. DOM ELEMENTS ---------- */

function collectElements() {

    App.elements = {

        root: document.getElementById("app"),

        loading: document.getElementById("loading-screen"),

        screen: document.getElementById("screen-container"),

        modal: document.getElementById("modal-container"),

        notifications: document.getElementById(
            "notification-container"
        )

    };

    for (const [name, element] of Object.entries(App.elements)) {

        if (!element) {

            throw new Error(
                `Required application element missing: ${name}`
            );

        }

    }

}


/* ---------- 3. CONFIGURATION CHECK ---------- */

function checkConfiguration() {

    const result = validateAppConfig();

    if (!result.valid) {

        throw new Error(
            "Configuration error: " + result.errors.join(" ")
        );

    }

    return true;

}


/* ---------- 4. LOCAL STORAGE ---------- */

const Storage = {

    get(key, fallback = null) {

        try {

            const value = localStorage.getItem(key);

            return value === null
                ? fallback
                : JSON.parse(value);

        } catch (error) {

            console.warn("Storage read failed:", error);

            return fallback;

        }

    },

    set(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.warn("Storage write failed:", error);

            return false;

        }

    },

    remove(key) {

        try {

            localStorage.removeItem(key);

            return true;

        } catch (error) {

            console.warn("Storage removal failed:", error);

            return false;

        }

    }

};


/* ---------- 5. EVENT SYSTEM ---------- */

const EventBus = {

    on(eventName, callback) {

        App.events.addEventListener(
            eventName,
            callback
        );

    },

    off(eventName, callback) {

        App.events.removeEventListener(
            eventName,
            callback
        );

    },

    emit(eventName, detail = {}) {

        App.events.dispatchEvent(
            new CustomEvent(eventName, {
                detail
            })
        );

    }

};


/* ---------- 6. SCREEN MANAGEMENT ---------- */

const ScreenManager = {

    current: APP_ROUTES.HOME,

    navigate(screenName) {

        const allowedScreens = Object.values(APP_ROUTES);

        if (!allowedScreens.includes(screenName)) {

            console.error(
                "Unknown screen:",
                screenName
            );

            return false;

        }

        this.current = screenName;

        App.currentScreen = screenName;

        EventBus.emit("screen:change", {
            screen: screenName
        });

        return true;

    },

    getCurrentScreen() {

        return this.current;

    }

};


/* ---------- 7. DEFAULT USER SETTINGS ---------- */

function initializeUserSettings() {

    const existingSettings = Storage.get(
        STORAGE_KEYS.SETTINGS,
        null
    );

    if (existingSettings === null) {

        const defaultSettings = {

            musicEnabled: APP_CONFIG.audio.musicEnabled,

            soundEnabled: APP_CONFIG.audio.soundEnabled,

            musicVolume: APP_CONFIG.audio.defaultMusicVolume,

            soundVolume: APP_CONFIG.audio.defaultSoundVolume,

            theme: APP_CONFIG.visual.theme,

            language: APP_CONFIG.app.defaultLanguage,

            animations: APP_CONFIG.visual.animationEnabled

        };

        Storage.set(
            STORAGE_KEYS.SETTINGS,
            defaultSettings
        );

    }

}


/* ---------- 8. APPLICATION ERROR HANDLING ---------- */

function setupErrorHandling() {

    window.addEventListener("error", (event) => {

        console.error(
            "SUPER RUMMY error:",
            event.error || event.message
        );

    });

    window.addEventListener(
        "unhandledrejection",
        (event) => {

            console.error(
                "SUPER RUMMY async error:",
                event.reason
            );

        }
    );

}


/* ---------- 9. LOADING SCREEN ---------- */

function hideLoadingScreen() {

    const loading = App.elements.loading;

    if (!loading) return;

    loading.classList.add("hidden");

    window.setTimeout(() => {

        loading.remove();

    }, 600);

}


/* ---------- 10. APPLICATION STARTUP ---------- */

async function initializeApp() {

    if (App.initialized) {

        return;

    }

    try {

        collectElements();

        checkConfiguration();

        setupErrorHandling();

        initializeUserSettings();

        App.initialized = true;

        EventBus.emit("app:ready", {

            name: APP_CONFIG.app.name,

            version: APP_CONFIG.app.version

        });

        hideLoadingScreen();

        console.info(
            `${APP_CONFIG.app.name} initialized successfully.`
        );

    } catch (error) {

        console.error(
            "Application startup failed:",
            error
        );

        const loading = document.getElementById(
            "loading-screen"
        );

        if (loading) {

            loading.innerHTML = `
                <div class="loading-logo">
                    SUPER <span>RUMMY</span>
                </div>
                <p>Unable to start the game.</p>
                <button
                    class="sr-button sr-button-primary"
                    onclick="location.reload()"
                >
                    Retry
                </button>
            `;

        }

    }

}


/* ---------- 11. GLOBAL APP SERVICES ---------- */

export {

    App,

    Storage,

    EventBus,

    ScreenManager

};


/* ---------- 12. START APPLICATION ---------- */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp,
        { once: true }
    );

} else {

    initializeApp();

}


/* ---------- FILE ENDING ---------- */
