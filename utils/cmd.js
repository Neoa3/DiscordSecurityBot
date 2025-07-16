require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
console.clear();

const commands = [];
const commandsPath = path.join(__dirname, '../commands');
fs.readdirSync(commandsPath).forEach(folder => {
  const folderPath = path.join(commandsPath, folder);
  if (fs.lstatSync(folderPath).isDirectory()) {
    fs.readdirSync(folderPath).forEach(file => {
      if (file.endsWith('.js')) {
        const command = require(`../commands/${folder}/${file}`);
        if (command.data) {
          commands.push(command.data.toJSON());
        }
      }
    });
  }
});

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

const CLIENT_ID = process.env.CLIENT_ID;

(async () => {
  try {
    console.log('🌐 Started refreshing global application (/) commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID), // GLOBAL deployment
      { body: commands },
    );
    console.log('✅ Successfully reloaded global application (/) commands.');
  } catch (error) {
    console.error('❌ Failed to register commands globally:', error);
  }
})();