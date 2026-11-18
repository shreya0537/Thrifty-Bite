/*
 * Maps a dish name to a representative emoji, used to generate a
 * distinct-looking placeholder image per menu item (no external
 * image URLs — see PROJECT.md for why).
 *
 * Checked in order, most specific phrase first, so e.g.
 * "Chicken Biryani" matches "biryani" before the generic
 * "chicken" fallback.
 */

const KEYWORD_EMOJI = [
    ["biryani", "🍛"],
    ["pizza", "🍕"],
    ["burger", "🍔"],

    ["pasta", "🍝"], ["macaroni", "🍝"], ["penne", "🍝"], ["spaghetti", "🍝"],

    ["hakka noodles", "🍜"], ["noodles", "🍜"], ["chowmein", "🍜"],
    ["fried rice", "🍚"],

    ["momos", "🥟"], ["dumpling", "🥟"], ["spring roll", "🥟"],

    ["manchurian", "🍲"], ["chilli chicken", "🍲"], ["chilli paneer", "🍲"],
    ["dragon", "🍲"], ["honey chilli", "🍲"], ["65", "🍲"],

    ["gobi", "🥦"],

    ["mysore masala dosa", "🥞"], ["dosa", "🥞"], ["uttapam", "🥞"],
    ["idli", "🍘"], ["vada", "🍩"],
    ["pongal", "🍚"], ["upma", "🍚"],
    ["curd rice", "🍚"], ["lemon rice", "🍚"], ["tamarind rice", "🍚"],
    ["jeera rice", "🍚"], ["bisibele", "🍚"],

    ["thali", "🍱"], ["combo", "🍱"], ["platter", "🍱"],

    ["kathi", "🌯"], ["frankie", "🌯"], ["roll", "🌯"], ["wrap", "🌯"],

    ["lava cake", "🍫"], ["brownie", "🍫"], ["cake", "🍰"], ["cheesecake", "🍰"],
    ["mousse", "🍮"], ["custard", "🍮"], ["tres leches", "🍮"],
    ["kulfi", "🍨"], ["ice cream", "🍨"],
    ["gulab jamun", "🍮"], ["rasmalai", "🍮"], ["halwa", "🍮"], ["jamun", "🍮"],
    ["fruit cream", "🍧"],

    ["filter coffee", "☕"], ["cold coffee", "☕"], ["coffee", "☕"],
    ["masala chai", "🍵"], ["chai", "🍵"], ["tea", "🍵"],
    ["milkshake", "🥤"], ["rose milk", "🥤"],
    ["lassi", "🥛"],
    ["lime soda", "🍋"], ["mojito", "🍹"],

    ["korma", "🍲"], ["rogan josh", "🍲"], ["handi", "🍲"], ["kofta", "🍲"],
    ["lababdar", "🍲"], ["shahi", "🍲"], ["kadai", "🍲"], ["palak", "🍲"],
    ["chole", "🍲"], ["rajma", "🍲"], ["dal ", "🍲"], ["butter chicken", "🍲"],
    ["butter masala", "🍲"], ["matar", "🍲"],

    ["tikka masala", "🍲"], ["tikka", "🍢"], ["tandoori", "🍢"], ["kebab", "🍢"],

    ["prawn", "🦐"], ["fish", "🐟"], ["seafood", "🐟"],
    ["mutton", "🥩"], ["keema", "🥩"],
    ["egg", "🥚"],
    ["chicken", "🍗"],
    ["paneer", "🧀"], ["soya", "🌱"], ["mushroom", "🍄"], ["corn", "🌽"],
    ["aloo", "🥔"], ["potato", "🥔"]
];

const CATEGORY_EMOJI = {
    "Biryani": "🍛",
    "Pizza": "🍕",
    "Burgers": "🍔",
    "Chinese": "🥡",
    "Pasta": "🍝",
    "North Indian": "🍲",
    "South Indian": "🥘",
    "Rolls & Wraps": "🌯",
    "Desserts": "🍰",
    "Beverages": "🥤"
};

/* Curated maroon/gold-family gradient pairs, cycled for variety */
const PALETTE = [
    ["#8f1d3c", "#2b0714"],
    ["#b8912a", "#4b0d1d"],
    ["#a1502a", "#2b0714"],
    ["#7a1f3d", "#2b0714"],
    ["#c9a227", "#4b0d1d"],
    ["#8f1d3c", "#4b0d1d"],
    ["#b8912a", "#2b0714"],
    ["#6b1428", "#260611"],
    ["#a1502a", "#4b0d1d"],
    ["#7a1f3d", "#4b0d1d"]
];

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function getFoodIcon(name, category) {
    const lower = name.toLowerCase();

    let emoji = CATEGORY_EMOJI[category] || "🍽️";

    for (const [keyword, kwEmoji] of KEYWORD_EMOJI) {
        if (lower.includes(keyword)) {
            emoji = kwEmoji;
            break;
        }
    }

    const palette = PALETTE[hashString(name) % PALETTE.length];

    return {
        emoji,
        colorFrom: palette[0],
        colorTo: palette[1],
        slug: slugify(name)
    };
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function renderIconSvg(name, category) {
    const icon = getFoodIcon(name, category);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${icon.colorFrom}"/>
      <stop offset="100%" stop-color="${icon.colorTo}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="480" height="360" fill="url(#g)"/>
  <rect width="480" height="360" fill="url(#glow)"/>
  <rect x="10" y="10" width="460" height="340" fill="none" stroke="#d4af37" stroke-opacity="0.45" stroke-width="1.5" rx="18"/>
  <text x="240" y="185" font-size="120" text-anchor="middle" dominant-baseline="middle">${icon.emoji}</text>
  <text x="240" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="24" fill="#f7df7a" text-anchor="middle" letter-spacing="0.5">${escapeXml(name)}</text>
</svg>`;
}

module.exports = { getFoodIcon, slugify, renderIconSvg };
