const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer "))
      token = req.headers.authorization.split(" ")[1];
    if (!token)
      return res.status(401).json({ error: "Not authorized — no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ error: "User no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError"
      ? "Token expired — please log in again"
      : "Invalid token";
    return res.status(401).json({ error: msg });
  }
};

module.exports = { protect };
