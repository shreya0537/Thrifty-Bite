const express = require("express");

const PaymentMethod = require("../models/paymentMethod");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);


/* =========================================================
   LIST MY SAVED PAYMENT METHODS
   GET /api/payment-methods
========================================================= */

router.get("/", async (req, res) => {
    try {
        const methods = await PaymentMethod.find({
            userId: req.user.userId
        }).sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            paymentMethods: methods
        });

    } catch (error) {
        console.error("List payment methods error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching payment methods."
        });
    }
});


/* =========================================================
   ADD PAYMENT METHOD
   POST /api/payment-methods   { type, label, detail, isDefault }
========================================================= */

router.post("/", async (req, res) => {
    try {
        const { type, label, detail, isDefault } = req.body;

        if (!["UPI", "Card"].includes(type) || !label || !detail) {
            return res.status(400).json({
                success: false,
                message: "Type, label and detail are required."
            });
        }

        if (type === "Card" && !/^\d{4}$/.test(detail.trim())) {
            return res.status(400).json({
                success: false,
                message: "For cards, only the last 4 digits are stored (never the full number)."
            });
        }

        if (isDefault) {
            await PaymentMethod.updateMany(
                { userId: req.user.userId },
                { $set: { isDefault: false } }
            );
        }

        const method = await PaymentMethod.create({
            userId: req.user.userId,
            type,
            label: label.trim(),
            detail: detail.trim(),
            isDefault: Boolean(isDefault)
        });

        res.status(201).json({
            success: true,
            message: "Payment method saved!",
            paymentMethod: method
        });

    } catch (error) {
        console.error("Add payment method error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while saving payment method."
        });
    }
});


/* =========================================================
   SET DEFAULT
   PUT /api/payment-methods/:id/default
========================================================= */

router.put("/:id/default", async (req, res) => {
    try {
        const method = await PaymentMethod.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!method) {
            return res.status(404).json({
                success: false,
                message: "Payment method not found."
            });
        }

        await PaymentMethod.updateMany(
            { userId: req.user.userId },
            { $set: { isDefault: false } }
        );

        method.isDefault = true;
        await method.save();

        res.status(200).json({
            success: true,
            message: "Default payment method updated!",
            paymentMethod: method
        });

    } catch (error) {
        console.error("Set default payment method error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating default payment method."
        });
    }
});


/* =========================================================
   DELETE PAYMENT METHOD
   DELETE /api/payment-methods/:id
========================================================= */

router.delete("/:id", async (req, res) => {
    try {
        const method = await PaymentMethod.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!method) {
            return res.status(404).json({
                success: false,
                message: "Payment method not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment method removed."
        });

    } catch (error) {
        console.error("Delete payment method error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while removing payment method."
        });
    }
});


console.log("PAYMENT METHOD ROUTES LOADED");

module.exports = router;
