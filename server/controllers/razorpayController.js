import Razorpay from "razorpay";
import crypto from "crypto";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { sendOrderConfirmationEmail, sendShippingUpdateEmail } from "../utils/mailer.js";
import mongoose from "mongoose";

// ─── Razorpay Instance ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const paise = (rupees) => Math.round(rupees * 100); // INR → paise

async function validateCartItems(cartItems) {
  const ids      = cartItems.map((i) => i._id);
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).lean();

  const errors  = [];
  const lineItems = [];

  for (const ci of cartItems) {
    const product = products.find((p) => p._id.toString() === ci._id);

    if (!product)         { errors.push(`Product "${ci.name}" is no longer available.`); continue; }
    if (product.stock < ci.quantity) {
      errors.push(`"${product.name}" has only ${product.stock} units in stock.`);
      continue;
    }

    lineItems.push({
      product:  product._id,
      name:     product.name,
      image:    product.images?.[0]?.url ?? "",
      price:    product.price,
      quantity: ci.quantity,
    });
  }

  return { errors, lineItems };
}

// ─── Controller: Create Razorpay Order ───────────────────────────────────────
/**
 * POST /api/orders/create-razorpay-order
 * Body: { cartItems, shippingAddress, shippingCost, couponCode?, discount?, totalAmount }
 *
 * Flow:
 *  1. Validate cart items against DB (price & stock)
 *  2. Create Razorpay order via API
 *  3. Persist a "Pending" order document in MongoDB
 *  4. Return { razorpayOrderId, amount, currency, orderId (mongo) }
 */
export async function createRazorpayOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      cartItems,
      shippingAddress,
      shippingCost   = 0,
      discount       = 0,
      couponCode,
      shippingTier,
    } = req.body;

    // ── 1. Validate items ─────────────────────────────────────────────────────
    const { errors, lineItems } = await validateCartItems(cartItems);
    if (errors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, errors });
    }

    // ── 2. Recalculate totals server-side (never trust client price) ──────────
    const subtotal    = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalAmount = Math.max(0, subtotal - discount + shippingCost);

    // ── 3. Create Razorpay order ──────────────────────────────────────────────
    const rzpOrder = await razorpay.orders.create({
      amount:   paise(totalAmount),
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
      notes:    {
        userId: req.user._id.toString(),
        email:  req.user.email,
      },
    });

    // ── 4. Persist Pending order ──────────────────────────────────────────────
    const [order] = await Order.create(
      [
        {
          user:            req.user._id,
          items:           lineItems,
          subtotal,
          shippingCost,
          discount,
          couponCode,
          totalAmount,
          shippingTier,
          shippingAddress,
          paymentMethod:   "razorpay",
          paymentStatus:   "Pending",
          orderStatus:     "Processing",
          paymentResult: {
            razorpayOrderId: rzpOrder.id,
            gateway:         "razorpay",
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success:         true,
      razorpayOrderId: rzpOrder.id,
      amount:          rzpOrder.amount,   // paise
      currency:        rzpOrder.currency,
      orderId:         order._id,         // Mongo ID
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("[createRazorpayOrder]", err);
    return res.status(500).json({ success: false, message: "Order creation failed. Please try again." });
  } finally {
    session.endSession();
  }
}

// ─── Controller: Verify Razorpay Payment ─────────────────────────────────────
/**
 * POST /api/orders/verify-payment
 * Body: {
 *   orderId,             ← MongoDB order _id
 *   razorpayOrderId,
 *   razorpayPaymentId,
 *   razorpaySignature,
 * }
 *
 * Flow:
 *  1. HMAC-SHA256 signature verification
 *  2. Mark order as Paid → Confirmed
 *  3. Decrement product stock (atomic)
 *  4. Send confirmation email
 */
export async function verifyRazorpayPayment(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // ── 1. Signature verification ─────────────────────────────────────────────
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSig !== razorpaySignature) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    // ── 2. Fetch & update order ───────────────────────────────────────────────
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.paymentStatus === "Paid") {
      await session.abortTransaction();
      return res.status(200).json({ success: true, message: "Already verified.", orderId });
    }

    order.paymentStatus        = "Paid";
    order.orderStatus          = "Confirmed";
    order.paymentResult        = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      gateway: "razorpay",
      paidAt:  new Date(),
    };
    await order.save({ session });

    // ── 3. Decrement stock atomically ──────────────────────────────────────────
    const bulkOps = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps, { session });

    await session.commitTransaction();

    // ── 4. Fire confirmation email (non-blocking) ──────────────────────────────
    sendOrderConfirmationEmail(req.user, order).catch(console.error);

    return res.status(200).json({
      success: true,
      message: "Payment verified! Your order has been confirmed. 🌿",
      orderId,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("[verifyRazorpayPayment]", err);
    return res.status(500).json({ success: false, message: "Verification failed. Contact support." });
  } finally {
    session.endSession();
  }
}

// ─── Controller: COD Order ────────────────────────────────────────────────────
/**
 * POST /api/orders/cod
 * Creates an order with paymentMethod = "cod", paymentStatus = "Pending"
 */
export async function createCODOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      cartItems, shippingAddress,
      shippingCost = 0, discount = 0, couponCode, shippingTier,
    } = req.body;

    const { errors, lineItems } = await validateCartItems(cartItems);
    if (errors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, errors });
    }

    const subtotal    = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalAmount = Math.max(0, subtotal - discount + shippingCost);

    const [order] = await Order.create(
      [
        {
          user:          req.user._id,
          items:         lineItems,
          subtotal,
          shippingCost,
          discount,
          couponCode,
          totalAmount,
          shippingTier,
          shippingAddress,
          paymentMethod: "cod",
          paymentStatus: "Pending",
          orderStatus:   "Processing",
          isCOD:         true,
        },
      ],
      { session }
    );

    // Decrement stock
    await Product.bulkWrite(
      lineItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      })),
      { session }
    );

    await session.commitTransaction();

    sendOrderConfirmationEmail(req.user, order).catch(console.error);

    return res.status(201).json({
      success: true,
      message: "COD order placed successfully! 🌱",
      orderId: order._id,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("[createCODOrder]", err);
    return res.status(500).json({ success: false, message: "COD order failed." });
  } finally {
    session.endSession();
  }
}

// ─── Controller: Admin — Update Order Status ──────────────────────────────────
/**
 * PATCH /api/orders/:id/status
 * Body: { orderStatus, trackingNumber?, courierPartner?, note? }
 */
export async function updateOrderStatus(req, res) {
  try {
    const { orderStatus, trackingNumber, courierPartner, adminNote, note } = req.body;

    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const prevStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierPartner) order.courierPartner = courierPartner;
    if (adminNote)      order.adminNote      = adminNote;

    if (orderStatus === "Delivered") {
      order.deliveredAt    = new Date();
      if (order.paymentMethod === "cod") order.paymentStatus = "Paid";
    }

    await order.save();

    // Send shipping email when transitioning to Shipped
    if (prevStatus !== "Shipped" && orderStatus === "Shipped") {
      sendShippingUpdateEmail(order.user, order).catch(console.error);
      order.shippingEmailSent = true;
      await order.save();
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("[updateOrderStatus]", err);
    return res.status(500).json({ success: false, message: "Status update failed." });
  }
}
