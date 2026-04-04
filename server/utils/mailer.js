import nodemailer from "nodemailer";

// ─── Transport ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Brand palette ────────────────────────────────────────────────────────────
const PALETTE = {
  sage:      "#2D5A27",
  forest:    "#1B3022",
  offWhite:  "#F9FBF9",
  charcoal:  "#333333",
  muted:     "#6B7280",
};

// ─── Base Layout ──────────────────────────────────────────────────────────────
function baseLayout(title, bodyHtml) {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f3;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f3;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:${PALETTE.forest};padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:2px;">🌿 LeafyLoop</h1>
            <p style="margin:8px 0 0;color:#a8d5a0;font-size:14px;">Premium Plants & Fertilizers</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${PALETTE.offWhite};padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:${PALETTE.muted};font-size:13px;">
              LeafyLoop | Kerala, India<br/>
              Questions? Reply to this email or WhatsApp us at +91-XXXXXXXXXX
            </p>
            <p style="margin:12px 0 0;color:#9ca3af;font-size:11px;">
              © ${new Date().getFullYear()} LeafyLoop. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Order Item Row ───────────────────────────────────────────────────────────
function itemRow(item) {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="60">
              <img src="${item.image}" alt="${item.name}"
                style="width:56px;height:56px;object-fit:cover;border-radius:8px;"/>
            </td>
            <td style="padding-left:16px;">
              <p style="margin:0;font-weight:600;color:${PALETTE.charcoal};">${item.name}</p>
              <p style="margin:4px 0 0;color:${PALETTE.muted};font-size:13px;">Qty: ${item.quantity}</p>
            </td>
            <td align="right" style="font-weight:600;color:${PALETTE.sage};">
              ₹${(item.price * item.quantity).toLocaleString("en-IN")}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// ─── Send Order Confirmation Email ────────────────────────────────────────────
export async function sendOrderConfirmationEmail(user, order) {
  const itemsHtml = order.items.map(itemRow).join("");
  const addr      = order.shippingAddress;

  const body = /* html */ `
    <h2 style="color:${PALETTE.sage};margin:0 0 8px;">Order Confirmed! 🌱</h2>
    <p style="color:${PALETTE.charcoal};margin:0 0 24px;">
      Hi <strong>${user.name}</strong>, thank you for shopping with LeafyLoop!
      Your order <strong>#${order._id}</strong> has been received and is being processed.
    </p>

    <!-- Items Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${itemsHtml}
    </table>

    <!-- Pricing Summary -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:${PALETTE.offWhite};border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr>
        <td style="color:${PALETTE.muted};padding:4px 0;">Subtotal</td>
        <td align="right">₹${order.subtotal.toLocaleString("en-IN")}</td>
      </tr>
      ${order.discount > 0 ? `
      <tr>
        <td style="color:${PALETTE.muted};padding:4px 0;">Discount (${order.couponCode})</td>
        <td align="right" style="color:#16a34a;">−₹${order.discount.toLocaleString("en-IN")}</td>
      </tr>` : ""}
      <tr>
        <td style="color:${PALETTE.muted};padding:4px 0;">Shipping</td>
        <td align="right">
          ${order.shippingCost === 0
            ? '<span style="color:#16a34a;">FREE</span>'
            : `₹${order.shippingCost}`}
        </td>
      </tr>
      <tr>
        <td style="font-weight:700;padding-top:12px;border-top:1px solid #d1d5db;color:${PALETTE.charcoal};">
          Total
        </td>
        <td align="right"
          style="font-weight:700;font-size:18px;padding-top:12px;border-top:1px solid #d1d5db;color:${PALETTE.sage};">
          ₹${order.totalAmount.toLocaleString("en-IN")}
        </td>
      </tr>
    </table>

    <!-- Shipping Address -->
    <div style="background:#f0fdf4;border-left:4px solid ${PALETTE.sage};padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-weight:600;color:${PALETTE.charcoal};">Delivering to:</p>
      <p style="margin:0;color:${PALETTE.muted};line-height:1.6;">
        ${addr.fullName} · ${addr.phone}<br/>
        ${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}<br/>
        ${addr.city}, ${addr.state} — ${addr.pincode}
      </p>
    </div>

    <!-- Payment Method -->
    <p style="color:${PALETTE.muted};font-size:13px;margin:0;">
      Payment Method: <strong>${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</strong>
      &nbsp;|&nbsp; Status: <strong>${order.paymentStatus}</strong>
    </p>`;

  await transporter.sendMail({
    from:    `"LeafyLoop 🌿" <${process.env.SMTP_USER}>`,
    to:      user.email,
    subject: `Order Confirmed #${order._id} — LeafyLoop`,
    html:    baseLayout("Order Confirmation", body),
  });
}

// ─── Send Shipping Update Email ───────────────────────────────────────────────
export async function sendShippingUpdateEmail(user, order) {
  const body = /* html */ `
    <h2 style="color:${PALETTE.sage};margin:0 0 8px;">Your order is on the way! 🚚</h2>
    <p style="color:${PALETTE.charcoal};margin:0 0 24px;">
      Hi <strong>${user.name}</strong>, great news!
      Your LeafyLoop order <strong>#${order._id}</strong> has been shipped.
    </p>

    ${order.trackingNumber ? `
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;color:${PALETTE.muted};font-size:13px;">Tracking Number</p>
      <p style="margin:0;font-size:22px;font-weight:700;color:${PALETTE.sage};">${order.trackingNumber}</p>
      ${order.courierPartner ? `<p style="margin:8px 0 0;color:${PALETTE.muted};font-size:13px;">via ${order.courierPartner}</p>` : ""}
    </div>` : ""}

    <p style="color:${PALETTE.muted};font-size:14px;">
      Your plants are carefully packed and on their way. 
      Estimated delivery: <strong>2–5 business days</strong>.
    </p>

    <p style="color:${PALETTE.muted};font-size:13px;margin-top:24px;">
      Questions? WhatsApp us at +91-XXXXXXXXXX and quote your order ID.
    </p>`;

  await transporter.sendMail({
    from:    `"LeafyLoop 🌿" <${process.env.SMTP_USER}>`,
    to:      user.email,
    subject: `Your LeafyLoop Order #${order._id} Has Shipped! 🌿`,
    html:    baseLayout("Shipping Update", body),
  });
}

export { transporter };
