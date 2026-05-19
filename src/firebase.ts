import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import { Capacitor } from '@capacitor/core';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// ─── Capacitor WebView sessionStorage fix ────────────────────────────────────
// Problem: Firebase signInWithRedirect saves "pending redirect" state in
// sessionStorage. Capacitor WebView clears sessionStorage when navigating away
// (e.g. to firebaseapp.com for auth), causing "missing initial state" on return.
// Fix: Mirror all firebase: keys between sessionStorage ↔ localStorage so they
// survive full-page navigation. Must run BEFORE Firebase initializes.
if (Capacitor.isNativePlatform()) {
  const FB = 'firebase:';

  // Step 1 – Restore firebase keys from localStorage into sessionStorage on startup.
  // This runs when the app (re)loads after returning from the auth redirect.
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(FB)) {
      const v = localStorage.getItem(k);
      if (v !== null) sessionStorage.setItem(k, v);
    }
  }

  // Step 2 – Intercept sessionStorage writes/removes to keep localStorage in sync.
  const _set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key: string, value: string) {
    _set.call(this, key, value);
    if (this === sessionStorage && key.startsWith(FB)) {
      _set.call(localStorage, key, value);
    }
  };

  const _remove = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function (key: string) {
    _remove.call(this, key);
    if (this === sessionStorage && key.startsWith(FB)) {
      _remove.call(localStorage, key);
    }
  };
}
// ─────────────────────────────────────────────────────────────────────────────

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Messaging — only available in browsers that support it (not SSR/Node)
export const messagingPromise = isSupported().then((supported) =>
  supported ? getMessaging(app) : null
);
