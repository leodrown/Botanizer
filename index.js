const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActivityType } = require('discord.js');
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

const fieldNames = {
  AD: 'Ad',
  SOYAD: 'Soyad',
  TC: 'TC Kimlik No',
  GSM: 'GSM',
  BABAADI: 'Baba Adı',
  BABATC: 'Baba TC',
  ANNEADI: 'Anne Adı',
  ANNETC: 'Anne TC',
  DOGUMTARIHI: 'Doğum Tarihi',
  OLUMTARIHI: 'Ölüm Tarihi',
  DOGUMYERI: 'Doğum Yeri',
  MEMLEKETIL: 'Memleket İl',
  MEMLEKETILCE: 'Memleket İlçe',
  MEMLEKETKOY: 'Memleket Köy',
  ADRESIL: 'Adres İl',
  ADRESILCE: 'Adres İlçe',
  AILESIRANO: 'Aile Sıra No',
  BIREYSIRANO: 'Birey Sıra No',
  MEDENIHAL: 'Medeni Hal',
  CINSIYET: 'Cinsiyet',
};

client.once('ready', async () => {
  console.log(`${client.user.tag} aktif ağa 🔥`);
  console.log('Hazırlayan: leo.drown 👨‍💻');

  client.user.setPresence({
    activities: [{ name: 'sorguları', type: ActivityType.Watching }],
    status: 'online',
  });

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

  const { commandName, options } = interaction;
  await interaction.deferReply();

  try {
    if (commandName === 'hakkinda') {
      return await interaction.editReply(`
🤖 ***Botanizer Sorgu Botu***
🔌 Prefix: Slash /
👨‍💻 Hazırlayan: **leo.drown**  
https://www.instagram.com/leo.drown?igsh=MXZ4NWU1dzMxYXlwYw==  
🛠️ Güçlüdür, sessizdir, işini yapar.  
🇹🇷 Adana onaylıdır.
      `);
    }

    let apiURL;

    switch (commandName) {
      case 'sorgu_adsoyad': {
        const ad = options.getString('ad');
        const soyad = options.getString('soyad');
        const il = options.getString('il') || '';
        apiURL = `https://api.hexnox.pro/sowixapi/adsoyadilce.php?ad=${encodeURIComponent(ad)}&soyad=${encodeURIComponent(soyad)}&il=${encodeURIComponent(il)}`;
        break;
      }
      case 'sorgu_adres': {
        const tc = options.getString('tc');
        apiURL = `https://api.hexnox.pro/sowixapi/adres.php?tc=${encodeURIComponent(tc)}`;
        break;
      }
      case 'sorgu_sulale': {
        const tc = options.getString('tc');
        apiURL = `https://api.hexnox.pro/sowixapi/sulale.php?tc=${encodeURIComponent(tc)}`;
        break;
      }
      case 'sorgu_gsmtotc': {
        const gsm = options.getString('gsm');
        apiURL = `https://api.hexnox.pro/sowixapi/gsm.php?gsm=${encodeURIComponent(gsm)}`;
        break;
      }
      case 'sorgu_tctogsm': {
        const tc = options.getString('tc');
        apiURL = `https://api.hexnox.pro/sowixapi/tcgsm.php?tc=${encodeURIComponent(tc)}`;
        break;
      }
      default:
        return await interaction.editReply('Bilinmeyen komut 🚨');
    }

    const response = await fetch(apiURL);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    if (typeof data !== 'object' || !Array.isArray(data.data) || data.data.length === 0) {
      return await interaction.editReply('📄 Hiçbir kayıt bulunamadı.');
    }

    const messages = [];
    let currentChunk = '';

    data.data.forEach((item, index) => {
      let chunk = `📦 **Kayıt ${index + 1}**\n`;
      for (const [key, value] of Object.entries(item)) {
        if (value && value !== 'YOK' && value !== 'Bilinmiyor') {
          const niceKey = fieldNames[key] || key;
          chunk += `**${niceKey}**: ${value}\n`;
        }
      }
      chunk += '\n';

      if ((currentChunk + chunk).length > 2000) {
        messages.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += chunk;
    });

    if (currentChunk.length > 0) messages.push(currentChunk);

    for (let i = 0; i < messages.length; i++) {
      if (i === 0) {
        await interaction.editReply(messages[i]);
      } else {
        await interaction.followUp(messages[i]);
      }
    }

    await interaction.followUp(`👨‍💻 Hazırlayan: **leo.drown**`);
  } catch (err) {
    console.error('Sorgu hatası:', err);
    await interaction.editReply('🚫 Bir hata oluştu, kişi bulunamadı!');
  }
});

app.get('/', (req, res) => res.send('Bot çalışıyor 🟢'));
app.listen(3000, () => console.log('Web sunucusu aktif'));

client.login(process.env.DISCORD_TOKEN);
