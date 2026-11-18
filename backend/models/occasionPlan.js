const mongoose = require("mongoose");
const occasionPlanSchema = new mongoose.Schema({
 userId:{type:mongoose.Schema.Types.ObjectId,required:true,index:true,ref:"User"},
 occasion:{type:String,required:true,trim:true}, members:{type:Number,required:true,min:1}, budget:{type:Number,required:true,min:100}, cuisine:{type:String,required:true}, meal:{type:String,required:true}, diet:{type:String,default:""}, convenience:{type:String,enum:["balanced","budget","quick","variety"],default:"balanced"}, items:{type:Array,default:[]}, estimatedTotal:{type:Number,default:0}, perPerson:{type:Number,default:0}
},{timestamps:true});
module.exports=mongoose.model("OccasionPlan",occasionPlanSchema);
