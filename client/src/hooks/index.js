/**
 * hooks/index.js — collection of all custom React hooks for LeafyLoop
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector }    from "react-redux";
import { useNavigate }                 from "react-router-dom";
import toast                           from "react-hot-toast";
import { useMutation }                 from "@tanstack/react-query";

import { addToCart }                               from "../store/slices/cartSlice";
import { toggleWishlist, selectIsWishlisted }      from "../store/slices/wishlistUserSlice";
import { addToCompare, selectIsInCompare, selectCompareIsFull } from "../store/slices/compareSlice";
import { loginSuccess, logout, selectToken, selectRefreshToken, refreshAccessToken, selectIsLoggedIn }  from "../store/slices/wishlistUserSlice";

// ─── 1. useDebounce ───────────────────────────────────────────────────────────
/**
 * Returns a debounced value that only updates after `delay` ms of silence.
 * Use for search inputs to avoid hammering the API.
 *
 * @param {*}      value - The value to debounce
 * @param {number} delay - Milliseconds (default: 400)
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// ─── 2. useWhatsApp ───────────────────────────────────────────────────────────
const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || "919447000000"; // 91 prefix + number

/**
 * Returns a function that opens a WhatsApp inquiry link for a product.
 * Link: wa.me/{number}?text=I am interested in {name} - {url}
 */
export function useWhatsApp() {
  const inquire = useCallback((product) => {
    const productUrl = `${window.location.origin}/products/${product.slug ?? product._id}`;
    const text       = encodeURIComponent(
      `Hi! I am interested in *${product.name}* — ${productUrl}\nCould you please share more details?`
    );
    const url = `https://wa.me/${WA_NUMBER}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return { inquire };
}

// ─── 3. useAddToCart ─────────────────────────────────────────────────────────
/**
 * Convenience hook for adding items to cart with toast feedback.
 */
export function useAddToCart() {
  const dispatch = useDispatch();

  const addItem = useCallback(
    (product, qty = 1) => {
      if (product.stock === 0) {
        toast.error("This item is out of stock.");
        return;
      }
      dispatch(addToCart({ item: product, qty }));
      toast.success(`${product.name} added to cart! 🛒`, { duration: 2000 });
    },
    [dispatch]
  );

  return { addItem };
}

// ─── 4. useWishlist ───────────────────────────────────────────────────────────
/**
 * Returns wishlist toggle handler with toast + optional server sync.
 */
export function useWishlistToggle(product) {
  const dispatch    = useDispatch();
  const isLoggedIn  = useSelector(selectIsLoggedIn);
  const isWishlisted = useSelector(selectIsWishlisted(product?._id));
  const navigate    = useNavigate();

  const toggle = useCallback(() => {
    if (!isLoggedIn) {
      toast.error("Please login to save items to your wishlist.");
      navigate("/login");
      return;
    }
    dispatch(toggleWishlist(product));
    toast.success(
      isWishlisted ? "Removed from wishlist" : "Added to wishlist ❤️",
      { duration: 1800 }
    );
  }, [dispatch, isLoggedIn, isWishlisted, navigate, product]);

  return { isWishlisted, toggle };
}

// ─── 5. useCompare ────────────────────────────────────────────────────────────
/**
 * Returns compare toggle handler with limit enforcement.
 */
export function useCompareToggle(product) {
  const dispatch   = useDispatch();
  const isInCompare = useSelector(selectIsInCompare(product?._id));
  const isFull     = useSelector(selectCompareIsFull);

  const toggle = useCallback(() => {
    if (isInCompare) {
      const { removeFromCompare } = require("../store/slices/compareSlice");
      dispatch(removeFromCompare(product._id));
      toast("Removed from comparison", { icon: "↩️" });
    } else if (isFull) {
      toast.error("You can compare up to 3 plants at a time.");
    } else {
      dispatch(addToCompare(product));
      toast.success("Added to comparison! 🌿", { duration: 1800 });
    }
  }, [dispatch, isInCompare, isFull, product]);

  return { isInCompare, toggle };
}

// ─── 6. useAuth ──────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function postAuth(endpoint, body) {
  const res  = await fetch(`${API}/auth/${endpoint}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Authentication failed");
  return data;
}

/**
 * Auth hook covering login, register, and logout with Redux state updates.
 */
export function useAuth() {
  const dispatch   = useDispatch();
  const token      = useSelector(selectToken);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const navigate   = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (creds) => postAuth("login", creds),
    onSuccess: (data) => {
      dispatch(loginSuccess({ user: data.user, token: data.token, refreshToken: data.refreshToken }));
      toast.success(`Welcome back, ${data.user.name}! 🌿`);
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: (data) => postAuth("register", data),
    onSuccess: (data) => {
      dispatch(loginSuccess({ user: data.user, token: data.token, refreshToken: data.refreshToken }));
      toast.success(`Account created! Welcome, ${data.user.name} 🌱`);
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const googleMutation = useMutation({
    mutationFn: (idToken) => postAuth("google", { idToken }),
    onSuccess: (data) => {
      dispatch(loginSuccess({ user: data.user, token: data.token, refreshToken: data.refreshToken }));
      toast.success(`Welcome, ${data.user.name}! 🌿`);
      navigate("/");
    },
    onError: (err) => toast.error("Google sign-in failed: " + err.message),
  });

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API}/auth/logout`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn("Logout API call failed (likely token expired), but continuing with local logout");
      }
    }
    dispatch(logout());
    toast.success("Logged out. See you soon! 🌿");
    navigate("/");
  }, [dispatch, navigate, token]);

  return {
    isLoggedIn,
    login:         loginMutation.mutate,
    loginLoading:  loginMutation.isPending,
    register:      registerMutation.mutate,
    registerLoading: registerMutation.isPending,
    googleLogin:   googleMutation.mutate,
    googleLoading: googleMutation.isPending,
    logout:        handleLogout,
  };
}

/**
 * Helper function to refresh an expired token using the refresh token.
 * Call this when you get a 401 Unauthorized response.
 * Returns { token, refreshToken } or throws an error if refresh failed.
 */
export async function refreshUserToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("No refresh token available. Please log in again.");
  }

  try {
    console.log("Attempting to refresh token...");
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Token refresh failed:", data);
      throw new Error(data.message || "Failed to refresh token. Please log in again.");
    }

    if (!data.token) {
      throw new Error("No token received from refresh endpoint");
    }

    console.log("✅ Token refreshed successfully");
    return { token: data.token, refreshToken: data.refreshToken };
  } catch (err) {
    console.error("❌ Token refresh error:", err);
    throw err;
  }
}

// ─── 7. useLocalStorage ───────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((val) => {
    setValue(val);
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key]);

  return [value, set];
}

// ─── 8. useScrollToTop ───────────────────────────────────────────────────────
export function useScrollToTop() {
  const { pathname } = window.location;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
}

// ─── 9. useIntersectionObserver (lazy load / infinite scroll) ────────────────
export function useIntersectionObserver(callback, options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) callback();
    }, { threshold: 0.1, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
}
