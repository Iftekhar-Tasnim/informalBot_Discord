# 🎯 Salamanca Informal Bot - Discord Bot

[![Node.js](https://img.shields.io/badge/Node.js-16.0.0+-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.21.0-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Railway](https://img.shields.io/badge/Deploy%20on-Railway-0B0D0E?style=flat&logo=railway)](https://railway.app/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](https://github.com/yourusername/informalBot)

A sophisticated Discord bot designed specifically for **5 | ᴛᴜʀғᴇʀ rank people** to manage Informal Event registrations with automatic hourly resets, user management, and comprehensive monitoring.

## 📑 **Table of Contents**

- [✨ Features](#-features)
- [🛠️ Installation](#️-installation)
- [🚀 Starting the Bot](#-starting-the-bot)
- [🎮 Bot Commands](#-bot-commands)
- [🕐 Reset System](#-reset-system)
- [🎯 Role Tagging System](#-role-tagging-system)
- [📝 Message System](#-message-system)
- [🔧 Technical Architecture](#-technical-architecture)
- [🚂 Railway Deployment](#-railway-deployment)
- [📱 User Experience](#-user-experience)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [📁 File Structure](#-file-structure)
- [🔒 Security Features](#-security-features)
- [📈 Performance & Monitoring](#-performance--monitoring)
- [🤝 Support & Contributing](#-support--contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)
- [🎯 Quick Start Summary](#-quick-start-summary)
- [📚 Additional Documentation](#-additional-documentation)
- [🎉 Success Stories](#-success-stories)
- [🌟 Future Enhancements](#-future-enhancements)
- [📞 Contact & Support](#-contact--support)

## ✨ Features

### 🎯 **Core Functionality**
- **Hourly Registration System**: Tracks up to 10 unique users per hour (GMT+6 timezone)
- **Precise Reset Timing**: Automatically resets at exactly **XX:30** of every hour
- **Registration Window**: Open from **XX:30 to XX:45** (15 minutes per hour)
- **Smart Role Tagging**: Automatically mentions and notifies 5 | ᴛᴜʀғᴇʀ rank people
- **Dual Command System**: `+` to register, `-` to cancel registration
- **Real-time Updates**: Live registration list with empty slot indicators

### 🚀 **Advanced Capabilities**
- **Auto-Restart**: Never stops running automatically
- **Error Recovery**: Handles crashes and connection issues gracefully
- **Health Monitoring**: Built-in heartbeat and status monitoring
- **Timezone Sync**: All times synchronized with GMT+6 (Bangladesh Standard Time)
- **Nickname Support**: Shows both Discord username and server nickname
- **Smart Activation**: Automatically detects if registration should be open when bot is activated
- **Immediate Registration**: Allows registration right away if activated during open periods

### 📱 **User Experience**
- **Clear Instructions**: Every message includes "Press + for registration, - for cancellation"
- **Auto-deletion**: Warning messages auto-delete after 2 minutes
- **Visual Feedback**: Rich embeds and formatted messages
- **Mobile Friendly**: Optimized for both desktop and mobile Discord

## 🛠️ Installation

### 📋 **System Requirements**
- **Node.js**: 16.0.0 or higher
- **RAM**: Minimum 512MB (1GB recommended)
- **Storage**: 100MB available space
- **Network**: Stable internet connection
- **Platform**: Windows, macOS, Linux, or Railway

### 🔑 **Required Credentials**
- **Discord Bot Token**: From Discord Developer Portal
- **Bot Permissions**: Send Messages, Manage Messages, Read Message History
- **Server Access**: Bot must be invited to your Discord server

### 📱 **Discord Bot Setup**
1. **Create Application**: Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. **Create Bot**: Add bot to your application
3. **Get Token**: Copy the bot token for your `.env` file
4. **Set Permissions**: Configure bot permissions (see below)
5. **Invite Bot**: Use OAuth2 URL to invite bot to your server

### 🔐 **Bot Permissions**
```
Required Permissions:
✅ Send Messages
✅ Manage Messages (for auto-deletion)
✅ Read Message History
✅ Use Slash Commands
✅ Mention Everyone (for role mentions)

Optional Permissions:
🔸 Embed Links (for rich embeds)
🔸 Attach Files (for future features)
```

### Setup Steps
1. **Clone this repository**
   ```bash
   git clone [repository-url]
   cd informalBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env file
   TOKEN=your_discord_bot_token_here
   ```

4. **Configure bot permissions**
   - Send Messages
   - Manage Messages (for auto-deletion)
   - Read Message History
   - Use Slash Commands

## 🚀 Starting the Bot

### 🚂 Railway Hosting (Recommended for 24/7)
```bash
npm start          # Uses railway-start.js
npm run railway    # Same as above
```

### 🏠 Local Development
```bash
npm run local      # Direct bot start
npm run dev        # Development mode with nodemon
```

### 🖥️ Windows Local
```bash
node bot-manager.js    # Auto-restart manager
start-bot.bat          # Double-click to run
.\start-bot.ps1        # PowerShell script
```

### 🖥️ Process Management
```bash
# PM2 (Recommended)
npm install -g pm2
pm2 start index.js --name informalbot
pm2 startup
pm2 save

# Forever
npm install -g forever
forever start index.js
```

## 🎮 Bot Commands

### 📱 **Registration Commands**
- **`+`** - Register for the current hour's Informal Event
- **`-`** - Cancel your current registration

### 🎯 **Slash Commands**
- **`/informalbot start`** - Activate bot for current channel
- **`/informalbot stop`** - Deactivate bot for current channel  
- **`/informalbot status`** - Check detailed bot status

### 📚 **Text Commands**
- **`!ping`** - Test bot response and show latency
- **`!help`** - Show available commands and registration schedule
- **`!stats`** - Show detailed monitoring stats with embed
- **`!status`** - Simple status check
- **`!testevents`** - Admin command to test timing functionality

## 🕐 **Reset System**

### ⏰ **Precise Timing**
- **Reset Time**: Exactly **XX:30** of every hour (GMT+6)
- **Registration Window**: Open from **XX:30 to XX:45** (15 minutes per hour)
- **Automatic**: No manual intervention required
- **Smart Detection**: Bot automatically knows when registration should be open

### 🔄 **Reset Process**
1. **Automatic Detection**: Bot checks every minute for reset time
2. **Data Clearance**: Clears all registrations and resets counters
3. **Notification**: Sends reset message with empty registration list
4. **Role Mention**: Tags all 5 | ᴛᴜʀғᴇʀ rank people
5. **Instructions**: Includes clear + and - instructions
6. **Schedule Display**: Shows complete timing information for the current hour

## 🎯 **Role Tagging System**

### 🔍 **Smart Role Detection**
The bot automatically finds and mentions the appropriate role:

#### **Primary Search Patterns:**
- `5 | ᴛᴜʀғᴇʀ` (exact match)
- `5 | TURFER` (uppercase)
- `5 | turfer` (lowercase)
- `5 | Turfer` (title case)

#### **Fallback Patterns:**
- `5 rank` (any case variations)
- `5 Rank` (title case)
- `5 RANK` (uppercase)

### 📢 **Mention Format**
- **Role Found**: `<@&roleId>` - Notifies all role members
- **No Role Found**: **"5 | ᴛᴜʀғᴇʀ rank people"** (bold text)

## 📝 **Message System**

### 🎨 **Message Types**

#### **1. Startup Messages**
- **Bot Startup**: Sent to all guilds when bot connects
- **Bot Activation**: Sent when `/informalbot start` is used
- **Immediate Status**: Shows current registration status when activated
- **Includes**: Role mentions, instructions, system status, and timing information

#### **2. Registration Messages**
- **Success**: Confirmation with updated registration list
- **Duplicate**: Warning for already registered users
- **Full Channel**: Notification when 10/10 slots filled
- **10th Registration**: Permanent message with complete list

#### **3. Reset Messages**
- **Hourly Reset**: Regular reset notifications
- **Scheduled Reset**: Automatic reset confirmations
- **Includes**: Previous hour stats and new instructions

#### **4. Cancellation Messages**
- **Success**: Confirmation of cancellation
- **Not Registered**: Warning for unregistered users
- **Includes**: Updated registration list

### 📋 **Message Format**
All messages include:
- **Heading**: 🎯 Salamanca Informal Registration
- **Instructions**: Press **+** for registration, **-** for cancellation
- **Footer**: Made by Zircon
- **Auto-deletion**: Most messages delete after 2 minutes

## 🔧 **Technical Architecture**

### 🏗️ **Core Components**
- **Message Handler**: Processes + and - commands
- **Time Manager**: GMT+6 timezone handling
- **Role Manager**: Smart role detection and tagging
- **Channel Tracker**: Per-channel registration management
- **Health Monitor**: System status and error handling

### 📊 **Data Structures**
```javascript
channelTracking = {
    users: Set,           // User IDs
    usernames: Map,       // User ID -> Display Name
    lastReset: Date,      // Last reset timestamp
    messageCount: Number  // Total registrations
}
```

### 🚨 **Error Handling**
- **Uncaught Exceptions**: Automatic restart after 5 seconds
- **Unhandled Rejections**: Automatic restart after 5 seconds
- **Connection Issues**: Auto-reconnection with exponential backoff
- **Memory Monitoring**: Automatic restart on high memory usage

## 🚂 **Railway Deployment**

### 🌍 **Environment Variables**
```bash
TOKEN=your_discord_bot_token
PORT=3000
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=informalbot
```

### 🏥 **Health Check Endpoint**
- **URL**: `/health`
- **Response**: JSON with bot status and GMT+6 time
- **Monitoring**: Railway automatically monitors this endpoint

### 📈 **Auto-scaling Features**
- **Memory Management**: Automatic restart on high usage
- **Load Balancing**: Handles traffic spikes
- **SSL/HTTPS**: Secure connections
- **24/7 Uptime**: Never stops running

## 📱 **User Experience**

### 🎯 **Registration Flow**
1. **User types `+`** → Gets registered and sees confirmation
2. **User types `-`** → Gets removed and sees updated list
3. **Invalid input** → Message deleted with clear instructions

### 📊 **Visual Feedback**
- **Registration List**: Shows numbered slots with names
- **Empty Slots**: Clear indication of available positions
- **Status Indicators**: Color-coded registration status
- **Real-time Updates**: List updates immediately after actions

### 🔔 **Notifications**
- **Role Mentions**: 5 | ᴛᴜʀғᴇʀ rank people get @notifications
- **Mobile Alerts**: Push notifications on mobile devices
- **Discord Mentions**: Clickable role mentions in messages

## 🛠️ **Troubleshooting**

### ❌ **Common Issues**

#### **Bot Keeps Stopping**
1. Check `.env` file has correct `TOKEN`
2. Ensure bot has proper Discord permissions
3. Use `bot-manager.js` for automatic restarts
4. Check console logs for error messages

#### **Role Not Being Mentioned**
1. Verify role name contains "5" and "ᴛᴜʀғᴇʀ"
2. Check bot has permission to mention roles
3. Ensure role is visible to the bot
4. Check console logs for role detection errors

#### **Registration Not Working**
1. Verify bot is active in the channel
2. Check if registration period is open
3. Ensure user hasn't already registered
4. Verify channel isn't full (10/10)

### 🔍 **Debug Commands**
- **`!stats`** - Detailed system status
- **`/informalbot status`** - Channel-specific status
- **Console Logs** - Comprehensive error tracking

## 📁 **File Structure**

```
informalBot/
├── index.js              # Main bot logic
├── bot-manager.js        # Process manager (auto-restart)
├── railway-start.js      # Railway-optimized startup
├── start-bot.bat         # Windows batch startup
├── start-bot.ps1         # PowerShell startup
├── package.json          # Dependencies and scripts
├── README.md             # This file
├── RAILWAY_DEPLOYMENT.md # Railway setup guide
└── TIME_LOGIC_EXAMPLE.md # Time system documentation
```

## 🔒 **Security Features**

### 🛡️ **Bot Security**
- **Intent Management**: Minimal required Discord intents
- **Permission Scoping**: Only necessary permissions
- **Error Logging**: No sensitive data in logs
- **Rate Limiting**: Built-in Discord.js rate limiting

### 🔐 **Environment Security**
- **Token Protection**: Environment variable storage
- **No Hardcoding**: All sensitive data in .env
- **Git Ignore**: .env file excluded from version control

## 📈 **Performance & Monitoring**

### 📊 **Health Metrics**
- **Heartbeat**: Every 30 seconds
- **Memory Usage**: Logged with each heartbeat
- **Uptime Tracking**: Total running time
- **Connection Status**: Discord connection monitoring

### 🚀 **Optimization Features**
- **Efficient Data Structures**: Set/Map for fast lookups
- **Minimal API Calls**: Optimized Discord API usage
- **Memory Management**: Automatic cleanup and monitoring
- **Async Operations**: Non-blocking message processing

## 🤝 **Support & Contributing**

### 🆘 **Getting Help**
1. **Check Console Logs**: Detailed error information
2. **Verify Permissions**: Bot and role permissions
3. **Test Commands**: Use `!help` and `!stats`
4. **Check Timezone**: Ensure GMT+6 timezone logic

### 📝 **Contributing**
1. **Fork Repository**: Create your own fork
2. **Test Changes**: Ensure syntax and functionality
3. **Submit PR**: Pull request with clear description
4. **Follow Style**: Maintain existing code formatting

## 📄 **License**

**ISC License** - See LICENSE file for details

## 👨‍💻 **Author**

**Made by Zircon**

---

## 🎯 **Quick Start Summary**

1. **Install**: `npm install`
2. **Configure**: Set `TOKEN` in `.env`
3. **Start**: `npm start` (Railway) or `npm run local` (Local)
4. **Activate**: Use `/informalbot start` in your channel
5. **Register**: Users type `+` to register, `-` to cancel
6. **Monitor**: Use `!stats` to see current status

The bot will automatically:
- ✅ Reset registrations every hour at XX:30 (GMT+6)
- ✅ Tag and notify 5 | ᴛᴜʀғᴇʀ rank people
- ✅ Manage up to 10 registrations per hour
- ✅ Provide clear instructions in all messages
- ✅ Handle errors and restart automatically

**🎯 Perfect for managing Informal Event registrations with military precision!**

---

## 📚 **Additional Documentation**

### 📖 **Related Files**
- **[RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)** - Complete Railway setup guide
- **[TIME_LOGIC_EXAMPLE.md](TIME_LOGIC_EXAMPLE.md)** - Detailed timezone and reset logic
- **[LICENSE](LICENSE)** - ISC License terms

### 🔗 **Useful Links**
- **[Discord.js Documentation](https://discord.js.org/)** - Bot framework docs
- **[Discord Developer Portal](https://discord.com/developers/applications)** - Bot setup
- **[Railway Documentation](https://docs.railway.app/)** - Hosting platform docs

---

## 🎉 **Success Stories**

This bot has been successfully deployed and is actively managing Informal Event registrations with:
- **24/7 Uptime** - Never stops running
- **Military Precision** - Exact XX:30 hourly resets
- **User Satisfaction** - Clear instructions and feedback
- **Admin Ease** - Simple slash commands for management

---

## 🌟 **Future Enhancements**

Potential features for future versions:
- **Database Integration** - Persistent storage across restarts
- **Analytics Dashboard** - Registration statistics and trends
- **Multi-language Support** - International server support
- **Advanced Scheduling** - Custom reset times and patterns
- **Web Interface** - Admin panel for remote management

---

## 📞 **Contact & Support**

For questions, issues, or feature requests:
- **GitHub Issues**: Report bugs or request features
- **Discord Server**: Join our community for support
- **Email**: Contact the development team

---

**🎯 Thank you for choosing Salamanca Informal Bot for your event management needs!**
