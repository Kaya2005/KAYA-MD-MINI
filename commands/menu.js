import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'menu',
  description: 'Affiche le menu complet du bot',
  async execute(Kaya, m, args) {
    
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const totalCmds = 23;

    const menuText = `
╭────KAYA-MD MINI───╮
│ 🕒 *Heure* : ${time}
│ 📂 *Commandes* : ${totalCmds}
│
│ 🔹 1. Groupe menu
│    ├ .tagall
│    ├ .tag
│    ├ .lock
│    ├ .unlock
│    ├ .link
│    ├ .antilink on/off
│    ├ .antispam on/off
│    ├ .promote
│    ├ .revoque
│    ├ .purge
│    ├ .kick
│    ├ .add
│    ├ .welcome on
│    └ .bye on
│
│ 🔹 2. Owner menu
│    ├ .owner
│    ├ .prefix
│    ├ .sudo
│    └ .unsudo
│
│ 🔹 3. Stickers menu
│    ├ .sticker
         .photo 
│    └ .take
│
│ 🔹 4. Téléchargements menu
│    └ .tiktok
│
╰──────────────────╯
    `;

    try {
      await Kaya.sendMessage(
        m.key.remoteJid,
        {
          image: { url: 'https://files.catbox.moe/u7ojuw.jpg' },
          caption: menuText,
          contextInfo
        },
        { quoted: m }
      );
    } catch (err) {
      console.error('❌ Impossible d’envoyer le menu :', err);
    }
  }
};