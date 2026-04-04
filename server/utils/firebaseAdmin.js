/**
 * server/utils/firebaseAdmin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Initialises Firebase Admin SDK once (singleton pattern).
 * Used by authRoutes.js to verify Google OAuth ID tokens.
 *
 * Setup:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Generate a new private key (downloads JSON)
 *   3. Base64-encode the JSON:
 *      Linux/Mac: base64 -i serviceAccountKey.json
 *      Windows:   certutil -encode serviceAccountKey.json out.b64
 *   4. Set FIREBASE_SERVICE_ACCOUNT_BASE64 in .env
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized || getApps().length > 0) return;

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!b64) {
    console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_BASE64 not set — Google OAuth will not work.");
    return;
  }

  try {
    const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
    initialized = true;
    console.log("✅ Firebase Admin initialised");
  } catch (err) {
    console.error("❌ Firebase Admin init failed:", err.message);
  }
}
