/**
 * pages/NotFoundPage.jsx — Animated 404 with plant theme
 */
import { Link }   from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageTransition } from "../components/PageTransition";

const FOREST = "#1B3022";
const SAGE   = "#2D5A27";

export default function NotFoundPage() {
  return (
    <PageTransition>
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
        {/* Animated plant */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="text-[8rem] mb-4 select-none"
        >
          🪴
        </motion.div>

        {/* 404 number */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
          className="text-[8rem] font-bold leading-none mb-2"
          style={{ color: "#e5e7eb", fontFamily: "'Playfair Display', serif" }}
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-2xl font-bold mb-3"
          style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}
        >
          This plant doesn't exist!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-stone-400 text-sm mb-8 max-w-sm"
        >
          Looks like this page wandered off to the garden. Let's help you find your way back.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Link to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-lg"
            style={{ background: FOREST }}>
            Go Home
          </Link>
          <Link to="/products"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm border-2 border-[#1B3022] text-[#1B3022] hover:bg-[#f0fdf4]">
            Browse Plants <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}
