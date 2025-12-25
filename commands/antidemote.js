import fs from 'fs';
import path from 'path';
import checkAdminOrOwner from '../system/checkAdmin.js';
import { contextInfo } from '../system/contextInfo.js';

const antiDemoteFile = path.join(process.cwd(), 'system/antidemote.json');
let antiDemoteData = {};
if (fs.existsSync(antiDemoteFile)) {
  try { antiDemoteData = JSON.parse(fs.readFileSync(antiDemoteFile, 'utf-8')); } 
  catch { antiDemoteData = {}; }
}

function saveAntiDemote() {
  fs.writeFileSync(antiDemoteFile, JSON.stringify(antiDemoteData, null, 2));
}

const processing = new Set();

export default {
  name: 'antidemote',
  description: '🛡️ Empêche la rétrogradation automatique des administrateurs',
  category: 'Sécurité',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, args) => {
    if (!m.isGroup) return kaya.sendMessage(m.chat, { text: '❌ Cette commande fonctionne uniquement dans un groupe.', contextInfo }, { quoted: m });

    const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
    if (!permissions.isAdmin && !permissions.isOwner) return kaya.sendMessage(m.chat, { text: '🚫 Seuls les Admins ou le Propriétaire peuvent activer/désactiver l\'anti-demote.', contextInfo }, { quoted: m });

    const chatId = m.chat;
    const action = args[0]?.toLowerCase();

    if (action === 'on') {
      antiDemoteData[chatId] = { enabled: true, timestamp: Date.now(), protectedAdmins: [] };
      try {
        const metadata = await kaya.groupMetadata(chatId);
        antiDemoteData[chatId].protectedAdmins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
        saveAntiDemote();
      } catch {}
      return kaya.sendMessage(m.chat, { text: '✅ *AntiDemote activé*', contextInfo }, { quoted: m });
    }

    if (action === 'off') {
      delete antiDemoteData[chatId];
      saveAntiDemote();
      return kaya.sendMessage(m.chat, { text: '❌ *AntiDemote désactivé*', contextInfo }, { quoted: m });
    }

    if (action === 'status') {
      const isActive = antiDemoteData[chatId]?.enabled || false;
      const protectedCount = antiDemoteData[chatId]?.protectedAdmins?.length || 0;
      const statusText = isActive ? `✅ *AntiDemote ACTIVÉ*\nAdmins protégés : ${protectedCount}` : '❌ *AntiDemote DÉSACTIVÉ*';
      return kaya.sendMessage(m.chat, { text: statusText, contextInfo }, { quoted: m });
    }

    return kaya.sendMessage(m.chat, { text: 'ℹ️ Utilisation : .antidemote on/off/status', contextInfo }, { quoted: m });
  },

  participantUpdate: async (kaya, update) => {
    try {
      const chatId = update.id;
      const participants = update.participants;
      const action = update.action;

      if (!antiDemoteData[chatId]?.enabled) return;
      if (action !== 'demote') return;

      const metadata = await kaya.groupMetadata(chatId).catch(() => null);
      if (!metadata) return;
      const botId = kaya.user.id;

      // Met à jour les admins protégés
      antiDemoteData[chatId].protectedAdmins = [
        ...new Set([...antiDemoteData[chatId].protectedAdmins || [], ...metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id)])
      ];
      saveAntiDemote();

      for (const user of participants) {
        if (user === botId) continue;
        const key = `${chatId}-${user}-demote`;
        if (processing.has(key)) continue;
        processing.add(key);

        setTimeout(async () => {
          try {
            if (antiDemoteData[chatId].protectedAdmins.includes(user)) {
              await kaya.groupParticipantsUpdate(chatId, [user], 'promote');
              await kaya.sendMessage(chatId, {
                text: `🛡️ *AntiDemote Actif*\n@${user.split('@')[0]} repromu automatiquement.`,
                mentions: [user],
                contextInfo
              });
            }
          } catch (err) {
            console.error('❌ AntiDemote participantUpdate error:', err);
          } finally {
            processing.delete(key);
          }
        }, 1500);
      }

    } catch (err) {
      console.error('❌ participantUpdate antidemote error:', err);
    }
  }
};