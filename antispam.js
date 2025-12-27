import fs from "fs";
import path from "path";
import { contextInfo } from "../system/contextInfo.js";
import checkAdminOrOwner from "../system/checkAdmin.js";

const spamFile = path.join(process.cwd(), "data/antiSpamGroups.json");

// ⚙️ CONFIG
const MESSAGE_LIMIT = 6;      // nombre max de messages
const TIME_WINDOW = 5000;     // en millisecondes (5 secondes)

// -------- Load / Save --------
function loadData() {
  if (!fs.existsSync(spamFile)) return {};
  return JSON.parse(fs.readFileSync(spamFile, "utf-8"));
}
function saveData(data) {
  fs.writeFileSync(spamFile, JSON.stringify(data, null, 2));
}

// -------- Globals --------
if (!global.antiSpamGroups) global.antiSpamGroups = loadData();
if (!global.spamTracker) global.spamTracker = {};

export default {
  name: "antispam",
  description: "Anti-spam automatique (flood)",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  // ==================== COMMANDE ====================
  run: async (kaya, m, args) => {
    const chatId = m.chat;
    const action = args[0]?.toLowerCase();

    if (!["on", "off"].includes(action)) {
      return kaya.sendMessage(
        chatId,
        {
          text:
`⚙️ *ANTI-SPAM FLOOD*
.antispam on  → Active
.antispam off → Désactive

📨 Limite : ${MESSAGE_LIMIT} messages / ${TIME_WINDOW / 1000}s`,
          contextInfo
        },
        { quoted: m }
      );
    }

    // ✅ Vérification admin/owner via checkAdminOrOwner
    const check = await checkAdminOrOwner(kaya, chatId, m.sender);
    if (!check.isAdminOrOwner) {
      return kaya.sendMessage(
        chatId,
        { text: "🚫 Seuls les Admins ou le Propriétaire peuvent utiliser cette commande.", contextInfo },
        { quoted: m }
      );
    }

    if (action === "off") {
      delete global.antiSpamGroups[chatId];
      saveData(global.antiSpamGroups);
      return kaya.sendMessage(chatId, { text: "❌ Anti-spam désactivé.", contextInfo }, { quoted: m });
    }

    global.antiSpamGroups[chatId] = { enabled: true };
    saveData(global.antiSpamGroups);

    return kaya.sendMessage(
      chatId,
      {
        text: `✅ Anti-spam activé\n🚨 Flood détecté = EXPULSION AUTOMATIQUE`,
        contextInfo
      },
      { quoted: m }
    );
  },

  // ==================== DÉTECTION FLOOD ====================
  detect: async (kaya, m) => {
    try {
      const chatId = m.chat;
      const sender = m.sender;

      if (!global.antiSpamGroups?.[chatId]?.enabled) return;
      if (m.isAdmin || m.isOwner) return;

      const now = Date.now();

      if (!global.spamTracker[chatId]) global.spamTracker[chatId] = {};
      if (!global.spamTracker[chatId][sender]) {
        global.spamTracker[chatId][sender] = [];
      }

      const userData = global.spamTracker[chatId][sender];

      // Ajouter le timestamp du message
      userData.push(now);

      // Supprimer les anciens messages hors fenêtre
      global.spamTracker[chatId][sender] = userData.filter(
        t => now - t <= TIME_WINDOW
      );

      // 🚨 FLOOD DÉTECTÉ
      if (global.spamTracker[chatId][sender].length >= MESSAGE_LIMIT) {
        delete global.spamTracker[chatId][sender];

        await kaya.groupParticipantsUpdate(chatId, [sender], "remove");

        return kaya.sendMessage(
          chatId,
          {
            text: `🚫 @${sender.split("@")[0]} expulsé pour spam (flood).`,
            mentions: [sender],
            contextInfo
          }
        );
      }

    } catch (e) {
      console.error("AntiSpam Flood error:", e);
    }
  }
};