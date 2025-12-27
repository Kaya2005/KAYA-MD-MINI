// ==================== commands/resetlink.js ====================
import checkAdminOrOwner from '../system/checkAdmin.js';

export default {
  name: 'resetlink',
  alias: ['grouplink', 'linkreset'],
  description: 'Réinitialise le lien d’invitation du groupe',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  async run(kaya, m, args) {
    try {
      const chatId = m.chat;

      if (!m.isGroup) return kaya.sendMessage(chatId, { text: '❌ Cette commande fonctionne uniquement dans un groupe.' }, { quoted: m });

      // 🔹 Vérification admin / owner
      const permissions = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!permissions.isAdminOrOwner) {
        return kaya.sendMessage(chatId, { text: '🚫 Seuls les Admins ou le Propriétaire peuvent utiliser cette commande.' }, { quoted: m });
      }

      // 🔹 Vérifier si le bot est admin
      const groupMetadata = await kaya.groupMetadata(chatId);
      const botId = kaya.user.id;
      const isBotAdmin = groupMetadata.participants
        .filter(p => p.admin)
        .map(p => p.id)
        .includes(botId);

      if (!isBotAdmin) {
        return kaya.sendMessage(chatId, { text: '❌ Le bot doit être admin pour réinitialiser le lien du groupe.' }, { quoted: m });
      }

      // 🔹 Réinitialiser le lien
      const newCode = await kaya.groupRevokeInvite(chatId);

      // 🔹 Envoyer le nouveau lien
      await kaya.sendMessage(chatId, {
        text: `✅ Le lien du groupe a été réinitialisé avec succès.\n\n📌 Nouveau lien :\nhttps://chat.whatsapp.com/${newCode}`
      }, { quoted: m });

    } catch (error) {
      console.error('❌ Erreur resetlink command:', error);
      await kaya.sendMessage(m.chat, { text: '❌ Impossible de réinitialiser le lien du groupe.' }, { quoted: m });
    }
  }
};