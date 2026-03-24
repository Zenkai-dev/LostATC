import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Global variables to store data for instant filtering
let allItems = []; 
let categoryMap = {};

/**
 * 1. THE STARTUP FUNCTION
 * Fetches categories and items from Firestore on page load.
 */
async function loadCatalog() {
    console.log("Initializing Catalog...");
    try {
        // A. Load Categories into the dropdown and our lookup map
        const catSelect = document.getElementById('categoryFilter');
        const catSnapshot = await getDocs(collection(db, "categories"));
        
        catSnapshot.forEach(doc => {
            const data = doc.data();
            categoryMap[doc.id] = data.name; 
            
            // Populate the <select> dropdown
            const opt = document.createElement('option');
            opt.value = String(doc.id); 
            opt.innerHTML = data.name;
            catSelect.appendChild(opt);
        });
        console.log("Categories loaded:", categoryMap);

        // B. Load Items (Showing unapproved items with approval: 0 for now)
        // Note: This requires a Firestore Index (check your console for a link if it fails)
        const q = query(
            collection(db, "items"), 
            where("approval", "==", 0), 
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        allItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log("Items loaded:", allItems.length);

        // C. Initial render of the grid
        renderItems(allItems);

    } catch (e) {
        console.error("Error in loadCatalog:", e);
        document.getElementById('catalog').innerHTML = `<p class="text-danger">Failed to load items. Check console.</p>`;
    }
}

/**
 * 2. THE RENDER FUNCTION
 * Rebuilds the HTML grid whenever items are filtered.
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
        const displayDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Unknown Date";
        
        // Exact HTML structure with Modal triggers
        const itemCard = `
            <div class="p-2 col-6 col-md-4 col-lg-3 ${item.categoryID}">
                <div class="card text-center h-100 shadow-sm" 
                     data-bs-toggle="modal" 
                     data-bs-target="#formModal" 
                     data-item-id="${item.id}"
                     onclick="setupModal('${item.id}')"
                     style="cursor: pointer;">
                    
                    <div style="height: 200px; overflow: hidden;">
                        <img src="${item.photo}" class="card-img-top w-100 h-100" style="object-fit: cover;" alt="${item.name}">
                    </div>

                    <div class="card-body">
                        <h5 class="card-title text-truncate">${item.name}</h5>
                        <p class="text-muted small mb-1">${catName}</p>
                        <p class="small text-muted">Reported: ${displayDate}</p>
                    </div>

                    <div class="card-footer bg-white border-top-0">
                        <p class="m-0 p-0 text-muted small">ID: ${item.id.substring(0, 5)}...</p>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += itemCard;
    });
}

/**
 * 3. FILTER FUNCTION
 * Handles the search input and the category dropdown.
 */
window.filterItems = function() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const catVal = document.getElementById('categoryFilter').value;

    const filtered = allItems.filter(item => {
        // Search by name or description
        const matchesSearch = item.name.toLowerCase().includes(searchVal) || 
                              (item.description && item.description.toLowerCase().includes(searchVal));
        
        // Match category (ensuring we compare strings to strings)
        const itemCatId = String(item.categoryID); 
        const matchesCat = (catVal === "all") || (itemCatId === catVal);

        return matchesSearch && matchesCat;
    });

    renderItems(filtered);
};

/**
 * 4. MODAL POPULATOR
 * Injects the clicked item's data into the modal elements.
 */
window.setupModal = function(itemId) {
    console.log("Setting up modal for:", itemId);
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    // --- Update these IDs to match your Modal's HTML IDs ---
    const modalTitle = document.querySelector('#formModal .modal-title');
    if (modalTitle) modalTitle.innerText = item.name;

    const modalImg = document.getElementById('modalImage'); // Add this ID to your modal img tag
    if (modalImg) modalImg.src = item.photo;

    const modalDesc = document.getElementById('modalDescription'); // Add this ID to your modal p tag
    if (modalDesc) modalDesc.innerText = item.description || "No further details provided.";
};

// Run the initialization
loadCatalog();