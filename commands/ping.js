// ================= commands/ping.js =================
import { contextInfo } from '../system/contextInfo.js'; // import centralisé

export const name = 'ping';
export const description = '🏓 Vérifie la latence et le statut du bot';
export const category = 'Info';

export async function run(kaya, m) {
  try {
    const start = Date.now();

    // Message temporaire
    await kaya.sendMessage(
      m.chat,
      { text: '⏳ Calcul de la latence...' },
      { quoted: m }
    );

    const end = Date.now();
    const latency = end - start;

    const response = `
╭───〔 🏓 PONG 〕───╮
│ ✅ Statut : *KAYA-MD* actif et prêt !
│ ⏱️ Latence : *${latency} ms*
│ ⚡ Performance : *Ultra rapide* ⚡
╰───────────────────╯
    `.trim();

    await kaya.sendMessage(
      m.chat,
      {
        text: response,
        contextInfo: { ...contextInfo, mentionedJid: [m.sender] }
      },
      { quoted: m }
    );
  } catch (err) {
    console.error('❌ Erreur ping.js :', err);
    await kaya.sendMessage(
      m.chat,
      { text: '⚠️ Impossible de calculer la latence.', contextInfo },
      { quoted: m }
    );
  }
}