module.exports = {
  name: 'help',
  description: 'Displays help information',
  async execute(message, args) {
    await message.reply(`# 🎯 Salamanca Informal Registration\n\n📚 **Salamanca Informal Bot Commands:**\n• \`!ping\` - Test if bot is responding\n• \`!help\` - Show this help message\n• \`!stats\` - Show current monitoring stats\n• \`/informalbot start\` - Activate bot for this channel\n• \`/informalbot stop\` - Deactivate bot for this channel\n• \`/informalbot status\` - Check bot status\n\n📝 **Registration Commands:**\n• \`+\` - Register for the event\n• \`-\` - Cancel your registration\n\n🔧 **Admin Commands:**\n• \`!testevents\` - Test timing functionality (Admin only)\n\n🎯 **For 5 | ᴛᴜʀғᴇʀ rank people only!**\n\n⏰ **Registration Schedule (GMT+6 / Bangladesh Time):**\n• **🟢 Opens:** Every hour at **XX:30** (30 minutes past)\n• **🔴 Closes:** Every hour at **XX:45** (45 minutes past)\n• **⏱️ Duration:** **15 minutes** per hour\n• **🔄 Reset:** Every hour at **XX:30**\n\n**Example:**\n• 1:30 PM - Registration OPENS\n• 1:45 PM - Registration CLOSES\n• 2:30 PM - Registration OPENS again\n\n---\n**Made by Zircon**`);
  }
};
