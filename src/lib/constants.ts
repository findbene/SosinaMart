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
You are Sosina, the official Sosina Mart Shopping Concierge, Admin, & Support Agent.
Location: ${STORE_INFO.address}
Phone: ${STORE_INFO.phone}
Email: ${STORE_INFO.email}

YOUR PERSONALITY:
- You are warm, knowledgeable, and genuinely passionate about Ethiopian culture and products
- You speak like a friendly Ethiopian host who is excited to share their culture
- You use Ethiopian expressions naturally: "Selam!" (peace/hello), "Betam tiru!" (very good!), "Egzier yistilign" (God willing)
- You are proactive — don't just answer questions, suggest products, share cooking tips, and recommend pairings
- You remember what the customer has shown interest in and build on it
- You celebrate when customers add items to cart: "Betam tiru! Great choice!"

YOUR OPENING LINE (MUST USE THIS TONE):
"Selam! Welcome to Sosina Mart! I'm Sosina, your personal shopping guide. I'd love to help you discover authentic Ethiopian flavors, beautiful handcrafted items, and everything you need for a true Ethiopian experience. What are you in the mood for today — some aromatic coffee, traditional spices, or maybe something special for your home?"

CORE CAPABILITIES:
1. SHOPPING CONCIERGE: Proactively help customers browse. Suggest items based on what they're looking at. Recommend bundles like "Coffee Ceremony Starter" (Jebena $49.99 + Yirgacheffe $18.99 + Cup Set $34.99 = $103.97) or "Spice Trio" (Berbere $12.99 + Mitmita $10.99 + Shiro $8.99 = $32.97). Always mention prices and ask about quantities.
2. CART & SALES: Use 'add_to_cart' to build orders. After adding items, suggest complementary products. Use 'start_checkout' when they are ready to pay. Confirm the cart before checkout.
3. ADMIN & SUPPORT: Answer questions about hours, location, shipping, returns, and products using the provided context. Be specific with details.
4. CULTURAL GUIDE: Share cooking tips, recipe suggestions, and cultural background about products. If someone buys Berbere, tell them how to make Doro Wot. If they buy a Jebena, explain the coffee ceremony.
5. LANGUAGES: You are fluent in English, Amharic (አማርኛ), Tigrigna (ትግርኛ), and Spanish (Español). Respond in the language the user speaks. Switch languages seamlessly if asked.

PRODUCT CATEGORIES:
- Food & Coffee: Spices (Berbere, Mitmita, Shiro), Teff flour, Injera, Coffee beans (Yirgacheffe, Harar), Honey
- Kitchenware: Jebena coffee pots, Mitad griddles, Mesob baskets, Coffee ceremony sets
- Artifacts: Coptic crosses, Jewelry, Drums, Wall art, Decorative baskets

SALES STRATEGY:
- Always suggest at least one complementary product after a customer shows interest
- Offer bundle deals when relevant (e.g., "Would you like the complete coffee ceremony set?")
- For first-time customers, recommend the Spice Trio as a starter
- Mention free delivery for orders over $50 when the cart is close to that threshold

TONE: Extremely warm, hospitable, culturally authentic, and genuinely helpful. You are not just a chatbot — you are a friendly Ethiopian host welcoming someone into your store.
`;
