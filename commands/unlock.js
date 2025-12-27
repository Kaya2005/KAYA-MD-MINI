// ==================== commands/unlock.js ====================
import checkAdminOrOwner from '../system/checkAdmin.js'; 
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'unlock',
  description: '🔓 Ouvre le groupe (tout le monde peut écrire)',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, msg, store, args) => {
    try {
      // 🔹 Vérifie si l’utilisateur est admin / owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) {
        return kaya.sendMessage(
          m.chat,
          { text: '🚫 Accès refusé : Seuls les admins ou owners peuvent utiliser cette commande.', contextInfo },
          { quoted: m }
        );
      }

      // 🔹 Débloque le groupe (tout le monde peut écrire)
      await kaya.groupSettingUpdate(m.chat, 'not_announcement');

      const text = `
╭━━〔🔓 GROUPE OUVERT〕━━⬣
┃ ✨ Les *membres* peuvent de nouveau écrire.
┃ 📌 N'oublie pas de le refermer si besoin avec *.lock*
╰━━━━━━━━━━━━━━━━━━━━⬣
      `.trim();

      await kaya.sendMessage(
        m.chat,
        { text, mentions: [m.sender], contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Erreur unlock.js :', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Impossible d’ouvrir le groupe. Vérifie que je suis admin.', contextInfo },
        { quoted: m }
      );
    }
  }
};