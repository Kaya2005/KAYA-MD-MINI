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

      // ✅ Vérifie si la personne qui lance est admin/owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) return;

      // ✅ Récupère la cible (tag, reply ou numéro)
      const target = m.message?.[Object.keys(m.message)[0]]?.contextInfo?.mentionedJid?.[0]
        || m.quoted?.sender
        || (args[0] ? (args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`) : null);

      if (!target) return;

      // ✅ Exécute la rétrogradation silencieuse
      await kaya.groupParticipantsUpdate(m.chat, [target], 'demote');

      // ❌ Aucun message envoyé
      return;

    } catch (err) {
      console.error('❌ Erreur demote :', err);
      return;
    }
  }
};