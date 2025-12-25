import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Tiktok } from '../lib/tiktok.js';
import { contextInfo } from '../system/contextInfo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'tiktok',
  description: 'Télécharge une vidéo TikTok sans filigrane.',
  category: 'Téléchargement',

  async run(kaya, m, args, store) {
    const query = args.join(" ");

    if (!query) {
      return kaya.sendMessage(
        m.chat,
        {
          text: `❌ Aucun lien détecté !\nUtilisation : tiktok https://vm.tiktok.com/xxx`,
          contextInfo
        },
        { quoted: m }
      );
    }

    try {
      const data = await Tiktok(query);

      if (!data?.nowm) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Impossible de récupérer la vidéo TikTok.', contextInfo },
          { quoted: m }
        );
      }

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const filePath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);

      const res = await axios.get(data.nowm, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://www.tiktok.com/'
        }
      });

      fs.writeFileSync(filePath, res.data);

      await kaya.sendMessage(
        m.chat,
        {
          video: { url: filePath },
          caption:
`🎬 TikTok Video
📌 Titre : ${data.title || "Non disponible"}
👤 Auteur : ${data.author || "Inconnu"}
By: KIRA-MD`,
          contextInfo
        },
        { quoted: m }
      );

      fs.unlinkSync(filePath);

    } catch (err) {
      console.error('❌ TikTok Error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: `❌ Erreur : ${err.message || "Inconnue"}`, contextInfo },
        { quoted: m }
      );
    }
  }
};