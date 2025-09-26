// ================= commands/info.js =================
import { contextInfo } from '../system/contextInfo.js'; 

export default {
  name: 'info',
  description: 'Affiche les informations du développeur du bot Kaya-MD',
  category: 'Général',

  execute: async (kaya, m) => {
    const ownerText = `
╭━━〔  𝙋𝙍𝙊𝙋𝙍𝙄É𝙏𝘼𝙄𝙍𝙀 〕━━⬣
┃ 🤖 *Bot* : KAYA MD MINI
┃ 🌍 *Pays* : 🇨🇩 RDC
┃ 🧠 *Créateur* : 𝗞𝗔𝗬𝗔
┃ 📆 *Bot actif depuis* : 2025
╰━━━━━━━━━━━━━━━━━━━━⬣

╭─〔 🔗 𝙇𝙄𝙀𝙉𝙎 𝙐𝙏𝙄𝙇𝙀𝙎 〕─⬣
┃ 💬 *WhatsApp* :
┃ wa.me/243993621718
┃
┃ 📺 *Chaîne YouTube* :
┃ https://youtube.com/@KAYATECH243
┃
┃ 🧑‍💻 *GitHub* :
┃ https://github.com/Kaya2005/KAYA-MD-MINI
┃
┃ ✈️ *Canal Telegram* :
┃ https://t.me/techword1
╰━━━━━━━━━━━━━━━━━━━━⬣
    `.trim();

    await kaya.sendMessage(
      m.chat,
      { text: ownerText, contextInfo },
      { quoted: m }
    );
  }
};