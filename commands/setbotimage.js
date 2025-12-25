// ==================== commands/setbotimage.js ====================
import axios from 'axios';
import { setBotImage } from '../system/botAssets.js';

export default {
  name: 'setbotimage',
  description: 'Change l’image du bot via un lien',
  category: 'Owner',
  async execute(Kaya, m, args) {
    try {
      // 🔐 Owner uniquement
      if (!m.fromMe) return;

      // Vérifie qu'un lien est fourni
      const url = args[0];
      if (!url || !url.startsWith('http')) {
        return Kaya.sendMessage(
          m.chat,
          { text: '❌ Change l’image du bot via un lien valide.\nEx: `.setbotimage https://files.catbox.moe/s42m2j.jpg`' },
          { quoted: m }
        );
      }

      // Télécharge l'image depuis le lien
      const res = await axios.get(url, { responseType: 'arraybuffer' });

      // Vérifie que le fichier est bien une image
      const contentType = res.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return Kaya.sendMessage(
          m.chat,
          { text: '❌ Le lien fourni ne contient pas une image valide.' },
          { quoted: m }
        );
      }

      const buffer = Buffer.from(res.data);

      // Enregistrement de l'image
      setBotImage(buffer);

      await Kaya.sendMessage(
        m.chat,
        { text: '✅ Image du bot mise à jour avec succès !' },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Erreur setbotimage:', err);
      await Kaya.sendMessage(
        m.chat,
        { text: '❌ Impossible de changer l’image. Vérifie le lien ou réessaie.' },
        { quoted: m }
      );
    }
  },
};