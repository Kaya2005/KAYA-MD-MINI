import fs from "fs";
import path from "path";
import { contextInfo } from "../system/contextInfo.js";

const filePath = path.join(process.cwd(), "data/allPrefix.json");

// Crée le fichier JSON s'il n'existe pas
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({ enabled: false }, null, 2));
}

// Fonction pour lire le JSON
function loadAllPrefix() {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.enabled || false;
  } catch {
    return false;
  }
}

// Fonction pour sauvegarder le JSON
function saveAllPrefix(state) {
  fs.writeFileSync(filePath, JSON.stringify({ enabled: state }, null, 2));
  global.allPrefix = state; // Mise à jour immédiate pour le handler
  console.log("🌐 Mode AllPrefix :", state ? "Activé" : "Désactivé");
}

// Initialise global.allPrefix
global.allPrefix = loadAllPrefix();

export default {
  name: "allprefix",
  description: "⚙️ Active ou désactive le mode n'importe quel préfixe",
  category: "Bot",
  ownerOnly: true,

  run: async (sock, m, args) => {
    try {
      // 🔐 Owner uniquement (comme prefix.js)
      if (!m.fromMe) return;

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off"].includes(action)) {
        return sock.sendMessage(
          m.chat,
          { text: "⚙️ Utilisation :\n.allprefix on\n.allprefix off", contextInfo },
          { quoted: m }
        );
      }

      if (action === "on") {
        saveAllPrefix(true);
        return sock.sendMessage(
          m.chat,
          { text: "✅ Mode AllPrefix activé : le bot accepte n'importe quel préfixe ou sans préfixe.", contextInfo },
          { quoted: m }
        );
      } else {
        saveAllPrefix(false);
        return sock.sendMessage(
          m.chat,
          { text: "❌ Mode AllPrefix désactivé : le bot fonctionne seulement avec le préfixe défini.", contextInfo },
          { quoted: m }
        );
      }
    } catch (err) {
      console.error("❌ Erreur allprefix.js:", err);
      return sock.sendMessage(
        m.chat,
        { text: "❌ Une erreur est survenue lors de l'activation du mode AllPrefix.", contextInfo },
        { quoted: m }
      );
    }
  }
};