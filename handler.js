// ==================== handler.js ====================
// ==================== IMPORTS ====================
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import config from './config.js';
import { loadBotModes } from './system/botModes.js'; // ← ici
import { loadBannedUsers } from './system/bannedUsers.js';


import { handleAutoread } from './commands/autoread.js';
import { handleTagDetection } from './lib/antitagDetect.js';
// ================== 🧠 LOAD BOT MODES ==================
if (!global.botModes) global.botModes = { autoreact: { enabled: false } };
loadBotModes(); // ← restaure typing / recording / autoreact depuis le fichier
if (!global.bannedUsers) loadBannedUsers();

// ================== 📂 Stockage des commandes ==================
const commands = {};

// ================== 📂 Chargement des commandes ==================
const loadCommands = async (dir = './commands') => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      await loadCommands(fullPath);
      continue;
    }

    if (!file.endsWith('.js')) continue;

    const module = await import(pathToFileURL(fullPath).href);
    const cmd = module.default || module;

    if (!cmd?.name) continue;
    if (cmd.run || cmd.execute || cmd.detect || cmd.participantUpdate) {
      commands[cmd.name.toLowerCase()] = cmd;
    }
  }
};
await loadCommands();

// ================== 🧠 Globals ==================
global.owner = config.OWNER_NUMBER
  .split(',')
  .map(n => n.replace(/\D/g, '') + '@s.whatsapp.net');

if (!global.bannedUsers) global.bannedUsers = new Set();
if (global.blockInbox === undefined) global.blockInbox = config.blockInbox ?? false;
if (global.privateMode === undefined) global.privateMode = false;
if (!global.botModes) global.botModes = {};
if (!global.botModes.autoreact) global.botModes.autoreact = { enabled: false };
if (global.autoStatus === undefined) global.autoStatus = false;
if (global.allPrefix === undefined) global.allPrefix = false;
if (!global.antiLinkGroups) global.antiLinkGroups = {};
if (!global.antiSpamGroups) global.antiSpamGroups = {};

// ================== 🧠 smsg ==================
export const smsg = (sock, m) => {
  if (!m?.message) return {};

  const msg = m.message;
  const body =
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    '';

  return {
    ...m,
    message: msg,
    body,
    chat: m.key.remoteJid,
    id: m.key.id,
    fromMe: m.key.fromMe,
    sender: m.key.fromMe ? sock.user.id : (m.key.participant || m.key.remoteJid),
    isGroup: m.key.remoteJid.endsWith('@g.us'),

    quoted: msg.extendedTextMessage?.contextInfo?.quotedMessage
      ? {
          key: msg.extendedTextMessage.contextInfo,
          message: msg.extendedTextMessage.contextInfo.quotedMessage,
        }
      : null,

    mentionedJid: msg.extendedTextMessage?.contextInfo?.mentionedJid || []
  };
};

// ================== 🎲 Emojis ==================
const EMOJIS = ['❤️','😂','🔥','👍','🎉','💯','😍','🤖'];
const randomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

// ================== 👀 AUTO STATUS ==================
async function handleAutoStatus(sock, m) {
  try {
    if (!global.autoStatus) return;
    if (!m?.message) return;
    if (m.key.remoteJid !== 'status@broadcast') return;

    const sender = m.key.participant;
    if (!sender || global.owner.includes(sender)) return;

    await sock.readMessages([m.key]);

    await sock.sendMessage(m.key.remoteJid, {
      react: { text: randomEmoji(), key: m.key }
    });

    await sock.sendMessage(global.owner[0], { forward: m });
  } catch (err) {
    console.error('❌ AUTO STATUS ERROR:', err);
  }
}

// ================== 👰 HANDLER COMMANDES ==================
export default async function handleCommand(sock, m, store) {
  try {
    if (!m || !m.message) return;

    const isOwner = m.fromMe || global.owner.includes(m.sender);
    

    // 🔥 AUTO STATUS
    await handleAutoStatus(sock, m);

    // ================== 🔒 PRIVATE MODE ==================
    if (global.privateMode && !isOwner) {
      return sock.sendMessage(
        m.chat,
        { text: "🔒 Bot en mode privé.\nSeul l'owner peut utiliser les commandes." },
        { quoted: m }
      );
    }

  // 🚫 Vérification ban
if (global.bannedUsers.has(m.sender.toLowerCase())) {
  return sock.sendMessage(
    m.chat,
    { text: "🚫 Vous êtes banni du bot." },
    { quoted: m }
  );
}

    // ================== TYPING / RECORDING ==================
    if (global.botModes.typing) await sock.sendPresenceUpdate('composing', m.chat);
    if (global.botModes.recording) await sock.sendPresenceUpdate('recording', m.chat);

    // ================== AUTOREACT ==================
    if (global.botModes.autoreact?.enabled) {
      await sock.sendMessage(m.chat, { react: { text: randomEmoji(), key: m.key } }).catch(() => {});
    }

// ================== COMMAND PARSING ==================
const body = m.body?.trim() || '';
let isCommand = false;
let args = [];
let commandName = '';

if (global.allPrefix) {
  let text = body;

  // Supprimer tous les symboles / emojis au début
  text = text.replace(/^[^a-zA-Z0-9]+/, '').trim();

  if (!text) return;

  const parts = text.split(/\s+/);
  commandName = parts.shift()?.toLowerCase();
  args = parts;
  isCommand = true;

} else {
  // MODE PREFIX NORMAL
  const PREFIX = config.PREFIX;

  if (body.startsWith(PREFIX)) {
    isCommand = true;
    const parts = body.slice(PREFIX.length).trim().split(/\s+/);
    commandName = parts.shift()?.toLowerCase();
    args = parts;
  }
}


//... antitag
if (m.isGroup) {
  await handleTagDetection(sock, smsg(sock, m)).catch(() => {});
}

// 🔹 AUTO-READ
await handleAutoread(sock, m).catch(() => {});

    // 🔹 BLOCK INBOX : uniquement pour les commandes privées
    if (global.blockInbox && !m.isGroup && !isOwner && isCommand) {
      return sock.sendMessage(
        m.chat,
        { text: "🚫 Le bot est bloqué en privé.\n👉 Utilise-le dans un groupe." },
        { quoted: m }
      );
    }

    if (!isCommand) {
      if (m.isGroup) {
        if (global.antiLinkGroups[m.chat]?.enabled && commands.antilink?.detect) {
          commands.antilink.detect(sock, m).catch(() => {});
        }
        if (global.antiSpamGroups[m.chat]?.enabled && commands.antispam?.detect) {
          commands.antispam.detect(sock, m).catch(() => {});
        }
      }
      return;
    }

    if (!commandName) return;
    const cmd = commands[commandName];
    if (!cmd) return;

    if (typeof cmd.execute === 'function') await cmd.execute(sock, m, args, store);
    else if (typeof cmd.run === 'function') await cmd.run(sock, m, args, store);

  } catch (err) {
    console.error('❌ Handler error:', err);
  }
}

// ================== 👥 PARTICIPANT UPDATE ==================
export async function handleParticipantUpdate(sock, update) {
  try {
    const chatId =
      update.id ||
      update.jid ||
      update.key?.remoteJid ||
      update.chat;

    const participants = update.participants || [];
    const action = update.action;

    if (!chatId || !action || !participants.length) return;

    for (const cmdName in commands) {
      const cmd = commands[cmdName];
      if (typeof cmd.participantUpdate === 'function') {
        await cmd.participantUpdate(sock, { id: chatId, participants, action });
      }
    }
  } catch (err) {
    console.error('❌ handleParticipantUpdate error:', err);
  }
}

// ================== 📤 EXPORT ==================
export { commands };