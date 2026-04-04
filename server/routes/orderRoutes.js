// ─── server/routes/orderRoutes.js ─────────────────────────────────────────────
import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createCODOrder,
  updateOrderStatus,
} from "../controllers/razorpayController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validateMiddleware.js";
import { z } from "zod";

const router = express.Router();

// ── Zod Schemas ───────────────────────────────────────────────────────────────
const cartItemSchema = z.object({
  _id:      z.string(),
  name:     z.string(),
  price:    z.number().positive(),
  quantity: z.number().int().positive(),
  stock:    z.number().int().min(0),
  image:    z.string().optional(),
});

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone:    z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  line1:    z.string().min(3),
  line2:    z.string().optional(),
  city:     z.string().min(2),
  state:    z.string().min(2),
  pincode:  z.string().regex(/^\d{6}$/, "Invalid pincode"),
  country:  z.string().default("India"),
});

const createOrderSchema = z.object({
  cartItems:       z.array(cartItemSchema).min(1),
  shippingAddress: addressSchema,
  shippingCost:    z.number().min(0).default(0),
  discount:        z.number().min(0).default(0),
  couponCode:      z.string().optional(),
  shippingTier:    z.enum(["free","kerala","india"]).optional(),
});

const verifySchema = z.object({
  orderId:           z.string(),
  razorpayOrderId:   z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

// ── Routes ────────────────────────────────────────────────────────────────────
router.post("/create-razorpay-order", protect, validateBody(createOrderSchema), createRazorpayOrder);
router.post("/verify-payment",        protect, validateBody(verifySchema),       verifyRazorpayPayment);
router.post("/cod",                   protect, validateBody(createOrderSchema),  createCODOrder);

// Admin
router.patch("/:id/status", protect, adminOnly, updateOrderStatus);

// User order history
router.get("/my-orders", protect, async (req, res) => {
  const { Order } = await import("../models/Order.js");
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select("-statusHistory -paymentResult.razorpaySignature")
    .populate("items.product", "name images");
  res.json({ success: true, orders });
});

// Admin — all orders
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  const { Order } = await import("../models/Order.js");
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { orderStatus: status } : {};
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("user", "name email");
  const total = await Order.countDocuments(filter);
  res.json({ success: true, orders, total, page: Number(page) });
});

export default router;
