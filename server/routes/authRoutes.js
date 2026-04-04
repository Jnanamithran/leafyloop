// ─── server/routes/authRoutes.js ──────────────────────────────────────────────
import express        from "express";
import { z }          from "zod";
import { User }       from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  protect,
  refreshAccessToken,
}                     from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().min(2, "Name too short").max(60),
  email:    z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, "Password required"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function issueTokens(userId) {
  return {
    token:        signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
  };
}

// ─── Register ─────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors:  parsed.error.flatten().fieldErrors,
    });
  }

  const { name, email, password } = parsed.data;

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const user           = await User.create({ name, email, password });
    const { token, refreshToken } = issueTokens(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    return res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;

  try {
    const user = await User.findOne({ email, authProvider: "local" }).select("+password +refreshToken");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { token, refreshToken } = issueTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    return res.json({
      success: true,
      token,
      refreshToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Google OAuth (Firebase ID Token verification) ────────────────────────────
router.post("/google", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, message: "ID token required." });

  try {
    // Verify Firebase ID token
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(idToken);

    const { uid, email, name, picture } = decoded;

    let user = await User.findOne({ $or: [{ googleId: uid }, { email }] });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId:     uid,
        avatar:       picture,
        authProvider: "google",
      });
    } else if (!user.googleId) {
      user.googleId     = uid;
      user.authProvider = "google";
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    const { token, refreshToken } = issueTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    return res.json({ success: true, token, refreshToken, user: user.toPublicJSON() });
  } catch (err) {
    console.error("[googleAuth]", err);
    return res.status(401).json({ success: false, message: "Google authentication failed." });
  }
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
router.post("/refresh", refreshAccessToken);

// ─── Get Me ───────────────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist", "_id name price images");
  res.json({ success: true, user: user.toPublicJSON() });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/logout", protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.json({ success: true, message: "Logged out." });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put("/profile", protect, async (req, res) => {
  const allowed = ["name", "phone", "avatar", "addresses"];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user: user.toPublicJSON() });
});

// ─── Sync Wishlist (server ↔ Redux) ──────────────────────────────────────────
router.post("/wishlist/sync", protect, async (req, res) => {
  const { productIds = [] } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { wishlist: productIds },
    { new: true }
  ).populate("wishlist", "_id name price images category rating");
  res.json({ success: true, wishlist: user.wishlist });
});

export default router;
