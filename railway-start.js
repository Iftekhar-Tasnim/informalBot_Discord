#!/usr/bin/env node

/**
 * Railway-Optimized Bot Startup
 * Designed specifically for Railway hosting environment
 */

require('dotenv').config();

// Railway-specific environment variables
const PORT = process.env.PORT || 3000;
const RAILWAY_ENVIRONMENT = process.env.RAILWAY_ENVIRONMENT || 'development';
const RAILWAY_SERVICE_NAME = process.env.RAILWAY_SERVICE_NAME || 'informalbot';

console.log('🚂 Railway Environment Detected');
console.log(`📍 Port: ${PORT}`);
console.log(`🌍 Environment: ${RAILWAY_ENVIRONMENT}`);
console.log(`🔧 Service: ${RAILWAY_SERVICE_NAME}`);

// Railway health check endpoint (optional but recommended)
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            service: RAILWAY_SERVICE_NAME,
            environment: RAILWAY_ENVIRONMENT,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🏥 Health check server listening on port ${PORT}`);
});

// Railway restart handling
let restartCount = 0;
const MAX_RAILWAY_RESTARTS = 5;
const RESTART_DELAY = 10000; // 10 seconds

function handleRailwayRestart() {
    restartCount++;
    console.log(`🔄 Railway restart detected (${restartCount}/${MAX_RAILWAY_RESTARTS})`);
    
    if (restartCount >= MAX_RAILWAY_RESTARTS) {
        console.error('❌ Maximum Railway restarts reached. Exiting gracefully.');
        process.exit(0);
    }
    
    // Give Railway time to handle the restart
    setTimeout(() => {
        console.log('✅ Continuing bot operation...');
    }, RESTART_DELAY);
}

// Handle Railway-specific signals
process.on('SIGTERM', () => {
    console.log('🛑 Railway SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Health check server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Railway SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Health check server closed');
        process.exit(0);
    });
});

// Railway environment monitoring
setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log(`💓 Railway Bot Status - Uptime: ${Math.floor(process.uptime())}s, Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    
    // Railway will automatically restart if memory usage is too high
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn('⚠️ High memory usage detected, Railway may restart the service');
    }
}, 60000); // Every minute

// Start the main bot
console.log('🚀 Starting InformalBot for Railway...');
console.log('📡 Connecting to Discord...');

// Import and start the main bot
try {
    require('./index.js');
    console.log('✅ Bot started successfully on Railway');
} catch (error) {
    console.error('❌ Failed to start bot:', error.message);
    handleRailwayRestart();
}
