import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { contextInfo } from '../system/contextInfo.js';
import checkAdminOrOwner from '../system/checkAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WELCOME_FILE = path.join(__dirname, '../data/welcome.json');

/* ================== INIT / LOAD / SAVE ================== */
const initWelcomeFile = () => {
  if (!fs.existsSync(WELCOME_FILE)) {
    const dir = path.dirname(WELCOME_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(WELCOME_FILE, JSON.stringify({}, null, 2));
  }
};

const loadWelcomeData = () => {
  try {
    initWelcomeFile();
    return JSON.parse(fs.readFileSync(WELCOME_FILE, 'utf8'));
  } catch {
    return {};
  }
};

const saveWelcomeData = (data) => {
  fs.writeFileSync(WELCOME_FILE, JSON.stringify(data, null, 2));
};

/* ================== COMMANDE ================== */
export default {
  name: 'welcome',
  alias: ['bienvenue', 'wel'],
  description: 'Active/désactive les messages de bienvenue',
  category: 'owner',

  async execute(sock, m, args) {
    try {
      const permissions = await checkAdminOrOwner(sock, m.chat, m.sender);
      if (!permissions.isOwner) {
        return sock.sendMessage(
          m.chat,
          { text: '🚫 Commande réservée à l’owner du bot.', contextInfo },
          { quoted: m }
        );
      }

      const welcomeData = loadWelcomeData();
      const chatId = m.chat;

      if (!args.length) {
        return sock.sendMessage(
          chatId,
          {
            text: `
╭━━〔 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 〕━━⬣
│
│ • ${global.PREFIX}welcome on → Active dans ce groupe
│ • ${global.PREFIX}welcome off → Désactive dans ce groupe
│ • ${global.PREFIX}welcome all → Active globalement
│ • ${global.PREFIX}welcome all off → Désactive globalement
│ • ${global.PREFIX}welcome status → Voir le statut
╰──────────────────⬣`.trim(),
            contextInfo
          },
          { quoted: m }
        );
      }

      const subCmd = args.join(' ').toLowerCase();

      if (subCmd === 'all off') {
        delete welcomeData.global;
        saveWelcomeData(welcomeData);
        return sock.sendMessage(chatId, { text: '❌ Welcome global désactivé.' }, { quoted: m });
      }

      if (subCmd === 'all') {
        welcomeData.global = true;
        saveWelcomeData(welcomeData);
        return sock.sendMessage(chatId, { text: '✅ Welcome global activé.' }, { quoted: m });
      }

      if (subCmd === 'on' || subCmd === '1') {
        welcomeData[chatId] = true;
        saveWelcomeData(welcomeData);
        return sock.sendMessage(chatId, { text: '✅ Welcome activé pour ce groupe.' }, { quoted: m });
      }

      if (subCmd === 'off' || subCmd === '0') {
        delete welcomeData[chatId];
        saveWelcomeData(welcomeData);
        return sock.sendMessage(chatId, { text: '❌ Welcome désactivé pour ce groupe.' }, { quoted: m });
      }

      if (subCmd === 'status') {
        const globalStatus = welcomeData.global ? '✅ Activé globalement' : '❌ Désactivé globalement';
        const groupStatus = welcomeData[chatId] ? '✅ Activé ici' : '❌ Désactivé ici';
        return sock.sendMessage(
          chatId,
          { text: `📊 *STATUT WELCOME*\n\n${globalStatus}\n${groupStatus}` },
          { quoted: m }
        );
      }

      return sock.sendMessage(chatId, { text: '❌ Commande non reconnue.' }, { quoted: m });

    } catch (err) {
      console.error('❌ Erreur commande welcome:', err);
      sock.sendMessage(m.chat, { text: '❌ Erreur lors de la configuration.' }, { quoted: m });
    }
  },

  /* ================== PARTICIPANT UPDATE ================== */
  async participantUpdate(sock, update) {
    try {
      if (update.action !== 'add') return;

      const welcomeData = loadWelcomeData();
      const chatId = update.id;

      if (!welcomeData.global && !welcomeData[chatId]) return;

      const metadata = await sock.groupMetadata(chatId);
      const now = new Date();
      const date = now.toLocaleDateString('fr-FR');
      const creationDate = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString('fr-FR') : 'Inconnue';

      for (const user of update.participants) {
        // Normalisation JID
        const userJid = typeof user === 'string' ? user : user?.id || user?.jid;
        if (!userJid) continue;

        const username = '@' + userJid.split('@')[0];
        const groupName = metadata.subject || 'Nom inconnu';
        const groupSize = metadata.participants.length;

        const welcomeText = `╭━━〔 WELCOME  〕━━⬣
├ 👤 Bienvenue ${username}
├ 🎓 Groupe: *${groupName}*
├ 👥 Membres : ${groupSize}
├ 🏗️ Créé le : ${creationDate}
├ 📆 Date: ${date}
├ 📜 \`Règles\` :
│  ┗ Pas de liens interdits ❌
│  ┗ Pas de contenu xxx 🔞
│  ┗ Pas de spam 🚫
╰─────────────────────⬣`;

        await sock.sendMessage(chatId, {
          text: welcomeText,
          mentions: [userJid],
          contextInfo: { ...contextInfo, mentionedJid: [userJid] }
        });

        // Petit délai pour éviter double envoi
        await new Promise(r => setTimeout(r, 500));
      }

    } catch (err) {
      console.error('❌ Welcome participant error:', err);
    }
  }
};