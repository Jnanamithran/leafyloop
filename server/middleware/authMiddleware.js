import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// ─── Token Utilities ──────────────────────────────────────────────────────────
export const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });

export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

// ─── Protect Middleware ───────────────────────────────────────────────────────
/**
 * Verifies the Bearer access token from Authorization header.
 * Attaches `req.user` (full Mongoose doc, minus sensitive fields).
 */
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Token expired.", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ success: false, message: "Invalid token." });
    }

    const user = await User.findById(decoded.id).select("-password -refreshToken -resetPasswordToken");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or deactivated." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[authMiddleware]", err);
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
}

// ─── Admin Guard ──────────────────────────────────────────────────────────────
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
}

// ─── Refresh Token Controller ─────────────────────────────────────────────────
/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 * Returns a new access token if refresh token is valid.
 */
export async function refreshAccessToken(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token required." });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ success: false, message: "Invalid refresh token." });
    }

    const newAccessToken  = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success:       true,
      token:         newAccessToken,
      refreshToken:  newRefreshToken,
    });
  } catch (err) {
    return res.status(403).json({ success: false, message: "Refresh token expired. Please log in again." });
  }
}

// ─── Optional Auth (for public routes with optional personalization) ───────────
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next(); // unauthenticated is fine

  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = await User.findById(decoded.id).select("-password -refreshToken");
  } catch {
    // silently ignore invalid tokens for optional auth routes
  }
  next();
}
