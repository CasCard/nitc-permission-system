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

mongoose.connect("mongodb://localhost:27017/wikiDB",{
  useUnifiedTopology: true,useNewUrlParser: true
});

const requestSchema={
  from:String,
  rollno:String,
  date:Date,
  to:[String],
  description:String,
  duration:String,
  current_status:[String]
};
const Request=mongoose.model("Request",requestSchema);

app.get("/",function(req,res){
  res.render("login");
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
      from:req.body.from,
      rollno:req.body.rollno,
      date:Date.now(),
      to:req.body.to,
      description:req.body.description,
      duration:req.body.duration,
      current_status:"Not yet confirmed"
    });
    newRequest.save(function(err){
      if(!err){
        res.send("Succesfully added");
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



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
