const express = require("express");

const User = require("../models/user");
const Order = require("../models/order");
const CustomOrder = require("../models/customOrder");
const Menu = require("../models/menu");
const ExternalFoodPrice = require("../models/externalFoodPrice");
const Coupon = require("../models/coupon");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, requireRole("ADMIN"));


/* =========================================================
   MANAGE CUSTOMERS / RESTAURANTS / CHEFS
   GET /api/admin/customers
   GET /api/admin/restaurants
   GET /api/admin/chefs
========================================================= */

const listUsersByRole = (role) => async (req, res) => {
    try {
        const users = await User.find({ role }).select("-password").sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users: users
        });

    } catch (error) {
        console.error("Admin list users error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching users."
        });
    }
};

router.get("/customers", listUsersByRole("CUSTOMER"));
router.get("/restaurants", listUsersByRole("RESTAURANT"));
router.get("/chefs", listUsersByRole("MASTER_CHEF"));


/* =========================================================
   ACTIVATE / DEACTIVATE USER
   PUT /api/admin/users/:id/status
========================================================= */

router.put("/users/:id/status", async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive (boolean) is required."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive } },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isActive ? "activated" : "deactivated"} successfully!`,
            user: user
        });

    } catch (error) {
        console.error("Admin update user status error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating user status."
        });
    }
});


/* =========================================================
   VIEW ALL NORMAL ORDERS
   GET /api/admin/orders
========================================================= */

router.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("customerId", "name username email")
            .populate("restaurantId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("Admin get orders error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching orders."
        });
    }
});


/* =========================================================
   VIEW ALL CUSTOM ORDERS
   GET /api/admin/custom-orders
========================================================= */

router.get("/custom-orders", async (req, res) => {
    try {
        const orders = await CustomOrder.find()
            .populate("customerId", "name username email")
            .populate("chefId", "name username email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("Admin get custom orders error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching custom orders."
        });
    }
});




/* =========================================================
   ADMIN WORKFLOW CONTROLS
   Status changes are saved to the same MongoDB records read by
   customer tracking pages. Menu availability is also controlled here.
========================================================= */

const ORDER_STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "PACKED", "READY", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "REJECTED"];
const CUSTOM_ORDER_STATUSES = ["REQUESTED", "CHEF_ACCEPTED", "CHEF_PROPOSED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "REJECTED", "CANCELLED"];

router.put("/orders/:id/status", async (req, res) => {
    try {
        const status = String(req.body.status || "").toUpperCase();
        if (!ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: "Choose a valid order status." });
        }
        const order = await Order.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true, runValidators: true })
            .populate("customerId", "name username email")
            .populate("restaurantId", "name");
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });
        return res.json({ success: true, message: `Order updated to ${status.replace(/_/g, " ")}.`, order });
    } catch (error) {
        console.error("Admin update order status error:", error);
        return res.status(500).json({ success: false, message: "Unable to update order status." });
    }
});

router.put("/custom-orders/:id/status", async (req, res) => {
    try {
        const status = String(req.body.status || "").toUpperCase();
        if (!CUSTOM_ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: "Choose a valid custom-order status." });
        }
        const order = await CustomOrder.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true, runValidators: true })
            .populate("customerId", "name username email")
            .populate("chefId", "name username email");
        if (!order) return res.status(404).json({ success: false, message: "Custom order not found." });
        return res.json({ success: true, message: `Custom order updated to ${status.replace(/_/g, " ")}.`, order });
    } catch (error) {
        console.error("Admin update custom order status error:", error);
        return res.status(500).json({ success: false, message: "Unable to update custom-order status." });
    }
});

router.get("/menu", async (req, res) => {
    try {
        const menu = await Menu.find().populate("restaurantId", "name").sort({ category: 1, name: 1 });
        return res.json({ success: true, count: menu.length, menu });
    } catch (error) {
        console.error("Admin list menu error:", error);
        return res.status(500).json({ success: false, message: "Unable to fetch menu items." });
    }
});

router.put("/menu/:id/availability", async (req, res) => {
    try {
        if (typeof req.body.isAvailable !== "boolean") {
            return res.status(400).json({ success: false, message: "isAvailable must be true or false." });
        }
        const item = await Menu.findByIdAndUpdate(req.params.id, { $set: { isAvailable: req.body.isAvailable } }, { new: true, runValidators: true })
            .populate("restaurantId", "name");
        if (!item) return res.status(404).json({ success: false, message: "Menu item not found." });
        return res.json({ success: true, message: `${item.name} is now ${item.isAvailable ? "available" : "unavailable"}.`, menuItem: item });
    } catch (error) {
        console.error("Admin menu availability error:", error);
        return res.status(500).json({ success: false, message: "Unable to update menu availability." });
    }
});


/* =========================================================
   PLATFORM PRICE COMPARISON (PDF §19.6)
   Admin CRUD for Swiggy/Zomato reference price rows against
   the app's own Menu items. "Our App" price is never stored
   here — it's read live from the Menu item at comparison time.
========================================================= */

router.get("/platform-prices", async (req, res) => {
    try {
        const rows = await ExternalFoodPrice.find()
            .populate("menuItemId", "name category")
            .populate("restaurantId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: rows.length,
            platformPrices: rows
        });

    } catch (error) {
        console.error("Admin list platform prices error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching platform prices."
        });
    }
});

router.post("/platform-prices", async (req, res) => {
    try {
        const {
            menuItemId, platform, externalRestaurantName, externalFoodName,
            price, discountPrice, deliveryFee, packagingFee, tax, availability, sourceType
        } = req.body;

        if (!menuItemId || !platform || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "menuItemId, platform and price are required."
            });
        }

        const menuItem = await Menu.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });
        }

        const row = await ExternalFoodPrice.findOneAndUpdate(
            { menuItemId, platform },
            {
                menuItemId,
                restaurantId: menuItem.restaurantId,
                platform,
                externalRestaurantName: externalRestaurantName || "",
                externalFoodName: externalFoodName || menuItem.name,
                price,
                discountPrice: discountPrice ?? null,
                deliveryFee: deliveryFee || 0,
                packagingFee: packagingFee || 0,
                tax: tax || 0,
                availability: availability !== undefined ? availability : true,
                sourceType: sourceType || "SAMPLE",
                lastUpdated: new Date()
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        /* findOneAndUpdate bypasses the pre('save') total-price hook */
        const effectivePrice = row.discountPrice != null ? row.discountPrice : row.price;
        row.totalPrice = Math.round((effectivePrice + row.deliveryFee + row.packagingFee + row.tax) * 100) / 100;
        await row.save();

        res.status(201).json({
            success: true,
            message: "Platform price saved!",
            platformPrice: row
        });

    } catch (error) {
        console.error("Admin create platform price error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while saving platform price."
        });
    }
});

router.put("/platform-prices/:id", async (req, res) => {
    try {
        const row = await ExternalFoodPrice.findById(req.params.id);

        if (!row) {
            return res.status(404).json({
                success: false,
                message: "Platform price record not found."
            });
        }

        const {
            externalRestaurantName, externalFoodName, price, discountPrice,
            deliveryFee, packagingFee, tax, availability, sourceType
        } = req.body;

        if (externalRestaurantName !== undefined) row.externalRestaurantName = externalRestaurantName;
        if (externalFoodName !== undefined) row.externalFoodName = externalFoodName;
        if (price !== undefined) row.price = price;
        if (discountPrice !== undefined) row.discountPrice = discountPrice;
        if (deliveryFee !== undefined) row.deliveryFee = deliveryFee;
        if (packagingFee !== undefined) row.packagingFee = packagingFee;
        if (tax !== undefined) row.tax = tax;
        if (availability !== undefined) row.availability = availability;
        if (sourceType !== undefined) row.sourceType = sourceType;
        row.lastUpdated = new Date();

        await row.save();

        res.status(200).json({
            success: true,
            message: "Platform price updated!",
            platformPrice: row
        });

    } catch (error) {
        console.error("Admin update platform price error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating platform price."
        });
    }
});

router.delete("/platform-prices/:id", async (req, res) => {
    try {
        const row = await ExternalFoodPrice.findByIdAndDelete(req.params.id);

        if (!row) {
            return res.status(404).json({
                success: false,
                message: "Platform price record not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Platform price deleted."
        });

    } catch (error) {
        console.error("Admin delete platform price error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting platform price."
        });
    }
});


/* =========================================================
   BASIC REPORTS
   GET /api/admin/reports
========================================================= */

router.get("/reports", async (req, res) => {
    try {
        const [
            totalCustomers,
            totalRestaurants,
            totalChefs,
            totalOrders,
            totalCustomOrders,
            revenueAgg
        ] = await Promise.all([
            User.countDocuments({ role: "CUSTOMER" }),
            User.countDocuments({ role: "RESTAURANT" }),
            User.countDocuments({ role: "MASTER_CHEF" }),
            Order.countDocuments(),
            CustomOrder.countDocuments(),
            Order.aggregate([
                { $match: { status: "COMPLETED" } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            report: {
                totalCustomers,
                totalRestaurants,
                totalChefs,
                totalOrders,
                totalCustomOrders,
                totalCompletedOrderRevenue: revenueAgg[0]?.total || 0
            }
        });

    } catch (error) {
        console.error("Admin reports error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while generating reports."
        });
    }
});


console.log("ADMIN ROUTES LOADED");

/* =========================================================
   COUPONS (first-order + special coupons)
   GET    /api/admin/coupons
   POST   /api/admin/coupons
   PUT    /api/admin/coupons/:id
   DELETE /api/admin/coupons/:id
========================================================= */

function couponFieldsFromBody(body) {
    const fields = {};

    if (body.code !== undefined) fields.code = String(body.code).trim().toUpperCase();
    if (body.title !== undefined) fields.title = body.title;
    if (body.description !== undefined) fields.description = body.description;
    if (body.discountType !== undefined) fields.discountType = body.discountType;
    if (body.discountValue !== undefined) fields.discountValue = Number(body.discountValue);
    if (body.maxDiscount !== undefined) {
        fields.maxDiscount = body.maxDiscount === "" || body.maxDiscount === null ? null : Number(body.maxDiscount);
    }
    if (body.minOrderAmount !== undefined) fields.minOrderAmount = Number(body.minOrderAmount) || 0;
    if (body.firstOrderOnly !== undefined) fields.firstOrderOnly = Boolean(body.firstOrderOnly);
    if (body.perUserLimit !== undefined) fields.perUserLimit = Math.max(1, Number(body.perUserLimit) || 1);
    if (body.validUntil !== undefined) fields.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.active !== undefined) fields.active = Boolean(body.active);

    return fields;
}

router.get("/coupons", async (req, res) => {
    try {
        const [coupons, usage] = await Promise.all([
            Coupon.find().sort({ createdAt: -1 }),
            Order.aggregate([
                { $match: { couponCode: { $ne: null }, status: { $ne: "REJECTED" } } },
                { $group: { _id: "$couponCode", count: { $sum: 1 }, discount: { $sum: "$discountAmount" } } }
            ])
        ]);

        const usageByCode = Object.fromEntries(usage.map((u) => [u._id, u]));

        res.status(200).json({
            success: true,
            coupons: coupons.map((c) => ({
                ...c.toObject(),
                timesUsed: usageByCode[c.code] ? usageByCode[c.code].count : 0,
                totalDiscountGiven: usageByCode[c.code] ? usageByCode[c.code].discount : 0
            }))
        });

    } catch (error) {
        console.error("Admin list coupons error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching coupons."
        });
    }
});

router.post("/coupons", async (req, res) => {
    try {
        const fields = couponFieldsFromBody(req.body);

        if (!fields.code || !fields.discountType || !(fields.discountValue > 0)) {
            return res.status(400).json({
                success: false,
                message: "Coupon code, discount type and a discount value above 0 are required."
            });
        }

        if (fields.discountType === "PERCENT" && fields.discountValue > 100) {
            return res.status(400).json({
                success: false,
                message: "A percentage discount can't be more than 100%."
            });
        }

        const coupon = await Coupon.create(fields);

        res.status(201).json({
            success: true,
            message: "Coupon " + coupon.code + " created!",
            coupon: coupon
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A coupon with this code already exists."
            });
        }

        console.error("Admin create coupon error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating coupon."
        });
    }
});

router.put("/coupons/:id", async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            couponFieldsFromBody(req.body),
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Coupon updated.",
            coupon: coupon
        });

    } catch (error) {
        console.error("Admin update coupon error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating coupon."
        });
    }
});

router.delete("/coupons/:id", async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Coupon deleted."
        });

    } catch (error) {
        console.error("Admin delete coupon error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting coupon."
        });
    }
});


module.exports = router;
