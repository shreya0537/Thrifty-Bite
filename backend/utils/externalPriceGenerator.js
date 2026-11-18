const ExternalFoodPrice = require("../models/externalFoodPrice");

/* =========================================================
   GENERATED SWIGGY / ZOMATO REFERENCE PRICES
   Any dish without admin-entered comparison rows (e.g. a dish a
   restaurant adds after seedDiscovery.js was run) gets random but
   realistic SAMPLE rows, so the price-comparison section always
   has something to show. Rows are stored once, so the numbers stay
   stable across page loads instead of changing on every refresh.
========================================================= */

const PLATFORMS = ["SWIGGY", "ZOMATO"];

const REFERENCE_RESTAURANT_NAMES = [
    "Paradise Restaurant",
    "Biryani House",
    "Annapoorna Restaurant",
    "Royal Treat",
    "Spice Route"
];

function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function computeTotal(row) {
    const effective = row.discountPrice != null ? row.discountPrice : row.price;
    return Math.round((effective + row.deliveryFee + row.packagingFee + row.tax) * 100) / 100;
}

function buildGeneratedRow(menuItem, platform) {
    const basePrice = menuItem.discountPrice ?? menuItem.price ?? 0;
    const markupPct = platform === "SWIGGY" ? randomInt(8, 18) : randomInt(4, 14);
    const price = Math.round(basePrice * (1 + markupPct / 100));

    const row = {
        menuItemId: menuItem._id,
        restaurantId: menuItem.restaurantId,
        platform,
        externalRestaurantName:
            REFERENCE_RESTAURANT_NAMES[randomInt(0, REFERENCE_RESTAURANT_NAMES.length - 1)],
        externalFoodName: menuItem.name,
        price,
        discountPrice: null,
        deliveryFee: randomInt(20, 35),
        packagingFee: randomInt(5, 12),
        tax: Math.round(price * 0.05),
        availability: true,
        sourceType: "SAMPLE",
        lastUpdated: new Date()
    };
    row.totalPrice = computeTotal(row);

    return row;
}

/* Upserts generated rows for one dish. With onlyMissing, platforms
   that already have a row (admin MANUAL or earlier SAMPLE) are kept. */
async function generatePricesForItem(menuItem, { onlyMissing = true } = {}) {
    const existing = await ExternalFoodPrice.find({ menuItemId: menuItem._id });
    const created = [];

    for (const platform of PLATFORMS) {
        const current = existing.find((r) => r.platform === platform);

        if (current && (onlyMissing || current.sourceType !== "SAMPLE")) continue;

        const row = await ExternalFoodPrice.findOneAndUpdate(
            { menuItemId: menuItem._id, platform },
            buildGeneratedRow(menuItem, platform),
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        created.push(row);
    }

    return created;
}

/* Fills in rows for every dish in menuItems that is missing a
   Swiggy/Zomato row. Returns the full, up-to-date row list. */
async function ensurePricesForItems(menuItems, externalRows) {
    const rows = [...externalRows];

    for (const menuItem of menuItems) {
        const platformsPresent = rows
            .filter((r) => String(r.menuItemId) === String(menuItem._id))
            .map((r) => r.platform);

        if (PLATFORMS.every((p) => platformsPresent.includes(p))) continue;

        const created = await generatePricesForItem(menuItem, { onlyMissing: true });
        rows.push(...created);
    }

    return rows;
}

module.exports = {
    generatePricesForItem,
    ensurePricesForItems
};
