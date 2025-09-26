// ==================== commands/unsudo.js ====================
import config, { saveConfig } from '../config.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'unsudo',
  description: '➖ Retire un owner existant (réservé au propriétaire principal)',
  category: 'Owner',
  ownerOnly: true, // ✅ le handler bloque déjà les non-owners

  run: async (kaya, m, msg, store, args) => {
    try {
      // 📌 Liste actuelle des owners
      let owners = config.OWNER_NUMBER
        .split(',')
        .map(o => o.replace(/\D/g, '').trim());

      // 📌 Numéro cible depuis reply ou argument
      const targetId =
        (m.quoted?.sender && m.quoted.sender.split('@')[0].replace(/\D/g, '').trim()) ||
        (args[0] && args[0].replace(/\D/g, '').trim());

      if (!targetId) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Réponds à un message ou indique un numéro à retirer.', contextInfo },
          { quoted: m }
        );
      }

      // 📌 Vérifie si la cible est un owner
      if (!owners.includes(targetId)) {
        return kaya.sendMessage(
          m.chat,
          { text: `❌ *@${targetId}* n’est pas un owner.`, mentions: [targetId + '@s.whatsapp.net'], contextInfo },
          { quoted: m }
        );
      }

      // 📌 Retire le numéro de la liste
      owners = owners.filter(o => o !== targetId);
      saveConfig({ OWNER_NUMBER: owners.join(',') });

      // 📌 Confirmation
      return kaya.sendMessage(
        m.chat,
        {
          text: `╭━━〔 🔓 RETRAIT OWNER 〕━━⬣
├ 📲 Numéro : @${targetId}
├ ❌ Statut : Supprimé de la liste des owners
├ 🧹 Nettoyage terminé
╰────────────────────⬣`,
          mentions: [targetId + '@s.whatsapp.net'],
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Erreur unsudo.js :', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue lors du retrait de l’owner.', contextInfo },
        { quoted: m }
      );
    }
  }
};