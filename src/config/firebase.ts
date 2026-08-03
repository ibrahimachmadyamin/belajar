import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAg65wTAQDgGNw2I7GOEMo_bBIsto0WrpQ",
  authDomain: "aplikasi-belajar-ai.firebaseapp.com",
  projectId: "aplikasi-belajar-ai",
  storageBucket: "aplikasi-belajar-ai.firebasestorage.app",
  messagingSenderId: "1036600305212",
  appId: "1:1036600305212:web:cda5c66f1036a5e21a4539"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp };
