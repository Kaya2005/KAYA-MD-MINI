// ==================== checkAdminOrOwner.js ====================
import decodeJid from './decodeJid.js';
import config from '../config.js';

export default async function checkAdminOrOwner(Kaya, chatId, sender) {
  const isGroup = chatId.endsWith('@g.us');

  // ⚡ Vérifie si l'expéditeur est Owner du bot
  const ownerNumbers = config.OWNER_NUMBER.split(',')
    .map(o => o.trim().replace(/\D/g, ''));
  const senderNumber = decodeJid(sender).split('@')[0].replace(/\D/g, '');
  const isBotOwner = ownerNumbers.includes(senderNumber);

  // Hors groupe → seul le bot owner compte
  if (!isGroup) {
    return {
      isAdmin: false,
      isOwner: isBotOwner,
      isAdminOrOwner: isBotOwner,
      participant: null
    };
  }

  // Récupère les metadata du groupe
  let metadata;
  try {
    metadata = await Kaya.groupMetadata(chatId);
  } catch (err) {
    console.error('❌ Impossible de récupérer groupMetadata:', err);
    return {
      isAdmin: false,
      isOwner: isBotOwner,
      isAdminOrOwner: isBotOwner,
      participant: null
    };
  }

  // Cherche le participant correspondant au sender
  const participant = metadata.participants.find(
    p => decodeJid(p.id) === decodeJid(sender)
  );

  const isAdmin = participant?.isAdmin || participant?.isSuperAdmin || false;

  // Vérifie si créateur du groupe
  const isGroupOwner = metadata.owner && decodeJid(metadata.owner) === decodeJid(sender);

  const isOwnerUser = isBotOwner || isGroupOwner;

  return {
    isAdmin,
    isOwner: isOwnerUser,
    isAdminOrOwner: isAdmin || isOwnerUser,
    participant
  };
}