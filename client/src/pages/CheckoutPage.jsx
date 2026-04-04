/**
 * pages/CheckoutPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-step checkout:
 *   Step 1 → Shipping Address (RHF + Zod)
 *   Step 2 → Payment Method selection (Razorpay / COD)
 *   Step 3 → Order summary + confirm
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate }           from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useForm }               from "react-hook-form";
import { zodResolver }           from "@hookform/resolvers/zod";
import { z }                     from "zod";
import { motion, AnimatePresence } from "framer-motion";
import toast                     from "react-hot-toast";
import {
  MapPin, CreditCard, ShieldCheck, Truck,
  ChevronRight, CheckCircle, Smartphone,
} from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem } from "../components/PageTransition";
import {
  selectCartItems, selectCartTotals, selectCartShipping, clearCart,
} from "../store/slices/cartSlice";
import { selectToken, selectRefreshToken, selectUser, refreshAccessToken } from "../store/slices/wishlistUserSlice";
import { usePincode } from "../hooks/usePincode";
import { refreshUserToken } from "../hooks";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";
const API    = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Zod Schema for Address ───────────────────────────────────────────────────
const addressSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  phone:    z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1:    z.string().min(5, "Address line 1 required"),
  line2:    z.string().optional(),
  city:     z.string().min(2, "City required"),
  state:    z.string().min(2, "State required"),
  pincode:  z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ["Address", "Payment", "Review"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: i <= current ? SAGE : "#e5e7eb",
                color:      i <= current ? "white" : "#9ca3af",
              }}
            >
              {i < current ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i <= current ? "text-[#2D5A27]" : "text-stone-400"}`}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-3 transition-colors"
                 style={{ background: i < current ? SAGE : "#e5e7eb" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Address Step ─────────────────────────────────────────────────────────────
function AddressStep({ onNext, savedAddress }) {
  const user = useSelector(selectUser);
  const { pincode: pcValue, resolution, loading: pcLoading, error: pcError, handleChange: pcChange, handleSubmit: pcSubmit } = usePincode();

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: savedAddress || {
      fullName: user?.name || "",
      phone:    user?.phone || "",
      line1: "", line2: "", city: "", state: "", pincode: "",
    },
  });

  // Auto-fill city/state from pincode resolution - use effect to avoid infinite loops
  useEffect(() => {
    if (resolution?.success && resolution?.city && resolution?.state) {
      console.log("Auto-filling pincode result:", resolution);
      setValue("city",    resolution.city,  { shouldValidate: true });
      setValue("state",   resolution.state, { shouldValidate: true });
      if (resolution?.pincode) {
        setValue("pincode", resolution.pincode, { shouldValidate: true });
      }
    }
  }, [resolution?.success, resolution?.city, resolution?.state, resolution?.pincode, setValue]);

  // Auto-fill user data if not already filled
  useEffect(() => {
    if (user && !watch("fullName")) {
      setValue("fullName", user.name || "");
    }
    if (user && !watch("phone")) {
      setValue("phone", user.phone || "");
    }
  }, [user, setValue, watch]);

  const handleFormSubmit = useCallback((data) => {
    try {
      console.log("Address form submitted:", data);
      if (!data.fullName || !data.phone || !data.line1 || !data.pincode) {
        throw new Error("Missing required fields");
      }
      onNext(data);
    } catch (err) {
      console.error("Address form submission error:", err);
      toast.error(err.message || "Please fill all required fields");
    }
  }, [onNext]);

  const inputCls = "w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 " +
    "placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-600 block mb-1">Full Name *</label>
          <input {...register("fullName")} placeholder="As on bank account" className={inputCls} />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-600 block mb-1">Mobile Number *</label>
          <input {...register("phone")} placeholder="10-digit mobile" inputMode="numeric" className={inputCls} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-600 block mb-1">Address Line 1 *</label>
        <input {...register("line1")} placeholder="House/Flat number, Street" className={inputCls} />
        {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1.message}</p>}
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-600 block mb-1">Address Line 2</label>
        <input {...register("line2")} placeholder="Landmark, Colony (optional)" className={inputCls} />
      </div>

      {/* Pincode auto-fill */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-stone-600 block mb-1">Pincode *</label>
          <div className="flex gap-2">
            <input
              value={pcValue}
              onChange={pcChange}
              onBlur={pcSubmit}
              placeholder="6 digits"
              inputMode="numeric"
              maxLength={6}
              className={inputCls}
            />
          </div>
          {pcError && <p className="text-xs text-red-500 mt-1">{pcError}</p>}
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-600 block mb-1">City</label>
          <input {...register("city")} placeholder="Auto-filled" className={inputCls} readOnly={!!resolution?.city} />
          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-600 block mb-1">State</label>
          <input {...register("state")} placeholder="Auto-filled" className={inputCls} readOnly={!!resolution?.state} />
          {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
        </div>
      </div>

      {resolution?.success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle size={16} className="text-green-600" />
          <p className="text-sm text-green-700 font-medium">{resolution.label}</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold"
        style={{ background: FOREST }}
      >
        Continue to Payment <ChevronRight size={18} />
      </button>
    </form>
  );
}

// ─── Payment Step ─────────────────────────────────────────────────────────────
function PaymentStep({ onNext, onBack }) {
  const [method, setMethod] = useState("razorpay");

  return (
    <div className="space-y-4">
      {/* Razorpay */}
      <div
        onClick={() => setMethod("razorpay")}
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
          method === "razorpay" ? "border-[#2D5A27] bg-[#f0fdf4]" : "border-stone-200 hover:border-stone-300"
        }`}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          method === "razorpay" ? "border-[#2D5A27]" : "border-stone-300"
        }`}>
          {method === "razorpay" && <div className="w-2.5 h-2.5 rounded-full bg-[#2D5A27]" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CreditCard size={18} style={{ color: SAGE }} />
            <span className="font-semibold text-stone-800 text-sm">Pay Online</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">Credit/Debit Card, UPI, Net Banking via Razorpay</p>
        </div>
        <div className="flex gap-1">
          {["💳","📱","🏦"].map((e) => (
            <span key={e} className="text-base">{e}</span>
          ))}
        </div>
      </div>

      {/* COD */}
      <div
        onClick={() => setMethod("cod")}
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
          method === "cod" ? "border-[#2D5A27] bg-[#f0fdf4]" : "border-stone-200 hover:border-stone-300"
        }`}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          method === "cod" ? "border-[#2D5A27]" : "border-stone-300"
        }`}>
          {method === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-[#2D5A27]" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Truck size={18} style={{ color: SAGE }} />
            <span className="font-semibold text-stone-800 text-sm">Cash on Delivery</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">Pay in cash when your order arrives</p>
        </div>
        <span className="text-base">💵</span>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <ShieldCheck size={14} className="text-green-500" />
          100% Secure
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Smartphone size={14} className="text-green-500" />
          UPI Supported
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-700 text-sm font-medium"
        >
          ← Back
        </button>
        <button
          onClick={() => onNext(method)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ background: FOREST }}
        >
          Review Order <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Review + Confirm Step ────────────────────────────────────────────────────
function ReviewStep({ address, paymentMethod, onBack, onConfirm, loading }) {
  const items    = useSelector(selectCartItems);
  const shipping = useSelector(selectCartShipping);
  const { subtotal, discount, shippingCost, total } = useSelector(selectCartTotals);

  return (
    <div className="space-y-5">
      {/* Items */}
      <div className="bg-stone-50 rounded-2xl p-4 space-y-3">
        {items.map((item) => (
          <div key={item._id} className="flex gap-3 items-center">
            <img src={item.image || "/placeholder.jpg"} alt={item.name}
              className="w-12 h-12 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
              <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-bold" style={{ color: SAGE }}>
              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      {/* Address summary */}
      <div className="bg-stone-50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} style={{ color: SAGE }} />
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Delivering To</span>
        </div>
        <p className="text-sm font-medium text-stone-800">{address.fullName} · {address.phone}</p>
        <p className="text-sm text-stone-500">
          {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} — {address.pincode}
        </p>
        {shipping && (
          <p className="text-xs mt-1 font-medium" style={{ color: SAGE }}>{shipping.label}</p>
        )}
      </div>

      {/* Price breakdown */}
      <div className="space-y-2">
        {[
          { label: "Subtotal",  value: `₹${subtotal.toLocaleString("en-IN")}` },
          { label: "Discount",  value: discount > 0 ? `−₹${discount.toLocaleString("en-IN")}` : "—", green: discount > 0 },
          { label: "Shipping",  value: shippingCost === 0 ? "FREE 🎉" : `₹${shippingCost}`, green: shippingCost === 0 },
          { label: "Payment",   value: paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay (Online)" },
        ].map(({ label, value, green }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-stone-500">{label}</span>
            <span className={`font-medium ${green ? "text-green-600" : "text-stone-800"}`}>{value}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-3 border-t border-stone-200">
          <span className="font-bold text-stone-800">Total</span>
          <span className="text-2xl font-bold" style={{ color: SAGE }}>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-700 text-sm font-medium"
        >
          ← Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold text-sm
                     disabled:opacity-60"
          style={{ background: FOREST }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {paymentMethod === "razorpay" ? "Pay Now 🔒" : "Place COD Order 🌿"}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const token     = useSelector(selectToken);
  const refreshToken = useSelector(selectRefreshToken);
  const items     = useSelector(selectCartItems);
  const shipping  = useSelector(selectCartShipping);
  const { subtotal, discount, shippingCost, total } = useSelector(selectCartTotals);
  const coupon    = useSelector((s) => s.cart.coupon);

  const [step,          setStep]          = useState(0);
  const [address,       setAddress]       = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [loading,       setLoading]       = useState(false);

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-stone-500 text-lg">Your cart is empty.</p>
            <button onClick={() => navigate("/products")}
              className="mt-4 px-5 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: SAGE }}>
              Browse Plants
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ── Razorpay checkout flow ────────────────────────────────────────────────
  const handleRazorpay = async (rzpKeyId, rzpOrderId, mongoOrderId, amount) => {
    return new Promise((resolve, reject) => {
      const options = {
        key:          rzpKeyId,
        amount,
        currency:     "INR",
        name:         "LeafyLoop",
        description:  "Plant & Fertilizer Order",
        image:        "/logo.png",
        order_id:     rzpOrderId,
        prefill: {
          name:  address.fullName,
          email: "",
          contact: address.phone,
        },
        theme: { color: FOREST },
        handler: async (response) => {
          try {
            // Verify on server
            const verifyRes = await fetch(`${API}/orders/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                orderId:           mongoOrderId,
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const data = await verifyRes.json();
            if (data.success) resolve(data);
            else reject(new Error(data.message || "Payment verification failed"));
          } catch (err) {
            reject(new Error(`Verification error: ${err.message}`));
          }
        },
        modal: { 
          ondismiss: () => reject(new Error("Payment cancelled by user"))
        },
      };
      
      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        reject(new Error(`Failed to open payment window: ${err.message}`));
      }
    });
  };

  const handleConfirm = async () => {
    // Validate that address is set
    if (!address || !address.fullName || !address.phone) {
      toast.error("Please complete the address form");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing your order…");

    let currentToken = token;
    let currentRefreshToken = refreshToken;

    try {
      const body = {
        cartItems:       items.map(({ _id, name, price, quantity, stock, images }) => ({
                           _id, name, price, quantity, stock,
                           image: images?.[0]?.url || "",
                         })),
        shippingAddress: address,
        shippingCost,
        discount,
        couponCode:      coupon?.code,
        shippingTier:    shipping?.key,
        totalAmount:     total,
      };

      if (paymentMethod === "cod") {
        console.log("[COD] Sending request body:", body);
        
        let res  = await fetch(`${API}/orders/cod`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
          body:    JSON.stringify(body),
        });
        
        // If 401, try to refresh token and retry
        if (res.status === 401 && currentRefreshToken) {
          console.log("Token expired, attempting refresh...");
          try {
            const { token: newToken, refreshToken: newRefreshToken } = await refreshUserToken(currentRefreshToken);
            currentToken = newToken;
            currentRefreshToken = newRefreshToken;
            dispatch(refreshAccessToken(newToken));
            
            console.log("Retrying COD order with new token...");
            res = await fetch(`${API}/orders/cod`, {
              method:  "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
              body:    JSON.stringify(body),
            });
          } catch (refreshErr) {
            throw new Error(`Session expired. Please log in again. (${refreshErr.message})`);
          }
        }
        
        if (!res.ok) {
          const error = await res.json();
          console.error("[COD Error Response]", error);
          const errorMsg = error.errors?.join(", ") || error.message || `Server error: ${res.status}`;
          throw new Error(errorMsg);
        }
        
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to place order");

        dispatch(clearCart());
        toast.success("Order placed! 🌿 Check your email for confirmation.", { id: toastId });
        navigate(`/orders`);
      } else {
        // Razorpay: create order first
        console.log("[Razorpay] Sending request body:", body);
        
        let res  = await fetch(`${API}/orders/create-razorpay-order`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
          body:    JSON.stringify(body),
        });
        
        // If 401, try to refresh token and retry
        if (res.status === 401 && currentRefreshToken) {
          console.log("Token expired, attempting refresh...");
          try {
            const { token: newToken, refreshToken: newRefreshToken } = await refreshUserToken(currentRefreshToken);
            currentToken = newToken;
            currentRefreshToken = newRefreshToken;
            dispatch(refreshAccessToken(newToken));
            
            console.log("Retrying Razorpay order with new token...");
            res = await fetch(`${API}/orders/create-razorpay-order`, {
              method:  "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
              body:    JSON.stringify(body),
            });
          } catch (refreshErr) {
            throw new Error(`Session expired. Please log in again. (${refreshErr.message})`);
          }
        }
        
        if (!res.ok) {
          const error = await res.json();
          console.error("[Razorpay Error Response]", error);
          const errorMsg = error.errors?.join(", ") || error.message || `Server error: ${res.status}`;
          throw new Error(errorMsg);
        }
        
        const data = await res.json();
        if (!data.success) throw new Error(data.errors?.[0] || data.message || "Failed to create payment order");

        // Check if Razorpay is loaded
        if (typeof window.Razorpay === "undefined") {
          throw new Error("Payment gateway not loaded. Please refresh and try again.");
        }

        toast.dismiss(toastId);
        await handleRazorpay(data.keyId, data.razorpayOrderId, data.orderId, data.amount);

        dispatch(clearCart());
        toast.success("Payment successful! 🌱 Your order is confirmed.", { duration: 5000 });
        navigate("/orders");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Something went wrong. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
              Checkout
            </h1>
          </div>

          <StepIndicator current={step} />

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0  }}
                  exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-base font-bold text-stone-800 mb-5 flex items-center gap-2">
                    <MapPin size={18} style={{ color: SAGE }} /> Shipping Address
                  </h2>
                  <AddressStep
                    onNext={(addr) => { 
                      console.log("Address step completed:", addr);
                      setAddress(addr); 
                      setStep(1); 
                    }}
                    savedAddress={address}
                  />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0  }}
                  exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-base font-bold text-stone-800 mb-5 flex items-center gap-2">
                    <CreditCard size={18} style={{ color: SAGE }} /> Payment Method
                  </h2>
                  <PaymentStep
                    onNext={(m) => { 
                      console.log("Payment method selected:", m);
                      setPaymentMethod(m); 
                      setStep(2); 
                    }}
                    onBack={() => setStep(0)}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0  }}
                  exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-base font-bold text-stone-800 mb-5 flex items-center gap-2">
                    <CheckCircle size={18} style={{ color: SAGE }} /> Review Order
                  </h2>
                  <ReviewStep
                    address={address}
                    paymentMethod={paymentMethod}
                    onBack={() => setStep(1)}
                    onConfirm={handleConfirm}
                    loading={loading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
