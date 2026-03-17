import express from 'express';
import { db } from '../firebase.js'; // Firestore instance

const itemsRoute = express.Router();

//////////////////////////////////////////////
// ITEMCLAIM STUFF
//////////////////////////////////////////////

// Get all claims
itemsRoute.get('/claimlists', async (req, res) => {
    try {
        const snapshot = await db.collection('claims').get();
        const claims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("Fetched item claims from database:", claims.map(c => c.fname));
        res.json(claims);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Add a claim
itemsRoute.post('/claimadd', async (req, res) => {
    try {
        const { fname, lname, email, postCI, postI, postItemID } = req.body;

        await db.collection('claims').add({
            fname,
            lname,
            email,
            postCI,
            postI,
            postItemID
        });

        res.json({ message: "Success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a claim by document ID
itemsRoute.delete('/claimsdelete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection('claims').doc(id).delete();
        res.json({ message: "Successfully deleted claim" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

//////////////////////////////////////////////
// ITEMPROFILE STUFF
//////////////////////////////////////////////

// Get all items
itemsRoute.get('/lists', async (req, res) => {
    try {
        const snapshot = await db.collection('items').get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("Fetched items from database:", items.map(i => i.name));
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Add an item
itemsRoute.post('/add', async (req, res) => {
    try {
        const { name, description, categoryID } = req.body;

        await db.collection('items').add({
            name,
            description,
            categoryID,
            approval: 0,
            date: new Date()
        });

        res.json({ message: "Successfully added!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete item by document ID
itemsRoute.delete('/delete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection('items').doc(id).delete();
        res.json({ message: "Successfully deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Approve an item
itemsRoute.put('/approve/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection('items').doc(id).update({ approval: 1 });
        res.json({ message: "Successfully approved" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Disapprove an item
itemsRoute.put('/disapprove/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection('items').doc(id).update({ approval: 0 });
        res.json({ message: "Successfully disapproved" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default itemsRoute;