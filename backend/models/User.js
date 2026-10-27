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
    passwordHash: { type: String, select: false },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name || "",
    email: this.email,
    role: this.role === "admin" ? "admin" : "customer",
  };
};

module.exports = mongoose.model("User", userSchema);
