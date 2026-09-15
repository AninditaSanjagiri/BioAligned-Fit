import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFZJmCGI77nkFdynFR-XZVespwHOHwM3Y",
  authDomain: "bioaligned-fit.firebaseapp.com",
  projectId: "bioaligned-fit",
  storageBucket: "bioaligned-fit.firebasestorage.app",
  messagingSenderId: "943491915561",
  appId: "1:943491915561:web:25d62f66fc3b68b9b66138",
  measurementId: "G-JTLYNX9XE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export the Auth service so Login.jsx can use it
export const auth = getAuth(app);
export const db = getFirestore(app);