const express = require("express");

const GroupOrder = require("../models/groupOrder");
const CustomOrder = require("../models/customOrder");
const Menu = require("../models/menu");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const logCustomOrderStatus = require("../utils/customOrderHistory");

const router = express.Router();

router.use(authMiddleware, requireRole("CUSTOMER"));


/* =========================================================
   CREATE GROUP ORDER
   POST /api/group-orders

   Normal group order body:
   { memberIds: [...], restaurantId, items: [{ menuItemId, quantity, memberId? }] }
   (memberId is who the item is for; omit/null for a shared item split
   equally among all members during an item-wise bill split)

   Custom chef group order body:
   { memberIds: [...], customRequest: { chefId, foodRequired, description,
     quantity, preferredDate, preferredTime, specialInstructions, referenceImage } }
========================================================= */

router.post("/", async (req, res) => {
    try {
        const { memberIds, restaurantId, items, customRequest } = req.body;

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Select at least one friend for the group order."
            });
        }

        const members = Array.from(new Set([req.user.userId, ...memberIds]));

        /* ============ CUSTOM CHEF GROUP ORDER ============ */

        if (customRequest) {
            const {
                chefId,
                foodRequired,
                description,
                quantity,
                preferredDate,
                preferredTime,
                specialInstructions,
                referenceImage
            } = customRequest;

            if (!foodRequired || !description || !preferredDate || !preferredTime) {
                return res.status(400).json({
                    success: false,
                    message: "Food required, description, preferred date and time are required."
                });
            }

            const groupOrder = await GroupOrder.create({
                creatorId: req.user.userId,
                members
            });

            const customOrder = await CustomOrder.create({
                customerId: req.user.userId,
                chefId: chefId || null,
                foodRequired,
                description,
                quantity: quantity || members.length,
                preferredDate,
                preferredTime,
                specialInstructions: specialInstructions || "",
                referenceImage: referenceImage || "",
                groupOrderId: groupOrder._id
            });

            groupOrder.customOrderId = customOrder._id;
            await groupOrder.save();

            await logCustomOrderStatus(customOrder._id, "REQUESTED", req.user.userId);

            return res.status(201).json({
                success: true,
                message: "Group custom order submitted!",
                groupOrder: groupOrder,
                customOrder: customOrder
            });
        }

        /* ============ NORMAL GROUP FOOD ORDER ============ */

        if (!restaurantId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Restaurant and at least one food item are required."
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const requested of items) {
            const menuItem = await Menu.findOne({
                _id: requested.menuItemId,
                restaurantId
            });

            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item ${requested.menuItemId} not found for this restaurant.`
                });
            }

            const quantity = Number(requested.quantity) || 1;

            let memberId = requested.memberId || null;
            if (memberId && !members.map(String).includes(String(memberId))) {
                return res.status(400).json({
                    success: false,
                    message: "Item assignee must be a member of the group order."
                });
            }

            orderItems.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                price: menuItem.discountPrice,
                quantity,
                memberId
            });

            totalAmount += menuItem.discountPrice * quantity;
        }

        const groupOrder = await GroupOrder.create({
            creatorId: req.user.userId,
            members,
            restaurantId,
            items: orderItems,
            totalAmount
        });

        res.status(201).json({
            success: true,
            message: "Group order placed!",
            groupOrder: groupOrder
        });

    } catch (error) {
        console.error("Create group order error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating group order."
        });
    }
});


/* =========================================================
   MY GROUP ORDERS
   GET /api/group-orders/my
========================================================= */

router.get("/my", async (req, res) => {
    try {
        const groupOrders = await GroupOrder.find({
            members: req.user.userId
        })
            .populate("restaurantId", "name")
            .populate("customOrderId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: groupOrders.length,
            groupOrders: groupOrders
        });

    } catch (error) {
        console.error("Get my group orders error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching group orders."
        });
    }
});


/* =========================================================
   GROUP ORDER DETAIL
   GET /api/group-orders/:id
========================================================= */

router.get("/:id", async (req, res) => {
    try {
        const groupOrder = await GroupOrder.findOne({
            _id: req.params.id,
            members: req.user.userId
        })
            .populate("members", "name username email")
            .populate("restaurantId", "name")
            .populate("customOrderId")
            .populate("items.memberId", "name username")
            .populate("items.menuItemId", "image");

        if (!groupOrder) {
            return res.status(404).json({
                success: false,
                message: "Group order not found."
            });
        }

        res.status(200).json({
            success: true,
            groupOrder: groupOrder
        });

    } catch (error) {
        console.error("Get group order detail error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching group order."
        });
    }
});


/* =========================================================
   UPDATE GROUP ORDER STATUS (creator only)
   PUT /api/group-orders/:id/status
========================================================= */

const ALLOWED_STATUSES = [
    "ACCEPTED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED"
];

router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }

        const groupOrder = await GroupOrder.findOne({
            _id: req.params.id,
            creatorId: req.user.userId
        });

        if (!groupOrder) {
            return res.status(404).json({
                success: false,
                message: "Group order not found."
            });
        }

        groupOrder.status = status;
        await groupOrder.save();

        res.status(200).json({
            success: true,
            message: "Group order status updated!",
            groupOrder: groupOrder
        });

    } catch (error) {
        console.error("Update group order status error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating group order status."
        });
    }
});


console.log("GROUP ORDER ROUTES LOADED");

module.exports = router;


/* =========================================================
   GROUP ORDER INVITATIONS + CHAT
   Friends can invite one another, accept/reject requests,
   then chat in a shared group order before choosing food.
========================================================= */
const GroupOrderInvite = require("../models/groupOrderInvite");
const GroupOrderMessage = require("../models/groupOrderMessage");
const Friend = require("../models/friend");
const User = require("../models/user");

router.post("/invite", async (req, res) => {
  try {
    const recipientId = String(req.body.recipientId || "");
    if (!recipientId || recipientId === String(req.user.userId)) return res.status(400).json({success:false,message:"Choose another user to invite."});
    const recipient = await User.findById(recipientId).select("_id role");
    if (!recipient || recipient.role !== "CUSTOMER") return res.status(404).json({success:false,message:"Customer not found."});
    const friendship = await Friend.findOne({status:"ACCEPTED",$or:[{requesterId:req.user.userId,recipientId},{requesterId:recipientId,recipientId:req.user.userId}]});
    if (!friendship) return res.status(403).json({success:false,message:"You can invite only an accepted friend. Add them from Friends first."});
    const existing = await GroupOrderInvite.findOne({senderId:req.user.userId,recipientId,status:"PENDING"});
    if (existing) return res.status(409).json({success:false,message:"You already have a pending group invitation for this friend."});
    const groupOrder = await GroupOrder.create({creatorId:req.user.userId,members:[req.user.userId],items:[],totalAmount:0});
    const invite = await GroupOrderInvite.create({groupOrderId:groupOrder._id,senderId:req.user.userId,recipientId});
    res.status(201).json({success:true,message:"Group invitation sent. Chat opens when your friend accepts.",invite,groupOrderId:groupOrder._id});
  } catch (e) { console.error("Group invite error:",e); res.status(500).json({success:false,message:"Could not send group invitation."}); }
});

router.get("/invites/incoming", async (req,res)=>{
  try { const invites=await GroupOrderInvite.find({recipientId:req.user.userId,status:"PENDING"}).populate("senderId","name username email").populate("groupOrderId","createdAt status").sort({createdAt:-1}); res.json({success:true,invites}); }
  catch(e){res.status(500).json({success:false,message:"Could not load invitations."});}
});

router.get("/invites/mine", async (req,res)=>{
  try { const invites=await GroupOrderInvite.find({$or:[{senderId:req.user.userId},{recipientId:req.user.userId}],status:"ACCEPTED"}).populate("senderId","name username").populate("recipientId","name username").populate("groupOrderId","createdAt status").sort({updatedAt:-1}); res.json({success:true,invites});}
  catch(e){res.status(500).json({success:false,message:"Could not load active group chats."});}
});

router.put("/invites/:id/accept", async(req,res)=>{
  try { const invite=await GroupOrderInvite.findOneAndUpdate({_id:req.params.id,recipientId:req.user.userId,status:"PENDING"},{$set:{status:"ACCEPTED"}},{new:true}); if(!invite)return res.status(404).json({success:false,message:"Pending invitation not found."}); await GroupOrder.findByIdAndUpdate(invite.groupOrderId,{$addToSet:{members:req.user.userId},$set:{status:"ACCEPTED"}}); res.json({success:true,message:"Invitation accepted. Your group chat is ready.",groupOrderId:invite.groupOrderId});}
  catch(e){res.status(500).json({success:false,message:"Could not accept invitation."});}
});

router.put("/invites/:id/reject", async(req,res)=>{
  try { const invite=await GroupOrderInvite.findOneAndUpdate({_id:req.params.id,recipientId:req.user.userId,status:"PENDING"},{$set:{status:"REJECTED"}},{new:true}); if(!invite)return res.status(404).json({success:false,message:"Pending invitation not found."}); res.json({success:true,message:"Invitation declined."});}
  catch(e){res.status(500).json({success:false,message:"Could not decline invitation."});}
});

router.post("/:id/messages/:messageId/reactions", async (req, res) => {
  try {
    const emoji = String(req.body.emoji || "");
    const allowed = ["❤️", "👍", "😂", "😮", "😢", "🔥"];
    if (!allowed.includes(emoji)) return res.status(400).json({ success:false, message:"Choose a supported reaction." });
    const group = await GroupOrder.findOne({ _id:req.params.id, members:req.user.userId });
    if (!group) return res.status(403).json({ success:false, message:"Only group members can react." });
    const message = await GroupOrderMessage.findOne({ _id:req.params.messageId, groupOrderId:group._id });
    if (!message) return res.status(404).json({ success:false, message:"Message not found." });
    const existing = message.reactions.findIndex(r => String(r.userId) === String(req.user.userId));
    if (existing >= 0 && message.reactions[existing].emoji === emoji) message.reactions.splice(existing, 1);
    else if (existing >= 0) { message.reactions[existing].emoji = emoji; }
    else message.reactions.push({ userId:req.user.userId, emoji });
    await message.save();
    res.json({ success:true, reactions:message.reactions });
  } catch (e) { console.error("Group message reaction error:", e); res.status(500).json({ success:false, message:"Could not save reaction." }); }
});

router.get("/:id/messages", async(req,res)=>{
  try { const go=await GroupOrder.findOne({_id:req.params.id,members:req.user.userId}); if(!go)return res.status(403).json({success:false,message:"Accept the group invitation before opening this chat."}); const messages=await GroupOrderMessage.find({groupOrderId:go._id}).populate("senderId","name username").populate("reactions.userId","name username").sort({createdAt:1}).limit(200); res.json({success:true,messages});}
  catch(e){res.status(500).json({success:false,message:"Could not load group chat."});}
});

router.post("/:id/messages", async(req,res)=>{
  try { const message=String(req.body.message||"").trim(); if(!message)return res.status(400).json({success:false,message:"Type a message first."}); if(message.length>1500)return res.status(400).json({success:false,message:"Message must be 1500 characters or fewer."}); const go=await GroupOrder.findOne({_id:req.params.id,members:req.user.userId}); if(!go)return res.status(403).json({success:false,message:"Only accepted group members can chat."}); const saved=await GroupOrderMessage.create({groupOrderId:go._id,senderId:req.user.userId,message}); await saved.populate("senderId","name username"); res.status(201).json({success:true,message:saved});}
  catch(e){res.status(500).json({success:false,message:"Could not send group message."});}
});
