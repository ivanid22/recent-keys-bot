require('dotenv').config();
const Discord = require('discord.js');
const { parseMessage } = require('./actions');

const {Intents} = Discord;
const client = new Discord.Client({ intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('messageCreate', (message) => {
    if (message.channel.name != process.env.BOT_CHANNEL) 
        return;
    parseMessage(message)
});

client.on('ready', () => {
    console.log(`Bot ready as ${client.user.tag}`);
});

module.exports = client;