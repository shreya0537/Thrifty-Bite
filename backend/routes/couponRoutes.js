const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { validateCoupon, listCouponsForCustomer } = require("../utils/coupons");

const router = express.Router();

router.use(authMiddleware, requireRole("CUSTOMER"));


/* =========================================================
   AVAILABLE COUPONS FOR THE LOGGED-IN CUSTOMER
   GET /api/coupons
========================================================= */

router.get("/", async (req, res) => {
    try {
        const coupons = await listCouponsForCustomer(req.user.userId);

        res.status(200).json({
            success: true,
            coupons: coupons
        });

    } catch (error) {
        console.error("List coupons error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching coupons."
        });
    }
});


/* =========================================================
   CHECK A COUPON AGAINST A SUBTOTAL
   POST /api/coupons/validate
   body: { code, subtotal }
========================================================= */

router.post("/validate", async (req, res) => {
    try {
        const subtotal = Number(req.body.subtotal) || 0;
        const result = await validateCoupon(req.body.code, req.user.userId, subtotal);

        if (!result.ok) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.coupon.code + " applied! You save ₹" + result.discount + ".",
            code: result.coupon.code,
            discount: result.discount,
            total: Math.round((subtotal - result.discount) * 100) / 100
        });

    } catch (error) {
        console.error("Validate coupon error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while checking coupon."
        });
    }
});

module.exports = router;
