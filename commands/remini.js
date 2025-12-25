// ==================== commands/remini.js ====================
import axios from 'axios';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { uploadImage } from '../lib/uploadImage.js';

async function getQuotedOrOwnImageUrl(sock, message) {
  // 1) Image citée (quoted)
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }

  // 2) Image dans le message courant
  if (message.message?.imageMessage) {
    const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }

  return null;
}

function isValidUrl(string) {
  try { new URL(string); return true; } 
  catch (_) { return false; }
}

export default {
  name: 'remini',
  description: '✨ Améliore une image via Remini AI',
  category: 'Fun',
  ownerOnly: false,

  run: async (sock, m, args) => {
    try {
      let imageUrl = null;

      // Vérifie si args contient une URL
      if (args.length > 0) {
        const url = args.join(' ');
        if (!isValidUrl(url)) {
          return sock.sendMessage(m.chat, { 
            text: '❌ URL invalide.\nUsage : `.remini <image_url>`' 
          }, { quoted: m });
        }
        imageUrl = url;
      } else {
        // Essaye d'obtenir l'image du message ou message cité
        imageUrl = await getQuotedOrOwnImageUrl(sock, m);
        if (!imageUrl) {
          return sock.sendMessage(m.chat, { 
            text: '📸 *Remini AI Enhancement*\n\nUsage:\n• `.remini <image_url>`\n• Répondre à une image avec `.remini`\n• Envoyer une image avec `.remini`' 
          }, { quoted: m });
        }
      }

      // Appel à l'API Remini
      const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`;
      const response = await axios.get(apiUrl, { timeout: 60000 });

      if (response.data?.success && response.data.result?.image_url) {
        const enhancedImage = await axios.get(response.data.result.image_url, { responseType: 'arraybuffer', timeout: 30000 });
        if (enhancedImage.status === 200 && enhancedImage.data) {
          await sock.sendMessage(m.chat, {
            image: enhancedImage.data,
            caption: '✨ *Image améliorée avec succès!* \n\n𝗘𝗡𝗛𝗔𝗡𝗖𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧'
          }, { quoted: m });
        } else throw new Error('Impossible de télécharger l’image améliorée');
      } else throw new Error(response.data?.result?.message || 'Échec de l’amélioration de l’image');

    } catch (error) {
      console.error('Remini Error:', error.message);

      let errorMessage = '❌ Échec de l’amélioration de l’image.';
      if (error.response?.status === 429) errorMessage = '⏰ Limite API atteinte. Réessaie plus tard.';
      else if (error.response?.status === 400) errorMessage = '❌ URL ou format de l’image invalide.';
      else if (error.response?.status === 500) errorMessage = '🔧 Erreur serveur. Réessaie plus tard.';
      else if (error.code === 'ECONNABORTED') errorMessage = '⏰ Temps de réponse dépassé. Réessaie.';
      else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) errorMessage = '🌐 Erreur réseau. Vérifie ta connexion.';

      await sock.sendMessage(m.chat, { text: errorMessage }, { quoted: m });
    }
  }
};