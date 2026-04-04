// ─── server/index.js ──────────────────────────────────────────────────────────
import express       from "express";
import cors          from "cors";
import helmet        from "helmet";
import mongoose      from "mongoose";
import "dotenv/config";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes   from "./routes/orderRoutes.js";
import authRoutes    from "./routes/authRoutes.js";
import { initFirebaseAdmin } from "./utils/firebaseAdmin.js";

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/auth",     authRoutes);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("[GlobalError]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// ─── Initialize Firebase Admin ─────────────────────────────────────────────────
initFirebaseAdmin();

// ─── DB + Server ──────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas connected");
    app.listen(PORT, () => console.log(`🌿 LeafyLoop API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
