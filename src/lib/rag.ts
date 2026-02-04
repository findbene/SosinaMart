import { KNOWLEDGE_BASE } from "./constants";

export const searchKnowledge = async (query: string): Promise<string> => {
  const keywords = query.toLowerCase().split(' ');
  const matches = KNOWLEDGE_BASE.filter(item =>
    keywords.some(kw =>
      item.content.toLowerCase().includes(kw) ||
      item.title.toLowerCase().includes(kw)
    )
  );

  if (matches.length === 0) return "";

  return matches.map(m => `${m.title}: ${m.content}`).join('\n\n');
};
