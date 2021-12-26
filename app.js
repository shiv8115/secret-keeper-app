//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const mongoose  = require("mongoose");
const { static } = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", 'ejs');
app.use(static("public/"));

mongoose.connect("mongodb://localhost:27017/secrets", { useUnifiedTopology: true, useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model("user", userSchema);

app.get("/", function(request, response){
    response.render("home");
});

app.get("/login", function(request, response){
    response.render("login");
});

app.get("/register", function(request, response){
    response.render("register");
});

app.post("/register", function(request, response){
    console.log(request.body.email);
    const newUser = new User({
        username: request.body.email,
        password: request.body.password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        } else{
            response.render("secrets");
        }
    });
});

app.listen("3000", function(){
    console.log("Server is running on Port 3000......");
});