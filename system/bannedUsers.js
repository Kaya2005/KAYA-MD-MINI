import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/bannedUsers.json");

// Crée le fichier si inexistant
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));

// Charge les bans en mémoire
export function loadBannedUsers() {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    global.bannedUsers = new Set(data.map(u => u.toLowerCase()));
  } catch {
    global.bannedUsers = new Set();
  }
}

// Sauvegarde les bans
export function saveBannedUsers() {
  fs.writeFileSync(filePath, JSON.stringify([...global.bannedUsers], null, 2));
}