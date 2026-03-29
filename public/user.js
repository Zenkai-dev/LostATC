import { db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();

window.loginAdmin = async function() {
    const email = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const btn = document.querySelector('.btn-txt');

    try {
        btn.innerText = "Checking Permissions...";
        
        // 1. Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // 2. Check the 'admins' collection for this specific UID
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
            // Success! They are an authorized admin
            console.log("Welcome,", adminSnap.data().role);
            window.location.href = "dashboard.html";
        } else {
            // They have an account, but they aren't an admin
            await auth.signOut(); // Kick them out immediately
            alert("Access Denied: You are not authorized to view the dashboard.");
            btn.innerText = "Login";
        }

    } catch (error) {
        console.error("Login error:", error);
        alert("Invalid login credentials.");
        btn.innerText = "Login";
    }
};