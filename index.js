require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

// Function to check if it's time to reset (every hour on the clock using UTC)
function shouldReset(lastReset) {
    const now = new Date();
    const lastResetTime = new Date(lastReset);
    
    // Get current UTC hour and last reset UTC hour
    const currentUTCHour = now.getUTCHours();
    const lastResetUTCHour = lastResetTime.getUTCHours();
    
    // Reset if it's a new UTC hour or if it's been more than an hour
    return currentUTCHour !== lastResetUTCHour || 
           (now.getTime() - lastReset.getTime()) >= 3600000; // 1 hour in milliseconds
}

// Function to get time until next reset (using UTC time)
function getTimeUntilReset(lastReset) {
    const now = new Date();
    const nextReset = new Date(lastReset);
    
    // Set next reset to the next UTC hour, minute 0, second 0
    nextReset.setUTCHours(nextReset.getUTCHours() + 1, 0, 0, 0);
    
    const timeLeft = nextReset.getTime() - now.getTime();
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Function to get current UTC time string for logging
function getCurrentUTCTime() {
    const now = new Date();
    return now.toISOString();
}

// Function to initialize or reset channel tracking
function initializeChannelTracking(channelId) {
    const now = new Date();
    channelTracking.set(channelId, {
        users: new Set(),
        usernames: new Map(), // userId -> username
        lastReset: now,
        messageCount: 0
    });
    console.log(`🕐 Channel tracking initialized for ${channelId} at UTC: ${getCurrentUTCTime()}`);
}

// Register slash commands when bot is ready
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
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
                await interaction.reply({
                    content: `🤖 **InformalBot activated for #${channelName}**\n\n📊 **Message Monitoring System:**\n• Max 10 unique people per hour\n• 1 message per person per hour\n• Resets every hour on the clock\n\nUse \`!stats\` to see current status!`,
                    ephemeral: false
                });
                console.log(`✅ Bot activated for channel: ${channelName} (${channelId})`);
                break;

            case 'stop':
                activeChannels.delete(channelId);
                channelTracking.delete(channelId);
                await interaction.reply({
                    content: `🛑 **InformalBot deactivated for #${channelName}**\n\nBot will no longer monitor this channel.`,
                    ephemeral: false
                });
                console.log(`❌ Bot deactivated for channel: ${channelName} (${channelId})`);
                break;

            case 'status':
                const isActive = activeChannels.has(channelId);
                if (isActive) {
                    const tracking = channelTracking.get(channelId);
                    if (tracking) {
                        const timeUntilReset = getTimeUntilReset(tracking.lastReset);
                        await interaction.reply({
                            content: `📊 **Bot Status for #${channelName}**\n\nStatus: 🟢 **ACTIVE**\nCurrent Users: ${tracking.users.size}/10\nMessages: ${tracking.messageCount}\n⏰ Next Reset: ${timeUntilReset}\n🕐 Current UTC: ${getCurrentUTCTime()}`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: `📊 **Bot Status for #${channelName}**\n\nStatus: 🟡 **INITIALIZING**\nBot is active but tracking not yet initialized.`,
                            ephemeral: true
                        });
                    }
                } else {
                    await interaction.reply({
                        content: `📊 **Bot Status for #${channelName}**\n\nStatus: 🔴 **INACTIVE**`,
                        ephemeral: true
                    });
                }
                break;
        }
    }
});

// Handle messages only in active channels
client.on(Events.MessageCreate, async (message) => {
    try {
        // Ignore bot messages and messages from inactive channels
        if (message.author.bot || !activeChannels.has(message.channelId)) return;

        const channelId = message.channelId;
        const userId = message.author.id;
        const userName = message.author.username;
        const messageContent = message.content.trim();
        const content = message.content.toLowerCase();
        
        // Get or initialize tracking for this channel
        let tracking = channelTracking.get(channelId);
        if (!tracking) {
            initializeChannelTracking(channelId);
            tracking = channelTracking.get(channelId);
        }
        
        // Safety check - ensure tracking exists
        if (!tracking) {
            console.error(`❌ Failed to initialize tracking for channel ${channelId}`);
            return;
        }
        
        // Check if it's time to reset
        if (shouldReset(tracking.lastReset)) {
            const oldCount = tracking.users.size;
            tracking.users.clear();
            tracking.usernames.clear(); // Clear usernames on reset
            tracking.messageCount = 0;
            tracking.lastReset = new Date();
            console.log(`🔄 Hourly reset for channel ${channelId} at UTC: ${getCurrentUTCTime()}. Cleared ${oldCount} registrations.`);
            
            // Notify channel about the reset
            try {
                await message.channel.send({
                    content: `🕐 **Hourly Reset Complete!**\n\n⏰ **Reset Time:** UTC ${getCurrentUTCTime()}\n📊 **Previous Hour:** ${oldCount}/10 people registered\n✅ **Channel is now open for new registrations!**`
                });
            } catch (error) {
                console.error(`❌ Failed to send reset notification: ${error.message}`);
            }
        }
        
        // Handle commands first
        if (content === '!ping') {
            await message.reply('🏓 Pong! Bot is active in this channel!');
            return;
        } else if (content === '!help') {
            await message.reply('📚 **Available Commands:**\n• `!ping` - Test if bot is responding\n• `!help` - Show this help message\n• `!stats` - Show current monitoring stats\n• `/informalbot start` - Activate bot for this channel\n• `/informalbot stop` - Deactivate bot for this channel\n• `/informalbot status` - Check bot status');
            return;
        } else if (content === '!status') {
            await message.reply('✅ Bot is currently **ACTIVE** and monitoring this channel!');
            return;
        } else if (content === '!stats') {
            const tracking = channelTracking.get(message.channelId);
            if (tracking) {
                const timeUntilReset = getTimeUntilReset(tracking.lastReset);
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📊 Channel Monitoring Stats')
                    .setDescription(`Current status for #${message.channel.name}`)
                    .addFields(
                        { name: '👥 Active Users', value: `${tracking.users.size}/10`, inline: true },
                        { name: '💬 Messages', value: `${tracking.messageCount}`, inline: true },
                        { name: '⏰ Next Reset', value: timeUntilReset, inline: true },
                        { name: '🕐 Current UTC', value: getCurrentUTCTime(), inline: false }
                    )
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
            }
            return;
        }
        
        // Handle registration logic for non-command messages
        // Check if user already sent a message this hour
        if (tracking.users.has(userId)) {
            // Delete the message if it's not "+"
            if (messageContent !== '+') {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
            }
            
            try {
                await message.channel.send({
                    content: `❌ **${userName}**, you've already registered this hour!\n\n⏰ Next reset: ${getTimeUntilReset(tracking.lastReset)}`
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
            // Delete the message if it's not "+"
            if (messageContent !== '+') {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
            }
            
            // Create list of registered people
            const registeredList = Array.from(tracking.usernames.values()).map((name, index) => `${index + 1}. ${name}`).join('\n');
            
            try {
                await message.channel.send({
                    content: `🚫 **Channel Registration is FULL!**\n\n📋 **Registered People (${tracking.users.size}/10):**\n${registeredList}\n\n⏰ **Next reset:** ${getTimeUntilReset(tracking.lastReset)}`
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
            // Delete the invalid message
            try {
                await message.delete();
            } catch (error) {
                console.log(`Could not delete message: ${error.message}`);
            }
            
            // Send warning message that auto-deletes after 2 minutes
            try {
                const warningMsg = await message.channel.send({
                    content: `⚠️ **${userName}**, Please Enter + for Registration`
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
        tracking.users.add(userId);
        tracking.usernames.set(userId, userName);
        tracking.messageCount++;

        // Check if this was the 10th registration
        if (tracking.users.size === 10) {
            // Create list of all registered people
            const registeredList = Array.from(tracking.usernames.values()).map((name, index) => `${index + 1}. ${name}`).join('\n');
            
            // Send final registration list - this message will never delete
            try {
                await message.channel.send({
                    content: `📋 **All Registered People (10/10):**\n${registeredList}\n\n⏰ **Next reset:** ${getTimeUntilReset(tracking.lastReset)}`
                });
            } catch (error) {
                console.error(`❌ Failed to send final registration list: ${error.message}`);
            }
        } else {
            // Send regular confirmation
            try {
                await message.channel.send({
                    content: `✅ **${userName}** successfully registered!\n\n📊 **Status:** ${tracking.users.size}/10 people registered\n⏰ Next reset: ${getTimeUntilReset(tracking.lastReset)}`
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
        
        console.log(`✅ Registration recorded for ${userName} in channel ${channelId}. Total: ${tracking.users.size}/10`);
        
    } catch (error) {
        console.error(`❌ Error processing message: ${error.message}`);
        console.error(error.stack);
    }
});

client.login(process.env.TOKEN);