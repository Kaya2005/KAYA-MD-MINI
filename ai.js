// ==================== commands/ai.js ====================
import axios from 'axios';
import fetch from 'node-fetch';

export default {
  name: 'ai',
  description: '🤖 Répond à vos questions via GPT ou Gemini',
  category: 'Utilitaires',
  ownerOnly: false, // facultatif, selon besoin

  run: async (sock, m, args, store, commandName) => {
    try {
      // Construire la question à partir des args
      const query = args?.join(' ').trim();
      if (!query) {
        return sock.sendMessage(
          m.chat,
          { text: "❌ Fournis une question après la commande.\nExemple : .gpt écris un code HTML de base" },
          { quoted: m }
        );
      }

      // Réaction "processing"
      await sock.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

      // 🔹 Commande GPT
      if (commandName === 'gpt') {
        const response = await axios.get(
          `https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(query)}`
        );

        const answer = response.data?.result?.prompt;
        if (!answer) throw new Error('Réponse GPT invalide');

        return sock.sendMessage(m.chat, { text: answer }, { quoted: m });
      }

      // 🔹 Commande Gemini
      if (commandName === 'gemini') {
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
            if (answer) return sock.sendMessage(m.chat, { text: answer }, { quoted: m });
          } catch { continue; }
        }

        throw new Error('Toutes les APIs Gemini ont échoué');
      }

    } catch (err) {
      console.error('❌ Erreur commande AI :', err);
      return sock.sendMessage(
        m.chat,
        { text: "⚠️ Impossible d'obtenir une réponse pour le moment. Réessaie plus tard." },
        { quoted: m }
      );
    }
  }
};