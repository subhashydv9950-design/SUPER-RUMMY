
/* =====================================================
   SUPER RUMMY — COMMON UTILITIES
   FILE: js/core/utils.js
   VERSION: 1.0
===================================================== */

/* ---------- 1. ID GENERATOR ---------- */

export function generateId(prefix = "sr") {

    const randomPart = Math.random()
        .toString(36)
        .slice(2, 10);

    const timePart = Date.now().toString(36);

    return `${prefix}_${timePart}_${randomPart}`;

}


/* ---------- 2. NUMBER HELPERS ---------- */

export function clamp(value, minimum, maximum) {

    return Math.min(
        maximum,
        Math.max(minimum, value)
    );

}


export function randomInteger(minimum, maximum) {

    if (
        !Number.isInteger(minimum) ||
        !Number.isInteger(maximum) ||
        maximum < minimum
    ) {

        throw new Error("Invalid random integer range.");

    }

    return Math.floor(
        Math.random() * (maximum - minimum + 1)
    ) + minimum;

}


/* ---------- 3. ARRAY HELPERS ---------- */

export function shuffleArray(items) {

    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {

        const j = randomInteger(0, i);

        [result[i], result[j]] = [
            result[j],
            result[i]
        ];

    }

    return result;

}


export function groupArray(items, groupSize) {

    if (
        !Number.isInteger(groupSize) ||
        groupSize < 1
    ) {

        throw new Error("Group size must be a positive integer.");

    }

    const groups = [];

    for (let i = 0; i < items.length; i += groupSize) {

        groups.push(
            items.slice(i, i + groupSize)
        );

    }

    return groups;

}


/* ---------- 4. OBJECT HELPERS ---------- */

export function deepClone(value) {

    if (typeof structuredClone === "function") {

        return structuredClone(value);

    }

    return JSON.parse(JSON.stringify(value));

}


export function isPlainObject(value) {

    if (
        value === null ||
        typeof value !== "object"
    ) {

        return false;

    }

    const prototype = Object.getPrototypeOf(value);

    return (
        prototype === Object.prototype ||
        prototype === null
    );

}


/* ---------- 5. VALIDATION HELPERS ---------- */

export function isValidString(value, minimumLength = 1) {

    return (
        typeof value === "string" &&
        value.trim().length >= minimumLength
    );

}


export function isValidNumber(value) {

    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );

}


export function isValidPlayerCount(count) {

    return (
        Number.isInteger(count) &&
        count >= 2 &&
        count <= 4
    );

}


/* ---------- 6. DATE AND TIME HELPERS ---------- */

export function getTimestamp() {

    return Date.now();

}


export function formatDuration(seconds) {

    const safeSeconds = Math.max(
        0,
        Math.floor(seconds)
    );

    const minutes = Math.floor(safeSeconds / 60);

    const remainingSeconds = safeSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );

}


/* ---------- 7. SAFE JSON HELPERS ---------- */

export function safeJSONParse(value, fallback = null) {

    try {

        return JSON.parse(value);

    } catch {

        return fallback;

    }

}


export function safeJSONStringify(value, fallback = "{}") {

    try {

        return JSON.stringify(value);

    } catch {

        return fallback;

    }

}


/* ---------- 8. DEBOUNCE ---------- */

export function debounce(callback, delay = 250) {

    let timeoutId = null;

    return (...args) => {

        if (timeoutId !== null) {

            clearTimeout(timeoutId);

        }

        timeoutId = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}


/* ---------- 9. FILE ENDING ---------- */
