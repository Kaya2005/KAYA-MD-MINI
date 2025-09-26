// ================= commands/antilink.js =================
import fs from "fs";
import path from "path";
import { contextInfo } from "../system/contextInfo.js";
import checkAdminOrOwner from "../system/checkAdmin.js";

const antiLinkFile = path.join(process.cwd(), "data/antiLinkGroups.json");

// ----------------- Load & Save -----------------
function loadAntiLinkGroups() {
  if (!fs.existsSync(antiLinkFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(antiLinkFile, "utf-8"));
  } catch {
    return {};
  }
}

function saveAntiLinkGroups() {
  fs.writeFileSync(antiLinkFile, JSON.stringify(global.antiLinkGroups, null, 2));
}

// ----------------- Global -----------------
if (!global.antiLinkGroups) global.antiLinkGroups = loadAntiLinkGroups();
if (!global.userWarns) global.userWarns = {}; // suivi des avertissements

export default {
  name: "antilink",
  description: "Anti-link avec options delete, warn ou kick",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  // ----------------- Commande -----------------
  run: async (kaya, m, msg, store, args) => {
    try {
      const chatId = m.chat;
      if (!chatId.endsWith("@g.us")) {
        return kaya.sendMessage(chatId, { text: "❌ Cette commande fonctionne uniquement dans un groupe.", contextInfo }, { quoted: m });
      }

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off", "delete", "warn", "kick"].includes(action)) {
        return kaya.sendMessage(chatId, {
          text: "⚙️ Usage :\n- .antilink on\n- .antilink off\n- .antilink delete\n- .antilink warn\n- .antilink kick",
          contextInfo
        }, { quoted: m });
      }

      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(chatId, { text: "🚫 Seuls les *Admins* ou le *Propriétaire* peuvent modifier l’anti-link.", contextInfo }, { quoted: m });
      }

      // ==================== Actions ====================
      if (action === "on") {
        global.antiLinkGroups[chatId] = { enabled: true, mode: "warn" };
        saveAntiLinkGroups();
        return kaya.sendMessage(chatId, { text: "✅ *Anti-link activé !* (mode par défaut : warn)", contextInfo }, { quoted: m });
      }

      if (action === "off") {
        delete global.antiLinkGroups[chatId];
        saveAntiLinkGroups();
        return kaya.sendMessage(chatId, { text: "❌ *Anti-link désactivé* pour ce groupe.", contextInfo }, { quoted: m });
      }

      if (["delete", "warn", "kick"].includes(action)) {
        if (!global.antiLinkGroups[chatId]) global.antiLinkGroups[chatId] = { enabled: true };
        global.antiLinkGroups[chatId].enabled = true;
        global.antiLinkGroups[chatId].mode = action;
        saveAntiLinkGroups();
        return kaya.sendMessage(chatId, { text: `✅ Mode *${action.toUpperCase()}* activé pour l’anti-link.`, contextInfo }, { quoted: m });
      }
    } catch (err) {
      console.error("Erreur antilink.js :", err);
      await kaya.sendMessage(m.chat, { text: "❌ Impossible de modifier l’anti-link.", contextInfo }, { quoted: m });
    }
  },

  // ----------------- Détection -----------------
  detect: async (kaya, m, extra = {}) => {
    try {
      const chatId = extra.chatId || m.chat;
      const isGroup = extra.isGroup || chatId.endsWith("@g.us");
      if (!isGroup) return;
      if (!global.antiLinkGroups?.[chatId]?.enabled) return;

      const body =
        m.body ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        "";

      const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|wa\.me\/[0-9]+|t\.me\/[^\s]+)/gi;
      if (!linkRegex.test(body)) return;

      const sender = m.sender;
      const metadata = await kaya.groupMetadata(chatId);
      const participants = metadata.participants || [];
      const check = await checkAdminOrOwner(kaya, chatId, sender, participants);

      if (check.isAdminOrOwner) return; // Admin/owner → ignorer

      // Supprime le message si bot admin
      try {
        const messageKey = { remoteJid: chatId, fromMe: m.key.fromMe, id: m.key.id, participant: isGroup ? m.key.participant : undefined };
        await kaya.sendMessage(chatId, { delete: messageKey });
      } catch (e) { console.error("❌ Impossible de supprimer le message :", e); }

      const mode = global.antiLinkGroups[chatId].mode || "warn";

      if (mode === "kick") {
        await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
        return kaya.sendMessage(chatId, { text: `👢 @${sender.split("@")[0]} expulsé pour lien interdit !`, mentions: [sender], contextInfo });
      }

      if (mode === "warn") {
        if (!global.userWarns[chatId]) global.userWarns[chatId] = {};
        if (!global.userWarns[chatId][sender]) global.userWarns[chatId][sender] = 0;

        global.userWarns[chatId][sender]++;

        if (global.userWarns[chatId][sender] >= 4) {
          delete global.userWarns[chatId][sender];
          await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
          return kaya.sendMessage(chatId, { text: `🚫 @${sender.split("@")[0]} expulsé après 4 avertissements !`, mentions: [sender], contextInfo });
        }

        return kaya.sendMessage(chatId, { text: `⚠️ @${sender.split("@")[0]}, lien interdit ! (avertissement ${global.userWarns[chatId][sender]}/4)`, mentions: [sender], contextInfo });
      }

      if (mode === "delete") {
        return kaya.sendMessage(chatId, { text: `🗑️ Lien supprimé. @${sender.split("@")[0]}, évite d’envoyer des liens.`, mentions: [sender], contextInfo });
      }
    } catch (err) {
      console.error("Erreur détecteur AntiLink :", err);
    }
  }
};