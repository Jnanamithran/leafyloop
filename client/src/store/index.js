import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";

import cartReducer from "./slices/cartSlice";
import compareReducer from "./slices/compareSlice";
import { wishlistReducer, userReducer } from "./slices/wishlistUserSlice";

// ─── Persist Configs ────────────────────────────────────────────────────────
const cartPersistConfig   = { key: "cart",     storage, whitelist: ["items", "coupon"] };
const comparePersistConfig = { key: "compare",  storage, whitelist: ["items"] };
const wishlistPersistConfig = { key: "wishlist", storage, whitelist: ["items"] };
const userPersistConfig   = { key: "user",     storage, whitelist: ["token", "refreshToken", "profile"] };

// ─── Root Reducer ────────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  cart:     persistReducer(cartPersistConfig,     cartReducer),
  compare:  persistReducer(comparePersistConfig,  compareReducer),
  wishlist: persistReducer(wishlistPersistConfig, wishlistReducer),
  user:     persistReducer(userPersistConfig,     userReducer),
});

// ─── Store ───────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.MODE !== "production",
});

export const persistor = persistStore(store);

/** Typed helpers (use in components) */
export const selectCart     = (state) => state.cart;
export const selectCompare  = (state) => state.compare;
export const selectWishlist = (state) => state.wishlist;
export const selectUser     = (state) => state.user;
