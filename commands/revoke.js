// ================= commands/revoke.js =================
import checkAdminOrOwner from '../system/checkAdmin.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'revoke',
  description: '❌ Rétrograder un admin du groupe',
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
      // 📌 Mentionné
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 📌 Réponse à un message
      else if (m.quoted?.sender) {
        target = m.quoted.sender;
      }
      // 📌 Numéro donné en argument
      else if (args.length) {
        target = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
      }
      // 📌 Aucun membre trouvé
      else {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Mentionne la personne, réponds à son message ou donne son numéro.', contextInfo },
          { quoted: m }
        );
      }

      // Exécuter la rétrogradation
      await kaya.groupParticipantsUpdate(m.chat, [target], 'demote');

      // Confirmation
      return kaya.sendMessage(
        m.chat,
        { text: `✅ @${target.split('@')[0]} n'est plus admin !`, mentions: [target], contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Erreur revoke :', err);
      return kaya.sendMessage(
        m.chat,
        { text: `❌ Impossible de rétrograder ce membre.\nDétails : ${err.message}`, contextInfo },
        { quoted: m }
      );
    }
  }
};