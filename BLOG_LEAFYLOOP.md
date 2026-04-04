# 🌿 LeafyLoop: Building a Production-Grade E-commerce Platform for Kerala's Plant Lovers

*April 4, 2026 · 12 min read*

---

## Problem Definition

Kerala has a thriving plant culture — from balcony gardens in Trivandrum to nursery farms in Kottayam. But most local plant sellers still rely on WhatsApp catalogs and Instagram DMs. The existing e-commerce solutions? They're either over-engineered (Shopify with international shipping) or under-designed (basic WordPress sites with broken checkout flows).

The real problem isn't just "selling plants online." It's about building a **region-aware commerce platform** that understands:

1. **Hyperlocal Shipping Logic** — Free delivery in Trivandrum, affordable rates across Kerala, and pan-India shipping — all calculated dynamically from pincode data.
2. **Trust Through Transparency** — Indian customers want COD, WhatsApp inquiries, and visible order tracking — not just a "Buy Now" button.
3. **Mobile-First Experience** — 85%+ of Kerala's internet users are on mobile. The UI must be buttery smooth on a ₹10,000 Android phone.

I didn't just want to build another MERN stack tutorial project. I needed a **production-ready e-commerce platform** that could handle real transactions, real inventory, and real customers — with the kind of polish that makes users forget they're on a "local" site.

---

## Approach

I designed LeafyLoop around three core pillars:

### 1. **Regional Intelligence**
The shipping system doesn't just check "India vs International." It understands that Trivandrum = Thiruvananthapuram = Trivandrum District, and that a pincode in Kochi should cost ₹50 to deliver, while one in Delhi costs ₹100.

### 2. **Security-First Payments**
Every price is recalculated server-side. Every Razorpay signature is HMAC-SHA256 verified. Every stock decrement happens inside a MongoDB transaction. Because in e-commerce, trust is earned through technical rigor.

### 3. **Delightful UX**
Framer Motion page transitions. A slide-in cart drawer. A 3-product comparison engine. WhatsApp inquiry buttons on every product card. These aren't "nice-to-haves" — they're what separate a *store* from a *shopping experience*.

---

## Architecture

The system follows a classic MERN separation but with deliberate architectural choices:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Vite + React 18)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Redux Store (persisted)    │  TanStack Query    │  React Router v6     │
│  - cartSlice                │  - useProducts()   │  - Protected routes  │
│  - compareSlice             │  - usePincode()    │  - Admin guard       │
│  - wishlistUserSlice        │  - Auth hooks      │  - Lazy-loaded pages │
├─────────────────────────────────────────────────────────────────────────┤
│  UI Layer: Tailwind CSS + Framer Motion + React Hot Toast               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER (Node.js + Express)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Middleware Stack: Helmet → CORS → JSON → Routes                        │
├─────────────────────────────────────────────────────────────────────────┤
│  /api/auth      │  /api/products    │  /api/orders                      │
│  - JWT rotation │  - CRUD + search  │  - Razorpay integration           │
│  - Google OAuth │  - Cloudinary CDN │  - COD support                    │
│  - Wishlist sync│  - Reviews        │  - Stock management               │
├─────────────────────────────────────────────────────────────────────────┤
│  External Services: MongoDB Atlas │ Cloudinary │ Razorpay │ Firebase    │
└─────────────────────────────────────────────────────────────────────────┘
```

### **The Provider Stack**
The client's root component is a carefully orchestrated provider hierarchy:

```jsx
<Provider store={store}>
  <PersistGate loading={<PageLoader />} persistor={persistor}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  </PersistGate>
</Provider>
```

Each layer serves a purpose:
- **Redux + Persist** — Cart, wishlist, and auth state survive page refreshes
- **TanStack Query** — Server state caching with 2-minute stale time and automatic retries
- **React Router v6** — Lazy-loaded routes with AnimatePresence transitions
- **React Hot Toast** — Non-blocking notifications positioned bottom-right

---

## Technical Deep Dive: The Shipping Engine

The most complex piece of regional logic lives in `client/src/utils/pincodeLogic.js`. Here's how it works:

### **Step 1: Pincode Validation**
```javascript
// Client-side format check before any API call
if (!/^\d{6}$/.test(clean)) {
  return { success: false, error: "Pincode must be exactly 6 digits." };
}
```

### **Step 2: API Lookup with Timeout**
```javascript
const res = await fetch(`${PINCODE_API}/${clean}`, {
  signal: AbortSignal.timeout(8000), // 8-second timeout
});
```

The Indian Postal Pincode API (`api.postalpincode.in`) returns an array where the first element contains `{ Status, PostOffice[] }`. We extract the District name as the "city" and use it for shipping calculation.

### **Step 3: Tiered Shipping Calculation**
```javascript
const TRIVANDRUM_ALIASES = [
  "trivandrum", 
  "thiruvananthapuram", 
  "thiruvananthapuram district",
];

if (TRIVANDRUM_ALIASES.includes(normalCity)) return SHIPPING_TIERS.FREE;   // ₹0
if (normalState === "kerala")                 return SHIPPING_TIERS.KERALA; // ₹50
return SHIPPING_TIERS.INDIA;                                              // ₹100
```

This handles the reality that the same city has multiple spellings, and that "Trivandrum District" is different from just "Trivandrum" in the API response.

### **The Redux Integration**
The cart slice stores the shipping resolution:

```javascript
setShipping(state, { payload }) {
  // payload: { pincode, city, state, cost, label }
  state.shipping = payload;
}
```

And the totals selector combines everything:

```javascript
export const selectCartTotals = createSelector(
  [items, coupon, shipping],
  (items, coupon, shipping) => {
    const subtotal = calcSubtotal(items);
    let shippingCost = shipping?.cost ?? 0;
    let discount = 0;

    if (coupon?.type === "percent")  discount = Math.round(subtotal * coupon.discount / 100);
    if (coupon?.type === "flat")     discount = coupon.discount;
    if (coupon?.type === "freeship") shippingCost = 0;

    return { subtotal, discount, shippingCost, total: subtotal - discount + shippingCost };
  }
);
```

---

## Technical Deep Dive: Payment Security

The Razorpay integration in `server/controllers/razorpayController.js` implements a **three-layer security model**:

### **Layer 1: Server-Side Price Recalculation**
```javascript
// Never trust client-submitted prices
const subtotal = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
const totalAmount = Math.max(0, subtotal - discount + shippingCost);
```

The client sends cart items, but the server fetches current prices from MongoDB and recalculates everything. This prevents price manipulation attacks.

### **Layer 2: MongoDB Transactions**
```javascript
const session = await mongoose.startSession();
session.startTransaction();

// Create Razorpay order
const rzpOrder = await razorpay.orders.create({...});

// Persist pending order in DB
const [order] = await Order.create([{...}], { session });

await session.commitTransaction();
```

If any step fails, the entire transaction rolls back. No orphaned orders, no inconsistent state.

### **Layer 3: HMAC-SHA256 Signature Verification**
```javascript
const expectedSig = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest("hex");

if (expectedSig !== razorpaySignature) {
  return res.status(400).json({ message: "Payment verification failed." });
}
```

This cryptographic verification ensures the payment response actually came from Razorpay's servers — not from a tampered client.

### **Layer 4: Atomic Stock Decrement**
```javascript
const bulkOps = order.items.map((item) => ({
  updateOne: {
    filter: { _id: item.product, stock: { $gte: item.quantity } },
    update: { $inc: { stock: -item.quantity } },
  },
}));
await Product.bulkWrite(bulkOps, { session });
```

The `stock: { $gte: item.quantity }` filter ensures we never decrement below zero. If stock is insufficient, the bulkWrite silently skips that product, and the transaction can be aborted.

---

## The Product Schema: 30+ Fields

The `Product` model in `server/models/Product.js` is designed for both plants and fertilizers:

```javascript
const productSchema = new mongoose.Schema({
  // Identity
  name: { type: String, required: true, maxlength: 120 },
  slug: { type: String, unique: true, lowercase: true },
  
  // Categorization
  category: { 
    type: String, 
    enum: ["Indoor", "Outdoor", "Fertilizer", "Seeds", "Pots & Planters", "Tools"]
  },
  
  // Plant-specific attributes
  height: { type: String, enum: ["Upto 30cm", "30–60cm", "60cm–1m", "1m–2m", "2m+"] },
  sunlight: { type: String, enum: ["Low Light", "Indirect Light", "Bright Indirect", "Full Sun"] },
  water: { type: String, enum: ["Daily", "Every 2–3 Days", "Weekly", "Bi-Weekly", "Monthly"] },
  difficulty: { type: String, enum: ["Beginner", "Intermediate", "Expert"], default: "Beginner" },
  petFriendly: { type: Boolean, default: false },
  airPurifying: { type: Boolean, default: false },
  
  // Fertilizer-specific
  fertilizerType: { type: String, enum: ["Organic", "Chemical", "Bio-Fertilizer"] },
  npkRatio: String,
  weightKg: Number,
  
  // Virtual fields (auto-computed)
  // - primaryImage: returns the primary image or first image
  // - discountPercent: calculates % off from compareAtPrice
  // - inStock: boolean based on stock > 0
});
```

### **Pre-Save Hooks for Auto-Computation**
```javascript
productSchema.pre("save", function (next) {
  // Auto-generate slug from name
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Auto-calculate rating from reviews
  if (this.isModified("reviews")) {
    this.numReviews = this.reviews.length;
    this.rating = +(this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length).toFixed(1);
  }

  next();
});
```

### **Optimized Indexes**
```javascript
productSchema.index({ name: "text", description: "text", tags: "text" }); // Full-text search
productSchema.index({ category: 1, isActive: 1 });                        // Category filtering
productSchema.index({ price: 1 });                                         // Price sorting
productSchema.index({ rating: -1 });                                       // Top-rated products
productSchema.index({ isFeatured: 1, isActive: 1 });                       // Featured products
```

---

## Challenges

**Challenge 1: The "Trivandrum" Problem.** The postal API returns "Thiruvananthapuram" for some pincodes and "Trivandrum" for others. The same city, three spellings. I solved this with an alias array that matches all variants case-insensitively.

**Challenge 2: Cart Persistence Across Sessions.** Users expect their cart to survive browser restarts. Redux Persist with localStorage handles this, but the tricky part was syncing the wishlist to the database when the user logs in — merging the anonymous wishlist with their account wishlist without duplicates.

**Challenge 3: Image Upload Performance.** Cloudinary uploads can be slow on Indian mobile networks. I implemented a client-side image compression step before upload, and used Cloudinary's eager transformation to generate thumbnails asynchronously.

**Challenge 4: Preventing Overselling.** During flash sales, multiple users might try to buy the last item simultaneously. The solution: MongoDB transactions with atomic stock decrement. The `stock: { $gte: quantity }` filter in the bulkWrite ensures we never go negative, and the transaction aborts if any product fails.

---

## Outcome

LeafyLoop is a **full-stack e-commerce platform** with:

### **Key Technical Specifications**
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **State Management**: Redux Toolkit with redux-persist (4 persisted slices)
- **Server State**: TanStack Query with 2-minute stale time
- **Backend**: Node.js + Express with Helmet + CORS + Zod validation
- **Database**: MongoDB Atlas with text search indexes
- **Payments**: Razorpay with HMAC-SHA256 verification + COD fallback
- **Auth**: JWT (15min access + 7-day refresh) + Google OAuth via Firebase
- **Media**: Cloudinary CDN with eager transformations
- **Email**: Nodemailer with HTML templates

### **Feature Highlights**
- **3-product comparison engine** with side-by-side spec tables
- **WhatsApp inquiry integration** on every product card
- **Framer Motion page transitions** with AnimatePresence
- **Slide-in cart drawer** with quantity controls
- **Admin dashboard** with order management and product CRUD
- **Review system** with verified purchase badges
- **Coupon system** with percent, flat, and free-shipping discounts

### **Security Measures**
- Server-side price recalculation (never trust client)
- MongoDB transactions for stock management
- HMAC-SHA256 payment verification
- JWT rotation with refresh tokens
- Zod validation on all API inputs
- Helmet.js for HTTP security headers
- CORS with credentials for cross-origin auth

The biggest lesson? **E-commerce isn't about features — it's about trust.** Every technical decision, from HMAC verification to atomic stock updates, is about ensuring that when a customer clicks "Buy," the system delivers on its promise. That's what separates a hobby project from a production platform.

---

*Built with 🌿 for Kerala's plant lovers. Available at [github.com/Jnanamithran/leafyloop](https://github.com/Jnanamithran/leafyloop)*