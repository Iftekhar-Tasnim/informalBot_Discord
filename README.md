# InformalBot 🤖

A powerful Discord bot for channel monitoring and registration management with automatic message filtering and hourly limits.

## Features

- ✅ **Channel Control System** - Activate bot only in specific channels
- ✅ **Message Monitoring** - Track and limit user registrations per hour
- ✅ **Automatic Cleanup** - Auto-delete messages and warnings
- ✅ **Registration Limits** - Max 10 unique people per hour, 1 message per person
- ✅ **Hourly Reset** - Automatic reset every hour on the clock
- ✅ **Slash Commands** - Easy bot management with Discord slash commands
- ✅ **Message Filtering** - Only allows "+" for registration, deletes other content
- ✅ **Railway Deployment Ready** - Configured for seamless cloud deployment

## Prerequisites

- Node.js (v16.9.0 or higher)
- npm or yarn
- Discord Bot Token
- Discord Application with Bot enabled
- Bot permissions: Send Messages, Manage Messages, Use Slash Commands

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd informalBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   TOKEN=your_discord_bot_token_here
   ```

4. **Run the bot**
   ```bash
   node index.js
   ```

## Project Structure

```
informalBot/
├── commands/          # Command modules
│   ├── help.js       # Help command
│   └── ping.js       # Ping command
├── index.js          # Main bot entry point with monitoring system
├── package.json      # Project dependencies
├── package-lock.json # Locked dependency versions
└── LICENSE          # Project license
```

## Bot Functionality

### **Channel Activation System**
- Use `/informalbot start` to activate bot in a specific channel
- Bot only monitors channels where it's been activated
- Use `/informalbot stop` to deactivate monitoring
- Use `/informalbot status` to check current status

### **Message Monitoring & Registration**
- **Only "+" messages allowed** for registration
- **Maximum 10 unique people** can register per hour
- **Each person limited to 1 message** per hour
- **Automatic hourly reset** on the clock (e.g., 1:00, 2:00, 3:00)
- **Invalid messages deleted** immediately
- **Warning messages auto-delete** after 2 minutes

### **Registration Process**
1. User types `+` to register
2. Bot confirms registration and shows current count
3. After 10th registration, bot displays complete list
4. **Final list message never deletes** - permanent record
5. Channel stops accepting new registrations until reset

### **Auto-Cleanup Features**
- Invalid messages deleted instantly
- Warning messages auto-delete after 2 minutes
- Confirmation messages auto-delete after 2 minutes
- Final registration list stays permanently
- Channel stays clean and organized

## Commands

### **Slash Commands**
- **`/informalbot start`** - Activate bot monitoring for current channel
- **`/informalbot stop`** - Deactivate bot monitoring for current channel
- **`/informalbot status`** - Check bot status and current registration count

### **Text Commands**
- **`!ping`** - Test if bot is responding
- **`!help`** - Show available commands
- **`!status`** - Check if bot is active
- **`!stats`** - Show detailed monitoring statistics with embed

## Configuration

The bot requires the following Discord.js intents:
- `Guilds` - Access to guild information
- `GuildMessages` - Access to guild messages
- `MessageContent` - Access to message content

**Required Bot Permissions:**
- Send Messages
- Manage Messages (to delete invalid content)
- Use Slash Commands
- Read Message History

## Deployment

### Railway (Recommended)

This bot is configured for Railway deployment:

1. Connect your GitHub repository to Railway
2. Set the `TOKEN` environment variable in Railway dashboard
3. Deploy automatically on push

### Other Platforms

The bot can be deployed on any Node.js hosting platform:
- Heroku
- DigitalOcean App Platform
- Vercel
- AWS Lambda

## Development

### **Adding New Features**

The bot is built with a modular structure:
- Channel tracking system for multiple channels
- Hourly reset functionality
- Message filtering and cleanup
- Slash command integration

### **Local Development**

```bash
# Install nodemon for development
npm install -g nodemon

# Run with auto-restart
nodemon index.js
```

### **Testing the Bot**

1. **Activate in a channel:** `/informalbot start`
2. **Test registration:** Type `+` to register
3. **Test invalid messages:** Type anything other than `+`
4. **Check status:** `/informalbot status` or `!stats`
5. **Deactivate when done:** `/informalbot stop`

## Dependencies

- **discord.js** - Discord API wrapper with slash command support
- **dotenv** - Environment variable management

## Use Cases

- **Event Registration** - Limit participants per time slot
- **Channel Moderation** - Control message flow and content
- **Hourly Activities** - Manage time-limited participation
- **Community Management** - Organize user engagement

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the terms specified in the LICENSE file.

## Support

If you encounter any issues or have questions:
1. Check the Discord.js documentation
2. Review the Railway deployment logs
3. Open an issue in this repository
4. Check bot permissions and intents

---

**Happy coding! 🚀**
