// system/globals.js
import config from '../config.js';

global.owner = config.OWNER_NUMBER
  .split(',')
  .map(n => n.replace(/\D/g, '') + '@s.whatsapp.net');

if (!global.bannedUsers) global.bannedUsers = new Set();
if (global.blockInbox === undefined) global.blockInbox = config.blockInbox ?? false;
if (global.privateMode === undefined) global.privateMode = false;
if (!global.botModes) global.botModes = {};
if (!global.botModes.autoreact) global.botModes.autoreact = { enabled: false };
if (!global.autoStatus === undefined) global.autoStatus = false;
if (global.allPrefix === undefined) global.allPrefix = false;
if (!global.antiLinkGroups) global.antiLinkGroups = {};
if (!global.antiSpamGroups) global.antiSpamGroups = {};