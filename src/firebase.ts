import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDgHTEVWUePcR3jCzhqQdmoipPvbEwhGfI",
  authDomain: "hskstudyapp.firebaseapp.com",
  projectId: "hskstudyapp",
  storageBucket: "hskstudyapp.firebasestorage.app",
  messagingSenderId: "112693333744",
  appId: "1:112693333744:web:8601d056c2d5764a20bc35",
  measurementId: "G-W6Q3ML7WQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
