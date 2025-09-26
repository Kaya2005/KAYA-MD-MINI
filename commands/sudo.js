import config, { saveConfig } from '../config.js';
import { contextInfo } from '../system/contextInfo.js';

function normalize(number) {
  return number.split('@')[0].replace(/\D/g, '').trim();
}

export default {
  name: 'sudo',
  description: '➕ Ajoute un nouvel owner (réservé au propriétaire principal)',
  category: 'Owner',
  ownerOnly: true,

  run: async (kaya, m, msg, store, args) => {
    try {
      const sender = normalize(m.sender);
      const mainOwner = normalize(config.OWNER_NUMBER.split(',')[0]);

      // ✅ Vérifie que seul le propriétaire principal peut utiliser
      if (sender !== mainOwner) {
        return kaya.sendMessage(
          m.chat,
          { text: '🚫 *Seul le propriétaire principal peut utiliser cette commande.*', contextInfo },
          { quoted: m }
        );
      }

      // ✅ Récupération du numéro cible
      let targetId;
      if (m.quoted?.sender) {
        targetId = normalize(m.quoted.sender);
      } else if (args[0]) {
        targetId = args[0].replace(/\D/g, '').trim();
      } else {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ *Fournis un numéro ou réponds à un message pour ajouter comme owner.*', contextInfo },
          { quoted: m }
        );
      }

      // ✅ Vérifie si déjà owner
      let owners = config.OWNER_NUMBER.split(',').map(normalize);

      if (owners.includes(targetId)) {
        return kaya.sendMessage(
          m.chat,
          { text: `ℹ️ *@${targetId}* est déjà owner.`, mentions: [targetId + '@s.whatsapp.net'], contextInfo },
          { quoted: m }
        );
      }

      // ✅ Ajoute et sauvegarde
      owners.push(targetId);
      if (saveConfig) saveConfig({ OWNER_NUMBER: owners.join(',') });

      return kaya.sendMessage(
        m.chat,
        {
          text: `╭━━〔 👑 AJOUT OWNER 〕━━⬣
├ 📲 Numéro : @${targetId}
├ ✅ Statut : *Ajouté comme OWNER avec succès !*
├ 🔐 Accès : *Total au bot KAYA-MD*
╰────────────────────⬣`,
          mentions: [targetId + '@s.whatsapp.net'],
          contextInfo
        },
        { quoted: m }
      );
    } catch (err) {
      console.error("❌ Erreur commande sudo:", err);
      return kaya.sendMessage(
        m.chat,
        { text: "⚠️ Impossible d’ajouter ce membre comme owner.", contextInfo },
        { quoted: m }
      );
    }
  }
};