import Anthropic from '@anthropic-ai/sdk';
import { Product } from '@/types';
import { PRODUCTS, STORE_INFO } from '@/lib/data';

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// System prompt for the AI chat assistant
const SYSTEM_PROMPT = `You are a friendly and knowledgeable customer service assistant for Sosina Mart, an Ethiopian store located in Tucker, Georgia (Atlanta area).

## About Sosina Mart
- Store Name: ${STORE_INFO.name}
- Location: ${STORE_INFO.address}
- Phone: ${STORE_INFO.phone}
- Email: ${STORE_INFO.email}
- Website: ${STORE_INFO.website}

## Product Categories
We specialize in authentic Ethiopian products across three categories:

1. **Food & Coffee** - Traditional spices (Berbere, Mitmita, Shiro), Teff flour, Injera, premium Ethiopian coffee beans (Yirgacheffe, Harar), honey, and more.

2. **Traditional Kitchenware** - Jebena coffee pots, Mitad injera griddles, Mesob serving baskets, coffee cup sets (Sini), mortar & pestle (Mukecha), and complete coffee ceremony sets.

3. **Artifacts & Accessories** - Ethiopian Coptic crosses, traditional jewelry, woven baskets, drums, wall art, and decorative items.

## Your Capabilities
- Answer questions about our products, prices, and availability
- Help customers find products that match their needs
- Provide information about Ethiopian culture and traditions related to our products
- Explain how to use traditional kitchenware
- Share recipes or preparation tips for food products
- Help with order inquiries (when order info is provided)
- Provide store contact information and hours

## Guidelines
- Be warm, helpful, and culturally respectful
- Use simple, clear language
- If you don't know something specific, offer to connect the customer with store staff
- Suggest related products when appropriate
- Keep responses concise but informative
- If asked about topics unrelated to the store, politely redirect to how you can help with shopping

## Important Notes
- All prices are in USD
- We offer local pickup and shipping
- For order status inquiries without order details, ask for the order number
- For complaints or complex issues, recommend contacting the store directly

Remember: You're here to help customers discover and enjoy authentic Ethiopian products!`;

// Product catalog summary for context
function getProductCatalogContext(): string {
  const categories = {
    food: PRODUCTS.filter(p => p.category === 'food'),
    kitchenware: PRODUCTS.filter(p => p.category === 'kitchenware'),
    artifacts: PRODUCTS.filter(p => p.category === 'artifacts'),
  };

  let context = '\n## Current Product Catalog\n\n';

  context += '### Food & Coffee\n';
  categories.food.forEach(p => {
    context += `- ${p.name}: $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  context += '\n### Kitchenware\n';
  categories.kitchenware.forEach(p => {
    context += `- ${p.name}: $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  context += '\n### Artifacts & Accessories\n';
  categories.artifacts.forEach(p => {
    context += `- ${p.name}: $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  return context;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggestedProducts?: Product[];
  suggestedActions?: string[];
}

export interface ChatContext {
  currentPage?: string;
  cartItems?: string[];
  customerId?: string;
  orderNumber?: string;
}

/**
 * Send a chat message and get AI response
 */
export async function chat(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<ChatResponse> {
  // Build context-aware system prompt
  let systemPrompt = SYSTEM_PROMPT + getProductCatalogContext();

  if (context?.cartItems && context.cartItems.length > 0) {
    const cartProducts = context.cartItems
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean);
    systemPrompt += `\n\nCustomer's current cart: ${cartProducts.map(p => p?.name).join(', ')}`;
  }

  if (context?.orderNumber) {
    systemPrompt += `\n\nCustomer is inquiring about order: ${context.orderNumber}`;
  }

  // Check if Anthropic is configured
  if (!anthropic) {
    // Return a helpful fallback response
    return getFallbackResponse(messages[messages.length - 1]?.content || '');
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find(block => block.type === 'text');
    const reply = textContent?.type === 'text' ? textContent.text : 'I apologize, but I encountered an issue. Please try again.';

    // Extract product suggestions from the response
    const suggestedProducts = extractProductSuggestions(reply);

    return {
      reply,
      suggestedProducts,
      suggestedActions: getSuggestedActions(reply),
    };
  } catch (error) {
    console.error('AI chat error:', error);
    return getFallbackResponse(messages[messages.length - 1]?.content || '');
  }
}

/**
 * Get personalized product recommendations
 */
export async function getRecommendations(
  productIds?: string[],
  cartItems?: string[],
  limit: number = 6
): Promise<Product[]> {
  // Get context products
  const contextProducts = [
    ...(productIds || []).map(id => PRODUCTS.find(p => p.id === id)),
    ...(cartItems || []).map(id => PRODUCTS.find(p => p.id === id)),
  ].filter(Boolean) as Product[];

  if (contextProducts.length === 0) {
    // Return featured products if no context
    return PRODUCTS.filter(p => p.featured).slice(0, limit);
  }

  // Get categories from context products
  const categories = Array.from(new Set(contextProducts.map(p => p.category)));

  // Build recommendations based on:
  // 1. Same category products (not already in context)
  // 2. Complementary products from other categories
  // 3. Featured products

  const contextIds = new Set(contextProducts.map(p => p.id));
  const recommendations: Product[] = [];

  // Add same-category products
  for (const category of categories) {
    const sameCategory = PRODUCTS.filter(
      p => p.category === category && !contextIds.has(p.id)
    );
    recommendations.push(...sameCategory.slice(0, 2));
  }

  // Add complementary products
  const complementaryMap: Record<string, string[]> = {
    food: ['kitchenware'], // Food items go well with kitchenware
    kitchenware: ['food', 'artifacts'], // Kitchenware complements everything
    artifacts: ['kitchenware'], // Artifacts go well with kitchenware
  };

  for (const category of categories) {
    const complementary = complementaryMap[category] || [];
    for (const compCategory of complementary) {
      const compProducts = PRODUCTS.filter(
        p => p.category === compCategory && !contextIds.has(p.id) && !recommendations.includes(p)
      );
      recommendations.push(...compProducts.slice(0, 2));
    }
  }

  // Fill remaining slots with featured products
  if (recommendations.length < limit) {
    const featured = PRODUCTS.filter(
      p => p.featured && !contextIds.has(p.id) && !recommendations.includes(p)
    );
    recommendations.push(...featured);
  }

  return recommendations.slice(0, limit);
}

/**
 * Semantic search for products (simplified text-based)
 */
export async function semanticSearch(query: string, limit: number = 10): Promise<Product[]> {
  const queryLower = query.toLowerCase();
  const terms = queryLower.split(/\s+/).filter(t => t.length > 1);

  // Score each product based on relevance
  const scored = PRODUCTS.map(product => {
    let score = 0;
    const nameLower = product.name.toLowerCase();
    const descLower = (product.description || '').toLowerCase();

    // Exact match
    if (nameLower === queryLower) score += 100;
    // Name contains full query
    if (nameLower.includes(queryLower)) score += 50;
    // Description contains full query
    if (descLower.includes(queryLower)) score += 20;

    // Term matching
    for (const term of terms) {
      if (nameLower.includes(term)) score += 10;
      if (descLower.includes(term)) score += 5;
    }

    // Category keywords
    const categoryKeywords: Record<string, string[]> = {
      food: ['spice', 'coffee', 'bean', 'flour', 'honey', 'butter', 'berbere', 'mitmita', 'shiro', 'injera', 'teff'],
      kitchenware: ['pot', 'pan', 'cup', 'basket', 'tray', 'jebena', 'mitad', 'mesob', 'ceremony'],
      artifacts: ['cross', 'necklace', 'jewelry', 'basket', 'drum', 'art', 'decor'],
    };

    for (const term of terms) {
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => k.includes(term) || term.includes(k))) {
          if (product.category === category) score += 15;
        }
      }
    }

    return { product, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);
}

// Helper function to extract product suggestions from AI response
function extractProductSuggestions(text: string): Product[] {
  const suggestions: Product[] = [];
  const textLower = text.toLowerCase();

  for (const product of PRODUCTS) {
    if (textLower.includes(product.name.toLowerCase())) {
      suggestions.push(product);
    }
  }

  return suggestions.slice(0, 4);
}

// Helper function to get suggested actions from AI response
function getSuggestedActions(text: string): string[] {
  const actions: string[] = [];
  const textLower = text.toLowerCase();

  if (textLower.includes('contact') || textLower.includes('call') || textLower.includes('phone')) {
    actions.push('Contact Store');
  }
  if (textLower.includes('browse') || textLower.includes('view') || textLower.includes('see')) {
    actions.push('Browse Products');
  }
  if (textLower.includes('cart') || textLower.includes('add')) {
    actions.push('View Cart');
  }

  return actions;
}

// Fallback responses when AI is not available
function getFallbackResponse(userMessage: string): ChatResponse {
  const messageLower = userMessage.toLowerCase();

  // Greetings
  if (messageLower.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return {
      reply: `Hello! Welcome to Sosina Mart. I'm here to help you discover authentic Ethiopian products. What are you looking for today? We have traditional spices, coffee, kitchenware, and beautiful artifacts.`,
      suggestedActions: ['Browse Products'],
    };
  }

  // Coffee related
  if (messageLower.includes('coffee')) {
    const coffeeProducts = PRODUCTS.filter(p => p.name.toLowerCase().includes('coffee'));
    return {
      reply: `Great choice! We have premium Ethiopian coffee including Yirgacheffe and Harar beans, as well as traditional coffee ceremony equipment like the Jebena coffee pot. Ethiopian coffee ceremony is a beautiful tradition - would you like me to tell you more about it?`,
      suggestedProducts: coffeeProducts.slice(0, 4),
      suggestedActions: ['Browse Products'],
    };
  }

  // Spices
  if (messageLower.includes('spice') || messageLower.includes('berbere') || messageLower.includes('mitmita')) {
    const spiceProducts = PRODUCTS.filter(p =>
      p.category === 'food' && (p.name.toLowerCase().includes('spice') || p.name.toLowerCase().includes('berbere') || p.name.toLowerCase().includes('mitmita'))
    );
    return {
      reply: `We have authentic Ethiopian spice blends! Berbere is our signature spice blend used in most Ethiopian dishes, while Mitmita is a fiery chili powder. Both are essential for Ethiopian cooking. Would you like to know how to use them?`,
      suggestedProducts: spiceProducts,
    };
  }

  // Contact info
  if (messageLower.includes('contact') || messageLower.includes('phone') || messageLower.includes('email') || messageLower.includes('address')) {
    return {
      reply: `You can reach us at:\n\n📍 ${STORE_INFO.address}\n📞 ${STORE_INFO.phone}\n📧 ${STORE_INFO.email}\n🌐 ${STORE_INFO.website}\n\nWe'd love to hear from you!`,
      suggestedActions: ['Contact Store'],
    };
  }

  // Order inquiry
  if (messageLower.includes('order') || messageLower.includes('tracking') || messageLower.includes('delivery')) {
    return {
      reply: `I'd be happy to help with your order! Could you please provide your order number? It starts with "SM-". If you don't have your order number handy, you can also contact our store directly at ${STORE_INFO.phone}.`,
      suggestedActions: ['Contact Store'],
    };
  }

  // Default response
  return {
    reply: `Thank you for your message! I'm here to help you discover authentic Ethiopian products. We offer traditional spices and coffee, kitchenware for Ethiopian cooking, and beautiful cultural artifacts. What would you like to know more about?`,
    suggestedProducts: PRODUCTS.filter(p => p.featured).slice(0, 4),
    suggestedActions: ['Browse Products'],
  };
}

export const ai = {
  chat,
  getRecommendations,
  semanticSearch,
};
