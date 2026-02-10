import { KNOWLEDGE_BASE } from "./constants";

// Stopwords to ignore during search
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
  'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'without', 'before', 'under', 'around', 'among', 'it', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'we', 'you', 'your', 'he', 'she',
  'they', 'them', 'what', 'which', 'who', 'whom', 'how', 'when', 'where',
  'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'then',
  'want', 'need', 'get', 'got', 'tell', 'show', 'give', 'know', 'think',
  'help', 'please', 'thanks', 'thank', 'hi', 'hello', 'hey',
]);

// Synonyms and related terms for better matching
const SYNONYMS: Record<string, string[]> = {
  coffee: ['buna', 'jebena', 'yirgacheffe', 'harar', 'ceremony', 'beans', 'brew'],
  spice: ['berbere', 'mitmita', 'shiro', 'seasoning', 'spices'],
  food: ['injera', 'teff', 'honey', 'cook', 'recipe', 'eat', 'meal', 'dish', 'stew', 'wot'],
  cook: ['recipe', 'make', 'prepare', 'cooking', 'tips'],
  kitchenware: ['jebena', 'mitad', 'mesob', 'pot', 'basket', 'griddle', 'kitchen'],
  artifact: ['cross', 'jewelry', 'drum', 'art', 'decoration', 'coptic', 'artifacts'],
  culture: ['tradition', 'holiday', 'ceremony', 'ethiopian', 'cultural', 'history', 'heritage'],
  delivery: ['shipping', 'ship', 'deliver', 'pickup', 'pick'],
  price: ['cost', 'how much', 'expensive', 'cheap', 'affordable', 'dollar'],
  return: ['refund', 'exchange', 'returns'],
  hours: ['open', 'close', 'time', 'schedule', 'when'],
  location: ['address', 'where', 'directions', 'find', 'located', 'store'],
  bundle: ['set', 'combo', 'package', 'starter', 'complete'],
};

export const searchKnowledge = async (query: string): Promise<string> => {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));

  // Expand keywords with synonyms
  const expandedKeywords = new Set(words);
  for (const word of words) {
    // Check if the word matches any synonym group
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (key === word || syns.includes(word)) {
        expandedKeywords.add(key);
        syns.forEach(s => expandedKeywords.add(s));
      }
    }
  }

  const keywords = Array.from(expandedKeywords);
  if (keywords.length === 0) return "";

  // Score each knowledge item based on keyword matches
  const scored = KNOWLEDGE_BASE.map(item => {
    const contentLower = item.content.toLowerCase();
    const titleLower = item.title.toLowerCase();
    let score = 0;

    for (const kw of keywords) {
      // Title matches are worth more
      if (titleLower.includes(kw)) score += 3;
      // Content matches
      const contentMatches = (contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += contentMatches;
    }

    // Bonus for phrase match (entire query substring)
    if (contentLower.includes(queryLower) || titleLower.includes(queryLower)) {
      score += 5;
    }

    return { item, score };
  });

  // Return top matches sorted by relevance
  const matches = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (matches.length === 0) return "";

  return matches.map(m => `${m.item.title}: ${m.item.content}`).join('\n\n');
};
