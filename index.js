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

// Scheduled time check - runs every minute to ensure precise timing
function checkScheduledEvents() {
    const now = getCurrentGMT6Date();
    const currentMinute = now.getMinutes();
    
    // Check if it's exactly 00:30 of any hour (registration opens)
    if (currentMinute === 30) {
        console.log(`🕐 Registration opening check at GMT+6: ${getCurrentGMT6Readable()}`);
        console.log(`🔍 Active channels: ${activeChannels.size}`);
        
        // Check all active channels for registration opening
        activeChannels.forEach(channelId => {
            console.log(`🔍 Checking channel ${channelId} for registration opening...`);
            
            const tracking = channelTracking.get(channelId);
            if (tracking) {
                console.log(`📊 Channel ${channelId} tracking found. Users: ${tracking.users.size}, Last reset: ${tracking.lastReset}`);
                
                // Check if we need to reset and open registration
                if (shouldReset(tracking.lastReset)) {
                    console.log(`🔄 Registration reset and opening triggered for channel ${channelId}`);
                    
                    // Perform the reset
                    const oldCount = tracking.users.size;
                    tracking.users.clear();
                    tracking.usernames.clear();
                    tracking.messageCount = 0;
                    tracking.lastReset = now;
                    
                    console.log(`🔄 Registration reset completed for channel ${channelId}. Cleared ${oldCount} registrations.`);
                    
                    // Send registration opening notification to the channel
                    try {
                        const channel = client.channels.cache.get(channelId);
                        if (channel) {
                            console.log(`📢 Sending registration opening notification to #${channel.name}`);
                            
                            // Create empty registration list
                            const emptyList = [];
                            for (let i = 1; i <= 10; i++) {
                                emptyList.push(`${i}. [Empty Slot]`);
                            }
                            
                            channel.send({
                                content: `# 🎯 Salamanca Informal Registration\n\n🟢 **Registration is NOW OPEN!**\n\n⏰ **Opening Time:** GMT+6 ${getCurrentGMT6Readable()}\n📊 **Previous Hour:** ${oldCount}/10 people registered\n✅ **Channel is now open for new registrations!**\n\n🎯 **Calling all ${getTurferRankMention(channel.guild)}!**\n\n📝 **Next Informal Event Registration is NOW OPEN!**\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n⏰ **Registration Closes:** ${getNextRegistrationCloseTime(tracking.lastReset)} (in 15 minutes)\n\n📋 **Current Registration List:**\n${emptyList.join('\n')}\n\n---\n**Made by Zircon**`
                            }).then(() => {
                                console.log(`✅ Registration opening notification sent successfully to #${channel.name}`);
                            }).catch(error => {
                                console.error(`❌ Failed to send message to #${channel.name}: ${error.message}`);
                            });
                        } else {
                            console.log(`❌ Channel ${channelId} not found in cache`);
                        }
                    } catch (error) {
                        console.error(`❌ Failed to send registration opening notification: ${error.message}`);
                    }
                } else {
                    console.log(`⏰ Channel ${channelId} not ready for registration opening yet`);
                }
            } else {
                console.log(`❌ No tracking found for channel ${channelId}`);
            }
        });
    }
    
    // Check if it's exactly 00:45 of any hour (registration closes)
    if (currentMinute === 45) {
        console.log(`🕐 Registration closing check at GMT+6: ${getCurrentGMT6Readable()}`);
        console.log(`🔍 Active channels: ${activeChannels.size}`);
        
        // Check all active channels for registration closing
        activeChannels.forEach(channelId => {
            console.log(`🔍 Checking channel ${channelId} for registration closing...`);
            
            const tracking = channelTracking.get(channelId);
            if (tracking) {
                console.log(`📊 Channel ${channelId} tracking found. Users: ${tracking.users.size}, Last reset: ${tracking.lastReset}`);
                
                // Send registration closing notification to the channel
                try {
                    const channel = client.channels.cache.get(channelId);
                    if (channel) {
                        console.log(`📢 Sending registration closing notification to #${channel.name}`);
                        
                        // Create current registration list
                        const registeredList = [];
                        const emptySlots = [];
                        
                        // Fill in registered names
                        const currentUsers = Array.from(tracking.users);
                        for (let i = 1; i <= 10; i++) {
                            if (i <= currentUsers.length) {
                                const currentUserId = currentUsers[i - 1];
                                const username = tracking.usernames.get(currentUserId);
                                registeredList.push(`${i}. ${username}`);
                            } else {
                                emptySlots.push(`${i}. [Empty Slot]`);
                            }
                        }
                        
                        const fullList = [...registeredList, ...emptySlots];
                        
                        channel.send({
                            content: `# 🎯 Salamanca Informal Registration\n\n🔴 **Registration is NOW CLOSED!**\n\n⏰ **Closing Time:** GMT+6 ${getCurrentGMT6Readable()}\n📊 **Current Status:** ${tracking.users.size}/10 people registered\n❌ **No more registrations accepted until next hour**\n\n📋 **Final Registration List:**\n${fullList.join('\n')}\n\n⏰ **Next Registration Opens:** ${getNextRegistrationOpenTime(tracking.lastReset)} (in 45 minutes)\n\n---\n**Made by Zircon**`
                        }).then(() => {
                            console.log(`✅ Registration closing notification sent successfully to #${channel.name}`);
                        }).catch(error => {
                            console.error(`❌ Failed to send message to #${channel.name}: ${error.message}`);
                        });
                    } else {
                        console.log(`❌ Channel ${channelId} not found in cache`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to send registration closing notification: ${error.message}`);
                }
            } else {
                console.log(`❌ No tracking found for channel ${channelId}`);
            }
        });
    }
}

// Start scheduled event monitoring (every minute)
setInterval(checkScheduledEvents, 60000); // 60 seconds = 1 minute

// Test function to manually trigger events (for debugging)
function testScheduledEvents() {
    console.log('🧪 Testing scheduled events function...');
    checkScheduledEvents();
}

// Export test function for manual testing
global.testEvents = testScheduledEvents;

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

// Command collection for prefix commands
const prefixCommands = new Collection();

// Load prefix commands from commands folder
const fs = require('fs');
const path = require('path');

try {
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, 'commands', file));
        if (command.name) {
            prefixCommands.set(command.name, command);
            console.log(`✅ Loaded prefix command: ${command.name}`);
        }
    }
} catch (error) {
    console.error('❌ Error loading prefix commands:', error);
}

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

// Function to check if it's time to reset (every hour at 00:30 using GMT+6)
// This ensures reset happens exactly at 00:30 of every hour
function shouldReset(lastReset) {
    const now = getCurrentGMT6Date();
    const lastResetTime = new Date(lastReset);
    
    // Get current GMT+6 time components
    const currentGMT6Hour = now.getHours();
    const currentGMT6Minute = now.getMinutes();
    const lastResetGMT6Hour = lastResetTime.getHours();
    const lastResetGMT6Minute = lastResetTime.getMinutes();
    
    // Reset if:
    // 1. It's a new hour (current hour != last reset hour), OR
    // 2. It's the same hour but we're at 00:30 and last reset was at 00:00
    // This ensures reset happens exactly at 00:30 of every hour
    if (currentGMT6Hour !== lastResetGMT6Hour) {
        return true;
    }
    
    // If same hour, check if we're at 00:30 and last reset was at 00:00
    if (currentGMT6Hour === lastResetGMT6Hour && 
        currentGMT6Minute === 30 && 
        lastResetGMT6Minute === 0) {
        return true;
    }
    
    return false;
}

// Function to get next reset time (using GMT+6 time)
function getNextResetTime(lastReset) {
    const now = getCurrentGMT6Date();
    
    // Calculate the next hour boundary at 00:30
    const nextReset = new Date(now);
    nextReset.setHours(nextReset.getHours() + 1, 30, 0, 0); // Next hour at 00:30
    
    // Format the time as HH:MM AM/PM
    const hours = nextReset.getHours();
    const minutes = nextReset.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Function to get next registration opening time (using GMT+6 time)
function getNextRegistrationOpenTime(lastReset) {
    const now = getCurrentGMT6Date();
    
    // Calculate the next hour boundary at 00:30
    const nextOpen = new Date(now);
    nextOpen.setHours(nextOpen.getHours() + 1, 30, 0, 0); // Next hour at 00:30
    
    // Format the time as HH:MM AM/PM
    const hours = nextOpen.getHours();
    const minutes = nextOpen.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Function to get next registration closing time (using GMT+6 time)
function getNextRegistrationCloseTime(lastReset) {
    const now = getCurrentGMT6Date();
    
    // Calculate the next hour boundary at 00:45
    const nextClose = new Date(now);
    nextClose.setHours(nextClose.getHours() + 1, 45, 0, 0); // Next hour at 00:45
    
    // Format the time as HH:MM AM/PM
    const hours = nextClose.getHours();
    const minutes = nextClose.getMinutes();
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

// Function to get mention string for 5 | ᴛᴜʀғᴇʀ rank people
function getTurferRankMention(guild) {
    try {
        // Look for role with name containing "5" and "ᴛᴜʀғᴇʀ" or similar
        const turferRole = guild.roles.cache.find(role => 
            role.name.includes('5') && 
            (role.name.includes('ᴛᴜʀғᴇʀ') || 
             role.name.includes('TURFER') || 
             role.name.includes('turfer') ||
             role.name.includes('Turfer'))
        );
        
        if (turferRole) {
            return `<@&${turferRole.id}>`; // Role mention
        }
        
        // Fallback: try to find any role with "5" and rank-related terms
        const rankRole = guild.roles.cache.find(role => 
            role.name.includes('5') && 
            (role.name.includes('rank') || 
             role.name.includes('Rank') ||
             role.name.includes('RANK'))
        );
        
        if (rankRole) {
            return `<@&${rankRole.id}>`; // Role mention
        }
        
        // If no specific role found, return a general mention
        return '**5 | ᴛᴜʀғᴇʀ rank people**';
        
    } catch (error) {
        console.log(`Could not find turfer rank role: ${error.message}`);
        return '**5 | ᴛᴜʀғᴇʀ rank people**';
    }
}

// Function to check if registrations are currently allowed
function isRegistrationOpen(lastReset) {
    const now = getCurrentGMT6Date();
    const lastResetTime = new Date(lastReset);
    
    // Get current GMT+6 time components
    const currentGMT6Hour = now.getHours();
    const currentGMT6Minute = now.getMinutes();
    const lastResetGMT6Hour = lastResetTime.getHours();
    const lastResetGMT6Minute = lastResetTime.getMinutes();
    
    // Registration is open if:
    // 1. We're in the same hour as the last reset, AND
    // 2. We're between 00:30 (opening) and 00:45 (closing)
    // This means: if last reset was at 1:30, registrations are open from 1:30 to 1:45
    // At 2:30, shouldReset will trigger and clear the data, then registrations open again
    if (currentGMT6Hour === lastResetGMT6Hour) {
        // Same hour - check if we're in the registration window (30-45 minutes)
        if (currentGMT6Minute >= 30 && currentGMT6Minute < 45) {
            return true;
        }
    }
    
    return false;
}

// Function to initialize or reset channel tracking
function initializeChannelTracking(channelId) {
    const now = getCurrentGMT6Date();
    
    // Set the initial reset time to the current hour at 00:30
    const initialResetTime = new Date(now);
    initialResetTime.setMinutes(30, 0, 0); // Set to 00:30 of current hour
    
    channelTracking.set(channelId, {
        users: new Set(),
        usernames: new Map(), // userId -> username
        lastReset: initialResetTime,
        messageCount: 0
    });
    console.log(`🕐 Channel tracking initialized for ${channelId} at GMT+6: ${getCurrentGMT6Readable()}`);
    console.log(`🔄 Next reset scheduled for: ${getNextResetTime(initialResetTime)}`);
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
    
    // Send startup message to all active channels after a delay
    setTimeout(async () => {
        console.log('🚀 Sending startup messages to active channels...');
        
        // Send startup message to all guilds the bot is in
        client.guilds.cache.forEach(async (guild) => {
            try {
                // Find the first text channel in each guild
                const textChannel = guild.channels.cache.find(ch => ch.type === 0); // Text channel
                if (textChannel) {
                    console.log(`📢 Sending startup message to #${textChannel.name} in ${guild.name}`);
                    
                    await textChannel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n🚀 **Bot Startup Complete!**\n\n🎯 **Calling all ${getTurferRankMention(guild)}!**\n\n📝 **Informal Event Registration System is READY!**\n\n⏰ **Current GMT+6 Time:** ${getCurrentGMT6Readable()}\n📊 **System Status:** Online and Monitoring\n🔄 **Reset Schedule:** Every hour at 00:01 (GMT+6)\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n📝 **Registration Commands:**\n• \`+\` - Register for the event\n• \`-\` - Cancel your registration\n\nUse \`/informalbot start\` to activate registration in this channel!\n\n---\n**Made by Zircon**`
                    });
                    
                    console.log(`✅ Startup message sent to #${textChannel.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to send startup message to guild ${guild.name}: ${error.message}`);
            }
        });
        
        console.log('✅ Startup messages completed');
    }, 5000); // Wait 5 seconds after bot is ready
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
                    content: `# 🎯 Salamanca Informal Registration\n\n🤖 **Salamanca Informal Bot activated for #${channelName}**\n\n🎯 **Calling all ${getTurferRankMention(interaction.guild)}!**\n\n📝 **Informal Event Registration is NOW OPEN!**\n\n📊 **Message Monitoring System:**\n• Max 10 unique people per hour\n• 1 message per person per hour\n• Resets every hour at 00:01 (GMT+6)\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n📝 **Registration Commands:**\n• \`+\` - Register for the event\n• \`-\` - Cancel your registration\n\nUse \`!stats\` to see current status!\n\n---\n**Made by Zircon**`,
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
                    content: `# 🎯 Salamanca Informal Registration\n\n🔄 **Hourly Reset Complete!**\n\n⏰ **Reset Time:** GMT+6 ${getCurrentGMT6Readable()}\n📊 **Previous Hour:** ${oldCount}/10 people registered\n✅ **Channel is now open for new registrations!**\n\n🎯 **Calling all ${getTurferRankMention(message.guild)}!**\n\n📝 **Next Informal Event Registration is NOW OPEN!**\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n⏰ **Next Reset:** ${getNextResetTime(tracking.lastReset)} (in 1 hour)\n\n📋 **Current Registration List:**\n${emptyList.join('\n')}\n\n---\n**Made by Zircon**`
                });
            } catch (error) {
                console.error(`❌ Failed to send reset notification: ${error.message}`);
            }
        }
        
        // Check if registrations are currently open for this hour
        if (!isRegistrationOpen(tracking.lastReset)) {
            console.log(`⏰ Registration period closed for channel ${channelId}. Waiting for next hour.`);
            
            // Handle + and - commands during closed period
            if (messageContent === '+' || messageContent === '-') {
                const action = messageContent === '+' ? 'register' : 'cancel registration';
                console.log(`❌ ${userName} tried to ${action} during closed period`);
                
                // Delete the user's message
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
                
                // Send registration closed message
                try {
                    const warningMsg = await message.channel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n🔴 **Registration Period Closed!**\n\n❌ **${getUserDisplayName(message)}**, you cannot ${action} right now.\n\n🕐 **Current Time:** GMT+6 ${getCurrentGMT6Readable()}\n⏰ **Next Registration Opens:** ${getNextResetTime(tracking.lastReset)} (in 45 minutes)\n\n⏳ **Please wait for the next hour to ${action}.**\n\n📋 **Available Commands:**\n• \`!ping\` - Test bot response\n• \`!help\` - Show help\n• \`!stats\` - Show status\n• \`!status\` - Check bot status\n\n---\n**Made by Zircon**`
                    });
                    
                    // Auto-delete warning after 2 minutes
                    setTimeout(async () => {
                        try {
                            await warningMsg.delete();
                        } catch (error) {
                            console.log(`Could not delete warning message: ${error.message}`);
                        }
                    }, 120000);
                } catch (error) {
                    console.error(`❌ Failed to send registration closed message: ${error.message}`);
                }
                return;
            }
            
            // Delete any other non-command messages during closed period
            if (!messageContent.startsWith('!')) {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
                
                try {
                    await message.channel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n🔴 **Registration Period Closed!**\n\n🕐 **Current Time:** GMT+6 ${getCurrentGMT6Readable()}\n⏰ **Next Registration Opens:** ${getNextResetTime(tracking.lastReset)} (in 45 minutes)\n\n⏳ **Please wait for the next hour to register.**\n\n📋 **Available Commands:**\n• \`!ping\` - Test bot response\n• \`!help\` - Show help\n• \`!stats\` - Show status\n• \`!status\` - Check bot status\n\n---\n**Made by Zircon**`
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
        
        // Handle prefix commands first
        if (messageContent.startsWith('!')) {
            const args = messageContent.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            const command = prefixCommands.get(commandName);
            if (command) {
                console.log(`🔧 Executing prefix command: ${commandName} from ${userName}`);
                try {
                    await command.execute(message, args);
                    return;
                } catch (error) {
                    console.error(`❌ Error executing command ${commandName}:`, error);
                    await message.reply('❌ There was an error executing that command!');
                    return;
                }
            }
        }
        
        // Handle built-in commands
        if (content === '!status') {
            console.log(`📊 Status command received from ${userName}`);
            await message.reply('# 🎯 Salamanca Informal Registration\n\n✅ Bot is currently **ACTIVE** and monitoring this channel!\n\n---\n**Made by Zircon**');
            return;
        } else if (content === '!testevents') {
            console.log(`🧪 Test events command received from ${userName}`);
            
            // Check if user has admin permissions
            if (message.member && message.member.permissions.has('ADMINISTRATOR')) {
                console.log(`🧪 Admin ${userName} testing timing functionality...`);
                
                // Manually trigger the scheduled events check
                checkScheduledEvents();
                
                await message.reply('# 🎯 Salamanca Informal Registration\n\n🧪 **Test Events Triggered!**\n\n✅ Timing function has been manually executed.\n📊 Check console logs for detailed information.\n\n---\n**Made by Zircon**');
            } else {
                await message.reply(`# 🎯 Salamanca Informal Registration\n\n❌ **Access Denied!**\n\n🔒 This command requires Administrator permissions.\n\n---\n**Made by Zircon**`);
            }
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
        
        console.log(`🔍 Message is not a command, checking if it's "+" or "-"`);
        
        // Check if message is exactly "+" (registration) or "-" (cancellation) FIRST
        if (messageContent === '+') {
            // Handle registration logic (existing code will continue below)
            // Note: This will continue to the registration logic below
        } else if (messageContent === '-') {
            // Handle cancellation logic
            console.log(`❌ Cancellation request received from ${userName}`);
            
            // Check if user is registered
            if (tracking.users.has(userId)) {
                // User is registered - remove them
                const displayName = getUserDisplayName(message);
                tracking.users.delete(userId);
                tracking.usernames.delete(userId);
                tracking.messageCount = Math.max(0, tracking.messageCount - 1); // Ensure it doesn't go below 0
                
                console.log(`✅ User ${displayName} removed from registration. Total: ${tracking.users.size}/10`);
                
                // Create current registration list with empty slots
                const registeredList = [];
                const emptySlots = [];
                
                // Fill in registered names (use a different variable name to avoid conflict)
                const remainingUsers = Array.from(tracking.users);
                for (let i = 1; i <= 10; i++) {
                    if (i <= remainingUsers.length) {
                        // Find the username for this position
                        const remainingUserId = remainingUsers[i - 1];
                        const username = tracking.usernames.get(remainingUserId);
                        registeredList.push(`${i}. ${username}`);
                    } else {
                        // Empty slot
                        emptySlots.push(`${i}. [Empty Slot]`);
                    }
                }
                
                // Combine registered and empty slots
                const fullList = [...registeredList, ...emptySlots];
                
                // Send cancellation confirmation
                try {
                    const confirmMsg = await message.channel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n❌ **${displayName}** has cancelled their registration!\n\n📊 **Status:** ${tracking.users.size}/10 people registered\n⏰ Next reset: ${getNextResetTime(tracking.lastReset)}\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n📋 **Current Registration List:**\n${fullList.join('\n')}\n\n---\n**Made by Zircon**`
                    });
                    
                    // Auto-delete confirmation after 2 minutes
                    setTimeout(async () => {
                        try {
                            await confirmMsg.delete();
                        } catch (error) {
                            console.log(`Could not delete cancellation confirmation: ${error.message}`);
                        }
                    }, 120000);
                } catch (error) {
                    console.error(`❌ Failed to send cancellation confirmation: ${error.message}`);
                }
                
                return;
            } else {
                // User is not registered - send warning
                const displayName = getUserDisplayName(message);
                
                try {
                    const warningMsg = await message.channel.send({
                        content: `# 🎯 Salamanca Informal Registration\n\n⚠️ **${displayName}**, you are not registered yet!\n\n📝 **Please enter + first to register, then use - to cancel.**\n\n---\n**Made by Zircon**`
                    });
                    
                    // Auto-delete warning after 2 minutes
                    setTimeout(async () => {
                        try {
                            await warningMsg.delete();
                        } catch (error) {
                            console.log(`Could not delete warning message: ${error.message}`);
                        }
                    }, 120000);
                } catch (error) {
                    console.error(`❌ Failed to send cancellation warning: ${error.message}`);
                }
                
                return;
            }
        }
        
        // Handle registration logic for non-command messages
        // Check if user already sent a message this hour (only for non-+/- messages)
        if (tracking.users.has(userId)) {
            // Get server nickname if available for better display
            const displayName = getUserDisplayName(message);
            
            console.log(`❌ User ${displayName} already registered this hour`);
            // Delete the message if it's not "+" or "-"
            if (messageContent !== '+' && messageContent !== '-') {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
            }
            
            // Create current registration list with empty slots
            const registeredList = [];
            const emptySlots = [];
            
            // Fill in registered names (use a different variable name to avoid conflict)
            const currentUsers = Array.from(tracking.users);
            for (let i = 1; i <= 10; i++) {
                if (i <= currentUsers.length) {
                    // Find the username for this position
                    const currentUserId = currentUsers[i - 1];
                    const username = tracking.usernames.get(currentUserId);
                    registeredList.push(`${i}. ${username}`);
                } else {
                    // Empty slot
                    emptySlots.push(`${i}. [Empty Slot]`);
                }
            }
            
            // Combine registered and empty slots
            const fullList = [...registeredList, ...emptySlots];
            
            try {
                const warningMsg = await message.channel.send({
                    content: `# 🎯 Salamanca Informal Registration\n\n❌ **${displayName}**, you've already registered this hour!\n\n⏰ Next reset: ${getNextResetTime(tracking.lastReset)}\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n📋 **Current Registration List:**\n${fullList.join('\n')}\n\n---\n**Made by Zircon**`
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
                console.error(`❌ Failed to send duplicate registration warning: ${error.message}`);
            }
            return;
        }
        
        // Check if we've reached the 10 person limit
        if (tracking.users.size >= 10) {
            console.log(`🚫 Channel is full (${tracking.users.size}/10)`);
            // Delete the message if it's not "+" or "-"
            if (messageContent !== '+' && messageContent !== '-') {
                try {
                    await message.delete();
                } catch (error) {
                    console.log(`Could not delete message: ${error.message}`);
                }
            }
            
            // Create list of registered people with empty slots
            const registeredList = [];
            const emptySlots = [];
            
            // Fill in registered names (use a different variable name to avoid conflict)
            const currentUsers = Array.from(tracking.users);
            for (let i = 1; i <= 10; i++) {
                if (i <= currentUsers.length) {
                    // Find the username for this position
                    const currentUserId = currentUsers[i - 1];
                    const username = tracking.usernames.get(currentUserId);
                    registeredList.push(`${i}. ${username}`);
                } else {
                    // Empty slot
                    emptySlots.push(`${i}. [Empty Slot]`);
                }
            }
            
            // Combine registered and empty slots
            const fullList = [...registeredList, ...emptySlots];
            
            try {
                const warningMsg = await message.channel.send({
                    content: `# 🎯 Salamanca Informal Registration\n\n🚫 **Channel Registration is FULL!**\n\n📋 **Registered People (${tracking.users.size}/10):**\n${fullList.join('\n')}\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n⏰ **Next reset:** ${getNextResetTime(tracking.lastReset)}\n\n---\n**Made by Zircon**`
                });
                
                // Auto-delete warning after 2 minutes
                setTimeout(async () => {
                    try {
                        await warningMsg.delete();
                    } catch (error) {
                        console.log(`Could not delete warning message: ${error.message}`);
                    }
                }, 120000);
            } catch (error) {
                console.error(`❌ Failed to send channel full message: ${error.message}`);
            }
            return;
        } else if (messageContent !== '+') {
            console.log(`⚠️ Invalid message: "${messageContent}" - not "+" or "-"`);
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
                    content: `# 🎯 Salamanca Informal Registration\n\n⚠️ **${displayName}**, Please Enter + for Registration or - to Cancel\n\n---\n**Made by Zircon**`
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
        
        // Only reach here if messageContent === '+'
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
                    content: `# 🎯 Salamanca Informal Registration\n\n📋 **All Registered People (10/10):**\n${registeredList}\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n⏰ **Next reset:** ${getNextResetTime(tracking.lastReset)}\n\n---\n**Made by Zircon**`
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
            
            // Fill in registered names (use a different variable name to avoid conflict)
            const currentUsers = Array.from(tracking.users);
            for (let i = 1; i <= 10; i++) {
                if (i <= currentUsers.length) {
                    // Find the username for this position
                    const currentUserId = currentUsers[i - 1];
                    const username = tracking.usernames.get(currentUserId);
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
                const confirmMsg = await message.channel.send({
                    content: `# 🎯 Salamanca Informal Registration\n\n✅ **${displayName}** successfully registered!\n\n📊 **Status:** ${tracking.users.size}/10 people registered\n⏰ Next reset: ${getNextResetTime(tracking.lastReset)}\n\n📋 **Instructions:** Press **+** for registration, **-** for cancellation\n\n📋 **Current Registration List:**\n${fullList.join('\n')}\n\n---\n**Made by Zircon**`
                });
                
                // Auto-delete confirmation after 2 minutes
                setTimeout(async () => {
                    try {
                        await confirmMsg.delete();
                    } catch (error) {
                        console.log(`Could not delete confirmation message: ${error.message}`);
                    }
                }, 120000);
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