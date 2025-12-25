import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { writeExif } from '../lib/exif.js';

const delay = time => new Promise(res => setTimeout(res, time));

export default {
  name: 'tg',
  alias: ['telegram', 'stickertg'],
  description: 'Télécharge un pack de stickers Telegram et envoie les stickers sur WhatsApp',
  category: 'Fun',

  async run(kaya, m, args) {
    try {
      const url = args[0];
      if (!url) {
        return kaya.sendMessage(
          m.chat,
          { text: '⚠️ Veuillez fournir l’URL d’un pack de stickers Telegram.\nExemple : .tg https://t.me/addstickers/Porcientoreal' },
          { quoted: m }
        );
      }

      if (!url.match(/https:\/\/t.me\/addstickers\//i)) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ URL invalide ! Assurez-vous que c’est un pack de stickers Telegram.' },
          { quoted: m }
        );
      }

      const packName = url.replace('https://t.me/addstickers/', '');
      const botToken = '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4';

      // Récupérer le pack
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`);
      if (!res.ok) throw new Error(`Erreur API Telegram : ${res.status}`);
      const packData = await res.json();
      if (!packData.ok || !packData.result) throw new Error('Pack de stickers invalide ou privé.');

      const stickers = packData.result.stickers;
      await kaya.sendMessage(m.chat, { text: `📦 Pack trouvé avec ${stickers.length} stickers\n⏳ Téléchargement en cours...` }, { quoted: m });

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      let success = 0;

      for (let i = 0; i < stickers.length; i++) {
        try {
          const sticker = stickers[i];
          const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.file_id}`);
          const fileData = await fileRes.json();
          if (!fileData.ok) continue;

          const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
          const buffer = await (await fetch(fileUrl)).arrayBuffer();

          const tmpFile = { data: Buffer.from(buffer), mimetype: sticker.is_video ? 'video/mp4' : 'image/png' };
          const exifFile = await writeExif(tmpFile, { packname: packName, author: 'Telegram', categories: [sticker.emoji || '🤖'] });

          const stickerBuffer = fs.readFileSync(exifFile);
          await kaya.sendMessage(m.chat, { sticker: stickerBuffer });

          fs.unlinkSync(exifFile);
          success++;
          await delay(1000);
        } catch (err) {
          console.error(`Erreur sticker ${i}:`, err);
          continue;
        }
      }

      await kaya.sendMessage(m.chat, { text: `✅ Stickers envoyés : ${success}/${stickers.length}` }, { quoted: m });
    } catch (err) {
      console.error('Erreur commande tg:', err);
      await kaya.sendMessage(m.chat, { text: '❌ Impossible de télécharger le pack de stickers. Vérifiez l’URL ou la visibilité du pack.' }, { quoted: m });
    }
  }
};