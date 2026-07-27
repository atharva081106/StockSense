const express     = require("express");
const router      = express.Router();
const nodemailer  = require("nodemailer");
const { protect } = require("../middleware/auth");
const Alert       = require("../models/Alert");

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const sendAlertEmail = async (email, name, alert, price) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    const dir  = alert.condition === "ABOVE" ? "risen above" : "dropped below";
    const curr = alert.currency === "INR" ? "₹" : "$";
    await createTransport().sendMail({
      from:    `"StockSense Alerts" <${process.env.FROM_EMAIL}>`,
      to:      email,
      subject: `🔔 Alert Triggered: ${alert.symbol}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#fff;padding:24px;border-radius:12px">
          <h2 style="color:#4ade80;margin:0 0 16px">🔔 Price Alert Triggered</h2>
          <p>Hi ${name},</p>
          <p>Your alert for <strong>${alert.symbol}</strong> has been triggered!</p>
          <div style="background:#1e1e3a;padding:16px;border-radius:8px;margin:16px 0;border:1px solid rgba(255,255,255,0.08)">
            <p style="margin:4px 0"><strong>Stock:</strong> ${alert.name} (${alert.symbol})</p>
            <p style="margin:4px 0"><strong>Condition:</strong> Price ${dir} ${curr}${alert.targetPrice}</p>
            <p style="margin:4px 0"><strong>Current Price:</strong> <span style="color:#4ade80">${curr}${price}</span></p>
            <p style="margin:4px 0"><strong>Time:</strong> ${new Date().toLocaleString("en-IN")}</p>
          </div>
          <p style="color:#6b7280;font-size:12px">Manage alerts at your StockSense dashboard.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Email error:", e.message);
  }
};

router.get("/", protect, async (req, res) => {
  const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ alerts });
});

router.post("/", protect, async (req, res) => {
  const { symbol, name, condition, targetPrice, currency, notifyEmail, notifyInApp, notes } = req.body;
  if (!symbol || !name || !condition || !targetPrice)
    return res.status(400).json({ error: "symbol, name, condition, targetPrice required" });
  if (!["ABOVE", "BELOW"].includes(condition.toUpperCase()))
    return res.status(400).json({ error: "condition must be ABOVE or BELOW" });

  const alert = await Alert.create({
    user: req.user._id, symbol: symbol.toUpperCase(), name,
    condition: condition.toUpperCase(), targetPrice: +targetPrice,
    currency: currency || "INR",
    notifyEmail: notifyEmail !== undefined ? notifyEmail : true,
    notifyInApp: notifyInApp !== undefined ? notifyInApp : true,
    notes: notes || "",
  });
  res.status(201).json({ message: "Alert created", alert });
});

router.delete("/:id", protect, async (req, res) => {
  const alert = await Alert.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json({ message: "Alert deleted" });
});

router.patch("/:id/toggle", protect, async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id });
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.isActive = !alert.isActive;
  await alert.save();
  res.json({ alert });
});

// ── Cron helper (called by socket/livePrice.js) ─────────────────────────────
const checkAndTriggerAlerts = async (io) => {
  try {
    const axios = require("axios");
    const User  = require("../models/User");
    const PY    = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

    const active = await Alert.find({ isActive: true, isTriggered: false });
    if (!active.length) return;

    const symbols = [...new Set(active.map(a => a.symbol))];
    for (const sym of symbols) {
      try {
        const { data } = await axios.get(`${PY}/stocks/${sym}/live`, { timeout: 10000 });
        const price = data.price;
        if (!price) continue;

        for (const alert of active.filter(a => a.symbol === sym)) {
          const hit =
            (alert.condition === "ABOVE" && price >= alert.targetPrice) ||
            (alert.condition === "BELOW" && price <= alert.targetPrice);
          if (!hit) continue;

          alert.isTriggered    = true;
          alert.isActive       = false;
          alert.triggeredAt    = new Date();
          alert.triggeredPrice = price;
          await alert.save();

          if (alert.notifyInApp && io)
            io.to(`user_${alert.user}`).emit("alert_triggered", {
              alertId: alert._id, symbol: alert.symbol, name: alert.name,
              condition: alert.condition, targetPrice: alert.targetPrice,
              currentPrice: price, currency: alert.currency, triggeredAt: alert.triggeredAt,
            });

          if (alert.notifyEmail) {
            const user = await User.findById(alert.user);
            if (user) await sendAlertEmail(user.email, user.name, alert, price);
          }
        }
      } catch (_) {}
    }
  } catch (e) {
    console.error("Alert cron error:", e.message);
  }
};

module.exports = router;
module.exports.checkAndTriggerAlerts = checkAndTriggerAlerts;
