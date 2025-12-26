// ==================== commands/antilink.js ====================
import fs from "fs";
import path from "path";
import { contextInfo } from "../system/contextInfo.js";
import checkAdminOrOwner from "../system/checkAdmin.js";

// 📂 Fichier de sauvegarde
const antiLinkFile = path.join(process.cwd(), "data/antiLinkGroups.json");

// ----------------- Chargement & Sauvegarde -----------------
function loadAntiLinkGroups() {
  try {
    if (fs.existsSync(antiLinkFile)) {
      return JSON.parse(fs.readFileSync(antiLinkFile, "utf-8"));
    }
  } catch (err) {
    console.error("❌ Erreur chargement antiLinkGroups.json:", err);
  }
  return {};
}

function saveAntiLinkGroups() {
  try {
    fs.writeFileSync(
      antiLinkFile,
      JSON.stringify(global.antiLinkGroups, null, 2)
    );
  } catch (err) {
    console.error("❌ Erreur sauvegarde antiLinkGroups.json:", err);
  }
}

// ----------------- Initialisation globale -----------------
if (!global.antiLinkGroups) global.antiLinkGroups = loadAntiLinkGroups();
if (!global.userWarns) global.userWarns = {};

export default {
  name: "antilink",
  description: "Anti-link avec options delete, warn ou kick",
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
      if (!action || !["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
        return kaya.sendMessage(
          chatId,
          {
            text:
`🔗 *ANTI-LINK*

.antilink on      → Activer (mode WARN)
.antilink off     → Désactiver
.antilink delete  → Supprimer les liens
.antilink warn    → 4 avertissements = kick
.antilink kick    → Expulsion directe
.antilink status  → Voir l'état`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // 📊 STATUS (autorisé à tous)
      if (action === "status") {
        const data = global.antiLinkGroups[chatId];
        if (!data || !data.enabled) {
          return kaya.sendMessage(
            chatId,
            { text: "❌ Anti-link désactivé dans ce groupe.", contextInfo },
            { quoted: m }
          );
        }

        return kaya.sendMessage(
          chatId,
          {
            text: `✅ Anti-link ACTIVÉ\n📊 Mode : ${data.mode.toUpperCase()}`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // 🔐 VÉRIFICATION ADMIN / OWNER (OBLIGATOIRE)
      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: "🚫 Admin ou Owner uniquement.", contextInfo },
          { quoted: m }
        );
      }

      // ---------- ACTIONS ----------
      if (action === "on") {
        global.antiLinkGroups[chatId] = { enabled: true, mode: "warn" };
        saveAntiLinkGroups();

        return kaya.sendMessage(
          chatId,
          {
            text: "✅ Anti-link activé\n⚠️ Mode WARN (4 avertissements = expulsion)",
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === "off") {
        delete global.antiLinkGroups[chatId];
        delete global.userWarns[chatId];
        saveAntiLinkGroups();

        return kaya.sendMessage(
          chatId,
          { text: "❌ Anti-link désactivé et avertissements réinitialisés.", contextInfo },
          { quoted: m }
        );
      }

      if (["delete", "warn", "kick"].includes(action)) {
        global.antiLinkGroups[chatId] = {
          enabled: true,
          mode: action
        };
        saveAntiLinkGroups();

        return kaya.sendMessage(
          chatId,
          {
            text: `✅ Mode *${action.toUpperCase()}* activé pour l'anti-link.`,
            contextInfo
          },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ Erreur antilink.js :", err);
    }
  },

  // ==================== DÉTECTION ====================
  detect: async (kaya, m) => {
    try {
      const chatId = m.chat;
      if (!m.isGroup) return;
      if (!global.antiLinkGroups?.[chatId]?.enabled) return;
      if (m.key?.fromMe) return;
      if (m.isAdmin || m.isOwner) return;

      const text = m.body || "";
      if (!text) return;

      const linkRegex =
        /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me|t\.me|instagram\.com|facebook\.com|youtube\.com|youtu\.be|tiktok\.com|discord\.gg|discord\.com)/i;

      if (!linkRegex.test(text)) return;

      const sender = m.sender;
      const mode = global.antiLinkGroups[chatId].mode || "warn";

      // 🧹 Supprimer le message
      await kaya.sendMessage(chatId, { delete: m.key }).catch(() => {});

      // 🗑 DELETE
      if (mode === "delete") return;

      // 👢 KICK
      if (mode === "kick") {
        await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
        return kaya.sendMessage(chatId, {
          text: `🚫 @${sender.split("@")[0]} expulsé pour lien interdit.`,
          mentions: [sender],
          contextInfo
        });
      }

      // ⚠️ WARN
      if (!global.userWarns[chatId]) global.userWarns[chatId] = {};
      if (!global.userWarns[chatId][sender]) global.userWarns[chatId][sender] = 0;

      global.userWarns[chatId][sender]++;
      const warns = global.userWarns[chatId][sender];

      if (warns >= 4) {
        delete global.userWarns[chatId][sender];
        await kaya.groupParticipantsUpdate(chatId, [sender], "remove");

        return kaya.sendMessage(chatId, {
          text: `🚫 @${sender.split("@")[0]} expulsé après 4 avertissements.`,
          mentions: [sender],
          contextInfo
        });
      }

      return kaya.sendMessage(chatId, {
        text: `⚠️ @${sender.split("@")[0]} lien interdit ! (${warns}/4)`,
        mentions: [sender],
        contextInfo
      });

    } catch (e) {
      console.error("❌ Erreur détection AntiLink:", e);
    }
  }
};