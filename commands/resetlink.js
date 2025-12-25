export default {
  name: 'resetlink',
  alias: ['grouplink', 'linkreset'],
  description: 'Réinitialise le lien d’invitation du groupe',
  category: 'Group',

  async run(kaya, m, args) {
    try {
      const chatId = m.chat;
      const senderId = m.sender;

      // Vérifier si l’utilisateur est admin
      const groupMetadata = await kaya.groupMetadata(chatId);
      const isAdmin = groupMetadata.participants
        .filter(p => p.admin)
        .map(p => p.id)
        .includes(senderId);

      if (!isAdmin) {
        return kaya.sendMessage(chatId, { text: '❌ Seuls les admins peuvent utiliser cette commande.' }, { quoted: m });
      }

      // Vérifier si le bot est admin
      const botId = kaya.user.id.split(':')[0] + '@s.whatsapp.net';
      const isBotAdmin = groupMetadata.participants
        .filter(p => p.admin)
        .map(p => p.id)
        .includes(botId);

      if (!isBotAdmin) {
        return kaya.sendMessage(chatId, { text: '❌ Le bot doit être admin pour réinitialiser le lien du groupe.' }, { quoted: m });
      }

      // Réinitialiser le lien du groupe
      const newCode = await kaya.groupRevokeInvite(chatId);

      // Envoyer le nouveau lien
      await kaya.sendMessage(chatId, {
        text: `✅ Le lien du groupe a été réinitialisé avec succès.\n\n📌 Nouveau lien :\nhttps://chat.whatsapp.com/${newCode}`
      }, { quoted: m });

    } catch (error) {
      console.error('Erreur resetlink command:', error);
      await kaya.sendMessage(m.chat, { text: '❌ Impossible de réinitialiser le lien du groupe.' }, { quoted: m });
    }
  }
};