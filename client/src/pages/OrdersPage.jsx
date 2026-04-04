/**
 * pages/OrdersPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * User's order history with status timeline, order details expandable panel,
 * and re-order functionality.
 */

import { useState }          from "react";
import { Link }              from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ChevronDown, ChevronUp, Truck, CheckCircle,
  Clock, XCircle, ShoppingBag, ArrowRight, RefreshCw,
} from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem } from "../components/PageTransition";
import { useMyOrders }   from "../hooks/useProducts";
import { useAddToCart }  from "../hooks";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Processing:          { icon: Clock,        color: "#f59e0b", bg: "#fef3c7", label: "Processing"         },
  Confirmed:           { icon: CheckCircle,  color: "#3b82f6", bg: "#dbeafe", label: "Confirmed"          },
  Shipped:             { icon: Truck,        color: "#8b5cf6", bg: "#ede9fe", label: "Shipped"            },
  "Out for Delivery":  { icon: Truck,        color: "#6366f1", bg: "#e0e7ff", label: "Out for Delivery"   },
  Delivered:           { icon: CheckCircle,  color: "#22c55e", bg: "#dcfce7", label: "Delivered"          },
  Cancelled:           { icon: XCircle,      color: "#ef4444", bg: "#fee2e2", label: "Cancelled"          },
  Returned:            { icon: RefreshCw,    color: "#6b7280", bg: "#f3f4f6", label: "Returned"           },
};

// ─── Status Timeline ──────────────────────────────────────────────────────────
const TIMELINE_STEPS = ["Processing", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

function StatusTimeline({ current }) {
  const currentIdx = TIMELINE_STEPS.indexOf(current);
  if (current === "Cancelled" || current === "Returned") return null;

  return (
    <div className="flex items-center mt-4 overflow-x-auto pb-2">
      {TIMELINE_STEPS.map((step, i) => {
        const done   = i <  currentIdx;
        const active = i === currentIdx;
        const cfg    = STATUS_CONFIG[step];

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none min-w-[60px]">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: done || active ? cfg.color : "#e5e7eb",
                  color: done || active ? "white" : "#9ca3af",
                }}
              >
                <cfg.icon size={14} />
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? "text-stone-800" : "text-stone-400"}`}>
                {step}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mt-[-1rem] transition-colors"
                style={{ background: done ? cfg.color : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const { addItem } = useAddToCart();

  const statusCfg  = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG.Processing;
  const StatusIcon = statusCfg.icon;

  const reOrder = () => {
    order.items.forEach((item) => {
      addItem({
        _id:      item.product,
        name:     item.name,
        price:    item.price,
        image:    item.image,
        stock:    99,
        category: "Plant",
      });
    });
  };

  return (
    <motion.div layout className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
      {/* ── Order Header ─────────────────────────────────────────────────── */}
      <div className="p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
               style={{ background: statusCfg.bg }}>
            <StatusIcon size={18} style={{ color: statusCfg.color }} />
          </div>
          <div>
            <p className="text-xs text-stone-400">Order #{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-sm font-semibold text-stone-800">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {order.orderStatus}
          </span>
          <span className="text-base font-bold" style={{ color: SAGE }}>
            ₹{order.totalAmount.toLocaleString("en-IN")}
          </span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Mini item thumbnails (always visible) */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <div className="flex -space-x-2">
          {order.items.slice(0, 4).map((item, i) => (
            <div key={i}
              className="w-9 h-9 rounded-xl border-2 border-white overflow-hidden bg-stone-100"
              style={{ zIndex: 10 - i }}>
              <img src={item.image || "/placeholder.jpg"} alt={item.name}
                className="w-full h-full object-cover" />
            </div>
          ))}
          {order.items.length > 4 && (
            <div className="w-9 h-9 rounded-xl border-2 border-white bg-stone-100 flex items-center
                            justify-center text-[10px] font-bold text-stone-500">
              +{order.items.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-stone-400 ml-1">
          {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
          {order.paymentMethod === "cod" && " · COD"}
        </span>
      </div>

      {/* Status timeline */}
      <div className="px-5 pb-4">
        <StatusTimeline current={order.orderStatus} />
      </div>

      {/* ── Expanded details ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-stone-100"
          >
            <div className="p-5 space-y-5">
              {/* Items detail */}
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <img src={item.image || "/placeholder.jpg"} alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover bg-stone-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                      <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: SAGE }}>
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="bg-stone-50 rounded-2xl p-4 space-y-1.5">
                {[
                  { label: "Subtotal",  value: `₹${order.subtotal.toLocaleString("en-IN")}` },
                  { label: "Shipping",  value: order.shippingCost === 0 ? "FREE 🎉" : `₹${order.shippingCost}` },
                  { label: "Discount",  value: order.discount > 0 ? `−₹${order.discount.toLocaleString("en-IN")}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-stone-400">{label}</span>
                    <span className="text-stone-700 font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="font-bold text-stone-800 text-sm">Total</span>
                  <span className="font-bold text-base" style={{ color: SAGE }}>
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Delivery address */}
              <div className="text-sm text-stone-500">
                <p className="font-semibold text-stone-700 mb-1">Delivered to:</p>
                <p>{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
                <p>
                  {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},
                  {" "}{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
              </div>

              {/* Tracking */}
              {order.trackingNumber && (
                <div className="flex items-center gap-2 text-sm text-stone-600 bg-purple-50 rounded-xl px-3 py-2">
                  <Truck size={14} className="text-purple-600" />
                  <span>Tracking: <strong>{order.trackingNumber}</strong>
                    {order.courierPartner && ` via ${order.courierPartner}`}
                  </span>
                </div>
              )}

              {/* Re-order */}
              {order.orderStatus === "Delivered" && (
                <button
                  onClick={reOrder}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: FOREST }}
                >
                  <RefreshCw size={14} /> Reorder
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { data, isLoading } = useMyOrders();
  const orders = data?.orders ?? [];

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                 style={{ background: "#f0fdf4" }}>
              <Package size={20} style={{ color: SAGE }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
                My Orders
              </h1>
              <p className="text-sm text-stone-400">{orders.length} orders placed</p>
            </div>
          </div>

          {/* Orders list */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-stone-100 p-5 animate-pulse">
                  <div className="flex gap-3 items-center mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-stone-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-stone-200 rounded w-1/4" />
                      <div className="h-4 bg-stone-200 rounded w-1/3" />
                    </div>
                    <div className="h-6 bg-stone-200 rounded w-20" />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="w-9 h-9 rounded-xl bg-stone-200" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24"
            >
              <div className="text-7xl mb-6">📦</div>
              <h2 className="text-xl font-bold text-stone-700 mb-2">No orders yet</h2>
              <p className="text-stone-400 text-sm mb-6">Your plant journey starts here!</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: FOREST }}
              >
                Shop Plants <ArrowRight size={15} />
              </Link>
            </motion.div>
          ) : (
            <StaggerContainer className="space-y-4">
              {orders.map((order) => (
                <StaggerItem key={order._id}>
                  <OrderCard order={order} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
