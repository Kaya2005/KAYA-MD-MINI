// ================= commands/lock.js =================
import checkAdminOrOwner from '../system/checkAdmin.js';
import { contextInfo } from '../system/contextInfo.js'; // import centralisé

export const name = 'lock';
export const description = '🔒 Ferme le groupe (seuls les admins peuvent écrire).';
export const group = true;
export const admin = true;
export const botAdmin = true;

export async function run(kaya, m, msg, store, args) {
  // Vérifie si l'utilisateur est admin ou owner
  const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
  permissions.isAdminOrOwner = permissions.isAdmin || permissions.isOwner;

  if (!permissions.isAdminOrOwner) {
    return kaya.sendMessage(
      m.chat,
      { text: '🚫 Accès refusé : Seuls les admins ou owners peuvent fermer le groupe.', contextInfo },
      { quoted: m }
    );
  }

  try {
    // Ferme le groupe pour tous
    await kaya.groupSettingUpdate(m.chat, 'announcement');

    const text = `
╭━━〔🔒 GROUPE FERMÉ〕━━⬣
┃ 📛 Les membres ne peuvent plus envoyer de messages.
┃ ✅ Utilise *.unlock* pour rouvrir le groupe.
╰━━━━━━━━━━━━━━━━━━━━⬣
    `.trim();

    await kaya.sendMessage(
      m.chat,
      { text, mentions: [m.sender], contextInfo },
      { quoted: m }
    );
  } catch (err) {
    console.error('Erreur lock.js :', err);
    await kaya.sendMessage(
      m.chat,
      { text: '❌ Impossible de fermer le groupe. Vérifie que je suis admin.', contextInfo },
      { quoted: m }
    );
  }
}