/**
 * pages/ProductsPage.jsx
 * Full product listing with debounced search, category/price/rating filters,
 * and staggered card entrance animations.
 */

import { useState, useEffect } from "react";
import { useSearchParams }     from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Search, X, ChevronDown } from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem } from "../components/PageTransition";
import ProductCard     from "../components/product/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

const CATEGORIES = ["Indoor", "Outdoor", "Fertilizer", "Seeds", "Pots & Planters", "Tools"];
const SORT_OPTIONS = [
  { value: "-createdAt",  label: "Newest First"    },
  { value: "price",       label: "Price: Low → High" },
  { value: "-price",      label: "Price: High → Low" },
  { value: "-rating",     label: "Top Rated"        },
  { value: "-numReviews", label: "Most Reviewed"    },
];

// ─── Filter Pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active ? "text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
      style={active ? { background: SAGE } : {}}
    >
      {label}
    </motion.button>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm animate-pulse">
      <div className="aspect-square bg-stone-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-stone-200 rounded w-1/3" />
        <div className="h-4 bg-stone-200 rounded w-3/4" />
        <div className="h-3 bg-stone-200 rounded w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-5 bg-stone-200 rounded w-1/4" />
          <div className="h-8 bg-stone-200 rounded-xl w-16" />
        </div>
      </div>
    </div>
  );
}

// ─── Products Page ────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [category,    setCategory]    = useState(searchParams.get("category") || "");
  const [sort,        setSort]        = useState(searchParams.get("sort") || "-createdAt");
  const [minPrice,    setMinPrice]    = useState(searchParams.get("minPrice") || "");
  const [maxPrice,    setMaxPrice]    = useState(searchParams.get("maxPrice") || "");
  const [page,        setPage]        = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync external URL changes (e.g. from navbar links) to local state
  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setSort(searchParams.get("sort") || "-createdAt");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setPage(1);
  }, [searchParams]);

  // Sync URL params from local state changes
  useEffect(() => {
    const p = {};
    if (debouncedSearch) p.search   = debouncedSearch;
    if (category)         p.category = category;
    if (sort !== "-createdAt") p.sort = sort;
    if (minPrice)         p.minPrice = minPrice;
    if (maxPrice)         p.maxPrice = maxPrice;
    setSearchParams(p, { replace: true });
    setPage(1);
  }, [debouncedSearch, category, sort, minPrice, maxPrice]);

  const { data, isLoading, isError } = useProducts({
    search:   debouncedSearch,
    category,
    sort,
    minPrice:  minPrice || undefined,
    maxPrice:  maxPrice || undefined,
    page,
    limit:     12,
  });

  const products   = data?.products ?? [];
  const pagination = data?.pagination;
  const hasFilters = debouncedSearch || category || minPrice || maxPrice;

  const clearFilters = () => {
    setSearchInput("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("-createdAt");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
              {category ? `${category} Plants` : "All Plants & Fertilizers"}
            </h1>
            {pagination && (
              <p className="text-sm text-stone-400 mt-1">
                {pagination.total} products found
                {debouncedSearch && ` for "${debouncedSearch}"`}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* ── Filters Row ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search plants…"
                className="w-full pl-8 pr-8 py-2 text-sm border border-stone-200 rounded-xl bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={13} className="text-stone-400 hover:text-stone-600" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-stone-200 rounded-xl bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                filtersOpen ? "border-[#2D5A27] text-[#2D5A27] bg-[#f0fdf4]" : "border-stone-200 text-stone-600 bg-white"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {hasFilters && (
                <span className="ml-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ background: SAGE }}>
                  •
                </span>
              )}
            </button>

            {hasFilters && (
              <button onClick={clearFilters}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* ── Advanced Filters Expanded ─────────────────────────────────────── */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-6 space-y-4">
                  {/* Category filter */}
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Category</p>
                    <div className="flex flex-wrap gap-2">
                      <FilterPill label="All"   active={!category} onClick={() => setCategory("")} />
                      {CATEGORIES.map((c) => (
                        <FilterPill key={c} label={c} active={category === c} onClick={() => setCategory(c === category ? "" : c)} />
                      ))}
                    </div>
                  </div>

                  {/* Price range */}
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Price Range (₹)</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Min"
                        className="w-28 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-[#2D5A27]"
                      />
                      <span className="text-stone-400">—</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max"
                        className="w-28 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-[#2D5A27]"
                      />
                    </div>
                  </div>

                  {/* Quick Price Presets */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Under ₹500",   min: "",    max: "500"  },
                      { label: "₹500–₹2000",   min: "500", max: "2000" },
                      { label: "₹2000+",        min: "2000",max: ""     },
                    ].map(({ label, min, max }) => (
                      <FilterPill
                        key={label}
                        label={label}
                        active={minPrice === min && maxPrice === max}
                        onClick={() => { setMinPrice(min); setMaxPrice(max); }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Product Grid ──────────────────────────────────────────────────── */}
          {isError ? (
            <div className="text-center py-20">
              <p className="text-stone-500">Failed to load products. Please try again.</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌿</div>
              <p className="text-stone-500 font-medium">No plants found matching your filters.</p>
              <button onClick={clearFilters} className="mt-4 text-sm underline" style={{ color: SAGE }}>
                Clear filters
              </button>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <StaggerItem key={p._id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* ── Pagination ───────────────────────────────────────────────────── */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm border border-stone-200 disabled:opacity-40 hover:bg-stone-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-stone-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 rounded-xl text-sm border border-stone-200 disabled:opacity-40 hover:bg-stone-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
