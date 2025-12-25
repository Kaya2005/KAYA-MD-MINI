// ==================== commands/antilink.js ====================
import fs from "fs";
import path from "path";
import { contextInfo } from "../system/contextInfo.js";

// 📂 Fichier de sauvegarde
const antiLinkFile = path.join(process.cwd(), "data/antiLinkGroups.json");

// ----------------- Chargement & Sauvegarde -----------------
function loadAntiLinkGroups() {
  try {
    if (fs.existsSync(antiLinkFile)) {
      return JSON.parse(fs.readFileSync(antiLinkFile, "utf-8"));
    }
  } catch (err) {
    console.error('❌ Erreur chargement antiLinkGroups.json:', err);
  }
  return {};
}

function saveAntiLinkGroups() {
  try {
    fs.writeFileSync(antiLinkFile, JSON.stringify(global.antiLinkGroups, null, 2));
  } catch (err) {
    console.error('❌ Erreur sauvegarde antiLinkGroups.json:', err);
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

  // ----------------- Commande -----------------
  run: async (kaya, m, args) => {
    try {
      const chatId = m.chat;
      if (!m.isGroup) {
        return kaya.sendMessage(chatId, { text: "❌ Cette commande fonctionne uniquement dans un groupe.", contextInfo }, { quoted: m });
      }

      const metadata = await kaya.groupMetadata(chatId);
      const botId = kaya.user.id;
      const botParticipant = metadata.participants.find(p => p.id === botId);
      const botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

      if (!botIsAdmin) {
        return kaya.sendMessage(chatId, { text: "❌ Je dois être admin pour activer ou gérer l'anti-link.", contextInfo }, { quoted: m });
      }

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
        return kaya.sendMessage(chatId, { 
          text: `🔗 *Anti-link - Commandes*\n
⚙️ Utilisation :
• .antilink on - Active (mode warn par défaut)
• .antilink off - Désactive
• .antilink delete - Supprime les liens
• .antilink warn - Avertit (max 4)
• .antilink kick - Expulse immédiatement
• .antilink status - Voir l'état`,
          contextInfo 
        }, { quoted: m });
      }

      if (action === "status") {
        const groupData = global.antiLinkGroups[chatId];
        let statusText = "";

        if (!groupData || !groupData.enabled) {
          statusText = "❌ Anti-link est DÉSACTIVÉ dans ce groupe.";
        } else {
          const mode = groupData.mode || "warn";
          statusText = `✅ Anti-link est ACTIVÉ\n📊 Mode : ${mode.toUpperCase()}\n`;

          if (mode === "warn") {
            const warns = global.userWarns[chatId] || {};
            const warnCount = Object.keys(warns).length;
            if (warnCount > 0) statusText += `⚠️ ${warnCount} utilisateur(s) averti(s)\n`;
          }
        }

        return kaya.sendMessage(chatId, { text: statusText, contextInfo }, { quoted: m });
      }

      if (action === "on") {
        global.antiLinkGroups[chatId] = { enabled: true, mode: "warn" };
        saveAntiLinkGroups();
        return kaya.sendMessage(chatId, { text: "✅ *Anti-link activé !*\nMode par défaut : WARN (4 avertissements = kick)", contextInfo }, { quoted: m });
      }

      if (action === "off") {
        delete global.antiLinkGroups[chatId];
        saveAntiLinkGroups();
        if (global.userWarns[chatId]) delete global.userWarns[chatId];
        return kaya.sendMessage(chatId, { text: "❌ *Anti-link désactivé* pour ce groupe.\nTous les avertissements ont été réinitialisés.", contextInfo }, { quoted: m });
      }

      if (["delete", "warn", "kick"].includes(action)) {
        if (!global.antiLinkGroups[chatId]) global.antiLinkGroups[chatId] = { enabled: true };
        global.antiLinkGroups[chatId].enabled = true;
        global.antiLinkGroups[chatId].mode = action;
        saveAntiLinkGroups();

        let modeDescription = action === "delete" ? "Les liens seront supprimés sans avertissement."
                            : action === "warn" ? "4 avertissements = expulsion automatique."
                            : "Expulsion immédiate dès le premier lien.";

        return kaya.sendMessage(chatId, { text: `✅ Mode *${action.toUpperCase()}* activé pour l'anti-link.\n${modeDescription}`, contextInfo }, { quoted: m });
      }

    } catch (err) {
      console.error("❌ Erreur antilink.js :", err);
      return kaya.sendMessage(m.chat, { text: "❌ Impossible de modifier l'anti-link.", contextInfo }, { quoted: m });
    }
  },

  // ----------------- Détection -----------------
  detect: async (kaya, m) => {
    try {
      const chatId = m.chat;
      if (!m.isGroup) return;
      if (m.key?.fromMe) return;
      if (!global.antiLinkGroups?.[chatId]?.enabled) return;

      const metadata = await kaya.groupMetadata(chatId);
      const botId = kaya.user.id;
      const botParticipant = metadata.participants.find(p => p.id === botId);
      const botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      if (!botIsAdmin) return; // ⚠️ ne rien faire si le bot n'est pas admin

      const body = m.body || "";
      if (!body) return;

      const linkPatterns = [
        /https?:\/\/[^\s]+/gi, /www\.[^\s]+\.[a-z]{2,}/gi,
        /wa\.me\/[0-9]+/gi, /t\.me\/[^\s]+/gi, /chat\.whatsapp\.com\/[^\s]+/gi,
        /instagram\.com\/[^\s]+/gi, /facebook\.com\/[^\s]+/gi,
        /youtube\.com\/[^\s]+/gi, /youtu\.be\/[^\s]+/gi,
        /twitter\.com\/[^\s]+/gi, /x\.com\/[^\s]+/gi, /tiktok\.com\/[^\s]+/gi,
        /snapchat\.com\/[^\s]+/gi, /discord\.gg\/[^\s]+/gi, /discord\.com\/[^\s]+/gi
      ];

      const hasLink = linkPatterns.some(p => p.test(body));
      if (!hasLink) return;

      const sender = m.sender;
      const participant = metadata.participants.find(p => p.id === sender);
      const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
      if (isAdmin) return; // Les admins ne sont jamais avertis

      // Supprimer le message si possible
      try { await kaya.sendMessage(chatId, { delete: m.key }); } catch {}

      const mode = global.antiLinkGroups[chatId].mode || "warn";

      if (mode === "delete") return;

      if (mode === "kick") {
        try {
          await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
          await kaya.sendMessage(chatId, { text: `👢 @${sender.split("@")[0]} a été expulsé pour avoir envoyé un lien.\n🚫 Les liens ne sont pas autorisés dans ce groupe.`, mentions: [sender] });
        } catch {
          await kaya.sendMessage(chatId, { text: `⚠️ @${sender.split("@")[0]} a envoyé un lien interdit mais je ne peux pas l'expulser (permissions insuffisantes).`, mentions: [sender] });
        }
        return;
      }

      if (mode === "warn") {
        if (!global.userWarns[chatId]) global.userWarns[chatId] = {};
        if (!global.userWarns[chatId][sender]) global.userWarns[chatId][sender] = 0;

        global.userWarns[chatId][sender]++;
        const warnCount = global.userWarns[chatId][sender];

        if (warnCount >= 4) {
          delete global.userWarns[chatId][sender];
          try {
            await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
            await kaya.sendMessage(chatId, { text: `🚫 @${sender.split("@")[0]} a été expulsé après 4 avertissements pour liens interdits.`, mentions: [sender] });
          } catch {
            await kaya.sendMessage(chatId, { text: `⚠️ @${sender.split("@")[0]} a atteint 4 avertissements mais je ne peux pas l'expulser (permissions insuffisantes).`, mentions: [sender] });
          }
          return;
        }

        await kaya.sendMessage(chatId, { text: `⚠️ @${sender.split("@")[0]}, les liens sont interdits dans ce groupe !\nAvertissement ${warnCount}/4\n(4 avertissements = expulsion)`, mentions: [sender] });
      }

    } catch (err) {
      console.error("❌ Erreur détection antilink:", err);
    }
  }
};