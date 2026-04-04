/**
 * components/cart/CartDrawerPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The right-side sliding cart drawer featuring:
 *   • Item list with quantity controls
 *   • Remove item button
 *   • Coupon code input
 *   • Pincode / shipping cost section
 *   • Price summary (subtotal, discount, shipping, total)
 *   • Proceed to checkout CTA
 */

import { useState, forwardRef }     from "react";
import { Link }         from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingCart, Trash2, Plus, Minus,
  Tag, MapPin, ArrowRight, ShoppingBag,
} from "lucide-react";

import {
  selectCartItems, selectCartTotals, selectCartCoupon, selectCartIsDrawerOpen,
  removeFromCart, updateQuantity, applyCoupon, removeCoupon, closeCartDrawer,
} from "../../store/slices/cartSlice";
import { CartDrawer } from "../PageTransition";
import { usePincode } from "../../hooks/usePincode";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

// ─── Cart Item Row ─────────────────────────────────────────────────────────────
const CartItem = forwardRef(({ item }, ref) => {
  const dispatch = useDispatch();

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0  }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className="flex gap-3 py-4 border-b border-stone-100 last:border-0"
    >
      {/* Image */}
      <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
        <img
          src={item.image || "/placeholder.jpg"}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://via.placeholder.com/64/2D5A27/ffffff"; }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-stone-800 line-clamp-1">{item.name}</p>
        <p className="text-xs text-stone-400">{item.category}</p>

        <div className="flex items-center justify-between">
          {/* Qty controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
              className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center
                         text-stone-600 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={11} />
            </button>
            <span className="w-6 text-center text-sm font-semibold text-stone-800">
              {item.quantity}
            </span>
            <button
              onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
              disabled={item.quantity >= item.stock}
              className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center
                         text-stone-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus size={11} />
            </button>
          </div>

          {/* Price */}
          <span className="text-sm font-bold" style={{ color: SAGE }}>
            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => dispatch(removeFromCart(item._id))}
        className="self-start p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        aria-label="Remove item"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
});

CartItem.displayName = "CartItem";

// ─── Coupon Section ───────────────────────────────────────────────────────────
function CouponSection() {
  const dispatch = useDispatch();
  const coupon   = useSelector(selectCartCoupon);
  const [input, setInput] = useState("");

  if (coupon && !coupon.error) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200
                      rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-green-600" />
          <div>
            <p className="text-xs font-bold text-green-700">{coupon.code} applied</p>
            <p className="text-[11px] text-green-600">{coupon.label}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(removeCoupon())}
          className="text-green-600 hover:text-red-500 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && dispatch(applyCoupon(input))}
          placeholder="Coupon code"
          className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]"
        />
      </div>
      <button
        onClick={() => dispatch(applyCoupon(input))}
        className="px-3 py-2 rounded-xl text-white text-xs font-medium flex-shrink-0"
        style={{ background: FOREST }}
      >
        Apply
      </button>
    </div>
  );
}

// ─── Pincode Section ──────────────────────────────────────────────────────────
function PincodeSection() {
  const { pincode, resolution, loading, error, handleChange, handleSubmit } = usePincode();

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={pincode}
            onChange={handleChange}
            placeholder="Enter pincode"
            inputMode="numeric"
            maxLength={6}
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          className="px-3 py-2 rounded-xl text-white text-xs font-medium flex-shrink-0
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: FOREST }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : "Check"}
        </button>
      </form>

      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}

      {resolution?.success && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0  }}
          className="flex items-center justify-between bg-green-50 border border-green-200
                     rounded-xl px-3 py-2"
        >
          <div>
            <p className="text-[11px] font-semibold text-green-700">
              {resolution.city}, {resolution.state}
            </p>
            <p className="text-[11px] text-green-600">{resolution.label}</p>
          </div>
          {resolution.cost === 0 && (
            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              FREE
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Price Summary Row ────────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight, strike }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`font-medium ${highlight ? "text-green-600" : "text-stone-800"} ${strike ? "line-through text-stone-400" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function CartDrawerPanel() {
  const dispatch   = useDispatch();
  const isOpen     = useSelector(selectCartIsDrawerOpen);
  const items      = useSelector(selectCartItems);
  const coupon     = useSelector(selectCartCoupon);
  const { subtotal, discount, shippingCost, total } = useSelector(selectCartTotals);

  return (
    <CartDrawer isOpen={isOpen} onClose={() => dispatch(closeCartDrawer())}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} style={{ color: SAGE }} />
          <h2 className="font-bold text-stone-800">
            My Cart
            {items.length > 0 && (
              <span className="ml-2 text-xs font-medium text-stone-400">({items.length} items)</span>
            )}
          </h2>
        </div>
        <button
          onClick={() => dispatch(closeCartDrawer())}
          className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
          aria-label="Close cart"
        >
          <X size={18} />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-stone-300" />
              </div>
              <p className="text-stone-500 font-medium">Your cart is empty</p>
              <p className="text-stone-400 text-sm mt-1">Add some lovely plants!</p>
              <Link
                to="/products"
                onClick={() => dispatch(closeCartDrawer())}
                className="mt-4 px-5 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: SAGE }}
              >
                Browse Plants
              </Link>
            </motion.div>
          ) : (
            items.map((item) => <CartItem key={item._id} item={item} />)
          )}
        </AnimatePresence>
      </div>

      {/* Footer: coupon + pincode + summary */}
      {items.length > 0 && (
        <div className="flex-shrink-0 border-t border-stone-100 px-5 py-4 space-y-4 bg-white">
          {/* Coupon */}
          <CouponSection />

          {/* Pincode */}
          <PincodeSection />

          {/* Price summary */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <SummaryRow label="Subtotal"  value={`₹${subtotal.toLocaleString("en-IN")}`} />
            {discount > 0 && (
              <SummaryRow label={`Discount (${coupon?.code})`}
                value={`−₹${discount.toLocaleString("en-IN")}`}
                highlight />
            )}
            <SummaryRow
              label="Shipping"
              value={shippingCost === 0 ? "FREE 🎉" : `₹${shippingCost}`}
              highlight={shippingCost === 0}
            />
            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="font-bold text-stone-800">Total</span>
              <span className="text-xl font-bold" style={{ color: SAGE }}>
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* CTA */}
          <Link
            to="/checkout"
            onClick={() => dispatch(closeCartDrawer())}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white
                       font-semibold text-sm transition-transform active:scale-98"
            style={{ background: FOREST }}
          >
            Proceed to Checkout
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </CartDrawer>
  );
}
