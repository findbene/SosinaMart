import { PRODUCTS, STORE_INFO } from '@/lib/data';
import { KnowledgeItem } from '@/types/chat';

// Build knowledge base from product data and store info
function buildKnowledgeBase(): KnowledgeItem[] {
  const knowledge: KnowledgeItem[] = [];

  // Add store information
  knowledge.push({
    id: 'store-info',
    type: 'store_info',
    title: 'Store Information',
    content: `${STORE_INFO.name} is an Ethiopian store located at ${STORE_INFO.address}. Contact us at ${STORE_INFO.phone} or ${STORE_INFO.email}. Visit our website at ${STORE_INFO.website}.`,
    keywords: ['store', 'location', 'contact', 'phone', 'email', 'address', 'sosina', 'mart', 'atlanta', 'tucker', 'georgia'],
  });

  // Add shipping/pickup info
  knowledge.push({
    id: 'shipping-info',
    type: 'store_info',
    title: 'Shipping and Pickup',
    content: 'We offer local pickup at our Tucker, GA location and shipping throughout the United States. Local customers can pick up their orders in-store.',
    keywords: ['shipping', 'pickup', 'delivery', 'local', 'order', 'ship'],
  });

  // Add hours of operation (example - update as needed)
  knowledge.push({
    id: 'store-hours',
    type: 'store_info',
    title: 'Store Hours',
    content: 'Sosina Mart is open Monday through Saturday from 9 AM to 8 PM, and Sunday from 10 AM to 6 PM. Holiday hours may vary.',
    keywords: ['hours', 'open', 'close', 'time', 'schedule', 'when'],
  });

  // Add products as knowledge items
  PRODUCTS.forEach((product) => {
    const categoryLabel = product.category === 'food' ? 'Food & Coffee' :
      product.category === 'kitchenware' ? 'Traditional Kitchenware' : 'Artifacts & Accessories';

    knowledge.push({
      id: `product-${product.id}`,
      type: 'product',
      title: product.name,
      content: `${product.name} - ${product.description || 'Traditional Ethiopian product'}. Price: $${product.price.toFixed(2)}. Category: ${categoryLabel}. ${product.inStock ? 'In stock' : 'Out of stock'}. ${product.featured ? 'Featured item.' : ''}`,
      keywords: [
        product.name.toLowerCase(),
        product.category,
        ...(product.description?.toLowerCase().split(/\s+/) || []),
        ...getCategoryKeywords(product.category),
      ],
      metadata: {
        productId: product.id,
        price: product.price,
        category: product.category,
        inStock: product.inStock,
        featured: product.featured,
      },
    });
  });

  // Add cultural information
  knowledge.push({
    id: 'coffee-ceremony',
    type: 'culture',
    title: 'Ethiopian Coffee Ceremony',
    content: 'The Ethiopian coffee ceremony (Buna) is a traditional ritual that involves roasting green coffee beans, grinding them by hand, and brewing coffee in a clay pot called a Jebena. The ceremony is a symbol of hospitality and friendship, typically performed three times with progressively weaker brews called Abol, Tona, and Baraka. Incense is burned during the ceremony.',
    keywords: ['coffee', 'ceremony', 'jebena', 'buna', 'tradition', 'culture', 'roast', 'ritual', 'hospitality'],
  });

  knowledge.push({
    id: 'injera-info',
    type: 'culture',
    title: 'Injera - Ethiopian Flatbread',
    content: 'Injera is a sourdough flatbread made from teff flour. It has a slightly spongy texture and tangy taste. Injera serves as both a plate and utensil in Ethiopian cuisine - stews and dishes are served on top of it, and pieces are torn off to scoop up food. Making authentic injera requires a Mitad, a traditional clay griddle.',
    keywords: ['injera', 'teff', 'bread', 'flatbread', 'mitad', 'ethiopian', 'food', 'fermented'],
  });

  knowledge.push({
    id: 'berbere-info',
    type: 'culture',
    title: 'Berbere Spice',
    content: 'Berbere is the essential Ethiopian spice blend, containing chili peppers, garlic, ginger, fenugreek, coriander, cardamom, and various other spices. It is used in many Ethiopian dishes including Doro Wot (chicken stew) and Tibs (sauteed meat). Each family may have their own secret recipe.',
    keywords: ['berbere', 'spice', 'blend', 'chili', 'ethiopian', 'cooking', 'wot', 'seasoning'],
  });

  knowledge.push({
    id: 'coptic-cross',
    type: 'culture',
    title: 'Ethiopian Coptic Cross',
    content: 'Ethiopian Coptic crosses are distinctive religious symbols with intricate lattice-work designs. Each cross is unique and represents different regions or churches in Ethiopia. They are often made from brass, silver, or wood and are worn as jewelry or used in religious ceremonies.',
    keywords: ['cross', 'coptic', 'christian', 'religious', 'brass', 'silver', 'jewelry', 'orthodox'],
  });

  return knowledge;
}

// Get category-specific keywords
function getCategoryKeywords(category: string): string[] {
  const keywords: Record<string, string[]> = {
    food: ['spice', 'coffee', 'bean', 'flour', 'honey', 'butter', 'berbere', 'mitmita', 'shiro', 'injera', 'teff', 'ethiopian food', 'cooking', 'ingredient'],
    kitchenware: ['pot', 'pan', 'cup', 'basket', 'tray', 'jebena', 'mitad', 'mesob', 'ceremony', 'cooking', 'serving', 'traditional'],
    artifacts: ['cross', 'necklace', 'jewelry', 'basket', 'drum', 'art', 'decor', 'decoration', 'cultural', 'handmade', 'craft'],
  };
  return keywords[category] || [];
}

// Pre-built knowledge base
const KNOWLEDGE_BASE = buildKnowledgeBase();

/**
 * Search the knowledge base using keyword matching
 * Returns relevant knowledge items sorted by relevance score
 */
export function searchKnowledge(query: string, limit: number = 5): KnowledgeItem[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 1);

  // Score each knowledge item
  const scored = KNOWLEDGE_BASE.map(item => {
    let score = 0;

    // Check keywords
    for (const keyword of item.keywords) {
      if (queryLower.includes(keyword)) score += 10;
      for (const term of queryTerms) {
        if (keyword.includes(term) || term.includes(keyword)) score += 5;
      }
    }

    // Check title
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes(queryLower)) score += 20;
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 8;
    }

    // Check content
    const contentLower = item.content.toLowerCase();
    if (contentLower.includes(queryLower)) score += 15;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) score += 3;
    }

    // Boost products for shopping-related queries
    if (item.type === 'product') {
      const shoppingTerms = ['buy', 'price', 'cost', 'order', 'get', 'purchase', 'add', 'cart', 'want', 'need', 'looking'];
      if (shoppingTerms.some(term => queryLower.includes(term))) {
        score += 5;
      }
    }

    return { item, score };
  });

  // Filter and sort by score
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

/**
 * Get product recommendations based on context
 */
export function getProductRecommendations(
  productIds?: string[],
  category?: string,
  limit: number = 4
): KnowledgeItem[] {
  let candidates = KNOWLEDGE_BASE.filter(item => item.type === 'product');

  // Filter by category if specified
  if (category) {
    candidates = candidates.filter(item =>
      (item.metadata?.category as string) === category
    );
  }

  // Exclude already selected products
  if (productIds && productIds.length > 0) {
    const excludeSet = new Set(productIds);
    candidates = candidates.filter(item =>
      !excludeSet.has(item.metadata?.productId as string)
    );
  }

  // Prioritize featured products
  candidates.sort((a, b) => {
    const aFeatured = a.metadata?.featured ? 1 : 0;
    const bFeatured = b.metadata?.featured ? 1 : 0;
    return bFeatured - aFeatured;
  });

  return candidates.slice(0, limit);
}

/**
 * Build context string for AI from relevant knowledge items
 */
export function buildKnowledgeContext(query: string): string {
  const relevantItems = searchKnowledge(query, 8);

  if (relevantItems.length === 0) {
    return '';
  }

  let context = '\n\n## Relevant Information:\n';

  for (const item of relevantItems) {
    context += `\n### ${item.title}\n${item.content}\n`;
  }

  return context;
}

/**
 * Find products by name (for cart operations)
 */
export function findProductByName(name: string): KnowledgeItem | undefined {
  const nameLower = name.toLowerCase();

  return KNOWLEDGE_BASE.find(item => {
    if (item.type !== 'product') return false;
    const titleLower = item.title.toLowerCase();
    return titleLower === nameLower || titleLower.includes(nameLower) || nameLower.includes(titleLower);
  });
}

/**
 * Get all products as knowledge items
 */
export function getAllProducts(): KnowledgeItem[] {
  return KNOWLEDGE_BASE.filter(item => item.type === 'product');
}

export { KNOWLEDGE_BASE };
