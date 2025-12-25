import checkAdminOrOwner from '../system/checkAdmin.js';

export default {
  name: 'tag',
  description: 'Mentionne tous les membres avec le texte écrit ou cité',
  category: 'Groupe',
  group: true,
  admin: true,

  run: async (kaya, m, args) => {
    try {
      if (!m.key.remoteJid.endsWith('@g.us')) {
        return kaya.sendMessage(
          m.chat,
          { text: 'Cette commande fonctionne uniquement dans un groupe.' },
          { quoted: m }
        );
      }

      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) {
        return kaya.sendMessage(
          m.chat,
          { text: '⛔ Commande réservée aux admins et au owner.' },
          { quoted: m }
        );
      }

      // 🔥 RÉCUPÉRATION DU TEXTE CITÉ (BAILEYS v7)
      let quotedText = '';
      const ctx = m.message?.extendedTextMessage?.contextInfo;

      if (ctx?.quotedMessage) {
        const qm = ctx.quotedMessage;
        quotedText =
          qm.conversation ||
          qm.extendedTextMessage?.text ||
          qm.imageMessage?.caption ||
          qm.videoMessage?.caption ||
          '';
      }

      const metadata = await kaya.groupMetadata(m.chat);
      const members = metadata.participants
        .map(p => p.id || p.jid)
        .filter(Boolean);

      const text =
        quotedText ||
        args.join(' ') ||
        '📢 Mention générale';

      await kaya.sendMessage(
        m.chat,
        {
          text,
          mentions: members
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('Erreur commande tag :', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Erreur lors de l’envoi du tag.' },
        { quoted: m }
      );
    }
  }
};