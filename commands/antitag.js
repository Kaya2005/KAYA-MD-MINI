// ==================== commands/antitag.js ====================
import { setAntitag, getAntitag, removeAntitag } from "../lib/antitag.js";
import { contextInfo } from "../system/contextInfo.js";
import checkAdminOrOwner from "../system/checkAdmin.js";

export default {
  name: "antitag",
  alias: ["anti-tag", "tagall"],
  description: "🚫 Active ou désactive l’anti-tagall",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  // ==================== COMMANDE ====================
  run: async (kaya, m, args) => {
    try {
      const chatId = m.chat;

      if (!m.isGroup) {
        return kaya.sendMessage(
          chatId,
          { text: "❌ Cette commande fonctionne uniquement dans un groupe.", contextInfo },
          { quoted: m }
        );
      }

      const action = args[0]?.toLowerCase();

      if (!action) {
        return kaya.sendMessage(
          chatId,
          {
            text:
`🚫 *ANTITAG*

.antitag on        → Activer (action: delete)
.antitag off       → Désactiver
.antitag set delete|kick
.antitag get       → Voir le statut`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // 📊 GET (autorisé à tous)
      if (action === "get") {
        const data = await getAntitag(chatId);
        return kaya.sendMessage(
          chatId,
          {
            text:
`📊 *STATUT ANTITAG*

• État   : ${data?.enabled ? "ON" : "OFF"}
• Action : ${data?.action || "—"}`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // 🔐 VÉRIFICATION ADMIN / OWNER
      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: "🚫 Admin ou Owner uniquement.", contextInfo },
          { quoted: m }
        );
      }

      // ================= ACTIONS =================
      switch (action) {
        case "on": {
          const current = await getAntitag(chatId);
          if (current?.enabled) {
            return kaya.sendMessage(
              chatId,
              { text: "✅ Antitag est déjà activé.", contextInfo },
              { quoted: m }
            );
          }

          await setAntitag(chatId, true, "delete");
          return kaya.sendMessage(
            chatId,
            { text: "✅ Antitag activé (action : DELETE).", contextInfo },
            { quoted: m }
          );
        }

        case "off": {
          await removeAntitag(chatId);
          return kaya.sendMessage(
            chatId,
            { text: "❌ Antitag désactivé.", contextInfo },
            { quoted: m }
          );
        }

        case "set": {
          const mode = args[1];
          if (!["delete", "kick"].includes(mode)) {
            return kaya.sendMessage(
              chatId,
              { text: "⚠️ Choisis : delete ou kick.", contextInfo },
              { quoted: m }
            );
          }

          await setAntitag(chatId, true, mode);
          return kaya.sendMessage(
            chatId,
            { text: `⚙️ Action Antitag définie sur : ${mode.toUpperCase()}`, contextInfo },
            { quoted: m }
          );
        }

        default:
          return kaya.sendMessage(
            chatId,
            { text: "❓ Commande inconnue – tape .antitag", contextInfo },
            { quoted: m }
          );
      }

    } catch (err) {
      console.error("❌ ANTITAG ERROR:", err);
      await kaya.sendMessage(
        m.chat,
        { text: "❌ Erreur lors du traitement Antitag.", contextInfo },
        { quoted: m }
      );
    }
  }
};