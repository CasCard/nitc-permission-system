//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session');
const mongoose = require('mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require("passport");
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "permissionrequestatnitcalicut",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/wikiDB",{
  useUnifiedTopology: true,useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);

const requestSchema={
  from:String,
  rollno:String,
  date:Date,
  purpose:String,
  to:[String],
  email:String,
  description:String,
  duration:String,
  current_status:[String]
};
const userSchema = new mongoose.Schema ({
  googleId: String,
  displayName: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Request=mongoose.model("Request",requestSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/request",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("login");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/request",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/request");
});

app.get("/request",function(req,res){
  res.render("request");
});

//Get route

app.route("/requests")
.get(
  function(req,res){
    Request.find(function(err,foundPermissions){
      if(!err){
        res.send(foundPermissions);
  }else{
        res.send(err);
  }
    });
  }
)
.post(
  function(req,res){
    const newRequest=new Request({
      purpose:req.body.purpose,
      from:req.body.from,
      rollno:req.body.rollno,
      date:req.body.date,
      to:req.body.to,
      email:req.body.email,
      description:req.body.description,
      duration:req.body.duration,
      current_status:"Not yet confirmed"
    });
    newRequest.save(function(err){
      if(!err){
        res.send("Succesfully added");
        res.render("success");
      }else{
        res.send(err);
      }
    });
  }
)
.delete(
  function(req,res){
    Request.deleteMany(function(err){
      if(!err){
        res.send("Successfully deleted all Requests");
      }else{
        res.send(err);
      }
    });
  }
);

app.route("/requests/:rollno")
.get(function(req,res){
  Request.findOne({rollno:req.params.rollno},function(err,foundRequest){
    if(foundRequest){
      res.send(foundRequest);
    }else{
      res.send("No requests found");
    }
  });
})
.put(function(req,res){
  Request.update(
    {rollno:req.params.rollno},
    {
      from:req.body.from,
      rollno:req.body.rollno,
      date:Date.now(),
      to:req.body.to,
      description:req.body.description,
      duration:req.body.duration,
      current_status:"Confirmed"
    },
    {overwrite:true},
    function(err){
      if(!err){
        res.send("Successfully updated requests");
      }
    }
  );
})
.patch(function(req,res){
  Request.update(
    {rollno:req.params.rollno},
    {$set:req.body},
    function(err){
      if(!err){
        res.send("Succcessfully updated requests");
      }else{
        res.send(err);
      }
    }

  );
})
.delete(
  function(req,res){
  Request.deleteOne({rollno:req.params.rollno},function(err){
    if(err) console.log(err);
  res.send("Successful deletion");
  });

});

app.get("/logout", function(req, res){
  req.logout();
  console.log("Successfully logout");
  res.redirect("/");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
