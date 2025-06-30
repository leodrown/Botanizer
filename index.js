// Express ve Discord.js modülleri
const express = require('express');
const app = express();

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // .env dosyasını kullanmak için

// Bot istemcisi
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Bot aktif olduğunda
client.once('ready', () => {
  console.log(`${client.user.tag} çalışıyor AĞAAA!`);
});

// Komutlar
client.on('messageCreate', message => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  if (msg === '!ping') {
    message.reply('Pong! 🏓');
  }

  if (msg === '!selam') {
    message.reply('Aleyküm selam ağa! 🤝');
  }

  if (msg === '!adana') {
    message.channel.send('🔥 Adana sıcağı bile bu bot kadar aktif değil!');
  }

  if (msg === '!yardım') {
    message.channel.send(`
**Komutlar**
> !ping - Bot çalışıyor mu bakarsın  
> !selam - Selam ver  
> !adana - Adana havası  
> !yardım - Yardım listesi
    `);
  }
});

// Discord token ile giriş
client.login(process.env.DISCORD_TOKEN);

// Express sunucusu (UptimeRobot için)
app.get('/', (req, res) => res.send('Bot aktif, uyku haram! 🔥'));
app.listen(3000, () => console.log('Express sunucusu çalışıyor! ✅'));
