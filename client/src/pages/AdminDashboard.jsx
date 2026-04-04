/**
 * pages/AdminDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin Command Center featuring:
 *   • Stats overview (total orders, revenue, products, pending)
 *   • Orders table with status filter + inline status updater
 *   • Products table with CRUD actions
 *   • Navigation between sections (Orders | Products | Add Product)
 */

import { useState }             from "react";
import { Link }                 from "react-router-dom";
import { useSelector }          from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, TrendingUp, Leaf, Clock, ChevronDown,
  Plus, Edit2, Trash2, CheckCircle, Truck, Eye,
  BarChart2, ShoppingBag, Users, AlertCircle,
} from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem } from "../components/PageTransition";
import { useAdminOrders, useUpdateOrderStatus, useAdminProducts, useDeleteProduct } from "../hooks/useProducts";
import { selectToken } from "../store/slices/wishlistUserSlice";
import AdminProductForm from "../components/admin/AdminProductForm";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Processing:        "bg-amber-100 text-amber-700",
  Confirmed:         "bg-blue-100 text-blue-700",
  Shipped:           "bg-purple-100 text-purple-700",
  "Out for Delivery":"bg-indigo-100 text-indigo-700",
  Delivered:         "bg-green-100 text-green-700",
  Cancelled:         "bg-red-100 text-red-700",
  Returned:          "bg-stone-100 text-stone-600",
};

const PAYMENT_STYLES = {
  Pending:  "bg-amber-100 text-amber-700",
  Paid:     "bg-green-100 text-green-700",
  Failed:   "bg-red-100 text-red-700",
  Refunded: "bg-stone-100 text-stone-600",
};

function StatusBadge({ status, styleMap }) {
  const cls = styleMap[status] || "bg-stone-100 text-stone-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: color || FOREST }}>{value}</p>
          {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: "#f0fdf4" }}>
          <Icon size={20} style={{ color: SAGE }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Order Status Updater ─────────────────────────────────────────────────────
const ORDER_STATUSES = [
  "Processing","Confirmed","Shipped","Out for Delivery","Delivered","Cancelled"
];

function StatusUpdater({ orderId, current }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useUpdateOrderStatus();

  const update = (status) => {
    mutate({ orderId, orderStatus: status });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-[#2D5A27]
                   border border-stone-200 rounded-lg px-2.5 py-1 transition-colors"
      >
        {isPending ? (
          <div className="w-3 h-3 border border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Edit2 size={11} />
            Update
            <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1   }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute right-0 top-full mt-1 z-20 bg-white border border-stone-200
                       rounded-xl shadow-xl py-1 min-w-[160px]"
          >
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => update(s)}
                className={`w-full text-left px-4 py-2 text-xs transition-colors
                  ${s === current ? "font-bold text-[#2D5A27]" : "text-stone-700 hover:bg-stone-50"}`}
              >
                {s === current && <CheckCircle size={10} className="inline mr-1.5 text-[#2D5A27]" />}
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────
function OrdersSection() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useAdminOrders(statusFilter ? { status: statusFilter } : {});

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {["", ...ORDER_STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? "text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            style={statusFilter === s ? { background: SAGE } : {}}
          >
            {s || "All Orders"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["Order ID","Customer","Date","Amount","Payment","Order Status","Action"]
                  .map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-stone-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-stone-100 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-400 text-sm">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <motion.tr
                    key={order._id}
                    layout
                    className="border-b border-stone-50 hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-stone-500">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-stone-800">{order.user?.name}</p>
                      <p className="text-xs text-stone-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day:"2-digit", month:"short", year:"2-digit"
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: SAGE }}>
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.paymentStatus} styleMap={PAYMENT_STYLES} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.orderStatus} styleMap={STATUS_STYLES} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusUpdater orderId={order._id} current={order.orderStatus} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.total > 20 && (
          <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between">
            <p className="text-xs text-stone-400">{data.total} total orders</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────
function ProductsSection({ onAddNew, onEdit }) {
  const { data, isLoading }  = useAdminProducts();
  const { mutate: deleteProduct } = useDeleteProduct();

  const products = data?.products ?? [];

  const handleDelete = (product) => {
    if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      deleteProduct(product._id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: FOREST }}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["Product","Category","Price","Stock","Status","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-stone-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-stone-100 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.map((p) => (
                <motion.tr key={p._id} layout
                  className="border-b border-stone-50 hover:bg-stone-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0]?.url || "/placeholder.jpg"}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-semibold text-stone-800 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-stone-400">{p.sku || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: SAGE }}>
                      ₹{p.price.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${p.stock === 0 ? "text-red-500" : "text-stone-700"}`}>
                      {p.stock === 0 ? "Out of Stock" : p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/products/${p.slug || p._id}`} target="_blank"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-[#2D5A27] hover:bg-[#f0fdf4] transition-colors">
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const token  = useSelector(selectToken);
  const [activeTab,     setActiveTab]     = useState("orders");
  const [editingProduct, setEditingProduct] = useState(null); // null | product
  const [showForm,      setShowForm]      = useState(false);

  const { data: ordersData } = useAdminOrders({});
  const { data: productsData } = useAdminProducts();

  const orders   = ordersData?.orders  ?? [];
  const products = productsData?.products ?? [];

  const totalRevenue  = orders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((s, o) => s + o.totalAmount, 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === "Processing").length;

  const TABS = [
    { id: "orders",   label: "Orders",   icon: ShoppingBag },
    { id: "products", label: "Products", icon: Leaf        },
  ];

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
    setActiveTab("form");
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    setActiveTab("products");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50">
        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-5">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
              Admin Command Center
            </h1>
            <p className="text-sm text-stone-400 mt-1">LeafyLoop Management Dashboard</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <StatCard icon={ShoppingBag} label="Total Orders"
                value={ordersData?.total ?? "—"} sub="All time" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={TrendingUp} label="Revenue"
                value={`₹${(totalRevenue/1000).toFixed(1)}K`} sub="From paid orders" color={SAGE} />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={Leaf} label="Products"
                value={productsData?.pagination?.total ?? products.length} sub="Active listings" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={Clock} label="Pending"
                value={pendingOrders} sub="Awaiting processing" color="#d97706" />
            </StaggerItem>
          </StaggerContainer>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-stone-200">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setShowForm(false); setEditingProduct(null); }}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === id ? "text-[#2D5A27]" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <Icon size={15} />
                {label}
                {activeTab === id && (
                  <motion.div
                    layoutId="admin-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: SAGE }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Tab Content ────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === "orders" && (
              <motion.div key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{ opacity: 0, y: -5 }}>
                <OrdersSection />
              </motion.div>
            )}

            {activeTab === "products" && !showForm && (
              <motion.div key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{ opacity: 0, y: -5 }}>
                <ProductsSection
                  onAddNew={() => { setEditingProduct(null); setShowForm(true); setActiveTab("form"); }}
                  onEdit={handleEditProduct}
                />
              </motion.div>
            )}

            {(activeTab === "form" || showForm) && (
              <motion.div key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{ opacity: 0, y: -5 }}>
                <div className="max-w-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-stone-800">
                      {editingProduct ? `Edit: ${editingProduct.name}` : "Add New Product"}
                    </h2>
                    <button
                      onClick={() => { setShowForm(false); setActiveTab("products"); }}
                      className="text-sm text-stone-400 hover:text-stone-700"
                    >
                      ← Back to Products
                    </button>
                  </div>
                  <AdminProductForm
                    product={editingProduct}
                    token={token}
                    onSuccess={handleFormSuccess}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
