//jshint esversion:6
var mongoose = require('mongoose');
var moment = require('moment');
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require("passport-local-mongoose");
var Schema=mongoose.Schema;

const userSchema = new Schema({
  googleId: {
    type: String,
    index: {
      unique: true
    }
  },
  displayName: String,
  email: String
}, {
  autoIndex: false
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

module.exports=mongoose.model("User", userSchema);
