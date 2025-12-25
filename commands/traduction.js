import translate from '@vitalets/google-translate-api';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'traduc',
  description: 'Traduit un message en une langue spécifique',
  category: 'Utilitaires',

  run: async (kaya, m, msg, store, args) => {
    try {
      const argsArray = Array.isArray(args) ? args : [];
      const langCode = argsArray[0]?.toLowerCase();
      const quotedText = m.quoted?.text;

      // 📘 HELP
      if (!langCode || langCode === 'help') {
        return kaya.sendMessage(
          m.chat,
          {
            text: `🌍 *COMMANDE TRADUCTION (.traduc)*

📌 *Utilisation*
.traduc <code_langue>

📌 *Exemples*
.traduc fr
.traduc en
.traduc es
.traduc ar

📌 *Méthode*
👉 Réponds à un message que tu veux traduire

📌 *Langues courantes*
fr 🇫🇷  | en 🇺🇸  | es 🇪🇸  
pt 🇵🇹 | ar 🇸🇦  | sw 🇨🇩  

📌 *Aide*
.traduc help`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // Vérifie que l’utilisateur a répondu à un message
      if (!quotedText) {
        return kaya.sendMessage(
          m.chat,
          {
            text: `❌ Réponds à un message pour le traduire.\nℹ️ Exemple : *.traduc ${langCode}*`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // Traduction
      const res = await translate(quotedText, { to: langCode });

      await kaya.sendMessage(
        m.chat,
        {
          text: `🌍 *Traduction (${langCode.toUpperCase()})*\n\n${res.text}`,
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('Erreur traduction:', err);
      return kaya.sendMessage(
        m.chat,
        {
          text: `❌ Erreur traduction : ${err.message}`,
          contextInfo
        },
        { quoted: m }
      );
    }
  }
};