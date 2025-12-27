import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import pino from 'pino';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { connectionMessage, getBotImage } from './system/botAssets.js';
import { checkUpdate } from './system/updateChecker.js';
import config from './config.js';
// ================== GLOBALS INIT ==================
import './system/globals.js';       // ⚡ Initialise owner, bannedUsers, botModes, etc.
import { loadBotModes } from './system/botStatus.js'; 
loadBotModes();                      // ⚡ Charge les modes depuis le fichier JSON

import handleCommand, { smsg, handleParticipantUpdate } from './handler.js';
import { loadSessionFromMega } from './system/megaSession.js';

import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidDecode,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';

// ================== PATH ==================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== CRYPTO FIX ==================
if (!globalThis.crypto?.subtle) globalThis.crypto = crypto.webcrypto;

// ================== GLOBAL CONFIG ==================

global.owner = [config.OWNER_NUMBER];
global.SESSION_ID = config.SESSION_ID;

// ================== GLOBAL MODES ==================
global.botModes = { typing: false, recording: false, autoreact: { enabled: false } };
global.autoStatus = false;

// ================== SESSION ==================
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// ================== LOAD WELCOME MODULE ==================
try { await import('./commands/welcome.js'); }
catch (err) { console.error('❌ Erreur import welcome:', err); }

// ================== START BOT ==================
async function startBot() {
  try {
    await loadSessionFromMega(credsPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
      version,
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false
    });

    // ================== JID FIX ==================
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
          const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          await sock.sendMessage(botJid, { image: { url: getBotImage() }, caption: connectionMessage() });
        } catch (err) { console.error('❌ Erreur message connexion:', err); }
        await checkUpdate(sock);
      }
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log(chalk.red('❌ Déconnecté :'), reason);
        if (reason !== DisconnectReason.loggedOut) setTimeout(startBot, 5000);
        else console.log(chalk.red('🚫 Session expirée - supprimez session/creds.json'));
      }
    });

    // ================== MESSAGES ==================
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg?.message) continue;
        const m = smsg(sock, msg);

        // ✅ Commandes traitées en priorité
        handleCommand(sock, m).catch(err => console.error('❌ Handler error:', err));
      }
    });

    // ================== PARTICIPANT UPDATE ==================
    sock.ev.on('group-participants.update', async (update) => {
      try { await handleParticipantUpdate(sock, update); }
      catch (err) { console.error('❌ Participant update error:', err); }
    });

    // ================== SAVE CREDS ==================
    sock.ev.on('creds.update', saveCreds);

    return sock;

  } catch (err) {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  }
}

// ================== RUN ==================
startBot();

// ================== GLOBAL ERRORS ==================
process.on('unhandledRejection', err => console.error('UnhandledRejection:', err));
process.on('uncaughtException', err => console.error('UncaughtException:', err));