// ================= commands/left.js =================
import config from '../config.js';

export default {
  name: 'left',
  description: 'Le bot quitte le groupe (owner uniquement)',
  category: 'Owner',
  ownerOnly: true, // ✅ ton handler gère déjà cette restriction

  execute: async (kaya, m, args) => {
    // ✅ Vérifie que l'expéditeur est bien un des owners
    const senderId = m.sender.split('@')[0];
    const owners = config.OWNER_NUMBER.split(',').map(o => o.trim());

    if (!owners.includes(senderId)) {
      return kaya.sendMessage(
        m.chat,
        { text: '🚫 Cette commande est réservée au propriétaire du bot.' },
        { quoted: m }
      );
    }

    // ✅ Vérifie que c'est un groupe
    if (!m.isGroup) {
      return kaya.sendMessage(
        m.chat,
        { text: '❗ Cette commande doit être utilisée dans un groupe.' },
        { quoted: m }
      );
    }

    try {
      // ✅ Le bot quitte le groupe
      await kaya.groupLeave(m.chat);
    } catch (e) {
      console.error('❌ Erreur leave:', e);
      return kaya.sendMessage(
        m.chat,
        { text: '⚠️ Impossible de quitter le groupe.' },
        { quoted: m }
      );
    }
  }
};