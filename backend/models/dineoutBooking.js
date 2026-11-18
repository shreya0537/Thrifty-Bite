const mongoose = require("mongoose");
const dineoutBookingSchema = new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  restaurantName:{type:String,required:true,trim:true,maxLength:120},
  area:{type:String,required:true,trim:true,maxLength:120},
  bookingDate:{type:Date,required:true},
  timeSlot:{type:String,required:true},
  partySize:{type:Number,required:true,min:1,max:20},
  occasion:{type:String,default:"Casual dining",trim:true},
  specialRequest:{type:String,default:"",maxLength:500},
  status:{type:String,enum:["REQUESTED","CONFIRMED","CANCELLED"],default:"REQUESTED"}
},{timestamps:true});
module.exports=mongoose.model("DineoutBooking",dineoutBookingSchema);
