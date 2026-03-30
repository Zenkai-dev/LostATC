// 1. Unified Imports at the top
import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    addDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allItems = []; 
let categoryMap = {};

/**
 * STARTUP: Load Categories and Items
 */
async function loadCatalog() {
    try {
        const catSelect = document.getElementById('categoryFilter');
        const catSnapshot = await getDocs(collection(db, "categories"));
        
        catSnapshot.forEach(doc => {
            const data = doc.data();
            categoryMap[doc.id] = data.name; 
            const opt = document.createElement('option');
            opt.value = String(doc.id); 
            opt.innerHTML = data.name;
            catSelect.appendChild(opt);
        });

        const q = query(collection(db, "items"), where("approval", "==", 1), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        allItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderItems(allItems);
    } catch (e) {
        console.error("Error loading catalog:", e);
    }
}

/**
 * RENDER: Create the HTML Cards
 */
function renderItems(itemsToDisplay) {
    const container = document.getElementById('catalog');
    container.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        container.innerHTML = '<p class="text-center w-100 mt-5">No items found.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const catName = categoryMap[item.categoryID] || "Other";
        const displayDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Unknown";
        
        container.innerHTML += `
            <div class="p-2 col-6 col-md-4 col-lg-3 ${item.categoryID}">
                <div class="card text-center h-100 shadow-sm" 
                     data-bs-toggle="modal" 
                     data-bs-target="#formModal" 
                     onclick="setupModal('${item.id}')"
                     style="cursor: pointer;">
                    <div style="height: 200px; overflow: hidden;">
                        <img src="${item.photo}" class="card-img-top w-100 h-100" style="object-fit: cover;">
                    </div>
                    <div class="card-body">
                        <h5 class="card-title text-truncate">${item.name}</h5>
                        <p class="text-muted small mb-1">${catName}</p>
                        <p class="small text-muted">Reported: ${displayDate}</p>
                    </div>
                </div>
            </div>`;
    });
}

/**
 * FILTER: Search and Category dropdown
 */
window.filterItems = function() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const catVal = document.getElementById('categoryFilter').value;

    const filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchVal) || 
                              (item.description && item.description.toLowerCase().includes(searchVal));
        const matchesCat = (catVal === "all") || (String(item.categoryID) === catVal);
        return matchesSearch && matchesCat;
    });
    renderItems(filtered);
};

/**
 * MODAL SETUP: Fill hidden ID and Title
 */
window.setupModal = function(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('formModalLabel').innerText = `Claim or Inquire: ${item.name}`;
    document.getElementById('postItemID').value = itemId;
    document.getElementById('PostOutput').innerHTML = "";
};

/**
 * SUBMIT CLAIM: Send to Firestore
 */
window.postClaimORInquiry = async function() {
    const output = document.getElementById('PostOutput');
    const itemId = document.getElementById('postItemID').value;
    const firstName = document.getElementById('postFName').value;
    const lastName = document.getElementById('postLName').value;
    const email = document.getElementById('postEmail').value;
    const type = document.getElementById('postCI').value;
    const inquiryText = document.getElementById('postInquiry').value;

    if (!firstName || !lastName || !email) {
        output.innerHTML = "<span class='text-danger'>Please fill out all required fields.</span>";
        return;
    }

    try {
        output.innerHTML = "Submitting...";
        await addDoc(collection(db, "claims"), {
            itemId: itemId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            requestType: type === "0" ? "Claim" : "Inquiry",
            message: inquiryText || "",
            timestamp: new Date().toISOString(),
            status: "pending"
        });

        output.innerHTML = "<span class='text-success'>Submitted!</span>";
        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
            document.querySelector('#formModal form').reset();
            document.getElementById('inquiry').classList.add('d-none'); // Hide textarea again
        }, 1500);

    } catch (e) {
        output.innerHTML = "<span class='text-danger'>Error. Try again.</span>";
    }
};

/**
 * UI HELPER: Toggle Inquiry Textarea
 */
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'postCI') {
        const inquiryDiv = document.getElementById('inquiry');
        e.target.value === "1" ? inquiryDiv.classList.remove('d-none') : inquiryDiv.classList.add('d-none');
    }
});

loadCatalog();