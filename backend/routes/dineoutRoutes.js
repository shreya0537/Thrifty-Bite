const express=require("express");
const mongoose=require("mongoose");
const DineoutBooking=require("../models/dineoutBooking");
const auth=require("../middleware/authMiddleware");
const router=express.Router();
router.use(auth);
router.get("/",async(req,res)=>{
 try{const bookings=await DineoutBooking.find({userId:req.user.userId}).sort({bookingDate:1,createdAt:-1}).lean();res.json({success:true,bookings});}
 catch(e){console.error("Dineout list:",e);res.status(500).json({success:false,message:"Could not load dine-in reservations."});}
});
router.post("/",async(req,res)=>{
 try{
  const {restaurantName,area,bookingDate,timeSlot,partySize,occasion,specialRequest}=req.body||{};
  if(!restaurantName?.trim()||!area?.trim()||!bookingDate||!timeSlot||!Number.isInteger(Number(partySize))||Number(partySize)<1||Number(partySize)>20)
   return res.status(400).json({success:false,message:"Complete the restaurant, area, date, time and guest count fields."});
  const date=new Date(bookingDate);
  if(Number.isNaN(date.getTime())||date<new Date())return res.status(400).json({success:false,message:"Choose a future date and time."});
  const booking=await DineoutBooking.create({userId:req.user.userId,restaurantName:restaurantName.trim(),area:area.trim(),bookingDate:date,timeSlot,partySize:Number(partySize),occasion:occasion||"Casual dining",specialRequest:specialRequest||""});
  res.status(201).json({success:true,message:"Dine-in request saved to your account.",booking});
 }catch(e){console.error("Dineout create:",e);res.status(500).json({success:false,message:"Could not save your reservation request."});}
});
router.delete("/:id",async(req,res)=>{
 try{if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({success:false,message:"Invalid reservation ID."});const booking=await DineoutBooking.findOneAndUpdate({_id:req.params.id,userId:req.user.userId,status:"REQUESTED"},{status:"CANCELLED"},{new:true});if(!booking)return res.status(404).json({success:false,message:"Reservation not found or cannot be cancelled."});res.json({success:true,booking});}
 catch(e){res.status(500).json({success:false,message:"Could not cancel reservation."});}
});
module.exports=router;
