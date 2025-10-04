import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-sYppk20SbhVsK64f-6TqjNHl_bLEdi4",
  authDomain: "project-647428543613.firebaseapp.com",
  projectId: "project-647428543613",
  storageBucket: "project-647428543613.appspot.com",
  messagingSenderId: "647428543613",
  appId: "new-greentrace-473618"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
