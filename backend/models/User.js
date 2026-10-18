const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // `select: false` keeps the hash out of every query result unless a route
    // explicitly asks for it with .select("+passwordHash").
    // Accounts created by the old email-code login have no password yet; they
    // set one through "Forgot password".
    passwordHash: { type: String, select: false },
    // Tokens issued before this moment are rejected (see middleware/auth.js),
    // so resetting a password signs the account out everywhere else.
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
