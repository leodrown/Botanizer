const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');
const app = express();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Slash komutu tanımı
const sorgulaCommand = new SlashCommandBuilder()
  .setName('sorgula')
  .setDescription('Ad, Soyad ve isteğe bağlı il ile sorgulama yapar.')
  .addStringOption(option =>
    option.setName('ad')
      .setDescription('Adı girin')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('soyad')
      .setDescription('Soyadı girin')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('il')
      .setDescription('İl (isteğe bağlı)')
      .setRequired(false));

// Komutları Discord’a kaydetme
client.once('ready', async () => {
  console.log(`${client.user.tag} hazır ağa!`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('Slash komutları kaydediliyor...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [sorgulaCommand.toJSON()] }
    );
    console.log('Komutlar yüklendi!');
  } catch (error) {
    console.error('Komut kaydında hata:', error);
  }
});

// Slash komut çalıştığında
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'sorgula') {
    const ad = interaction.options.getString('ad');
    const soyad = interaction.options.getString('soyad');
    const il = interaction.options.getString('il') || 'Bilinmiyor';

    const apiURL = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.hexnox.pro/sowixapi/adsoyadilice.php?ad=${ad}&soyad=${soyad}`)}`;

    await interaction.deferReply(); // "Yükleniyor..." mesajı için

    try {
      const response = await fetch(apiURL);
      const data = await response.json();
      const json = JSON.parse(data.contents);

      if (json.success && json.data.length > 0) {
        const kisi = json.data[0];
        await interaction.editReply(`
**TC:** ${kisi.TC}
**Ad:** ${kisi.AD}
**Soyad:** ${kisi.SOYAD}
**Doğum:** ${kisi.DOGUMTARIHI}
**Anne:** ${kisi.ANNEADI} - ${kisi.ANNETC}
**Baba:** ${kisi.BABAADI} - ${kisi.BABATC}
**İl:** ${kisi.MEMLEKETIL || il}
**İlçe:** ${kisi.MEMLEKETILCE}
🇹🇷
        `);
      } else {
        await interaction.editReply('❌ Kayıt bulunamadı.');
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply('🚨 API sorgusu başarısız.');
    }
  }
});

// Express sunucusu
app.get('/', (req, res) => res.send('Bot çalışıyor, uyumuyo 🔥'));
app.listen(3000, () => console.log('Express sunucu açık'));

client.login(process.env.DISCORD_TOKEN);
