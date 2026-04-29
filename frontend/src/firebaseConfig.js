import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCtIGS8Z_BzrS6dt4ETNmBD8OX1qhfcn-Q",
  authDomain: "greentrace-8647f.firebaseapp.com",
  projectId: "greentrace-8647f",
  storageBucket: "greentrace-8647f.firebasestorage.app",
  messagingSenderId: "834618421742",
  appId: "1:834618421742:web:73c9be52bd0d26dd1f9eff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
