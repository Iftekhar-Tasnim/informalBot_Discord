require('dotenv').config(); // Load .env variables
const { Client, GatewayIntentBits } = require('discord.js');

// Create bot client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

// When bot is ready
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Respond to "!ping"
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore bots
    if (message.content === '!ping') {
        message.reply('Pong! 🏓');
    }
});

// Login with token
client.login(process.env.TOKEN);
