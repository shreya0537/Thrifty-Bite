const Coupon = require("../models/coupon");
const Order = require("../models/order");

/* =========================================================
   DEFAULT COUPONS
   Inserted on server start if missing (never overwritten, so
   admin edits stick). Admins can add more special coupons
   from the admin dashboard.
========================================================= */

const DEFAULT_COUPONS = [
    {
        code: "WELCOME50",
        title: "First order special",
        description: "50% off your first order, up to ₹100",
        discountType: "PERCENT",
        discountValue: 50,
        maxDiscount: 100,
        minOrderAmount: 99,
        firstOrderOnly: true,
        perUserLimit: 1
    },
    {
        code: "ROYAL20",
        title: "Royal treat",
        description: "20% off on orders above ₹299, up to ₹80",
        discountType: "PERCENT",
        discountValue: 20,
        maxDiscount: 80,
        minOrderAmount: 299,
        perUserLimit: 3
    },
    {
        code: "FEAST100",
        title: "Big feast",
        description: "Flat ₹100 off on orders above ₹599",
        discountType: "FLAT",
        discountValue: 100,
        minOrderAmount: 599,
        perUserLimit: 2
    },
    {
        code: "THRIFTY30",
        title: "Thrifty saver",
        description: "Flat ₹30 off on orders above ₹199",
        discountType: "FLAT",
        discountValue: 30,
        minOrderAmount: 199,
        perUserLimit: 5
    },
    {
        code: "FIRSTBITE",
        title: "New here? Welcome!",
        description: "Flat ₹75 off your first order above ₹149",
        discountType: "FLAT",
        discountValue: 75,
        minOrderAmount: 149,
        firstOrderOnly: true,
        perUserLimit: 1
    },
    {
        code: "SAVE10",
        title: "Everyday saver",
        description: "10% off on orders above ₹149, up to ₹50",
        discountType: "PERCENT",
        discountValue: 10,
        maxDiscount: 50,
        minOrderAmount: 149,
        perUserLimit: 10
    },
    {
        code: "WEEKEND60",
        title: "Weekend cravings",
        description: "Flat ₹60 off on orders above ₹349",
        discountType: "FLAT",
        discountValue: 60,
        minOrderAmount: 349,
        perUserLimit: 4
    },
    {
        code: "TREAT25",
        title: "Treat yourself",
        description: "25% off on orders above ₹399, up to ₹120",
        discountType: "PERCENT",
        discountValue: 25,
        maxDiscount: 120,
        minOrderAmount: 399,
        perUserLimit: 2
    },
    {
        code: "PARTY150",
        title: "Party order",
        description: "Flat ₹150 off on orders above ₹999",
        discountType: "FLAT",
        discountValue: 150,
        minOrderAmount: 999,
        perUserLimit: 2
    },
    {
        code: "MEGA200",
        title: "Mega feast",
        description: "Flat ₹200 off on orders above ₹1499",
        discountType: "FLAT",
        discountValue: 200,
        minOrderAmount: 1499,
        perUserLimit: 1
    },
    {
        code: "FESTIVE35",
        title: "Festive season special",
        description: "35% off on orders above ₹499, up to ₹150 — valid till 31 Dec 2026",
        discountType: "PERCENT",
        discountValue: 35,
        maxDiscount: 150,
        minOrderAmount: 499,
        perUserLimit: 1,
        validUntil: new Date("2026-12-31T23:59:59+05:30")
    }
];

async function seedDefaultCoupons() {
    for (const coupon of DEFAULT_COUPONS) {
        await Coupon.updateOne(
            { code: coupon.code },
            { $setOnInsert: coupon },
            { upsert: true }
        );
    }
}

/* Orders that count as "placed" — rejected orders don't use up
   a first-order or per-user coupon allowance. */
function countedOrdersFilter(customerId) {
    return { customerId, status: { $ne: "REJECTED" } };
}

function calculateDiscount(coupon, subtotal) {
    let discount = coupon.discountType === "PERCENT"
        ? subtotal * coupon.discountValue / 100
        : coupon.discountValue;

    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, subtotal);

    return Math.round(discount * 100) / 100;
}

/* Returns { ok, coupon, discount } or { ok:false, message }.
   Used both by the "Apply" button and when the order is placed,
   so the server always decides the real discount. */
async function validateCoupon(code, customerId, subtotal) {
    const normalized = String(code || "").trim().toUpperCase();

    if (!normalized) {
        return { ok: false, message: "Please enter a coupon code." };
    }

    const coupon = await Coupon.findOne({ code: normalized });

    if (!coupon || !coupon.active) {
        return { ok: false, message: "Invalid coupon code." };
    }

    if (coupon.validUntil && coupon.validUntil < new Date()) {
        return { ok: false, message: "This coupon has expired." };
    }

    if (subtotal < coupon.minOrderAmount) {
        return {
            ok: false,
            message: "Add items worth ₹" + Math.ceil(coupon.minOrderAmount - subtotal)
                + " more to use " + coupon.code + " (minimum order ₹" + coupon.minOrderAmount + ")."
        };
    }

    if (coupon.firstOrderOnly) {
        const previousOrders = await Order.countDocuments(countedOrdersFilter(customerId));
        if (previousOrders > 0) {
            return { ok: false, message: coupon.code + " is only valid on your first order." };
        }
    }

    const timesUsed = await Order.countDocuments({
        ...countedOrdersFilter(customerId),
        couponCode: coupon.code
    });

    if (timesUsed >= coupon.perUserLimit) {
        return {
            ok: false,
            message: "You have already used " + coupon.code
                + (coupon.perUserLimit > 1 ? " " + coupon.perUserLimit + " times." : ".")
        };
    }

    return { ok: true, coupon, discount: calculateDiscount(coupon, subtotal) };
}

/* Active, unexpired coupons with an "eligible" flag for this
   customer (first-order coupons are hidden after the first order). */
async function listCouponsForCustomer(customerId) {
    const now = new Date();

    const [coupons, orderCount] = await Promise.all([
        Coupon.find({
            active: true,
            $or: [{ validUntil: null }, { validUntil: { $gte: now } }]
        }).sort({ firstOrderOnly: -1, minOrderAmount: 1 }),
        Order.countDocuments(countedOrdersFilter(customerId))
    ]);

    const usage = await Order.aggregate([
        { $match: { ...countedOrdersFilter(customerId), couponCode: { $ne: null } } },
        { $group: { _id: "$couponCode", count: { $sum: 1 } } }
    ]);
    const usedCount = Object.fromEntries(usage.map((u) => [u._id, u.count]));

    return coupons
        .filter((c) => !(c.firstOrderOnly && orderCount > 0))
        .map((c) => ({
            code: c.code,
            title: c.title,
            description: c.description,
            discountType: c.discountType,
            discountValue: c.discountValue,
            maxDiscount: c.maxDiscount,
            minOrderAmount: c.minOrderAmount,
            firstOrderOnly: c.firstOrderOnly,
            validUntil: c.validUntil,
            usesLeft: Math.max(0, c.perUserLimit - (usedCount[c.code] || 0))
        }))
        .filter((c) => c.usesLeft > 0);
}

module.exports = {
    seedDefaultCoupons,
    validateCoupon,
    listCouponsForCustomer
};
