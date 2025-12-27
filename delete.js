import checkAdminOrOwner from '../system/checkAdmin.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'delete',
  description: '🗑️ Supprime un ou plusieurs messages (répondre à un message ou mention)',
  category: 'Groupe',
  group: true,

  async execute(kaya, m, args, store) {
    try {
      const chatId = m.chat;

      // 🔐 Owner uniquement (sécurisé)
      if (!m.fromMe) return;

      // ✅ Vérifie si c'est une réponse ou mention
      const quoted = m.quoted;
      const mentioned = m.mentionedJid?.length ? m.mentionedJid[0] : null;

      if (!quoted && !mentioned) {
        return kaya.sendMessage(
          chatId,
          { text: '❌ Réponds à un message ou mentionne un utilisateur pour supprimer.', contextInfo },
          { quoted: m }
        );
      }

      // ✅ Nombre de messages à supprimer (optionnel)
      let count = 1;
      if (args[0]) {
        const n = parseInt(args[0]);
        if (!isNaN(n) && n > 0) count = Math.min(n, 50);
      }

      let targetKey = quoted?.key;
      let targetUser = quoted?.participant || mentioned;

      // ✅ Vérifie les permissions dans un groupe
      if (m.isGroup) {
        const perms = await checkAdminOrOwner(kaya, chatId, m.sender);
        if (!perms.isAdmin && !perms.isOwner) {
          return kaya.sendMessage(
            chatId,
            { text: '🚫 Seuls les *Admins* ou le *Propriétaire* peuvent supprimer un message.', contextInfo },
            { quoted: m }
          );
        }
      }

      // ✅ Supprime le message ciblé (réponse)
      if (targetKey) {
        await kaya.sendMessage(chatId, { delete: targetKey });
        count--;
      }

      // ✅ Supprime d’autres messages du même utilisateur si count > 0
      if (count > 0 && store?.messages[chatId]) {
        const messages = [...store.messages[chatId]].reverse();
        let deleted = 0;
        for (const message of messages) {
          if (deleted >= count) break;
          const participant = message.key.participant || message.key.remoteJid;
          if (participant === targetUser && !message.message?.protocolMessage) {
            try {
              await kaya.sendMessage(chatId, { delete: message.key });
              deleted++;
            } catch {}
          }
        }
      }

    } catch (err) {
      console.error('❌ DELETE ERROR:', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Impossible de supprimer ce message.', contextInfo },
        { quoted: m }
      );
    }
  }
};