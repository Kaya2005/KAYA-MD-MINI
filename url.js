import axios from 'axios';
import FormData from 'form-data';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Readable } from 'stream';

export default {
    name: 'url',
    alias: ['catbox', 'upload', 'lien'],
    description: '🔗 Génère un lien Catbox à partir d\'une image',
    category: 'media',
    usage: '<répondre à une image>',
    async execute(sock, m, args) {
        try {
            // Vérifier le message cité
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuotedImage = quoted?.imageMessage;
            const isImage = m.message?.imageMessage;
            
            if (!isQuotedImage && !isImage) {
                return sock.sendMessage(m.chat, {
                    text: '📸 *Usage:* Réponds à une image pour générer un lien Catbox\n\n*Exemples:*\n• .url (en réponse à une image)\n• .catbox (alias)'
                }, { quoted: m });
            }

            // Indiquer que le bot traite l'image
            await sock.sendPresenceUpdate('composing', m.chat);

            // Fonction pour convertir stream en Buffer
            const streamToBuffer = async (stream) => {
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                return Buffer.concat(chunks);
            };

            // Télécharger l'image
            let buffer;
            let imageMessage;
            
            if (isQuotedImage) {
                imageMessage = quoted.imageMessage;
                const stream = await downloadContentFromMessage(imageMessage, 'image');
                buffer = await streamToBuffer(stream);
            } else {
                imageMessage = m.message.imageMessage;
                const stream = await downloadContentFromMessage(imageMessage, 'image');
                buffer = await streamToBuffer(stream);
            }

            // Vérifier le buffer
            if (!buffer || buffer.length < 100) {
                return sock.sendMessage(m.chat, {
                    text: '❌ Impossible de lire cette image (fichier trop petit ou corrompu)'
                }, { quoted: m });
            }

            // Vérifier le mimetype
            const mimeType = imageMessage?.mimetype || 'image/jpeg';
            
            // Déterminer l'extension du fichier
            let extension = 'jpg';
            if (mimeType.includes('png')) extension = 'png';
            if (mimeType.includes('webp')) extension = 'webp';
            if (mimeType.includes('gif')) extension = 'gif';

            // Créer le FormData pour l'upload
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', Readable.from(buffer), `image.${extension}`);

            // Uploader sur Catbox
            const response = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(),
                timeout: 30000 // 30 secondes timeout
            });

            const url = response.data.trim();

            // Message formaté (ENVOYÉ UNE SEULE FOIS)
            const message = `
╭────「 𝗞𝗔𝗬𝗔-𝗠𝗗 」────⬣
│ 📤 *Lien généré avecsuccès!*
│ 🔗 *Lien Catbox :*
│ ${url}
╰──────────────────⬣`.trim();

            // Envoyer le résultat UNE SEULE FOIS
            await sock.sendMessage(m.chat, {
                text: message
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Erreur commande url:', error);
            
            let errorMessage = '❌ Erreur lors de la génération du lien.';
            
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                errorMessage = '❌ Catbox est inaccessible ou trop lent. Réessaie plus tard.';
            } else if (error.response?.status === 413) {
                errorMessage = '❌ L\'image est trop volumineuse (>20MB).';
            } else if (error.message.includes('unsupported image')) {
                errorMessage = '❌ Format d\'image non supporté par Catbox.';
            }
            
            sock.sendMessage(m.chat, {
                text: errorMessage
            }, { quoted: m });
        }
    }
};