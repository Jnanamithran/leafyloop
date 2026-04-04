/**
 * client/src/App.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root application component: provider stack + React Router v6 routing.
 * All routes use the AnimatePresence page transition system.
 */

import { lazy, Suspense }    from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Provider }          from "react-redux";
import { PersistGate }       from "redux-persist/integration/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster }           from "react-hot-toast";
import { AnimatePresence }   from "framer-motion";
import { useSelector }       from "react-redux";

import { store, persistor }  from "./store";
import { selectIsLoggedIn, selectIsAdmin } from "./store/slices/wishlistUserSlice";
import Navbar            from "./components/layout/Navbar";
import CartDrawerPanel   from "./components/cart/CartDrawerPanel";
import ComparePanel      from "./components/product/ComparePanel";

// ─── Code-split pages ────────────────────────────────────────────────────────
const HomePage       = lazy(() => import("./pages/HomePage"));
const ProductsPage   = lazy(() => import("./pages/ProductsPage"));
const ProductDetail  = lazy(() => import("./pages/ProductDetailPage"));
const CartPage       = lazy(() => import("./pages/CartPage"));
const CheckoutPage   = lazy(() => import("./pages/CheckoutPage"));
const WishlistPage   = lazy(() => import("./pages/WishlistPage"));
const OrdersPage     = lazy(() => import("./pages/OrdersPage"));
const LoginPage      = lazy(() => import("./pages/LoginPage"));
const RegisterPage   = lazy(() => import("./pages/RegisterPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFoundPage   = lazy(() => import("./pages/NotFoundPage"));

// ─── TanStack Query Client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        2 * 60 * 1000,  // 2 min
      gcTime:           5 * 60 * 1000,  // 5 min
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        if (err?.message?.includes("401")) return false; // don't retry auth errors
        return count < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAdmin    = useSelector(selectIsAdmin);

  if (!isLoggedIn)           return <Navigate to="/login"    replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/"         replace />;

  return children;
}

// ─── Page Loading Fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#2D5A27]/20 border-t-[#2D5A27] animate-spin" />
        <p className="text-sm text-stone-400">Loading…</p>
      </div>
    </div>
  );
}

// ─── App Inner (uses hooks so must be inside Provider) ────────────────────────
function AppInner() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F9FBF9] font-sans text-[#333333]">
      <Navbar />

      {/* Animated route transitions */}
      <AnimatePresence mode="wait" initial={false}>
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            {/* ── Public ─────────────────────────────────────────────────── */}
            <Route path="/"           element={<HomePage />}      />
            <Route path="/products"   element={<ProductsPage />}  />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/login"      element={<LoginPage />}     />
            <Route path="/register"   element={<RegisterPage />}  />
            <Route path="/wishlist"   element={<WishlistPage />}  />

            {/* ── Authenticated ──────────────────────────────────────────── */}
            <Route path="/cart"     element={
              <ProtectedRoute><CartPage /></ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute><CheckoutPage /></ProtectedRoute>
            } />
            <Route path="/orders"   element={
              <ProtectedRoute><OrdersPage /></ProtectedRoute>
            } />

            {/* ── Admin ──────────────────────────────────────────────────── */}
            <Route path="/admin"    element={
              <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/*"  element={
              <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
            } />

            {/* ── 404 ────────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {/* Global overlays — always rendered */}
      <CartDrawerPanel />
      <ComparePanel />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1B3022",
            color:      "#F9FBF9",
            fontSize:   "13px",
            fontWeight: "500",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: { iconTheme: { primary: "#2D5A27", secondary: "#F9FBF9" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#F9FBF9" } },
        }}
      />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<PageLoader />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppInner />
          </BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
