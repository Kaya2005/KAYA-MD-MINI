import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'vv',
    alias: ['viewonce', 'unview', 'voir', 'photo'],
    description: 'Re-envoie une photo (vue unique ou normale) - UNE SEULE FOIS',
    category: 'utils',
    usage: '<répondre à une photo>',
    async execute(sock, m, args) {
        try {
            // Récupérer le message cité
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            // Fonction pour trouver UNE SEULE image (la première trouvée)
            const findSingleImage = () => {
                // 1. D'abord chercher dans le message cité (priorité)
                if (quoted) {
                    // Vue unique
                    if (quoted.viewOnceMessage?.message?.imageMessage) {
                        return {
                            image: quoted.viewOnceMessage.message.imageMessage,
                            type: 'viewonce'
                        };
                    }
                    if (quoted.viewOnceMessageV2?.message?.imageMessage) {
                        return {
                            image: quoted.viewOnceMessageV2.message.imageMessage,
                            type: 'viewonce'
                        };
                    }
                    if (quoted.viewOnceMessageV2Extension?.message?.imageMessage) {
                        return {
                            image: quoted.viewOnceMessageV2Extension.message.imageMessage,
                            type: 'viewonce'
                        };
                    }
                    // Photo normale
                    if (quoted.imageMessage) {
                        return {
                            image: quoted.imageMessage,
                            type: 'normal'
                        };
                    }
                }
                
                // 2. Ensuite chercher dans le message courant (si pas cité)
                if (m.message?.imageMessage) {
                    return {
                        image: m.message.imageMessage,
                        type: 'normal'
                    };
                }
                
                return null;
            };

            // Trouver UNE SEULE image
            const imageData = findSingleImage();
            
            if (!imageData) {
                return sock.sendMessage(m.chat, {
                    text: '⚠️ *Usage:* Réponds à une photo avec `.vv`\n\n*Exemples:*\n• .vv (en réponse à une photo)\n• .photo (alias)'
                }, { quoted: m });
            }

            // Indiquer que le bot traite l'image (UNE SEULE FOIS)
            await sock.sendPresenceUpdate('composing', m.chat);

            // Télécharger l'image (UNE SEULE FOIS)
            const stream = await downloadContentFromMessage(imageData.image, 'image');
            
            // Convertir stream en Buffer (UNE SEULE FOIS)
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            if (!buffer || buffer.length < 100) {
                return sock.sendMessage(m.chat, {
                    text: '❌ Impossible de lire cette photo.'
                }, { quoted: m });
            }

            // Préparer le caption (UNE FOIS)
            const caption = imageData.image.caption || 
                          (imageData.type === 'viewonce' ? '✅ Photo vue unique renvoyée' : '✅ Photo renvoyée');
            
            const mimetype = imageData.image.mimetype || 'image/jpeg';

            // 🔹 ENVOYER LA PHOTO UNE SEULE FOIS
            await sock.sendMessage(m.chat, {
                image: buffer,
                caption: caption,
                mimetype: mimetype
            }, { quoted: m });

            // C'EST TOUT ! Pas d'autre envoi

        } catch (error) {
            console.error('❌ Erreur commande vv:', error);
            
            let errorMessage = '❌ Erreur lors du traitement de la photo.';
            
            if (error.message.includes('download')) {
                errorMessage = '❌ Impossible de télécharger la photo.';
            }
            
            sock.sendMessage(m.chat, {
                text: errorMessage
            }, { quoted: m });
        }
    }
};