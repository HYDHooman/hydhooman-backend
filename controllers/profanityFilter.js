const bannedWords = ["murder", "kill", "rape", "terrorist"];
const allowedWords = ["sex", "weed"];

function filterBadWords(message) {
  const lower = message.toLowerCase();
  return bannedWords.some(word => lower.includes(word) && !allowedWords.includes(word));
}

module.exports = filterBadWords;
