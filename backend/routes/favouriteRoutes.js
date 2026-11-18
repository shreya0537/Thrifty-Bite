const express = require("express");

const Favourite = require("../models/favourite");
const Menu = require("../models/menu");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);


/* =========================================================
   LIST MY FAVOURITES
   GET /api/favourites
========================================================= */

router.get("/", async (req, res) => {
    try {
        const favourites = await Favourite.find({
            userId: req.user.userId
        })
            .populate("menuItemId")
            .sort({ createdAt: -1 });

        const items = favourites
            .filter((f) => f.menuItemId)
            .map((f) => ({
                favouriteId: f._id,
                ...f.menuItemId.toObject()
            }));

        res.status(200).json({
            success: true,
            count: items.length,
            favourites: items
        });

    } catch (error) {
        console.error("List favourites error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching favourites."
        });
    }
});


/* =========================================================
   ADD FAVOURITE
   POST /api/favourites   { menuItemId }
========================================================= */

router.post("/", async (req, res) => {
    try {
        const { menuItemId } = req.body;

        if (!menuItemId) {
            return res.status(400).json({
                success: false,
                message: "Menu item is required."
            });
        }

        const menuItem = await Menu.findById(menuItemId);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        const favourite = await Favourite.findOneAndUpdate(
            { userId: req.user.userId, menuItemId },
            { userId: req.user.userId, menuItemId },
            { upsert: true, new: true }
        );

        res.status(201).json({
            success: true,
            message: "Added to favourites!",
            favourite: favourite
        });

    } catch (error) {
        console.error("Add favourite error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding favourite."
        });
    }
});


/* =========================================================
   REMOVE FAVOURITE
   DELETE /api/favourites/:menuItemId
========================================================= */

router.delete("/:menuItemId", async (req, res) => {
    try {
        const result = await Favourite.findOneAndDelete({
            userId: req.user.userId,
            menuItemId: req.params.menuItemId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Favourite not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Removed from favourites."
        });

    } catch (error) {
        console.error("Remove favourite error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while removing favourite."
        });
    }
});


console.log("FAVOURITE ROUTES LOADED");

module.exports = router;
