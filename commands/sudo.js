import config, { saveConfig } from "../config.js";
import { contextInfo } from "../system/contextInfo.js";

// 🔹 Normalise un numéro
const normalize = (jid) => jid.split("@")[0].replace(/\D/g, "");

export default {
  name: "sudo",
  description: "👑 Ajouter un owner (Owner uniquement)",
  category: "Owner",

  run: async (kaya, m, args) => {
    try {
      // 🔐 Sécurité absolue : seulement l’owner principal
      if (!m.fromMe) return;

      console.log("🟢 sudo command triggered");

      // 📋 Owners actuels
      const owners = config.OWNER_NUMBER
        .split(",")
        .map(o => normalize(o));

      // 🎯 Cible
      let target;
      if (m.quoted?.sender) {
        target = normalize(m.quoted.sender);
      } else if (args[0]) {
        target = args[0].replace(/\D/g, "");
      } else {
        return kaya.sendMessage(
          m.chat,
          { text: "❌ Utilisation : sudo <numéro> ou répondre à un message.", contextInfo },
          { quoted: m }
        );
      }

      if (owners.includes(target)) {
        return kaya.sendMessage(
          m.chat,
          {
            text: `ℹ️ *@${target}* est déjà owner.`,
            mentions: [target + "@s.whatsapp.net"],
            contextInfo
          },
          { quoted: m }
        );
      }

      // ➕ Ajout
      owners.push(target);
      saveConfig({ OWNER_NUMBER: owners.join(",") });

      console.log("✅ Nouvel owner ajouté :", target);

      // 📤 Confirmation
      return kaya.sendMessage(
        m.chat,
        {
          text: `╭━━〔 👑 OWNER AJOUTÉ 〕━━⬣
├ 📲 Numéro : @${target}
├ ✅ Statut : *OWNER*
├ 🔐 Accès : *Total*
╰──────────────────⬣`,
          mentions: [target + "@s.whatsapp.net"],
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("❌ Erreur sudo :", err);
    }
  }
};