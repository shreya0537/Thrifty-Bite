console.log("🔥 THIS IS THE MENU ROUTES FILE");
const express = require("express");
const Menu = require("../models/menu");
const User = require("../models/user");
const DiscoveryCategory = require("../models/discoveryCategory");
const ExternalFoodPrice = require("../models/externalFoodPrice");
const matchVoiceOrder = require("../utils/voiceOrderMatcher");
const { renderIconSvg } = require("../utils/foodIcon");
const { ensurePricesForItems } = require("../utils/externalPriceGenerator");
const { categoriesMatch, syncDiscoveryCategories } = require("../utils/categoryMatch");

const router = express.Router();
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Menu routes are working"
    });
});


/* =========================================================
   DYNAMIC DISH ICON
   Generates a placeholder SVG on the fly from a dish name +
   category, so any menu item without a photo (including ones
   added after the initial seed) still gets a distinct,
   relevant picture instead of one generic icon for everything.

   GET /api/menu/icon?name=Paneer+Tikka&category=North+Indian
========================================================= */

router.get("/icon", (req, res) => {
    const name = (req.query.name || "Thrifty Bite").toString();
    const category = (req.query.category || "").toString();

    const svg = renderIconSvg(name, category);

    res.set("Content-Type", "image/svg+xml");
    res.set("Cache-Control", "public, max-age=86400");
    res.status(200).send(svg);
});

/* =========================================================
   LIST RESTAURANTS
   GET /api/menu/restaurants
========================================================= */

router.get("/restaurants", async (req, res) => {
    try {
        const restaurants = await User.find({
            role: "RESTAURANT",
            isActive: true
        }).select("name ownerName address").sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants: restaurants
        });

    } catch (error) {
        console.error("List restaurants error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching restaurants."
        });
    }
});


/* =========================================================
   FOOD-FIRST DISCOVERY CATEGORIES (PDF §19.1, §19.4)
   GET /api/menu/discovery-categories
========================================================= */

router.get("/discovery-categories", async (req, res) => {
    try {
        // New restaurant categories (e.g. "fries") get their own tile
        await syncDiscoveryCategories().catch((err) =>
            console.error("Sync discovery categories error:", err)
        );

        const categories = await DiscoveryCategory.find({ active: true }).sort({ displayOrder: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories: categories
        });

    } catch (error) {
        console.error("List discovery categories error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching food categories."
        });
    }
});


/* =========================================================
   FOOD SEARCH (PDF §19.12)
   Matches food name, description/tags, category name and
   restaurant name — broader than the category-only filter
   the existing Food Browsing module (§3) had.

   GET /api/menu/search?q=biryani
========================================================= */

router.get("/search", async (req, res) => {
    try {
        const q = (req.query.q || "").toString().trim();

        if (!q) {
            return res.status(200).json({ success: true, count: 0, menu: [] });
        }

        const regex = new RegExp(q.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");

        const matchingRestaurantIds = await User.find({
            role: "RESTAURANT",
            name: regex
        }).distinct("_id");

        const menu = await Menu.find({
            isAvailable: true,
            $or: [
                { name: regex },
                { description: regex },
                { category: regex },
                { tags: regex },
                { restaurantId: { $in: matchingRestaurantIds } }
            ]
        })
            .populate("restaurantId", "name address avatar")
            .sort({ category: 1, name: 1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: menu.length,
            menu: menu
        });

    } catch (error) {
        console.error("Search menu error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while searching food."
        });
    }
});


/* =========================================================
   PRICE COMPARISON — BATCH (PDF §19.7/§19.10, cart use)
   Our App price always comes live from the Menu item itself;
   Swiggy/Zomato rows come from admin-entered ExternalFoodPrice
   reference data, if any exist for that item.

   GET /api/menu/price-comparison?ids=id1,id2,id3
========================================================= */

router.get("/price-comparison", async (req, res) => {
    try {
        const ids = (req.query.ids || "").toString().split(",").map((s) => s.trim()).filter(Boolean);

        if (ids.length === 0) {
            return res.status(200).json({ success: true, items: [] });
        }

        const [menuItems, storedRows] = await Promise.all([
            Menu.find({ _id: { $in: ids } }),
            ExternalFoodPrice.find({ menuItemId: { $in: ids } })
        ]);

        // Dishes added after seeding get generated Swiggy/Zomato rows here
        const externalRows = await ensurePricesForItems(menuItems, storedRows);

        const items = menuItems.map((menuItem) => buildComparisonForItem(menuItem, externalRows));

        res.status(200).json({
            success: true,
            items: items
        });

    } catch (error) {
        console.error("Batch price comparison error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching price comparison."
        });
    }
});


/* =========================================================
   PRICE COMPARISON — SINGLE ITEM (PDF §19.9, menu display)
   GET /api/menu/:id/price-comparison
========================================================= */

router.get("/:id/price-comparison", async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        const storedRows = await ExternalFoodPrice.find({ menuItemId: menuItem._id });
        const externalRows = await ensurePricesForItems([menuItem], storedRows);

        res.status(200).json({
            success: true,
            comparison: buildComparisonForItem(menuItem, externalRows)
        });

    } catch (error) {
        console.error("Single item price comparison error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching price comparison."
        });
    }
});


function buildComparisonForItem(menuItem, externalRows) {
    const ourAppPrice = menuItem.discountPrice ?? menuItem.price;

    const rowsForItem = externalRows.filter(
        (row) => String(row.menuItemId) === String(menuItem._id)
    );

    const platformRow = (platform) => {
        const row = rowsForItem.find((r) => r.platform === platform);
        if (!row) return null;

        return {
            price: row.price,
            discountPrice: row.discountPrice,
            deliveryFee: row.deliveryFee,
            packagingFee: row.packagingFee,
            tax: row.tax,
            totalPrice: row.totalPrice,
            availability: row.availability,
            externalRestaurantName: row.externalRestaurantName,
            externalFoodName: row.externalFoodName,
            lastUpdated: row.lastUpdated,
            sourceType: row.sourceType
        };
    };

    return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        ourApp: {
            price: ourAppPrice,
            totalPrice: ourAppPrice,
            availability: menuItem.isAvailable
        },
        swiggy: platformRow("SWIGGY"),
        zomato: platformRow("ZOMATO"),
        hasComparison: rowsForItem.length > 0
    };
}


/* =========================================================
   VOICE ORDER MATCHING
   POST /api/menu/voice-match
   body: { text: "2 chicken biryani and 1 coke" }
========================================================= */

router.post("/voice-match", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "No speech text provided."
            });
        }

        const menuItems = await Menu.find({ isAvailable: true });

        const { matches, unmatched } = matchVoiceOrder(text, menuItems);

        res.status(200).json({
            success: true,
            matches: matches.map((m) => ({
                menuItemId: m.menuItem._id,
                name: m.menuItem.name,
                image: m.menuItem.image,
                category: m.menuItem.category,
                price: m.menuItem.price,
                discountPrice: m.menuItem.discountPrice,
                isVeg: m.menuItem.isVeg,
                quantity: m.quantity,
                heardAs: m.phrase
            })),
            unmatched: unmatched
        });

    } catch (error) {
        console.error("Voice match error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while matching your voice order."
        });
    }
});


/* =========================================================
   GET ALL MENU ITEMS
   GET /api/menu
========================================================= */

router.get("/all", async (req, res) => {
    try {
        const menu = await Menu.find({
            isAvailable: true
        }).populate("restaurantId", "name address avatar").sort({
            category: 1,
            name: 1
        });

        res.status(200).json({
            success: true,
            count: menu.length,
            menu: menu
        });

    } catch (error) {
        console.error("Get menu error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching menu."
        });
    }
});


/* =========================================================
   GET MENU ITEMS BY CATEGORY
   GET /api/menu/category/Biryani
========================================================= */

router.get("/category/:category", async (req, res) => {
    try {
        const category = req.params.category;

        // Loose match so "biryani" / "burger" / "Pasta & Noodles"
        // show under the "Biryani" / "Burgers" / "Pasta" tiles
        const allCategories = await Menu.distinct("category", { isAvailable: true });
        const matchingCategories = allCategories.filter((c) => categoriesMatch(c, category));

        const menu = await Menu.find({
            category: { $in: matchingCategories },
            isAvailable: true
        }).populate("restaurantId", "name address avatar").sort({
            name: 1
        });

        res.status(200).json({
            success: true,
            count: menu.length,
            menu: menu
        });

    } catch (error) {
        console.error("Get category menu error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching category."
        });
    }
});


/* =========================================================
   GET MENU ITEMS BY RESTAURANT
   GET /api/menu/restaurant/:restaurantId
========================================================= */

router.get("/restaurant/:restaurantId", async (req, res) => {
    try {
        const menu = await Menu.find({
            restaurantId: req.params.restaurantId,
            isAvailable: true
        }).sort({
            category: 1,
            name: 1
        });

        res.status(200).json({
            success: true,
            count: menu.length,
            menu: menu
        });

    } catch (error) {
        console.error("Get restaurant menu error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching restaurant menu."
        });
    }
});


/* =========================================================
   GET SINGLE MENU ITEM
   GET /api/menu/:id
========================================================= */

router.get("/:id", async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        res.status(200).json({
            success: true,
            menu: menuItem
        });

    } catch (error) {
        console.error("Get menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching menu item."
        });
    }
});


/* =========================================================
   NOTE
   Menu item mutation (add/edit/delete) now lives under
   /api/restaurant/menu and requires an authenticated
   RESTAURANT-role user. See routes/restaurantRoutes.js.
========================================================= */


/* =========================================================
   ROUTE LOADED
========================================================= */

console.log("MENU ROUTES LOADED");

module.exports = router;