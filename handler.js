// ==================== handler.js ====================
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import config from './config.js';

import {
  storeMessage,
  downloadContentFromMessage,
  uploadImage,
  handleAutoread,
  handleTagDetection,
  handleBotModes
} from './system/initModules.js';

import checkAdminOrOwner from './system/checkAdmin.js';
import { WARN_MESSAGES } from './system/warnMessages.js';

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
    commands[cmd.name.toLowerCase()] = cmd;
  }
};
await loadCommands();

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
    body,
    chat: m.key.remoteJid,
    id: m.key.id,
    fromMe: m.key.fromMe,
    sender: m.key.fromMe
      ? sock.user.id
      : (m.key.participant || m.key.remoteJid),
    isGroup: m.key.remoteJid.endsWith('@g.us'),
    mentionedJid: msg.extendedTextMessage?.contextInfo?.mentionedJid || []
  };
};

// ================== 👰 HANDLER COMMANDES ==================
export default async function handleCommand(sock, mRaw) {
  try {
    if (!mRaw?.message) return;

    const m = smsg(sock, mRaw);

// ================== PARSING ==================
const body = m.body?.trim() || '';
let isCommand = false;
let commandName = '';
let args = [];

const PREFIX = global.PREFIX || config.PREFIX;

if (global.allPrefix) {
  const text = body.replace(/^[^a-zA-Z0-9]+/, '').trim();
  if (text) {
    const parts = text.split(/\s+/);
    const potentialCommand = parts.shift()?.toLowerCase();

    // ✅ Vérifie que la commande existe dans le dossier commands
    if (commands[potentialCommand]) {
      commandName = potentialCommand;
      args = parts;
      isCommand = true;
    }
  }
} else if (body.startsWith(PREFIX)) {
  const parts = body.slice(PREFIX.length).trim().split(/\s+/);
  const potentialCommand = parts.shift()?.toLowerCase();

  if (commands[potentialCommand]) {
    commandName = potentialCommand;
    args = parts;
    isCommand = true;
  }
}
    // ================== ADMIN / OWNER CHECK ==================
    if (isCommand && m.isGroup) {
      const check = await checkAdminOrOwner(sock, m.chat, m.sender);
      m.isAdmin = check.isAdmin;
      m.isOwner = check.isOwner;
    } else {
      m.isAdmin = false;
      m.isOwner = false;
    }

    const ownerCheck = m.isOwner || m.fromMe;

    // ================== BOT MODES ==================
    await handleBotModes(sock, m);

    // ================== 🔒 MODE PRIVÉ ==================
    if (global.privateMode && !ownerCheck) {
      if (!isCommand) return;

      return sock.sendMessage(
        m.chat,
        { text: WARN_MESSAGES.PRIVATE_MODE },
        { quoted: mRaw }
      );
    }

    // ================== 🚫 UTILISATEUR BANNI ==================
    if (global.bannedUsers?.has(m.sender.toLowerCase())) {
      return sock.sendMessage(
        m.chat,
        { text: WARN_MESSAGES.BANNED_USER },
        { quoted: mRaw }
      );
    }

    // ================== 📥 INBOX BLOQUÉ ==================
    if (global.blockInbox && !m.isGroup && !ownerCheck && isCommand) {
      if (!commands[commandName]) return;

      return sock.sendMessage(
        m.chat,
        { text: WARN_MESSAGES.BLOCK_INBOX },
        { quoted: mRaw }
      );
    }

    // ================== 🛡️ DÉTECTIONS NON-COMMANDES ==================
    if (!isCommand && m.isGroup) {
      try {
        if (global.antiLinkGroups?.[m.chat]?.enabled && commands.antilink?.detect) {
          await commands.antilink.detect(sock, m);
        }
        if (global.antiSpamGroups?.[m.chat]?.enabled && commands.antispam?.detect) {
          await commands.antispam.detect(sock, m);
        }
        if (global.antiTagGroups?.[m.chat]?.enabled && commands.antitag?.detect) {
          await commands.antitag.detect(sock, m);
        }
      } catch (e) {
        console.error('❌ Detection error:', e);
      }
      return;
    }

    // ================== 🚀 EXECUTION COMMANDE ==================
    if (!isCommand || !commandName) return;

    const cmd = commands[commandName];
    if (!cmd) return;

    if (cmd.group && !m.isGroup) {
      return sock.sendMessage(
        m.chat,
        { text: WARN_MESSAGES.GROUP_ONLY },
        { quoted: mRaw }
      );
    }

    if (cmd.admin && !m.isAdmin && !m.isOwner) {
      return sock.sendMessage(
        m.chat,
        { text: WARN_MESSAGES.ADMIN_ONLY(commandName) },
        { quoted: mRaw }
      );
    }

    if (cmd.ownerOnly && !ownerCheck) {
      return sock.sendMessage(
        m.chat,
        { text: WARN_MESSAGES.OWNER_ONLY(commandName) },
        { quoted: mRaw }
      );
    }

    if (typeof cmd.execute === 'function') {
      await cmd.execute(sock, m, args, storeMessage);
    } else if (typeof cmd.run === 'function') {
      await cmd.run(sock, m, args, storeMessage);
    }

  } catch (err) {
    console.error('❌ Handler error:', err);
  }
}

// ================== 👥 PARTICIPANT UPDATE ==================
export async function handleParticipantUpdate(sock, update) {
  try {
    const chatId = update.id || update.jid || update.key?.remoteJid || update.chat;
    const participants = update.participants || [];
    const action = update.action;

    if (!chatId || !action || !participants.length) return;

    for (const name in commands) {
      const cmd = commands[name];
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