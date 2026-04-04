/**
 * pages/WishlistPage.jsx
 */
import { Link }              from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ShoppingCart, ArrowRight } from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem } from "../components/PageTransition";
import { selectWishlistItems, toggleWishlist } from "../store/slices/wishlistUserSlice";
import { useAddToCart } from "../hooks";
import toast from "react-hot-toast";

export function WishlistPage() {
  const dispatch = useDispatch();
  const items    = useSelector(selectWishlistItems);
  const { addItem } = useAddToCart();

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Heart size={24} fill="#ef4444" stroke="#ef4444" />
            <h1 className="text-3xl font-bold" style={{ color: "#1B3022", fontFamily: "'Playfair Display', serif" }}>
              My Wishlist
            </h1>
            <span className="text-sm text-stone-400">({items.length} items)</span>
          </div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24"
            >
              <div className="text-7xl mb-6">🌿</div>
              <h2 className="text-xl font-bold text-stone-700 mb-2">Your wishlist is empty</h2>
              <p className="text-stone-400 text-sm mb-6">Save plants you love to buy them later</p>
              <Link to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: "#1B3022" }}>
                Browse Plants <ArrowRight size={15} />
              </Link>
            </motion.div>
          ) : (
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((item) => (
                <StaggerItem key={item._id}>
                  <motion.div layout className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
                    <Link to={`/products/${item._id}`}>
                      <div className="aspect-square bg-stone-50">
                        <img src={item.image || "/placeholder.jpg"} alt={item.name}
                          className="w-full h-full object-cover" />
                      </div>
                    </Link>
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{item.category}</p>
                      <Link to={`/products/${item._id}`}
                        className="block text-sm font-semibold text-stone-800 hover:text-[#2D5A27] line-clamp-2">
                        {item.name}
                      </Link>
                      <p className="font-bold text-base" style={{ color: "#2D5A27" }}>
                        ₹{item.price?.toLocaleString("en-IN")}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { addItem(item); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                     text-white text-xs font-semibold"
                          style={{ background: "#1B3022" }}
                        >
                          <ShoppingCart size={13} /> Add to Cart
                        </button>
                        <button
                          onClick={() => { dispatch(toggleWishlist(item)); toast("Removed from wishlist"); }}
                          className="p-2 rounded-xl border border-stone-200 text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default WishlistPage;
