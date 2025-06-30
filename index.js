const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');
const app = express();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Slash komut formu
const sorgulaCommand = new SlashCommandBuilder()
  .setName('sorgula')
  .setDescription('Ad, soyad ve isteğe bağlı il ile sorgulama yapar.')
  .addStringOption(option =>
    option.setName('ad')
      .setDescription('Adınızı girin')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('soyad')
      .setDescription('Soyadınızı girin')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('il')
      .setDescription('İl (isteğe bağlı)')
      .setRequired(false));

client.once('ready', async () => {
  console.log(`${client.user.tag} aktif ağa 🔥`);

  // Slash komutu Discord’a tanıtılıyor
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Komutlar kaydediliyor...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [sorgulaCommand.toJSON()] }
    );
    console.log('Slash komutu yüklendi 🔥');
  } catch (error) {
    console.error('Slash komut hatası:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'sorgula') {
    const ad = interaction.options.getString('ad');
    const soyad = interaction.options.getString('soyad');
    const il = interaction.options.getString('il') || 'Bilinmiyor';

    // Güncel proxy servisi: thingproxy
    const apiURL = `https://thingproxy.freeboard.io/fetch/https://api.hexnox.pro/sowixapi/adsoyadilice.php?ad=${ad}&soyad=${soyad}`;

    await interaction.deferReply();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout

      const response = await fetch(apiURL, { signal: controller.signal });
      clearTimeout(timeout);

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
      console.error('API hatası:', err);
      try {
        await interaction.editReply('🚨 Bir hata oluştu, API cevap vermedi.');
      } catch (editErr) {
        console.error('editReply hatası:', editErr);
      }
    }
  }
});

// Express sunucusu
app.get('/', (req, res) => res.send('Bot çalışıyor 🔥'));
app.listen(3000, () => console.log('Web sunucusu ayakta'));

client.login(process.env.DISCORD_TOKEN);
