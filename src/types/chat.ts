// Language Support
export type Language = 'en' | 'am' | 'ti' | 'es';

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  am: 'Amharic',
  ti: 'Tigrigna',
  es: 'Spanish',
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇺🇸',
  am: '🇪🇹',
  ti: '🇪🇷',
  es: '🇪🇸',
};

// Chat Message Types
export interface GeminiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCalls?: FunctionCall[];
  suggestedProducts?: string[]; // Product IDs
}

export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
}

// Cart item structure for Gemini function calls
export interface GeminiCartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// Chat State
export interface ChatState {
  messages: GeminiMessage[];
  isTyping: boolean;
  isOpen: boolean;
  language: Language;
  sessionId: string | null;
  isVoiceActive: boolean;
  isVoiceSupported: boolean;
}

// Knowledge Base Types for RAG
export interface KnowledgeItem {
  id: string;
  type: 'product' | 'store_info' | 'faq' | 'culture';
  title: string;
  content: string;
  keywords: string[];
  metadata?: Record<string, unknown>;
}

// API Response Types
export interface GeminiChatResponse {
  reply: string;
  sessionId: string;
  functionCalls?: FunctionCall[];
  suggestedProducts?: string[];
}

// Voice Types
export interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
}

// Gemini Function Declaration Types
export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      items?: { type: string };
    }>;
    required: string[];
  };
}
