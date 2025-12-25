// ==================== commands/ai.js ====================
import axios from 'axios';
import fetch from 'node-fetch';

export default {
  name: 'ai',
  description: '🤖 Répond à vos questions via GPT ou Gemini',
  category: 'Utilitaires',

  run: async (kaya, m, msg, store, args) => {
    try {
      const text = m.body || m.message?.conversation || m.message?.extendedTextMessage?.text;
      if (!text) {
        return kaya.sendMessage(
          m.chat,
          { text: "❌ Fournis une question après .gpt ou .gemini\nExemple : .gpt écris un code HTML de base" }
        );
      }

      const parts = text.trim().split(/\s+/);
      const command = parts[0].toLowerCase();
      const query = parts.slice(1).join(' ').trim();

      if (!query) {
        return kaya.sendMessage(
          m.chat,
          { text: "❌ Fournis une question après .gpt ou .gemini" }
        );
      }

      // Réaction "processing"
      await kaya.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

      if (command === '.gpt') {
        const response = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(query)}`);
        if (response.data?.success && response.data?.result) {
          const answer = response.data.result.prompt;
          return kaya.sendMessage(
            m.chat,
            { text: answer }
          );
        }
        throw new Error('Réponse GPT invalide');
      }

      if (command === '.gemini') {
        const apis = [
          `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
          `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
          `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
          `https://api.dreaded.site/api/gemini2?text=${encodeURIComponent(query)}`,
          `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`,
          `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`
        ];

        for (const api of apis) {
          try {
            const res = await fetch(api);
            const data = await res.json();
            const answer = data.message || data.data || data.answer || data.result;
            if (answer) {
              return kaya.sendMessage(
                m.chat,
                { text: answer }
              );
            }
          } catch (e) { continue; }
        }

        throw new Error('Toutes les APIs Gemini ont échoué');
      }

    } catch (err) {
      console.error('❌ Erreur commande AI :', err);
      return kaya.sendMessage(
        m.chat,
        { text: "⚠️ Impossible d'obtenir une réponse pour le moment. Réessaie plus tard." }
      );
    }
  }
};