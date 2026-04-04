/**
 * components/layout/Footer.jsx
 */
import { Link }  from "react-router-dom";
import { Leaf, MessageCircle, Mail, MapPin, Phone } from "lucide-react";

const FOREST = "#1B3022";
const SAGE   = "#2D5A27";
const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || "919447000000";

const NAV_LINKS = {
  Shop: [
    { label: "Indoor Plants",   to: "/products?category=Indoor"     },
    { label: "Outdoor Plants",  to: "/products?category=Outdoor"    },
    { label: "Fertilizers",     to: "/products?category=Fertilizer" },
    { label: "Seeds",           to: "/products?category=Seeds"      },
    { label: "Pots & Planters", to: "/products?category=Pots+%26+Planters" },
  ],
  Account: [
    { label: "My Orders",    to: "/orders"   },
    { label: "My Wishlist",  to: "/wishlist" },
    { label: "Sign In",      to: "/login"    },
    { label: "Create Account", to: "/register" },
  ],
  Company: [
    { label: "About Us",        to: "/" },
    { label: "Privacy Policy",  to: "/" },
    { label: "Terms of Service",to: "/" },
    { label: "Shipping Policy", to: "/" },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: FOREST }} className="text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Leaf size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                LeafyLoop
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/60 max-w-[220px]">
              Kerala's premium plant store. Bringing nature to your doorstep since 2024.
            </p>

            {/* Contact */}
            <div className="space-y-2">
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-green-400 transition-colors">
                <MessageCircle size={14} /> WhatsApp Us
              </a>
              <p className="flex items-center gap-2 text-sm text-white/60">
                <MapPin size={14} /> Trivandrum, Kerala
              </p>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(NAV_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-white/60 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} LeafyLoop. Made with 🌿 in Kerala, India.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Payments secured by Razorpay 🔒</span>
            <span>·</span>
            <span>Powered by MongoDB Atlas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
