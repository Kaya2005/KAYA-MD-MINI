// ==================== commands/recording.js ====================
import { saveBotModes } from '../system/botStatus.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'recording',
  description: 'Active ou désactive le mode enregistrement audio automatique',
  category: 'Owner',

  run: async (kaya, m, args) => {
    try {
      // 🔐 Owner uniquement
      if (!m.fromMe) return;

      const action = args[0]?.toLowerCase();
      if (!['on', 'off', 'status'].includes(action)) {
        return kaya.sendMessage(
          m.chat,
          { text: '🎤 Utilisation : .recording on|off|status', contextInfo },
          { quoted: m }
        );
      }

      // Initialisation sécurisée
      global.botModes = global.botModes || {};
      global.botModes.recording = global.botModes.recording || false;

      if (action === 'on') {
        global.botModes.recording = true;
        saveBotModes(global.botModes);

        // Déclencher immédiatement pour confirmer
        await kaya.sendPresenceUpdate('recording', m.chat);
        setTimeout(() => kaya.sendPresenceUpdate('paused', m.chat), 2000);

        return kaya.sendMessage(
          m.chat,
          {
            text: '✅ Mode "recording" activé !\n\nLe bot montrera l\'indicateur "en train d\'enregistrer" pendant 3 secondes à chaque message reçu.',
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === 'off') {
        global.botModes.recording = false;
        saveBotModes(global.botModes);

        // Arrêter immédiatement
        await kaya.sendPresenceUpdate('paused', m.chat);

        return kaya.sendMessage(
          m.chat,
          { text: '❌ Mode "recording" désactivé.', contextInfo },
          { quoted: m }
        );
      }

      if (action === 'status') {
        const isActive = global.botModes.recording;
        return kaya.sendMessage(
          m.chat,
          { text: `🎤 Mode recording: ${isActive ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}`, contextInfo },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error('❌ Erreur recording.js :', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue.', contextInfo },
        { quoted: m }
      );
    }
  }
};