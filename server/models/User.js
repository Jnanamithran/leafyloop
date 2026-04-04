import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false }, // null for OAuth users
    avatar:   { type: String, default: "" },
    phone:    { type: String },
    role:     { type: String, enum: ["user", "admin"], default: "user" },

    // OAuth
    googleId:    { type: String, sparse: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },

    // Wishlist (stored server-side, synced with Redux)
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Address book
    addresses: [
      {
        label:    { type: String, default: "Home" },
        fullName: String,
        phone:    String,
        line1:    String,
        line2:    String,
        city:     String,
        state:    String,
        pincode:  String,
        isDefault: { type: Boolean, default: false },
      },
    ],

    // Auth tokens
    refreshToken: { type: String, select: false },

    // Reset Password
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },

    isActive:  { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

// ─── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export const User = mongoose.model("User", userSchema);
