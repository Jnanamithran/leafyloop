/**
 * components/product/ComparePanel.jsx — final corrected version
 */
import { useSelector, useDispatch }  from "react-redux";
import { AnimatePresence, motion }   from "framer-motion";
import { X, Scale, ShoppingCart, ChevronUp } from "lucide-react";
import { Link }                      from "react-router-dom";

import {
  selectCompareItems, selectCompareMatrix, selectComparePanelOpen,
  removeFromCompare, clearCompare, closeComparePanel, openComparePanel,
} from "../../store/slices/compareSlice";
import { useAddToCart } from "../../hooks";

const SAGE   = "#2D5A27";
const FOREST = "#1B3022";

function MiniCard({ product, onRemove }) {
  const img = product.images?.[0]?.url || "/placeholder.jpg";
  return (
    <div className="relative flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-stone-100">
      <img src={img} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-stone-800 truncate max-w-[100px]">{product.name}</p>
        <p className="text-xs font-bold" style={{ color: SAGE }}>₹{product.price?.toLocaleString("en-IN")}</p>
      </div>
      <button
        onClick={() => onRemove(product._id)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
      >
        <X size={10} />
      </button>
    </div>
  );
}

function CompareTable({ products, rows }) {
  const dispatch   = useDispatch();
  const { addItem } = useAddToCart();
  const cols = products.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            <th className="w-32 py-4 pr-4 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Feature</th>
            {products.map((p) => (
              <th key={p._id} className="py-4 px-3 text-left">
                <div className="space-y-2">
                  <div className="relative w-full aspect-square max-w-[120px] rounded-2xl overflow-hidden bg-stone-50 mx-auto border border-stone-100">
                    <img src={p.images?.[0]?.url || "/placeholder.jpg"} alt={p.name} className="w-full h-full object-cover" />
                    <button onClick={() => dispatch(removeFromCompare(p._id))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center">
                      <X size={11} />
                    </button>
                  </div>
                  <Link to={`/products/${p.slug || p._id}`}
                    className="block text-sm font-bold text-stone-800 hover:text-[#2D5A27] line-clamp-2 text-center">
                    {p.name}
                  </Link>
                  <p className="text-center font-bold" style={{ color: SAGE }}>₹{p.price?.toLocaleString("en-IN")}</p>
                  <button onClick={() => addItem(p)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-white text-xs font-semibold"
                    style={{ background: FOREST }}>
                    <ShoppingCart size={12} /> Add to Cart
                  </button>
                </div>
              </th>
            ))}
            {Array.from({ length: 3 - cols }).map((_, i) => (
              <th key={`empty-${i}`} className="py-4 px-3">
                <div className="w-full aspect-square max-w-[120px] rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center mx-auto">
                  <p className="text-[11px] text-stone-300 text-center px-2">Add plant to compare</p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.label} className={ri % 2 === 0 ? "bg-stone-50/60" : "bg-white"}>
              <td className="py-3 pr-4 text-xs font-semibold text-stone-500 whitespace-nowrap">{row.label}</td>
              {row.values.map((val, ci) => (
                <td key={ci} className="py-3 px-3">
                  {val === "—" ? <span className="text-stone-300 text-sm">—</span> : (
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: "#f0fdf4", color: SAGE, border: "1px solid #bbf7d0" }}>
                      {val}
                    </span>
                  )}
                </td>
              ))}
              {Array.from({ length: 3 - cols }).map((_, i) => <td key={i} className="py-3 px-3" />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePanel() {
  const dispatch    = useDispatch();
  const items       = useSelector(selectCompareItems);
  const isPanelOpen = useSelector(selectComparePanelOpen);
  const { products, rows } = useSelector(selectCompareMatrix);

  if (items.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        {!isPanelOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4"
          >
            <div className="bg-white/96 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200
                            px-4 py-3 flex items-center gap-3 flex-wrap max-w-3xl w-full">
              <Scale size={18} style={{ color: SAGE }} />
              <span className="text-sm font-bold text-stone-700">Compare ({items.length}/3)</span>
              <div className="flex gap-2 flex-wrap flex-1">
                {items.map((p) => <MiniCard key={p._id} product={p} onRemove={(id) => dispatch(removeFromCompare(id))} />)}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => dispatch(clearCompare())} className="text-xs text-stone-400 hover:text-red-500">Clear</button>
                <button onClick={() => dispatch(openComparePanel())}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ background: FOREST }}>
                  <ChevronUp size={14} /> Compare Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => dispatch(closeComparePanel())} />
            <motion.div
              className="fixed inset-4 sm:inset-8 z-50 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                    <Scale size={18} style={{ color: SAGE }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-800">Plant Comparison</h2>
                    <p className="text-xs text-stone-400">{items.length} of 3 plants selected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => dispatch(clearCompare())} className="text-sm text-stone-400 hover:text-red-500">Clear All</button>
                  <button onClick={() => dispatch(closeComparePanel())} className="p-2 rounded-xl text-stone-500 hover:bg-stone-100">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <CompareTable products={products} rows={rows} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
