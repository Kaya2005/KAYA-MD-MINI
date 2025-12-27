import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export default {
    name: 'photo',
    alias: ['p', 'image', 'topng'],
    description: 'Convertir un sticker en photo PNG',
    category: 'media',
    usage: '<répondre à un sticker>',
    async execute(sock, m, args) {
        try {
            // Récupérer le message cité
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuotedSticker = quoted?.stickerMessage;
            const isSticker = m.message?.stickerMessage;
            
            if (!isQuotedSticker && !isSticker) {
                return sock.sendMessage(m.chat, {
                    text: '⚠️ *Usage:* Réponds à un sticker avec `.photo`\n\n*Exemples:*\n• .photo (en réponse à un sticker)\n• .p (alias)'
                }, { quoted: m });
            }

            // Indiquer que le bot traite le sticker
            await sock.sendPresenceUpdate('composing', m.chat);

            // Fonction pour convertir stream en Buffer
            const streamToBuffer = async (stream) => {
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                return Buffer.concat(chunks);
            };

            // Télécharger le sticker
            let buffer;
            
            if (isQuotedSticker) {
                const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
                buffer = await streamToBuffer(stream);
            } else {
                const stream = await downloadContentFromMessage(m.message.stickerMessage, 'sticker');
                buffer = await streamToBuffer(stream);
            }

            // Vérifier le buffer
            if (!buffer || buffer.length < 100) {
                return sock.sendMessage(m.chat, {
                    text: '❌ Impossible de lire ce sticker (fichier trop petit ou corrompu)'
                }, { quoted: m });
            }

            // Convertir WebP en PNG avec Sharp
            const pngBuffer = await sharp(buffer)
                .png()
                .toBuffer();

            // Chemin temporaire pour le fichier (optionnel, pour debug)
            const tempPath = path.join(os.tmpdir(), `sticker_${Date.now()}.png`);
            await fs.writeFile(tempPath, pngBuffer);

            // Envoyer l'image
            await sock.sendMessage(m.chat, {
                image: pngBuffer,
                caption: '✅ Sticker converti en image PNG',
                mimetype: 'image/png'
            }, { quoted: m });

            // Nettoyer le fichier temporaire
            await fs.unlink(tempPath);

        } catch (error) {
            console.error('❌ Erreur commande photo:', error);
            
            let errorMessage = '❌ Une erreur est survenue lors de la conversion.';
            
            if (error.message.includes('unsupported image format')) {
                errorMessage = '❌ Format d\'image non supporté. Assure-toi que c\'est un sticker WebP valide.';
            } else if (error.message.includes('input buffer contains unsupported image format')) {
                errorMessage = '❌ Le sticker semble corrompu ou dans un format non supporté.';
            }
            
            sock.sendMessage(m.chat, {
                text: errorMessage
            }, { quoted: m });
        }
    }
};