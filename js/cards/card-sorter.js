
/* =====================================================
   SUPER RUMMY — CARD SORTING ENGINE
   FILE: js/cards/card-sorter.js
   VERSION: 1.0
===================================================== */

import {
    CARD_SUITS
} from "./card-model.js";


/* ---------- 1. SORT MODES ---------- */

export const SORT_MODES = Object.freeze({

    SUIT: "suit",

    RANK: "rank",

    COLOR: "color",

    JOKER: "joker"

});


/* ---------- 2. RANK ORDER ---------- */

const RANK_ORDER = Object.freeze({

    A: 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13

});


/* ---------- 3. SUIT ORDER ---------- */

const SUIT_ORDER = Object.freeze({

    hearts: 1,

    diamonds: 2,

    clubs: 3,

    spades: 4

});


/* ---------- 4. CARD VALIDATION ---------- */

function validateCards(cards) {

    if (!Array.isArray(cards)) {

        throw new Error("Cards must be an array.");

    }

    for (const card of cards) {

        if (!card || typeof card !== "object" || !card.id) {

            throw new Error("Invalid card detected.");

        }

    }

    return true;

}


/* ---------- 5. GET RANK VALUE ---------- */

export function getRankValue(card, aceHigh = false) {

    if (!card || card.type === "joker") {

        return 0;

    }

    const value = RANK_ORDER[card.rank];

    if (value === undefined) {

        throw new Error("Unknown card rank.");

    }

    if (card.rank === "A" && aceHigh) {

        return 14;

    }

    return value;

}


/* ---------- 6. GET SUIT VALUE ---------- */

export function getSuitValue(card) {

    if (!card || card.type === "joker") {

        return 99;

    }

    const value = SUIT_ORDER[card.suit];

    if (value === undefined) {

        throw new Error("Unknown card suit.");

    }

    return value;

}


/* ---------- 7. SORT BY SUIT ---------- */

export function sortBySuit(cards, options = {}) {

    validateCards(cards);

    const aceHigh = options.aceHigh === true;

    return [...cards].sort((a, b) => {

        const suitDifference =
            getSuitValue(a) - getSuitValue(b);

        if (suitDifference !== 0) {

            return suitDifference;

        }

        return (
            getRankValue(a, aceHigh) -
            getRankValue(b, aceHigh)
        );

    });

}


/* ---------- 8. SORT BY RANK ---------- */

export function sortByRank(cards, options = {}) {

    validateCards(cards);

    const aceHigh = options.aceHigh === true;

    return [...cards].sort((a, b) => {

        const rankDifference =
            getRankValue(a, aceHigh) -
            getRankValue(b, aceHigh);

        if (rankDifference !== 0) {

            return rankDifference;

        }

        return (
            getSuitValue(a) -
            getSuitValue(b)
        );

    });

}


/* ---------- 9. SORT BY COLOR ---------- */

export function sortByColor(cards) {

    validateCards(cards);

    const colorOrder = {

        red: 1,

        black: 2,

        joker: 3

    };

    return [...cards].sort((a, b) => {

        const colorA = colorOrder[a.color] ?? 99;

        const colorB = colorOrder[b.color] ?? 99;

        if (colorA !== colorB) {

            return colorA - colorB;

        }

        return (
            getSuitValue(a) -
            getSuitValue(b)
        );

    });

}


/* ---------- 10. SEPARATE JOKERS ---------- */

export function separateJokers(cards) {

    validateCards(cards);

    return {

        standardCards: cards.filter(
            card => card.type !== "joker"
        ),

        jokers: cards.filter(
            card => card.type === "joker"
        )

    };

}


/* ---------- 11. SORT JOKERS LAST ---------- */

export function sortJokersLast(cards, options = {}) {

    validateCards(cards);

    const standardCards = cards.filter(
        card => card.type !== "joker"
    );

    const jokers = cards.filter(
        card => card.type === "joker"
    );

    const sortedStandardCards = sortBySuit(
        standardCards,
        options
    );

    return [

        ...sortedStandardCards,

        ...jokers

    ];

}


/* ---------- 12. GROUP BY SUIT ---------- */

export function groupBySuit(cards) {

    validateCards(cards);

    const groups = {

        hearts: [],

        diamonds: [],

        clubs: [],

        spades: [],

        jokers: []

    };

    for (const card of cards) {

        if (card.type === "joker") {

            groups.jokers.push(card);

            continue;

        }

        if (!groups[card.suit]) {

            throw new Error(
                `Unknown suit: ${card.suit}`
            );

        }

        groups[card.suit].push(card);

    }

    for (const suit of Object.keys(groups)) {

        if (suit !== "jokers") {

            groups[suit] = sortByRank(
                groups[suit]
            );

        }

    }

    return groups;

}


/* ---------- 13. GROUP BY COLOR ---------- */

export function groupByColor(cards) {

    validateCards(cards);

    return {

        red: cards.filter(
            card => card.color === "red"
        ),

        black: cards.filter(
            card => card.color === "black"
        ),

        jokers: cards.filter(
            card => card.type === "joker"
        )

    };

}


/* ---------- 14. SMART SORT ---------- */

export function smartSort(cards, mode = SORT_MODES.SUIT, options = {}) {

    validateCards(cards);

    switch (mode) {

        case SORT_MODES.SUIT:

            return sortBySuit(cards, options);

        case SORT_MODES.RANK:

            return sortByRank(cards, options);

        case SORT_MODES.COLOR:

            return sortByColor(cards);

        case SORT_MODES.JOKER:

            return sortJokersLast(cards, options);

        default:

            throw new Error(
                `Unsupported sorting mode: ${mode}`
            );

    }

}


/* ---------- 15. CREATE MANUAL GROUPS ---------- */

export function createCardGroups(cards, groups) {

    validateCards(cards);

    if (!Array.isArray(groups)) {

        throw new Error("Groups must be an array.");

    }

    const cardLookup = new Map(
        cards.map(card => [card.id, card])
    );

    const usedIds = new Set();

    const result = groups.map((group, index) => {

        if (!Array.isArray(group.cardIds)) {

            throw new Error("Each group requires cardIds.");

        }

        const groupCards = group.cardIds.map(id => {

            if (!cardLookup.has(id)) {

                throw new Error(`Unknown card ID: ${id}`);

            }

            if (usedIds.has(id)) {

                throw new Error(`Card used more than once: ${id}`);

            }

            usedIds.add(id);

            return cardLookup.get(id);

        });

        return {

            id: `group_${index + 1}`,

            cards: groupCards

        };

    });

    return result;

}


/* ---------- 16. GET UNSORTED CARDS ---------- */

export function getUngroupedCards(cards, groups) {

    validateCards(cards);

    if (!Array.isArray(groups)) {

        throw new Error("Groups must be an array.");

    }

    const groupedIds = new Set();

    for (const group of groups) {

        for (const card of group.cards) {

            groupedIds.add(card.id);

        }

    }

    return cards.filter(
        card => !groupedIds.has(card.id)
    );

}


/* ---------- 17. SORTING SUMMARY ---------- */

export function getSortingSummary(cards) {

    validateCards(cards);

    const groups = groupBySuit(cards);

    return {

        totalCards: cards.length,

        hearts: groups.hearts.length,

        diamonds: groups.diamonds.length,

        clubs: groups.clubs.length,

        spades: groups.spades.length,

        jokers: groups.jokers.length,

        redCards:
            groups.hearts.length +
            groups.diamonds.length,

        blackCards:
            groups.clubs.length +
            groups.spades.length

    };

}


/* ---------- FILE ENDING ---------- */
