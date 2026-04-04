/**
 * pages/CartPage.jsx — Desktop full cart view (mobile uses the drawer)
 */
import { Link }               from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence }  from "framer-motion";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Tag, MapPin } from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem } from "../components/PageTransition";
import {
  selectCartItems, selectCartTotals, selectCartCoupon,
  removeFromCart, updateQuantity, applyCoupon, removeCoupon,
} from "../store/slices/cartSlice";
import { usePincode }  from "../hooks/usePincode";
import { useState }    from "react";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

export default function CartPage() {
  const dispatch = useDispatch();
  const items    = useSelector(selectCartItems);
  const coupon   = useSelector(selectCartCoupon);
  const { subtotal, discount, shippingCost, total } = useSelector(selectCartTotals);
  const [couponInput, setCouponInput] = useState("");

  const { pincode, resolution, loading: pcLoading, error: pcError,
          handleChange: pcChange, handleSubmit: pcSubmit } = usePincode();

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="text-7xl mb-5">🛒</div>
          <h2 className="text-2xl font-bold text-stone-700 mb-2">Your cart is empty</h2>
          <p className="text-stone-400 text-sm mb-6">Add some plants to get started!</p>
          <Link to="/products"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
            style={{ background: FOREST }}>
            Browse Plants <ArrowRight size={15} />
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold mb-8" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
            Shopping Cart
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex gap-4"
                  >
                    <Link to={`/products/${item._id}`}>
                      <img src={item.image || "/placeholder.jpg"} alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover bg-stone-100 flex-shrink-0" />
                    </Link>
                    <div className="flex-1 min-w-0 space-y-2">
                      <Link to={`/products/${item._id}`}
                        className="text-sm font-semibold text-stone-800 hover:text-[#2D5A27] block truncate">
                        {item.name}
                      </Link>
                      <p className="text-xs text-stone-400">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                          <button onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
                            className="px-3 py-2 text-stone-600 hover:bg-stone-100">
                            <Minus size={12} />
                          </button>
                          <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                            disabled={item.quantity >= item.stock}
                            className="px-3 py-2 text-stone-600 hover:bg-stone-100 disabled:opacity-40">
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-bold text-sm" style={{ color: SAGE }}>
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => dispatch(removeFromCart(item._id))}
                      className="p-2 h-fit rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              {/* Coupon */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                  <Tag size={15} style={{ color: SAGE }} /> Coupon Code
                </h3>
                {coupon && !coupon.error ? (
                  <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                    <span className="text-sm text-green-700 font-semibold">{coupon.code} — {coupon.label}</span>
                    <button onClick={() => dispatch(removeCoupon())} className="text-green-600 hover:text-red-500 text-xs">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && dispatch(applyCoupon(couponInput))}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl
                                 focus:outline-none focus:border-[#2D5A27]" />
                    <button onClick={() => dispatch(applyCoupon(couponInput))}
                      className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                      style={{ background: FOREST }}>
                      Apply
                    </button>
                  </div>
                )}
                {coupon?.error && <p className="text-xs text-red-500">{coupon.error}</p>}
                <p className="text-xs text-stone-400">Try: LEAFY10 · GREEN50 · FREESHIP</p>
              </div>

              {/* Pincode */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                  <MapPin size={15} style={{ color: SAGE }} /> Delivery Charges
                </h3>
                <form onSubmit={pcSubmit} className="flex gap-2">
                  <input value={pincode} onChange={pcChange} placeholder="Pincode" inputMode="numeric" maxLength={6}
                    className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-[#2D5A27]" />
                  <button type="submit" disabled={pcLoading || pincode.length !== 6}
                    className="px-3 py-2 rounded-xl text-white text-sm disabled:opacity-50"
                    style={{ background: FOREST }}>
                    {pcLoading ? "…" : "Check"}
                  </button>
                </form>
                {pcError && <p className="text-xs text-red-500">{pcError}</p>}
                {resolution?.success && (
                  <p className="text-xs text-green-700 font-medium bg-green-50 rounded-xl px-3 py-2">
                    📍 {resolution.city}, {resolution.state} — {resolution.label}
                  </p>
                )}
              </div>

              {/* Price summary */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-stone-800 text-sm">Order Summary</h3>
                {[
                  { label: "Subtotal",  value: `₹${subtotal.toLocaleString("en-IN")}` },
                  { label: "Shipping",  value: shippingCost === 0 ? "FREE 🎉" : `₹${shippingCost}`, green: shippingCost === 0 },
                  { label: "Discount",  value: discount > 0 ? `−₹${discount.toLocaleString("en-IN")}` : "—", green: discount > 0 },
                ].map(({ label, value, green }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-stone-500">{label}</span>
                    <span className={`font-medium ${green ? "text-green-600" : "text-stone-800"}`}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                  <span className="font-bold text-stone-800">Total</span>
                  <span className="text-2xl font-bold" style={{ color: SAGE }}>
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>

                <Link to="/checkout"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-semibold text-sm"
                  style={{ background: FOREST }}>
                  Proceed to Checkout <ArrowRight size={16} />
                </Link>
                <Link to="/products" className="block text-center text-xs text-stone-400 hover:text-[#2D5A27]">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
