/*
 * One-off, re-runnable seed for the Food-First Discovery module (PDF §19):
 * - DiscoveryCategory: the 20 home-page category tiles (§19.1/§19.15).
 * - ExternalFoodPrice: a handful of SAMPLE Swiggy/Zomato reference rows
 *   attached to real seeded Menu items, so the cart/menu price-comparison
 *   UI has something real to render out of the box (§19.5).
 *
 * Safe to re-run: categories upsert by name, price rows upsert by
 * (menuItemId, platform).
 */

require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const DiscoveryCategory = require("./models/discoveryCategory");
const ExternalFoodPrice = require("./models/externalFoodPrice");
const Menu = require("./models/menu");

/* Name + representative emoji, in the PDF's §19.1 display order */
const CATEGORIES = [
    ["South Indian", "🥘"],
    ["North Indian", "🍲"],
    ["Pizza", "🍕"],
    ["Biryani", "🍛"],
    ["Desserts", "🍰"],
    ["Chinese", "🥡"],
    ["Dosa", "🥞"],
    ["Parotta", "🫓"],
    ["Ice Cream", "🍨"],
    ["Rolls", "🌯"],
    ["Noodles", "🍜"],
    ["Juice", "🧃"],
    ["Shawarma", "🌯"],
    ["Pasta", "🍝"],
    ["Burgers", "🍔"],
    ["Sandwiches", "🥪"],
    ["Cakes", "🎂"],
    ["Tandoori", "🍢"],
    ["Fried Rice", "🍚"],
    ["Momos", "🥟"]
];

async function seedCategories() {
    let count = 0;

    for (let i = 0; i < CATEGORIES.length; i++) {
        const [name, emoji] = CATEGORIES[i];

        await DiscoveryCategory.findOneAndUpdate(
            { name },
            { name, image: emoji, displayOrder: i, active: true },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        count++;
    }

    console.log(`Discovery categories seeded/updated: ${count}`);
}

/*
 * Sample comparison rows, matched against real seeded dish NAMES
 * (case-insensitive substring) rather than hard-coded ids, so this
 * script keeps working across reseeds. Numbers loosely follow the
 * PDF §19.5 sample table's shape (Swiggy/Zomato both slightly
 * higher than "Our App", with different delivery/tax splits).
 */
const SAMPLE_ROWS = [
    { match: /royal chicken biryani/i, swiggy: { price: 240, deliveryFee: 30, packagingFee: 10, tax: 15 }, zomato: { price: 235, deliveryFee: 25, packagingFee: 10, tax: 14 } },
    { match: /paneer tikka pizza|cheese paneer pizza|paneer pizza/i, swiggy: { price: 300, deliveryFee: 30, packagingFee: 10, tax: 16 }, zomato: { price: 290, deliveryFee: 25, packagingFee: 10, tax: 15 } },
    { match: /masala dosa/i, swiggy: { price: 110, deliveryFee: 25, packagingFee: 8, tax: 6 }, zomato: { price: 105, deliveryFee: 20, packagingFee: 8, tax: 6 } },
    { match: /veg noodles|hakka noodles/i, swiggy: { price: 160, deliveryFee: 25, packagingFee: 8, tax: 8 }, zomato: { price: 150, deliveryFee: 20, packagingFee: 8, tax: 8 } },
    { match: /chocolate.*cake|cake.*chocolate/i, swiggy: { price: 180, deliveryFee: 25, packagingFee: 10, tax: 9 }, zomato: { price: 175, deliveryFee: 20, packagingFee: 10, tax: 9 } },
    { match: /chicken shawarma/i, swiggy: { price: 190, deliveryFee: 25, packagingFee: 10, tax: 9 }, zomato: { price: 180, deliveryFee: 25, packagingFee: 10, tax: 9 } }
];

function computeTotal(row) {
    const effective = row.discountPrice != null ? row.discountPrice : row.price;
    return Math.round((effective + row.deliveryFee + row.packagingFee + row.tax) * 100) / 100;
}

async function seedSamplePrices() {
    let seeded = 0;
    const coveredIds = new Set();

    for (const sample of SAMPLE_ROWS) {
        const menuItem = await Menu.findOne({ name: sample.match });

        if (!menuItem) {
            console.log(`No matching seeded dish for pattern ${sample.match} — skipped.`);
            continue;
        }

        coveredIds.add(String(menuItem._id));

        for (const platform of ["SWIGGY", "ZOMATO"]) {
            const platformData = sample[platform.toLowerCase()];
            if (!platformData) continue;

            const row = {
                menuItemId: menuItem._id,
                restaurantId: menuItem.restaurantId,
                platform,
                externalRestaurantName: platform === "SWIGGY" ? "Paradise Restaurant" : "Biryani House",
                externalFoodName: menuItem.name,
                price: platformData.price,
                discountPrice: null,
                deliveryFee: platformData.deliveryFee,
                packagingFee: platformData.packagingFee,
                tax: platformData.tax,
                availability: true,
                sourceType: "SAMPLE",
                lastUpdated: new Date()
            };
            row.totalPrice = computeTotal(row);

            await ExternalFoodPrice.findOneAndUpdate(
                { menuItemId: menuItem._id, platform },
                row,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            seeded++;
        }
    }

    console.log(`Sample platform price rows seeded/updated: ${seeded}`);
    return coveredIds;
}

/*
 * Deterministic string hash (same input always yields the same output),
 * so re-running this script produces identical generated prices instead
 * of new random ones each time.
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

const REFERENCE_RESTAURANT_NAMES = [
    "Paradise Restaurant",
    "Biryani House",
    "Annapoorna Restaurant",
    "Royal Treat",
    "Spice Route"
];

/*
 * The 6 SAMPLE_ROWS above are the PDF's own worked examples (exact
 * showcase numbers). Everything else in the 180-dish catalog gets a
 * procedurally generated but realistic-looking reference price, the
 * same way the project already generates a placeholder icon for any
 * dish that doesn't have a real photo (backend/utils/foodIcon.js) —
 * without this, "Price comparison unavailable" is what nearly every
 * real cart would show, since only 5 dishes had any reference data.
 */
async function seedGeneratedPricesForRemainingItems(coveredIds) {
    const menuItems = await Menu.find({ _id: { $nin: Array.from(coveredIds) } });

    let seeded = 0;

    for (const menuItem of menuItems) {
        const hash = hashString(String(menuItem._id));
        const basePrice = menuItem.discountPrice ?? menuItem.price;

        const swiggyMarkupPct = 8 + (hash % 10);           // 8%–17% above our price
        const zomatoMarkupPct = 4 + ((hash >>> 4) % 10);   // 4%–13% above our price

        const swiggyPrice = Math.round(basePrice * (1 + swiggyMarkupPct / 100));
        const zomatoPrice = Math.round(basePrice * (1 + zomatoMarkupPct / 100));

        const platformRows = {
            SWIGGY: {
                price: swiggyPrice,
                deliveryFee: 20 + (hash % 16),           // 20–35
                packagingFee: 5 + (hash % 8),             // 5–12
                tax: Math.round(swiggyPrice * 0.05),
                externalRestaurantName: REFERENCE_RESTAURANT_NAMES[hash % REFERENCE_RESTAURANT_NAMES.length]
            },
            ZOMATO: {
                price: zomatoPrice,
                deliveryFee: 20 + ((hash >>> 8) % 11),     // 20–30
                packagingFee: 5 + ((hash >>> 12) % 8),     // 5–12
                tax: Math.round(zomatoPrice * 0.05),
                externalRestaurantName: REFERENCE_RESTAURANT_NAMES[(hash >>> 16) % REFERENCE_RESTAURANT_NAMES.length]
            }
        };

        for (const platform of ["SWIGGY", "ZOMATO"]) {
            const platformData = platformRows[platform];

            const row = {
                menuItemId: menuItem._id,
                restaurantId: menuItem.restaurantId,
                platform,
                externalRestaurantName: platformData.externalRestaurantName,
                externalFoodName: menuItem.name,
                price: platformData.price,
                discountPrice: null,
                deliveryFee: platformData.deliveryFee,
                packagingFee: platformData.packagingFee,
                tax: platformData.tax,
                availability: true,
                sourceType: "SAMPLE",
                lastUpdated: new Date()
            };
            row.totalPrice = computeTotal(row);

            await ExternalFoodPrice.findOneAndUpdate(
                { menuItemId: menuItem._id, platform },
                row,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            seeded++;
        }
    }

    console.log(`Generated platform price rows seeded/updated for remaining dishes: ${seeded} (covering ${menuItems.length} dishes)`);
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");

    await seedCategories();
    const coveredIds = await seedSamplePrices();
    await seedGeneratedPricesForRemainingItems(coveredIds);

    await mongoose.disconnect();
    console.log("Done.");
}

if (require.main === module) {
    run().catch((error) => {
        console.error("Seed discovery error:", error);
        process.exit(1);
    });
}

module.exports = { CATEGORIES, SAMPLE_ROWS };
