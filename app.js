require("dotenv").config();
const express = require("express")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;


app = express();
app.use(express.urlencoded({
  extended: true
}))
app.use(express.static("public"));
app.set("view engine", "ejs")


main().catch(err => console.log(err));

async function main() {

  app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  }))

  app.use(passport.initialize());
  app.use(passport.session());

  await mongoose.connect('mongodb+srv://tishdmakinde:mypasswordiswhat@cluster0.eaifx.mongodb.net/userDB?retryWrites=true&w=majority');

  const userSchema = new mongoose.Schema({
    email: String,
    password: String
  });

  userSchema.plugin(passportLocalMongoose)
  userSchema.plugin(findOrCreate);

  const User = new mongoose.model("User", userSchema)


  // CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
  passport.use(User.createStrategy());

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function(err, user) {
      return cb(err, user);
    });
  }
  ));

  app.route("/")
    .get(function(req, res) {
      res.render("home");
    });

  app.get('/auth/google/secrets', passport.authenticate('google', {scope: ['profile']}, {failureRedirect: '/login'}),
    function(req, res) {
      res.redirect("/secrets")
    }
  );


  app.route("/login")
    .get(function(req, res) {
      res.render("login")
    })

    .post(passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {

      res.redirect("/secrets")

    });


  app.route("/register")
    .get(function(req, res) {
      res.render("register")
    })

    .post(function(req, res) {
      User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
          res.redirect("/register")
        } else {
          passport.authenticate("local")(req, res, function() {
            res.redirect("/secrets")
          })
        }


      });

    });

  app.route("/secrets")

    .get(function(req, res) {
      if (req.isAuthenticated()) {
        res.render("secrets")
      } else {
        res.redirect("/login")
      }
    });

  app.route("/logout")

    .get(function(req, res) {
      req.logout()
      res.redirect("/")
    })


  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
  });


}



app.listen(3000, function() {
  console.log("Server is running at port 3000");
});
