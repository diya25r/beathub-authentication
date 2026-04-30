const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    console.log("AUTH HEADER:", req.headers.authorization);
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
    const decoded = jwt.verify(token, "secret123"); // use same secret as login

    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: "Token failed" }
    });
  }
};

module.exports = protect;