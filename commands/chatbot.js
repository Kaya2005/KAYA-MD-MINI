import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, '../data/chatbot.json');

function normalize(number) {
  return number.split('@')[0].replace(/\D/g, '').trim();
}

export default {
  name: 'chatbot',
  description: 'Active ou désactive le mode ChatBot pour tout le monde (inbox + groupes)',
  category: 'IA',

  async execute(Kaya, m, args) {
    try {
      const sender = normalize(m.sender);
      const owners = config.OWNER_NUMBER.split(',').map(normalize);

      if (!owners.includes(sender)) {
        const chatId = m.chat || m.key.remoteJid || m.from;
        return Kaya.sendMessage(
          chatId,
          { text: '❌ Seul le propriétaire peut activer ou désactiver le mode ChatBot global.' },
          { quoted: m }
        );
      }

      // ✅ Charge ou crée le fichier chatbot.json
      const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : { global: false };
      const action = (args[0] || '').toLowerCase();
      let response;

      switch (action) {
        case 'on':
          db.global = true;
          response = '✅ Le mode *ChatBot* est maintenant activé pour tout le monde.';
          break;
        case 'off':
          db.global = false;
          response = '🚫 Le mode *ChatBot* est maintenant désactivé pour tout le monde.';
          break;
        default:
          response = '❌ Utilisation incorrecte.\nExemples :\n.chatbot on\n.chatbot off';
          break;
      }

      
      fs.writeFileSync(file, JSON.stringify(db, null, 2));

      
      const chatId = m.chat || m.key.remoteJid || m.from;
      await Kaya.sendMessage(chatId, { text: response }, { quoted: m });

    } catch (err) {
      console.error('❌ Erreur chatbot.js :', err);
      const chatId = m.chat || m.key.remoteJid || m.from;
      await Kaya.sendMessage(chatId, { text: '⚠️ Une erreur est survenue lors de l’exécution du ChatBot.' }, { quoted: m });
    }
  }
};