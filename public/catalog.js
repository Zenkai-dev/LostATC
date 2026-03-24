import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Global state to store data for filtering without re-fetching from Firestore
let allItems = []; 
let categoryMap = {};

/**
 * 1. INITIAL LOAD
 * Runs once when the page opens.
 */
async function loadCatalog() {
    try {
        // A. Load Categories into the dropdown and the lookup map
        const catSelect = document.getElementById('categoryFilter');
        const catSnapshot = await getDocs(collection(db, "categories"));
        
        catSnapshot.forEach(doc => {
            const data = doc.data();
            categoryMap[doc.id] = data.name; // ID "1" -> "Books"
            
            const opt = document.createElement('option');
            opt.value = String(doc.id); 
            opt.innerHTML = data.name;
            catSelect.appendChild(opt);
        });

        // B. Load Items (Change '0' to '1' if you only want approved items)
        const q = query(collection(db, "items"), where("approval", "==", 0), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        allItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // C. Initial Display
        renderItems(allItems);

    } catch (e) {
        console.error("Error loading catalog:", e);
    }
}

/**
 * 2. RENDER FUNCTION
 * Draws the HTML cards based on whatever array of items we give it.
 */
function renderItems(itemsToDisplay) {
    const container = document.getElementById('catalog');
    container.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        container.innerHTML = '<p class="text-center w-100 mt-5">No items found matching those filters.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const catName = categoryMap[item.categoryID] || "Other";
        const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "N/A";
        
        // Match the structure of your previous card exactly
        const cardHTML = `
            <div class="p-2 col-6 col-md-4 col-lg-3">
                <div class="card text-center h-100 shadow-sm item-card" 
                     data-bs-toggle="modal" 
                     data-bs-target="#formModal" 
                     onclick="setupModal('${item.id}')"
                     style="cursor: pointer;">
                    
                    <img src="${item.photo}" class="card-img-top" style="height:180px; object-fit:cover;" alt="${item.name}">
                    
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="mb-1 text-primary small fw-bold">${catName}</p>
                        <p class="small text-muted">Reported: ${date}</p>
                    </div>
                    
                    <div class="card-footer bg-white border-top-0">
                        <p class="m-0 p-0 text-muted small">ID: ${item.id.substring(0, 5)}...</p>
                    </div>
                </div>
            </div>`;
        
        container.innerHTML += cardHTML;
    });
}

/**
 * 3. FILTER LOGIC
 * Triggered by the search input or dropdown change.
 */
window.filterItems = function() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const catVal = document.getElementById('categoryFilter').value;

    const filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchVal) || 
                              (item.description && item.description.toLowerCase().includes(searchVal));
        
        const itemCatId = String(item.categoryID); 
        const matchesCat = (catVal === "all") || (itemCatId === catVal);

        return matchesSearch && matchesCat;
    });

    renderItems(filtered);
};

/**
 * 4. MODAL POPULATOR
 * Finds the item data and injects it into the modal before it opens.
 */
window.setupModal = function(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    // Assuming your modal has these IDs (Update if different)
    const modalTitle = document.querySelector('#formModal .modal-title');
    const modalBody = document.querySelector('#formModal .modal-body');

    if (modalTitle) modalTitle.innerText = item.name;
    
    // Example: Update specific fields inside your modal body
    // You can customize this HTML based on your modal's actual structure
    const detailImg = document.getElementById('modalItemImage'); // if you have this ID in modal
    if (detailImg) detailImg.src = item.photo;
    
    const detailDesc = document.getElementById('modalItemDescription'); // if you have this ID in modal
    if (detailDesc) detailDesc.innerText = item.description || "No description provided.";
};

// Start the engine
loadCatalog();