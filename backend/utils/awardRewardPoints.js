const RewardTransaction = require("../models/rewardTransaction");

/* 1 reward point for every ₹10 spent */
const POINTS_PER_RUPEE = 1 / 10;

const awardRewardPoints = async (userId, amount, reason, orderId, orderModel) => {
    const points = Math.floor(amount * POINTS_PER_RUPEE);

    if (points <= 0) {
        return null;
    }

    return RewardTransaction.create({
        userId,
        points,
        reason,
        orderId: orderId || null,
        orderModel: orderModel || null
    });
};

module.exports = awardRewardPoints;
