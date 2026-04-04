/**
 * components/layout/Navbar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * LeafyLoop top navigation bar featuring:
 *   • Logo + brand name
 *   • Desktop nav links
 *   • Search bar (debounced, triggers navigation)
 *   • Cart drawer toggle (with animated badge)
 *   • Wishlist link with count badge
 *   • Compare panel toggle with count badge
 *   • User menu (login / profile / admin)
 *   • Mobile hamburger menu
 *   • Scroll-aware background blur
 */

import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch }       from "react-redux";
import { motion, AnimatePresence }        from "framer-motion";
import {
  ShoppingCart, Heart, Scale, Search, User,
  Menu, X, Leaf, ChevronDown, LogOut, Settings, Package,
} from "lucide-react";

import { selectCartCount, toggleCartDrawer }  from "../../store/slices/cartSlice";
import { selectWishlistCount }                from "../../store/slices/wishlistUserSlice";
import { selectCompareCount, openComparePanel } from "../../store/slices/compareSlice";
import { selectUser, selectIsAdmin }          from "../../store/slices/wishlistUserSlice";
import { useAuth, useDebounce }               from "../../hooks";

// ─── Brand Colours ─────────────────────────────────────────────────────────────
const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge({ count }) {
  if (!count) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1,   opacity: 1 }}
      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white
                 text-[10px] font-bold flex items-center justify-center z-10"
      style={{ background: SAGE }}
    >
      {count > 9 ? "9+" : count}
    </motion.span>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────
function IconBtn({ onClick, children, label, badge }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      className="relative p-2 rounded-xl text-stone-700 hover:text-[#2D5A27]
                 hover:bg-[#f0fdf4] transition-colors"
    >
      {children}
      <Badge count={badge} />
    </motion.button>
  );
}

// ─── Nav Link ─────────────────────────────────────────────────────────────────
function NavLink({ to, children }) {
  const location = useLocation();
  
  // Extract base path and query params from 'to' prop
  const [basePath, queryString] = to.split('?');
  
  // Check if pathname matches base path
  const pathMatches = location.pathname === basePath || location.pathname.startsWith(basePath + "/");
  
  // Check if query parameters match
  let active = pathMatches;
  if (pathMatches && queryString) {
    // If 'to' has query params, check if they match current location
    const urlParams = new URLSearchParams(queryString);
    const locationParams = new URLSearchParams(location.search);
    active = Array.from(urlParams.entries()).every(([key, value]) => 
      locationParams.get(key) === value
    );
  } else if (pathMatches && !queryString) {
    // If 'to' has no query params, only match if location also has no category param
    active = !location.search.includes('category=');
  }

  return (
    <Link
      to={to}
      className={`relative px-1 py-0.5 text-sm font-medium transition-colors
        ${active ? "text-[#2D5A27]" : "text-stone-600 hover:text-[#2D5A27]"}`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
          style={{ background: SAGE }}
        />
      )}
    </Link>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { logout } = useAuth();

  const cartCount    = useSelector(selectCartCount);
  const wishlistCount = useSelector(selectWishlistCount);
  const compareCount  = useSelector(selectCompareCount);
  const user          = useSelector(selectUser);
  const isAdmin       = useSelector(selectIsAdmin);

  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [scrolled,      setScrolled]      = useState(false);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [navigate, searchQuery]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300
          ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white/90 backdrop-blur-sm"}`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: FOREST }}>
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block"
                  style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
              LeafyLoop
            </span>
          </Link>

          {/* ── Desktop Nav Links ─────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/products">Shop</NavLink>
            <NavLink to="/products?category=Indoor">Indoor</NavLink>
            <NavLink to="/products?category=Outdoor">Outdoor</NavLink>
            <NavLink to="/products?category=Fertilizer">Fertilizers</NavLink>
          </div>

          {/* ── Right Actions ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <IconBtn onClick={() => setSearchOpen(true)} label="Search">
              <Search size={20} />
            </IconBtn>

            {/* Compare */}
            <IconBtn
              onClick={() => dispatch(openComparePanel())}
              label="Compare plants"
              badge={compareCount}
            >
              <Scale size={20} />
            </IconBtn>

            {/* Wishlist */}
            <Link to="/wishlist">
              <IconBtn label="Wishlist" badge={wishlistCount}>
                <Heart size={20} />
              </IconBtn>
            </Link>

            {/* Cart */}
            <IconBtn
              onClick={() => dispatch(toggleCartDrawer())}
              label="Shopping cart"
              badge={cartCount}
            >
              <ShoppingCart size={20} />
            </IconBtn>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-xl
                           text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name}
                    className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                    style={{ background: SAGE }}>
                    {user ? user.name[0].toUpperCase() : <User size={14} />}
                  </div>
                )}
                <span className="hidden sm:block max-w-[80px] truncate">
                  {user ? user.name.split(" ")[0] : "Login"}
                </span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1  }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-100
                               rounded-2xl shadow-xl overflow-hidden"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-stone-100">
                          <p className="text-sm font-semibold text-stone-800 truncate">{user.name}</p>
                          <p className="text-xs text-stone-500 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50">
                            <Package size={15} /> My Orders
                          </Link>
                          {isAdmin && (
                            <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-stone-50"
                              style={{ color: SAGE }}>
                              <Settings size={15} /> Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={() => { setUserMenuOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                          >
                            <LogOut size={15} /> Logout
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-2">
                        <Link to="/login" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50">
                          Sign In
                        </Link>
                        <Link to="/register" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm font-medium hover:bg-[#f0fdf4]"
                          style={{ color: SAGE }}>
                          Create Account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* ── Mobile Menu ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-stone-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-col gap-0.5">
                {[
                  { to: "/products",                    label: "All Plants" },
                  { to: "/products?category=Indoor",    label: "Indoor Plants" },
                  { to: "/products?category=Outdoor",   label: "Outdoor Plants" },
                  { to: "/products?category=Fertilizer",label: "Fertilizers" },
                  { to: "/wishlist",                    label: `Wishlist (${wishlistCount})` },
                  { to: "/orders",                      label: "My Orders" },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-stone-700 text-sm
                               hover:bg-[#f0fdf4] hover:text-[#2D5A27] transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Search Overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <form onSubmit={handleSearch}
                className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl
                           border border-stone-200 px-4 py-3">
                <Search size={20} className="text-stone-400 flex-shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plants, fertilizers…"
                  className="flex-1 text-sm text-stone-800 placeholder:text-stone-400
                             focus:outline-none bg-transparent"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")}>
                    <X size={16} className="text-stone-400 hover:text-stone-600" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-white text-sm font-medium"
                  style={{ background: SAGE }}
                >
                  Search
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
