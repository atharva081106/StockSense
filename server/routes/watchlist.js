const express   = require("express");
const router    = express.Router();
const { protect } = require("../middleware/auth");
const Watchlist = require("../models/Watchlist");

router.get("/", protect, async (req, res) => {
  let wl = await Watchlist.findOne({ user: req.user._id });
  if (!wl) wl = await Watchlist.create({ user: req.user._id, stocks: [] });
  res.json({ stocks: wl.stocks });
});

router.post("/", protect, async (req, res) => {
  const { symbol, name, exchange, currency } = req.body;
  if (!symbol || !name)
    return res.status(400).json({ error: "symbol and name required" });

  let wl = await Watchlist.findOne({ user: req.user._id });
  if (!wl) wl = await Watchlist.create({ user: req.user._id, stocks: [] });

  if (wl.stocks.some(s => s.symbol.toUpperCase() === symbol.toUpperCase()))
    return res.status(400).json({ error: `${symbol} already in watchlist` });

  wl.stocks.push({ symbol: symbol.toUpperCase(), name, exchange, currency });
  await wl.save();
  res.status(201).json({ message: `${symbol} added`, stocks: wl.stocks });
});

router.delete("/:symbol", protect, async (req, res) => {
  const wl = await Watchlist.findOne({ user: req.user._id });
  if (!wl) return res.status(404).json({ error: "Watchlist not found" });
  wl.stocks = wl.stocks.filter(s => s.symbol.toUpperCase() !== req.params.symbol.toUpperCase());
  await wl.save();
  res.json({ message: `${req.params.symbol} removed`, stocks: wl.stocks });
});

module.exports = router;
