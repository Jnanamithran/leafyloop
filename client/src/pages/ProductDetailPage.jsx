/**
 * pages/ProductDetailPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full product detail page featuring:
 *   • Image gallery with thumbnail selector
 *   • Plant attribute chips (Height, Sunlight, Water, Difficulty)
 *   • Quantity selector + Add to Cart / Wishlist / Compare
 *   • WhatsApp inquiry CTA
 *   • Pincode delivery check
 *   • Customer reviews (star rating form)
 *   • Related products carousel
 */

import { useState }          from "react";
import { useParams, Link }   from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Scale, ShoppingCart, MessageCircle, Star,
  Sun, Droplets, Ruler, ChevronRight, Plus, Minus,
  MapPin, Package, RefreshCw, Shield, Leaf,
} from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem, FadeIn, SlideIn } from "../components/PageTransition";
import ProductCard             from "../components/product/ProductCard";
import { useProduct, useProducts, useAddReview } from "../hooks/useProducts";
import { useAddToCart, useWishlistToggle, useCompareToggle, useWhatsApp } from "../hooks";
import { usePincode }          from "../hooks/usePincode";
import { useSelector }         from "react-redux";
import { selectIsLoggedIn }    from "../store/slices/wishlistUserSlice";
import toast                   from "react-hot-toast";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

// ─── Image Gallery ────────────────────────────────────────────────────────────
function ImageGallery({ images, name }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const main = images?.[activeIdx]?.url || "/placeholder.jpg";

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-50 border border-stone-100">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={main}
            alt={`${name} - view ${activeIdx + 1}`}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onError={(e) => { e.target.src = "https://via.placeholder.com/500/2D5A27/ffffff?text=Product+Image"; }}
          />
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      {images?.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <motion.button
              key={i}
              onClick={() => setActiveIdx(i)}
              whileHover={{ scale: 1.06 }}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === activeIdx ? "border-[#2D5A27] shadow-md" : "border-transparent"
              }`}
            >
              <img 
                src={img.url} 
                alt="" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://via.placeholder.com/100/2D5A27/ffffff"; }}
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attribute Chip ───────────────────────────────────────────────────────────
function AttrChip({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-stone-100 bg-stone-50 flex-1 min-w-[80px]">
      <Icon size={18} style={{ color: color || SAGE }} />
      <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-stone-700 text-center">{value}</span>
    </div>
  );
}

// ─── Rating Stars ─────────────────────────────────────────────────────────────
function RatingStars({ value, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <motion.button
          key={s}
          whileHover={interactive ? { scale: 1.2 } : {}}
          whileTap={interactive ? { scale: 0.9 } : {}}
          onClick={() => interactive && onChange?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          type={interactive ? "button" : undefined}
        >
          <Star
            size={size}
            fill={s <= (hovered || value) ? "#f59e0b" : "none"}
            stroke={s <= (hovered || value) ? "#f59e0b" : "#d1d5db"}
          />
        </motion.button>
      ))}
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────
function ReviewForm({ productId, productSlug }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState("");
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const { mutate, isPending } = useAddReview(productSlug);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error("Please login to leave a review."); return; }
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    mutate({ productId, rating, comment });
    setRating(0);
    setComment("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-stone-50 rounded-2xl p-5 space-y-4">
      <h4 className="font-bold text-stone-800">Write a Review</h4>
      <div>
        <p className="text-xs text-stone-500 mb-2">Your Rating</p>
        <RatingStars value={rating} size={24} interactive onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this plant…"
        rows={3}
        className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl resize-none
                   focus:outline-none focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20"
      />
      <motion.button
        type="submit"
        disabled={isPending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
        style={{ background: FOREST }}
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </motion.button>
    </form>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div className="py-4 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#f0fdf4] flex items-center justify-center text-sm font-bold"
             style={{ color: SAGE }}>
          {review.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">{review.name}</p>
          <p className="text-xs text-stone-400">
            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <RatingStars value={review.rating} size={12} />
      </div>
      {review.comment && <p className="text-sm text-stone-600 leading-relaxed ml-11">{review.comment}</p>}
    </div>
  );
}

// ─── Pincode Checker ──────────────────────────────────────────────────────────
function PincodeChecker() {
  const { pincode, resolution, loading, error, handleChange, handleSubmit } = usePincode();
  return (
    <div className="border border-stone-200 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-stone-700 flex items-center gap-2">
        <MapPin size={15} style={{ color: SAGE }} /> Check Delivery
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={pincode}
          onChange={handleChange}
          placeholder="Enter 6-digit pincode"
          inputMode="numeric"
          maxLength={6}
          className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none
                     focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/20"
        />
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
          style={{ background: FOREST }}
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   : "Check"}
        </button>
      </form>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {resolution?.success && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2"
        >
          <Package size={14} />
          <span>
            Delivering to <strong>{resolution.city}, {resolution.state}</strong> — {resolution.label}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug } = useParams();
  const [qty, setQty] = useState(1);

  const { data, isLoading, isError } = useProduct(slug);
  const product = data?.product;

  // Related products (same category)
  const { data: relatedData } = useProducts(
    product ? { category: product.category, limit: 4, sort: "-rating" } : {}
  );
  const related = (relatedData?.products ?? []).filter((p) => p._id !== product?._id).slice(0, 4);

  const { addItem }                        = useAddToCart();
  const { isWishlisted, toggle: wlToggle } = useWishlistToggle(product);
  const { isInCompare, toggle: cmpToggle } = useCompareToggle(product);
  const { inquire }                        = useWhatsApp();

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-2 gap-10">
          {/* Skeleton */}
          <div className="aspect-square bg-stone-200 rounded-3xl animate-pulse" />
          <div className="space-y-4">
            {[80, 60, 40, 100, 60, 80].map((w, i) => (
              <div key={i} className="h-4 bg-stone-200 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !product) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-2xl">🌿</p>
          <p className="text-stone-500 font-medium">Product not found.</p>
          <Link to="/products" className="text-sm underline" style={{ color: SAGE }}>Browse all plants</Link>
        </div>
      </PageTransition>
    );
  }

  const outOfStock   = product.stock === 0;
  const discountPct  = product.discountPercent ?? 0;

  return (
    <PageTransition>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-stone-400">
          <Link to="/" className="hover:text-stone-600">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-stone-600">Plants</Link>
          <ChevronRight size={12} />
          <Link to={`/products?category=${product.category}`} className="hover:text-stone-600">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-stone-600 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-2 gap-10 lg:gap-16">

        {/* Left — Gallery */}
        <SlideIn from="left">
          <ImageGallery images={product.images} name={product.name} />
        </SlideIn>

        {/* Right — Info */}
        <SlideIn from="right">
          <div className="space-y-5">
            {/* Category + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/products?category=${product.category}`}
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: "#f0fdf4", color: SAGE }}
              >
                {product.category}
              </Link>
              {product.isFeatured  && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⭐ Featured</span>}
              {product.petFriendly && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">🐾 Pet Safe</span>}
              {product.airPurifying && <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">💨 Air Purifier</span>}
            </div>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
              {product.name}
            </h1>

            {/* Rating */}
            {product.numReviews > 0 && (
              <div className="flex items-center gap-2">
                <RatingStars value={product.rating} size={16} />
                <span className="text-sm text-stone-500">
                  {product.rating} ({product.numReviews} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold" style={{ color: SAGE }}>
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-xl text-stone-400 line-through">
                    ₹{product.compareAtPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-stone-500 text-sm leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Plant attributes */}
            {(product.height || product.sunlight || product.water || product.difficulty) && (
              <div className="flex gap-2 flex-wrap">
                <AttrChip icon={Ruler}    label="Height"    value={product.height}    />
                <AttrChip icon={Sun}      label="Sunlight"  value={product.sunlight}  />
                <AttrChip icon={Droplets} label="Watering"  value={product.water}     />
                <AttrChip icon={Leaf}     label="Difficulty" value={product.difficulty} color="#d97706" />
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {!outOfStock ? (
              <div className="flex gap-3 items-center">
                {/* Qty */}
                <div className="flex items-center border border-stone-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-12 text-center font-bold text-stone-800">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="px-4 py-3 text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Add to Cart */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addItem(product, qty)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                             text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ background: FOREST }}
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </motion.button>
              </div>
            ) : (
              <div className="py-4 rounded-2xl bg-red-50 border border-red-100 text-center">
                <p className="text-red-600 font-semibold text-sm">Currently Out of Stock</p>
                <p className="text-red-400 text-xs mt-1">Join the waitlist via WhatsApp →</p>
              </div>
            )}

            {/* Secondary actions */}
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={wlToggle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                           border transition-all ${isWishlisted
                             ? "border-red-200 bg-red-50 text-red-600"
                             : "border-stone-200 text-stone-600 hover:border-stone-300"}`}
              >
                <Heart size={15} fill={isWishlisted ? "currentColor" : "none"} />
                {isWishlisted ? "Wishlisted" : "Wishlist"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={cmpToggle}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                           border transition-all ${isInCompare
                             ? "border-[#2D5A27] bg-[#f0fdf4] text-[#2D5A27]"
                             : "border-stone-200 text-stone-600 hover:border-stone-300"}`}
              >
                <Scale size={15} />
                {isInCompare ? "In Compare" : "Compare"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => inquire(product)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                           border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all"
              >
                <MessageCircle size={15} />
                WhatsApp Enquiry
              </motion.button>
            </div>

            {/* Stock info */}
            <p className="text-xs text-stone-400">
              {product.stock > 0 ? (
                product.stock < 10 ? (
                  <span className="text-amber-600 font-medium">⚠️ Only {product.stock} left in stock!</span>
                ) : (
                  <span className="text-green-600 font-medium">✓ In Stock ({product.stock} units)</span>
                )
              ) : "Out of stock"}
            </p>

            {/* Delivery checker */}
            <PincodeChecker />

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: Shield,     text: "7-Day Healthy Guarantee" },
                { icon: RefreshCw,  text: "Easy Returns" },
                { icon: Package,    text: "Safe Packaging" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon size={16} style={{ color: SAGE }} />
                  <span className="text-[10px] text-stone-500 leading-tight">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </SlideIn>
      </div>

      {/* ── Description + Reviews ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-10">
        {/* Description */}
        <div className="lg:col-span-2 space-y-6">
          <FadeIn>
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
                About This Plant
              </h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </FadeIn>

          {/* Fertilizer details */}
          {product.category === "Fertilizer" && (product.fertilizerType || product.npkRatio || product.weightKg) && (
            <FadeIn>
              <div className="bg-stone-50 rounded-2xl p-5 space-y-2">
                <h3 className="font-bold text-stone-700">Fertilizer Details</h3>
                {product.fertilizerType && <p className="text-sm text-stone-600">Type: <strong>{product.fertilizerType}</strong></p>}
                {product.npkRatio       && <p className="text-sm text-stone-600">NPK Ratio: <strong>{product.npkRatio}</strong></p>}
                {product.weightKg       && <p className="text-sm text-stone-600">Net Weight: <strong>{product.weightKg} kg</strong></p>}
              </div>
            </FadeIn>
          )}

          {/* Reviews */}
          <FadeIn>
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
                Customer Reviews
              </h2>

              {/* Rating summary */}
              {product.numReviews > 0 && (
                <div className="flex items-center gap-6 mb-6 p-5 bg-stone-50 rounded-2xl">
                  <div className="text-center">
                    <p className="text-5xl font-bold" style={{ color: SAGE }}>{product.rating}</p>
                    <RatingStars value={product.rating} size={14} />
                    <p className="text-xs text-stone-400 mt-1">{product.numReviews} reviews</p>
                  </div>
                </div>
              )}

              <ReviewForm productId={product._id} productSlug={slug} />

              <div className="mt-6 divide-y divide-stone-100">
                {product.reviews?.length === 0 && (
                  <p className="text-sm text-stone-400 py-6 text-center">No reviews yet. Be the first! 🌿</p>
                )}
                {product.reviews?.map((r) => <ReviewCard key={r._id} review={r} />)}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Tags sidebar */}
        <FadeIn delay={0.2}>
          <div className="space-y-4">
            <h3 className="font-bold text-stone-700">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags?.map((tag) => (
                <Link
                  key={tag}
                  to={`/products?search=${tag}`}
                  className="text-xs px-3 py-1 rounded-full border border-stone-200 text-stone-500
                             hover:border-[#2D5A27] hover:text-[#2D5A27] transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Related Products ───────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-stone-50 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold mb-8" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
              You Might Also Like
            </h2>
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <StaggerItem key={p._id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}
    </PageTransition>
  );
}
