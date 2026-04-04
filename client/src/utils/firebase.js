/**
 * client/src/utils/firebase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase SDK initialisation + Google OAuth sign-in utility.
 * Returns the Firebase ID token which the backend verifies via Firebase Admin.
 */

import { initializeApp }              from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import toast from "react-hot-toast";

// ─── Config ───────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:      import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("❌ Firebase configuration incomplete:", {
    hasApiKey:     !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId:  !!firebaseConfig.projectId,
    hasAppId:      !!firebaseConfig.appId,
  });
}

// ─── Initialise ───────────────────────────────────────────────────────────────
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

provider.addScope("email");
provider.addScope("profile");

// ─── Google Sign-In ───────────────────────────────────────────────────────────
/**
 * Opens a Google sign-in popup and returns the Firebase ID token.
 * The ID token is sent to our backend for verification and JWT issuance.
 *
 * @returns {Promise<string | null>}  Firebase ID token, or null on failure.
 */
export async function signInWithGoogle() {
  try {
    // Suppress COOP warning - it's expected behavior during popup auth
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.includes?.("Cross-Origin-Opener-Policy")) return;
      originalWarn(...args);
    };

    try {
      const result  = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      return idToken;
    } finally {
      console.warn = originalWarn;
    }
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") {
      // User closed the popup — silent fail
      return null;
    }
    if (err.code === "auth/cancelled-popup-request") {
      return null;
    }
    console.error("[Firebase Google Sign-In]", err);
    toast.error("Google sign-in failed. Please try again.");
    return null;
  }
}

/**
 * Signs the user out of Firebase (client-side only).
 * The backend JWT invalidation is handled separately via /api/auth/logout.
 */
export async function signOutFirebase() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("[Firebase Sign-Out]", err);
  }
}

export { auth };
