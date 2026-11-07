
/* =====================================================
   SUPER RUMMY — PREMIUM CARD RENDERER
   FILE: js/cards/card-renderer.js
   VERSION: 1.0
===================================================== */

const SUIT_SYMBOLS = Object.freeze({
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠"
});

const SUIT_NAMES = Object.freeze({
    hearts: "Hearts",
    diamonds: "Diamonds",
    clubs: "Clubs",
    spades: "Spades"
});

const FACE_RANKS = Object.freeze([
    "J",
    "Q",
    "K"
]);

const CARD_CLASSES = Object.freeze({
    ROOT: "sr-playing-card",
    RED: "sr-card-red",
    BLACK: "sr-card-black",
    JOKER: "sr-card-joker",
    SELECTED: "is-selected",
    DISABLED: "is-disabled",
    DEALING: "is-dealing"
});


/* ---------- 1. HTML ESCAPING ---------- */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ---------- 2. CARD VALIDATION ---------- */

function validateCard(card) {

    if (
        !card ||
        typeof card !== "object" ||
        !card.id
    ) {

        throw new Error("Invalid card supplied to renderer.");

    }

    if (card.type === "joker") {

        return true;

    }

    if (
        !SUIT_SYMBOLS[card.suit] ||
        !card.rank
    ) {

        throw new Error("Invalid standard card data.");

    }

    return true;

}


/* ---------- 3. CARD COLOUR ---------- */

export function getCardColor(card) {

    validateCard(card);

    if (card.type === "joker") {

        return "joker";

    }

    return (
        card.suit === "hearts" ||
        card.suit === "diamonds"
    )
        ? "red"
        : "black";

}


/* ---------- 4. CARD ACCESSIBILITY LABEL ---------- */

export function getCardAccessibleName(card) {

    validateCard(card);

    if (card.type === "joker") {

        return "Printed Joker";

    }

    return (
        `${card.rankName || card.rank} of ` +
        `${SUIT_NAMES[card.suit]}`
    );

}


/* ---------- 5. CORNER MARKUP ---------- */

function createCornerMarkup(card, position) {

    const rank = escapeHTML(card.rank);

    const symbol = SUIT_SYMBOLS[card.suit];

    const cornerClass =
        position === "bottom"
            ? "sr-card-corner sr-card-corner-bottom"
            : "sr-card-corner sr-card-corner-top";

    return `
        <div class="${cornerClass}">
            <span class="sr-card-rank">${rank}</span>
            <span class="sr-card-suit">${symbol}</span>
        </div>
    `;

}


/* ---------- 6. NUMBER CARD MARKUP ---------- */

function createNumberCardContent(card) {

    const symbol = SUIT_SYMBOLS[card.suit];

    const rankNumber = Number(card.rank);

    const count = Number.isInteger(rankNumber)
        ? rankNumber
        : 1;

    const safeCount = Math.min(
        Math.max(count, 1),
        10
    );

    const symbols = Array.from(
        { length: safeCount },
        (_, index) => `
            <span
                class="sr-card-pip"
                data-pip="${index + 1}"
            >${symbol}</span>
        `
    ).join("");

    return `
        <div class="sr-card-number-layout">
            ${symbols}
        </div>
    `;

}


/* ---------- 7. ACE CARD MARKUP ---------- */

function createAceContent(card) {

    const symbol = SUIT_SYMBOLS[card.suit];

    return `
        <div class="sr-card-ace-layout">
            <span class="sr-card-ace-symbol">
                ${symbol}
            </span>
        </div>
    `;

}


/* ---------- 8. FACE CARD MARKUP ---------- */

function createFaceCardContent(card) {

    const rank = escapeHTML(card.rank);

    const symbol = SUIT_SYMBOLS[card.suit];

    const faceName = {
        J: "Jack",
        Q: "Queen",
        K: "King"
    }[card.rank];

    return `
        <div class="sr-card-face-layout">

            <div class="sr-card-face-frame">

                <span class="sr-card-face-crown">
                    ✦
                </span>

                <span class="sr-card-face-rank">
                    ${rank}
                </span>

                <span class="sr-card-face-symbol">
                    ${symbol}
                </span>

                <span class="sr-card-face-name">
                    ${faceName}
                </span>

                <span class="sr-card-face-crown">
                    ✦
                </span>

            </div>

        </div>
    `;

}


/* ---------- 9. STANDARD CARD CONTENT ---------- */

function createStandardCardContent(card) {

    if (card.rank === "A") {

        return createAceContent(card);

    }

    if (FACE_RANKS.includes(card.rank)) {

        return createFaceCardContent(card);

    }

    return createNumberCardContent(card);

}


/* ---------- 10. JOKER CARD CONTENT ---------- */

function createJokerContent() {

    return `
        <div class="sr-joker-layout">

            <div class="sr-joker-decoration">
                ✦
            </div>

            <div class="sr-joker-star">
                ★
            </div>

            <div class="sr-joker-title">
                JOKER
            </div>

            <div class="sr-joker-subtitle">
                SUPER RUMMY
            </div>

            <div class="sr-joker-decoration">
                ✦
            </div>

        </div>
    `;

}


/* ---------- 11. CREATE CARD HTML ---------- */

export function renderCard(card, options = {}) {

    validateCard(card);

    const {

        selected = false,

        disabled = false,

        dealing = false,

        compact = false,

        faceDown = false,

        animationDelay = 0,

        className = ""

    } = options;

    const safeId = escapeHTML(card.id);

    const cardColor = getCardColor(card);

    const classes = [

        CARD_CLASSES.ROOT,

        cardColor === "red"
            ? CARD_CLASSES.RED
            : "",

        cardColor === "black"
            ? CARD_CLASSES.BLACK
            : "",

        cardColor === "joker"
            ? CARD_CLASSES.JOKER
            : "",

        selected
            ? CARD_CLASSES.SELECTED
            : "",

        disabled
            ? CARD_CLASSES.DISABLED
            : "",

        dealing
            ? CARD_CLASSES.DEALING
            : "",

        compact
            ? "sr-card-compact"
            : "",

        className

    ].filter(Boolean).join(" ");

    const safeDelay = Number.isFinite(animationDelay)
        ? Math.max(0, Math.min(animationDelay, 5000))
        : 0;

    const accessibleName = faceDown
        ? "Face down playing card"
        : getCardAccessibleName(card);

    if (faceDown) {

        return `
            <div
                class="${classes} sr-card-back"
                data-card-id="${safeId}"
                role="img"
                aria-label="${accessibleName}"
                style="--card-delay:${safeDelay}ms"
            >
                <div class="sr-card-back-border">
                    <div class="sr-card-back-pattern">
                        <span>✦</span>
                        <span>SUPER</span>
                        <span>RUMMY</span>
                        <span>✦</span>
                    </div>
                </div>
            </div>
        `;

    }

    const content = card.type === "joker"
        ? createJokerContent()
        : createStandardCardContent(card);

    const corners = card.type === "joker"
        ? ""
        : (
            createCornerMarkup(card, "top") +
            createCornerMarkup(card, "bottom")
        );

    return `
        <div
            class="${classes}"
            data-card-id="${safeId}"
            data-card-suit="${escapeHTML(card.suit || "joker")}"
            data-card-rank="${escapeHTML(card.rank)}"
            role="img"
            aria-label="${escapeHTML(accessibleName)}"
            style="--card-delay:${safeDelay}ms"
        >

            <div class="sr-card-inner">

                ${corners}

                <div class="sr-card-center">
                    ${content}
                </div>

                <div class="sr-card-gloss"></div>

            </div>

        </div>
    `;

}


/* ---------- 12. CREATE CARD ELEMENT ---------- */

export function createCardElement(card, options = {}) {

    const template = document.createElement("template");

    template.innerHTML = renderCard(
        card,
        options
    ).trim();

    const element = template.content.firstElementChild;

    if (!element) {

        throw new Error("Unable to create card element.");

    }

    return element;

}


/* ---------- 13. RENDER CARD COLLECTION ---------- */

export function renderCards(cards, options = {}) {

    if (!Array.isArray(cards)) {

        throw new Error("Cards must be an array.");

    }

    return cards.map((card, index) => {

        return renderCard(card, {

            ...options,

            animationDelay:
                options.stagger === false
                    ? 0
                    : index * (options.staggerDelay || 45)

        });

    }).join("");

}


/* ---------- 14. MOUNT CARDS ---------- */

export function mountCards(container, cards, options = {}) {

    if (!container || !container.appendChild) {

        throw new Error("Valid container element required.");

    }

    if (!Array.isArray(cards)) {

        throw new Error("Cards must be an array.");

    }

    const fragment = document.createDocumentFragment();

    cards.forEach((card, index) => {

        const element = createCardElement(card, {

            ...options,

            animationDelay:
                options.stagger === false
                    ? 0
                    : index * (options.staggerDelay || 45)

        });

        fragment.appendChild(element);

    });

    container.replaceChildren(fragment);

    return container.children.length;

}


/* ---------- 15. UPDATE CARD SELECTION ---------- */

export function setCardSelected(cardElement, selected) {

    if (!cardElement) {

        return false;

    }

    cardElement.classList.toggle(
        CARD_CLASSES.SELECTED,
        Boolean(selected)
    );

    return true;

}


/* ---------- 16. UPDATE CARD DISABLED STATE ---------- */

export function setCardDisabled(cardElement, disabled) {

    if (!cardElement) {

        return false;

    }

    cardElement.classList.toggle(
        CARD_CLASSES.DISABLED,
        Boolean(disabled)
    );

    return true;

}


/* ---------- 17. GET CARD FROM ELEMENT ---------- */

export function getCardIdFromElement(element) {

    const cardElement = element?.closest(
        `.${CARD_CLASSES.ROOT}`
    );

    return cardElement?.dataset.cardId || null;

}


/* ---------- FILE ENDING ---------- */
