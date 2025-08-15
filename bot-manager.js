#!/usr/bin/env node

/**
 * Bot Process Manager
 * Automatically restarts the bot if it crashes or stops
 */

const { spawn } = require('child_process');
const path = require('path');

class BotManager {
    constructor() {
        this.botProcess = null;
        this.restartCount = 0;
        this.maxRestarts = 10;
        this.restartDelay = 5000; // 5 seconds
        this.isShuttingDown = false;
        
        // Handle process termination signals
        process.on('SIGINT', () => this.gracefulShutdown());
        process.on('SIGTERM', () => this.gracefulShutdown());
        
        console.log('🚀 Bot Manager Starting...');
        this.startBot();
    }
    
    startBot() {
        if (this.isShuttingDown) return;
        
        console.log(`🔄 Starting bot process (Attempt ${this.restartCount + 1}/${this.maxRestarts})...`);
        
        // Start the bot process
        this.botProcess = spawn('node', [path.join(__dirname, 'index.js')], {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'production' }
        });
        
        // Handle bot process events
        this.botProcess.on('error', (error) => {
            console.error('❌ Bot process error:', error.message);
            this.handleBotExit();
        });
        
        this.botProcess.on('exit', (code, signal) => {
            console.log(`🔌 Bot process exited with code ${code} and signal ${signal}`);
            this.handleBotExit();
        });
        
        this.botProcess.on('close', (code) => {
            console.log(`🔌 Bot process closed with code ${code}`);
            this.handleBotExit();
        });
        
        console.log(`✅ Bot process started with PID: ${this.botProcess.pid}`);
    }
    
    handleBotExit() {
        if (this.isShuttingDown) return;
        
        this.restartCount++;
        
        if (this.restartCount <= this.maxRestarts) {
            console.log(`🔄 Bot crashed. Restarting in ${this.restartDelay / 1000} seconds...`);
            console.log(`📊 Restart count: ${this.restartCount}/${this.maxRestarts}`);
            
            setTimeout(() => {
                this.startBot();
            }, this.restartDelay);
        } else {
            console.error('❌ Maximum restart attempts reached. Bot manager will exit.');
            process.exit(1);
        }
    }
    
    async gracefulShutdown() {
        console.log('🛑 Shutting down bot manager gracefully...');
        this.isShuttingDown = true;
        
        if (this.botProcess) {
            console.log('🔄 Terminating bot process...');
            this.botProcess.kill('SIGTERM');
            
            // Give the bot some time to shut down gracefully
            setTimeout(() => {
                if (this.botProcess) {
                    console.log('🔄 Force killing bot process...');
                    this.botProcess.kill('SIGKILL');
                }
                console.log('✅ Bot manager shutdown complete');
                process.exit(0);
            }, 10000); // 10 seconds
        } else {
            console.log('✅ Bot manager shutdown complete');
            process.exit(0);
        }
    }
    
    // Health check method
    getStatus() {
        return {
            isRunning: this.botProcess && !this.botProcess.killed,
            restartCount: this.restartCount,
            maxRestarts: this.maxRestarts,
            pid: this.botProcess ? this.botProcess.pid : null
        };
    }
}

// Start the bot manager
const manager = new BotManager();

// Export for potential external monitoring
module.exports = manager;
