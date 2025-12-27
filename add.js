// ================= commands/add.js =================
import { contextInfo } from '../system/contextInfo.js'; // si tu utilises contextInfo global

export default {
  name: 'add',
  description: 'Ajoute un membre dans un groupe (Owner seulement)',
  category: 'Groupe',
  group: true,

  async execute(Kaya, m, args) {
    try {
      // ❌ Vérifie si c'est un groupe
      if (!m.isGroup) {
        return Kaya.sendMessage(
          m.chat,
          { text: '❌ Cette commande fonctionne uniquement dans un groupe.', contextInfo },
          { quoted: m }
        );
      }

      // 🔐 Owner uniquement (sécurisé)
      if (!m.fromMe) return;

      // ❌ Aucun numéro fourni
      if (!args[0]) {
        return Kaya.sendMessage(
          m.chat,
          { text: '❌ Utilisation : `.add 243XXXXXXXXX`', contextInfo },
          { quoted: m }
        );
      }

      // 📞 Nettoyage du numéro
      const number = args[0].replace(/\D/g, '');
      if (number.length < 8) {
        return Kaya.sendMessage(
          m.chat,
          { text: '❌ Numéro invalide.', contextInfo },
          { quoted: m }
        );
      }

      const jid = `${number}@s.whatsapp.net`;

      // ➕ Ajout du membre
      await Kaya.groupParticipantsUpdate(m.chat, [jid], 'add');

      // ✅ Confirmation
      await Kaya.sendMessage(
        m.chat,
        { text: ` @${number} a été ajouté au groupe.`, mentions: [jid], contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ ADD ERROR:', err);
      await Kaya.sendMessage(
        m.chat,
        { text: '❌ Impossible d’ajouter ce membre (peut-être privé ou déjà présent).', contextInfo },
        { quoted: m }
      );
    }
  }
};