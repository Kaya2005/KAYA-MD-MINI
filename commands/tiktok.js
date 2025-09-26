// ==================== commands/tiktok.js ====================
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Tiktok } from '../lib/tiktok.js';
import { contextInfo } from '../system/contextInfo.js';

// __dirname en ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'tiktok',
  description: 'Télécharge une vidéo TikTok sans filigrane.',
  category: 'Téléchargement',

  async run(kaya, m, msg, store, args) {
    const query = args.join(" ");
    if (!query) {
      return kaya.sendMessage(
        m.chat,
        {
          text: `╭━━━〔 📥 TIKTOK DOWNLOADER 〕━━⬣
┃ ❌ Aucun lien détecté !
┃ 📌 Utilisation : *.tiktok https://vm.tiktok.com/xxx*
╰━━━━━━━━━━━━━━━━━━━━━━━━⬣`,
          contextInfo
        },
        { quoted: m }
      );
    }

    try {
      const data = await Tiktok(query);
      const url = data.nowm;

      if (!url) {
        return kaya.sendMessage(
          m.chat,
          {
            text: `❌ Impossible de récupérer la vidéo TikTok.\n🔁 Essaie avec un autre lien ou plus tard.`,
            contextInfo
          },
          { quoted: m }
        );
      }

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      const filePath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);

      const res = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, res.data);

      await kaya.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(filePath),
          caption:
`╭━━━〔 🎬 TIKTOK VIDÉO 〕━━⬣
📌 *Titre* : ${data.title || "Non disponible"}
👤 *Auteur* : ${data.author || "Inconnu"}
   *By* : KAYA-MD
╰━━━━━━━━━━━━━━━━━━━━━━⬣`,
          contextInfo
        },
        { quoted: m }
      );

      fs.unlinkSync(filePath); // Nettoyage

    } catch (e) {
      console.error('Erreur TikTok :', e);
      await kaya.sendMessage(
        m.chat,
        {
          text: `❌ Une erreur est survenue : ${e.message || "Inconnue"}`,
          contextInfo
        },
        { quoted: m }
      );
    }
  }
};