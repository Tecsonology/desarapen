const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const verifyToken = async (req, res, next) => {
  try {

    const token = req.cookies?.authToken
   

    if (!token) {
      return res.status(401).json({
        message: "Invalid Authorization format.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.status !== "active") {
      return res.status(401).json({
        message: "Invalid or inactive account.",
      });
    }

    req.user = user;

    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    return res.status(401).json({
      message: "Authentication failed.",
      error: error.message,
    });
  }
};

module.exports = verifyToken;