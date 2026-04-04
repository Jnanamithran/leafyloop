# 🌿 LeafyLoop — Premium Plant & Fertilizer E-commerce

> Full-stack MERN application with Kerala-specific shipping, Razorpay payments, and production-grade architecture.

![Stack](https://img.shields.io/badge/Stack-MERN-2D5A27?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-JWT+OAuth-1B3022?style=flat-square)
![Payment](https://img.shields.io/badge/Payment-Razorpay+COD-blue?style=flat-square)

---

## 📁 Project Structure

```
leafyloop/
├── client/                          # Vite + React 18 frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   └── AdminProductForm.jsx   # RHF + Zod product form
│   │   │   ├── cart/
│   │   │   │   └── CartDrawerPanel.jsx    # Framer Motion slide-in cart
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx             # Scroll-aware nav + search
│   │   │   │   └── Footer.jsx
│   │   │   ├── product/
│   │   │   │   ├── ProductCard.jsx        # Full-featured card
│   │   │   │   └── ComparePanel.jsx       # 3-product side-by-side
│   │   │   └── PageTransition.jsx         # All Framer Motion wrappers
│   │   ├── hooks/
│   │   │   ├── index.js                   # useDebounce, useWhatsApp, useAuth, etc.
│   │   │   ├── usePincode.js              # Kerala shipping logic hook
│   │   │   └── useProducts.js             # All TanStack Query hooks
│   │   ├── pages/
│   │   │   ├── HomePage.jsx               # Hero + categories + featured
│   │   │   ├── ProductsPage.jsx           # Filters + search + pagination
│   │   │   ├── ProductDetailPage.jsx      # Gallery + reviews + related
│   │   │   ├── CartPage.jsx               # Full cart view
│   │   │   ├── CheckoutPage.jsx           # 3-step checkout + Razorpay
│   │   │   ├── OrdersPage.jsx             # Order history + status timeline
│   │   │   ├── WishlistPage.jsx
│   │   │   ├── AdminDashboard.jsx         # Orders + CRUD + stats
│   │   │   ├── AuthPages.jsx              # Login + Register + Google OAuth
│   │   │   └── NotFoundPage.jsx
│   │   ├── store/
│   │   │   ├── index.js                   # Redux root + persist configs
│   │   │   └── slices/
│   │   │       ├── cartSlice.js           # Cart + coupons + shipping
│   │   │       ├── compareSlice.js        # 3-product comparison engine
│   │   │       └── wishlistUserSlice.js   # Wishlist + User auth state
│   │   └── utils/
│   │       ├── pincodeLogic.js            # Kerala shipping calculator
│   │       └── firebase.js               # Google Sign-In utility
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                          # Node.js + Express backend
    ├── controllers/
    │   └── razorpayController.js         # Create order + verify payment + COD
    ├── middleware/
    │   ├── authMiddleware.js             # JWT protect + admin guard + refresh
    │   └── validateMiddleware.js         # Zod Express middleware factory
    ├── models/
    │   ├── Product.js                    # 30+ fields + virtuals + indexes
    │   ├── Order.js                      # Full order lifecycle schema
    │   └── User.js                       # Auth + wishlist + address book
    ├── routes/
    │   ├── productRoutes.js              # CRUD + Cloudinary upload
    │   ├── orderRoutes.js                # Razorpay + COD + admin orders
    │   └── authRoutes.js                 # Login + register + Google OAuth
    ├── utils/
    │   ├── cloudinary.js                 # Buffer upload + thumbnail utils
    │   ├── mailer.js                     # HTML email templates
    │   ├── firebaseAdmin.js              # Firebase Admin SDK init
    │   └── seed.js                       # Database seeder
    ├── index.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Razorpay account (test mode)
- Cloudinary account (free tier)
- Firebase project with Google Auth enabled

### 1. Clone & Install

```bash
# Server
cd leafyloop/server
npm install

# Client
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Fill in: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET,
#          RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
#          CLOUDINARY_*, SMTP_*, FIREBASE_SERVICE_ACCOUNT_BASE64

# Client
cp client/.env.example client/.env
# Fill in: VITE_RAZORPAY_KEY_ID, VITE_FIREBASE_*, VITE_WA_NUMBER
```

### 3. Seed the Database

```bash
cd server
node utils/seed.js
# Optional: node utils/seed.js --wipe  (fresh start)
```

Seed creates:
- **Admin:** `admin@leafyloop.in` / `Admin@1234`
- **Customer:** `priya@example.com` / `Priya@1234`
- **12 products** (indoor plants, outdoor, fertilizers, pots)

### 4. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev    # → http://localhost:5000

# Terminal 2 — Frontend
cd client && npm run dev    # → http://localhost:5173
```

---

## 🔑 Key Architecture Decisions

### Shipping Logic (`client/src/utils/pincodeLogic.js`)
```
Trivandrum/Thiruvananthapuram → ₹0   (FREE)
Any other Kerala city          → ₹50
Rest of India                  → ₹100
```
The `resolveShipping(pincode)` function handles:
- 3 spelling variants of Trivandrum
- API timeouts (8s)
- Case-insensitive matching

### Payment Flow (Razorpay)
```
Client → POST /orders/create-razorpay-order (server validates items + price)
       ← { razorpayOrderId, amount, keyId }
Client → Opens Razorpay modal
       → POST /orders/verify-payment (HMAC-SHA256 signature check)
Server → Decrements stock atomically (MongoDB transaction)
       → Sends confirmation email
```

### Security
- **Price recalculation** server-side — client prices are never trusted
- **MongoDB transactions** for stock decrement to prevent overselling
- **HMAC-SHA256** for Razorpay signature verification
- **JWT** access token (15min) + refresh token (7 days) rotation
- **Zod validation** on both frontend forms and backend API routes

### Redux State
| Slice     | Persisted | Contents                              |
|-----------|-----------|---------------------------------------|
| `cart`    | ✅        | items, coupon code, shipping result   |
| `compare` | ✅        | up to 3 product snapshots             |
| `wishlist`| ✅        | wishlist items (synced to DB on login)|
| `user`    | ✅        | profile, access token, refresh token  |

---

## 📡 API Reference

### Auth
| Method | Endpoint              | Access  | Description              |
|--------|-----------------------|---------|--------------------------|
| POST   | `/api/auth/register`  | Public  | Email + password signup  |
| POST   | `/api/auth/login`     | Public  | Email + password login   |
| POST   | `/api/auth/google`    | Public  | Firebase ID token → JWT  |
| POST   | `/api/auth/refresh`   | Public  | Refresh access token     |
| GET    | `/api/auth/me`        | Private | Get current user profile |
| POST   | `/api/auth/logout`    | Private | Invalidate refresh token |
| PUT    | `/api/auth/profile`   | Private | Update profile           |
| POST   | `/api/auth/wishlist/sync` | Private | Sync wishlist to DB  |

### Products
| Method | Endpoint                        | Access  | Description           |
|--------|---------------------------------|---------|-----------------------|
| GET    | `/api/products`                 | Public  | List with filters     |
| GET    | `/api/products/:slug`           | Public  | Single product        |
| POST   | `/api/products/:id/reviews`     | Private | Add review            |
| POST   | `/api/products/admin/upload-images` | Admin | Cloudinary upload |
| POST   | `/api/products/admin`           | Admin   | Create product        |
| PUT    | `/api/products/admin/:id`       | Admin   | Update product        |
| DELETE | `/api/products/admin/:id`       | Admin   | Delete + Cloudinary   |

### Orders
| Method | Endpoint                                | Access  | Description                 |
|--------|-----------------------------------------|---------|-----------------------------|
| POST   | `/api/orders/create-razorpay-order`     | Private | Create Razorpay order       |
| POST   | `/api/orders/verify-payment`            | Private | Verify + confirm payment    |
| POST   | `/api/orders/cod`                       | Private | Place COD order             |
| GET    | `/api/orders/my-orders`                 | Private | User's order history        |
| GET    | `/api/orders/admin/all`                 | Admin   | All orders with filters     |
| PATCH  | `/api/orders/:id/status`                | Admin   | Update status + email       |

---

## 🎨 Design System

| Token        | Value     | Usage                    |
|-------------|-----------|--------------------------|
| Sage Green  | `#2D5A27` | Primary CTAs, prices     |
| Forest Green| `#1B3022` | Headers, footers, buttons|
| Off-White   | `#F9FBF9` | Page backgrounds         |
| Charcoal    | `#333333` | Body text                |
| Font Serif  | Playfair Display | Headings, logo  |
| Font Sans   | DM Sans   | Body copy, UI            |

---

## 🌿 WhatsApp Integration

Every product card has an **"Inquire on WhatsApp"** button that generates:
```
https://wa.me/91XXXXXXXXXX?text=Hi! I am interested in *Monstera Deliciosa* — https://leafyloop.in/products/monstera-deliciosa
Could you please share more details?
```

Set your WhatsApp number in `client/.env`:
```
VITE_WA_NUMBER=919447000000   # 91 prefix + 10-digit number
```

---

## 📦 Deployment

### Backend (Railway / Render / EC2)
```bash
cd server
npm start
# Set all .env variables in the platform's dashboard
```

### Frontend (Vercel / Netlify)
```bash
cd client
npm run build
# Deploy the /dist folder
# Set VITE_* env variables in platform dashboard
```

### MongoDB Atlas
- Whitelist your server's IP address
- Create a database user with read/write access
- Use the connection string in `MONGODB_URI`

---

*Built with 🌿 for Kerala plant lovers by LeafyLoop*
