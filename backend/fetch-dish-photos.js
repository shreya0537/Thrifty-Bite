/*
 * One-off script: finds a real, verified Wikimedia Commons photo
 * for each menu item and writes a { dishName: photoUrl } mapping
 * to dish-photos.json. Not part of the running app — seedMenu.js
 * reads the output file afterward. Re-runnable: skips items that
 * already have a result from a previous run.
 *
 * Quality gate: a candidate is only accepted if its own Commons
 * file title actually shares a significant word with the dish
 * name (not just the search query used to find it), and doesn't
 * contain red-flag words suggesting it's not a prepared-food photo
 * (market/farm/live animal/supermarket/etc). This is what catches
 * cases like "Chicken Frankie" matching a photo of live chickens,
 * or a generic category fallback matching something unrelated.
 */

const fs = require("fs");
const path = require("path");
const { menuData } = require("./seedMenu");

const OUT_FILE = path.join(__dirname, "dish-photos.json");
const USER_AGENT = "ThriftyBiteMenuBot/1.0 (college project; educational use)";

const STRIP_WORDS = [
    "royal", "special", "signature", "classic", "premium", "supreme",
    "loaded", "delight", "golden", "family", "mini", "fresh", "spicy",
    "crispy", "double", "triple", "extra", "smart", "thrifty", "bite"
];

const RELEVANCE_STOP = new Set([
    ...STRIP_WORDS,
    "with", "and", "the", "of", "a", "an", "in", "style", "dish", "food"
]);

function significantWords(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) => !RELEVANCE_STOP.has(w));
}

function cleanQuery(name) {
    const words = significantWords(name);
    return (words.length ? words : [name.toLowerCase()]).join(" ");
}

const CATEGORY_FALLBACK = {
    "Biryani": "biryani rice dish",
    "Pizza": "pizza",
    "Burgers": "burger",
    "Chinese": "chinese noodles stir fry",
    "Pasta": "pasta",
    "North Indian": "indian curry dish",
    "South Indian": "south indian dosa idli",
    "Rolls & Wraps": "kathi roll wrap food",
    "Desserts": "indian dessert sweet",
    "Beverages": "drink beverage glass"
};

const MIN_BYTES = 15000;
const REQUEST_SPACING_MS = 2000;
const RED_FLAGS = /market|farm(?!hous)|\blive\b|raw ingredient|plantation|harvest|\bfield\b|supermarket|grocery|shop front|menu board|price list|receipt|packaging|unopened|advertisement|billboard/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastRequestAt = 0;

async function throttle() {
    const wait = lastRequestAt + REQUEST_SPACING_MS - Date.now();
    if (wait > 0) {
        await sleep(wait);
    }
    lastRequestAt = Date.now();
}

async function searchCommons(query, limit, attempt = 1) {
    const url = "https://commons.wikimedia.org/w/api.php"
        + "?action=query&generator=search"
        + "&gsrsearch=" + encodeURIComponent(query + " filetype:bitmap")
        + "&gsrnamespace=6"
        + "&gsrlimit=" + limit
        + "&prop=imageinfo"
        + "&iiprop=url|mime|size"
        + "&iiurlwidth=500"
        + "&format=json";

    await throttle();

    try {
        const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get("retry-after"), 10);
            const waitMs = (Number.isFinite(retryAfter) ? retryAfter : 15) * 1000;
            console.log(`  [429] waiting ${waitMs / 1000}s before retry...`);
            await sleep(waitMs);

            if (attempt < 4) {
                return searchCommons(query, limit, attempt + 1);
            }
            console.log(`  [retry exhausted after 429] "${query}"`);
            return [];
        }

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (!data.query || !data.query.pages) {
            return [];
        }

        return Object.values(data.query.pages)
            .filter((p) => p.imageinfo && p.imageinfo[0])
            .map((p) => ({
                title: p.title,
                url: p.imageinfo[0].thumburl || p.imageinfo[0].url,
                mime: p.imageinfo[0].mime,
                size: p.imageinfo[0].size || 0
            }))
            .filter((p) => ["image/jpeg", "image/png"].includes(p.mime))
            .filter((p) => p.size >= MIN_BYTES)
            .filter((p) => !/logo|flag|map|diagram|icon|seal of|coat of arms/i.test(p.title))
            .filter((p) => !RED_FLAGS.test(p.title));

    } catch (err) {
        if (attempt < 3) {
            await sleep(2000 * attempt);
            return searchCommons(query, limit, attempt + 1);
        }
        console.log(`  [retry exhausted] "${query}": ${err.message}`);
        return [];
    }
}

/* Accept a candidate only if its own title shares a real word with the dish name */
function isRelevant(candidateTitle, dishWords) {
    const titleLower = candidateTitle.toLowerCase();
    return dishWords.some((w) => w.length > 2 && titleLower.includes(w));
}

function pickRelevant(candidates, dishWords, usedUrls) {
    return candidates.find((c) => !usedUrls.has(c.url) && isRelevant(c.title, dishWords));
}

async function main() {
    const results = fs.existsSync(OUT_FILE)
        ? JSON.parse(fs.readFileSync(OUT_FILE, "utf8"))
        : {};

    const usedUrls = new Set(Object.values(results));
    const misses = [];

    const todo = menuData.filter((item) => !results[item.name]);
    console.log(`Already have ${Object.keys(results).length}. Fetching ${todo.length} more...`);

    for (let i = 0; i < todo.length; i++) {
        const item = todo[i];
        const dishWords = significantWords(item.name);
        const query = cleanQuery(item.name);

        let candidates = await searchCommons(query, 10);
        let picked = pickRelevant(candidates, dishWords, usedUrls);

        if (!picked && dishWords.length > 2) {
            const narrowerQuery = dishWords.slice(-2).join(" ");
            candidates = await searchCommons(narrowerQuery, 10);
            picked = pickRelevant(candidates, dishWords, usedUrls);
        }

        if (!picked) {
            const fallbackQuery = CATEGORY_FALLBACK[item.category] || item.category;
            candidates = await searchCommons(fallbackQuery, 20);
            picked = pickRelevant(candidates, dishWords, usedUrls);
        }

        if (picked) {
            results[item.name] = picked.url;
            usedUrls.add(picked.url);
        } else {
            misses.push(item.name);
        }

        if ((i + 1) % 10 === 0) {
            console.log(`Progress: ${i + 1}/${todo.length} (${Object.keys(results).length} total matched)`);
            fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
        }
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));

    console.log(`Done. Total matched: ${Object.keys(results).length}/${menuData.length}.`);
    if (misses.length) {
        console.log("Still no match for:", misses);
    }
}

main().catch((err) => {
    console.error("Fetch failed:", err);
    process.exit(1);
});
