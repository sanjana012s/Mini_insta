const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const port = 8080;

// Static folders
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, "public/images"); // folder must exist
  },
  filename: function(req, file, cb){
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Dummy login page
app.get("/", (req, res) => {
  res.render("login");
});

// Login route
app.post("/login", express.urlencoded({ extended: true }), (req, res) => {
  const username = req.body.username.trim();
  const filePath = path.join(__dirname, "data.json");
  let data = {};

  if(fs.existsSync(filePath)){
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if(!data[username]){
    data[username] = {
      username,
      bio: "Hey, I am new on InstaPage!",
      followers: Math.floor(Math.random() * 500),
      following: Math.floor(Math.random() * 300),
      profilePic: "/images/default.png"
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  res.redirect(`/profile/${username}`);
});

// Profile page
app.get("/profile/:username", (req, res) => {
  const username = req.params.username;
  const data = JSON.parse(fs.readFileSync("data.json", "utf8"));
  if(data[username]){
    res.render("profile", { data: data[username] });
  } else {
    res.send("User not found!");
  }
});

// Upload route
app.post("/upload/:username", upload.single("profilePic"), (req, res) => {
  const username = req.params.username;
  const data = JSON.parse(fs.readFileSync("data.json", "utf8"));

  if(data[username] && req.file){
    data[username].profilePic = "/images/" + req.file.filename;
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  }

  res.redirect(`/profile/${username}`);
});

// Search route
app.get("/search", (req, res) => {
  const query = (req.query.query || "").toLowerCase();
  const data = JSON.parse(fs.readFileSync("data.json", "utf8"));

  const results = Object.keys(data)
    .filter(u => u.includes(query))
    .map(u => ({
      username: u,
      profilePic: data[u].profilePic,
      bio: data[u].bio,
      followers: data[u].followers,
      following: data[u].following
    }));

  res.json(results);
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
