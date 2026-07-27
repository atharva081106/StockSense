const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const Portfolio   = require("../models/Portfolio");
const axios       = require("axios");

const PY = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Core computation ─────────────────────────────────────────── */
function analyseTrades(portfolio) {
  const completed = [];   // fully closed BUY→SELL pairs

  portfolio.holdings.forEach(holding => {
    const buyQueue = [];

    holding.trades
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(trade => {
        if (trade.type === "BUY") {
          buyQueue.push({
            price:    trade.price,
            qty:      trade.quantity,
            date:     new Date(trade.date),
            symbol:   holding.symbol,
            currency: holding.currency,
          });
        } else if (trade.type === "SELL" && buyQueue.length) {
          const buy  = buyQueue.shift();
          const sell = { price: trade.price, qty: trade.quantity, date: new Date(trade.date) };
          const holdDays = Math.max(0, (sell.date - buy.date) / 86400000);
          const retPct   = ((sell.price - buy.price) / buy.price) * 100;

          completed.push({
            symbol:    buy.symbol,
            currency:  buy.currency,
            buyDate:   buy.date,
            sellDate:  sell.date,
            buyPrice:  buy.price,
            sellPrice: sell.price,
            quantity:  Math.min(buy.qty, sell.qty),
            holdDays:  Math.round(holdDays * 10) / 10,
            retPct:    Math.round(retPct * 100) / 100,
            isWin:     retPct > 0,
            buyDow:    buy.date.getDay(),
            sellDow:   sell.date.getDay(),
            buyMonth:  buy.date.getMonth(),
            pnl:       (sell.price - buy.price) * Math.min(buy.qty, sell.qty),
          });
        }
      });
  });

  if (!completed.length) return null;

  const wins   = completed.filter(t => t.isWin);
  const losses = completed.filter(t => !t.isWin);

  /* ── Averages ── */
  const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const avgWinRet  = avg(wins.map(t => t.retPct));
  const avgLossRet = avg(losses.map(t => t.retPct));
  const avgWinDays = avg(wins.map(t => t.holdDays));
  const avgLossDays= avg(losses.map(t => t.holdDays));
  const winRate    = (wins.length / completed.length) * 100;

  /* ── Loss aversion (hold losers longer than winners) ── */
  const lossAversionRatio = avgWinDays > 0.5 ? avgLossDays / avgWinDays : 1;
  // Score 0-100: 1.0 = neutral, >2 = high loss aversion
  const lossAversionScore = Math.min(100, Math.round(Math.min(lossAversionRatio, 3) / 3 * 100));

  /* ── Disposition effect: sells winners too fast, holds losers ── */
  const dispositionScore = lossAversionRatio > 1.3 ? Math.min(100, Math.round((lossAversionRatio - 1) * 100)) : 0;

  /* ── Risk/reward ── */
  const riskReward = Math.abs(avgLossRet) > 0.01 ? Math.round((avgWinRet / Math.abs(avgLossRet)) * 100) / 100 : 0;

  /* ── Overtrading (trades per month) ── */
  const dates = completed.map(t => t.buyDate.getTime());
  const spanDays = (Math.max(...dates) - Math.min(...dates)) / 86400000;
  const spanMonths = Math.max(1, spanDays / 30);
  const tradesPerMonth = Math.round((completed.length / spanMonths) * 10) / 10;
  const overtradingScore = Math.min(100, Math.round((tradesPerMonth / 15) * 100));

  /* ── Day-of-week patterns ── */
  const dowMap = {};
  completed.forEach(t => {
    const d = t.sellDow;
    if (!dowMap[d]) dowMap[d] = { label: DAYS[d], wins: 0, losses: 0, pnl: 0 };
    if (t.isWin) dowMap[d].wins++; else dowMap[d].losses++;
    dowMap[d].pnl += t.pnl;
  });
  const dowStats = Object.values(dowMap).map(d => ({
    ...d,
    winRate: d.wins + d.losses > 0 ? Math.round((d.wins / (d.wins + d.losses)) * 100) : 0,
    total: d.wins + d.losses,
    pnl: Math.round(d.pnl),
  }));
  dowStats.sort((a, b) => b.winRate - a.winRate);
  const bestDay  = dowStats[0]  || null;
  const worstDay = dowStats[dowStats.length - 1] || null;

  /* ── Month-of-year patterns ── */
  const monthMap = {};
  completed.forEach(t => {
    const m = t.buyMonth;
    if (!monthMap[m]) monthMap[m] = { label: MONTHS[m], wins: 0, losses: 0, count: 0 };
    if (t.isWin) monthMap[m].wins++; else monthMap[m].losses++;
    monthMap[m].count++;
  });

  /* ── Consecutive win/loss streaks ── */
  let maxWinStreak = 0, maxLossStreak = 0, curW = 0, curL = 0;
  completed.forEach(t => {
    if (t.isWin)  { curW++; curL = 0; maxWinStreak  = Math.max(maxWinStreak, curW); }
    else          { curL++; curW = 0; maxLossStreak = Math.max(maxLossStreak, curL); }
  });

  /* ── Impulsive entries (buys within 1 day of a big move) ── */
  // We don't have market context so we approximate via rapid buy→sell < 3 days
  const quickFlips = completed.filter(t => t.holdDays < 3);
  const quickFlipRate = Math.round((quickFlips.length / completed.length) * 100);
  const impulsivityScore = Math.min(100, quickFlipRate * 1.5);

  /* ── Overall health score (100 = perfect) ── */
  let health = 70;
  if (winRate > 55)        health += 10;
  if (riskReward > 1.5)    health += 10;
  if (lossAversionRatio < 1.3) health += 5;
  if (overtradingScore < 40)   health += 5;
  if (lossAversionRatio > 2.5) health -= 20;
  if (riskReward < 0.8)        health -= 15;
  if (winRate < 35)            health -= 10;
  if (impulsivityScore > 50)   health -= 10;
  health = Math.min(100, Math.max(0, Math.round(health)));

  /* ── Behavioural traits ── */
  const traits = [];
  if (lossAversionRatio > 1.8)
    traits.push({ type: "warning", icon: "🔒", name: "Loss Aversion", desc: `You hold losing trades ${lossAversionRatio.toFixed(1)}× longer than winning ones. Consider setting hard stop-losses.` });
  if (riskReward > 1.5)
    traits.push({ type: "good", icon: "⚖️", name: "Strong Risk/Reward", desc: `Your average win (${avgWinRet.toFixed(1)}%) is ${riskReward}× larger than your average loss. Keep it up.` });
  if (overtradingScore > 60)
    traits.push({ type: "warning", icon: "🔄", name: "Overtrading", desc: `${tradesPerMonth} trades/month is high. Increased costs and emotional decision-making often follow.` });
  if (quickFlipRate > 30)
    traits.push({ type: "warning", icon: "⚡", name: "Impulsive Trading", desc: `${quickFlipRate}% of your trades are closed in under 3 days — may indicate FOMO or panic exits.` });
  if (winRate > 60)
    traits.push({ type: "good", icon: "🎯", name: "High Win Rate", desc: `${winRate.toFixed(1)}% win rate is excellent. Ensure you're not sacrificing risk/reward ratio to achieve it.` });
  if (maxLossStreak >= 4)
    traits.push({ type: "info", icon: "📉", name: "Drawdown Sensitivity", desc: `You've had ${maxLossStreak} consecutive losses. Have a plan for drawdown periods to avoid revenge trading.` });
  if (bestDay && bestDay.winRate > 70)
    traits.push({ type: "info", icon: "📅", name: `Best Day: ${bestDay.label}`, desc: `${bestDay.winRate}% win rate on ${bestDay.label}s across ${bestDay.total} trades. Consider focusing entries on this day.` });

  /* ── Recommendations ── */
  const recommendations = [];
  if (lossAversionRatio > 1.5)
    recommendations.push("Set a hard stop-loss rule: exit any position that falls more than X% from entry, no exceptions.");
  if (riskReward < 1.0)
    recommendations.push("Aim for at least 1.5:1 risk/reward. Only enter trades where your target is 1.5× your stop distance.");
  if (overtradingScore > 50)
    recommendations.push("Limit yourself to 5–8 trades per month. Quality over quantity reduces transaction costs and emotional decisions.");
  if (quickFlipRate > 25)
    recommendations.push("Before entering, write down your thesis and minimum hold time. Commit to it.");
  if (winRate < 45 && riskReward < 1.2)
    recommendations.push("Your win rate and risk/reward are both low. Focus on selectivity — fewer, higher-conviction trades.");
  if (!recommendations.length)
    recommendations.push("Your trading metrics look healthy. Continue journaling your trades to identify further patterns.");

  return {
    summary: {
      totalTrades: completed.length,
      winRate: Math.round(winRate * 10) / 10,
      avgWinRet:  Math.round(avgWinRet  * 100) / 100,
      avgLossRet: Math.round(avgLossRet * 100) / 100,
      riskReward,
      avgWinDays:  Math.round(avgWinDays),
      avgLossDays: Math.round(avgLossDays),
      tradesPerMonth,
      maxWinStreak,
      maxLossStreak,
      healthScore: health,
    },
    scores: {
      lossAversion:  { score: lossAversionScore,  ratio: Math.round(lossAversionRatio * 100) / 100, label: lossAversionScore > 70 ? "High" : lossAversionScore > 40 ? "Moderate" : "Healthy" },
      overtrading:   { score: overtradingScore,   tpm: tradesPerMonth,              label: overtradingScore > 70 ? "High" : overtradingScore > 40 ? "Moderate" : "Healthy" },
      impulsivity:   { score: Math.round(impulsivityScore), rate: quickFlipRate,   label: impulsivityScore > 60 ? "High" : impulsivityScore > 30 ? "Moderate" : "Healthy" },
      disposition:   { score: dispositionScore,              label: dispositionScore > 60 ? "Strong" : dispositionScore > 30 ? "Moderate" : "Minimal" },
      riskDiscipline:{ score: Math.min(100, Math.round(riskReward * 50)), rr: riskReward, label: riskReward >= 1.5 ? "Strong" : riskReward >= 1.0 ? "Adequate" : "Weak" },
    },
    patterns: {
      dowStats,
      monthMap: Object.values(monthMap),
      bestDay,
      worstDay,
    },
    traits,
    recommendations,
    recentTrades: completed.slice(-20).reverse(),
  };
}

/* ── Routes ──────────────────────────────────────────────────── */

// GET /api/psychology
router.get("/", protect, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio || !portfolio.holdings.length) {
      return res.json({ empty: true, message: "No portfolio trades found. Record some trades first." });
    }

    const result = analyseTrades(portfolio);
    if (!result) {
      return res.json({ empty: true, message: "No completed trades (buy + sell pairs) found yet." });
    }

    res.json(result);
  } catch (err) {
    console.error("Psychology error:", err);
    res.status(500).json({ error: "Failed to compute psychology metrics" });
  }
});

// POST /api/psychology/ai-roast
// Sends metrics to Claude for a personalized, detailed behavioral analysis
router.post("/ai-roast", protect, async (req, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics) return res.status(400).json({ error: "metrics required" });

    const { summary, scores, patterns, traits } = metrics;

    const prompt = `You are a candid trading psychology coach analyzing a trader's behavioral data. Be honest, specific, and actionable — not generic.

TRADER'S METRICS:
- Total completed trades: ${summary.totalTrades}
- Win rate: ${summary.winRate}%
- Average winning trade: +${summary.avgWinRet}%
- Average losing trade: ${summary.avgLossRet}%
- Risk/Reward ratio: ${summary.riskReward}
- Average days held (winners): ${summary.avgWinDays} days
- Average days held (losers): ${summary.avgLossDays} days
- Trades per month: ${summary.tradesPerMonth}
- Longest win streak: ${summary.maxWinStreak}
- Longest loss streak: ${summary.maxLossStreak}

BEHAVIORAL SCORES:
- Loss Aversion: ${scores.lossAversion.label} (ratio: ${scores.lossAversion.ratio} — they hold losers ${scores.lossAversion.ratio}x longer than winners)
- Overtrading: ${scores.overtrading.label} (${scores.overtrading.tpm} trades/month)
- Impulsivity: ${scores.impulsivity.label} (${scores.impulsivity.rate}% of trades closed in <3 days)
- Disposition Effect: ${scores.disposition.label}
- Risk Discipline: ${scores.riskDiscipline.label} (R:R = ${scores.riskDiscipline.rr})

DETECTED PATTERNS:
${traits.map(t => `- ${t.name}: ${t.desc}`).join("\n")}

${patterns.bestDay ? `Best trading day: ${patterns.bestDay.label} (${patterns.bestDay.winRate}% win rate)` : ""}
${patterns.worstDay ? `Worst trading day: ${patterns.worstDay.label} (${patterns.worstDay.winRate}% win rate)` : ""}

Write a 4–6 paragraph personalized trading psychology analysis. Include:
1. What their biggest strength is (with specific numbers)
2. Their most damaging behavioral pattern (with specific consequences)  
3. What's likely happening psychologically when they hold losing trades
4. One concrete exercise or rule change that would have the highest impact
5. An honest overall assessment

Tone: Direct mentor, not cheerleader. Use the specific numbers. Don't be generic.`;

    const apiKey = process.env.MISTRAL_API_KEY || "cxv3lNFp3PKre8LtEMCmpgdDuE3WUCRC";
    const model = process.env.MISTRAL_MODEL || "mistral-small-latest";

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.4,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || "Analysis unavailable.";
    res.json({ analysis: text });
  } catch (err) {
    console.error("AI roast error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI analysis failed. " + (err.response?.data?.message || err.message) });
  }
});

module.exports = router;
