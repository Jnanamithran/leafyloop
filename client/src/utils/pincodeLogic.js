/**
 * pincodeLogic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utility for Indian Pincode validation and dynamic shipping cost calculation.
 *
 * Shipping Rules (LeafyLoop):
 *   City  === "Trivandrum" → ₹0   (Free Local Delivery)
 *   State === "Kerala"     → ₹50  (Kerala Delivery)
 *   Else                   → ₹100 (Pan-India Delivery)
 *
 * API: https://api.postalpincode.in/pincode/{pincode}
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PINCODE_API = "https://api.postalpincode.in/pincode";

// ─── Shipping Tiers ───────────────────────────────────────────────────────────
export const SHIPPING_TIERS = Object.freeze({
  FREE:   { cost: 0,   label: "Free Delivery 🎉",        key: "free" },
  KERALA: { cost: 50,  label: "Kerala Delivery — ₹50",   key: "kerala" },
  INDIA:  { cost: 100, label: "Pan-India Delivery — ₹100", key: "india" },
});

// ─── Core lookup ─────────────────────────────────────────────────────────────
/**
 * Fetches post-office data for a 6-digit Indian pincode.
 *
 * @param {string} pincode  - 6-digit string
 * @returns {Promise<PincodeResult>}
 *
 * PincodeResult:
 * {
 *   success:  boolean,
 *   pincode:  string,
 *   city:     string | null,    // District name
 *   state:    string | null,
 *   offices:  PostOffice[],
 *   error?:   string,
 * }
 */
export async function lookupPincode(pincode) {
  const clean = String(pincode).trim();

  // ── 1. Client-side format validation ───────────────────────────────────────
  if (!/^\d{6}$/.test(clean)) {
    return {
      success: false,
      pincode: clean,
      city: null,
      state: null,
      offices: [],
      error: "Pincode must be exactly 6 digits.",
    };
  }

  // ── 2. Network call ────────────────────────────────────────────────────────
  let data;
  try {
    const res = await fetch(`${PINCODE_API}/${clean}`, {
      signal: AbortSignal.timeout(8000), // 8 s timeout
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    return {
      success: false,
      pincode: clean,
      city: null,
      state: null,
      offices: [],
      error: err.name === "TimeoutError"
        ? "Request timed out. Please check your connection."
        : "Unable to reach the delivery service. Please try again.",
    };
  }

  // ── 3. Parse API response ──────────────────────────────────────────────────
  // API returns an array; first element has { Status, PostOffice[] }
  const result = Array.isArray(data) ? data[0] : data;

  if (!result || result.Status !== "Success" || !result.PostOffice?.length) {
    return {
      success: false,
      pincode: clean,
      city: null,
      state: null,
      offices: [],
      error: "Pincode not found. Please verify and try again.",
    };
  }

  const offices = result.PostOffice;
  const primary = offices[0]; // use first post office as primary

  return {
    success: true,
    pincode: clean,
    city:    primary.District ?? primary.Name,
    state:   primary.State,
    offices,
    error:   undefined,
  };
}

// ─── Shipping Calculator ──────────────────────────────────────────────────────
/**
 * Calculates shipping cost based on city/state.
 * Can be used standalone if you already have city & state.
 *
 * @param {string} city
 * @param {string} state
 * @returns {{ cost: number, label: string, key: string }}
 */
export function calculateShipping(city, state) {
  const normalCity  = (city  ?? "").trim().toLowerCase();
  const normalState = (state ?? "").trim().toLowerCase();

  const TRIVANDRUM_ALIASES = [
    "trivandrum", "thiruvananthapuram", "thiruvananthapuram district",
  ];

  if (TRIVANDRUM_ALIASES.includes(normalCity)) return SHIPPING_TIERS.FREE;
  if (normalState === "kerala")                 return SHIPPING_TIERS.KERALA;
  return SHIPPING_TIERS.INDIA;
}

// ─── Combined resolver ────────────────────────────────────────────────────────
/**
 * Full workflow: pincode → validate → fetch → calculate shipping.
 *
 * @param {string} pincode
 * @returns {Promise<ShippingResolution>}
 *
 * ShippingResolution:
 * {
 *   success:  boolean,
 *   pincode:  string,
 *   city:     string | null,
 *   state:    string | null,
 *   cost:     number,
 *   label:    string,
 *   key:      string,
 *   error?:   string,
 * }
 */
export async function resolveShipping(pincode) {
  const result = await lookupPincode(pincode);

  if (!result.success) {
    return {
      success: false,
      pincode: result.pincode,
      city:    null,
      state:   null,
      cost:    0,
      label:   "",
      key:     "",
      error:   result.error,
    };
  }

  const shipping = calculateShipping(result.city, result.state);

  return {
    success: true,
    pincode: result.pincode,
    city:    result.city,
    state:   result.state,
    ...shipping,
  };
}

// ─── Formatter ────────────────────────────────────────────────────────────────
/**
 * Human-readable summary of the shipping resolution.
 * Used in UI toast messages.
 */
export function formatShippingSummary(resolution) {
  if (!resolution.success) return resolution.error;
  const costStr = resolution.cost === 0 ? "FREE" : `₹${resolution.cost}`;
  return `Delivering to ${resolution.city}, ${resolution.state} — Shipping: ${costStr}`;
}
