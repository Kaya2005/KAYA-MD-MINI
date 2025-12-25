// ==================== commands/blockinbox.js ====================
import config, { saveConfig } from "../config.js";
import { contextInfo } from "../system/contextInfo.js";

export default {
  name: "blockinbox",
  description: "Bloquer ou autoriser les messages privés du bot",
  category: "Owner",

  run: async (kaya, m, args) => {
    try {
      // 🔐 OWNER UNIQUEMENT
      if (!m.fromMe) return;

      const action = args[0]?.toLowerCase();

      if (!["on", "off", "status"].includes(action)) {
        return kaya.sendMessage(
          m.chat,
          {
            text:
`🔒 *Block Inbox*

Utilisation :
.blockinbox on
.blockinbox off
.blockinbox status

📌 Fonction :
Empêche le bot de répondre en privé.`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // Initialisation si nécessaire
      global.blockInbox = global.blockInbox ?? config.blockInbox ?? false;

      if (action === "on") {
        global.blockInbox = true;
        saveConfig({ blockInbox: true });

        return kaya.sendMessage(
          m.chat,
          {
            text: "🚫 *Messages privés bloqués*\n\nLe bot ne répondra plus en privé.\n➡️ Utilisation autorisée uniquement dans les groupes.",
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === "off") {
        global.blockInbox = false;
        saveConfig({ blockInbox: false });

        return kaya.sendMessage(
          m.chat,
          {
            text: "✅ *Messages privés autorisés*\n\nLe bot peut à nouveau répondre en privé.",
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === "status") {
        return kaya.sendMessage(
          m.chat,
          {
            text: `🔒 *Block Inbox*\n\nStatut : ${
              global.blockInbox ? "🚫 ACTIVÉ" : "✅ DÉSACTIVÉ"
            }`,
            contextInfo
          },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ blockinbox error:", err);
    }
  }
};