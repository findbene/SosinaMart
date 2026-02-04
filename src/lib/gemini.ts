import { GoogleGenAI } from '@google/genai';
import { STORE_INFO, PRODUCTS } from '@/lib/data';
import { buildKnowledgeContext, findProductByName } from '@/lib/rag';
import { Language, LANGUAGE_NAMES, FunctionCall, GeminiCartItem } from '@/types/chat';

// Initialize Gemini client (server-side only)
const genai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Kidist persona system prompt
function getSystemPrompt(language: Language = 'en'): string {
  const languageName = LANGUAGE_NAMES[language];

  return `You are Kidist, the friendly Shopping Concierge and Support Agent for Sosina Mart, an Ethiopian store in Tucker, Georgia (Atlanta area).

## Your Personality
- Warm, helpful, and culturally knowledgeable
- Passionate about Ethiopian culture and products
- Patient and understanding with customers
- Speak primarily in ${languageName}, but can switch languages when asked

## Store Information
- Store Name: ${STORE_INFO.name}
- Location: ${STORE_INFO.address}
- Phone: ${STORE_INFO.phone}
- Email: ${STORE_INFO.email}
- Website: ${STORE_INFO.website}

## Your Capabilities
1. **Product Assistance**: Help customers find products, explain their uses, and suggest items
2. **Cart Management**: When a customer wants to buy something, include a JSON action block in your response
3. **Cultural Knowledge**: Share information about Ethiopian traditions, food, and customs
4. **Store Information**: Provide store hours, location, contact details

## Product Categories
- **Food & Coffee**: Spices (Berbere, Mitmita, Shiro), Teff flour, Injera, Ethiopian coffee (Yirgacheffe, Harar), honey
- **Kitchenware**: Jebena coffee pots, Mitad griddles, Mesob baskets, coffee ceremony sets
- **Artifacts**: Coptic crosses, jewelry, drums, wall art, decorative baskets

## Guidelines
- Be warm and conversational, like talking to a friend
- Use the customer's language preference
- Keep responses concise but informative
- If you don't know something, offer to connect with store staff
- Share cultural context about products when relevant

## Adding Items to Cart
When a customer wants to add items to their cart, include this JSON block at the END of your response:
\`\`\`action
{"action":"add_to_cart","items":[{"productId":"f1","productName":"Berbere Spice Blend","quantity":1,"price":12.99}]}
\`\`\`

## Starting Checkout
When a customer wants to checkout, include this JSON block at the END of your response:
\`\`\`action
{"action":"start_checkout"}
\`\`\`

## Important
- All prices are in USD
- We offer local pickup and shipping
- For order status, ask for order number (format: SM-XXXXX)
- Always use the exact product IDs from the catalog when adding to cart

Remember: You're helping customers discover and enjoy authentic Ethiopian products. Make the experience delightful!`;
}

// Build product context for the AI
function getProductContext(): string {
  let context = '\n\n## Current Product Catalog:\n';

  const categories = {
    food: PRODUCTS.filter(p => p.category === 'food'),
    kitchenware: PRODUCTS.filter(p => p.category === 'kitchenware'),
    artifacts: PRODUCTS.filter(p => p.category === 'artifacts'),
  };

  context += '\n### Food & Coffee:\n';
  categories.food.forEach(p => {
    context += `- ${p.name} (ID: ${p.id}): $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  context += '\n### Kitchenware:\n';
  categories.kitchenware.forEach(p => {
    context += `- ${p.name} (ID: ${p.id}): $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  context += '\n### Artifacts & Accessories:\n';
  categories.artifacts.forEach(p => {
    context += `- ${p.name} (ID: ${p.id}): $${p.price.toFixed(2)} - ${p.description || ''}\n`;
  });

  return context;
}

// Chat message interface for API
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Chat response interface
export interface GeminiResponse {
  reply: string;
  functionCalls?: FunctionCall[];
  suggestedProducts?: string[];
}

// Parse action blocks from response
function parseActionBlocks(text: string): { cleanText: string; functionCalls: FunctionCall[] } {
  const functionCalls: FunctionCall[] = [];
  let cleanText = text;

  // Find action blocks
  const actionPattern = /```action\s*([\s\S]*?)```/g;
  let match;

  while ((match = actionPattern.exec(text)) !== null) {
    try {
      const actionJson = JSON.parse(match[1].trim());
      if (actionJson.action === 'add_to_cart' && actionJson.items) {
        functionCalls.push({
          name: 'add_to_cart',
          args: { items: actionJson.items },
        });
      } else if (actionJson.action === 'start_checkout') {
        functionCalls.push({
          name: 'start_checkout',
          args: { message: actionJson.message || '' },
        });
      }
    } catch (e) {
      console.error('Failed to parse action block:', e);
    }
  }

  // Remove action blocks from text
  cleanText = text.replace(actionPattern, '').trim();

  return { cleanText, functionCalls };
}

/**
 * Send a chat message and get AI response
 */
export async function chatWithHistory(
  messages: ChatMessage[],
  language: Language = 'en'
): Promise<GeminiResponse> {
  if (!genai) {
    return getFallbackResponse(messages[messages.length - 1]?.content || '', language);
  }

  try {
    const userMessage = messages[messages.length - 1]?.content || '';
    const ragContext = buildKnowledgeContext(userMessage);
    const systemPrompt = getSystemPrompt(language) + getProductContext() + ragContext;

    // Build conversation history
    const conversationHistory = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }));

    // Use generateContent
    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood! I am Kidist, the shopping assistant for Sosina Mart. I will help customers find Ethiopian products, answer questions, and assist with cart operations. How can I help you today?' }] },
        ...conversationHistory,
        { role: 'user', parts: [{ text: userMessage }] },
      ],
      config: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    let reply = '';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          reply += part.text;
        }
      }
    }

    if (!reply) {
      return getFallbackResponse(userMessage, language);
    }

    // Parse any action blocks from the response
    const { cleanText, functionCalls } = parseActionBlocks(reply);

    return {
      reply: cleanText,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      suggestedProducts: extractProductSuggestions(cleanText),
    };
  } catch (error) {
    console.error('[Gemini Chat] Error:', error);
    return getFallbackResponse(messages[messages.length - 1]?.content || '', language);
  }
}

// Extract product suggestions from AI response
function extractProductSuggestions(text: string): string[] {
  const suggestions: string[] = [];
  const textLower = text.toLowerCase();

  for (const product of PRODUCTS) {
    if (textLower.includes(product.name.toLowerCase())) {
      suggestions.push(product.id);
    }
  }

  return suggestions.slice(0, 4);
}

// Fallback responses when AI is not available
function getFallbackResponse(userMessage: string, language: Language): GeminiResponse {
  const messageLower = userMessage.toLowerCase();

  // Language-specific greetings
  const greetings: Record<Language, string> = {
    en: `Hello! Welcome to Sosina Mart. I'm Kidist, your shopping assistant. How can I help you discover authentic Ethiopian products today?`,
    am: `ሰላም! ወደ ሶስና ማርት እንኳን ደህና መጡ። እኔ ቅድስት ነኝ። ዛሬ በምን ልርዳዎት?`,
    ti: `ሰላም! ናብ ሶስና ማርት እንኳዕ ደሓን መጻእኩም። ኣነ ቅድስት እየ። ሎሚ ብኸመይ ክሕግዘኩም?`,
    es: `¡Hola! Bienvenido a Sosina Mart. Soy Kidist, su asistente de compras. ¿Cómo puedo ayudarle hoy?`,
  };

  // Check for greetings
  if (messageLower.match(/^(hi|hello|hey|good morning|good afternoon|good evening|selam|hola)/i)) {
    return {
      reply: greetings[language],
      suggestedProducts: PRODUCTS.filter(p => p.featured).slice(0, 4).map(p => p.id),
    };
  }

  // Check for coffee-related queries
  if (messageLower.includes('coffee') || messageLower.includes('buna')) {
    const coffeeProducts = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes('coffee') || p.name.toLowerCase().includes('jebena')
    );
    return {
      reply: language === 'en'
        ? `Great choice! We have premium Ethiopian coffee including Yirgacheffe and Harar beans, plus traditional coffee ceremony equipment. Ethiopian coffee ceremony (Buna) is a beautiful tradition - would you like me to tell you more about it or add some items to your cart?`
        : greetings[language],
      suggestedProducts: coffeeProducts.slice(0, 4).map(p => p.id),
    };
  }

  // Check for spice-related queries
  if (messageLower.includes('spice') || messageLower.includes('berbere') || messageLower.includes('mitmita')) {
    const spiceProducts = PRODUCTS.filter(p =>
      p.category === 'food' && (
        p.name.toLowerCase().includes('spice') ||
        p.name.toLowerCase().includes('berbere') ||
        p.name.toLowerCase().includes('mitmita')
      )
    );
    return {
      reply: `We have authentic Ethiopian spice blends! Berbere is our signature spice blend used in most Ethiopian dishes, while Mitmita is a fiery chili powder. Both are essential for Ethiopian cooking. Would you like me to add any to your cart?`,
      suggestedProducts: spiceProducts.map(p => p.id),
    };
  }

  // Check for contact info
  if (messageLower.includes('contact') || messageLower.includes('phone') || messageLower.includes('email') || messageLower.includes('address')) {
    return {
      reply: `You can reach us at:\n\n📍 ${STORE_INFO.address}\n📞 ${STORE_INFO.phone}\n📧 ${STORE_INFO.email}\n🌐 ${STORE_INFO.website}\n\nWe'd love to hear from you!`,
    };
  }

  // Check for add to cart requests
  if (messageLower.includes('add') && (messageLower.includes('cart') || messageLower.includes('buy'))) {
    // Try to find the product mentioned
    for (const product of PRODUCTS) {
      if (messageLower.includes(product.name.toLowerCase())) {
        return {
          reply: `I've added ${product.name} to your cart! Is there anything else you'd like?`,
          functionCalls: [{
            name: 'add_to_cart',
            args: {
              items: [{
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: product.price,
              }],
            },
          }],
        };
      }
    }
  }

  // Default response
  return {
    reply: language === 'en'
      ? `Thank you for your message! I'm Kidist, here to help you discover authentic Ethiopian products. We have traditional spices and coffee, kitchenware for Ethiopian cooking, and beautiful cultural artifacts. What would you like to know more about?`
      : greetings[language],
    suggestedProducts: PRODUCTS.filter(p => p.featured).slice(0, 4).map(p => p.id),
  };
}

/**
 * Resolve product from function call args
 */
export function resolveProductFromArgs(args: GeminiCartItem): { productId: string; name: string; price: number } | null {
  // First try by productId
  let product = PRODUCTS.find(p => p.id === args.productId);

  // If not found, try by name
  if (!product && args.productName) {
    const knowledgeItem = findProductByName(args.productName);
    if (knowledgeItem?.metadata?.productId) {
      product = PRODUCTS.find(p => p.id === knowledgeItem.metadata?.productId);
    }
  }

  if (product) {
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
    };
  }

  return null;
}

export const gemini = {
  chatWithHistory,
  resolveProductFromArgs,
};
