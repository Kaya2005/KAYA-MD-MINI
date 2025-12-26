import { exec } from "child_process";

export default {
  name: "update",
  description: "Met à jour le bot depuis GitHub",
  ownerOnly: true,

  run: async (kaya, m) => {

    
    if (!m.fromMe) return;

    try {
      await kaya.sendMessage(
        m.chat,
        { text: "🔄 Mise à jour en cours..." },
        { quoted: m }
      );

      exec("git pull && npm install", (err, stdout, stderr) => {
        if (err) {
          return kaya.sendMessage(
            m.chat,
            { text: "❌ Erreur lors de la mise à jour\n" + err.message },
            { quoted: m }
          );
        }

        kaya.sendMessage(
          m.chat,
          { text: "✅ Mise à jour terminée\n♻️ Redémarrage du bot..." },
          { quoted: m }
        );

        process.exit(0); // PM2 / Render relance automatiquement
      });

    } catch (e) {
      console.error("Update error:", e);
    }
  }
};