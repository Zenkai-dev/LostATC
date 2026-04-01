// public/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB83ZIyVgsrjFYkfEHQmPZi8gztIG5Kt14",
  authDomain: "lost-atc.firebaseapp.com",
  projectId: "lost-atc",
  storageBucket: "lost-atc.firebasestorage.app",
  messagingSenderId: "866408232314",
  appId: "1:866408232314:web:ac305e5216cd36e26652c3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

