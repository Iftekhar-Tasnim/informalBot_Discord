const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Test if bot is responding',
  async execute(message, args) {
    const sent = await message.reply('🏓 Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`# 🎯 Salamanca Informal Registration\n\n🏓 **Pong!**\n\n⏱️ **Round-trip latency:** ${latency}ms\n✅ **Bot is responding and active!**\n\n---\n**Made by Zircon**`);
  }
};
