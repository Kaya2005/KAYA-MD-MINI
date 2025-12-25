// ==================== commands/autostatus.js ====================
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'autostatus',
  description: 'Activer ou désactiver la vue automatique des statuts',
  category: 'Owner',

  run: async (kaya, m, args) => {
    try {
      // 🔐 OWNER UNIQUEMENT (comme prefix.js)
      if (!m.fromMe) return;

      const action = args[0]?.toLowerCase();

      if (!['on', 'off', 'status'].includes(action)) {
        return kaya.sendMessage(
          m.chat,
          {
            text:
`👁️ *Auto Status*

Utilisation :
.autostatus on
.autostatus off
.autostatus status

📌 Fonction :
Le bot regarde automatiquement les statuts.`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // Initialisation
      global.autoStatus = global.autoStatus ?? false;

      // ✅ ON
      if (action === 'on') {
        global.autoStatus = true;

        return kaya.sendMessage(
          m.chat,
          {
            text: '✅ *Auto Status activé*\n\nLe bot regardera automatiquement les statuts.',
            contextInfo
          },
          { quoted: m }
        );
      }

      // ❌ OFF
      if (action === 'off') {
        global.autoStatus = false;

        return kaya.sendMessage(
          m.chat,
          {
            text: '❌ *Auto Status désactivé*',
            contextInfo
          },
          { quoted: m }
        );
      }

      // 📊 STATUS
      if (action === 'status') {
        return kaya.sendMessage(
          m.chat,
          {
            text: `👁️ *Auto Status*\n\nStatut : ${
              global.autoStatus ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'
            }`,
            contextInfo
          },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error('❌ autostatus error:', err);
    }
  }
};