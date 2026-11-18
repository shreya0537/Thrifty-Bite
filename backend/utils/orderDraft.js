const Address = require("../models/address");
const Menu = require("../models/menu");
const { validateCoupon } = require("./coupons");

/* =========================================================
   ORDER DRAFT
   Validates a checkout request and works out the real prices
   (from the Menu, never from the client) plus any coupon.
   Shared by Cash orders and Razorpay online payments so both
   charge exactly the same amount.

   Returns { ok: true, data } where data is ready for
   Order.create(), or { ok: false, status, message }.
========================================================= */

async function buildOrderDraft(customerId, body) {
    const { restaurantId, addressId, paymentMethod, items, couponCode, groupOrder } = body;

    if (!restaurantId || !addressId || !Array.isArray(items) || items.length === 0) {
        return { ok: false, status: 400, message: "Restaurant, delivery address and at least one item are required." };
    }

    const address = await Address.findOne({ _id: addressId, userId: customerId });

    if (!address) {
        return { ok: false, status: 404, message: "Delivery address not found." };
    }

    const orderItems = [];

    for (const requested of items) {
        const menuItem = await Menu.findOne({
            _id: requested.menuItemId,
            restaurantId,
            isAvailable: true
        });

        if (!menuItem) {
            return { ok: false, status: 404, message: "One of the items in your cart is no longer available from this restaurant." };
        }

        orderItems.push({
            menuItemId: menuItem._id,
            name: menuItem.name,
            price: menuItem.discountPrice,
            quantity: Math.max(1, Number(requested.quantity) || 1)
        });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Coupon is re-checked here so the discount can't be faked by the client
    let appliedCoupon = null;
    let discountAmount = 0;

    if (couponCode) {
        const result = await validateCoupon(couponCode, customerId, subtotal);

        if (!result.ok) {
            return { ok: false, status: 400, message: result.message };
        }

        appliedCoupon = result.coupon.code;
        discountAmount = result.discount;
    }

    return {
        ok: true,
        data: {
            customerId,
            restaurantId,
            items: orderItems,
            subtotal,
            couponCode: appliedCoupon,
            discountAmount,
            totalAmount: Math.round((subtotal - discountAmount) * 100) / 100,
            deliveryAddress: {
                fullName: address.fullName,
                phone: address.phone,
                houseAddress: address.houseAddress,
                area: address.area,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
            paymentMethod: paymentMethod || "Cash",
            groupOrder: groupOrder && groupOrder.isGroupOrder ? {
                isGroupOrder: true,
                splitMethod: groupOrder.splitMethod === "item" ? "item" : "equal",
                totalAmount: Math.round((subtotal - discountAmount) * 100) / 100
            } : { isGroupOrder: false, splitMethod: null, totalAmount: null }
        }
    };
}

module.exports = { buildOrderDraft };
