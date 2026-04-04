/**
 * components/product/ProductCard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Product card with:
 *   • Primary image + hover secondary image (if available)
 *   • Discount badge, Out of Stock overlay
 *   • Heart (Wishlist) toggle
 *   • Scale (Compare) toggle with limit guard
 *   • Add to Cart button
 *   • WhatsApp inquiry button
 *   • Framer Motion hover lift + stagger-aware
 */

import { useState } from "react";
import { Link }     from "react-router-dom";
import { motion }   from "framer-motion";
import {
  Heart, Scale, ShoppingCart, MessageCircle,
  Sun, Droplets, Ruler, Star,
} from "lucide-react";

import { useAddToCart, useWishlistToggle, useCompareToggle, useWhatsApp } from "../../hooks";
import { CardHover } from "../PageTransition";

// ─── Brand ───────────────────────────────────────────────────────────────────
const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map((s) => (
          <Star
            key={s}
            size={11}
            fill={s <= Math.round(rating) ? "#f59e0b" : "none"}
            stroke={s <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
          />
        ))}
      </div>
      {count > 0 && <span className="text-[11px] text-stone-400">({count})</span>}
    </div>
  );
}

// ─── Attribute Pill ───────────────────────────────────────────────────────────
function AttrPill({ icon: Icon, label }) {
  if (!label) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
      <Icon size={10} /> {label}
    </span>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ onClick, active, activeColor, children, label }) {
  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.88 }}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      aria-label={label}
      className={`p-2 rounded-xl transition-all duration-200 ${
        active
          ? "text-white shadow-md"
          : "bg-white/90 text-stone-600 hover:text-stone-900 shadow-sm"
      }`}
      style={active ? { background: activeColor || SAGE } : {}}
    >
      {children}
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductCard({ product, className = "" }) {
  const [imgIdx, setImgIdx] = useState(0);

  const { addItem }                   = useAddToCart();
  const { isWishlisted, toggle: wlToggle } = useWishlistToggle(product);
  const { isInCompare, toggle: cmpToggle } = useCompareToggle(product);
  const { inquire }                   = useWhatsApp();

  const primaryImg   = product.images?.[imgIdx]?.url || product.images?.[0]?.url || "/placeholder.jpg";
  const hasSecondImg = product.images?.length > 1;
  const outOfStock   = product.stock === 0;
  const discount     = product.discountPercent ?? 0;

  return (
    <CardHover className={`group relative ${className}`}>
      <Link
        to={`/products/${product.slug || product._id}`}
        className="block bg-white rounded-2xl overflow-hidden border border-stone-100
                   shadow-sm cursor-pointer"
        onMouseEnter={() => hasSecondImg && setImgIdx(1)}
        onMouseLeave={() => setImgIdx(0)}
      >
        {/* ── Image Area ─────────────────────────────────────────────────── */}
        <div className="relative aspect-square overflow-hidden bg-stone-50">
          <motion.img
            key={imgIdx}
            src={primaryImg}
            alt={product.name}
            loading="lazy"
            initial={{ opacity: 0.8, scale: 1.04 }}
            animate={{ opacity: 1,   scale: 1    }}
            transition={{ duration: 0.4 }}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = "https://via.placeholder.com/300/2D5A27/ffffff?text=" + encodeURIComponent(product.name); }}
          />

          {/* Out of Stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white/90 text-stone-800 text-xs font-semibold px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold
                            px-2 py-0.5 rounded-full">
              -{discount}%
            </div>
          )}

          {/* Special badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {product.isFeatured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: FOREST }}>
                ⭐ Featured
              </span>
            )}
            {product.airPurifying && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                💨 Air Purifier
              </span>
            )}
            {product.petFriendly && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                🐾 Pet Safe
              </span>
            )}
          </div>

          {/* Action buttons (appear on hover) */}
          <div className="absolute bottom-3 left-3 flex gap-1.5
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ActionBtn
              onClick={wlToggle}
              active={isWishlisted}
              activeColor="#ef4444"
              label="Toggle wishlist"
            >
              <Heart size={15} fill={isWishlisted ? "white" : "none"} />
            </ActionBtn>

            <ActionBtn
              onClick={cmpToggle}
              active={isInCompare}
              label="Add to compare"
            >
              <Scale size={15} />
            </ActionBtn>

            <ActionBtn
              onClick={() => inquire(product)}
              label="Inquire on WhatsApp"
            >
              <MessageCircle size={15} />
            </ActionBtn>
          </div>
        </div>

        {/* ── Info Area ──────────────────────────────────────────────────── */}
        <div className="p-4 space-y-2.5">
          {/* Category */}
          <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            {product.category}
          </span>

          {/* Name */}
          <h3 className="text-sm font-semibold text-stone-800 leading-snug line-clamp-2 group-hover:text-[#2D5A27] transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.numReviews > 0 && (
            <StarRating rating={product.rating} count={product.numReviews} />
          )}

          {/* Attribute pills */}
          {(product.height || product.sunlight || product.water) && (
            <div className="flex flex-wrap gap-1">
              <AttrPill icon={Ruler}    label={product.height}   />
              <AttrPill icon={Sun}      label={product.sunlight} />
              <AttrPill icon={Droplets} label={product.water}    />
            </div>
          )}

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-base font-bold" style={{ color: SAGE }}>
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-stone-400 line-through ml-2">
                  ₹{product.compareAtPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => { e.preventDefault(); addItem(product); }}
              disabled={outOfStock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: outOfStock ? "#9ca3af" : FOREST }}
              aria-label="Add to cart"
            >
              <ShoppingCart size={13} />
              Add
            </motion.button>
          </div>
        </div>
      </Link>
    </CardHover>
  );
}
