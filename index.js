const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');
const app = express();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('sorgu_adsoyad')
    .setDescription('Ad Soyad İl ile sorgu')
    .addStringOption(o => o.setName('ad').setDescription('Ad').setRequired(true))
    .addStringOption(o => o.setName('soyad').setDescription('Soyad').setRequired(true))
    .addStringOption(o => o.setName('il').setDescription('İl (isteğe bağlı)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('sorgu_adres')
    .setDescription('TC ile adres sorgula')
    .addStringOption(o => o.setName('tc').setDescription('TC Kimlik No').setRequired(true)),

  new SlashCommandBuilder()
    .setName('sorgu_sulale')
    .setDescription('TC ile sülale sorgula')
    .addStringOption(o => o.setName('tc').setDescription('TC Kimlik No').setRequired(true)),

  new SlashCommandBuilder()
    .setName('sorgu_gsmtotc')
    .setDescription('GSM ile TC sorgula')
    .addStringOption(o => o.setName('gsm').setDescription('Telefon numarası (05...)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('sorgu_tctogsm')
    .setDescription('TC ile GSM sorgula')
    .addStringOption(o => o.setName('tc').setDescription('TC Kimlik No').setRequired(true)),

  new SlashCommandBuilder()
    .setName('hakkinda')
    .setDescription('Bot hakkında bilgi verir')
];

client.once('ready', async () => {
  console.log(`${client.user.tag} aktif ağa 🔥`);
  console.log('Hazırlayan: leo.drown 👨‍💻');

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands.map(cmd => cmd.toJSON())
    });
    console.log('Komutlar başarıyla yüklendi ✅');
  } catch (err) {
    console.error('Komut yükleme hatası:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply();

  const { commandName, options } = interaction;

  try {
    if (commandName === 'hakkinda') {
      return await interaction.editReply(`
🤖 **Sowix Sorgu Botu**
🔌 Proxy destekli, çoklu API ile çalışır
👨‍💻 Hazırlayan: **leo.drown**
🛠️ Güçlüdür, sessizdir, işini yapar.
🇹🇷 Adana onaylıdır.
      `);
    }

    let url;

    switch (commandName) {
      case 'sorgu_adsoyad': {
        const ad = options.getString('ad');
        const soyad = options.getString('soyad');
        const il = options.getString('il') || '';
        url = `https://api.hexnox.pro/sowixapi/adsoyadilce.php?ad=${ad}&soyad=${soyad}&il=${il}`;
        break;
      }
      case 'sorgu_adres': {
        const tc = options.getString('tc');
        url = `https://api.hexnox.pro/sowixapi/adres.php?tc=${tc}`;
        break;
      }
      case 'sorgu_sulale': {
        const tc = options.getString('tc');
        url = `https://api.hexnox.pro/sowixapi/sulale.php?tc=${tc}`;
        break;
      }
      case 'sorgu_gsmtotc': {
        const gsm = options.getString('gsm');
        url = `https://api.hexnox.pro/sowixapi/gsm.php?gsm=${gsm}`;
        break;
      }
      case 'sorgu_tctogsm': {
        const tc = options.getString('tc');
        url = `https://api.hexnox.pro/sowixapi/tcgsm.php?tc=${tc}`;
        break;
      }
      default:
        return await interaction.editReply('Bilinmeyen komut 🚨');
    }

    const proxyURL = `https://bb4757b0-d804-47d1-9ee7-d6fac476c4d0-00-2ldtcj7sqhydj.picard.replit.dev/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyURL);
    const data = await response.json();

    let finalOutput;
    try {
      finalOutput = '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    } catch (e) {
      finalOutput = '```' + data + '```';
    }

    finalOutput += `\n👨‍💻 hazırlayan: **leo.drown**`;

    await interaction.editReply(finalOutput);
  } catch (err) {
    console.error('Sorgu hatası:', err);
    await interaction.editReply('🚫 Bir hata oluştu, API ulaşamadı.');
  }
});

app.get('/', (req, res) => res.send('Bot çalışıyor 🟢'));
app.listen(3000, () => console.log('Web sunucusu aktif'));

client.login(process.env.DISCORD_TOKEN);
