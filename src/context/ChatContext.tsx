'use client';

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { Product } from '@/types';
import { Language, FunctionCall, GeminiCartItem } from '@/types/chat';
import { useCart } from '@/context/CartContext';
import { PRODUCTS } from '@/lib/data';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedProducts?: Product[];
  functionCalls?: FunctionCall[];
}

interface ChatContextType {
  messages: ChatMessage[];
  sessionId: string | null;
  isOpen: boolean;
  isTyping: boolean;
  language: Language;
  isVoiceActive: boolean;
  isVoiceSupported: boolean;
  setIsOpen: (open: boolean) => void;
  setLanguage: (language: Language) => void;
  sendMessage: (message: string) => Promise<void>;
  clearSession: () => void;
  toggleVoice: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_SESSION_KEY = 'sosina-chat-session';
const CHAT_LANGUAGE_KEY = 'sosina-chat-language';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  // Get cart context for function call handling
  const cartContext = useCart();

  // Check voice support on mount
  useEffect(() => {
    const hasAudioSupport = typeof window !== 'undefined' &&
      'AudioContext' in window &&
      navigator.mediaDevices?.getUserMedia;
    setIsVoiceSupported(!!hasAudioSupport);
  }, []);

  // Load session and language from storage on mount
  useEffect(() => {
    // Load language preference
    const savedLanguage = localStorage.getItem(CHAT_LANGUAGE_KEY) as Language;
    if (savedLanguage && ['en', 'am', 'ti', 'es'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }

    // Load chat session
    const savedSession = localStorage.getItem(CHAT_SESSION_KEY);
    if (savedSession) {
      try {
        const { sessionId: savedId, messages: savedMessages } = JSON.parse(savedSession);
        setSessionId(savedId);
        setMessages(
          savedMessages.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } catch (error) {
        console.error('Failed to parse chat session:', error);
        localStorage.removeItem(CHAT_SESSION_KEY);
      }
    }
  }, []);

  // Save session to storage when it changes
  useEffect(() => {
    if (sessionId || messages.length > 0) {
      localStorage.setItem(
        CHAT_SESSION_KEY,
        JSON.stringify({ sessionId, messages })
      );
    }
  }, [sessionId, messages]);

  // Save language preference
  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem(CHAT_LANGUAGE_KEY, newLanguage);
  }, []);

  // Handle function calls from Gemini
  const handleFunctionCalls = useCallback((functionCalls: FunctionCall[]) => {
    for (const call of functionCalls) {
      if (call.name === 'add_to_cart') {
        const args = call.args as { items?: GeminiCartItem[] };
        if (args.items && Array.isArray(args.items)) {
          for (const item of args.items) {
            // Find the product by ID or name
            let product = PRODUCTS.find(p => p.id === item.productId);
            if (!product && item.productName) {
              product = PRODUCTS.find(p =>
                p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
                item.productName.toLowerCase().includes(p.name.toLowerCase())
              );
            }

            if (product) {
              // Add to cart the specified quantity (default 1)
              const qty = item.quantity || 1;
              for (let i = 0; i < qty; i++) {
                cartContext.addToCart(product);
              }
            }
          }
        }
      } else if (call.name === 'start_checkout') {
        // Trigger checkout - for now just open the cart
        // The actual checkout modal can be opened through events
        const checkoutEvent = new CustomEvent('openCheckout');
        window.dispatchEvent(checkoutEvent);
      }
    }
  }, [cartContext]);

  // Resolve product IDs to products
  const resolveProducts = useCallback((productIds?: string[]): Product[] => {
    if (!productIds || productIds.length === 0) return [];
    return productIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
          language,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session ID if new
        if (data.data.sessionId && data.data.sessionId !== sessionId) {
          setSessionId(data.data.sessionId);
        }

        // Handle function calls if present
        if (data.data.functionCalls && data.data.functionCalls.length > 0) {
          handleFunctionCalls(data.data.functionCalls);
        }

        // Resolve suggested products
        const suggestedProducts = resolveProducts(data.data.suggestedProducts);

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.data.reply,
          timestamp: new Date(),
          suggestedProducts,
          functionCalls: data.data.functionCalls,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: language === 'en'
            ? 'I apologize, but I encountered an issue. Please try again.'
            : 'ይቅርታ፣ ችግር አጋጥሞኛል። እባክዎ እንደገና ይሞክሩ።',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: language === 'en'
          ? 'I apologize, but I encountered a connection issue. Please try again.'
          : 'ይቅርታ፣ የግንኙነት ችግር አጋጥሞኛል።',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, language, handleFunctionCalls, resolveProducts]);

  const clearSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem(CHAT_SESSION_KEY);
  }, []);

  const toggleVoice = useCallback(() => {
    if (!isVoiceSupported) return;
    setIsVoiceActive((prev) => !prev);
    // Voice implementation will be handled in ChatWidget
  }, [isVoiceSupported]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessionId,
        isOpen,
        isTyping,
        language,
        isVoiceActive,
        isVoiceSupported,
        setIsOpen,
        setLanguage,
        sendMessage,
        clearSession,
        toggleVoice,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
