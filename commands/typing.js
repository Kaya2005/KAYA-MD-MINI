// ==================== commands/typing.js ====================
import { saveBotModes } from '../system/botModes.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'typing',
  description: 'Active ou désactive le mode écriture automatique',
  category: 'Owner',

  run: async (kaya, m, args) => {
    try {
      // 🔐 Owner uniquement (sécurisé)
      if (!m.fromMe) return;

      const action = args[0]?.toLowerCase();
      if (!['on', 'off', 'status'].includes(action)) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Utilisation : .typing on|off|status', contextInfo },
          { quoted: m }
        );
      }

      global.botModes = global.botModes || {};

      if (action === 'on') {
        global.botModes.typing = true;
        saveBotModes(global.botModes);

        // Déclencher immédiatement pour confirmer
        await kaya.sendPresenceUpdate('composing', m.chat);
        setTimeout(() => kaya.sendPresenceUpdate('paused', m.chat), 2000);

        return kaya.sendMessage(
          m.chat,
          {
            text: '✅ Mode "typing" activé.\n\nLe bot montrera l\'indicateur "en train d\'écrire" pendant 3 secondes à chaque message reçu.',
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === 'off') {
        global.botModes.typing = false;
        saveBotModes(global.botModes);

        // Arrêter immédiatement
        await kaya.sendPresenceUpdate('paused', m.chat);

        return kaya.sendMessage(
          m.chat,
          { text: '❌ Mode "typing" désactivé.', contextInfo },
          { quoted: m }
        );
      }

      if (action === 'status') {
        const isActive = global.botModes.typing || false;
        return kaya.sendMessage(
          m.chat,
          { text: `📊 Mode typing: ${isActive ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}`, contextInfo },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error('❌ Erreur typing.js :', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue.', contextInfo },
        { quoted: m }
      );
    }
  }
};