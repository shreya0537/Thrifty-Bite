const mongoose = require("mongoose");
const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emoji: { type: String, enum: ["❤️", "👍", "😂", "😮", "😢", "🔥"], required: true }
}, { _id: false, timestamps: true });
const groupOrderMessageSchema = new mongoose.Schema({
  groupOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupOrder", required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true, maxlength: 1500 },
  reactions: { type: [reactionSchema], default: [] }
}, { timestamps: true });
module.exports = mongoose.model("GroupOrderMessage", groupOrderMessageSchema);
