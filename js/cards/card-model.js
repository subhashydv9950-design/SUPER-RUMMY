
/* =====================================================
   SUPER RUMMY — CARD DATA MODEL
   FILE: js/cards/card-model.js
   VERSION: 1.0
===================================================== */

/* ---------- 1. CARD SUITS ---------- */

export const CARD_SUITS = Object.freeze({

    HEARTS: {
        id: "hearts",
        name: "Hearts",
        symbol: "♥",
        color: "red",
        sortOrder: 1
    },

    DIAMONDS: {
        id: "diamonds",
        name: "Diamonds",
        symbol: "♦",
        color: "red",
        sortOrder: 2
    },

    CLUBS: {
        id: "clubs",
        name: "Clubs",
        symbol: "♣",
        color: "black",
        sortOrder: 3
    },

    SPADES: {
        id: "spades",
        name: "Spades",
        symbol: "♠",
        color: "black",
        sortOrder: 4
    }

});


/* ---------- 2. CARD RANKS ---------- */

export const CARD_RANKS = Object.freeze([

    { id: "A", name: "Ace", sortOrder: 1, points: 10 },

    { id: "2", name: "Two", sortOrder: 2, points: 2 },

    { id: "3", name: "Three", sortOrder: 3, points: 3 },

    { id: "4", name: "Four", sortOrder: 4, points: 4 },

    { id: "5", name: "Five", sortOrder: 5, points: 5 },

    { id: "6", name: "Six", sortOrder: 6, points: 6 },

    { id: "7", name: "Seven", sortOrder: 7, points: 7 },

    { id: "8", name: "Eight", sortOrder: 8, points: 8 },

    { id: "9", name: "Nine", sortOrder: 9, points: 9 },

    { id: "10", name: "Ten", sortOrder: 10, points: 10 },

    { id: "J", name: "Jack", sortOrder: 11, points: 10 },

    { id: "Q", name: "Queen", sortOrder: 12, points: 10 },

    { id: "K", name: "King", sortOrder: 13, points: 10 }

]);


/* ---------- 3. CARD CONSTANTS ---------- */

export const CARD_CONSTANTS = Object.freeze({

    STANDARD_CARD_COUNT: 52,

    PRINTED_JOKER_COUNT: 2,

    TOTAL_CARD_COUNT: 54,

    ACE_POINTS: 10,

    FACE_CARD_POINTS: 10,

    MAX_CARD_POINTS: 10

});


/* ---------- 4. RANK LOOKUP ---------- */

const RANK_LOOKUP = new Map(

    CARD_RANKS.map(rank => [
        rank.id,
        rank
    ])

);


/* ---------- 5. CARD FACTORY ---------- */

export function createCard({

    id,

    suit = null,

    rank = null,

    type = "standard",

    isPrintedJoker = false,

    isWildJoker = false

}) {

    if (!id) {

        throw new Error("Card ID is required.");

    }

    if (type === "standard") {

        if (!suit || !rank) {

            throw new Error(
                "Standard cards require suit and rank."
            );

        }

        const rankData = RANK_LOOKUP.get(rank);

        if (!rankData) {

            throw new Error("Invalid card rank.");

        }

        const suitData = Object.values(CARD_SUITS)
            .find(item => item.id === suit);

        if (!suitData) {

            throw new Error("Invalid card suit.");

        }

        return Object.freeze({

            id,

            type: "standard",

            suit: suitData.id,

            suitName: suitData.name,

            symbol: suitData.symbol,

            color: suitData.color,

            rank: rankData.id,

            rankName: rankData.name,

            sortOrder: rankData.sortOrder,

            suitOrder: suitData.sortOrder,

            points: rankData.points,

            isPrintedJoker: false,

            isWildJoker: Boolean(isWildJoker)

        });

    }

    if (type === "joker") {

        return Object.freeze({

            id,

            type: "joker",

            suit: null,

            suitName: null,

            symbol: "★",

            color: "joker",

            rank: "JOKER",

            rankName: "Printed Joker",

            sortOrder: 14,

            suitOrder: 5,

            points: 0,

            isPrintedJoker: Boolean(isPrintedJoker),

            isWildJoker: Boolean(isWildJoker)

        });

    }

    throw new Error("Unsupported card type.");

}


/* ---------- 6. STANDARD DECK GENERATOR ---------- */

export function createStandardDeck() {

    const deck = [];

    const suits = Object.values(CARD_SUITS);

    for (const suit of suits) {

        for (const rank of CARD_RANKS) {

            const card = createCard({

                id: `${suit.id}_${rank.id}`,

                suit: suit.id,

                rank: rank.id,

                type: "standard"

            });

            deck.push(card);

        }

    }

    return deck;

}


/* ---------- 7. PRINTED JOKER GENERATOR ---------- */

export function createPrintedJokers() {

    return [

        createCard({

            id: "printed_joker_1",

            type: "joker",

            isPrintedJoker: true

        }),

        createCard({

            id: "printed_joker_2",

            type: "joker",

            isPrintedJoker: true

        })

    ];

}


/* ---------- 8. COMPLETE DECK GENERATOR ---------- */

export function createCompleteDeck() {

    const standardCards = createStandardDeck();

    const printedJokers = createPrintedJokers();

    const completeDeck = [

        ...standardCards,

        ...printedJokers

    ];

    if (
        completeDeck.length !==
        CARD_CONSTANTS.TOTAL_CARD_COUNT
    ) {

        throw new Error(
            "Invalid deck: expected exactly 54 cards."
        );

    }

    return completeDeck;

}


/* ---------- 9. CARD POINTS ---------- */

export function getCardPoints(card) {

    if (!card || typeof card !== "object") {

        throw new Error("Invalid card.");

    }

    if (card.type === "joker") {

        return 0;

    }

    return card.points;

}


/* ---------- 10. CARD TYPE CHECKS ---------- */

export function isJoker(card) {

    return Boolean(

        card && (
            card.type === "joker" ||
            card.isPrintedJoker ||
            card.isWildJoker
        )

    );

}


export function isPrintedJoker(card) {

    return Boolean(

        card && card.isPrintedJoker

    );

}


export function isWildJoker(card) {

    return Boolean(

        card && card.isWildJoker

    );

}


/* ---------- 11. CARD ID VALIDATION ---------- */

export function validateDeck(deck) {

    if (!Array.isArray(deck)) {

        return {

            valid: false,

            reason: "Deck must be an array."

        };

    }

    if (
        deck.length !==
        CARD_CONSTANTS.TOTAL_CARD_COUNT
    ) {

        return {

            valid: false,

            reason: "Deck must contain exactly 54 cards."

        };

    }

    const ids = deck.map(card => card.id);

    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== deck.length) {

        return {

            valid: false,

            reason: "Duplicate card IDs detected."

        };

    }

    const standardCount = deck.filter(
        card => card.type === "standard"
    ).length;

    const jokerCount = deck.filter(
        card => card.type === "joker"
    ).length;

    if (
        standardCount !== 52 ||
        jokerCount !== 2
    ) {

        return {

            valid: false,

            reason: "Incorrect standard card or joker count."

        };

    }

    return {

        valid: true,

        reason: "Deck contains 52 standard cards and 2 jokers."

    };

}


/* ---------- FILE ENDING ---------- */
