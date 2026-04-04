import { createSlice, createSelector } from "@reduxjs/toolkit";

// ─── Types ───────────────────────────────────────────────────────────────────
/**
 * CartItem shape:
 * { _id, name, price, image, stock, quantity, category }
 *
 * Shipping shape (set after pincode validation):
 * { pincode, city, state, cost, label }
 */

const COUPONS = {
  LEAFY10: { discount: 10, type: "percent", label: "10% off" },
  GREEN50: { discount: 50,  type: "flat",   label: "₹50 flat off" },
  FREESHIP: { discount: 0,  type: "freeship", label: "Free Shipping" },
};

const initialState = {
  items:        [],          // CartItem[]
  coupon:       null,        // { code, discount, type, label } | null
  shipping:     null,        // { pincode, city, state, cost, label } | null
  isDrawerOpen: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const findIdx = (items, id) => items.findIndex((i) => i._id === id);

const calcSubtotal = (items) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

// ─── Slice ───────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // ── Add / update item ───────────────────────────────────────────────────
    addToCart(state, { payload }) {
      const { item, qty = 1 } = payload;
      const idx = findIdx(state.items, item._id);

      if (idx !== -1) {
        const newQty = state.items[idx].quantity + qty;
        state.items[idx].quantity = Math.min(newQty, item.stock ?? 99);
      } else {
        state.items.push({ ...item, quantity: Math.min(qty, item.stock ?? 99) });
      }
      state.isDrawerOpen = true; // auto-open cart drawer
    },

    // ── Remove item ─────────────────────────────────────────────────────────
    removeFromCart(state, { payload: id }) {
      state.items = state.items.filter((i) => i._id !== id);
    },

    // ── Update quantity ─────────────────────────────────────────────────────
    updateQuantity(state, { payload: { id, quantity } }) {
      const idx = findIdx(state.items, id);
      if (idx === -1) return;
      if (quantity <= 0) {
        state.items.splice(idx, 1);
      } else {
        state.items[idx].quantity = Math.min(quantity, state.items[idx].stock ?? 99);
      }
    },

    // ── Clear cart ──────────────────────────────────────────────────────────
    clearCart(state) {
      state.items    = [];
      state.coupon   = null;
      state.shipping = null;
    },

    // ── Coupon ──────────────────────────────────────────────────────────────
    applyCoupon(state, { payload: code }) {
      const coupon = COUPONS[code.toUpperCase()];
      if (coupon) {
        state.coupon = { code: code.toUpperCase(), ...coupon };
      } else {
        state.coupon = { error: "Invalid coupon code" };
      }
    },
    removeCoupon(state) {
      state.coupon = null;
    },

    // ── Shipping (set by pincode logic) ─────────────────────────────────────
    setShipping(state, { payload }) {
      // payload: { pincode, city, state, cost, label }
      state.shipping = payload;
    },
    clearShipping(state) {
      state.shipping = null;
    },

    // ── Drawer ──────────────────────────────────────────────────────────────
    openCartDrawer(state)  { state.isDrawerOpen = true;  },
    closeCartDrawer(state) { state.isDrawerOpen = false; },
    toggleCartDrawer(state) { state.isDrawerOpen = !state.isDrawerOpen; },
  },
});

export const {
  addToCart, removeFromCart, updateQuantity, clearCart,
  applyCoupon, removeCoupon,
  setShipping, clearShipping,
  openCartDrawer, closeCartDrawer, toggleCartDrawer,
} = cartSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCartItems        = (state) => state.cart.items;
export const selectCartCount        = (state) => state.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartIsDrawerOpen = (state) => state.cart.isDrawerOpen;
export const selectCartShipping     = (state) => state.cart.shipping;
export const selectCartCoupon       = (state) => state.cart.coupon;

export const selectCartTotals = createSelector(
  [
    (state) => state.cart.items,
    (state) => state.cart.coupon,
    (state) => state.cart.shipping,
  ],
  (items, coupon, shipping) => {
    const subtotal  = calcSubtotal(items);
    let shippingCost = shipping?.cost ?? 0;
    let discount = 0;

    if (coupon && !coupon.error) {
      if (coupon.type === "percent")  discount = Math.round(subtotal * coupon.discount / 100);
      if (coupon.type === "flat")     discount = coupon.discount;
      if (coupon.type === "freeship") shippingCost = 0;
    }

    const total = Math.max(0, subtotal - discount + shippingCost);
    return { subtotal, discount, shippingCost, total };
  }
);

export default cartSlice.reducer;
