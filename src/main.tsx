import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Canonical host: Firebase Hosting menyajikan app yang sama di *.web.app dan
// *.firebaseapp.com, tapi auth/IndexedDB/PWA bersifat per-origin. Paksa satu
// origin (web.app) sebelum hal lain jalan — JANGAN hapus.
(function enforceCanonicalHost() {
  try {
    const host = window.location.hostname;
    const suffix = ".firebaseapp.com";
    if (host.endsWith(suffix)) {
      const canonical = host.slice(0, -suffix.length) + ".web.app";
      window.location.replace(
        window.location.protocol +
          "//" +
          canonical +
          window.location.pathname +
          window.location.search +
          window.location.hash
      );
    }
  } catch {
    // Jangan pernah blokir boot karena guard ini.
  }
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
