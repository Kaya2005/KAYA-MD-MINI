// ==================== lib/tts.js ====================
import querystring from 'querystring';

/**
 * Génère l’URL Google TTS pour un texte donné
 * @param {string} text Le texte à convertir en audio
 * @param {object} options
 * @param {string} options.lang Langue du TTS (par défaut 'fr')
 * @param {boolean} options.slow Vitesse lente si true
 * @param {string} options.host Hôte Google TTS (par défaut 'https://translate.google.com')
 * @returns {string} URL audio
 */
export function getAudioUrl(text, options = {}) {
  const { lang = 'fr', slow = false, host = 'https://translate.google.com' } = options;

  const query = querystring.stringify({
    ie: 'UTF-8',
    q: text,
    tl: lang,
    client: 'tw-ob',
    ttsspeed: slow ? 0.24 : 1,
  });

  return `${host}/translate_tts?${query}`;
}