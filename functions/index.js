import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import itemsRoute from './routes/items.js';

const app = express();

app.use(express.json());
app.use(cors({ origin: true }));

app.use('/items', itemsRoute);

export const api = functions.https.onRequest(app);