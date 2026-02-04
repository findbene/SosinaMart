export enum Language {
  ENGLISH = 'en',
  AMHARIC = 'am',
  TIGRIGNA = 'ti',
  SPANISH = 'es'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: 'kg' | 'lb' | 'pcs';
}

export type ChatView = 'chat' | 'cart' | 'checkout' | 'payment' | 'success';

export interface ChatState {
  messages: Message[];
  isVoiceActive: boolean;
  currentLanguage: Language;
  isProcessing: boolean;
  cart: CartItem[];
  view: ChatView;
  orderId?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'store_info' | 'shipping' | 'products' | 'returns';
}
