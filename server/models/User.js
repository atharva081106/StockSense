const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, minlength: 6, select: false },
  avatar:        { type: String, default: "" },
  defaultMarket: { type: String, enum: ["NSE", "BSE", "GLOBAL"], default: "NSE" },
  currency:      { type: String, default: "INR" },
  theme:         { type: String, enum: ["dark", "light"], default: "dark" },
  emailAlerts:   { type: Boolean, default: true },
  lastLogin:     { type: Date },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
