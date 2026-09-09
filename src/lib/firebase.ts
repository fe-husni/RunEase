import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence (Firestore IndexedDB)
enableIndexedDbPersistence(db).catch((err: { code: string }) => {
  if (err.code === "failed-precondition") {
    console.warn("[Firebase] Persistence failed: multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("[Firebase] Persistence not available in this browser");
  }
});

// Analytics (only if supported & measurementId present)
let analytics: ReturnType<typeof getAnalytics> | null = null;
isAnalyticsSupported().then((supported) => {
  if (supported && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch {
      // ignore
    }
  }
});
export { analytics };
