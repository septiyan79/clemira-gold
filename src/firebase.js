// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJEQgzQm7gm0AR6Mb9GczZGGEVUV95hSU",
  authDomain: "clemiragold-75f94.firebaseapp.com",
  projectId: "clemiragold-75f94",
  storageBucket: "clemiragold-75f94.firebasestorage.app",
  messagingSenderId: "308665491486",
  appId: "1:308665491486:web:855b5573766dc5f596ce0f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };