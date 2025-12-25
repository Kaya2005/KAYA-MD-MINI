// ==================== commands/lock.js ====================
import checkAdminOrOwner from '../system/checkAdmin.js';
import { contextInfo } from '../system/contextInfo.js';

export const name = 'lock';
export const description = '🔒 Ferme le groupe (seuls les admins peuvent écrire).';
export const group = true;
export const admin = true;
export const botAdmin = true;

export async function run(kaya, m, msg, store, args) {
  try {
    // ✅ Vérifie si l’utilisateur est admin ou owner
    const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
    if (!permissions.isAdminOrOwner) {
      return kaya.sendMessage(
        m.chat,
        {
          text: '🚫 Accès refusé : Seuls les admins ou owners peuvent utiliser cette commande.',
          contextInfo
        },
        { quoted: m }
      );
    }

    // 🔒 Ferme le groupe (admins seulement)
    await kaya.groupSettingUpdate(m.chat, 'announcement');

    const text = `
╭━━〔🔒 GROUPE FERMÉ〕━━⬣
┃ 🚫 Seuls les admins peuvent écrire.
┃ 📌 Pour rouvrir : *.unlock*
╰━━━━━━━━━━━━━━━━━━━━⬣
    `.trim();

    await kaya.sendMessage(
      m.chat,
      {
        text,
        mentions: [m.sender],
        contextInfo
      },
      { quoted: m }
    );

  } catch (err) {
    console.error('Erreur lock.js :', err);
    await kaya.sendMessage(
      m.chat,
      {
        text: '❌ Impossible de fermer le groupe. Vérifie que je suis admin.',
        contextInfo
      },
      { quoted: m }
    );
  }
}