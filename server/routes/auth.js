const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User     = require("../models/User");
const { protect } = require("../middleware/auth");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const sendToken = (user, code, res) =>
  res.status(code).json({
    token: signToken(user._id),
    user: {
      id: user._id, name: user.name, email: user.email,
      defaultMarket: user.defaultMarket, currency: user.currency,
      theme: user.theme, emailAlerts: user.emailAlerts,
    },
  });

// POST /api/auth/register
router.post("/register",
  [
    body("name").trim().isLength({ min: 2, max: 50 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: errors.array()[0].msg });

    const { name, email, password, defaultMarket } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already registered" });

    const user = await User.create({
      name, email, password,
      defaultMarket: defaultMarket || "NSE",
      currency: defaultMarket === "GLOBAL" ? "USD" : "INR",
    });
    sendToken(user, 201, res);
  }
);

// POST /api/auth/login
router.post("/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: errors.array()[0].msg });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid email or password" });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    sendToken(user, 200, res);
  }
);

// GET /api/auth/me
router.get("/me", protect, (req, res) => res.json({ user: req.user }));

// PATCH /api/auth/preferences
router.patch("/preferences", protect, async (req, res) => {
  const { defaultMarket, currency, theme, emailAlerts, name } = req.body;
  const updates = {};
  if (defaultMarket) updates.defaultMarket = defaultMarket;
  if (currency)      updates.currency      = currency;
  if (theme)         updates.theme         = theme;
  if (name)          updates.name          = name;
  if (emailAlerts !== undefined) updates.emailAlerts = emailAlerts;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ user });
});

module.exports = router;
