require('dotenv').config();
const bot = require('./bot/setup');

bot.login(process.env.BOT_TOKEN);