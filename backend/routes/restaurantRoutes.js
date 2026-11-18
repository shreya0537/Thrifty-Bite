const express = require("express");

const User = require("../models/user");
const Menu = require("../models/menu");
const FoodCategory = require("../models/foodCategory");
const Order = require("../models/order");
const ExternalFoodPrice = require("../models/externalFoodPrice");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const awardRewardPoints = require("../utils/awardRewardPoints");
const { generatePricesForItem } = require("../utils/externalPriceGenerator");

const router = express.Router();

router.use(authMiddleware, requireRole("RESTAURANT"));


/* =========================================================
   RESTAURANT PROFILE
   GET /api/restaurant/profile
========================================================= */

router.get("/profile", async (req, res) => {
    try {
        const restaurant = await User.findById(req.user.userId).select("-password");

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found."
            });
        }

        res.status(200).json({
            success: true,
            restaurant: restaurant
        });

    } catch (error) {
        console.error("Get restaurant profile error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching restaurant profile."
        });
    }
});


/* =========================================================
   UPDATE RESTAURANT PROFILE
   PUT /api/restaurant/profile
========================================================= */

router.put("/profile", async (req, res) => {
    try {
        const {
            name,
            ownerName,
            mobile,
            address
        } = req.body;

        const restaurant = await User.findById(req.user.userId);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found."
            });
        }

        if (name !== undefined) restaurant.name = name;
        if (ownerName !== undefined) restaurant.ownerName = ownerName;
        if (mobile !== undefined) restaurant.mobile = mobile;
        if (address !== undefined) restaurant.address = address;

        await restaurant.save();

        res.status(200).json({
            success: true,
            message: "Restaurant profile updated successfully!",
            restaurant: {
                id: restaurant._id,
                name: restaurant.name,
                ownerName: restaurant.ownerName,
                mobile: restaurant.mobile,
                address: restaurant.address
            }
        });

    } catch (error) {
        console.error("Update restaurant profile error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating restaurant profile."
        });
    }
});


/* =========================================================
   FOOD CATEGORIES
   GET /api/restaurant/categories
========================================================= */

router.get("/categories", async (req, res) => {
    try {
        // Categories already used by this restaurant's menu items
        // (e.g. seeded dishes) are added to the list if missing
        const [saved, menuCategories] = await Promise.all([
            FoodCategory.find({ restaurantId: req.user.userId }),
            Menu.distinct("category", { restaurantId: req.user.userId })
        ]);

        const savedNames = saved.map((c) => c.name.toLowerCase());
        const missing = menuCategories.filter((name) => name && !savedNames.includes(name.toLowerCase()));

        if (missing.length > 0) {
            await FoodCategory.insertMany(
                missing.map((name) => ({ restaurantId: req.user.userId, name })),
                { ordered: false }
            ).catch(() => { /* duplicates from a concurrent request are fine */ });
        }

        const categories = await FoodCategory.find({
            restaurantId: req.user.userId
        }).collation({ locale: "en", strength: 2 }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            categories: categories
        });

    } catch (error) {
        console.error("Get categories error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching categories."
        });
    }
});


/* =========================================================
   ADD FOOD CATEGORY
   POST /api/restaurant/categories
========================================================= */

router.post("/categories", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required."
            });
        }

        const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const duplicate = await FoodCategory.findOne({
            restaurantId: req.user.userId,
            name: new RegExp("^" + escaped + "$", "i")
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "This category already exists."
            });
        }

        const category = await FoodCategory.create({
            restaurantId: req.user.userId,
            name: name.trim()
        });

        res.status(201).json({
            success: true,
            message: "Category added successfully!",
            category: category
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This category already exists."
            });
        }

        console.error("Add category error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding category."
        });
    }
});


/* =========================================================
   DELETE FOOD CATEGORY
   DELETE /api/restaurant/categories/:id
========================================================= */

router.delete("/categories/:id", async (req, res) => {
    try {
        const category = await FoodCategory.findOneAndDelete({
            _id: req.params.id,
            restaurantId: req.user.userId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully!"
        });

    } catch (error) {
        console.error("Delete category error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting category."
        });
    }
});


/* =========================================================
   ADD MENU ITEM
   POST /api/restaurant/menu
========================================================= */

router.post("/menu", async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            image,
            price,
            discountPrice,
            isVeg,
            isAvailable,
            tags
        } = req.body;

        if (
            !name ||
            !description ||
            !category ||
            price === undefined ||
            discountPrice === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required menu fields."
            });
        }

        const defaultImage =
            "/api/menu/icon?name=" + encodeURIComponent(name) +
            "&category=" + encodeURIComponent(category);

        const newMenuItem = new Menu({
            restaurantId: req.user.userId,
            name,
            description,
            category,
            image: image || defaultImage,
            price,
            discountPrice,
            isVeg: isVeg ?? true,
            isAvailable: isAvailable ?? true,
            tags: tags || []
        });

        await newMenuItem.save();

        // Give the new dish Swiggy/Zomato comparison prices right away
        await generatePricesForItem(newMenuItem).catch((err) =>
            console.error("Generate comparison prices error:", err)
        );

        res.status(201).json({
            success: true,
            message: "Menu item added successfully!",
            menu: newMenuItem
        });

    } catch (error) {
        console.error("Add menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding menu item."
        });
    }
});


/* =========================================================
   GET OWN MENU (INCLUDING UNAVAILABLE ITEMS)
   GET /api/restaurant/menu
========================================================= */

router.get("/menu", async (req, res) => {
    try {
        const menu = await Menu.find({
            restaurantId: req.user.userId
        }).sort({ category: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: menu.length,
            menu: menu
        });

    } catch (error) {
        console.error("Get own menu error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching menu."
        });
    }
});


/* =========================================================
   UPDATE MENU ITEM
   PUT /api/restaurant/menu/:id
========================================================= */

router.put("/menu/:id", async (req, res) => {
    try {
        const menuItem = await Menu.findOne({
            _id: req.params.id,
            restaurantId: req.user.userId
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        const {
            name,
            description,
            category,
            image,
            price,
            discountPrice,
            isVeg,
            isAvailable,
            tags
        } = req.body;

        if (name !== undefined) menuItem.name = name;
        if (description !== undefined) menuItem.description = description;
        if (category !== undefined) menuItem.category = category;

        if (image !== undefined) {
            menuItem.image = image || (
                "/api/menu/icon?name=" + encodeURIComponent(menuItem.name) +
                "&category=" + encodeURIComponent(menuItem.category)
            );
        }

        if (price !== undefined) menuItem.price = price;
        if (discountPrice !== undefined) menuItem.discountPrice = discountPrice;
        if (isVeg !== undefined) menuItem.isVeg = isVeg;
        if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;
        if (tags !== undefined) menuItem.tags = tags;

        const priceChanged = menuItem.isModified("price") || menuItem.isModified("discountPrice");

        await menuItem.save();

        // Re-generate SAMPLE comparison rows so they track the new price
        // (admin-entered MANUAL rows are left untouched)
        await generatePricesForItem(menuItem, { onlyMissing: !priceChanged }).catch((err) =>
            console.error("Generate comparison prices error:", err)
        );

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully!",
            menu: menuItem
        });

    } catch (error) {
        console.error("Update menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating menu item."
        });
    }
});


/* =========================================================
   DELETE MENU ITEM
   DELETE /api/restaurant/menu/:id
========================================================= */

router.delete("/menu/:id", async (req, res) => {
    try {
        const menuItem = await Menu.findOneAndDelete({
            _id: req.params.id,
            restaurantId: req.user.userId
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        await ExternalFoodPrice.deleteMany({ menuItemId: menuItem._id });

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully!"
        });

    } catch (error) {
        console.error("Delete menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting menu item."
        });
    }
});


/* =========================================================
   VIEW NORMAL ORDERS
   GET /api/restaurant/orders
========================================================= */

router.get("/orders", async (req, res) => {
    try {
        const filter = { restaurantId: req.user.userId };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const orders = await Order.find(filter)
            .populate("customerId", "name username email mobile")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("Get restaurant orders error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching orders."
        });
    }
});


/* =========================================================
   ACCEPT / REJECT / UPDATE ORDER STATUS
   PUT /api/restaurant/orders/:id/status
========================================================= */

const ALLOWED_STATUSES = [
    "ACCEPTED",
    "REJECTED",
    "PREPARING",
    "PACKED",
    "READY",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED"
];

router.put("/orders/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status."
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            restaurantId: req.user.userId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        order.status = status;
        await order.save();

        if (status === "COMPLETED") {
            await awardRewardPoints(
                order.customerId,
                order.totalAmount,
                "Order #" + order._id.toString().slice(-6) + " completed",
                order._id,
                "Order"
            );
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully!",
            order: order
        });

    } catch (error) {
        console.error("Update order status error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating order status."
        });
    }
});


console.log("RESTAURANT ROUTES LOADED");

module.exports = router;
