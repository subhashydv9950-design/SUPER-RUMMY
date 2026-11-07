
/* =====================================================
   SUPER RUMMY — DECK ENGINE
   FILE: js/cards/deck.js
   VERSION: 1.0
===================================================== */

import {
    createCompleteDeck,
    validateDeck
} from "./card-model.js";

import {
    shuffleArray
} from "../core/utils.js";


/* ---------- 1. DECK CONSTANTS ---------- */

export const DECK_SETTINGS = Object.freeze({

    CARDS_PER_PLAYER: 13,

    MIN_PLAYERS: 2,

    MAX_PLAYERS: 4,

    CARDS_PER_PACK: 54,

    FIRST_DISCARD_COUNT: 1

});


/* ---------- 2. PACK COUNT ---------- */

export function getRequiredPackCount(playerCount) {

    validatePlayerCount(playerCount);

    return playerCount <= 2 ? 1 : 2;

}


/* ---------- 3. PLAYER COUNT VALIDATION ---------- */

export function validatePlayerCount(playerCount) {

    if (
        !Number.isInteger(playerCount) ||
        playerCount < DECK_SETTINGS.MIN_PLAYERS ||
        playerCount > DECK_SETTINGS.MAX_PLAYERS
    ) {

        throw new Error(
            "Player count must be between 2 and 4."
        );

    }

    return true;

}


/* ---------- 4. CREATE MULTIPLE PACKS ---------- */

export function createDeck(playerCount = 2) {

    const packCount = getRequiredPackCount(playerCount);

    const completeDeck = [];

    for (let packIndex = 1; packIndex <= packCount; packIndex++) {

        const pack = createCompleteDeck();

        for (const card of pack) {

            completeDeck.push({

                ...card,

                id: `pack_${packIndex}_${card.id}`,

                packId: packIndex

            });

        }

    }

    return completeDeck;

}


/* ---------- 5. SHUFFLE DECK ---------- */

export function shuffleDeck(deck) {

    if (!Array.isArray(deck) || deck.length === 0) {

        throw new Error("Cannot shuffle an empty deck.");

    }

    const shuffledDeck = shuffleArray(deck);

    return shuffledDeck;

}


/* ---------- 6. DECK INTEGRITY CHECK ---------- */

export function validateCompleteDeck(deck, playerCount) {

    validatePlayerCount(playerCount);

    if (!Array.isArray(deck)) {

        return {
            valid: false,
            reason: "Deck must be an array."
        };

    }

    const expectedPackCount = getRequiredPackCount(playerCount);

    const expectedCardCount =
        expectedPackCount * DECK_SETTINGS.CARDS_PER_PACK;

    if (deck.length !== expectedCardCount) {

        return {
            valid: false,
            reason: `Expected ${expectedCardCount} cards.`
        };

    }

    const cardIds = deck.map(card => card.id);

    if (new Set(cardIds).size !== deck.length) {

        return {
            valid: false,
            reason: "Duplicate card IDs found."
        };

    }

    for (let packId = 1; packId <= expectedPackCount; packId++) {

        const pack = deck.filter(
            card => card.packId === packId
        );

        const result = validateDeck(pack);

        if (!result.valid) {

            return {
                valid: false,
                reason: `Pack ${packId}: ${result.reason}`
            };

        }

    }

    return {
        valid: true,
        reason: "Deck integrity verified."
    };

}


/* ---------- 7. DEAL CARDS ---------- */

export function dealCards(deck, playerCount) {

    validatePlayerCount(playerCount);

    if (!Array.isArray(deck)) {

        throw new Error("Invalid deck.");

    }

    const integrity = validateCompleteDeck(
        deck,
        playerCount
    );

    if (!integrity.valid) {

        throw new Error(integrity.reason);

    }

    const shuffledDeck = shuffleDeck(deck);

    const players = Array.from(
        { length: playerCount },
        (_, index) => ({

            id: `player_${index + 1}`,

            cards: []

        })
    );

    let deckIndex = 0;

    // Distribute 13 cards to each player.
    for (
        let cardNumber = 0;
        cardNumber < DECK_SETTINGS.CARDS_PER_PLAYER;
        cardNumber++
    ) {

        for (const player of players) {

            player.cards.push(
                shuffledDeck[deckIndex]
            );

            deckIndex++;

        }

    }

    const remainingCards = shuffledDeck.slice(deckIndex);

    if (remainingCards.length < 2) {

        throw new Error(
            "Not enough cards to create the draw and discard piles."
        );

    }

    // First card becomes the open discard card.
    const firstDiscard = remainingCards[0];

    const closedDeck = remainingCards.slice(1);

    const openDeck = [firstDiscard];

    return {

        players,

        closedDeck,

        openDeck,

        currentPlayerIndex: 0,

        cardsPerPlayer: DECK_SETTINGS.CARDS_PER_PLAYER,

        totalCardsDealt:
            playerCount * DECK_SETTINGS.CARDS_PER_PLAYER,

        packCount: getRequiredPackCount(playerCount),

        status: "dealt"

    };

}


/* ---------- 8. DRAW FROM CLOSED DECK ---------- */

export function drawFromClosedDeck(gameState) {

    if (!gameState || !Array.isArray(gameState.closedDeck)) {

        throw new Error("Invalid game state.");

    }

    if (gameState.closedDeck.length === 0) {

        return {
            success: false,
            reason: "Closed deck is empty.",
            card: null
        };

    }

    const updatedDeck = [...gameState.closedDeck];

    const card = updatedDeck.pop();

    return {

        success: true,

        card,

        closedDeck: updatedDeck

    };

}


/* ---------- 9. DRAW FROM OPEN DECK ---------- */

export function drawFromOpenDeck(gameState) {

    if (!gameState || !Array.isArray(gameState.openDeck)) {

        throw new Error("Invalid game state.");

    }

    if (gameState.openDeck.length === 0) {

        return {
            success: false,
            reason: "Open deck is empty.",
            card: null
        };

    }

    const updatedDeck = [...gameState.openDeck];

    const card = updatedDeck.pop();

    return {

        success: true,

        card,

        openDeck: updatedDeck

    };

}


/* ---------- 10. DISCARD CARD ---------- */

export function discardCard(gameState, card) {

    if (!gameState || !Array.isArray(gameState.openDeck)) {

        throw new Error("Invalid game state.");

    }

    if (!card || !card.id) {

        throw new Error("Invalid discard card.");

    }

    const updatedOpenDeck = [
        ...gameState.openDeck,
        card
    ];

    return {

        ...gameState,

        openDeck: updatedOpenDeck

    };

}


/* ---------- 11. RECYCLE CLOSED DECK ---------- */

export function recycleClosedDeck(gameState) {

    if (!gameState || !Array.isArray(gameState.closedDeck)) {

        throw new Error("Invalid game state.");

    }

    if (gameState.closedDeck.length > 0) {

        return gameState;

    }

    if (!Array.isArray(gameState.openDeck)) {

        throw new Error("Invalid open deck.");

    }

    // Keep the top discard card.
    if (gameState.openDeck.length <= 1) {

        return gameState;

    }

    const topDiscard = gameState.openDeck[
        gameState.openDeck.length - 1
    ];

    const recyclableCards = gameState.openDeck.slice(0, -1);

    const shuffledCards = shuffleDeck(recyclableCards);

    return {

        ...gameState,

        closedDeck: shuffledCards,

        openDeck: [topDiscard]

    };

}


/* ---------- 12. DECK SUMMARY ---------- */

export function getDeckSummary(gameState) {

    if (!gameState) {

        throw new Error("Game state is required.");

    }

    return {

        players: gameState.players.length,

        cardsInHands: gameState.players.reduce(
            (total, player) => total + player.cards.length,
            0
        ),

        closedDeckCount: gameState.closedDeck.length,

        openDeckCount: gameState.openDeck.length,

        totalCards:
            gameState.players.reduce(
                (total, player) => total + player.cards.length,
                0
            ) +
            gameState.closedDeck.length +
            gameState.openDeck.length

    };

}


/* ---------- FILE ENDING ---------- */
