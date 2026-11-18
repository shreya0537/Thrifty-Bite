const mongoose = require("mongoose");
const groupOrderInviteSchema = new mongoose.Schema({
  groupOrderId:{type:mongoose.Schema.Types.ObjectId,ref:"GroupOrder",required:true,index:true},
  senderId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  recipientId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  status:{type:String,enum:["PENDING","ACCEPTED","REJECTED"],default:"PENDING",index:true}
},{timestamps:true});
groupOrderInviteSchema.index({groupOrderId:1,recipientId:1},{unique:true});
module.exports=mongoose.model("GroupOrderInvite",groupOrderInviteSchema);
