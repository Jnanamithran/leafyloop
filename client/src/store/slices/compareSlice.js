import { createSlice, createSelector } from "@reduxjs/toolkit";

// ─── Constants ───────────────────────────────────────────────────────────────
export const COMPARE_LIMIT = 3;

/**
 * CompareItem shape (subset of Product):
 * { _id, name, price, image, category, height, sunlight, water, rating, stock }
 *
 * Comparison fields displayed in the side-by-side table:
 *   height    → "Plant Height"
 *   sunlight  → "Sunlight Requirement"  (Low / Medium / High / Full Sun)
 *   water     → "Watering Frequency"    (Daily / Weekly / Bi-Weekly)
 *   category  → "Category"
 *   price     → "Price"
 *   rating    → "Avg Rating"
 *   stock     → "Availability"
 */

const initialState = {
  items:       [],    // CompareItem[]  (max COMPARE_LIMIT)
  isPanelOpen: false, // slide-in compare panel
};

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    // ── Add product ─────────────────────────────────────────────────────────
    addToCompare(state, { payload: product }) {
      const alreadyAdded = state.items.some((i) => i._id === product._id);
      if (alreadyAdded || state.items.length >= COMPARE_LIMIT) return;

      // Store only the fields we need for comparison
      const {
        _id, name, price, image, category,
        height, sunlight, water, rating, stock,
      } = product;

      state.items.push({ _id, name, price, image, category, height, sunlight, water, rating, stock });
      state.isPanelOpen = true;
    },

    // ── Remove product ──────────────────────────────────────────────────────
    removeFromCompare(state, { payload: id }) {
      state.items = state.items.filter((i) => i._id !== id);
      if (state.items.length === 0) state.isPanelOpen = false;
    },

    // ── Clear all ───────────────────────────────────────────────────────────
    clearCompare(state) {
      state.items      = [];
      state.isPanelOpen = false;
    },

    // ── Toggle panel ────────────────────────────────────────────────────────
    openComparePanel(state)  { state.isPanelOpen = true;  },
    closeComparePanel(state) { state.isPanelOpen = false; },
  },
});

export const {
  addToCompare, removeFromCompare, clearCompare,
  openComparePanel, closeComparePanel,
} = compareSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCompareItems     = (state) => state.compare.items;
export const selectCompareCount     = (state) => state.compare.items.length;
export const selectCompareIsFull    = (state) => state.compare.items.length >= COMPARE_LIMIT;
export const selectComparePanelOpen = (state) => state.compare.isPanelOpen;

/** Check if a specific product is in the compare list */
export const selectIsInCompare = (id) => (state) =>
  state.compare.items.some((i) => i._id === id);

/**
 * Returns a structured comparison matrix for the table UI.
 * Shape: { fields: FieldDef[], rows: Row[] }
 * Memoized to prevent unnecessary rerenders when equivalent data is selected.
 */
export const selectCompareMatrix = createSelector(
  [selectCompareItems],
  (items) => {
    const fields = [
      { key: "category", label: "Category" },
      { key: "price",    label: "Price",   format: (v) => `₹${v.toLocaleString("en-IN")}` },
      { key: "height",   label: "Height" },
      { key: "sunlight", label: "Sunlight" },
      { key: "water",    label: "Watering" },
      { key: "rating",   label: "Rating",  format: (v) => `${v} ★` },
      { key: "stock",    label: "Stock",   format: (v) => v > 0 ? `In Stock (${v})` : "Out of Stock" },
    ];

    const rows = fields.map(({ key, label, format }) => ({
      label,
      values: items.map((item) => {
        const raw = item[key];
        return format ? format(raw ?? "—") : (raw ?? "—");
      }),
    }));

    return { products: items, rows };
  }
);

export default compareSlice.reducer;
