//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { static } = require("express");
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
const date = require(__dirname + "/data.js");
app.use(static("public"));

mongoose.connect("mongodb://localhost:27017/todoList", { useNewUrlParser: true, useUnifiedTopology: true });

const todoSchema = mongoose.Schema({
    task: String,
});

const Task = mongoose.model("Task", todoSchema);

const listSchema = mongoose.Schema({
    name: String,
    task: [todoSchema],
});

const List = mongoose.model("List", listSchema);

const defaultItems = [];

Task.insertMany(defaultItems),
    function (error) {
        if (!error) {
            console.log("Insert Sucessful");
        }
    };

app.get("/", function (request, response) {
    Task.find({}, function (error, todos) {
        let parameters = {
            day: "Today",
            location: "/",
            newTasks: todos,
        };
        response.render("index", parameters);
    });
});

app.post("/", function (request, response) {
    const temp = new Task({
        task: request.body.things,
    });
    temp.save();
    response.redirect("/");
});

app.post("/delete", function (request, response) {
    console.log(request.body.checkbox);
    const deleteId = request.body.checkbox;
    const deleteList = request.body.listname;
    console.log(deleteList);
    if (deleteList == "Today") {
        Task.deleteOne({ _id: request.body.checkbox }, function (erro) {
            console.log(erro);
        });
        response.redirect("/");
    } else {
        List.findOne({ name: deleteList }, function (error, data) {
            for (let i = 0; i < data.task.length; i++) {
                if (data.task[i]._id == deleteId) {
                    data.task.splice(i, 1);
                    data.save();
                    response.redirect("/" + deleteList);
                }
            }
        });
    }
});
app.get("/:customListName", function (request, response) {
    let params = request.params.customListName;
    let work = [];
    List.findOne({ name: params }, function (error, items) {
        if (!items) {
            const list = new List({
                name: params,
                task: [],
            });
            list.save();
            let parameters = {
                day: params,
                location: "/" + params,
                newTasks: [],
            };
            response.render("index", parameters);
        } else {
            work = items.task;
            // console.log("work: " + work);
            let parameters = {
                day: params,
                location: "/" + params,
                newTasks: work,
            };
            response.render("index", parameters);
        }
    });
});
app.post("/:customListName", function (request, response) {
    let listName = request.params.customListName;
    const temp = new Task({
        task: request.body.things,
    });
    List.findOne({ name: listName }, function (error, data) {
        data.task.push({ task: request.body.things });
        data.save();
    });
    response.redirect("/" + listName);
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen("3000", function () {
    console.log("The server is running at port 3000");
});
