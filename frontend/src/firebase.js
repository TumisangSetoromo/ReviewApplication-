// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase config from console
const firebaseConfig = {
  apiKey: "AIzaSyBpM5ERommNfgnCOOAt_tpDeeffe-VPtP8",
  authDomain: "reviewplatform-fbb85.firebaseapp.com",
  projectId: "reviewplatform-fbb85",
  storageBucket: "reviewplatform-fbb85.firebasestorage.app",
  messagingSenderId: "574045707678",
  appId: "1:574045678:web:df489e7b467344bc554a8f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
  