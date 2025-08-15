# Salamanca Informal Bot - Discord Bot

A Discord bot that monitors channels and manages user registrations with automatic restart capabilities.

## Features

- **Channel Monitoring**: Tracks up to 10 unique users per hour (GMT+6 timezone)
- **Auto-Restart**: Never stops running automatically
- **Error Recovery**: Handles crashes and connection issues gracefully
- **Health Monitoring**: Built-in heartbeat and status monitoring
- **Timezone Sync**: All times synchronized with GMT+6 (Bangladesh Standard Time)

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Discord bot token:
   ```
   TOKEN=your_discord_bot_token_here
   ```

## Starting the Bot

### 🚂 Railway Hosting (Recommended for 24/7)
```bash
npm start  # Uses railway-start.js
npm run railway  # Same as above
```

### 🏠 Local Development
```bash
npm run local  # Direct bot start
npm run dev    # Development mode with nodemon
```

### 🖥️ Windows Local (Manual Restart Required)
```bash
node bot-manager.js  # Auto-restart manager
start-bot.bat        # Double-click to run
.\start-bot.ps1      # PowerShell script
```

## 🚂 Railway Hosting (Recommended for 24/7)

Railway provides the most reliable hosting for your Discord bot:

### **Automatic Features:**
- ✅ **24/7 Uptime** - Never stops running
- ✅ **Auto-Restart** - Restarts on any failure
- ✅ **Health Monitoring** - Built-in health checks
- ✅ **Memory Management** - Automatic restart on high memory
- ✅ **Load Balancing** - Handles traffic spikes
- ✅ **SSL/HTTPS** - Secure connections

### **Quick Deploy:**
1. **Fork this repo** to GitHub
2. **Connect to Railway** at [railway.app](https://railway.app)
3. **Set environment variables** (TOKEN)
4. **Deploy automatically**

### **Railway Commands:**
```bash
npm start          # Start bot (Railway optimized)
npm run railway    # Same as above
railway logs       # View logs
railway status     # Check status
```

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed setup.

## 🏠 Local Development & Windows

1. **Use the Batch File (Easiest)**:
   - Double-click `start-bot.bat`
   - The bot will automatically restart if it crashes
   - Keep the command window open

2. **Use PowerShell Script**:
   - Right-click `start-bot.ps1` → "Run with PowerShell"
   - Better error handling and colored output

3. **Windows Task Scheduler**:
   - Open Task Scheduler
   - Create Basic Task
   - Set trigger to "At startup"
   - Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c "cd /d "C:\path\to\your\bot" && start-bot.bat"`
   - Check "Run whether user is logged on or not"

### For Advanced Users:

1. **Install PM2 (Process Manager)**:
   ```bash
   npm install -g pm2
   pm2 start index.js --name informalbot
   pm2 startup
   pm2 save
   ```

2. **Use Forever**:
   ```bash
   npm install -g forever
   forever start index.js
   ```

## Bot Commands

- `/informalbot start` - Activate bot for current channel
- `/informalbot stop` - Deactivate bot for current channel  
- `/informalbot status` - Check bot status
- `!ping` - Test bot response
- `!help` - Show available commands
- `!stats` - Show channel monitoring stats

## Troubleshooting

### Bot Keeps Stopping:
1. Check your `.env` file has the correct `TOKEN`
2. Ensure your bot has proper permissions in Discord
3. Use `bot-manager.js` for automatic restarts
4. Check console logs for error messages

### Connection Issues:
- The bot automatically handles reconnections
- Check your internet connection
- Verify Discord's servers are online

### Memory Issues:
- The bot includes memory monitoring
- Restart if memory usage gets too high
- Check for memory leaks in your code

## Monitoring

The bot includes built-in monitoring:
- **Heartbeat**: Every 30 seconds
- **Memory Usage**: Logged with each heartbeat
- **Uptime**: Tracks total running time
- **Connection Status**: Monitors Discord connection
- **Auto-Restart**: Automatically restarts on crashes

## File Structure

```
informalBot/
├── index.js          # Main bot code
├── bot-manager.js    # Process manager (auto-restart)
├── start-bot.bat     # Windows batch startup
├── start-bot.ps1     # PowerShell startup
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Ensure all dependencies are installed
3. Verify your Discord bot token is correct
4. Check Discord bot permissions

## License

ISC License
