// ==================== commands/antilink.js ====================
import fs from "fs";
import path from "path";
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
          { text: "❌ Cette commande fonctionne uniquement dans un groupe." },
          { quoted: m }
        );
      }

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
        return kaya.sendMessage(
          chatId,
          { text:
`🔗 *ANTI-LINK*

.antilink on      → Activer (mode WARN)
.antilink off     → Désactiver
.antilink delete  → Supprimer les liens
.antilink warn    → 4 avertissements = kick
.antilink kick    → Expulsion directe
.antilink status  → Voir l'état`
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
            { text: "❌ Anti-link désactivé dans ce groupe." },
            { quoted: m }
          );
        }

        return kaya.sendMessage(
          chatId,
          { text: `✅ Anti-link ACTIVÉ\n📊 Mode : ${data.mode.toUpperCase()}` },
          { quoted: m }
        );
      }

      // 🔐 Vérification admin/owner pour tous les admins
      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: "🚫 Admin ou Owner uniquement." },
          { quoted: m }
        );
      }

      // ---------- ACTIONS ----------
      if (action === "on") {
        global.antiLinkGroups[chatId] = { enabled: true, mode: "warn" };
        saveAntiLinkGroups();
        return kaya.sendMessage(
          chatId,
          { text: "✅ Anti-link activé\n⚠️ Mode WARN (4 avertissements = expulsion)" },
          { quoted: m }
        );
      }

      if (action === "off") {
        delete global.antiLinkGroups[chatId];
        delete global.userWarns[chatId];
        saveAntiLinkGroups();
        return kaya.sendMessage(
          chatId,
          { text: "❌ Anti-link désactivé et avertissements réinitialisés." },
          { quoted: m }
        );
      }

      if (["delete", "warn", "kick"].includes(action)) {
        global.antiLinkGroups[chatId] = { enabled: true, mode: action };
        saveAntiLinkGroups();
        return kaya.sendMessage(
          chatId,
          { text: `✅ Mode Anti-link réglé sur : ${action.toUpperCase()}` },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ Erreur antilink.js :", err);
      return kaya.sendMessage(
        m.chat,
        { text: "❌ Une erreur est survenue avec la commande anti-link." },
        { quoted: m }
      );
    }
  },

  // ==================== DÉTECTION ANTI-LINK ====================
  detect: async (kaya, m) => {
    try {
      if (!m.isGroup || m.key?.fromMe) return;
      const chatId = m.chat;
      if (!global.antiLinkGroups?.[chatId]?.enabled) return;

      const sender = m.sender;
      const mode = global.antiLinkGroups[chatId].mode;

      // ⚠️ Ignorer si admin/owner
      if (m.isAdmin || m.isOwner) return;

      const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i;
      if (!linkRegex.test(m.body)) return;

      // Supprimer le message
      await kaya.sendMessage(chatId, { delete: m.key }).catch(() => {});

      // 🚫 MODE DELETE → Message simple
      if (mode === "delete") {
        return kaya.sendMessage(chatId, {
          text: `🚫 LIENS INTERDITS\n👤 @${sender.split("@")[0]}\n🔗 Les liens sont interdits dans ce groupe.`,
          mentions: [sender]
        });
      }

      // 🚨 MODE KICK → Expulsion directe
      if (mode === "kick") {
        await kaya.sendMessage(chatId, {
          text: `🚫 @${sender.split("@")[0]} a été expulsé pour envoi de lien.`,
          mentions: [sender]
        });
        return await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
      }

      // ⚠️ MODE WARN
      if (mode === "warn") {
        if (!global.userWarns[chatId]) global.userWarns[chatId] = {};
        global.userWarns[chatId][sender] = (global.userWarns[chatId][sender] || 0) + 1;

        const warns = global.userWarns[chatId][sender];

        // ⚠️ Avertissement
        await kaya.sendMessage(chatId, {
          text: `⚠️ ANTI-LINK AVERTISSEMENT\n👤 @${sender.split("@")[0]}\n🔗 Les liens sont interdits.\n📊 Avertissement : ${warns}/4\n🚫 Au 4ᵉ avertissement → EXPULSION`,
          mentions: [sender]
        });

        if (warns >= 4) {
          delete global.userWarns[chatId][sender];

          await kaya.sendMessage(chatId, {
            text: `🚫 @${sender.split("@")[0]} a été expulsé après 4 avertissements.`,
            mentions: [sender]
          });

          await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
        }
      }

    } catch (e) {
      console.error("❌ AntiLink detect error:", e);
    }
  }
};