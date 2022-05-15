require('dotenv').config();
const express = require('express');
const bot = require('./bot/setup');

// 
const app = express();

app.get('/', (req, res) => { res.end() });

app.listen(process.env.PORT || 5000, () => { console.log(`Listening on port ${process.env.PORT ? process.env.PORT : '5000'}`) });

bot.login(process.env.BOT_TOKEN);