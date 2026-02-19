/**
 * DART Study Monitor — Backend entry point.
 * Express server serving JSON mock data via REST endpoints.
 */

import express from 'express';
import cors from 'cors';
import { loadAllStudies } from './services/dataLoader.js';
import { studyRouter } from './routes/studies.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', studyRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'dart-study-monitor-backend' });
});

// Load data then start server
loadAllStudies();

app.listen(PORT, () => {
    console.log(`🚀 DART Study Monitor backend running on http://localhost:${PORT}`);
});
