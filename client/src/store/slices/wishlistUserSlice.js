import { createSlice } from "@reduxjs/toolkit";

// ─── Wishlist Slice ───────────────────────────────────────────────────────────
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { items: [] }, // WishlistItem[]
  reducers: {
    toggleWishlist(state, { payload: product }) {
      const idx = state.items.findIndex((i) => i._id === product._id);
      if (idx !== -1) {
        state.items.splice(idx, 1);
      } else {
        const { _id, name, price, image, category, rating } = product;
        state.items.push({ _id, name, price, image, category, rating });
      }
    },
    setWishlist(state, { payload: items }) {
      state.items = items; // sync from server on login
    },
    clearWishlist(state) {
      state.items = [];
    },
  },
});

export const { toggleWishlist, setWishlist, clearWishlist } = wishlistSlice.actions;

export const selectWishlistItems  = (state) => state.wishlist.items;
export const selectWishlistCount  = (state) => state.wishlist.items.length;
export const selectIsWishlisted   = (id) => (state) =>
  state.wishlist.items.some((i) => i._id === id);

export const wishlistReducer = wishlistSlice.reducer;

// ─── User Slice ───────────────────────────────────────────────────────────────
const userSlice = createSlice({
  name: "user",
  initialState: {
    profile:      null,  // { _id, name, email, avatar, role }
    token:        null,  // JWT access token
    refreshToken: null,
    isLoading:    false,
    error:        null,
  },
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error     = null;
    },
    loginSuccess(state, { payload: { user, token, refreshToken } }) {
      state.profile      = user;
      state.token        = token;
      state.refreshToken = refreshToken;
      state.isLoading    = false;
      state.error        = null;
    },
    loginFailure(state, { payload: error }) {
      state.isLoading = false;
      state.error     = error;
    },
    logout(state) {
      state.profile      = null;
      state.token        = null;
      state.refreshToken = null;
      state.error        = null;
    },
    updateProfile(state, { payload }) {
      state.profile = { ...state.profile, ...payload };
    },
    refreshAccessToken(state, { payload: token }) {
      state.token = token;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  loginStart, loginSuccess, loginFailure,
  logout, updateProfile, refreshAccessToken, clearError,
} = userSlice.actions;

export const selectUser        = (state) => state.user.profile;
export const selectToken       = (state) => state.user.token;
export const selectRefreshToken = (state) => state.user.refreshToken;
export const selectIsLoggedIn  = (state) => !!state.user.token;
export const selectIsAdmin     = (state) => state.user.profile?.role === "admin";
export const selectUserLoading = (state) => state.user.isLoading;
export const selectUserError   = (state) => state.user.error;

export const userReducer = userSlice.reducer;

// ─── Default exports ──────────────────────────────────────────────────────────
export default { wishlistReducer, userReducer };
