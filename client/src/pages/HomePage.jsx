/**
 * pages/HomePage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * LeafyLoop landing page featuring:
 *   • Full-bleed hero with animated headline + CTA
 *   • Category grid cards
 *   • Featured products staggered section
 *   • USP (Why LeafyLoop) section
 *   • Newsletter / WhatsApp CTA banner
 */

import { useRef }         from "react";
import { Link }           from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Leaf, Truck, Shield, HeartHandshake, ArrowRight,
  Star, MessageCircle, Sparkles,
} from "lucide-react";

import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from "../components/PageTransition";
import ProductCard          from "../components/product/ProductCard";
import { useFeaturedProducts } from "../hooks/useProducts";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";
const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || "919447000000";

// ─── Category data ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Indoor Plants",  slug: "Indoor",     image: "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", desc: "Purify your interiors",     bg: "#e8f5e2" },
  { label: "Outdoor Plants", slug: "Outdoor",    image: "https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", desc: "Transform your garden",      bg: "#e6f0e0" },
  { label: "Fertilizers",   slug: "Fertilizer", image: "https://images.unsplash.com/photo-1574943320219-553eb3f72f92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", desc: "Feed your green family",     bg: "#eef5e6" },
  { label: "Seeds",          slug: "Seeds",      image: "https://images.unsplash.com/photo-1585761269610-c7722b88c987?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", desc: "Grow from the beginning",    bg: "#f2f5e4" },
  { label: "Pots & Planters",slug: "Pots & Planters", image: "https://images.unsplash.com/photo-1523710999995-f2b1c56b404d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", desc: "Beautiful homes for plants", bg: "#f0ede4" },
  { label: "Tools",          slug: "Tools",      image: "https://images.unsplash.com/photo-1589939705066-5470eb3d4e47?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", desc: "Care essentials",            bg: "#ece8e0" },
];

// ─── USP Data ─────────────────────────────────────────────────────────────────
const USPS = [
  { icon: Truck,          title: "Free Kerala Delivery",    desc: "Free shipping to Trivandrum, ₹50 across Kerala." },
  { icon: Leaf,           title: "Hand-Picked Quality",     desc: "Every plant inspected by our horticulture team." },
  { icon: Shield,         title: "7-Day Healthy Guarantee", desc: "Plant dies in 7 days? We replace it, no questions." },
  { icon: HeartHandshake, title: "Expert Plant Care Help",  desc: "WhatsApp us anytime for personalised advice." },
];

// ─── Floating leaf decoration ─────────────────────────────────────────────────
function FloatingLeaf({ size, x, y, delay, rotate }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ y: [0, -16, 0], rotate: [rotate, rotate + 10, rotate] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <img 
        src="https://images.unsplash.com/photo-1520763185298-1b434c919abe?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" 
        alt="Leaf decoration"
        className="w-full h-full object-cover rounded-full opacity-70"
        onError={(e) => { e.target.style.backgroundColor = "#2D5A27"; e.target.style.display = "none"; }}
      />
    </motion.div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y     = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[92vh] flex items-center overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${FOREST} 0%, ${SAGE} 60%, #3d7a35 100%)` }}
    >
      {/* Parallax botanical illustration background */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 opacity-10"
      >
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* Floating decorative leaves */}
      <FloatingLeaf size="2rem"  x={8}  y={15} delay={0}   rotate={-20} />
      <FloatingLeaf size="1.5rem" x={85} y={20} delay={1.2} rotate={30}  />
      <FloatingLeaf size="2.5rem" x={75} y={70} delay={0.7} rotate={-10} />
      <FloatingLeaf size="1.2rem" x={15} y={75} delay={2}   rotate={20}  />
      <FloatingLeaf size="3rem"   x={90} y={50} delay={0.4} rotate={-35} />

      {/* Hero content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-24 grid lg:grid-cols-2 gap-16 items-center"
      >
        {/* Left — copy */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm
                       border border-white/20 text-white/90 text-sm font-medium mb-6"
          >
            <Sparkles size={14} />
            Kerala's Premier Plant Store
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Bring Nature
            <span className="block text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(90deg, #86efac, #d9f99d)" }}>
              Home.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-white/75 mb-8 max-w-lg leading-relaxed"
          >
            Hand-picked indoor &amp; outdoor plants, premium fertilizers, and expert care tips —
            delivered across Kerala with love.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              to="/products"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm
                         text-[#1B3022] bg-white hover:bg-[#f0fdf4] transition-all shadow-lg
                         hover:shadow-xl hover:-translate-y-0.5"
            >
              Shop All Plants <ArrowRight size={16} />
            </Link>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know more about your plants.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm
                         text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10
                         transition-all backdrop-blur-sm"
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="flex items-center gap-4 mt-8"
          >
            <div className="flex -space-x-2">
              {[
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=80&crop=faces",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=80&crop=faces",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=80&crop=faces",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=80&crop=faces",
              ].map((imgUrl, i) => (
                <img 
                  key={i}
                  src={imgUrl}
                  alt="Customer"
                  className="w-8 h-8 rounded-full border-2 border-[#1B3022] object-cover"
                  onError={(e) => { e.target.src = `https://via.placeholder.com/32/2D5A27/90EE90?text=${i+1}`; }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#fbbf24" stroke="none" />)}
              </div>
              <p className="text-white/70 text-xs">Trusted by 2,400+ Kerala families</p>
            </div>
          </motion.div>
        </div>

        {/* Right — illustrated plant showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative w-80 h-80">
            {/* Large circle backdrop */}
            <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm border border-white/20" />

            {/* Centre plant image */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <img 
                src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
                alt="Featured plant"
                className="w-40 h-40 object-cover rounded-full shadow-2xl"
                onError={(e) => { e.target.src = "https://via.placeholder.com/200/2D5A27/ffffff?text=Plant"; }}
              />
            </motion.div>

            {/* Orbiting mini cards */}
            {[
              { image: "https://images.unsplash.com/photo-1582265428552-2f9e0c22c5e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80", label: "Anthurium",   angle: 0   },
              { image: "https://images.unsplash.com/photo-1450494400974-6b6d2b71333f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80", label: "Cactus",      angle: 120 },
              { image: "https://images.unsplash.com/photo-1580704162636-f5cfaf6e6f76?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80", label: "Money Plant", angle: 240 },
            ].map(({ image, label, angle }) => {
              const rad = (angle * Math.PI) / 180;
              const rx = 140, ry = 140;
              return (
                <motion.div
                  key={label}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${Math.cos(rad) * rx}px - 40px)`,
                    top:  `calc(50% + ${Math.sin(rad) * ry}px - 40px)`,
                  }}
                  className="w-20 h-20 rounded-2xl bg-white/95 shadow-lg flex flex-col items-center
                             justify-center gap-1 border border-white/30 overflow-hidden"
                >
                  <img 
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/80/2D5A27/ffffff"; }}
                  />
                  <span className="text-[10px] font-semibold text-[#1B3022]">{label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L1440 80L1440 20C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z"
            fill="#F9FBF9" />
        </svg>
      </div>
    </section>
  );
}

// ─── Categories Section ───────────────────────────────────────────────────────
function CategoriesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <FadeIn>
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: SAGE }}>Browse By Type</p>
          <h2 className="text-4xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
            Find Your Perfect Plant
          </h2>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIES.map(({ label, slug, image, desc, bg }) => (
          <StaggerItem key={slug}>
            <Link to={`/products?category=${encodeURIComponent(slug)}`}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 16px 40px rgba(27,48,34,0.15)" }}
                className="flex flex-col items-center gap-3 p-5 rounded-3xl border border-stone-100
                           bg-white text-center cursor-pointer transition-all duration-300 h-full"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                     style={{ background: bg }}>
                  <img 
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; e.parentElement.style.paddingTop = "14px"; }}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800">{label}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{desc}</p>
                </div>
              </motion.div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

// ─── Featured Products Section ────────────────────────────────────────────────
function FeaturedProductsSection() {
  const { data, isLoading } = useFeaturedProducts();
  const products = data?.products ?? [];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-stone-50/80 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-12">
          <FadeIn>
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: SAGE }}>
                Handpicked Selection
              </p>
              <h2 className="text-4xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
                Featured Plants
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Link
              to="/products?featured=true"
              className="flex items-center gap-1.5 text-sm font-medium hover:gap-2.5 transition-all"
              style={{ color: SAGE }}
            >
              View all <ArrowRight size={15} />
            </Link>
          </FadeIn>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-5 bg-stone-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <StaggerItem key={p._id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}

// ─── USP Section ──────────────────────────────────────────────────────────────
function USPSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <FadeIn>
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: SAGE }}>
            Why Choose Us
          </p>
          <h2 className="text-4xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
            The LeafyLoop Promise
          </h2>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {USPS.map(({ icon: Icon, title, desc }) => (
          <StaggerItem key={title}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-7 border border-stone-100 shadow-sm text-center h-full"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                   style={{ background: "#f0fdf4" }}>
                <Icon size={24} style={{ color: SAGE }} />
              </div>
              <h3 className="font-bold text-stone-800 mb-2 text-base">{title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

// ─── Testimonials Section ─────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Priya Menon",
    location: "Trivandrum",
    text: "My balcony has transformed! The Monstera arrived perfectly packed and is thriving. Free delivery to Trivandrum is a huge bonus.",
    rating: 5,
    emoji: "🪴",
  },
  {
    name: "Arjun Krishnan",
    location: "Kochi",
    text: "Ordered 3 plants and organic fertilizer. Everything arrived within 2 days, well-packed and healthy. The care guide was very helpful.",
    rating: 5,
    emoji: "🌿",
  },
  {
    name: "Meera Nair",
    location: "Kozhikode",
    text: "WhatsApp support is excellent! They helped me identify a disease on my plant and recommended the right fertilizer. Very professional.",
    rating: 5,
    emoji: "🌺",
  },
];

function TestimonialsSection() {
  return (
    <section className="bg-stone-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: SAGE }}>
              Customer Stories
            </p>
            <h2 className="text-4xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
              Loved Across Kerala 🌿
            </h2>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, location, text, rating, emoji }) => (
            <StaggerItem key={name}>
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl p-7 border border-stone-100 shadow-sm h-full flex flex-col"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" stroke="none" />
                  ))}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed flex-1 mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg">
                    {emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{name}</p>
                    <p className="text-xs text-stone-400">{location}, Kerala</p>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ─── WhatsApp CTA Banner ──────────────────────────────────────────────────────
function WABanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden rounded-[2rem] p-8 sm:p-12 text-center"
        style={{ background: `linear-gradient(135deg, ${FOREST} 0%, ${SAGE} 100%)` }}
      >
        {/* Background leaves */}
        <div className="absolute inset-0 opacity-10 text-[8rem] flex items-center justify-around pointer-events-none">
          🌿🍃🌱
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}>
            Not sure which plant to pick?
          </h2>
          <p className="text-white/75 mb-8 text-base max-w-lg mx-auto">
            Our plant experts are on WhatsApp — describe your space and we'll recommend the perfect plant for you. Free advice, always.
          </p>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi! I need help choosing the right plant for my home.")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-[#1B3022] bg-white
                         hover:bg-[#f0fdf4] transition-colors shadow-xl mx-auto"
            >
              <MessageCircle size={18} />
              Chat with a Plant Expert
            </motion.button>
          </a>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <PageTransition>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProductsSection />
      <USPSection />
      <TestimonialsSection />
      <WABanner />
    </PageTransition>
  );
}
