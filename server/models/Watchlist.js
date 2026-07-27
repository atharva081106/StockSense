const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  symbol:   { type: String, required: true, uppercase: true },
  name:     { type: String, required: true },
  exchange: { type: String, default: "" },
  currency: { type: String, default: "INR" },
  addedAt:  { type: Date, default: Date.now },
  notes:    { type: String, default: "" },
});

const watchlistSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  stocks: [itemSchema],
}, { timestamps: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);
