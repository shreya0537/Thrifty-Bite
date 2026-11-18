const express = require("express");

const GroupOrder = require("../models/groupOrder");
const BillSplit = require("../models/billSplit");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);


const getAuthorizedGroupOrder = async (groupOrderId, userId) => {
    return GroupOrder.findOne({
        _id: groupOrderId,
        members: userId
    });
};


/* =========================================================
   RECORD PAYER + CREATE/UPDATE BILL SPLIT
   POST /api/bill-split/:groupOrderId

   body: { totalBill, paidBy, splitType, shares?: [{ userId, share }] }

   splitType "EQUAL"     -> even split across all members (no shares needed)
   splitType "ITEM_WISE" -> computed from the group order's per-item
                            memberId assignment (no shares needed); items
                            with no memberId are split equally as a fallback
   splitType "CUSTOM"    -> shares[] required, caller supplies each amount
========================================================= */

router.post("/:groupOrderId", async (req, res) => {
    try {
        const groupOrder = await getAuthorizedGroupOrder(
            req.params.groupOrderId,
            req.user.userId
        );

        if (!groupOrder) {
            return res.status(404).json({
                success: false,
                message: "Group order not found."
            });
        }

        const { totalBill, paidBy, splitType, shares } = req.body;

        if (totalBill === undefined || !paidBy) {
            return res.status(400).json({
                success: false,
                message: "Total bill and payer are required."
            });
        }

        if (!groupOrder.members.map(String).includes(String(paidBy))) {
            return res.status(400).json({
                success: false,
                message: "Payer must be a member of the group order."
            });
        }

        let computedShares;

        if (splitType === "EQUAL" || !splitType) {
            const perHead = totalBill / groupOrder.members.length;

            computedShares = groupOrder.members.map((memberId) => ({
                userId: memberId,
                share: Math.round(perHead * 100) / 100,
                paid: String(memberId) === String(paidBy) ? totalBill : 0
            }));

        } else if (splitType === "ITEM_WISE") {
            if (!Array.isArray(groupOrder.items) || groupOrder.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "This group order has no itemized items to split by."
                });
            }

            const memberTotals = new Map(
                groupOrder.members.map((memberId) => [String(memberId), 0])
            );

            const unassignedItems = [];

            groupOrder.items.forEach((item) => {
                const lineTotal = item.price * item.quantity;

                if (item.memberId) {
                    const key = String(item.memberId);
                    memberTotals.set(key, (memberTotals.get(key) || 0) + lineTotal);
                } else {
                    unassignedItems.push(lineTotal);
                }
            });

            const unassignedTotal = unassignedItems.reduce((sum, n) => sum + n, 0);
            const unassignedPerHead = unassignedTotal / groupOrder.members.length;

            computedShares = groupOrder.members.map((memberId) => {
                const key = String(memberId);
                const share = (memberTotals.get(key) || 0) + unassignedPerHead;

                return {
                    userId: memberId,
                    share: Math.round(share * 100) / 100,
                    paid: key === String(paidBy) ? totalBill : 0
                };
            });

        } else {
            if (!Array.isArray(shares) || shares.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Shares are required for a custom split."
                });
            }

            computedShares = shares.map((s) => ({
                userId: s.userId,
                share: s.share,
                paid: String(s.userId) === String(paidBy) ? totalBill : 0
            }));
        }

        const billSplit = await BillSplit.findOneAndUpdate(
            { groupOrderId: groupOrder._id },
            {
                groupOrderId: groupOrder._id,
                totalBill,
                paidBy,
                splitType: splitType || "EQUAL",
                shares: computedShares
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Bill split recorded!",
            billSplit: billSplit
        });

    } catch (error) {
        console.error("Record bill split error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while recording bill split."
        });
    }
});


/* =========================================================
   GET BILL SPLIT + SETTLEMENT
   GET /api/bill-split/:groupOrderId
========================================================= */

router.get("/:groupOrderId", async (req, res) => {
    try {
        const groupOrder = await getAuthorizedGroupOrder(
            req.params.groupOrderId,
            req.user.userId
        );

        if (!groupOrder) {
            return res.status(404).json({
                success: false,
                message: "Group order not found."
            });
        }

        const billSplit = await BillSplit.findOne({
            groupOrderId: groupOrder._id
        }).populate("shares.userId", "name username email")
          .populate("paidBy", "name username email");

        if (!billSplit) {
            return res.status(404).json({
                success: false,
                message: "Bill split has not been recorded for this order yet."
            });
        }

        const settlement = billSplit.shares
            .filter((s) => String(s.userId._id || s.userId) !== String(billSplit.paidBy._id || billSplit.paidBy))
            .map((s) => {
                const owed = Math.round((s.share - s.paid) * 100) / 100;

                return {
                    from: s.userId,
                    to: billSplit.paidBy,
                    amount: owed > 0 ? owed : 0
                };
            })
            .filter((entry) => entry.amount > 0);

        res.status(200).json({
            success: true,
            billSplit: billSplit,
            settlement: settlement
        });

    } catch (error) {
        console.error("Get bill split error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching bill split."
        });
    }
});


/* =========================================================
   RECORD A SETTLEMENT PAYMENT
   PUT /api/bill-split/:groupOrderId/pay

   body: { userId, amount }
========================================================= */

router.put("/:groupOrderId/pay", async (req, res) => {
    try {
        const groupOrder = await getAuthorizedGroupOrder(
            req.params.groupOrderId,
            req.user.userId
        );

        if (!groupOrder) {
            return res.status(404).json({
                success: false,
                message: "Group order not found."
            });
        }

        const { userId, amount } = req.body;

        if (!userId || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "User and amount are required."
            });
        }

        const billSplit = await BillSplit.findOne({
            groupOrderId: groupOrder._id
        });

        if (!billSplit) {
            return res.status(404).json({
                success: false,
                message: "Bill split has not been recorded for this order yet."
            });
        }

        const share = billSplit.shares.find(
            (s) => String(s.userId) === String(userId)
        );

        if (!share) {
            return res.status(404).json({
                success: false,
                message: "This user is not part of the bill split."
            });
        }

        share.paid += Number(amount);

        await billSplit.save();

        res.status(200).json({
            success: true,
            message: "Settlement payment recorded!",
            billSplit: billSplit
        });

    } catch (error) {
        console.error("Record settlement payment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while recording settlement payment."
        });
    }
});


console.log("BILL SPLIT ROUTES LOADED");

module.exports = router;
