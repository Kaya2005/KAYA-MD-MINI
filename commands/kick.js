// ================= commands/kick.js =================
import checkAdminOrOwner from "../system/checkAdmin.js";
import { contextInfo } from "../system/contextInfo.js";

export default {
  name: "kick",
  description: "Expulse un membre du groupe (silencieux)",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, msg, store, args) => {
    const chatId = m.chat;

    try {
      // 🔹 Metadata groupe
      const groupMetadata = await kaya.groupMetadata(chatId);
      const participants = groupMetadata.participants || [];

      // 🔹 Vérification admin
      const permissions = await checkAdminOrOwner(
        kaya,
        chatId,
        m.sender,
        participants,
        groupMetadata
      );

      if (!permissions.isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: "🚫 Seuls les *Admins* ou le *Propriétaire* peuvent utiliser `.kick`.", contextInfo },
          { quoted: m }
        );
      }

      // ==================== CIBLE ====================
      let target = null;

      // Mention
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }

      // Réponse à un message
      else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }

      // Numéro écrit
      else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      }

      if (!target) {
        return kaya.sendMessage(
          chatId,
          { text: "⚙️ Usage : `.kick @utilisateur` ou répondre à son message.", contextInfo },
          { quoted: m }
        );
      }

      // 🔹 Protection admins
      const groupAdmins = participants
        .filter(p => p.admin === "admin" || p.admin === "superadmin")
        .map(p => p.id);

      if (groupAdmins.includes(target)) {
        return kaya.sendMessage(
          chatId,
          { text: "❌ Impossible d’expulser un *Admin*.", contextInfo },
          { quoted: m }
        );
      }

      // ==================== KICK SILENCIEUX ====================
      await kaya.groupParticipantsUpdate(chatId, [target], "remove");

      // ❌ AUCUN MESSAGE ENVOYÉ AU GROUPE
      return;

    } catch (err) {
      console.error("❌ Erreur commande kick:", err);
      return kaya.sendMessage(
        chatId,
        { text: "⚠️ Impossible d’expulser ce membre.", contextInfo },
        { quoted: m }
      );
    }
  }
};