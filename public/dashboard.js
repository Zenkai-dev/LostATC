import { db } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let allItems = [];

/**
 * 1. THE SECURITY GUARD (Runs on Page Load)
 */
onAuthStateChanged(auth, async (user) => {
    const adminContent = document.getElementById('adminContent');
    
    if (user) {
        try {
            // Check the 'admins' collection for this specific UID
            const adminRef = doc(db, "admins", user.uid);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
                console.log("Welcome Admin:", user.email);
                // SHOW the dashboard and load data
                if(adminContent) adminContent.style.display = "block";
                await refreshData();
            } else {
                console.error("Authenticated but not an admin.");
                alert("Access Denied: You are not on the authorized admin list.");
                await signOut(auth);
                window.location.href = "user.html";
            }
        } catch (error) {
            console.error("Security check failed:", error);
            window.location.href = "user.html";
        }
    } else {
        // No user logged in at all
        window.location.href = "user.html";
    }
});

/**
 * 2. FETCH & RENDER ITEMS (Left Column)
 */
window.refreshData = async function() {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = `<div class="p-3 text-muted">Updating...</div>`;

    try {
        const q = query(collection(db, "items"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        allItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        itemsList.innerHTML = ''; 
        if (allItems.length === 0) {
            itemsList.innerHTML = '<p class="p-3 text-muted">No items found.</p>';
            return;
        }

        allItems.forEach(item => {
            const isApproved = item.approval === 1;
            const statusText = isApproved ? "Approved" : "Pending";
            const statusClass = isApproved ? "text-success" : "text-warning";

            itemsList.innerHTML += `
                <button class="list-group-item list-group-item-action btn mt-2 shadow-sm" 
                        onclick="itemProfileClicked('${item.id}')">
                    <div class="fw-bold">${item.name}</div>
                    <small class="${statusClass}">${statusText}</small>
                </button>`;
        });
    } catch (e) {
        console.error("Load Items Error:", e);
        itemsList.innerHTML = "Error loading items.";
    }
};

/**
 * 3. VIEW CLAIMS (Replaces Profile View)
 */
window.viewClaims = async function() {
    const display = document.getElementById('itemProfileZ');
    display.innerHTML = "<h3 class='p-4'>Loading Claims...</h3>";

    try {
        const querySnapshot = await getDocs(collection(db, "claims"));
        display.innerHTML = `
            <div class="p-4">
                <h3 class="mb-4">Claims & Inquiries</h3>
                <div class="list-group" id="claimsContent"></div>
            </div>`;
        const content = document.getElementById('claimsContent');

        if (querySnapshot.empty) {
            content.innerHTML = "<p class='text-muted'>No claims currently pending.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const claim = docSnap.data();
            content.innerHTML += `
                <div class="list-group-item border-start border-4 border-primary mb-3 shadow-sm text-start">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5>${claim.requestType} for Item: ${claim.itemId}</h5>
                            <h5>${claim.requestType} for Item: ${claim.name}</h5>
                            <p class="mb-1"><strong>Name:</strong> ${claim.firstName} ${claim.lastName}</p>
                            <p class="mb-1"><strong>Email:</strong> ${claim.email}</p>
                            <p class="mb-2 text-secondary italic">"${claim.message || 'No message provided.'}"</p>
                        </div>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteClaim('${docSnap.id}')">Delete</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        console.error("Load Claims Error:", e);
        display.innerHTML = "Error loading claims.";
    }
};

/**
 * 4. ITEM PROFILE DISPLAY
 */
window.itemProfileClicked = function(id) {
    const item = allItems.find(i => i.id === id);
    const display = document.getElementById('itemProfileZ');
    if (!item) return;

    const displayDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Unknown";

    display.innerHTML = `
        <div class="p-4 text-start animate__animated animate__fadeIn">
            <div class="row">
                <div class="col-md-5">
                    <img src="${item.photo}" class="img-fluid rounded border shadow-sm mb-3">
                    <div class="d-grid gap-2">
                        <button class="btn btn-success" onclick="updateStatus('${item.id}', 1)">Approve Item</button>
                        <button class="btn btn-warning" onclick="updateStatus('${item.id}', 0)">Set to Pending</button>
                        <button class="btn btn-danger" onclick="deleteItem('${item.id}')">Delete Item</button>
                    </div>
                </div>
                <div class="col-md-7">
                    <h2 class="display-6">${item.name}</h2>
                    <hr>
                    <p><strong>Item ID:</strong> <code class="text-dark">${item.id}</code></p>
                    <p><strong>Date Reported:</strong> ${displayDate}</p>
                    <p><strong>Description:</strong><br>${item.description}</p>
                    <p><strong>Status:</strong> ${item.approval === 1 ? '<span class="badge bg-success">Approved</span>' : '<span class="badge bg-warning text-dark">Pending</span>'}</p>
                </div>
            </div>
        </div>`;
};

/**
 * 5. FIREBASE ACTIONS (Update/Delete)
 */
window.updateStatus = async (id, val) => {
    try {
        await updateDoc(doc(db, "items", id), { approval: val });
        await refreshData();
        itemProfileClicked(id); // Refresh the detail view
    } catch (e) { alert("Error updating status."); }
};

window.deleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item? This cannot be undone.")) return;
    try {
        await deleteDoc(doc(db, "items", id));
        await refreshData();
        document.getElementById('itemProfileZ').innerHTML = '<div class="h-100 d-flex align-items-center justify-content-center text-muted">Item deleted. Select another item.</div>';
    } catch (e) { alert("Error deleting item."); }
};

window.deleteClaim = async (id) => {
    if (!confirm("Delete this claim?")) return;
    try {
        await deleteDoc(doc(db, "claims", id));
        viewClaims();
    } catch (e) { alert("Error deleting claim."); }
};

window.logout = async () => {
    await signOut(auth);
    window.location.href = "user.html";
};