// ==================== lib/antitag.js ====================
import fs from 'fs';
import path from 'path';

const filePath = path.join('./lib', 'antitagData.json');

let antitagData = {};
if (fs.existsSync(filePath)) {
  antitagData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveData() {
  fs.writeFileSync(filePath, JSON.stringify(antitagData, null, 2));
}

export async function setAntitag(chatId, enabled = true, action = 'delete') {
  antitagData[chatId] = { enabled, action };
  saveData();
}

export async function getAntitag(chatId) {
  return antitagData[chatId] || { enabled: false, action: 'delete' };
}

export async function removeAntitag(chatId) {
  delete antitagData[chatId];
  saveData();
}