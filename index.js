require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Global error handling to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION - Bot will restart automatically:', error);
    console.error('Stack trace:', error.stack);
    
    // Give some time for logging before restart
    setTimeout(() => {
        console.log('🔄 Restarting bot due to uncaught exception...');
        process.exit(1); // Exit with error code to trigger restart
    }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION - Bot will restart automatically:', reason);
    console.error('Promise:', promise);
    
    // Give some time for logging before restart
    setTimeout(() => {
        console.log('🔄 Restarting bot due to unhandled rejection...');
        process.exit(1); // Exit with error code to trigger restart
    }, 5000);
});

// Process monitoring and health checks
let lastHeartbeat = Date.now();
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_HEARTBEAT_DELAY = 120000; // 2 minutes

// Heartbeat function to ensure bot is responsive
function sendHeartbeat() {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeat;
    
    if (timeSinceLastHeartbeat > MAX_HEARTBEAT_DELAY) {
        console.warn(`⚠️ Heartbeat delay detected: ${timeSinceLastHeartbeat}ms since last heartbeat`);
    }
    
    lastHeartbeat = now;
    console.log(`💓 Bot heartbeat - Uptime: ${Math.floor(process.uptime())}s, Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
}

// Start heartbeat monitoring
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    gracefulShutdown();
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    gracefulShutdown();
});

async function gracefulShutdown() {
    try {
        console.log('🔄 Disconnecting from Discord...');
        if (client && client.destroy) {
            await client.destroy();
        }
        console.log('✅ Discord connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Store which channels the bot is active in
const activeChannels = new Set();

// Store message tracking data per channel
const channelTracking = new Map(); // channelId -> { users: Set, usernames: Map, lastReset: Date, messageCount: number }

// Slash command data
const commands = [
    new SlashCommandBuilder()
        .setName('informalbot')
        .setDescription('Activate bot control for this channel')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('What action to take')
                .setRequired(true)
                .addChoices(
                    { name: 'Start', value: 'start' },
                    { name: 'Stop', value: 'stop' },
                    { name: 'Status', value: 'status' }
                )
        )
];

// Function to get current GMT+6 time
function getCurrentGMT6Time() {
    const now = new Date();
    // Convert to GMT+6 (Bangladesh Standard Time)
    const gmt6Offset = 6 * 60; // 6 hours in minutes
    const gmt6Time = new Date(now.getTime() + (gmt6Offset * 60 * 1000));
    return gmt6Time.toISOString();
}

// Function to get current GMT+6 time as Date object
function getCurrentGMT6Date() {
    const now = new Date();
    // Convert to GMT+6 (Bangladesh Standard Time)
    const gmt6Offset = 6 * 60; // 6 hours in minutes
    return new Date(now.getTime() + (gmt6Offset * 60 * 1000));
}

// Function to check if it's time to reset (every hour on the clock using GMT+6)
// Example: If last reset was at 1:00, then at 2:00 this will return true
// This ensures reset happens exactly at the hour boundary
function shouldReset(lastReset) {
    const now = getCurrentGMT6Date();
    const lastResetTime = new Date(lastReset);
    
    // Get current GMT+6 hour and last reset GMT+6 hour
    const currentGMT6Hour = now.getHours();
    const lastResetGMT6Hour = lastResetTime.getHours();
    
    // Reset if it's a new GMT+6 hour (e.g., from 1:59 to 2:00)
    // This ensures reset happens exactly at the hour boundary
    return currentGMT6Hour !== lastResetGMT6Hour;
}

// Function to get next reset time (using GMT+6 time)
function getNextResetTime(lastReset) {
    const now = getCurrentGMT6Date();
    
    // Calculate the next hour boundary
    const nextReset = new Date(now);
    nextReset.setHours(nextReset.getHours() + 1, 0, 0, 0); // Next hour at 00:00
    
    // Format the time as HH:MM AM/PM
    const hours = nextReset.getHours();
    const minutes = nextReset.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Function to get current GMT+6 time string for logging
function getCurrentGMT6TimeString() {
    const now = getCurrentGMT6Date();
    return now.toISOString();
}

// Function to get current GMT+6 time in readable format
function getCurrentGMT6Readable() {
    const now = getCurrentGMT6Date();
    return now.toLocaleString('en-US', { 
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// Function to get user display name (username + nickname if available)
function getUserDisplayName(message) {
    const userName = message.author.username;
    try {
        const member = message.member;
        if (member && member.nickname) {
            return `${userName} (${member.nickname})`;
        }
    } catch (error) {
        console.log(`Could not get nickname for ${userName}: ${error.message}`);
    }
    return userName;
}

// Function to check if registrations are currently allowed
function isRegistrationOpen(lastReset) {
    const now = getCurrentGMT6Date();
    const lastResetTime = new Date(lastReset);
    
    // Get current GMT+6 hour and last reset GMT+6 hour
    const currentGMT6Hour = now.getHours();
    const lastResetGMT6Hour = lastResetTime.getHours();
    
    // Registration is open if we're in the same hour as the last reset
    // This means: if last reset was at 1:00, registrations are open from 1:00 to 1:59
    // At 2:00, shouldReset will trigger and clear the data, then registrations open again
    return currentGMT6Hour === lastResetGMT6Hour;
}

// Function to initialize or reset channel tracking
function initializeChannelTracking(channelId) {
    const now = getCurrentGMT6Date();
    channelTracking.set(channelId, {
        users: new Set(),
        usernames: new Map(), // userId -> username
        lastReset: now,
        messageCount: 0
    });
    console.log(`🕐 Channel tracking initialized for ${channelId} at GMT+6: ${getCurrentGMT6Readable()}`);
}

// Register slash commands when bot is ready
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`🔍 Bot ID: ${client.user.id}`);
    console.log(`🔍 Bot intents: ${client.options.intents.toArray().join(', ')}`);
    console.log(`🔍 Bot permissions: ${client.user.flags?.toArray().join(', ') || 'None'}`);
    console.log(`🔍 Bot is ready and connected to Discord`);
    console.log(`🔗 Bot is fully connected and ready to receive messages!`);
    
    // Test if we can see guilds
    console.log(`🔍 Connected to ${client.guilds.cache.size} guild(s):`);
    client.guilds.cache.forEach(guild => {
        console.log(`  - ${guild.name} (${guild.id})`);
        console.log(`    Channels: ${guild.channels.cache.size}`);
        console.log(`    Members: ${guild.memberCount}`);
    });
    
    // Test message sending capability
    try {
        const testGuild = client.guilds.cache.first();
        if (testGuild) {
            const testChannel = testGuild.channels.cache.find(ch => ch.type === 0); // Text channel
            if (testChannel) {
                console.log(`🧪 Testing message sending to #${testChannel.name}...`);
                const testMsg = await testChannel.send('🧪 **Bot Test Message** - If you see this, the bot can send messages!');
                console.log(`✅ Test message sent successfully! Message ID: ${testMsg.id}`);
                
                // Delete test message after 5 seconds
                setTimeout(async () => {
                    try {
                        await testMsg.delete();
                        console.log(`🗑️ Test message deleted successfully`);
                    } catch (error) {
                        console.log(`❌ Could not delete test message: ${error.message}`);
                    }
                }, 5000);
            }
        }
    } catch (error) {
        console.error(`❌ Failed to send test message: ${error.message}`);
    }
    
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        console.log('🔄 Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('❌ Error refreshing commands:', error);
    }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'informalbot') {
        const action = interaction.options.getString('action');
        const channelId = interaction.channelId;
        const channelName = interaction.channel.name;

        switch (action) {
            case 'start':
                activeChannels.add(channelId);
                initializeChannelTracking(channelId);
                
                // Test if we can send a message to this channel
                try {
                    const testChannel = client.channels.cache.get(channelId);
                    if (testChannel) {
                        console.log(`🔍 Channel found: ${testChannel.name} (${testChannel.id})`);
                        console.log(`🔍 Channel type: ${testChannel.type}`);
                        console.log(`🔍 Channel permissions: ${testChannel.permissionsFor(client.user)?.toArray().join(', ') || 'None'}`);
                    } else {
                        console.log(`❌ Channel not found in cache: ${channelId}`);
                    }
                } catch (error) {
                    console.error(`❌ Error checking channel: ${error.message}`);
                }
                
                await interaction.reply({
                    content: `# 🎯 Salamanca Informal Registration\n\n🤖 **Salamanca Informal Bot activated for #${channelName}**\n\n📊 **Message Monitoring System:**\n• Max 10 unique people per hour\n• 1 message per person per hour\n• Resets every hour on the clock (GMT+6)\n\nUse \`!stats\` to see current status!\n\n---\n**Made by Zircon**`,
                    ephemeral: false
                });
                console.log(`✅ Salamanca Informal Bot activated for channel: ${channelName} (${channelId})`);
                break;

            case 'stop':
                activeChannels.delete(channelId);
                channelTracking.delete(channelId);
                await interaction.reply({
                    content: `# 🎯 Salamanca Informal Registration\n\n🛑 **Salamanca Informal Bot deactivated for #${channelName}**\n\nBot will no longer monitor this channel.\n\n---\n**Made by Zircon**`,
                    ephemeral: false
                });
                console.log(`❌ Salamanca Informal Bot deactivated for channel: ${channelName} (${channelId})`);
                break;

            case 'status':
                const isActive = activeChannels.has(channelId);
                if (isActive) {
                    const tracking = channelTracking.get(channelId);
                    if (tracking) {
                        const nextResetTime = getNextResetTime(tracking.lastReset);
                        const isOpen = isRegistrationOpen(tracking.lastReset);
                        const statusEmoji = isOpen ? '🟢' : '🟡';
                        const statusText = isOpen ? 'OPEN' : 'CLOSED';
                        
                        // Create current registration list with empty slots
                        const registeredList = [];
                        const emptySlots = [];
                        
                        // Fill in registered names
                        for (let i = 1; i <= 10; i++) {
                            if (i <= tracking.users.size) {
                                // Find the username for this position
                                const userId = Array.from(tracking.users)[i - 1];
                                const username = tracking.usernames.get(userId);
                                registeredList.push(`${i}. ${username}`);
                            } else {
                                // Empty slot
                                emptySlots.push(`${i}. [Empty Slot]`);
                            }
                        }
                        
                        // Combine registered and empty slots
                        const fullList = [...registeredList, ...emptySlots];
                        
                        await interaction.reply({
                            content: `# 🎯 Salamanca Informal Registration\n\n📊 **Salamanca Informal Bot Status for #${channelName}**\n\nStatus: ${statusEmoji} **${statusText}**\nCurrent Users: ${tracking.users.size}/10\nMessages: ${tracking.messageCount}\n⏰ Next Reset: ${nextResetTime}\n🕐 Current GMT+6: ${getCurrentGMT6Readable()}\n📝 **Registration:** ${isOpen ? '✅ Open for this hour' : '❌ Closed until next hour'}\n\n📋 **Registration List:**\n${fullList.join('\n')}\n\n---\n**Made by Zircon**`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: `# 🎯 Salamanca Informal Registration\n\n📊 **Salamanca Informal Bot Status for #${channelName}**\n\nStatus: 🟡 **INITIALIZING**\nBot is active but tracking not yet initialized.\n\n---\n**Made by Zircon**`,
                            ephemeral: true
                        });
                    }
                } else {
                    await interaction.reply({
                        content: `# 🎯 Salamanca Informal Registration\n\n📊 **Salamanca Informal Bot Status for #${channelName}**\n\nStatus: 🔴 **INACTIVE**\n\n---\n**Made by Zircon**`,
                        ephemeral: true
                    });
                }
                break;
        }
    }
});

// Handle messages only in active channels
client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages immediately - don't even log them
    if (message.author.bot) {
        return;
    }
    
    console.log(`🧪 BASIC TEST: Message from ${message.author.username}: "${message.content}"`);
    
    // Basic message logging for ALL messages (non-bot only)
    console.log(`📨 ALL MESSAGE: "${message.content}" from ${message.author.username} in channel ${message.channelId}`);
    
    try {
        // Debug logging
        console.log(`🔍 Message received: "${message.content}" from ${message.author.username} in channel ${message.channelId}`);
        console.log(`🔍 Bot active in this channel: ${activeChannels.has(message.channelId)}`);
        console.log(`🔍 Active channels: ${Array.from(activeChannels).join(', ')}`);
        
        // Ignore messages from inactive channels
        if (!activeChannels.has(message.channelId)) {
            console.log(`🚫 Message ignored: Channel not active: ${message.channelId}`);
            return;
        }

        const channelId = message.channelId;
        const userId = message.author.id;
        const userName = message.author.username;
        const messageContent = message.content.trim();
        const content = message.content.toLowerCase();
        
        console.log(`✅ Processing message: "${messageContent}" from ${userName} (${userId})`);
        
        // Get or initialize tracking for this channel
        let tracking = channelTracking.get(channelId);
        if (!tracking) {
            console.log(`🔄 Initializing tracking for channel ${channelId}`);
            initializeChannelTracking(channelId);
            tracking = channelTracking.get(channelId);
        }
        
        // Safety check - ensure tracking exists
        if (!tracking) {
            console.error(`❌ Failed to initialize tracking for channel ${channelId}`);
            return;
        }
        
        console.log(`📊 Current tracking: Users: ${tracking.users.size}/10, Messages: ${tracking.messageCount}`);
        
        // Check if it's time to reset
        if (shouldReset(tracking.lastReset)) {
            const oldCount = tracking.users.size;
            tracking.users.clear();
            tracking.usernames.clear(); // Clear usernames on reset
            tracking.messageCount = 0;
            tracking.lastReset = getCurrentGMT6Date(); // Use GMT+6 time for reset
            console.log(`🔄 Hourly reset for channel ${channelId} at GMT+6: ${getCurrentGMT6Readable()}. Cleared ${oldCount} registrations.`);
            
            // Create empty registration list with all slots empty
            const emptyList = [];
            for (let i = 1; i <= 10; i++) {
                emptyList.push(`${i}. [Empty Slot]`);
            }
            
            // Notify channel about the reset
            try {
                await message.channel.send({
                    content: `# 🎯 Salamanca Informal Registration\n\n🕐 **Hourly Reset Complete!**\n\n⏰ **Reset Time:** GMT+6 ${getCurrentGMT6Readable()}\n📊 **Previous Hour:** ${oldCount}/10 people registered\n✅ **Channel is now open for new registrations!**\n\n📋 **Current Registration List:**\n${emptyList.join('\n')}\n\n---\n**Made by Zircon**`
                });
            } catch (error) {
                console.error(`❌ Failed to send reset notification: ${error.message}`);
            }
        }
        
        // Check if registrations are currently open for this hour
        if (!isRegistrationOpen(tracking.lastReset)) {
            console.log(`⏰ Registration period closed for channel ${channelId}. Waiting for next hour.`);
            // Delete any non-command messages during closed period
            if (messageContent !== '!ping' && messageContent !== '!help' && messageContent !== '!status' && messageContent !== '!stats') {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
                
                try {
                    await message.channel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n⏰ **Registration Period Closed!**\n\n🕐 **Current Time:** GMT+6 ${getCurrentGMT6Readable()}\n⏰ **Next Registration:** ${getNextResetTime(tracking.lastReset)}\n\nPlease wait for the next hour to register.\n\n---\n**Made by Zircon**`
                    }).then(warningMsg => {
                        // Auto-delete warning after 2 minutes
                        setTimeout(async () => {
                            try {
                                await warningMsg.delete();
                            } catch (error) {
                                console.log(`Could not delete warning message: ${error.message}`);
                            }
                        }, 120000);
                    });
                } catch (error) {
                    console.error(`❌ Failed to send registration closed message: ${error.message}`);
                }
            }
            return;
        }
        
        // Handle commands first
        if (content === '!ping') {
            console.log(`🏓 Ping command received from ${userName}`);
            await message.reply('🏓 Pong! Bot is active in this channel!');
            return;
        } else if (content === '!help') {
            console.log(`📚 Help command received from ${userName}`);
            await message.reply('# 🎯 Salamanca Informal Registration\n\n📚 **Salamanca Informal Bot Commands:**\n• `!ping` - Test if bot is responding\n• `!help` - Show this help message\n• `!stats` - Show current monitoring stats\n• `/informalbot start` - Activate bot for this channel\n• `/informalbot stop` - Deactivate bot for this channel\n• `/informalbot status` - Check bot status\n\n⏰ **All times are in GMT+6 (Bangladesh Standard Time)**\n\n---\n**Made by Zircon**');
            return;
        } else if (content === '!status') {
            console.log(`📊 Status command received from ${userName}`);
            await message.reply('# 🎯 Salamanca Informal Registration\n\n✅ Bot is currently **ACTIVE** and monitoring this channel!\n\n---\n**Made by Zircon**');
            return;
        } else if (content === '!stats') {
            console.log(`📈 Stats command received from ${userName}`);
            const tracking = channelTracking.get(message.channelId);
            if (tracking) {
                const nextResetTime = getNextResetTime(tracking.lastReset);
                const isOpen = isRegistrationOpen(tracking.lastReset);
                const statusColor = isOpen ? '#00ff00' : '#ffaa00';
                const statusText = isOpen ? '🟢 OPEN' : '🟡 CLOSED';
                
                // Create current registration list with empty slots
                const registeredList = [];
                const emptySlots = [];
                
                // Fill in registered names
                for (let i = 1; i <= 10; i++) {
                    if (i <= tracking.users.size) {
                        // Find the username for this position
                        const userId = Array.from(tracking.users)[i - 1];
                        const username = tracking.usernames.get(userId);
                        registeredList.push(`${i}. ${username}`);
                    } else {
                        // Empty slot
                        emptySlots.push(`${i}. [Empty Slot]`);
                    }
                }
                
                // Combine registered and empty slots
                const fullList = [...registeredList, ...emptySlots];
                
                const embed = new EmbedBuilder()
                    .setColor(statusColor)
                    .setTitle('📊 Salamanca Informal Bot - Channel Monitoring Stats')
                    .setDescription(`Current status for #${message.channel.name}`)
                    .addFields(
                        { name: '📝 Registration Status', value: statusText, inline: true },
                        { name: '👥 Active Users', value: `${tracking.users.size}/10`, inline: true },
                        { name: '💬 Messages', value: `${tracking.messageCount}`, inline: true },
                        { name: '⏰ Next Reset', value: nextResetTime, inline: true },
                        { name: '🕐 Current GMT+6', value: getCurrentGMT6Readable(), inline: false },
                        { name: '📋 Registration List', value: fullList.join('\n'), inline: false }
                    )
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
            }
            return;
        }
        
        console.log(`🔍 Message is not a command, checking if it's "+"`);
        
        // Handle registration logic for non-command messages
        // Check if user already sent a message this hour
        if (tracking.users.has(userId)) {
            // Get server nickname if available for better display
            const displayName = getUserDisplayName(message);
            
            console.log(`❌ User ${displayName} already registered this hour`);
            // Delete the message if it's not "+"
            if (messageContent !== '+') {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
            }
            
            // Create current registration list with empty slots
            const registeredList = [];
            const emptySlots = [];
            
            // Fill in registered names
            for (let i = 1; i <= 10; i++) {
                if (i <= tracking.users.size) {
                    // Find the username for this position
                    const userId = Array.from(tracking.users)[i - 1];
                    const username = tracking.usernames.get(userId);
                    registeredList.push(`${i}. ${username}`);
                } else {
                    // Empty slot
                    emptySlots.push(`${i}. [Empty Slot]`);
                }
            }
            
            // Combine registered and empty slots
            const fullList = [...registeredList, ...emptySlots];
            
                            try {
                await message.channel.send({
                    content: `# 🎯 Salamanca Informal Registration\n\n❌ **${displayName}**, you've already registered this hour!\n\n⏰ Next reset: ${getNextResetTime(tracking.lastReset)}\n\n📋 **Current Registration List:**\n${fullList.join('\n')}\n\n---\n**Made by Zircon**`
                }).then(warningMsg => {
                    // Auto-delete warning after 2 minutes
                    setTimeout(async () => {
                        try {
                            await warningMsg.delete();
                        } catch (error) {
                            console.log(`Could not delete warning message: ${error.message}`);
                        }
                    }, 120000); // 2 minutes = 120,000 milliseconds
                });
            } catch (error) {
                console.error(`❌ Failed to send duplicate registration warning: ${error.message}`);
            }
            return;
        }
        
        // Check if we've reached the 10 person limit
        if (tracking.users.size >= 10) {
            console.log(`🚫 Channel is full (${tracking.users.size}/10)`);
            // Delete the message if it's not "+"
            if (messageContent !== '+') {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
            }
            
            // Create list of registered people with empty slots
            const registeredList = [];
            const emptySlots = [];
            
            // Fill in registered names
            for (let i = 1; i <= 10; i++) {
                if (i <= tracking.users.size) {
                    // Find the username for this position
                    const userId = Array.from(tracking.users)[i - 1];
                    const username = tracking.usernames.get(userId);
                    registeredList.push(`${i}. ${username}`);
                } else {
                    // Empty slot
                    emptySlots.push(`${i}. [Empty Slot]`);
                }
            }
            
            // Combine registered and empty slots
            const fullList = [...registeredList, ...emptySlots];
            
            try {
                await message.channel.send({
                    content: `# 🎯 Salamanca Informal Registration\n\n🚫 **Channel Registration is FULL!**\n\n📋 **Registered People (${tracking.users.size}/10):**\n${fullList.join('\n')}\n\n⏰ **Next reset:** ${getNextResetTime(tracking.lastReset)}\n\n---\n**Made by Zircon**`
                }).then(warningMsg => {
                    // Auto-delete warning after 2 minutes
                    setTimeout(async () => {
                        try {
                            await warningMsg.delete();
                        } catch (error) {
                            console.log(`Could not delete warning message: ${error.message}`);
                        }
                    }, 120000);
                });
            } catch (error) {
                console.error(`❌ Failed to send channel full message: ${error.message}`);
            }
            return;
        }
        
                // Check if message is exactly "+" (registration)
        if (messageContent !== '+') {
            console.log(`⚠️ Invalid message: "${messageContent}" - not "+"`);
            // Delete the invalid message
            try {
                await message.delete();
            } catch (error) {
                console.log(`Could not delete message: ${error.message}`);
            }
            
            // Get server nickname if available for better display
            const displayName = getUserDisplayName(message);
            
            // Send warning message that auto-deletes after 2 minutes
            try {
                const warningMsg = await message.channel.send({
                    content: `# 🎯 Salamanca Informal Registration\n\n⚠️ **${displayName}**, Please Enter + for Registration\n\n---\n**Made by Zircon**`
                });
                
                // Auto-delete warning after 2 minutes
                setTimeout(async () => {
                    try {
                        await warningMsg.delete();
                    } catch (error) {
                        console.log(`Could not delete warning message: ${error.message}`);
                    }
                }, 120000); // 2 minutes = 120,000 milliseconds
            } catch (error) {
                console.error(`❌ Failed to send registration warning: ${error.message}`);
            }
            
            return;
        }
        
        // Valid "+" message - add user to tracking and increment message count
        console.log(`✅ Valid "+" message received from ${userName}`);
        
        // Get server nickname if available, otherwise use username
        const displayName = getUserDisplayName(message);
        
        tracking.users.add(userId);
        tracking.usernames.set(userId, displayName);
        tracking.messageCount++;

        // Check if this was the 10th registration
        if (tracking.users.size === 10) {
            console.log(`🎉 10th registration reached by ${displayName}`);
            // Create list of all registered people
            const registeredList = Array.from(tracking.usernames.values()).map((name, index) => `${index + 1}. ${name}`).join('\n');
            
                            // Send final registration list - this message will never delete
                try {
                    await message.channel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n📋 **All Registered People (10/10):**\n${registeredList}\n\n⏰ **Next reset:** ${getNextResetTime(tracking.lastReset)}\n\n---\n**Made by Zircon**`
                    });
                console.log(`📋 Final registration list sent`);
            } catch (error) {
                console.error(`❌ Failed to send final registration list: ${error.message}`);
            }
        } else {
            console.log(`✅ Regular registration confirmation sent to ${displayName}`);
            
            // Create current registration list with empty slots
            const registeredList = [];
            const emptySlots = [];
            
            // Fill in registered names
            for (let i = 1; i <= 10; i++) {
                if (i <= tracking.users.size) {
                    // Find the username for this position
                    const userId = Array.from(tracking.users)[i - 1];
                    const username = tracking.usernames.get(userId);
                    registeredList.push(`${i}. ${username}`);
                } else {
                    // Empty slot
                    emptySlots.push(`${i}. [Empty Slot]`);
                }
            }
            
            // Combine registered and empty slots
            const fullList = [...registeredList, ...emptySlots];
            
                            // Send registration confirmation with full list
                try {
                    await message.channel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n✅ **${displayName}** successfully registered!\n\n📊 **Status:** ${tracking.users.size}/10 people registered\n⏰ Next reset: ${getNextResetTime(tracking.lastReset)}\n\n📋 **Current Registration List:**\n${fullList.join('\n')}\n\n---\n**Made by Zircon**`
                    }).then(confirmMsg => {
                    // Auto-delete confirmation after 2 minutes
                    setTimeout(async () => {
                        try {
                            await confirmMsg.delete();
                        } catch (error) {
                            console.log(`Could not delete confirmation message: ${error.message}`);
                        }
                    }, 120000);
                });
            } catch (error) {
                console.error(`❌ Failed to send registration confirmation: ${error.message}`);
            }
        }
        
        console.log(`✅ Registration recorded for ${displayName} in channel ${channelId}. Total: ${tracking.users.size}/10`);
        
    } catch (error) {
        console.error(`❌ Error processing message: ${error.message}`);
        console.error(error.stack);
    }
});

// Enhanced connection status monitoring with auto-reconnection
client.on(Events.Warn, (info) => {
    console.log(`⚠️ Discord.js Warning: ${info}`);
});

client.on(Events.Error, (error) => {
    console.error(`❌ Discord.js Error: ${error.message}`);
    console.error(error.stack);
    
    // Attempt to reconnect on critical errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        console.log('🔄 Critical connection error detected, attempting reconnection...');
        setTimeout(() => {
            try {
                client.destroy();
                client.login(process.env.TOKEN);
            } catch (reconnectError) {
                console.error('❌ Reconnection failed:', reconnectError.message);
            }
        }, 5000);
    }
});

client.on(Events.Disconnect, (event) => {
    console.log(`🔌 Bot disconnected: ${event.reason} (Code: ${event.code})`);
    connectionAttempts++;
    
    if (connectionAttempts <= MAX_RECONNECTION_ATTEMPTS) {
        console.log(`🔄 Attempting reconnection ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}...`);
        setTimeout(() => {
            try {
                client.login(process.env.TOKEN);
            } catch (error) {
                console.error('❌ Reconnection attempt failed:', error.message);
            }
        }, RECONNECTION_DELAY);
    } else {
        console.error('❌ Max reconnection attempts reached. Bot will exit and restart.');
        process.exit(1);
    }
});

client.on(Events.Reconnecting, () => {
    console.log(`🔄 Bot is reconnecting... (Attempt ${connectionAttempts})`);
});

client.on(Events.Resume, () => {
    console.log(`✅ Bot connection resumed successfully!`);
    connectionAttempts = 0; // Reset connection attempts on successful resume
});

// Test other events to see if Discord is working
client.on(Events.GuildCreate, (guild) => {
    console.log(`🏠 Bot joined guild: ${guild.name}`);
});

client.on(Events.GuildDelete, (guild) => {
    console.log(`🚪 Bot left guild: ${guild.name}`);
});

client.on(Events.ChannelCreate, (channel) => {
    console.log(`📝 Channel created: ${channel.name}`);
});

client.on(Events.ChannelDelete, (channel) => {
    console.log(`🗑️ Channel deleted: ${channel.name}`);
});

// Test if we can see any user activity
client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
    console.log(`👤 Presence update: ${newPresence.user?.username} - ${newPresence.status}`);
});

client.login(process.env.TOKEN);