const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/authMiddleware");
const OccasionPlan = require("../models/occasionPlan");
const router = express.Router();

const getUserId = (req) => req.user?.userId || req.user?.id || req.user?._id;
const ownsPlan = (plan, req) => plan && String(plan.userId) === String(getUserId(req));

// List only the signed-in user's saved plans.
router.get("/", auth, async (req, res) => {
    try {
        const plans = await OccasionPlan.find({ userId: getUserId(req) })
            .sort({ updatedAt: -1 }).lean();
        res.json({ success: true, plans });
    } catch (error) {
        console.error("Load occasion plans:", error);
        res.status(500).json({ success: false, message: "Could not load saved plans." });
    }
});

function validatePayload(body) {
    const members = Number(body.members);
    const budget = Number(body.budget);
    if (!String(body.occasion || "").trim() || !Number.isFinite(members) || members < 1 || members > 500 ||
        !Number.isFinite(budget) || budget < 100 || !String(body.cuisine || "").trim() || !String(body.meal || "").trim()) {
        return { error: "Please provide a valid occasion, guest count, budget, cuisine and meal type." };
    }
    if (body.items !== undefined && !Array.isArray(body.items)) return { error: "Plan items must be a list." };
    return { value: {
        occasion: String(body.occasion).trim(), members, budget,
        cuisine: String(body.cuisine).trim(), meal: String(body.meal).trim(),
        diet: String(body.diet || "").slice(0, 1000),
        convenience: ["balanced", "budget", "quick", "variety"].includes(body.convenience) ? body.convenience : "balanced",
        items: (Array.isArray(body.items) ? body.items : []).slice(0, 40).map(item => ({
            name: String(item.name || "Food suggestion").slice(0, 120),
            quantity: Math.max(1, Math.min(500, Number(item.quantity) || 1)),
            price: Math.max(0, Number(item.price) || 0),
            category: String(item.category || body.cuisine).slice(0, 80),
            menuId: item.menuId && mongoose.isValidObjectId(item.menuId) ? item.menuId : undefined
        })),
        estimatedTotal: Math.max(0, Number(body.estimatedTotal) || 0),
        perPerson: Math.max(0, Number(body.perPerson) || budget / members)
    }};
}

// Save a newly generated plan.
router.post("/", auth, async (req, res) => {
    try {
        const parsed = validatePayload(req.body);
        if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
        const plan = await OccasionPlan.create({ ...parsed.value, userId: getUserId(req) });
        res.status(201).json({ success: true, plan });
    } catch (error) {
        console.error("Save occasion plan:", error);
        res.status(500).json({ success: false, message: "Could not save plan." });
    }
});

// Update an owned saved plan so Save works after Resume/editing too.
router.put("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid saved plan ID." });
        const parsed = validatePayload(req.body);
        if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
        const plan = await OccasionPlan.findOneAndUpdate(
            { _id: req.params.id, userId: getUserId(req) },
            { $set: parsed.value }, { new: true, runValidators: true }
        );
        if (!plan) return res.status(404).json({ success: false, message: "Saved plan not found." });
        res.json({ success: true, plan, message: "Saved plan updated." });
    } catch (error) {
        console.error("Update occasion plan:", error);
        res.status(500).json({ success: false, message: "Could not update plan." });
    }
});

router.get("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid saved plan ID." });
        const plan = await OccasionPlan.findOne({ _id: req.params.id, userId: getUserId(req) }).lean();
        if (!plan) return res.status(404).json({ success: false, message: "Saved plan not found." });
        res.json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not resume saved plan." });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid saved plan ID." });
        const deleted = await OccasionPlan.findOneAndDelete({ _id: req.params.id, userId: getUserId(req) });
        if (!deleted) return res.status(404).json({ success: false, message: "Saved plan not found." });
        res.json({ success: true, message: "Saved plan deleted." });
    } catch (error) {
        console.error("Delete occasion plan:", error);
        res.status(500).json({ success: false, message: "Could not delete plan." });
    }
});

module.exports = router;
