//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/permission-requests",{
  userNewUrlParser:true
});

const permissionSchema={
  rollno:String,
  purpose:String,
  permitters:[
    {
      facultyName:String,
      securityName:String
    }
  ],
  description:String,
  duration:String
};
const Permission=mongoose.model("Permission",permissionSchema);

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
