// ==================== commands/url.js ====================
import axios from 'axios';
import FormData from 'form-data';
import { downloadMediaMessage, downloadContentFromMessage } from '@rexxhayanasi/elaina-bail';
import { Readable } from 'stream';
import { contextInfo } from '../system/contextInfo.js';

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default {
  name: 'url',
  description: '🔗 Génère un lien Catbox à partir d’une image',
  run: async (kaya, m) => {
    try {
      const target = m.quoted ? m.quoted : m;
      const mime = target?.mimetype || target?.msg?.mimetype || '';

      if (!/image\/(jpe?g|png)/.test(mime)) {
        return kaya.sendMessage(
          m.chat,
          { text: '📸 *Veuillez répondre à une image pour générer un lien.*', contextInfo },
          { quoted: m }
        );
      }

      let buffer;

      // Tentative avec target.download() si disponible
      if (typeof target.download === 'function') {
        buffer = await target.download();
      }

      // Sinon fallback sur downloadMediaMessage
      if (!buffer) {
        try {
          buffer = await downloadMediaMessage(target.msg || target.message[target.mtype], 'image', { logger: kaya.logger });
        } catch (err1) {
          // Fallback classique avec downloadContentFromMessage
          const node = target.msg || target.message?.[target.mtype];
          if (!node) throw new Error('Image introuvable pour téléchargement');

          const stream = await downloadContentFromMessage(node, 'image');
          buffer = await streamToBuffer(stream);
        }
      }

      if (!buffer || buffer.length < 100) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Impossible de lire cette image.', contextInfo },
          { quoted: m }
        );
      }

      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', Readable.from(buffer), 'image.jpg');

      const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders()
      });

      const url = response.data;

      const message = `
╭────「 𝗞𝗔𝗬𝗔-𝗠𝗗 」────⬣
│ 🖼️ *Image détectée !*
│ ✅ *Lien généré :*
│ ${url}
╰──────────────────⬣`.trim();

      await kaya.sendMessage(
        m.chat,
        { text: message, contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('Erreur URL Catbox :', err.response?.data || err.message || err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue lors de la génération du lien.', contextInfo },
        { quoted: m }
      );
    }
  }
};