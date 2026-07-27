const express   = require("express");
const router    = express.Router();
const { protect } = require("../middleware/auth");
const Portfolio = require("../models/Portfolio");

function recalc(holding) {
  let qty = 0, cost = 0;
  for (const t of holding.trades) {
    if (t.type === "BUY") {
      cost += t.quantity * t.price;
      qty  += t.quantity;
    } else {
      const avg = qty > 0 ? cost / qty : 0;
      cost -= avg * Math.min(t.quantity, qty);
      qty  -= t.quantity;
      if (qty  < 0) qty  = 0;
      if (cost < 0) cost = 0;
    }
  }
  holding.totalQuantity = Math.max(0, qty);
  holding.avgBuyPrice   = qty > 0 ? cost / qty : 0;
  holding.totalInvested = cost;
}

router.get("/", protect, async (req, res) => {
  let p = await Portfolio.findOne({ user: req.user._id });
  if (!p) p = await Portfolio.create({ user: req.user._id, holdings: [] });
  res.json({ holdings: p.holdings.filter(h => h.totalQuantity > 0), allHoldings: p.holdings });
});

router.post("/trade", protect, async (req, res) => {
  const { symbol, name, exchange, currency, type, quantity, price, date, notes } = req.body;
  if (!symbol || !name || !type || !quantity || !price)
    return res.status(400).json({ error: "symbol, name, type, quantity, price required" });

  let p = await Portfolio.findOne({ user: req.user._id });
  if (!p) p = await Portfolio.create({ user: req.user._id, holdings: [] });

  const sym = symbol.toUpperCase();
  let h = p.holdings.find(h => h.symbol === sym);
  if (!h) {
    p.holdings.push({ symbol: sym, name, exchange: exchange || "", currency: currency || "INR", trades: [] });
    h = p.holdings[p.holdings.length - 1];
  }

  h.trades.push({ type: type.toUpperCase(), quantity: +quantity, price: +price,
    date: date ? new Date(date) : new Date(), notes: notes || "" });
  recalc(h);
  p.totalInvested = p.holdings.reduce((s, h) => s + h.totalInvested, 0);
  await p.save();
  res.status(201).json({ message: "Trade recorded", holding: p.holdings.find(h => h.symbol === sym) });
});

router.delete("/:symbol", protect, async (req, res) => {
  const p = await Portfolio.findOne({ user: req.user._id });
  if (!p) return res.status(404).json({ error: "Portfolio not found" });
  p.holdings = p.holdings.filter(h => h.symbol !== req.params.symbol.toUpperCase());
  await p.save();
  res.json({ message: `${req.params.symbol} removed` });
});

module.exports = router;
