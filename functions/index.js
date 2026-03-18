// functions/index.js
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

admin.initializeApp();
const db = admin.firestore();

const app = express();

// Allow cross-origin requests (for local testing & hosting)
app.use(cors({ origin: true }));
app.use(express.json());

// ===== Categories =====
// Returns all categories from Firestore
app.get('/categories', async (req, res) => {
  try {
    const snapshot = await db.collection('itemCategory').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send(err.message);
  }
});

// ===== Items =====
// Add a new item (ignores photos)
app.post('/add', async (req, res) => {
  try {
    const { name, categoryID, description } = req.body;

    if (!name || !categoryID) {
      return res.status(400).json({ message: 'Name and categoryID are required.' });
    }

    const newItem = {
      name,
      categoryID,
      description: description || '',
      date: new Date().toISOString(),
      approval: 0
    };

    const docRef = await db.collection('itemProfile').add(newItem);

    res.json({ message: 'Item added successfully!', id: docRef.id });
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).json({ message: err.message });
  }
});

// Export the API
export const api = functions.https.onRequest(app);