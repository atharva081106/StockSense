const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const { protect } = require("../middleware/auth");

const PY = (process.env.PYTHON_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

const proxy = async (url, res, params = {}, retries = 1) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await axios.get(url, { params, timeout: 15000 });
      return res.json(r.data);
    } catch (err) {
      if (attempt === retries) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        return res.status(503).json({ error: "Python data service is starting up or offline. Please retry in 20 seconds." });
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};

router.get("/search",  (req, res) => proxy(`${PY}/stocks/search`,   res, { q: req.query.q }));
router.get("/compare", protect, (req, res) =>
  proxy(`${PY}/stocks/compare`, res, { symbols: req.query.symbols, period: req.query.period || "3mo" })
);
router.get("/:symbol/quote",      (req, res) => proxy(`${PY}/stocks/${req.params.symbol}/quote`,      res));
router.get("/:symbol/history",    (req, res) => proxy(`${PY}/stocks/${req.params.symbol}/history`,    res,
  { period: req.query.period || "3mo", interval: req.query.interval || "1d" }));
router.get("/:symbol/indicators", (req, res) => proxy(`${PY}/stocks/${req.params.symbol}/indicators`, res,
  { period: req.query.period || "6mo" }));
router.get("/:symbol/live",       (req, res) => proxy(`${PY}/stocks/${req.params.symbol}/live`,       res));
router.get("/:symbol/predict",    protect, (req, res) =>
  proxy(`${PY}/stocks/${req.params.symbol}/predict`, res, { days: req.query.days || 30 }));
router.get("/:symbol/news",       (req, res) => proxy(`${PY}/stocks/${req.params.symbol}/news`,       res,
  { limit: req.query.limit || 10 }));

router.get("/:symbol/predict-builtin", (req, res) =>
  proxy(`${PY}/stocks/${req.params.symbol}/predict-builtin`, res, { days: req.query.days || 30 }));

router.post("/:symbol/explain-indicator", async (req, res) => {
  try {
    const { indicatorId, indicatorLabel, latest = {}, price } = req.body;
    const symbol = req.params.symbol.toUpperCase();

    const prompt = `You are a concise stock analysis assistant. Give a 3-4 sentence interpretation of this indicator for this specific stock right now. Be direct, specific, and actionable.

Stock: ${symbol}
Current price: ${price}
Indicator: ${indicatorLabel || indicatorId}
RSI: ${latest.rsi}
EMA20: ${latest.ema20}, EMA50: ${latest.ema50}
MACD: ${latest.macd}, Signal: ${latest.macdSignal}

Write 3-4 sentences:
1. What this indicator is telling you RIGHT NOW about ${symbol}
2. What this level historically means (overbought/oversold/trend)
3. What to watch for next (key level, crossover, confirmation signal)

Be specific to the numbers. No generic explanations. No disclaimers.`;

    const apiKey = process.env.MISTRAL_API_KEY || "cxv3lNFp3PKre8LtEMCmpgdDuE3WUCRC";
    const model  = process.env.MISTRAL_MODEL || "mistral-small-latest";

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        timeout: 20000,
      }
    );

    const explanation = response.data?.choices?.[0]?.message?.content || "Unable to generate explanation.";
    res.json({ explanation });
  } catch (err) {
    console.error("Indicator explainer error:", err.response?.data || err.message);
    res.status(500).json({ error: "Explanation failed: " + (err.response?.data?.message || err.message) });
  }
});

module.exports = router;
