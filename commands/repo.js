// ================= commands/repo.js =================
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'repo',
  description: '🔧 Envoie les liens GitHub, YouTube et groupe WhatsApp de support',
  category: 'Apprentissage',

  run: async (kaya, m) => {
    const texte = `
╭━━────〔  SUPPORT  〕─────━━⬣
├ 
🔗 GitHub Bot : https://github.com/Kaya2005/KAYA-MD-MINI
├ 
📺 Tutoriel Déploiement : https://youtube.com/@KAYATECH243
├
💬 Groupe WhatsApp : https://chat.whatsapp.com/DZotf319LZy4D6Qxw5A0cn?mode=ems_copy_t
╰──────────────────────────⬣

N’hésite pas à poser tes questions et à suivre les tutoriels !
    `;

    await kaya.sendMessage(
      m.chat,
      { text: texte, contextInfo },
      { quoted: m }
    );
  }
};