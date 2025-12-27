import config, { saveConfig } from "../config.js";
import { contextInfo } from "../system/contextInfo.js";

// 🔹 Normalise un numéro
const normalize = (jid) => jid.split("@")[0].replace(/\D/g, "");

export default {
  name: "unsudo",
  description: "❌ Retirer un owner (Owner uniquement)",
  category: "Owner",

  run: async (kaya, m, args) => {
    try {
      // 🔐 Sécurité : seulement l’owner principal
      if (!m.fromMe) return;

      console.log("🟢 unsudo command triggered");

      // 📋 Owners actuels
      let owners = config.OWNER_NUMBER
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
          { text: "❌ Utilisation : unsudo <numéro> ou répondre à un message.", contextInfo },
          { quoted: m }
        );
      }

      // 🚫 Protection : ne pas se retirer soi-même
      const me = normalize(m.sender);
      if (target === me) {
        return kaya.sendMessage(
          m.chat,
          { text: "🚫 Tu ne peux pas te retirer toi-même des owners.", contextInfo },
          { quoted: m }
        );
      }

      if (!owners.includes(target)) {
        return kaya.sendMessage(
          m.chat,
          {
            text: `ℹ️ *@${target}* n'est pas owner.`,
            mentions: [target + "@s.whatsapp.net"],
            contextInfo
          },
          { quoted: m }
        );
      }

      // ➖ Suppression
      owners = owners.filter(o => o !== target);
      saveConfig({ OWNER_NUMBER: owners.join(",") });

      console.log("✅ Owner retiré :", target);

      // 📤 Confirmation
      return kaya.sendMessage(
        m.chat,
        {
          text: `╭━━〔 ❌ OWNER RETIRÉ 〕━━⬣
├ 📲 Numéro : @${target}
├ 🗑️ Statut : *Supprimé des OWNERS*
╰──────────────────⬣`,
          mentions: [target + "@s.whatsapp.net"],
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("❌ Erreur unsudo :", err);
    }
  }
};