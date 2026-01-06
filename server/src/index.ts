import express, { Request, Response, NextFunction } from 'express';
import { env } from './config/env.js';
import { getClickHouseClient, testConnection, closeConnection } from './db/clickhouse.js';
import metricsRouter from './routes/metrics.js';
import masterConversionRouter from './routes/masterConversionMetrics.js';
import firebaseRouter from './routes/firebase.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for large Firebase configs

// CORS middleware for frontend access
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (_req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// API Routes
app.use('/api/metrics', metricsRouter);
app.use('/api/master-conversion', masterConversionRouter);
app.use('/api/firebase', firebaseRouter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// ClickHouse connection check endpoint
app.get('/health/clickhouse', async (_req: Request, res: Response) => {
    try {
        await testConnection();
        res.json({ status: 'ok', message: 'ClickHouse connection successful' });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'ClickHouse connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Start server
const server = app.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
    console.log(`📊 ClickHouse configured: ${env.clickhouse.host}:${env.clickhouse.port}`);

    // Initialize ClickHouse client (lazy - connection established on first query)
    getClickHouseClient();
});

// Graceful shutdown
const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    await closeConnection();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
