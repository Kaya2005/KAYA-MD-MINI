import fs from 'fs';
import path from 'path';
import checkAdminOrOwner from '../system/checkAdmin.js';
import { contextInfo } from '../system/contextInfo.js';

const antiPromoteFile = path.join(process.cwd(), 'system/antipromote.json');
let antiPromoteData = {};
if (fs.existsSync(antiPromoteFile)) {
  try { antiPromoteData = JSON.parse(fs.readFileSync(antiPromoteFile, 'utf-8')); } 
  catch { antiPromoteData = {}; }
}

function saveAntiPromote() {
  fs.writeFileSync(antiPromoteFile, JSON.stringify(antiPromoteData, null, 2));
}

const processing = new Set();

export default {
  name: 'antipromote',
  description: '🚫 Empêche la promotion automatique des membres',
  category: 'Sécurité',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, args) => {
    if (!m.isGroup) return kaya.sendMessage(m.chat, { text: '❌ Cette commande fonctionne uniquement dans un groupe.', contextInfo }, { quoted: m });

    const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
    if (!permissions.isAdmin && !permissions.isOwner) return kaya.sendMessage(m.chat, { text: '🚫 Seuls les Admins ou le Propriétaire peuvent activer/désactiver l\'anti-promote.', contextInfo }, { quoted: m });

    const chatId = m.chat;
    const action = args[0]?.toLowerCase();

    if (action === 'on') {
      antiPromoteData[chatId] = { enabled: true, timestamp: Date.now() };
      saveAntiPromote();
      return kaya.sendMessage(m.chat, { text: '✅ *AntiPromote activé*', contextInfo }, { quoted: m });
    }

    if (action === 'off') {
      delete antiPromoteData[chatId];
      saveAntiPromote();
      return kaya.sendMessage(m.chat, { text: '❌ *AntiPromote désactivé*', contextInfo }, { quoted: m });
    }

    if (action === 'status') {
      const isActive = antiPromoteData[chatId]?.enabled || false;
      const statusText = isActive ? '✅ *AntiPromote ACTIVÉ*' : '❌ *AntiPromote DÉSACTIVÉ*';
      return kaya.sendMessage(m.chat, { text: statusText, contextInfo }, { quoted: m });
    }

    return kaya.sendMessage(m.chat, { text: 'ℹ️ Utilisation : .antipromote on/off/status', contextInfo }, { quoted: m });
  },

  participantUpdate: async (kaya, update) => {
    try {
      const chatId = update.id;
      const participants = update.participants;
      const action = update.action;

      if (!antiPromoteData[chatId]?.enabled) return;
      if (action !== 'promote') return;

      const botId = kaya.user.id;

      for (const user of participants) {
        if (user === botId) continue;
        const key = `${chatId}-${user}-promote`;
        if (processing.has(key)) continue;
        processing.add(key);

        setTimeout(async () => {
          try {
            await kaya.groupParticipantsUpdate(chatId, [user], 'demote');
            await kaya.sendMessage(chatId, {
              text: `🚫 *AntiPromote Actif*\n@${user.split('@')[0]} rétrogradé automatiquement.`,
              mentions: [user],
              contextInfo
            });
          } catch (err) {
            console.error('❌ AntiPromote participantUpdate error:', err);
          } finally {
            processing.delete(key);
          }
        }, 1000);
      }

    } catch (err) {
      console.error('❌ participantUpdate antipromote error:', err);
    }
  }
};