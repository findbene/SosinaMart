import { KnowledgeItem, Language } from '@/types/chat';
import { PRODUCTS, STORE_INFO } from '@/lib/data';

export const STORE_NAME = "Sosina Mart";
export const STORE_LOCATION = "Tucker, Georgia";

export const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.ENGLISH]: 'English',
  [Language.AMHARIC]: 'አማርኛ (Amharic)',
  [Language.TIGRIGNA]: 'ትግርኛ (Tigrigna)',
  [Language.SPANISH]: 'Español (Spanish)'
};

// Build knowledge base from actual products
const buildProductKnowledge = (): string => {
  const food = PRODUCTS.filter(p => p.category === 'food');
  const kitchenware = PRODUCTS.filter(p => p.category === 'kitchenware');
  const artifacts = PRODUCTS.filter(p => p.category === 'artifacts');

  let content = 'FOOD & COFFEE:\n';
  food.forEach(p => {
    content += `- ${p.name}: $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  content += '\nKITCHENWARE:\n';
  kitchenware.forEach(p => {
    content += `- ${p.name}: $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  content += '\nARTIFACTS & ACCESSORIES:\n';
  artifacts.forEach(p => {
    content += `- ${p.name}: $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  return content;
};

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: '1',
    category: 'store_info',
    title: 'Store Location & Hours',
    content: `${STORE_INFO.name} is located at ${STORE_INFO.address}. Contact: ${STORE_INFO.phone} or ${STORE_INFO.email}. We are open Monday through Saturday from 9:00 AM to 8:00 PM, and Sunday from 10:00 AM to 6:00 PM.`
  },
  {
    id: '2',
    category: 'products',
    title: 'Product Catalog',
    content: buildProductKnowledge()
  },
  {
    id: '3',
    category: 'shipping',
    title: 'Pickup & Delivery',
    content: 'Customers can pick up their orders directly from our store in Tucker, GA. We also offer local delivery for orders over $50 within a 15-mile radius. Shipping available throughout the United States.'
  },
  {
    id: '4',
    category: 'products',
    title: 'Ethiopian Coffee Ceremony',
    content: 'The Ethiopian coffee ceremony (Buna) is a traditional ritual central to Ethiopian hospitality. It involves roasting green coffee beans, grinding them by hand with a mortar (mukecha), and brewing in a traditional clay pot called a Jebena. The ceremony is performed three times — Abol, Tona, and Bereka — each brew becoming lighter. We sell Jebena coffee pots ($49.99), Coffee Cup Sets ($34.99), Complete Coffee Ceremony Sets ($149.99), and premium coffee beans including Yirgacheffe ($18.99) and Harar ($17.99). Pair with popcorn or kolo (roasted barley) for an authentic experience.'
  },
  {
    id: '5',
    category: 'products',
    title: 'Ethiopian Spices',
    content: 'Our signature spices: Berbere Spice Blend ($12.99) - the essential red spice mix for Doro Wot, Siga Wot, and most Ethiopian stews. Made from chili peppers, fenugreek, garlic, ginger, and over 15 spices. Mitmita Spice ($10.99) - a fiery chili powder great with kitfo (raw beef) and tibs. Shiro Powder ($8.99) - ground chickpea flour seasoned with spices, perfect for a quick, delicious vegan stew served on injera.'
  },
  {
    id: '6',
    category: 'returns',
    title: 'Returns Policy',
    content: 'We accept returns within 30 days of purchase for unopened items. Food items cannot be returned once opened for health and safety reasons. Please keep your receipt for all returns.'
  },
  {
    id: '7',
    category: 'culture',
    title: 'Ethiopian Cooking Tips & Pairings',
    content: 'POPULAR RECIPES: Doro Wot (chicken stew) needs Berbere, onions, niter kibbeh (spiced butter), and hard-boiled eggs. Misir Wot (red lentil stew) is vegan and uses Berbere and onions. Shiro Wot is the quickest Ethiopian stew — just Shiro Powder, water, and oil. PAIRINGS: Injera + any wot. Coffee + popcorn or kolo. Berbere + niter kibbeh for authentic flavor. BUNDLES: Coffee ceremony set + Yirgacheffe beans + Coffee cups for a complete ceremony. Spice trio (Berbere + Mitmita + Shiro) for a full Ethiopian kitchen starter.'
  },
  {
    id: '8',
    category: 'culture',
    title: 'Ethiopian Cultural Knowledge',
    content: 'HOLIDAYS: Ethiopian New Year (Enkutatash) is September 11. Timkat (Epiphany) in January features water blessings. Meskel in September celebrates the finding of the True Cross. Fasika (Easter) follows the Ethiopian Orthodox calendar. TRADITIONS: Gursha — feeding someone by hand as a sign of love and respect. Coffee ceremony — a social ritual that can last 1-2 hours. Injera — the spongy flatbread is both plate and utensil. GREETINGS: "Selam" (peace), "Dehna neh?" (How are you?), "Egziabher yistilign" (God willing).'
  },
  {
    id: '9',
    category: 'store_info',
    title: 'About Sosina Mart',
    content: 'Sosina Mart was founded to bring the authentic taste and culture of Ethiopia to the Atlanta community. We source our products directly from Ethiopia and local Ethiopian producers to ensure the highest quality. Whether you are Ethiopian missing the taste of home, or someone curious about Ethiopian cuisine and culture, we welcome you with open arms. Our mission is to share the richness of Ethiopian heritage through food, art, and community.'
  }
];

export const SYSTEM_PROMPT = `
You are Sosina, the shopping assistant for Sosina Mart — an Ethiopian grocery and cultural store in Tucker, Georgia.
Location: ${STORE_INFO.address}
Phone: ${STORE_INFO.phone}
Email: ${STORE_INFO.email}
Hours: Monday-Saturday 9:00 AM - 8:00 PM, Sunday 10:00 AM - 6:00 PM

YOUR PERSONALITY:
- You are polite, kind, patient, and knowledgeable
- You speak naturally, like a helpful and courteous store associate
- You may use a few Ethiopian greetings like "Selam" (hello) where appropriate, but keep it natural — do not overdo it
- You are genuinely helpful without being pushy or overly enthusiastic
- You listen carefully and respond to what the customer actually needs

CRITICAL RULE — CART OPERATIONS:
When a customer asks you to add an item to their cart, or says they want to buy something, you MUST use the 'add_to_cart' function call. Do NOT just describe the product — actually call the function to add it.
When a customer says they are ready to check out, pay, or complete their order, you MUST use the 'start_checkout' function call.
These function calls are how items actually get added to the cart. If you only describe the product without calling the function, the customer's cart stays empty.

CORE CAPABILITIES:
1. SHOPPING HELP: Help customers find products. When they express interest, offer to add items to their cart. Mention prices. Suggest complementary items when natural.
2. CART MANAGEMENT: Use 'add_to_cart' function to add items. Use 'start_checkout' function when they want to pay. Always confirm what you added.
3. STORE INFORMATION: Answer questions about hours, location, delivery (free for orders over $50 within 15 miles), shipping, and our 30-day return policy on unopened items.
4. CULTURAL KNOWLEDGE: Share cooking tips, recipes, and cultural context about Ethiopian products when customers are interested.
5. LANGUAGES: Respond in the same language the customer uses. You speak English, Amharic, Tigrigna, and Spanish.

PRODUCT KNOWLEDGE:
- Food & Coffee: Berbere ($12.99), Mitmita ($10.99), Shiro ($8.99), Teff Flour ($11.99), Fresh Injera 10-pack ($15.99), Yirgacheffe Coffee ($18.99), Harar Coffee ($17.99), Niter Kibbeh ($14.99), Misir Lentils ($7.99), Ethiopian Honey ($24.99)
- Kitchenware: Jebena coffee pot ($49.99), Mitad griddle ($89.99), Mesob basket ($129.99), Coffee Cup Set ($34.99), Complete Coffee Ceremony Set ($149.99)
- Artifacts: Coptic Cross ($45.99), Woven Wall Art ($79.99), Traditional Drum ($119.99), Silver Cross Pendant ($89.99)

HELPFUL SUGGESTIONS (use naturally, not every message):
- If someone buys berbere, mention that niter kibbeh and injera go well with it
- If someone buys coffee beans, mention the jebena and cup set
- For new customers, the starter combination is berbere + niter kibbeh + injera + lentils
- Mention free delivery when cart approaches $50

TONE: Warm, courteous, and professional. Think of a kind, knowledgeable store associate who genuinely cares about helping you find what you need.
`;
