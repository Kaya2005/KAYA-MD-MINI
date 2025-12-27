// ==================== commands/help.js ====================
import fs from 'fs';
import path from 'path';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'help',
  description: '📜 Affiche la liste des commandes ou la description d\'une commande spécifique',
  category: 'Bot',

  run: async (kaya, m, args) => {
    try {
      const commandsPath = path.join(new URL('.', import.meta.url).pathname, '../commands');
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

      // Charger toutes les commandes
      const commandsList = await Promise.all(
        commandFiles.map(async (file) => {
          const commandModule = await import(path.join(commandsPath, file));
          const command = commandModule.default ?? commandModule;
          return {
            name: command.name || 'inconnu',
            description: command.description || 'Pas de description disponible.',
            category: command.category || 'Divers'
          };
        })
      );

      // ---------------- Affichage général ----------------
      if (!args.length) {
        let text = `📜 *Liste des commandes disponibles* 📜\n\n`;

        // Grouper par catégorie
        const categories = [...new Set(commandsList.map(c => c.category))];
        for (const cat of categories) {
          text += `*🔹 ${cat}*\n`;
          commandsList.filter(c => c.category === cat).forEach(cmd => {
            text += `  - ${cmd.name}\n`;
          });
          text += '\n';
        }

        text += `Pour voir la description d'une commande, tape :\n* .help <commande> *\n\n_⚡ Merci d'utiliser KAYA-MD !_`;

        return kaya.sendMessage(m.chat, { text: text.trim(), contextInfo }, { quoted: m });
      }

      // ---------------- Affichage commande spécifique ----------------
      const cmdName = args[0].toLowerCase();
      const cmd = commandsList.find(c => c.name === cmdName);

      if (!cmd) {
        return kaya.sendMessage(
          m.chat,
          { text: `❌ La commande *${cmdName}* est introuvable.`, contextInfo },
          { quoted: m }
        );
      }

      const text = `📄 *${cmd.name.toUpperCase()}*\n\n` +
                   `🔹 Description :\n${cmd.description}\n` +
                   `🔹 Catégorie : ${cmd.category}\n\n` +
                   `_⚡ Merci d'utiliser KAYA-MD !_`;

      return kaya.sendMessage(m.chat, { text, contextInfo }, { quoted: m });

    } catch (err) {
      console.error('❌ Erreur help.js :', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue lors de l\'exécution de la commande help.', contextInfo },
        { quoted: m }
      );
    }
  }
};