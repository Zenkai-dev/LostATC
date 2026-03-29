import { db } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth();
let allItems = [];

/** * GATEKEEPER: Check if user is an admin 
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Run initial data load
        await refreshData();
    } else {
        window.location.href = "user.html";
    }
});

/** * FETCH & RENDER ITEMS
 */
window.refreshData = async function() {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = "Loading...";

    try {
        const q = query(collection(db, "items"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        allItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        itemsList.innerHTML = ''; // Clear loading text
        allItems.forEach(item => {
            const approvalStatus = item.approval === 1 ? "Approved" : "Pending";
            itemsList.innerHTML += `
                <button class="list-group-item list-group-item-action btn mt-2" 
                        onclick="itemProfileClicked('${item.id}')">
                    ${item.name} <br>
                    <small class="${item.approval === 1 ? 'text-success' : 'text-warning'}">${approvalStatus}</small>
                </button>`;
        });
    } catch (e) {
        console.error(e);
        itemsList.innerHTML = "Error loading items.";
    }
};

/** * VIEW CLAIMS (Replaces your old viewClaims)
 */
window.viewClaims = async function() {
    const display = document.getElementById('itemProfileZ');
    display.innerHTML = "<h3>Loading Claims...</h3>";

    try {
        const querySnapshot = await getDocs(collection(db, "claims"));
        display.innerHTML = `<h3>Claims & Inquiries</h3><div class="list-group" id="claimsContent"></div>`;
        const content = document.getElementById('claimsContent');

        querySnapshot.forEach((docSnap) => {
            const claim = docSnap.data();
            content.innerHTML += `
                <div class="list-group-item mt-2 text-start">
                    <p><strong>Item ID:</strong> ${claim.itemId}</p>
                    <p><strong>User:</strong> ${claim.firstName} ${claim.lastName} (${claim.email})</p>
                    <p><strong>Type:</strong> ${claim.requestType}</p>
                    <p><strong>Message:</strong> ${claim.message || "No message"}</p>
                    <button class="btn btn-danger btn-sm" onclick="deleteClaim('${docSnap.id}')">Delete Claim</button>
                </div>`;
        });
    } catch (e) {
        display.innerHTML = "Error loading claims.";
    }
};

/** * ACTION FUNCTIONS
 */
window.itemProfileClicked = function(id) {
    const item = allItems.find(i => i.id === id);
    const display = document.getElementById('itemProfileZ');
    const displayDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Unknown";

    display.innerHTML = `
        <div class="p-3 text-start">
            <img src="${item.photo}" class="img-fluid rounded border mb-3" style="max-height: 300px;">
            <h2>${item.name}</h2>
            <p><strong>ID:</strong> ${item.id}</p>
            <p><strong>Date:</strong> ${displayDate}</p>
            <p><strong>Description:</strong> ${item.description}</p>
            <div class="mt-3">
                <button class="btn btn-success" onclick="updateStatus('${item.id}', 1)">Approve</button>
                <button class="btn btn-warning" onclick="updateStatus('${item.id}', 0)">Set Pending</button>
                <button class="btn btn-danger" onclick="deleteItem('${item.id}')">Delete Item</button>
            </div>
        </div>`;
};

window.updateStatus = async (id, val) => {
    await updateDoc(doc(db, "items", id), { approval: val });
    refreshData();
};

window.deleteItem = async (id) => {
    if (confirm("Delete item?")) {
        await deleteDoc(doc(db, "items", id));
        refreshData();
        document.getElementById('itemProfileZ').innerHTML = '';
    }
};

window.deleteClaim = async (id) => {
    if (confirm("Delete claim?")) {
        await deleteDoc(doc(db, "claims", id));
        viewClaims();
    }
};