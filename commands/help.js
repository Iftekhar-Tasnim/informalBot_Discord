const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays help information'),
  async execute(interaction) {
    await interaction.reply('Available commands: /ping, /help');
  }
};
