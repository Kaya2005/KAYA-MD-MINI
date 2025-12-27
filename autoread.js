// ==================== commands/autoread.js ====================
import fs from 'fs';
import path from 'path';
import { contextInfo } from '../system/contextInfo.js';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'autoread.json');

// 🎛️ Initialisation ou lecture du config JSON
function initConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ enabled: false }, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// 🎯 Vérifie si autoread est activé
export function isAutoreadEnabled() {
  try {
    const config = initConfig();
    return config.enabled;
  } catch (e) {
    console.error('❌ Error checking autoread status:', e);
    return false;
  }
}

// 👀 Vérifie si le bot est mentionné dans un message
export function isBotMentionedInMessage(message, botNumber) {
  if (!message.message) return false;

  const messageTypes = [
    'extendedTextMessage','imageMessage','videoMessage','stickerMessage',
    'documentMessage','audioMessage','contactMessage','locationMessage'
  ];

  for (const type of messageTypes) {
    if (message.message[type]?.contextInfo?.mentionedJid) {
      if (message.message[type].contextInfo.mentionedJid.includes(botNumber)) return true;
    }
  }

  const text = message.message.conversation ||
               message.message.extendedTextMessage?.text ||
               message.message.imageMessage?.caption ||
               message.message.videoMessage?.caption || '';

  if (text) {
    const botUsername = botNumber.split('@')[0];
    if (text.includes(`@${botUsername}`)) return true;

    const botNames = [global.botname?.toLowerCase(), 'bot', 'kaya', 'kaya bot'];
    const words = text.toLowerCase().split(/\s+/);
    if (botNames.some(name => words.includes(name))) return true;
  }

  return false;
}

// ✅ Fonction principale pour lire automatiquement les messages
export async function handleAutoread(sock, m) {
  if (!isAutoreadEnabled()) return false;

  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const mentioned = isBotMentionedInMessage(m, botNumber);

  if (mentioned) return false; // ne marque pas lu si bot mentionné

  const key = { remoteJid: m.key.remoteJid, id: m.key.id, participant: m.key.participant };
  await sock.readMessages([key]);
  return true;
}

// ⚙️ Commande autoread
export default {
  name: 'autoread',
  description: 'Activer ou désactiver la lecture automatique des messages',
  category: 'Owner',

  run: async (kaya, m, args) => {
    try {
      if (!m.fromMe) return;

      const config = initConfig();
      const action = args[0]?.toLowerCase();

      if (action === 'on' || action === 'enable') config.enabled = true;
      else if (action === 'off' || action === 'disable') config.enabled = false;
      else if (!action) config.enabled = !config.enabled;
      else return kaya.sendMessage(
        m.chat,
        { text: '❌ Option invalide ! Utilise : .autoread on/off', contextInfo },
        { quoted: m }
      );

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

      await kaya.sendMessage(
        m.chat,
        { text: `✅ Auto-read est maintenant ${config.enabled ? 'activé' : 'désactivé'} !`, contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ autoread error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue lors de la commande.', contextInfo },
        { quoted: m }
      );
    }
  }
};