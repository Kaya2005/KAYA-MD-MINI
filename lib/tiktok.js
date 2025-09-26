// ==================== lib/tiktok.js ====================
import axios from 'axios';

/**
 * Nettoie le texte en retirant les balises HTML et en remplaçant <br> par des sauts de ligne
 * @param {string} data 
 * @returns {string}
 */
const clean = (data) => {
  if (!data) return '';
  data = data.replace(/(<br?\s?\/?>)/gi, "\n"); // <br> -> \n
  return data.replace(/(<([^>]+)>)/gi, "");     // supprime toutes les autres balises
};

/**
 * Placeholder pour raccourcisseur d'URL
 * @param {string} url 
 * @returns {Promise<string>}
 */
async function shortener(url) {
  return url; // tu pourras brancher bitly ou tinyurl ici plus tard
}

/**
 * Récupère les liens TikTok sans filigrane
 * @param {string} query Lien ou recherche TikTok
 * @returns {Promise<object>}
 */
export async function Tiktok(query) {
  try {
    const response = await axios("https://lovetik.com/api/ajax/search", {
      method: "POST",
      data: new URLSearchParams({ query }),
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });

    const data = response.data || {};

    const result = {
      creator: "KAYA",
      title: clean(data.desc || ""),
      author: clean(data.author || ""),
      nowm: data.links?.[0]?.a ? await shortener(data.links[0].a.replace("https", "http")) : null,
      watermark: data.links?.[1]?.a ? await shortener(data.links[1].a.replace("https", "http")) : null,
      audio: data.links?.[2]?.a ? await shortener(data.links[2].a.replace("https", "http")) : null,
      thumbnail: data.cover ? await shortener(data.cover) : null,
    };

    return result;
  } catch (err) {
    console.error("Erreur dans Tiktok():", err.message);
    return {
      creator: "KAYA",
      title: "",
      author: "",
      nowm: null,
      watermark: null,
      audio: null,
      thumbnail: null,
    };
  }
}