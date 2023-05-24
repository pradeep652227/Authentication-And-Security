require('dotenv').config();

const express = require("express");
const app = express();
const port = 3000;
//Setting up the authentication to our web application using passport
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');

const ejs = require("ejs");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//Setting up the middleware (express-session middleware) to help us save the session cookie, it'll monitor every request b/w the browser and the server 
app.use(session({
  secret:process.env.SECRET,
  resave:true,
  saveUninitialized:false,
  cookie:{}
}));

//passport is initialized along with its 'session authentication' middleware
app.use(passport.initialize());
app.use(passport.session());//if ur application uses persistent login session, passport.session() must also be used

//require mongoose
const mongoose = require("mongoose");
async function main(){
  await mongoose.connect("mongodb://127.0.0.1:27017/usersDB");
}

main().catch(err=>console.log("Error in setting up the mongoDB connection through mongoose, err= "+err));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String },
});


userSchema.plugin(passportLocalMongoose);//it'll simplify the integration between mongoose and passport for local authentication
//it'll add a 'hash' and a 'salt value' to our schema in order to store the hashed pwd and the salt value.

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());//created local strategy for username and password login system
passport.serializeUser(User.serializeUser());//user is serialized when a session is created and the user details are added to the cookie
passport.deserializeUser(User.deserializeUser());//user is deserialized in order to find what's inside of the cookie, so that the passport (or, us) 
//can authenticate them(user) on our server.

app.get("/secrets",(req,res)=>{
  if(req.isAuthenticated())
      res.render("secrets");
  else {
    console.log("User is deauthenticated");
    res.redirect("/login");
  }
});

app.post("/register", (req, res) => {
  let data = req.body;
  let newEmail = data.username;
  let password = data.password;

  User.register({username:newEmail},password)//register the user using passport authentication
     .then((result)=>{// all the heavy lifting of registering/ storing the usr to DB is done by passport-local-mongoose
      const authenticate=passport.authenticate("local");
      authenticate(req,res,()=>{//passport is authenticating the user
        res.redirect("/secrets");
      });
     })
     .catch(err=>{
      console.log("Error in Registering/Authenticating the User, err"+ err);
      res.redirect("/register");
     });
  
});

app.post("/login", (req, res) => {
  let data = req.body;
  let newEmail = data.username;
  let newPwd = data.password;
  console.log("username= "+newEmail+" and password is "+newPwd);
  const newUser=User({
    username:newEmail,
    password:newPwd
  });
  passport.authenticate("local",(err,newUser)=>{//authenticating the user to check if the username and password match
    if(err){ console.log("Error in logging the user, err= "+err); res.redirect("/"); }
    else{
      //user returned from passport.authenticate which will either be true or false boolean value
      if(newUser){//if the credentials matched
        req.login(newUser,(err)=>{
          if(err){ console.log("Error in logging the user, err= "+err); res.redirect("/"); }
          else{
            res.redirect("/secrets");
          }
        });
      }else{//no user was found
        console.log("No such user found with user details given by you= "+newEmail+" and password= "+newPwd+" newUser="+newUser);
        res.redirect("/login");
      }
    }
  })(req,res);
  
});

app.get("/logout",(req,res)=>{
  req.logout((err)=>{
    if(err){
      console.log("Error in logging-out the user, err="+err);
      res.redirect("/secrets");
    }else
      res.redirect("/");
  });
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
