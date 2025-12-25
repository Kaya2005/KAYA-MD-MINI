import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'menu',
  description: 'Affiche le menu complet du bot',
  async execute(Kaya, m, args) {
    const now = new Date();
    const time = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalCmds = 43; // à rendre dynamique si nécessaire

    const menuText = `
    𓊈 *𝐊𝐀𝐘𝐀-𝐌𝐈𝐍𝐈 𝐁𝐎𝐓* 𓊉
┏━━━━━━━━━━━━━━━━━━━
┃ 🕒 *Heure* : ${time}
┃ 🧾 *Cmds*  : ${totalCmds}
┗━━━━━━━━━━━━━━━━━━━

『 *\`GROUP 𝐌𝐄𝐍𝐔\`* 』
┏━━━━━━━━━━━━━━━━━━━
┃ ◈ .tagall
┃ ◈ .tag
┃ ◈ .lock
┃ ◈ .unlock
┃ ◈ .link
┃ ◈ .resetlink
┃ ◈ .antilink on/off
┃ ◈ .antispam on/off
┃ ◈ .antitag on/off
┃ ◈ .groupinfo
┃ ◈ .promote
┃ ◈ .revoque
┃ ◈ .kick
┃ ◈ .add
┃ ◈ .purge
┃ ◈ .welcome on/off
┃ ◈ .bye on/off
┗━━━━━━━━━━━━━━━━━━━

『 *\`OWNER 𝐌𝐄𝐍𝐔\`* 』
┏━━━━━━━━━━━━━━━━━━━
┃ ◈ .owner
┃ ◈ .block
┃ ◈ .unblock
┃ ◈ .ban
┃ ◈ .unban
┃ ◈ .sudo
┃ ◈ .unsudo
┃ ◈ .prefix
┃ ◈ .allprefix
┃ ◈ .typing
┃ ◈ .recording on/off
┃ ◈ .autostatus
┃ ◈ .autoread on/off
┃ ◈ .blockinbox on/off
┃ ◈ .clear
┗━━━━━━━━━━━━━━━━━━━

『 *\`BOTMODE\`* 』
┏━━━━━━━━━━━━━━━━━━━
┃ ◈ .private on
┃ ◈ .private off
┗━━━━━━━━━━━━━━━━━━━

『 *\`STICKER\`* 』
┏━━━━━━━━━━━━━━━━━━━
┃ ◈ .sticker
┃ ◈ .take
┃ ◈ .photo
┃ ◈ .tg ( sticker telegram)
┃ ◈ .emojimix 😃+🤪
┗━━━━━━━━━━━━━━━━━━━

『 *\`DOWNLOAD\`* 』
┏━━━━━━━━━━━━━━━━━━━
┃ ◈ .tiktok
┃ ◈ .song
┃ ◈ .play
┃ ◈ .video
┃ ◈ .fb
┃ ◈ .insta
┗━━━━━━━━━━━━━━━━━━━

『 *\`DIVERS\`* 』
┏━━━━━━━━━━━━━━━━━━━
┃ ◈ .traduc
┃ ◈ .help
┗━━━━━━━━━━━━━━━━━━━

*➤ Ne cours pas après l’argent, construis ce qui l’attire*
`;
    try {
      await Kaya.sendMessage(
        m.key.remoteJid,
        {
          image: { url: 'https://files.catbox.moe/981fr6.jpg' },
          caption: menuText,
          contextInfo,
        },
        { quoted: m }
      );
    } catch (err) {
      console.error('❌ Impossible d’envoyer le menu :', err);
    }
  },
};