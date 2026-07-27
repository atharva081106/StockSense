const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const { protect } = require("../middleware/auth");

const PY = (process.env.PYTHON_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

/* Fetch all relevant data for a stock in parallel */
async function fetchStockContext(symbol) {
  const [quoteRes, indicatorsRes, newsRes] = await Promise.allSettled([
    axios.get(`${PY}/stocks/${symbol}/quote`,      { timeout: 15000 }),
    axios.get(`${PY}/stocks/${symbol}/indicators`, { params:{ period:"3mo" }, timeout: 15000 }),
    axios.get(`${PY}/stocks/${symbol}/news`,       { params:{ limit: 5 }, timeout: 10000 }),
  ]);

  const quote      = quoteRes.status      === "fulfilled" ? quoteRes.value.data      : null;
  const indicators = indicatorsRes.status === "fulfilled" ? indicatorsRes.value.data  : null;
  const news       = newsRes.status       === "fulfilled" ? newsRes.value.data        : null;

  return { quote, indicators, news };
}

function buildContext(symbol, ctx) {
  const { quote, indicators, news } = ctx;
  const lines = [];

  if (quote) {
    const curr = quote.currency === "INR" ? "₹" : "$";
    lines.push(`STOCK: ${quote.name} (${symbol}) on ${quote.exchange}`);
    lines.push(`PRICE: ${curr}${quote.price} | Change: ${quote.changePercent?.toFixed(2)}% today`);
    lines.push(`52W range: ${curr}${quote["52WeekLow"]} – ${curr}${quote["52WeekHigh"]}`);
    lines.push(`Market cap: ${quote.marketCap ? (quote.currency === "INR" ? `₹${(quote.marketCap/1e7).toFixed(0)} Cr` : `$${(quote.marketCap/1e9).toFixed(1)}B`) : "N/A"}`);
    if (quote.peRatio)     lines.push(`P/E ratio: ${quote.peRatio}`);
    if (quote.eps)         lines.push(`EPS: ${quote.eps}`);
    if (quote.sector)      lines.push(`Sector: ${quote.sector}`);
    if (quote.industry)    lines.push(`Industry: ${quote.industry}`);
    if (quote.profitMargin)lines.push(`Profit margin: ${(quote.profitMargin * 100).toFixed(1)}%`);
    if (quote.revenueGrowth) lines.push(`Revenue growth: ${(quote.revenueGrowth * 100).toFixed(1)}%`);
    if (quote.beta)        lines.push(`Beta: ${quote.beta}`);
    if (quote.description) lines.push(`\nBUSINESS: ${quote.description.slice(0, 300)}...`);
  }

  if (indicators) {
    const { latest, signal } = indicators;
    lines.push(`\nTECHNICAL INDICATORS:`);
    lines.push(`Overall signal: ${signal}`);
    if (latest.rsi)         lines.push(`RSI (14): ${latest.rsi} ${latest.rsi < 30 ? "(oversold)" : latest.rsi > 70 ? "(overbought)" : "(neutral)"}`);
    if (latest.macd)        lines.push(`MACD: ${latest.macd} | Signal: ${latest.macdSignal} | ${latest.macd > latest.macdSignal ? "Bullish crossover" : "Bearish"}`);
    if (latest.bbUpper)     lines.push(`Bollinger Bands: Upper ${latest.bbUpper}, Mid ${latest.bbMid}, Lower ${latest.bbLower}`);
    if (latest.ema20)       lines.push(`EMA20: ${latest.ema20} | EMA50: ${latest.ema50}`);
    if (latest.stochK)      lines.push(`Stochastic %K: ${latest.stochK}`);
    if (latest.atr)         lines.push(`ATR (volatility): ${latest.atr}`);
  }

  if (news?.articles?.length) {
    lines.push(`\nRECENT NEWS (${news.articles.length} articles):`);
    news.articles.slice(0, 5).forEach((a, i) => {
      lines.push(`${i + 1}. [${a.sentiment?.label || "NEUTRAL"}] ${a.title} (${a.source})`);
    });
  }

  return lines.join("\n");
}

/* POST /api/qa/ask */
router.post("/ask", protect, async (req, res) => {
  try {
    const { symbol, question, history = [] } = req.body;

    if (!symbol || !question) {
      return res.status(400).json({ error: "symbol and question are required" });
    }

    const ctx = await fetchStockContext(symbol.toUpperCase());
    const contextBlock = buildContext(symbol.toUpperCase(), ctx);

    const systemPrompt = `You are StockSense AI — a sharp, knowledgeable stock analyst assistant.
You have access to real-time data for the requested stock. Answer questions concisely and specifically.

IMPORTANT RULES:
- Use the data provided to give specific, number-backed answers
- When asked "why did it fall/rise", combine news, technical indicators, and fundamentals
- Be direct — no generic disclaimers in every line. One brief disclaimer is fine at the end
- For Indian stocks, use ₹; for US stocks, use $
- Format your answer with clear sections if needed (use **bold** for headers)
- Never say you don't have access to real-time data — you do, it's provided below

CURRENT STOCK DATA:
${contextBlock}`;

    // Build messages array including system prompt and chat history
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    history.forEach(msg => {
      messages.push({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.content });
    });
    messages.push({ role: "user", content: question });

    const apiKey = process.env.MISTRAL_API_KEY || "cxv3lNFp3PKre8LtEMCmpgdDuE3WUCRC";
    const model = process.env.MISTRAL_MODEL || "mistral-small-latest";

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content || "Unable to generate response.";

    res.json({
      answer,
      symbol: symbol.toUpperCase(),
      dataUsed: {
        hasQuote:      !!ctx.quote,
        hasIndicators: !!ctx.indicators,
        hasNews:       !!(ctx.news?.articles?.length),
      },
    });
  } catch (err) {
    console.error("Q&A error:", err.response?.data || err.message);
    if (err.response?.status === 401) {
      return res.status(503).json({ error: "Mistral API key unauthorized or invalid." });
    }
    res.status(500).json({ error: "AI Q&A failed: " + (err.response?.data?.message || err.message || "Unknown error") });
  }
});

/* GET /api/qa/suggestions/:symbol — quick question suggestions */
router.get("/suggestions/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  const isIndian = sym.includes(".NS") || sym.includes(".BO");

  res.json({
    suggestions: [
      `Why did ${sym} move today?`,
      `Is ${sym} a good buy right now?`,
      `What do the technical indicators say about ${sym}?`,
      `What are the key risks for ${sym}?`,
      `How does ${sym} compare to its sector peers?`,
      isIndian ? `What did FII/DII data say about ${sym}?` : `What did institutional investors do with ${sym}?`,
      `What's the support and resistance for ${sym}?`,
      `Is ${sym} overbought or oversold?`,
    ],
  });
});

module.exports = router;
