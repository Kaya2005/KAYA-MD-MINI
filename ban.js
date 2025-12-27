import { contextInfo } from '../system/contextInfo.js';
import { saveBannedUsers } from '../system/bannedUsers.js';

export default {
  name: "ban",
  description: "🚫 Bannir un utilisateur du bot",
  category: "Owner",

  async execute(Kaya, m, args) {

    // 🔐 Owner uniquement
    if (!m.fromMe) return;

    if (!args[0] && !m.quoted) {
      return Kaya.sendMessage(
        m.chat,
        { text: '❌ Usage : ban <numéro ou @mention>', contextInfo },
        { quoted: m }
      );
    }

    let userJid;
    if (m.mentionedJid?.length) {
      userJid = m.mentionedJid[0];
    } else if (m.quoted?.sender) {
      userJid = m.quoted.sender;
    } else {
      userJid = args[0].includes('@')
        ? args[0]
        : `${args[0].replace(/\D/g, '')}@s.whatsapp.net`;
    }

    userJid = userJid.toLowerCase();

    if (!global.bannedUsers) global.bannedUsers = new Set();
    if (global.bannedUsers.has(userJid)) {
      return Kaya.sendMessage(
        m.chat,
        { text: `ℹ️ ${userJid} est déjà banni du bot.`, contextInfo },
        { quoted: m }
      );
    }

    global.bannedUsers.add(userJid);
    saveBannedUsers();

    await Kaya.sendMessage(
      m.chat,
      { text: `✅ ${userJid} a été banni du bot.`, contextInfo },
      { quoted: m }
    );
  }
};