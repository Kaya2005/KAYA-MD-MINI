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
// Initialiser dans handler.js, mais on s'assure ici
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
        return kaya.sendMessage(
          chatId, 
          { 
            text: "❌ Cette commande fonctionne uniquement dans un groupe.", 
            contextInfo 
          }, 
          { quoted: m }
        );
      }

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
        return kaya.sendMessage(
          chatId, 
          {
            text: `🔗 *Anti-link - Commandes*\n
⚙️ Utilisation :
• .antilink on - Active (mode warn par défaut)
• .antilink off - Désactive
• .antilink delete - Supprime les liens
• .antilink warn - Avertit (max 4)
• .antilink kick - Expulse immédiatement
• .antilink status - Voir l'état`,
            contextInfo
          }, 
          { quoted: m }
        );
      }

      if (action === "status") {
        const groupData = global.antiLinkGroups[chatId];
        let statusText = "";
        
        if (!groupData || !groupData.enabled) {
          statusText = "❌ Anti-link est DÉSACTIVÉ dans ce groupe.";
        } else {
          const mode = groupData.mode || "warn";
          statusText = `✅ Anti-link est ACTIVÉ\n`;
          statusText += `📊 Mode : ${mode.toUpperCase()}\n`;
          
          if (mode === "warn") {
            const warns = global.userWarns[chatId] || {};
            const warnCount = Object.keys(warns).length;
            if (warnCount > 0) {
              statusText += `⚠️ ${warnCount} utilisateur(s) averti(s)\n`;
            }
          }
        }
        
        return kaya.sendMessage(
          chatId, 
          { 
            text: statusText, 
            contextInfo 
          }, 
          { quoted: m }
        );
      }

      if (action === "on") {
        global.antiLinkGroups[chatId] = { enabled: true, mode: "warn" };
        saveAntiLinkGroups();
        return kaya.sendMessage(
          chatId, 
          { 
            text: "✅ *Anti-link activé !*\nMode par défaut : WARN (4 avertissements = kick)", 
            contextInfo 
          }, 
          { quoted: m }
        );
      }

      if (action === "off") {
        delete global.antiLinkGroups[chatId];
        saveAntiLinkGroups();
        
        // Nettoyer les avertissements pour ce groupe
        if (global.userWarns[chatId]) {
          delete global.userWarns[chatId];
        }
        
        return kaya.sendMessage(
          chatId, 
          { 
            text: "❌ *Anti-link désactivé* pour ce groupe.\nTous les avertissements ont été réinitialisés.", 
            contextInfo 
          }, 
          { quoted: m }
        );
      }

      if (["delete", "warn", "kick"].includes(action)) {
        if (!global.antiLinkGroups[chatId]) {
          global.antiLinkGroups[chatId] = { enabled: true };
        }
        
        global.antiLinkGroups[chatId].enabled = true;
        global.antiLinkGroups[chatId].mode = action;
        saveAntiLinkGroups();
        
        let modeDescription = "";
        if (action === "delete") modeDescription = "Les liens seront supprimés sans avertissement.";
        if (action === "warn") modeDescription = "4 avertissements = expulsion automatique.";
        if (action === "kick") modeDescription = "Expulsion immédiate dès le premier lien.";
        
        return kaya.sendMessage(
          chatId, 
          { 
            text: `✅ Mode *${action.toUpperCase()}* activé pour l'anti-link.\n${modeDescription}`, 
            contextInfo 
          }, 
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ Erreur antilink.js :", err);
      return kaya.sendMessage(
        m.chat, 
        { 
          text: "❌ Impossible de modifier l'anti-link.", 
          contextInfo 
        }, 
        { quoted: m }
      );
    }
  },

  // ----------------- Détection -----------------
  detect: async (kaya, m) => {
    try {
      const chatId = m.chat;
      
      // Vérifications de base
      if (!m.isGroup) return;
      if (m.key?.fromMe) return; // Ignorer les messages du bot
      if (!global.antiLinkGroups?.[chatId]?.enabled) return;

      const body = m.body || "";
      if (!body) return;

      // Expressions régulières pour détecter les liens
      const linkPatterns = [
        /https?:\/\/[^\s]+/gi,
        /www\.[^\s]+\.[a-z]{2,}/gi,
        /wa\.me\/[0-9]+/gi,
        /t\.me\/[^\s]+/gi,
        /chat\.whatsapp\.com\/[^\s]+/gi,
        /instagram\.com\/[^\s]+/gi,
        /facebook\.com\/[^\s]+/gi,
        /youtube\.com\/[^\s]+/gi,
        /youtu\.be\/[^\s]+/gi,
        /twitter\.com\/[^\s]+/gi,
        /x\.com\/[^\s]+/gi,
        /tiktok\.com\/[^\s]+/gi,
        /snapchat\.com\/[^\s]+/gi,
        /discord\.gg\/[^\s]+/gi,
        /discord\.com\/[^\s]+/gi
      ];

      const hasLink = linkPatterns.some(pattern => pattern.test(body));
      if (!hasLink) return;

      const sender = m.sender;
      
      // Vérifier si l'expéditeur est admin (simplifié)
      try {
        const metadata = await kaya.groupMetadata(chatId);
        const participant = metadata.participants.find(p => p.id === sender);
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
        
        if (isAdmin) return; // Admins sont exemptés
      } catch (err) {
        console.error('❌ Erreur vérification admin:', err);
      }

      // Supprimer le message
      try {
        await kaya.sendMessage(chatId, { delete: m.key });
      } catch (err) {
        console.error('❌ Impossible de supprimer le message:', err);
      }

      const mode = global.antiLinkGroups[chatId].mode || "warn";

      // Mode DELETE: juste supprimer le message
      if (mode === "delete") {
        return; // Pas de notification
      }

      // Mode KICK: expulser immédiatement
      if (mode === "kick") {
        try {
          await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
          
          await kaya.sendMessage(
            chatId, 
            { 
              text: `👢 @${sender.split("@")[0]} a été expulsé pour avoir envoyé un lien.\n🚫 Les liens ne sont pas autorisés dans ce groupe.`,
              mentions: [sender]
            }
          );
        } catch (err) {
          console.error('❌ Impossible d\'expulser:', err);
          
          await kaya.sendMessage(
            chatId, 
            { 
              text: `⚠️ @${sender.split("@")[0]} a envoyé un lien interdit mais je ne peux pas l'expulser (permissions insuffisantes).`,
              mentions: [sender]
            }
          );
        }
        return;
      }

      // Mode WARN: système d'avertissements
      if (mode === "warn") {
        // Initialiser les structures
        if (!global.userWarns[chatId]) global.userWarns[chatId] = {};
        if (!global.userWarns[chatId][sender]) global.userWarns[chatId][sender] = 0;

        // Incrémenter l'avertissement
        global.userWarns[chatId][sender]++;
        const warnCount = global.userWarns[chatId][sender];

        // Si 4 avertissements ou plus, expulser
        if (warnCount >= 4) {
          try {
            // Réinitialiser avant expulsion
            delete global.userWarns[chatId][sender];
            
            await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
            
            await kaya.sendMessage(
              chatId, 
              { 
                text: `🚫 @${sender.split("@")[0]} a été expulsé après 4 avertissements pour liens interdits.`,
                mentions: [sender]
              }
            );
          } catch (err) {
            console.error('❌ Impossible d\'expulser après avertissements:', err);
            
            await kaya.sendMessage(
              chatId, 
              { 
                text: `⚠️ @${sender.split("@")[0]} a atteint 4 avertissements mais je ne peux pas l'expulser (permissions insuffisantes).`,
                mentions: [sender]
              }
            );
          }
          return;
        }

        // Sinon, juste avertir
        await kaya.sendMessage(
          chatId, 
          { 
            text: `⚠️ @${sender.split("@")[0]}, les liens sont interdits dans ce groupe !\nAvertissement ${warnCount}/4\n(4 avertissements = expulsion)`,
            mentions: [sender]
          }
        );
      }

    } catch (err) {
      console.error("❌ Erreur détection antilink:", err);
    }
  }
};