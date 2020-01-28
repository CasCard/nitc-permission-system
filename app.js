//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require('path');
const fs = require('fs');
const $ = require("jquery");
const session = require('express-session');
const mongoose = require('mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require("passport");
const request = require("request");
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();

const User = require('./models/user');
const Request = require('./models/request');
const DataCollection = require('./models/request');

// Mongo URI
const mongoURI = "mongodb+srv://abelcheruvathoor:abelcdixon@cluster0-mwzit.mongodb.net/wikiDB";

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

let gfs;
var email;
var rollno;
var role;
var studentEmail;
var facultyEmail;
var randomID = Math.floor(1000 + Math.random() * 9000);
var checkBoxStateFAC=false;
var checkBoxStateSAC=false;
var requestID;
var username;
var arrID=[];

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

app.use(express.static("public"));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(session({
  secret: "permissionrequestatnitcalicut",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const storage=new GridFsStorage({
  url:mongoURI,

  file:(req,file)=>{
    return new Promise((resolve,reject)=>{
      const filename=file.originalname;
      const fileInfo={
        filename:filename,
        bucketName:'uploads'
      };
      resolve(fileInfo);
    });
  },

});

var upload = multer({storage:storage});

mongoose.connect(mongoURI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  autoIndex: false
});
mongoose.set("useCreateIndex", true);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// "https://glacial-lake-64780.herokuapp.com/auth/google/dashboard"
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/dashboard",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    hd: 'nitc.ac.in'
  },
  function(accessToken, refreshToken, profile, cb) {
    email=profile._json.email;
    rollno=email.substring(email.lastIndexOf("_")+1,email.lastIndexOf("@")).toUpperCase();
    studentEmail=email.substring(email.lastIndexOf("_"),email.lastIndexOf("_")+1);
    role=email.substring(0, email.lastIndexOf("@"));
    console.log(rollno);
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


app.get("/",function(req, res) {
    res.render('login');
});


app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile", "email"],
    hd: 'nitc.ac.in'
  })
);

app.get("/auth/google/dashboard",
  passport.authenticate('google', {
    successRedirect:"/dashboard",
    failureRedirect: "/login"
  }),
  function(req, res) {
  if(studentEmail=='_'){
    res.redirect("/dashboard");
  }else if(role == "sac"){
    res.redirect("/sac_verification");
  }else{
    res.redirect("/fac_verification");
  }
  });


app.get("/login_failed", function(req, res) {
  res.render("login_failed");
});


  app.get("/dashboard",function(req, res) {
    console.log(req.user);
    if(req.user != undefined){
    // "https://glacial-lake-64780.herokuapp.com/requests/B190257EP"
    gfs.files.find({}).toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        request("http://localhost:3000/requests/"+rollno, function(error, response, body) {
          var data = JSON.parse(body);
          console.log(data);
          console.log(req);
          res.render("dashboard", {
            username: req.user.displayName,
            posts: data,
            files:false
          });
        });
      } else {
        files.map(file => {
          if (
            file.contentType === 'image/jpeg' ||
            file.contentType === 'image/png'
          ) {
            file.isImage = true;
          } else {
            file.isImage = false;
          }
        });

        request("http://localhost:3000/requests/"+rollno, function(error, response, body) {

          var data = JSON.parse(body);
          console.log(data);
          res.render("dashboard", {
            username: req.user.displayName,
            posts: data,
            files:files
          });
        }
      );

      }
    });

}else{
  res.redirect('/');
}
  });




// "https://glacial-lake-64780.herokuapp.com/requests"


app.post("/sac_update",function(req,res){
  console.log(requestID);
  Request.updateOne({
    ID:requestID
  },{
    $push:{'key.CNF':['sac@nitc.ac.in']},
    $pull:{'key.WTLST':'sac@nitc.ac.in'}
  },function(err){
    if(!err){
      res.redirect("/success");
    }else{
      console.log(err);
    }
  });
});
app.post("/sac_decline",function(req,res){
  console.log(requestID);
  Request.updateOne({
    ID:requestID
  },{
    $push:{'key.NCNF':['sac@nitc.ac.in']},
    $pull:{'key.WTLST':'sac@nitc.ac.in'}
  },function(err){
    if(!err){
      res.redirect("/sucess");
    }else{
      console.log(err);
    }
  });
});
app.post("/update/:ID",function(req,res){
  console.log(facultyEmail);
  Request.updateOne({
    ID:req.params.ID,
  },{
    $push:{'key.CNF':[facultyEmail]},
    $pull:{'key.WTLST':facultyEmail}
  },function(err){
    if(!err){
      res.redirect("/sucess");
    }else{
      console.log(err);
    }
  });
});

app.post("/decline/:ID",function(req,res){
  console.log(facultyEmail);
  Request.updateOne({
    ID:req.params.ID,
  },{
    $push:{'key.NCNF':[facultyEmail]},
    $pull:{'key.WTLST':facultyEmail}
  },function(err){
    if(!err){
      res.redirect("/sucess");
    }else{
      console.log(err);
    }
  });
});

app.route("/sac_verification")
.get(function(req, res) {
  res.render("sac_verification");
})
.post(function(req,res){
  Request.find({
    ID:req.body.id,
  },
  function(err, foundRequest){
    console.log(foundRequest[0].from);
    if(foundRequest){
    res.render("sac_verification",{data:foundRequest[0]});
    }else{
      res.send(err);
    }
  }
);
requestID=req.body.id;
});

// Need to work here
app.route("/fac_verification")
.get(function(req, res) {
  res.render("fac_verification");
})
.post(function(req,res){
  facultyEmail=req.body.facEmail;
  Request.find({
    fac_email:req.body.facEmail,
    'key.WTLST':req.body.facEmail
  },
  function(err, foundRequest){
    if(foundRequest){
      for(let i = 0; i < foundRequest.length; i++) {
        arrID.push(foundRequest[i].ID);
      }
    console.log(arrID);
    res.render("fac_verification",{posts:foundRequest});
    }else{
      res.send(err);
    }
  }
);
requestID=req.body.id;
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
  .post(upload.single('file'),
    function(req, res) {
      const newRequest = new Request({
        purpose: req.body.purpose,
        from: req.body.from,
        ID:randomID,
        rollno: req.body.rollno,
        date: req.body.date,
        to: req.body.auth,
        fac_email:req.body.email,
        key:{WTLST:req.body.email},
        description: req.body.description,
        duration: req.body.duration,
        source:req.file,
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

app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // If File exists this will get executed
    const readstream = gfs.createReadStream(file.filename);
    return readstream.pipe(res);
  });
});

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
        $set: req.body
      },
      function(err) {
        if (!err) {
          res.send("Successfully updated requests");
        } else {
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
  res.redirect("https://accounts.google.com/logout");
});

let PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
  console.log("Server started on port successful");
});
