// ==================== commands/prefix.js ====================
import config, { saveConfig } from '../config.js';

export default {
  name: 'prefix',
  description: 'Changer ou afficher le préfixe du bot',
  ownerOnly: true,

  run: async (sock, m, args) => {
    // 🔐 Sécurité owner (double sécurité)
    if (!m.fromMe && !m.isOwner) return;

    // 📌 Afficher le préfixe actuel
    if (!args[0]) {
      return sock.sendMessage(
        m.chat,
        {
          text: `🔧 *PRÉFIXE ACTUEL*\n━━━━━━━━━━━━━━\n➡️ Préfixe : \`${global.PREFIX || config.PREFIX}\``
        },
        { quoted: m }
      );
    }

    const newPrefix = args[0];

    // ❌ Un seul caractère obligatoire
    if (newPrefix.length !== 1) {
      return sock.sendMessage(
        m.chat,
        {
          text: `❌ *Préfixe invalide*\n\n👉 Le préfixe doit contenir *un seul caractère*\n\nExemple :\n.prefix !`
        },
        { quoted: m }
      );
    }

    // 💾 Sauvegarde dans config.json
    saveConfig({ PREFIX: newPrefix });

    // ⚡ Mise à jour instantanée (sans redémarrage)
    global.PREFIX = newPrefix;

    await sock.sendMessage(
      m.chat,
      {
        text: `✅ *PRÉFIXE MODIFIÉ AVEC SUCCÈS*\n━━━━━━━━━━━━━━\n➡️ Nouveau préfixe : \`${newPrefix}\``
      },
      { quoted: m }
    );
  }
};