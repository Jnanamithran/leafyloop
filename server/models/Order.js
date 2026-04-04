import mongoose from "mongoose";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:     { type: String, required: true },
  image:    String,
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  phone:     { type: String, required: true },
  line1:     { type: String, required: true },
  line2:     String,
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
  country:   { type: String, default: "India" },
});

const paymentResultSchema = new mongoose.Schema({
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  gateway:           { type: String, enum: ["razorpay", "cod"], default: "razorpay" },
  paidAt:            Date,
});

const statusHistorySchema = new mongoose.Schema({
  status:    String,
  note:      String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// ─── Order Schema ─────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // ── Customer ──────────────────────────────────────────────────────────────
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    guestEmail: String, // for guest checkouts

    // ── Items ─────────────────────────────────────────────────────────────────
    items: {
      type:     [orderItemSchema],
      required: true,
      validate: { validator: (v) => v.length > 0, message: "Order must have at least one item" },
    },

    // ── Pricing ───────────────────────────────────────────────────────────────
    subtotal:         { type: Number, required: true },
    shippingCost:     { type: Number, required: true, default: 0 },
    discount:         { type: Number, default: 0 },
    totalAmount:      { type: Number, required: true },
    couponCode:       String,

    // ── Shipping ──────────────────────────────────────────────────────────────
    shippingAddress:  { type: shippingAddressSchema, required: true },
    shippingTier:     { type: String, enum: ["free", "kerala", "india"] },

    // ── Payment ───────────────────────────────────────────────────────────────
    paymentMethod: {
      type:     String,
      required: true,
      enum:     ["razorpay", "cod"],
    },
    paymentStatus: {
      type:    String,
      enum:    ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentResult: paymentResultSchema,

    // ── Order Lifecycle ───────────────────────────────────────────────────────
    orderStatus: {
      type:    String,
      enum:    ["Processing", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"],
      default: "Processing",
    },
    statusHistory: [statusHistorySchema],

    // ── Logistics ─────────────────────────────────────────────────────────────
    trackingNumber:  String,
    courierPartner:  String,
    estimatedDelivery: Date,
    deliveredAt:     Date,

    // ── Emails ────────────────────────────────────────────────────────────────
    confirmationEmailSent: { type: Boolean, default: false },
    shippingEmailSent:     { type: Boolean, default: false },

    // ── Notes ─────────────────────────────────────────────────────────────────
    customerNote:  String,
    adminNote:     String,

    // ── Flags ─────────────────────────────────────────────────────────────────
    isRefunded: { type: Boolean, default: false },
    isCOD:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Pre-save Hook — auto-append status history ───────────────────────────────
orderSchema.pre("save", function (next) {
  if (this.isModified("orderStatus")) {
    this.statusHistory.push({ status: this.orderStatus });
  }
  if (this.paymentMethod === "cod") this.isCOD = true;
  next();
});

// ─── Virtuals ─────────────────────────────────────────────────────────────────
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((n, i) => n + i.quantity, 0);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ "paymentResult.razorpayOrderId": 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
