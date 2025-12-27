import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'groupinfo',
  alias: ['infogroup', 'ginfo'],
  description: 'Affiche les informations du groupe',
  category: 'Groupe',

  async run(kaya, m) {
    try {
      // ❌ Groupe uniquement
      if (!m.isGroup) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Cette commande fonctionne uniquement dans un groupe.', contextInfo },
          { quoted: m }
        );
      }

      // 📋 Métadonnées du groupe
      const groupMetadata = await kaya.groupMetadata(m.chat);
      const participants = groupMetadata.participants;

      // 👑 Admins
      const admins = participants.filter(p => p.admin);
      const adminList = admins
        .map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`)
        .join('\n');

      // 👤 Owner
      const owner =
        groupMetadata.owner ||
        admins.find(v => v.admin === 'superadmin')?.id ||
        m.chat.split('-')[0] + '@s.whatsapp.net';

      // 🖼️ Photo du groupe
      let pp;
      try {
        pp = await kaya.profilePictureUrl(m.chat, 'image');
      } catch {
        pp = 'https://i.imgur.com/2wzGhpF.jpeg';
      }

      // 📝 Texte
      const text = `
┌──「 👑 *INFO DU GROUPE* 👑 」
│
├ 🆔 *ID* :
│ • ${groupMetadata.id}
│
├ 🔖 *Nom* :
│ • ${groupMetadata.subject}
│
├ 👥 *Membres* :
│ • ${participants.length}
│
├ 🤿 *Owner* :
│ • @${owner.split('@')[0]}
│
├ 🕵🏻‍♂️ *Admins* :
${adminList || '• Aucun'}
│
├ 📌 *Description* :
│ • ${groupMetadata.desc || 'Aucune description'}
└───────────────
`.trim();

      // 📤 Envoi
      await kaya.sendMessage(
        m.chat,
        {
          image: { url: pp },
          caption: text,
          mentions: [...admins.map(v => v.id), owner],
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ groupinfo error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Impossible de récupérer les infos du groupe.', contextInfo },
        { quoted: m }
      );
    }
  }
};