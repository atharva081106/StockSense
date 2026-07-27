const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  type:     { type: String, enum: ["BUY", "SELL"], required: true },
  quantity: { type: Number, required: true, min: 0 },
  price:    { type: Number, required: true, min: 0 },
  date:     { type: Date, default: Date.now },
  notes:    { type: String, default: "" },
});

const holdingSchema = new mongoose.Schema({
  symbol:        { type: String, required: true, uppercase: true },
  name:          { type: String, required: true },
  exchange:      { type: String, default: "" },
  currency:      { type: String, default: "INR" },
  trades:        [tradeSchema],
  totalQuantity: { type: Number, default: 0 },
  avgBuyPrice:   { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0 },
});

const portfolioSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  holdings:      [holdingSchema],
  totalInvested: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);
