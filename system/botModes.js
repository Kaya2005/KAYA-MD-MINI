import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const botModesPath = path.join(dataDir, 'botModes.json');

// Charger les modes depuis le fichier
export function loadBotModes() {
  if (!fs.existsSync(botModesPath)) {
    fs.writeFileSync(botModesPath, JSON.stringify({ typing: false, recording: false }, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(botModesPath, 'utf-8'));
  global.botModes = { ...global.botModes, ...data };
  return global.botModes;
}

// Sauvegarder les modes
export function saveBotModes(modes) {
  global.botModes = { ...global.botModes, ...modes };
  fs.writeFileSync(botModesPath, JSON.stringify(global.botModes, null, 2));
  console.log('✅ botModes sauvegardé');
}