//jshint esversion:6
var mongoose = require('mongoose');
var moment = require('moment');
var Schema=mongoose.Schema;
const requestSchema = new mongoose.Schema({
  from: String,
  ID:Number,
  rollno: String,
  date: Date,
  purpose: String,
  to: [String],
  fac_email: [String],
  description: String,
  duration: String,
  source:{data:Buffer,filename:String},
  key:{
    WTLST:[String],
    NCNF:[String],
    CNF:[String],
  }
});

module.exports=mongoose.model("Request", requestSchema);
