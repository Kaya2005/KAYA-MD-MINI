// ================= commands/promote.js =================
import checkAdminOrOwner from "../system/checkAdmin.js";
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'promote',
  description: '👑 Promouvoir un membre du groupe en admin',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, msg, store, args) => {
    try {
      if (!m.isGroup) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Cette commande ne fonctionne que dans un groupe.', contextInfo },
          { quoted: m }
        );
      }

      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      const isAdminOrOwner = permissions.isAdmin || permissions.isOwner;

      if (!isAdminOrOwner) {
        return kaya.sendMessage(
          m.chat,
          { text: '🚫 Seuls les admins ou le propriétaire peuvent utiliser cette commande.', contextInfo },
          { quoted: m }
        );
      }

      let target;
      // Vérifie si un membre est mentionné
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } 
      // Vérifie si on répond à un message
      else if (m.quoted?.sender) {
        target = m.quoted.sender;
      } 
      // Vérifie si un numéro est donné en argument
      else if (args.length) {
        target = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
      } 
      // Sinon erreur
      else {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Mentionne la personne, réponds à son message ou donne son numéro.', contextInfo },
          { quoted: m }
        );
      }

      // Exécuter la promotion
      await kaya.groupParticipantsUpdate(m.chat, [target], 'promote');

      // Confirmation
      return kaya.sendMessage(
        m.chat,
        { text: `✅ @${target.split('@')[0]} est maintenant admin !`, mentions: [target], contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Erreur promote :', err);
      return kaya.sendMessage(
        m.chat,
        { text: `❌ Impossible de promouvoir ce membre.\nDétails : ${err.message}`, contextInfo },
        { quoted: m }
      );
    }
  }
};