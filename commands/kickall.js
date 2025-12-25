import checkAdminOrOwner from "../system/checkAdmin.js";

export default {
  name: "purge",
  description: "Expulse tous les membres non-admin silencieusement",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, msg, store, args) => {
    try {
      if (!m.isGroup) return;

      // ✅ Vérifie si la personne qui lance est admin/owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) return;

      // ✅ Récupère metadata du groupe
      const groupMetadata = await kaya.groupMetadata(m.chat);
      const botNumber = await kaya.decodeJid(kaya.user.id);

      // ✅ Liste des membres à expulser (non admins et non bot)
      const toKick = groupMetadata.participants
        .filter(p => !p.admin && p.id !== botNumber)
        .map(p => p.id);

      if (!toKick.length) return;

      // ✅ Expulsion silencieuse
      for (const user of toKick) {
        await kaya.groupParticipantsUpdate(m.chat, [user], "remove");
        await new Promise(r => setTimeout(r, 1000)); // pause pour éviter spam serveur
      }

      // ❌ Aucun message envoyé au groupe
      return;

    } catch (err) {
      console.error("❌ Erreur kickall :", err);
      return;
    }
  }
};