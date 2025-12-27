// ==================== system/updateChecker.js ====================
import axios from "axios";
import config from "../config.js";

export async function checkUpdate(sock) {
  try {
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/Kaya2005/KAYA-MD-MINI/main/version.json"
    );

    const localVersion = config.VERSION || "0.0.0";
    const remoteVersion = data.version;

    if (localVersion !== remoteVersion) {
      const msg = `
🚀 *MISE À JOUR DISPONIBLE*
━━━━━━━━━━━━━━━━━━
📦 Version actuelle : ${localVersion}
🆕 Nouvelle version : ${remoteVersion}

📝 ${data.message}

👉 Tape *.update* pour mettre à jour
`;

      await sock.sendMessage(
        sock.user.id,
        { text: msg }
      );
    }
  } catch (err) {
    console.log("⚠️ Vérification update impossible");
  }
}