const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

/* ================== DB CONNECT ================== */
mongoose.connect("mongodb://127.0.0.1:27017/beathub")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================== USER MODEL ================== */
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: {
    type: String,
    select: false
  }
});

// hash password
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});
// compare password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);


/* ================== POST MODEL ================== */
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);


/* ================== AUTH MIDDLEWARE ================== */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: "Not authorized" }
    });
  }

  try {
    const decoded = jwt.verify(token, "secret123");

    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: "Token failed" }
    });
  }
};


/* ================== REGISTER ================== */
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.create({ name, email, password });

  res.json({
    success: true,
    message: "User registered"
  });
});


/* ================== LOGIN ================== */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: "Please provide email and password" }
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid email or password" }
    });
  }

  const token = jwt.sign({ id: user._id }, "secret123", {
    expiresIn: "1d"
  });

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      email: user.email
    }
  });
});


/* ================== CREATE POST ================== */
app.post("/api/posts", protect, async (req, res) => {
  const { title, content } = req.body;

  const post = await Post.create({
    title,
    content,
    user: req.user._id
  });

  res.json({
    success: true,
    post
  });
});


/* ================== GET POSTS (PAGINATION) ================== */
app.get("/api/posts", protect, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 2;

  const skip = (page - 1) * limit;

  const posts = await Post.find({ user: req.user._id })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Post.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalPosts: total,
    posts
  });
});


/* ================== TEST ROUTE ================== */
app.get("/api/test", (req, res) => {
  res.json({ message: "API working 🚀" });
});


/* ================== SERVER ================== */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});