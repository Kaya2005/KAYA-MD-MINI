// ================= commands/kick.js =================
import checkAdminOrOwner from "../system/checkAdmin.js";
import { contextInfo } from "../system/contextInfo.js";

export default {
  name: "kick",
  description: "Expulse un membre du groupe",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, msg, store, args) => {
    const chatId = m.chat;

    try {
      // ✅ Vérifie si l’utilisateur est admin/owner
      const permissions = await checkAdminOrOwner(kaya, chatId, m.sender);
      const isAdminOrOwner = permissions.isAdmin || permissions.isOwner;

      if (!isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: "🚫 Seuls les *Admins* ou le *Propriétaire* peuvent utiliser `.kick`.", contextInfo },
          { quoted: m }
        );
      }

      // ✅ Identifier la cible
      let target;
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (m.quoted?.sender) {
        target = m.quoted.sender;
      } else if (args[0]) {
        target = args[0].replace(/[@+]/g, "") + "@s.whatsapp.net";
      }

      if (!target) {
        return kaya.sendMessage(
          chatId,
          { text: "⚙️ Usage: `.kick @utilisateur` ou répondre à son message.", contextInfo },
          { quoted: m }
        );
      }

      // ✅ Vérifie que ce n’est pas un admin
      const groupMetadata = await kaya.groupMetadata(chatId);
      const groupAdmins = groupMetadata.participants
        .filter(p => p.admin === "admin" || p.admin === "superadmin")
        .map(p => p.id);

      if (groupAdmins.includes(target)) {
        return kaya.sendMessage(
          chatId,
          { text: "❌ Impossible d’expulser un *Admin*.", contextInfo },
          { quoted: m }
        );
      }

      // ✅ Expulsion
      await kaya.groupParticipantsUpdate(chatId, [target], "remove");

      return kaya.sendMessage(
        chatId,
        {
          text: `🚷 @${target.split("@")[0]} a été expulsé du groupe.`,
          mentions: [target],
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("❌ Erreur commande kick:", err);
      return kaya.sendMessage(
        chatId,
        { text: `⚠️ Impossible d’expulser ce membre.\nDétails: ${err.message}`, contextInfo },
        { quoted: m }
      );
    }
  }
};