import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'alive',
  description: 'Montre que le bot est en ligne',
  category: 'Info',
  ownerOnly: false, // accessible à tous

  run: async (kaya, m) => {
    try {
      const uptime = process.uptime(); // en secondes
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const message = `╭─「 𝗞𝗔𝗬𝗔-𝗠𝗗 」─⬣
│  *J'suis 𝗞𝗔𝗬𝗔-𝗠𝗗*
│ ⏱️ *Uptime :* ${hours}h ${minutes}m ${seconds}s
╰───────────────⬣`;

      await kaya.sendMessage(
        m.chat,
        {
          text: message,
          contextInfo // ← replyable
        },
        { quoted: m }
      );
    } catch (err) {
      console.error("Erreur alive.js :", err);
      await kaya.sendMessage(m.chat, { text: "❌ Impossible de vérifier le statut du bot." }, { quoted: m });
    }
  }
};