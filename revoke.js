// ==================== commands/revoke.js ====================
import checkAdminOrOwner from '../system/checkAdmin.js';

export default {
  name: 'revoke',
  description: '⚡ Rétire silencieusement les droits d’admin à un membre',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, msg, store, args) => {
    try {
      if (!m.isGroup) return;

      // 🔹 Vérification admin / owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) return;

      // 🔹 Récupération de la cible : mention, réponse ou numéro
      let target = m.message?.[Object.keys(m.message)[0]]?.contextInfo?.mentionedJid?.[0]
                  || m.quoted?.sender
                  || (args[0] ? (args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`) : null);

      if (!target) {
        return kaya.sendMessage(m.chat, { text: '⚙️ Usage : `.revoke @utilisateur` ou répondre à son message.' }, { quoted: m });
      }

      // 🔹 Vérification que la cible n’est pas un admin
      const groupMetadata = await kaya.groupMetadata(m.chat);
      const groupAdmins = groupMetadata.participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);

      if (!groupAdmins.includes(target)) return; // cible déjà non-admin

      // 🔹 Rétrogradation silencieuse
      await kaya.groupParticipantsUpdate(m.chat, [target], 'demote');

      // ❌ Aucun message envoyé au groupe
      return;

    } catch (err) {
      console.error('❌ Erreur revoke :', err);
      return;
    }
  }
};