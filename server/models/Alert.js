const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  symbol:         { type: String, required: true, uppercase: true },
  name:           { type: String, required: true },
  condition:      { type: String, enum: ["ABOVE", "BELOW"], required: true },
  targetPrice:    { type: Number, required: true, min: 0 },
  currency:       { type: String, default: "INR" },
  isActive:       { type: Boolean, default: true },
  isTriggered:    { type: Boolean, default: false },
  triggeredAt:    { type: Date },
  triggeredPrice: { type: Number },
  notifyEmail:    { type: Boolean, default: true },
  notifyInApp:    { type: Boolean, default: true },
  notes:          { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);
