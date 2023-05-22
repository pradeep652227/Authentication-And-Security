const express = require("express");
const app = express();
const port = 3000;

const ejs = require("ejs");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//require mongoose
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/usersDB");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

/*encrypting  our database using mongoose-encryption*/
const encrypt=require('mongoose-encryption');

let secretString="ThisisourLongSecretstring.";
userSchema.plugin(encrypt,{secret:secretString});

const User = new mongoose.model("User", userSchema);

app.post("/register", (req, res) => {
  let data = req.body;
  let newEmail = data.userEmail;
  let newPwd = data.password;
  //creating a User
  User.create({
    email: newEmail,
    password: newPwd,
  })
    .then((result) => {
      res.send("<h1>Successfully Created a New User!!</h1>");
    })
    .catch((err) => {
      console.log("Error in creating a New User " + err);
      res.send("<h1>Error in creating a New User</h1>");
    });
});

app.post("/login", (req, res) => {
  let data = req.body;
  let newEmail = data.userEmail;
  let newPwd = data.password;

  //finding the accound with the entered details
  User.findOne({email:newEmail,password:newPwd})
        .then(result=>{
            console.log(result);
            res.send("This is the result after finding the account= "+result);
        })
        .catch(err=>res.send(err));
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/secrets", (req, res) => {
  res.render("secrets");
});
app.get("/", (req, res) => {
  res.render("home");
});
app.listen(process.env.PORT || port, () => {
  console.log("server is up and running");
});
