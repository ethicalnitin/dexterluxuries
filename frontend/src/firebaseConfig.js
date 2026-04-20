import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7ghyEZQdGR_u5NpdjNY9MEO4pdT3T9rQ",
  authDomain: "dextersenior-1fa32.firebaseapp.com",
  projectId: "dextersenior-1fa32",
  storageBucket: "dextersenior-1fa32.firebasestorage.app",
  messagingSenderId: "215087597404",
  appId: "1:215087597404:web:b31814cab0a1dbfb2fe399",
  measurementId: "G-7H0WQ22RX5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);