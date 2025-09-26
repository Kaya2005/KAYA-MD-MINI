// ================= commands/owner.js =================
import { contextInfo } from '../system/contextInfo.js';

export const name = 'owner';
export const description = '📞 Affiche le numéro du créateur du bot';
export const category = 'Info';

export async function run(kaya, m, msg, store, args) {
  try {
    const creatorNumber = '243993621718'; // Remplace par ton numéro
    await kaya.sendMessage(
      m.chat,
      {
        text: `📞 *Numéro du créateur* : wa.me/${creatorNumber}`,
        contextInfo
      },
      { quoted: m }
    );
  } catch (err) {
    console.error('❌ Erreur commande owner :', err);
    await kaya.sendMessage(
      m.chat,
      { text: '⚠️ Impossible d’envoyer le numéro.', contextInfo },
      { quoted: m }
    );
  }
}