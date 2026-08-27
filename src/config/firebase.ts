import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase dari variabel environment
// Pastikan Anda membuat file .env di root folder dengan isi variabel ini
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "API_KEY_PLACEHOLDER",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "PROJECT_ID.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "PROJECT_ID",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "PROJECT_ID.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "APP_ID"
};

// Mencegah inisialisasi ulang jika app sudah ada (hot reloading di React Native)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
