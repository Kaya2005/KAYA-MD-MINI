// ==================== index.js ====================
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import pino from 'pino';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import { checkUpdate } from './system/updateChecker.js';
import config from './config.js';
import handleCommand, { smsg, handleParticipantUpdate } from './handler.js';

import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidDecode,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!globalThis.crypto?.subtle) globalThis.crypto = crypto.webcrypto;

global.PREFIX = config.PREFIX;
global.owner = [config.OWNER_NUMBER];
global.SESSION_ID = config.SESSION_ID;

// ================== GLOBAL MODES ==================
global.botModes = {
  typing: false,
  recording: false,
  autoreact: { enabled: false }
};
global.autoStatus = false; // pour auto-forward des statuts au owner

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// ================== CHARGEMENT WELCOME MODULE ==================
let welcomeModule;
try {
  welcomeModule = await import('./commands/welcome.js').then(m => m.default);
} catch (err) {
  console.error('❌ Erreur import welcome:', err);
}

// ================== CHARGEMENT SESSION MEGA ==================
let File;
try {
  const megajs = await import('megajs');
  File = megajs?.default?.File || megajs.File;
} catch {
  console.log('📦 Installation de megajs...');
  execSync('npm install megajs', { stdio: 'inherit' });
  const megajs = await import('megajs');
  File = megajs?.default?.File || megajs.File;
}

async function loadSessionFromMega() {
  if (fs.existsSync(credsPath)) return;
  if (!global.SESSION_ID?.startsWith('kaya~')) return;

  const [fileID, key] = global.SESSION_ID.replace('kaya~', '').split('#');
  if (!fileID || !key) return console.error('❌ SESSION_ID MEGA invalide');

  console.log('⬇️ Téléchargement première session depuis MEGA...');
  const file = File.fromURL(`https://mega.nz/file/${fileID}#${key}`);
  await file.loadAttributes();
  const data = await new Promise((resolve, reject) =>
    file.download((err, d) => (err ? reject(err) : resolve(d)))
  );
  fs.writeFileSync(credsPath, data);
  console.log('✅ Session MEGA téléchargée (une seule fois)');
}

// ================== START BOT ==================
async function startBot() {
  try {
    await loadSessionFromMega();

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
      version,
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false
    });

    sock.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
      }
      return jid;
    };

    // ================== CONNECTION UPDATE ==================
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        console.log(chalk.green('✅ KAYA-MD CONNECTÉ'));
        try {
          sock.sendMessage(sock.user.id, {
            image: { url: 'https://files.catbox.moe/981fr6.jpg' },
            caption: `🤖 *KAYA-MD CONNECTÉ*\n💬 Rejoins le groupe : https://chat.whatsapp.com/FNdDBeM5JSh5tBq8y8qBCe?mode=wwt`
          });
        } catch {}

        // ✅ Vérification update AU BON MOMENT
        await checkUpdate(sock);
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log(chalk.red('❌ Déconnecté :'), reason);
        if (reason !== DisconnectReason.loggedOut) setTimeout(startBot, 5000);
        else console.log(chalk.red('🚫 Session expirée - supprimez session/creds.json'));
      }
    });

    // ================== MESSAGES UPDATES ==================
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg?.message) continue;
        const m = smsg(sock, msg);

        // ================== AUTO-FORWARD STATUS ==================
        if (global.autoStatus && !m.fromMe && m.message?.statusMessage) {
          for (const ownerJid of global.owner) {
            await sock.sendMessage(ownerJid, {
              text: `📢 Nouveau statut de @${m.sender.split('@')[0]} :\n\n${m.message.statusMessage}`
            });
          }
        }

        handleCommand(sock, m).catch(err =>
          console.error('❌ Handler error:', err)
        );
      }
    });

    // ================== PARTICIPANT UPDATE ==================
    sock.ev.on('group-participants.update', async (update) => {
      try {
        await handleParticipantUpdate(sock, update);
      } catch (err) {
        console.error('❌ Participant update error:', err);
      }
    });

    sock.ev.on('creds.update', saveCreds);

    return sock;

  } catch (err) {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  }
}

startBot();

process.on('unhandledRejection', err =>
  console.error('UnhandledRejection:', err)
);
process.on('uncaughtException', err =>
  console.error('UncaughtException:', err)
);