
/* =====================================================
   SUPER RUMMY — GAME CONFIGURATION
   FILE: js/config.js
   VERSION: 1.0
===================================================== */

export const APP_CONFIG = Object.freeze({

    // APPLICATION DETAILS
    app: {
        name: "SUPER RUMMY",
        shortName: "SR",
        version: "1.0.0",
        developer: "Subhash Yadav",
        instagram: "iamsubhash177",
        email: "yahu9950@gmail.com",
        language: "en",
        defaultLanguage: "en"
    },

    // GAME TYPE
    game: {
        type: "INDIAN_13_CARD_RUMMY",
        cardsPerPlayer: 13,
        minimumPlayers: 2,
        maximumPlayers: 4,
        allowOffline: true,
        allowOnline: true,
        allowPractice: true
    },

    // DECK CONFIGURATION
    deck: {
        suits: [
            "hearts",
            "diamonds",
            "clubs",
            "spades"
        ],

        ranks: [
            "A", "2", "3", "4", "5", "6", "7",
            "8", "9", "10", "J", "Q", "K"
        ],

        standardCards: 52,
        printedJokers: 2,
        totalCards: 54
    },

    // PLAYER CONFIGURATION
    players: {
        defaultCount: 2,
        minimumCount: 2,
        maximumCount: 4,
        startingHandSize: 13
    },

    // GAME MODES
    modes: {
        practice: {
            id: "practice",
            name: "Practice",
            enabled: true,
            onlineRequired: false
        },

        points: {
            id: "points",
            name: "Points Rummy",
            enabled: true,
            onlineRequired: true
        },

        pool: {
            id: "pool",
            name: "Pool Rummy",
            enabled: true,
            onlineRequired: true
        },

        deals: {
            id: "deals",
            name: "Deals Rummy",
            enabled: true,
            onlineRequired: true
        },

        privateRoom: {
            id: "private-room",
            name: "Private Room",
            enabled: true,
            onlineRequired: true
        }
    },

    // TURN SETTINGS
    turn: {
        durationSeconds: 30,
        warningSeconds: 10,
        autoSortAfterDeal: true
    },

    // RUMMY RULE SETTINGS
    rules: {
        minimumSequences: 2,
        minimumPureSequences: 1,
        cardsInSequence: 3,
        cardsInSet: 3,
        allowPrintedJoker: true,
        allowWildJoker: true,
        declarationRequiresValidation: true
    },

    // AI SETTINGS
    ai: {
        enabled: true,
        difficultyLevels: [
            "easy",
            "medium",
            "hard"
        ],
        defaultDifficulty: "medium"
    },

    // AUDIO SETTINGS
    audio: {
        musicEnabled: true,
        soundEnabled: true,
        defaultMusicVolume: 0.45,
        defaultSoundVolume: 0.75
    },

    // VISUAL SETTINGS
    visual: {
        theme: "royal-dark",
        primaryColor: "#e5bd69",
        secondaryColor: "#8b65e8",
        backgroundColor: "#0b0e16",
        cardStyle: "classic",
        animationEnabled: true
    },

    // USER SETTINGS
    user: {
        guestLoginEnabled: true,
        googleLoginEnabled: true,
        phoneLoginEnabled: true,
        defaultDisplayName: "Guest Player"
    },

    // NETWORK SETTINGS
    network: {
        reconnectEnabled: true,
        maximumReconnectAttempts: 5,
        reconnectDelayMs: 2000
    },

    // GAMEPLAY POLICY
    policy: {
        freeToPlay: true,
        realMoneyWagering: false,
        cashPrizes: false,
        cashWithdrawal: false
    }

});

// APPLICATION ROUTES
export const APP_ROUTES = Object.freeze({

    HOME: "home",
    LOGIN: "login",
    PROFILE: "profile",
    PRACTICE: "practice",
    POINTS: "points",
    POOL: "pool",
    DEALS: "deals",
    PRIVATE_ROOM: "private-room",
    GAME: "game",
    SETTINGS: "settings",
    HISTORY: "history",
    ABOUT: "about"

});

// STORAGE KEYS
export const STORAGE_KEYS = Object.freeze({

    USER: "super_rummy_user",
    SETTINGS: "super_rummy_settings",
    PROFILE: "super_rummy_profile",
    GAME_PREFERENCES: "super_rummy_preferences",
    LANGUAGE: "super_rummy_language",
    FIRST_LAUNCH: "super_rummy_first_launch"

});

// CONFIGURATION VALIDATION
export function validateAppConfig() {

    const errors = [];

    if (
        APP_CONFIG.game.minimumPlayers < 2 ||
        APP_CONFIG.game.maximumPlayers > 4
    ) {
        errors.push("Invalid player limits.");
    }

    if (APP_CONFIG.game.cardsPerPlayer !== 13) {
        errors.push("Indian Rummy requires 13 cards per player.");
    }

    if (
        APP_CONFIG.deck.standardCards +
        APP_CONFIG.deck.printedJokers !==
        APP_CONFIG.deck.totalCards
    ) {
        errors.push("Deck card count does not match.");
    }

    if (APP_CONFIG.rules.minimumPureSequences < 1) {
        errors.push("At least one pure sequence is required.");
    }

    if (
        APP_CONFIG.policy.realMoneyWagering ||
        APP_CONFIG.policy.cashPrizes ||
        APP_CONFIG.policy.cashWithdrawal
    ) {
        errors.push("Unsupported real-money gameplay settings.");
    }

    return {
        valid: errors.length === 0,
        errors
    };

}

/* ---------- FILE ENDING ---------- */
