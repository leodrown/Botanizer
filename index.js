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

const cooldowns = new Map();

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

  const userId = interaction.user.id;
  const now = Date.now();
  const cooldownAmount = 10000; // 10 saniye

  if (cooldowns.has(userId)) {
    const expirationTime = cooldowns.get(userId) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
      return interaction.reply({ content: `⏳ Biraz bekle, ${timeLeft} saniye kaldı!`, ephemeral: true });
    }
  }

  cooldowns.set(userId, now);

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
    const textData = await response.text();

    let data;
    try {
      data = JSON.parse(textData);
    } catch (err) {
      console.error('JSON parse hatası:', err);
      data = null;
    }

    if (!data) {
      return await interaction.editReply('🚫 API’den geçerli veri alınamadı.');
    }

    // Burada her API endpoint için veriyi farklı işle (örnekleri ekliyorum)
    let message = '';

    if (commandName === 'sorgu_adsoyad') {
      if (data.success && data.data && data.data.length > 0) {
        const kisi = data.data[0];
        message = `
**TC:** ${kisi.TC || 'Bilinmiyor'}
**Ad:** ${kisi.AD || 'Bilinmiyor'}
**Soyad:** ${kisi.SOYAD || 'Bilinmiyor'}
**Doğum:** ${kisi.DOGUMTARIHI || 'Bilinmiyor'}
**Anne:** ${kisi.ANNEADI || 'Bilinmiyor'} - ${kisi.ANNETC || 'Bilinmiyor'}
**Baba:** ${kisi.BABAADI || 'Bilinmiyor'} - ${kisi.BABATC || 'Bilinmiyor'}
**İl:** ${kisi.MEMLEKETIL || 'Bilinmiyor'}
**İlçe:** ${kisi.MEMLEKETILCE || 'Bilinmiyor'}
        `;
      } else {
        message = '❌ Kayıt bulunamadı.';
      }
    } else if (commandName === 'sorgu_adres') {
      if (data.success && data.data) {
        const adres = data.data;
        message = `
**Adres:** ${adres.ADRES || 'Bilinmiyor'}
**İl:** ${adres.IL || 'Bilinmiyor'}
**İlçe:** ${adres.ILCE || 'Bilinmiyor'}
        `;
      } else {
        message = '❌ Kayıt bulunamadı.';
      }
    } else if (commandName === 'sorgu_sulale') {
      if (data.success && data.data && data.data.length > 0) {
        message = '**Sülale Bilgileri:**\n';
        data.data.forEach((item, idx) => {
          message += `${idx + 1}. ${item.AD || 'Bilinmiyor'} - ${item.SOYAD || 'Bilinmiyor'}\n`;
        });
      } else {
        message = '❌ Kayıt bulunamadı.';
      }
    } else if (commandName === 'sorgu_gsmtotc') {
      if (data.success && data.data) {
        message = `
**GSM:** ${data.data.GSM || 'Bilinmiyor'}
**TC:** ${data.data.TC || 'Bilinmiyor'}
        `;
      } else {
        message = '❌ Kayıt bulunamadı.';
      }
    } else if (commandName === 'sorgu_tctogsm') {
      if (data.success && data.data) {
        message = `
**TC:** ${data.data.TC || 'Bilinmiyor'}
**GSM:** ${data.data.GSM || 'Bilinmiyor'}
        `;
      } else {
        message = '❌ Kayıt bulunamadı.';
      }
    } else {
      message = '🚫 Bilinmeyen komut.';
    }

    message += `\n\n👨‍💻 hazırlayan: **leo.drown**`;

    await interaction.editReply(message);
  } catch (err) {
    console.error('Sorgu hatası:', err);
    await interaction.editReply('🚫 Bir hata oluştu, API ulaşamadı.');
  }
});

app.get('/', (req, res) => res.send('Bot çalışıyor 🟢'));
app.listen(3000, () => console.log('Web sunucusu aktif'));

client.login(process.env.DISCORD_TOKEN);
