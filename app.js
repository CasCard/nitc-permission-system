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
const request=require("request");
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



mongoose.connect("mongodb+srv://abelcheruvathoor:abelcd@2001@cluster0-mwzit.mongodb.net/wikiDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  autoIndex: false
});
mongoose.set("useCreateIndex", true);

const requestSchema = {
  from: String,
  rollno: String,
  date: Date,
  purpose: String,
  to: [String],
  email: String,
  description: String,
  duration: String,
  current_status: [String]
};
const userSchema = new mongoose.Schema({
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

const User = new mongoose.model("User", userSchema);
const Request = mongoose.model("Request", requestSchema);


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
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "/auth/google/dashboard",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    hd: 'nitc.ac.in'
  },
  function(accessToken, refreshToken, profile, cb) {
    if (profile._json.hd === "nitc.ac.in") {
      User.findOrCreate({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value
      }, function(err, user) {
        return cb(err, user);
      });
    }
  }
));


app.get("/", function(req, res) {
  res.render("login");
});


app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile", "email"],
    hd: 'nitc.ac.in'
  })
);


app.get("/auth/google/dashboard",
  passport.authenticate('google', {
    failureRedirect: "/login"
  }),
  function(req, res) {
    res.redirect("/dashboard");
  });

app.get("/login_failed", function(req, res) {
  res.render("login_failed");
});

app.get("/dashboard", function(req, res){

  request("https://glacial-lake-64780.herokuapp.com/requests/B190257EP",function(error,response,body){
  var data=JSON.parse(body);
    console.log(data);
    res.render("dashboard",{username:req.user.displayName,posts:data});
  });
});

app.get("/verification", function(req, res) {
  request("https://glacial-lake-64780.herokuapp.com/requests",function(error,response,body){
  var data=JSON.parse(body);
    console.log(data);
    res.render("verification",{posts:data});
  });
});




app.get("/request", function(req, res) {
  res.render("request");
});
//Get route

app.route("/requests")
  .get(
    function(req, res) {
      Request.find(function(err, foundPermissions) {
        if (!err) {
          res.send(foundPermissions);
        } else {
          res.send(err);
        }
      });
    }
  )
  .post(
    function(req, res) {
      const newRequest = new Request({
        purpose: req.body.purpose,
        from: req.body.from,
        rollno: req.body.rollno,
        date: req.body.date,
        to: req.body.part,
        email: req.body.email,
        description: req.body.description,
        duration: req.body.duration,
        current_status:req.body.status
      });
      newRequest.save(function(err) {
        if (!err) {
          res.redirect("/success");
        } else {
          res.send(err);
        }
      });
    }
  )
  .delete(
    function(req, res) {
      Request.deleteMany(function(err) {
        if (!err) {
          res.send("Successfully deleted all Requests");
        } else {
          res.send(err);
        }
      });
    }
  );

app.route("/requests/:rollno")
  .get(function(req, res) {
    Request.find({
      rollno: req.params.rollno
    }, function(err, foundRequest) {
      if (foundRequest) {
        res.send(foundRequest);
      } else {
        res.send("No requests found");
      }
    });
  })
  .patch(function(req, res) {
    Request.update({
        rollno: req.params.rollno
      }, {
        $set:req.body
      },
      function(err) {
        if (!err) {
          res.send("Successfully updated requests");
        }else{
          res.send(err);
        }
      }
    );
  })
  .delete(
    function(req, res) {
      Request.deleteOne({
        rollno: req.params.rollno
      }, function(err) {
        if (err) console.log(err);
        res.send("Successful deletion");
      });

    });
app.get("/success", function(req, res) {
  res.render("success");
});

app.get("/logout", function(req, res) {
  req.logout();
  console.log("Successfully logout");
  res.redirect("/");
});


let PORT = process.env.PORT;

app.listen(PORT, function() {
  console.log("Server started on port successful");
});
