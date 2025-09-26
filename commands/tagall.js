// ==================== commands/tagall.js ====================
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: "tagall",
  alias: ["mention", "everyone"],
  description: "📢 Mentionne tous les membres du groupe avec un message personnalisé et élégant.",
  category: "Groupe",
  group: true,
  admin: false, 

  execute: async (kaya, m, args) => {
    try {
      if (!m.isGroup) {
        return kaya.sendMessage(
          m.chat,
          { text: "⛔ Cette commande est uniquement disponible dans les groupes.", contextInfo },
          { quoted: m }
        );
      }

      const metadata = await kaya.groupMetadata(m.chat);
      const participants = metadata.participants.map(p => p.id);

      const now = new Date();
      const date = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const time = now.toLocaleTimeString('fr-FR');

      // 📌 Extraire uniquement les numéros pour affichage
      const numbers = participants.map(p => p.split('@')[0]);
      const mentionList = numbers.map(num => `👤 @${num}`).join('\n');

      const fullMessage =
`╔════════════════╗
║   KAYA MD TAG ALL
╚════════════════╝

📅 Date: ${date}
⏰ Heure: ${time}
👥 Membres: ${participants.length}

👥 Membres :
${mentionList}`;

      
      await kaya.sendMessage(
        m.chat,
        {
          text: fullMessage,
          mentions: participants
        },
        { quoted: m } 
      );

    } catch (error) {
      console.error("Erreur dans la commande tagall :", error);
      await kaya.sendMessage(
        m.chat,
        { text: "❌ Une erreur est survenue lors de la mention.", contextInfo },
        { quoted: m }
      );
    }
  }
};