//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const upload = require("express-fileupload");
const { static, response } = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const userAuth = new passport.Passport();
const adminAuth = new passport.Passport();
const role = require(__dirname + "/role.js");
const passportLocalMongoose = require("passport-local-mongoose");
const { Role } = require("./role");

const app = express();

// const dataBase = require(__dirname + "/data.js");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(static("public/"));
app.use(upload());

mongoose.connect(
    `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0.ohxvc.mongodb.net/secrettodo?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
);

app.get("/", function (request, response) {
    const parameters = {
        name: "store",
    };
    response.render("index", parameters);
});

app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(userAuth.initialize());
app.use(userAuth.session());

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    role: String,
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

userAuth.use(User.createStrategy());

userAuth.serializeUser(User.serializeUser());
userAuth.deserializeUser(User.deserializeUser());

const gameListSchema = new mongoose.Schema({
    gameName: String,
    gameTags: Array,
    imagePath: String,
    backImg: String,
    gameDesc: String,
    gameInfo: Object,
    gameEditions: Array,
    systemRequirements: Object,
});

const Game = mongoose.model("game", gameListSchema);

app.post("/admin-input", function (request, response) {
    if (request.isAuthenticated()) {
        if (request.user.role === Role.ADMIN) {
            if (request.files) {
                let poster = request.files.gamePoster;
                poster.mv("./public/img/gamePoster/" + poster.name, function (err) {
                    if (err) {
                        response.send(err);
                    }
                });
                let bPoster = request.files.gamePosterB;
                bPoster.mv("./public/img/gamePosterB/" + bPoster.name, function (err) {
                    if (err) {
                        response.send(err);
                    }
                });
            }
            const game = new Game({
                gameName: request.body.gameName,
                gameGenre: request.body.gameGenre,
                imagePath: "img/gamePoster/" + request.files.gamePoster.name,
                backImg: "img/gamePosterB/" + request.files.gamePosterB.name,
                gameDesc: request.gameDesc,
                gameInfo: {
                    developer: request.body.developer,
                    publisher: request.body.publisher,
                    releaseDate: request.body.releaseDate,
                    rating: request.body.rating,
                    platforms: request.body.platforms,
                    languages: request.body.languages,
                },
                gameEditions: [
                    {
                        benefitsName: request.body.gameBenifitsName1,
                        benefits: request.body.gameBenifitsBenefit1,
                        price: request.body.gameBenifitsPrice1,
                    },
                    {
                        benefitsName: request.body.gameBenifitsName2,
                        benefits: request.body.gameBenifitsBenefit2,
                        price: request.body.gameBenifitsPrice2,
                    },
                ],
                systemRequirements: {
                    minimum: {
                        os: request.body.minos,
                        memory: request.body.minMemory,
                        processor: request.body.minProcessor,
                        videoCardMemory: request.body.minVideoMem,
                        hardDiskSpace: request.body.minSpace,
                        videoCard: request.body.minVideoCard,
                        sound: request.body.minSound,
                    },
                    recommanded: {
                        os: request.body.os,
                        memory: request.body.memory,
                        processor: request.body.processor,
                        videoCardMemory: request.body.videoCardMemory,
                        hardDiskSpace: request.body.space,
                        videoCard: request.body.videoCard,
                        sound: request.body.sound,
                    },
                },
            });
            game.save();
            response.redirect("/admin");
        } else {
            response.sendStatus(401);
        }
    } else {
        response.redirect("/login");
    }
});

app.get("/games/:gameName", function (request, response) {
    Game.findOne({ gameName: "test" }, function (error, game) {
        if (error) {
            console.log(error);
        } else {
            let parameters = {
                gameDetails: game,
            };
            response.render("gamepage", parameters);
        }
    });
});

app.get("/profile", function (request, response) {
    if (request.isAuthenticated()) {
        const params = {
            name: request.user.name,
            status: "Online",
            achivementsCount: 392,
            originpoints: 3190,
        };
        response.render("profile", params);
    } else {
        response.redirect("/login");
    }
});

app.get("/settings", function (request, response) {
    if (request.isAuthenticated()) {
        const params = {};
        response.render("settings", params);
    } else {
        response.redirect("/login");
    }
});

app.get("/login", function (request, response) {
    const param = {
        head: "Login",
        location: "/login",
    };
    response.render("login-page", param);
});

app.post("/login", function (request, response) {
    const user = new User({
        username: request.body.username,
        password: request.body.password,
    });
    request.login(user, function (err) {
        if (err) {
            console.log(err);
            response.redirect("/login");
        } else {
            userAuth.authenticate("local")(request, response, function () {
                if (request.user.role == Role.ADMIN) {
                    response.redirect("/admin");
                } else if (request.user.role == Role.USER) {
                    response.redirect("/profile");
                }
            });
        }
    });
});

app.get("/logout", (request, response) => {
    if (request.isAuthenticated()) {
        request.logout();
        response.redirect("/");
    } else {
        response.sendStatus(404);
    }
});

app.get("/register", function (request, response) {
    response.render("register");
});

app.post("/register", function (request, response) {
    User.register(
        {
            username: request.body.username,
            name: request.body.fname + " " + request.body.lname,
            role: Role.USER,
        },
        request.body.password,
        function (err) {
            if (err) {
                console.log(err);
                response.redirect("/register");
            } else {
                userAuth.authenticate("local")(request, response, function () {
                    response.redirect("/profile");
                });
            }
        }
    );
});

app.get("/admin", function (request, response) {
    if (request.isAuthenticated()) {
        if (request.user.role === Role.ADMIN) {
            Game.find({}, function (error, gameList) {
                User.find({ role: Role.USER }, function (err, userList) {
                    if (err) {
                        console.log(err);
                        response.redirect("/admin");
                    } else {
                        const params = {
                            games: gameList,
                            users: userList,
                        };
                        response.render("admin-page", params);
                    }
                });
            });
        } else {
            response.sendStatus(401);
        }
    } else {
        response.redirect("/login");
    }
});

app.post("/removeGame", function (request, response) {
    if (request.isAuthenticated() && request.user.role === Role.ADMIN) {
        Game.deleteOne({ gameName: request.body.gameName }, (err) => {
            if (err) {
                console.log(err);
            } else {
                response.redirect("/admin");
            }
        });
    }
});

app.post("/removeUser", (request, response) => {
    if (request.isAuthenticated() && request.user.role === Role.ADMIN) {
        User.deleteOne({ username: request.body.userName }, (err) => {
            if (err) {
                console.log(err);
            } else {
                response.redirect("/admin");
            }
        });
    }
});

app.get("/:pageName", function (request, response) {
    if (request.params.pageName == "home" || request.params.pageName == "mygames" || request.params.pageName == "originaccess") {
        const parameters = {
            name: request.params.pageName,
        };
        response.render(request.params.pageName, parameters);
    }
    response.sendStatus(404);
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server is running on port 3000");
});
