import config, { saveConfig } from '../config.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'prefix',
  description: '🔑 Change le préfixe du bot (owner uniquement)',
  category: 'Owner',
  ownerOnly: true, // ✅ le handler bloque déjà les non-owners

  run: async (kaya, m, msg, store, args) => {
    try {
      const newPrefix = args[0];
      if (!newPrefix) {
        return kaya.sendMessage(
          m.chat,
          { text: `❌ Utilisation : ${config.PREFIX}prefix <nouveau préfixe>`, contextInfo },
          { quoted: m }
        );
      }

      // ✅ Mets à jour le préfixe en mémoire
      config.PREFIX = newPrefix;

      // ✅ Sauvegarde dans config.json
      if (saveConfig) saveConfig({ PREFIX: newPrefix });

      // ✅ Confirmation
      return kaya.sendMessage(
        m.chat,
        { text: `✅ Préfixe changé avec succès !\nNouveau : \`${newPrefix}\``, contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Erreur commande prefix :', err);
      return kaya.sendMessage(
        m.chat,
        { text: '⚠️ Impossible de changer le préfixe pour le moment.', contextInfo },
        { quoted: m }
      );
    }
  }
};