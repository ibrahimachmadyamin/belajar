import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAg65wTAQDgGNw2I7GOEMo_bBIsto0WrpQ",
  authDomain: "aplikasi-belajar-ai.firebaseapp.com",
  projectId: "aplikasi-belajar-ai",
  storageBucket: "aplikasi-belajar-ai.firebasestorage.app",
  messagingSenderId: "1036600305212",
  appId: "1:1036600305212:web:cda5c66f1036a5e21a4539"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteCollection(collectionName) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  let count = 0;
  
  const promises = [];
  snapshot.forEach((doc) => {
    promises.push(deleteDoc(doc.ref));
    count++;
  });
  
  await Promise.all(promises);
  console.log(`Deleted ${count} documents from '${collectionName}' collection.`);
}

async function main() {
  try {
    console.log("Starting to clear old collections...");
    await deleteCollection("materials");
    await deleteCollection("quizzes");
    await deleteCollection("questions");
    console.log("Database cleared successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing DB:", err);
    process.exit(1);
  }
}

main();
