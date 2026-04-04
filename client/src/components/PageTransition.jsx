/**
 * PageTransition.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Framer Motion wrappers for consistent LeafyLoop page animations.
 *
 * Exports:
 *   <PageTransition>           → Fade + slide-up for full pages
 *   <StaggerContainer>         → Staggered children entrance
 *   <StaggerItem>              → Individual staggered item
 *   <CardHover>                → Product card hover scale wrapper
 *   <CartDrawer>               → Right-side slide-in drawer
 *   <FadeIn>                   → Simple fade
 *   variants                   → Raw variant objects for custom use
 */

import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

// ─── Duration & Easing Constants ──────────────────────────────────────────────
const EASE_OUT_EXPO   = [0.16, 1, 0.3, 1];
const EASE_IN_OUT     = [0.4, 0, 0.2, 1];
const SPRING_GENTLE   = { type: "spring", stiffness: 300, damping: 30 };
const SPRING_SNAPPY   = { type: "spring", stiffness: 500, damping: 40 };

// ─── Variant Presets ──────────────────────────────────────────────────────────
export const variants = {
  // Full-page enter/exit
  page: {
    initial:  { opacity: 0, y: 24 },
    animate:  { opacity: 1, y: 0,  transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
    exit:     { opacity: 0, y: -12, transition: { duration: 0.25, ease: EASE_IN_OUT } },
  },

  // Stagger container
  stagger: {
    initial: {},
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  },

  // Individual stagger child
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
  },

  // Fade only
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.35 } },
    exit:    { opacity: 0, transition: { duration: 0.2  } },
  },

  // Slide from right (drawer / cart)
  slideRight: {
    initial: { x: "100%" },
    animate: { x: 0,      transition: SPRING_GENTLE },
    exit:    { x: "100%", transition: { duration: 0.28, ease: EASE_IN_OUT } },
  },

  // Slide from left
  slideLeft: {
    initial: { x: "-100%" },
    animate: { x: 0,       transition: SPRING_GENTLE },
    exit:    { x: "-100%", transition: { duration: 0.28, ease: EASE_IN_OUT } },
  },

  // Scale from center (modals)
  scale: {
    initial: { opacity: 0, scale: 0.93 },
    animate: { opacity: 1, scale: 1,    transition: SPRING_SNAPPY },
    exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  },

  // Card hover
  cardHover: {
    rest:  { scale: 1,    y: 0,   boxShadow: "0 2px 16px rgba(0,0,0,0.06)" },
    hover: { scale: 1.03, y: -4,  boxShadow: "0 12px 40px rgba(29,48,34,0.16)",
             transition: { duration: 0.25, ease: EASE_OUT_EXPO } },
    tap:   { scale: 0.98, y: 0 },
  },

  // Overlay backdrop
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.25 } },
    exit:    { opacity: 0, transition: { duration: 0.2  } },
  },
};

// ─── PageTransition ───────────────────────────────────────────────────────────
/**
 * Wraps a full page with AnimatePresence-aware fade + slide-up.
 * Use at the top of each page component.
 *
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 */
export function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      variants={variants.page}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedRoutes wrapper (place in App.jsx) ────────────────────────────────
/**
 * Wraps <Routes> to enable AnimatePresence route transitions.
 *
 * Usage in App.jsx:
 *   const location = useLocation();
 *   <AnimatedRoutes location={location}>
 *     <Routes location={location} key={location.pathname}>
 *       ...
 *     </Routes>
 *   </AnimatedRoutes>
 */
export function AnimatedRoutes({ children, location }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={location?.pathname}>
        {children}
      </div>
    </AnimatePresence>
  );
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────
/**
 * Container that stagger-animates its children.
 *
 * <StaggerContainer className="grid grid-cols-3 gap-6">
 *   {products.map(p => <StaggerItem key={p._id}><ProductCard ... /></StaggerItem>)}
 * </StaggerContainer>
 */
export function StaggerContainer({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      variants={{
        ...variants.stagger,
        animate: {
          transition: { staggerChildren: 0.08, delayChildren: delay },
        },
      }}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerItem ──────────────────────────────────────────────────────────────
export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div variants={variants.staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// ─── CardHover ────────────────────────────────────────────────────────────────
/**
 * Hover + tap scale wrapper for product cards.
 *
 * <CardHover>
 *   <ProductCard />
 * </CardHover>
 */
export function CardHover({ children, className = "" }) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={variants.cardHover}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────
/**
 * Right-side sliding cart drawer with backdrop.
 *
 * <CartDrawer isOpen={isOpen} onClose={close}>
 *   <CartContents />
 * </CartDrawer>
 */
export function CartDrawer({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            variants={variants.backdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.aside
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            variants={variants.slideRight}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────
export function FadeIn({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideIn (generic) ────────────────────────────────────────────────────────
export function SlideIn({ children, from = "bottom", delay = 0, className = "" }) {
  const dirMap = {
    bottom: { initial: { opacity: 0, y: 32 },  animate: { opacity: 1, y: 0  } },
    top:    { initial: { opacity: 0, y: -32 },  animate: { opacity: 1, y: 0  } },
    left:   { initial: { opacity: 0, x: -32 },  animate: { opacity: 1, x: 0  } },
    right:  { initial: { opacity: 0, x: 32 },   animate: { opacity: 1, x: 0  } },
  };

  const dir = dirMap[from] ?? dirMap.bottom;

  return (
    <motion.div
      initial={dir.initial}
      animate={dir.animate}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── ScaleIn (modal) ─────────────────────────────────────────────────────────
export function ScaleIn({ children, className = "" }) {
  return (
    <motion.div
      variants={variants.scale}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
