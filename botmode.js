// ==================== commands/private.js ====================
import { contextInfo } from "../system/contextInfo.js"; // si tu utilises un contextInfo global

export default {
  name: "private",
  description: "🔒 Active ou désactive le mode privé du bot (seul l’owner peut utiliser les commandes)",
  category: "Owner",
  ownerOnly: true, // le handler gère déjà la restriction

  run: async (sock, m, args) => {
    try {
      // 🔐 Owner uniquement (comme prefix.js)
      if (!m.fromMe) return;

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off"].includes(action)) {
        return sock.sendMessage(
          m.chat,
          { text: "🔒 Utilisation :\n.private on\n.private off", contextInfo },
          { quoted: m }
        );
      }

      if (action === "on") {
        global.privateMode = true;
        return sock.sendMessage(
          m.chat,
          { text: "✅ Mode *Privé activé* : seules les commandes de l’owner sont acceptées.", contextInfo },
          { quoted: m }
        );
      } else {
        global.privateMode = false;
        return sock.sendMessage(
          m.chat,
          { text: "❌ Mode *Privé désactivé* : tout le monde peut utiliser les commandes.", contextInfo },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ Erreur private.js :", err);
      return sock.sendMessage(
        m.chat,
        { text: "❌ Une erreur est survenue lors de l'activation du mode privé.", contextInfo },
        { quoted: m }
      );
    }
  }
};