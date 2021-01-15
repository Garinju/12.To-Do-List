//jshint esversion:6
//require modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const mongoose = require("mongoose");
const app = express();
//set display to use ejs
app.set('view engine', 'ejs');
//connect to local mongoose database server
mongoose.connect(process.env.MONGODB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
//use body parser
app.use(bodyParser.urlencoded({
  extended: true
}));
//create a static folder for our local files
app.use(express.static("public"));
//schema of the todolist document
const itemsSchema = new mongoose.Schema({
  name: String
});
//schema of the customtodolist document
const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})
//model/collection of the items document
const Item = mongoose.model("Item", itemsSchema);
//model/collection of the customtodolist document
const List = mongoose.model("List", listsSchema)
//create some default document
const item1 = new Item({
  name: "Welcome to your to do list!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
//array to store all the items
const defaultItems = [item1, item2, item3];
//The items of the work to do list
const workItems = [];
//get request to home route
app.get("/", function(req, res) {
      //read the items in database with find as response of the get request to home route
      Item.find({}, function(err, items) {
          //check if items are empty
          if (items.length === 0) {
            //save the new items to database with insertMany
            Item.insertMany(defaultItems, function(err) {
              if (err) {
                console.log(err)
              } else {
                console.log("Adding default items success")
              }
            });
            res.redirect("/");
          } else {
            //render list page while pasing in listTitle key with "today" and newListItems with items values as response of get request
            res.render("list", {listTitle: "Today", newListItems: items});
          }
        });
      });

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName)
    })
  }
});

app.post("/delete", function (req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err){
        console.log(err)
      } else {
        console.log ("Delete success")
      };
    res.redirect("/");
  });
} else {
  List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList){
    if (!err){
      res.redirect("/"+listName)
    }
  })
}

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName)
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        const customList = new List ({
          name: customListName,
          items:defaultItems
        })
        customList.save();
        res.redirect("/"+customListName)
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    } else {
      console.log(err)
    }
 })
})

      app.get("/about", function(req, res) {
        res.render("about");
      });

      app.listen(process.env.PORT, function() {
        console.log("Server started on port 3000");
      });
