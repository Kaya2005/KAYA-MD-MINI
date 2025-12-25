// ================= commands/info.js =================
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'owner',
  aliases: ['owner', 'dev'],
  description: 'Informations sur le développeur du bot KAYA-MD',
  category: 'Général',

  execute: async (kaya, m) => {
    const text = `
╭━━〔 INFORMATIONS DU BOT 〕━━⬣
┃ Bot        : KAYA-MD MINI
┃ Développeur: KAYA
┃ Pays       : RDC 🇨🇩
┃ En ligne   : Depuis 2025
╰━━━━━━━━━━━━━━━━━━━━⬣

╭━━〔 LIENS OFFICIELS 〕━━⬣
┃ WhatsApp : wa.me/243999585890
┃ YouTube  : youtube.com/@KAYATECH243
┃ GitHub   : github.com/Kaya2005/KAYA
┃ Telegram : t.me/techword1
╰━━━━━━━━━━━━━━━━━━━━⬣

Merci d’utiliser KAYA-MD.
Bot simple, rapide et fiable.
`.trim();

    await kaya.sendMessage(
      m.chat,
      {
        text,
        contextInfo
      },
      { quoted: m }
    );
  }
};