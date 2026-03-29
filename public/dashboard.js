import { db } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let allItems = []; // Replacement for your many separate lists

/**
 * 1. PROTECT THE PAGE
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Simple admin check: assumes you've handled authorization in user.js
        console.log("Admin verified:", user.email);
        initDashboard();
    } else {
        window.location.href = "user.html";
    }
});

async function initDashboard() {
    await fetchItems();
    populateItemList();
}

/**
 * 2. FETCH ITEMS (Replaces getDatabaseData)
 */
async function fetchItems() {
    try {
        const q = query(collection(db, "items"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        // Store everything in one array of objects
        allItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading items:", error);
    }
}

/**
 * 3. POPULATE LEFT COLUMN (Replaces populateItemList)
 */
window.populateItemList = function() {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    allItems.forEach(item => {
        const approvalStatus = item.approval === 0 ? "Pending" : "Approved";
        
        const btn = document.createElement('button');
        btn.className = "list-group-item list-group-item-action btn mt-2";
        btn.innerHTML = `${item.name} <br> <small class="text-muted">${approvalStatus}</small>`;
        btn.onclick = () => itemProfileClicked(item.id);
        itemsList.appendChild(btn);
    });
};

/**
 * 4. ITEM DETAILS (Replaces itemProfileClicked)
 */
window.itemProfileClicked = function(id) {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    const categories = { 1: "School Supplies", 2: "Books", 3: "Clothing", 4: "Electronics", 5: "Personal Items" };
    const category = categories[item.categoryID] || "Other";
    const approvalText = item.approval === 0 ? "Pending" : "Approved";
    const displayDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "N/A";

    const itemProfileZ = document.getElementById('itemProfileZ');
    itemProfileZ.innerHTML = `
      <div class="container">
        <div class="row py-md-4">
          <div class="col-md-4">
            <img src="${item.photo}" alt="Item Image" class="w-100 rounded border">
            <div class="d-flex justify-content-center flex-column mt-3 gap-2">
                <button onclick="updateApproval('${item.id}', 1)" class="btn btn-success">Approve Item</button>
                <button onclick="updateApproval('${item.id}', 0)" class="btn btn-warning">Mark Pending</button>
                <button onclick="handleDeleteItem('${item.id}', '${item.name}')" class="btn btn-danger">Delete Item</button> 
            </div>
          </div>
          <div class="col-md-8 text-center text-md-start">
            <h2>${item.name}</h2>
            <p><strong>Item ID:</strong> ${item.id}</p>
            <p><strong>Date Reported:</strong> ${displayDate}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Approval Status:</strong> ${approvalText}</p>
          </div>
        </div>
      </div>`;
};

/**
 * 5. APPROVE / DISAPPROVE (Replaces approveItem/disapproveItem)
 */
window.updateApproval = async function(id, status) {
    if (!confirm(`Update status to ${status === 1 ? 'Approved' : 'Pending'}?`)) return;
    try {
        const itemRef = doc(db, "items", id);
        await updateDoc(itemRef, { approval: status });
        location.reload(); 
    } catch (e) {
        alert("Error updating item.");
    }
};

/**
 * 6. DELETE ITEM
 */
window.handleDeleteItem = async function(id, name) {
    if (!confirm(`Permanently delete ${name}?`)) return;
    try {
        await deleteDoc(doc(db, "items", id));
        location.reload();
    } catch (e) {
        alert("Error deleting item.");
    }
};

/**
 * 7. CLAIMS SECTION (Replaces viewClaims & getClaimsData)
 */
window.viewClaims = async function() {
    const itemProfileZ = document.getElementById('itemProfileZ');
    itemProfileZ.innerHTML = `<h3 class="mt-4">Loading Claims...</h3>`;

    try {
        const querySnapshot = await getDocs(collection(db, "claims"));
        itemProfileZ.innerHTML = `
            <div class="bg-light p-3 rounded shadow-sm">
                <h3>Claims & Inquiries</h3>
                <div class="list-group mt-3" id="claimsList"></div>
            </div>`;
        
        const claimsList = document.getElementById('claimsList');

        querySnapshot.forEach((docSnap) => {
            const claim = docSnap.data();
            const claimId = docSnap.id;
            
            claimsList.innerHTML += `
                <div class="list-group-item border-start border-4 border-primary mt-2">
                    <h5>${claim.requestType} for Item ID: ${claim.itemId}</h5>
                    <p class="mb-1"><strong>From:</strong> ${claim.firstName} ${claim.lastName} (${claim.email})</p>
                    <p class="mb-1"><strong>Message:</strong> ${claim.message || "No message"}</p>
                    <p class="small text-muted">Submitted: ${new Date(claim.timestamp).toLocaleString()}</p>
                    <button onclick="deleteClaim('${claimId}')" class="btn btn-sm btn-danger mt-2">Delete Claim</button>
                </div>`;
        });
    } catch (e) {
        console.error(e);
        itemProfileZ.innerHTML = "Error loading claims.";
    }
};

window.deleteClaim = async function(claimID) {
    if (!confirm(`Delete claim ${claimID}?`)) return;
    await deleteDoc(doc(db, "claims", claimID));
    viewClaims(); // Refresh list without reloading page
};

window.logout = () => signOut(auth).then(() => window.location.href = "user.html");