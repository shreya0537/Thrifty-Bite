const CustomOrderStatusHistory = require("../models/customOrderStatusHistory");

const logCustomOrderStatus = async (customOrderId, status, updatedBy, remarks = "") => {
    await CustomOrderStatusHistory.create({
        customOrderId,
        status,
        updatedBy,
        remarks
    });
};

module.exports = logCustomOrderStatus;
