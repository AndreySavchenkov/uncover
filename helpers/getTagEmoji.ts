// Эмодзи для известных тегов
const emojiByTag: Record<string, string> = {
  couples_meet: "👫👫",
  planning: "🗓️",
  comfort: "🛋️",
  boundaries: "🚦",
  dating: "💞",
  leisure: "🎲",
  food: "🍽️",
  drinks: "🥤",
  safety: "🛡️",
  communication: "💬",
  privacy: "🔒",
  music: "🎵",
  games: "🎮",
  places: "📍",
  romance: "🌹",
  values: "✨",
  logistics: "🧭",
  weather: "⛅",
  energy: "⚡",
  conversation: "🗣️",
};

export const getTagEmoji = (tag: string) => {
  return emojiByTag[tag] || "🏷️";
}