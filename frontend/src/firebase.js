// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZtODkly--QsrzymvypHy2DBuxA-5MEss",
  authDomain: "recipe-fsd.firebaseapp.com",
  projectId: "recipe-fsd",
  storageBucket: "recipe-fsd.firebasestorage.app",
  messagingSenderId: "1014370878243",
  appId: "1:1014370878243:web:7293f928adb7e4f6d74296"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);