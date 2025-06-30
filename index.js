const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();
require('./server'); // Web sunucu başlat

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === '!roket') {
    try {
      const response = await fetch('https://api.spacexdata.com/v4/rockets');
      const data = await response.json();
      const roket = data[0];
      message.reply(`🚀 Roket: ${roket.name}\n🧪 Yük: ${roket.payload_weights[0].kg} kg\n🌍 Firma: SpaceX`);
    } catch (error) {
      console.error(error);
      message.reply('API’den veri çekemedim ağa 😓');
    }
  }
});

client.login(process.env.TOKEN);
