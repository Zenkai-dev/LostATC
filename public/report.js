// public/report.js
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/df2tdfrwq/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'ypoylpgu';

// 1. Load Categories
async function loadCategories() {
    const select = document.getElementById('postCategoryID');
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        
        // Clear the "Loading..." state if you have one, 
        // but keep the first "Select..." option if you want.
        
        if (querySnapshot.empty) {
            console.warn("No categories found in Firestore!");
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Loading Category ID:", doc.id, "Content:", data);

            const opt = document.createElement('option');
            opt.value = doc.id; 
            
            // Using a fallback string helps identify if the 'name' field is missing
            opt.innerHTML = data.name || data.Name || "Unnamed Category";
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Error loading categories:", e);
    }
}

// 2. Attach function to window so the HTML button can find it
window.postItemProfile = async function() {
    const name = document.getElementById('postName').value;
    const categoryID = document.getElementById('postCategoryID').value;
    const description = document.getElementById('postDescription').value;
    const photoFile = document.getElementById('postPhoto').files[0];

    if (!name || !photoFile) {
        alert("Please fill in required fields.");
        return;
    }

    try {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const imageData = await res.json();
        
        // Save to Firestore
        await addDoc(collection(db, "items"), {
            name: name,
            categoryID: categoryID,
            description: description,
            photo: imageData.secure_url, 
            approval: 0,
            timestamp: new Date().toISOString()
        });

        alert("Item reported!");
        location.reload();
    } catch (error) {
        console.error("Submission error:", error);
    }
};

// Run category loader immediately
loadCategories();