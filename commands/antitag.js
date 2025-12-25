// ==================== commands/antitag.js ====================
import { setAntitag, getAntitag, removeAntitag } from '../lib/antitag.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'antitag',
  alias: ['anti-tag', 'tagall'],
  description: '🚫 Active ou désactive l’anti-tagall',
  category: 'group',
  ownerOnly: false,

  run: async (kaya, m, args) => {
    try {
      // 🔐 Vérification admin
      const metadata = await kaya.groupMetadata(m.chat);
      const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
      if (!admins.includes(m.sender)) {
        return await kaya.sendMessage(
          m.chat,
          { text: '🚫 *Commande réservée aux admins*', contextInfo },
          { quoted: m }
        );
      }

      const action = args[0]?.toLowerCase();

      if (!action) {
        return await kaya.sendMessage(
          m.chat,
          {
            text: `📌 *ANTITAG – Utilisation*\n
• antitag on (par défaut delete)
• antitag off
• antitag set delete | kick
• antitag get`,
            contextInfo
          },
          { quoted: m }
        );
      }

      switch (action) {
        case 'on': {
          const current = await getAntitag(m.chat);
          if (current?.enabled) {
            return await kaya.sendMessage(
              m.chat,
              { text: '✅ *Antitag est déjà activé*', contextInfo },
              { quoted: m }
            );
          }
          await setAntitag(m.chat, true, 'delete');
          await kaya.sendMessage(
            m.chat,
            { text: '✅ *Antitag activé (action: delete)*', contextInfo },
            { quoted: m }
          );
          break;
        }

        case 'off': {
          await removeAntitag(m.chat);
          await kaya.sendMessage(
            m.chat,
            { text: '❌ *Antitag désactivé*', contextInfo },
            { quoted: m }
          );
          break;
        }

        case 'set': {
          const mode = args[1];
          if (!['delete', 'kick'].includes(mode)) {
            return await kaya.sendMessage(
              m.chat,
              { text: '⚠️ *Choisis : delete ou kick*', contextInfo },
              { quoted: m }
            );
          }
          await setAntitag(m.chat, true, mode);
          await kaya.sendMessage(
            m.chat,
            { text: `⚙️ *Action Antitag définie sur : ${mode}*`, contextInfo },
            { quoted: m }
          );
          break;
        }

        case 'get': {
          const data = await getAntitag(m.chat);
          await kaya.sendMessage(
            m.chat,
            {
              text: `📊 *Statut Antitag*\n\n• État : ${data?.enabled ? 'ON' : 'OFF'}\n• Action : ${data?.action || '—'}`,
              contextInfo
            },
            { quoted: m }
          );
          break;
        }

        default:
          await kaya.sendMessage(
            m.chat,
            { text: '❓ *Commande inconnue – tape antitag*', contextInfo },
            { quoted: m }
          );
      }

    } catch (err) {
      console.error('ANTITAG ERROR:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Erreur lors du traitement Antitag', contextInfo },
        { quoted: m }
      );
    }
  }
};