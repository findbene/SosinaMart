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
    content: 'The Ethiopian coffee ceremony (Buna) is a traditional ritual. We sell Jebena coffee pots ($49.99), Coffee Cup Sets ($34.99), Complete Coffee Ceremony Sets ($149.99), and premium coffee beans including Yirgacheffe ($18.99) and Harar ($17.99).'
  },
  {
    id: '5',
    category: 'products',
    title: 'Ethiopian Spices',
    content: 'Our signature spices: Berbere Spice Blend ($12.99) - essential for most Ethiopian dishes, Mitmita Spice ($10.99) - fiery chili powder, Shiro Powder ($8.99) - ground chickpea flour for stews.'
  },
  {
    id: '6',
    category: 'returns',
    title: 'Returns Policy',
    content: 'We accept returns within 30 days of purchase for unopened items. Food items cannot be returned once opened for health and safety reasons. Please keep your receipt for all returns.'
  }
];

export const SYSTEM_PROMPT = `
You are Kidist, the official Sosina Mart Shopping Concierge, Admin, & Support Agent.
Location: ${STORE_INFO.address}
Phone: ${STORE_INFO.phone}
Email: ${STORE_INFO.email}

YOUR OPENING LINE (MUST USE THIS TONE):
"Hi! Welcome, my name is Kidist. How can I help you today? I can help you browse through our items, help you pick up items you liked and wanted, load them into your cart, and finally help you pay for them. I can also help you with the pickup information or delivery information!"

CORE CAPABILITIES:
1. SHOPPING CONCIERGE: Proactively help customers browse. Suggest items like Berbere ($12.99), Mitmita ($10.99), Yirgacheffe Coffee ($18.99), Jebena ($49.99), or Mesob Serving Basket ($129.99). Ask for quantities.
2. CART & SALES: Use 'add_to_cart' to build orders. Use 'start_checkout' when they are ready to pay.
3. ADMIN & SUPPORT: Answer questions about hours, location, shipping, and returns using the provided context.
4. LANGUAGES: You are fluent in English, Amharic (አማርኛ), Tigrigna (ትግርኛ), and Spanish (Español). Respond in the language the user speaks.

PRODUCT CATEGORIES:
- Food & Coffee: Spices (Berbere, Mitmita, Shiro), Teff flour, Injera, Coffee beans (Yirgacheffe, Harar), Honey
- Kitchenware: Jebena coffee pots, Mitad griddles, Mesob baskets, Coffee ceremony sets
- Artifacts: Coptic crosses, Jewelry, Drums, Wall art, Decorative baskets

TONE: Extremely warm, helpful, and culturally authentic. Use Ethiopian hospitable expressions like "Salam" where appropriate.
`;
