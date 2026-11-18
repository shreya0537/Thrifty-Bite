const Menu = require("../models/menu");
const DiscoveryCategory = require("../models/discoveryCategory");

/* =========================================================
   CATEGORY MATCHING
   Restaurants type their own category names ("biryani",
   "burger", "Pasta & Noodles"), while the home page tiles use
   fixed names ("Biryani", "Burgers", "Pasta", "Noodles").
   Matching is case-insensitive, ignores plural "s" and splits
   combined names on "&", "and", "," and "/".
========================================================= */

function normalizeWord(word) {
    if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
        return word.slice(0, -1);
    }
    return word;
}

function normalizeCategory(str) {
    return String(str || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map(normalizeWord)
        .join(" ");
}

function categoryParts(str) {
    const parts = String(str || "")
        .split(/&|,|\/|\band\b/i)
        .map(normalizeCategory)
        .filter(Boolean);

    return new Set([normalizeCategory(str), ...parts].filter(Boolean));
}

function categoriesMatch(a, b) {
    const partsA = categoryParts(a);
    for (const part of categoryParts(b)) {
        if (partsA.has(part)) return true;
    }
    return false;
}

const EMOJI_HINTS = [
    [/juice|shake|smoothie|drink|beverage|coffee|tea|lassi/, "🧃"],
    [/fries|fry|chips/, "🍟"],
    [/breakfast|idli|pongal|egg/, "🍳"],
    [/biryani|rice/, "🍛"],
    [/pizza/, "🍕"],
    [/burger/, "🍔"],
    [/dessert|sweet|cake|ice cream/, "🍰"],
    [/roll|wrap|shawarma/, "🌯"],
    [/noodle|pasta/, "🍝"],
    [/chicken|tandoori|grill|bbq/, "🍗"],
    [/salad|healthy/, "🥗"],
    [/soup/, "🍲"],
    [/sandwich/, "🥪"],
    [/snack|starter/, "🥟"]
];

function guessEmoji(name) {
    const lower = String(name).toLowerCase();
    const hit = EMOJI_HINTS.find(([regex]) => regex.test(lower));
    return hit ? hit[1] : "🍽️";
}

function toTitleCase(str) {
    return String(str).trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Adds a home-page tile for every menu category (of available
   dishes) that no existing tile matches, so a category a
   restaurant adds later shows up for customers automatically. */
async function syncDiscoveryCategories() {
    const [menuCategories, tiles] = await Promise.all([
        Menu.distinct("category", { isAvailable: true }),
        DiscoveryCategory.find()
    ]);

    let nextOrder = tiles.reduce((max, t) => Math.max(max, t.displayOrder || 0), 0) + 1;
    const knownNames = tiles.map((t) => t.name);

    for (const category of menuCategories) {
        if (!category || knownNames.some((name) => categoriesMatch(name, category))) continue;

        const name = toTitleCase(category);

        await DiscoveryCategory.updateOne(
            { name },
            { $setOnInsert: { name, image: guessEmoji(name), displayOrder: nextOrder++, active: true } },
            { upsert: true }
        );
        knownNames.push(name);
    }
}

module.exports = {
    categoriesMatch,
    syncDiscoveryCategories
};
