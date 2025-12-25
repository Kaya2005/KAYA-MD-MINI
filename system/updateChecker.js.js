// ==================== system/updateChecker.js ====================
import axios from 'axios';
import config from '../config.js';

export async function checkUpdate(sock) {
  try {
    const { data } = await axios.get(
      'https://raw.githubusercontent.com/TON-USERNAME/KAYA-MD/main/version.json'
    );

    const localVersion = config.VERSION || '0.0.0';
    const remoteVersion = data.version;

    if (localVersion !== remoteVersion) {
      const text = `
🚀 *MISE À JOUR DISPONIBLE*
━━━━━━━━━━━━━━━━━━
📦 Version actuelle : ${localVersion}
🆕 Nouvelle version : ${remoteVersion}

📝 ${data.message}

👉 Tape *.update* pour mettre à jour
`;

      for (const ownerJid of global.owner) {
        await sock.sendMessage(ownerJid, { text });
      }
    }
  } catch (err) {
    console.log('⚠️ Impossible de vérifier les mises à jour');
  }
}