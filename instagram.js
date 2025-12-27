import { igdl } from 'ruhend-scraper';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'insta',
  alias: ['instagram', 'ig'],
  description: 'Télécharge photos et vidéos depuis Instagram',
  category: 'Fun',

  async run(kaya, m, args) {
    try {
      const text = args.join(' ').trim() || m.message?.conversation;

      if (!text) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Veuillez fournir un lien Instagram valide (post, reel ou IGTV).', contextInfo },
          { quoted: m }
        );
      }

      // Vérifier que c’est un lien Instagram
      if (!/https?:\/\/(www\.)?(instagram\.com|instagr\.am)\//.test(text)) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Ce n’est pas un lien Instagram valide.', contextInfo },
          { quoted: m }
        );
      }

      // Message temporaire
      await kaya.sendMessage(
        m.chat,
        { text: '🔄 Récupération des médias Instagram... Patientez.', contextInfo },
        { quoted: m }
      );

      // Récupérer les médias
      const downloadData = await igdl(text);
      if (!downloadData?.data || downloadData.data.length === 0) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Aucun média trouvé. Le post pourrait être privé ou le lien est invalide.', contextInfo },
          { quoted: m }
        );
      }

      // Limiter à 10 médias
      const mediaData = downloadData.data.slice(0, 10);

      for (const media of mediaData) {
        const mediaUrl = media.url;
        const isVideo = media.type === 'video' || /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl);

        if (isVideo) {
          await kaya.sendMessage(
            m.chat,
            { video: { url: mediaUrl }, mimetype: 'video/mp4', caption: '✅ Média Instagram téléchargé !', contextInfo },
            { quoted: m }
          );
        } else {
          await kaya.sendMessage(
            m.chat,
            { image: { url: mediaUrl }, caption: '✅ Média Instagram téléchargé !', contextInfo },
            { quoted: m }
          );
        }

        // Pause entre les envois pour éviter les blocages
        await new Promise(res => setTimeout(res, 1000));
      }

    } catch (err) {
      console.error('❌ Instagram command error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Impossible de récupérer le média Instagram. Veuillez réessayer plus tard.', contextInfo },
        { quoted: m }
      );
    }
  }
};