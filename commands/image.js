import axios from 'axios';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'img',
  alias: ['image', 'img'],
  description: 'Génère une image à partir d’un prompt',
  category: 'Fun',

  async run(kaya, m, args) {
    try {
      const prompt = args.join(' ').trim();
      if (!prompt) {
        return kaya.sendMessage(
          m.chat,
          {
            text: '❌ Veuillez fournir un prompt pour générer l’image.\nExemple : .imagine un coucher de soleil sur la mer',
            contextInfo
          },
          { quoted: m }
        );
      }

      // Message temporaire
      await kaya.sendMessage(
        m.chat,
        { text: '🎨 Génération de l’image... Patientez s’il vous plaît.' },
        { quoted: m }
      );

      // Amélioration du prompt
      const enhancedPrompt = enhancePrompt(prompt);

      // Appel à l’API
      const response = await axios.get(
        `https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhancedPrompt)}`,
        { responseType: 'arraybuffer' }
      );

      const imageBuffer = Buffer.from(response.data);

      // Envoi de l’image
      await kaya.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption: `🎨 Image générée pour le prompt : "${prompt}"`,
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Imagine command error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Impossible de générer l’image. Veuillez réessayer plus tard.', contextInfo },
        { quoted: m }
      );
    }
  }
};

// Fonction pour améliorer le prompt
function enhancePrompt(prompt) {
  const qualityEnhancers = [
    'high quality',
    'detailed',
    'masterpiece',
    'best quality',
    'ultra realistic',
    '4k',
    'highly detailed',
    'professional photography',
    'cinematic lighting',
    'sharp focus'
  ];

  const numEnhancers = Math.floor(Math.random() * 2) + 3; // 3 à 4 mots
  const selectedEnhancers = qualityEnhancers
    .sort(() => Math.random() - 0.5)
    .slice(0, numEnhancers);

  return `${prompt}, ${selectedEnhancers.join(', ')}`;
}