import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allItems = []; 
let categoryMap = {};

async function loadCatalog() {
    console.log("Starting catalog load...");
    try {
        // 1. Load Categories and Fill the Dropdown
        const catSelect = document.getElementById('categoryFilter');
        const catSnapshot = await getDocs(collection(db, "categories"));
        
        catSnapshot.forEach(doc => {
            const data = doc.data();
            categoryMap[doc.id] = data.name;
            
            // Add to dropdown dynamically
            const opt = document.createElement('option');
            opt.value = doc.id;
            opt.innerHTML = data.name;
            catSelect.appendChild(opt);
        });
        console.log("Categories loaded:", categoryMap);

        // 2. Load Items (Check if approval is 0 or 1 based on your current data!)
        const q = query(collection(db, "items"), where("approval", "==", 0), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        allItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log("Items loaded from Firestore:", allItems);

        // 3. Initial Display
        renderItems(allItems);

    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
}

function renderItems(itemsToDisplay) {
    const container = document.getElementById('catalog');
    container.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        container.innerHTML = '<p class="text-center w-100 mt-4">No items found matching those filters.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const catName = categoryMap[item.categoryID] || "Other";
        
        // Ensure photo exists or use a placeholder
        const photoUrl = item.photo || "https://via.placeholder.com/150";

        container.innerHTML += `
            <div class="p-2 col-6 col-md-4 col-lg-3">
                <div class="card text-center h-100 shadow-sm">
                    <img src="${photoUrl}" class="card-img-top" style="height:150px; object-fit:cover;">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="mb-1 text-muted">${catName}</p>
                    </div>
                </div>
            </div>`;
    });
}

// Global filter function
window.filterItems = function() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const catVal = document.getElementById('categoryFilter').value;

    const filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchVal);
        const matchesCat = (catVal === "all") || (String(item.categoryID) === catVal);
        return matchesSearch && matchesCat;
    });

    renderItems(filtered);
};

loadCatalog();