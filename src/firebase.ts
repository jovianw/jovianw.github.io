import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQg_IiP55Vd0X0po3UH2wxWh3ZTVTabe0",
  authDomain: "portfolio-fe858.firebaseapp.com",
  projectId: "portfolio-fe858",
  storageBucket: "portfolio-fe858.appspot.com",
  messagingSenderId: "904802768677",
  appId: "1:904802768677:web:93753808ade960519e6ccc",
  measurementId: "G-YD0GRR9CTL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const db = getFirestore(app);
