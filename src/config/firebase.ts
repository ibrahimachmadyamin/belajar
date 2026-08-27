import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAg65wTAQDgGNw2I7GOEMo_bBIsto0WrpQ",
  authDomain: "aplikasi-belajar-ai.firebaseapp.com",
  projectId: "aplikasi-belajar-ai",
  storageBucket: "aplikasi-belajar-ai.firebasestorage.app",
  messagingSenderId: "1036600305212",
  appId: "1:1036600305212:web:cda5c66f1036a5e21a4539"
};

// Mencegah inisialisasi ulang jika app sudah ada (hot reloading di React Native)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
