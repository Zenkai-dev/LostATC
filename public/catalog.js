import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadCatalog() {
    const catalogContainer = document.getElementById('catalog');
    
    try {
        // 1. Fetch Categories first to create a "Lookup Table"
        // This maps IDs like "1" to "School Supplies"
        const catSnapshot = await getDocs(collection(db, "categories"));
        const categoryMap = {};
        catSnapshot.forEach(doc => {
            categoryMap[doc.id] = doc.data().name;
        });

        // 2. Fetch approved items, ordered by newest first
        const itemsQuery = query(
            collection(db, "items"), 
            where("approval", "==", 1), // Only show approved items
            orderBy("timestamp", "desc")
        );
        
        const itemSnapshot = await getDocs(itemsQuery);
        catalogContainer.innerHTML = ''; // Clear existing static content

        if (itemSnapshot.empty) {
            catalogContainer.innerHTML = '<p class="text-center w-100">No items found.</p>';
            return;
        }

        itemSnapshot.forEach((doc) => {
            const item = doc.data();
            const itemId = doc.id;
            
            // Format the date (assuming you stored an ISO string)
            const dateObj = new Date(item.timestamp);
            const displayDate = dateObj.toLocaleDateString();

            // Look up the category name using our map
            const categoryName = categoryMap[item.categoryID] || "Uncategorized";

            // 3. Create the HTML Structure
            const itemCard = `
                <div class="p-2 col-6 col-md-4 col-lg-3 ${item.categoryID}">
                    <div class="card text-center h-100 shadow-sm" 
                         data-bs-toggle="modal" 
                         data-bs-target="#formModal" 
                         data-item-id="${itemId}">
                        
                        <div style="height: 200px; overflow: hidden;">
                            <img src="${item.photo}" class="card-img-top w-100 h-100" style="object-fit: cover;" alt="${item.name}">
                        </div>

                        <div class="card-body">
                            <h5 class="card-title text-truncate">${item.name}</h5>
                            <p class="text-muted small">${categoryName}</p>
                            <p class="small">Reported: ${displayDate}</p>
                        </div>

                        <div class="card-footer bg-white border-top-0">
                            <p class="m-0 p-0 text-muted small">ID: ${itemId.substring(0, 5)}...</p>
                        </div>
                    </div>
                </div>
            `;
            
            catalogContainer.innerHTML += itemCard;
        });

    } catch (error) {
        console.error("Error loading catalog:", error);
        catalogContainer.innerHTML = `<p class="text-danger">Error loading items: ${error.message}</p>`;
    }
}

// Initial Load
loadCatalog();