import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allItems = []; // Global array to hold our data
let categoryMap = {};

async function loadCatalog() {
    try {
        // 1. Fetch Categories
        const catSnapshot = await getDocs(collection(db, "categories"));
        catSnapshot.forEach(doc => {
            categoryMap[doc.id] = doc.data().name;
        });

        // 2. Fetch all approved items once
        const q = query(collection(db, "items"), where("approval", "==", 1), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        // Store items in our global array
        allItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 3. Initial Render
        renderItems(allItems);
    } catch (e) {
        console.error("Load error:", e);
    }
}

// Function to actually draw the HTML cards
function renderItems(itemsToDisplay) {
    const container = document.getElementById('catalog');
    container.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        container.innerHTML = '<p class="text-center w-100 mt-4">No items match your search.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const catName = categoryMap[item.categoryID] || "Other";

        container.innerHTML += `
            <div class="p-2 col-6 col-md-4 col-lg-3">
                <div class="card text-center h-100 shadow-sm" data-bs-toggle="modal" data-bs-target="#formModal" data-item-id="${item.id}">
                    <img src="${item.photo}" class="card-img-top" style="height:150px; object-fit:cover;">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="mb-1">${catName}</p>
                        <p class="small text-muted">Reported: ${date}</p>
                    </div>
                    <div class="card-footer small text-muted">ID: ${item.id.substring(0,5)}</div>
                </div>
            </div>`;
    });
}

// 4. The Filter Logic
window.filterItems = function() {
    const searchTerm = document.querySelector('input[placeholder="Search items..."]').value.toLowerCase();
    const selectedCat = document.querySelector('select').value;

    const filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                              (item.description && item.description.toLowerCase().includes(searchTerm));
        
        // Check if category matches (handling string vs number)
        const matchesCat = (selectedCat === "all") || (String(item.categoryID) === selectedCat);

        return matchesSearch && matchesCat;
    });

    renderItems(filtered);
};

loadCatalog();