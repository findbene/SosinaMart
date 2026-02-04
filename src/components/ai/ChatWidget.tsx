'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Loader2, X, Mic, MicOff, ShoppingCart, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import { useCart } from '@/context/CartContext';
import { LanguageSelector } from './LanguageSelector';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { LANGUAGE_NAMES } from '@/types/chat';

// Quick actions by language
const QUICK_ACTIONS = {
  en: [
    'What spices do you recommend?',
    'Tell me about coffee ceremony',
    'What kitchenware is available?',
    'Add berbere to my cart',
  ],
  am: [
    'ምን ቅመም ይመክራሉ?',
    'ስለ ቡና ሥነ ሥርዓት ንገሩኝ',
    'ምን የወጥ ቤት እቃዎች አሉ?',
  ],
  ti: [
    'ኣየናይ ቅመማት ተመክሩ?',
    'ብዛዕባ ስነ-ስርዓት ቡና ንገሩኒ',
  ],
  es: [
    '¿Qué especias recomienda?',
    'Cuéntame sobre la ceremonia del café',
    '¿Qué utensilios de cocina hay?',
  ],
};

export function ChatWidget() {
  const {
    messages,
    isOpen,
    setIsOpen,
    isTyping,
    language,
    setLanguage,
    sendMessage,
    clearSession,
    isVoiceActive,
    isVoiceSupported,
    toggleVoice,
  } = useChat();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickActions = QUICK_ACTIONS[language] || QUICK_ACTIONS.en;

  // Greeting based on language
  const getGreeting = () => {
    switch (language) {
      case 'am':
        return { title: 'ሰላም! እኔ ቅድስት ነኝ', subtitle: 'ዛሬ በምን ልርዳዎት?' };
      case 'ti':
        return { title: 'ሰላም! ኣነ ቅድስት እየ', subtitle: 'ሎሚ ብኸመይ ክሕግዘኩም?' };
      case 'es':
        return { title: '¡Hola! Soy Kidist', subtitle: '¿Cómo puedo ayudarle hoy?' };
      default:
        return { title: "Hi! I'm Kidist", subtitle: 'Your Ethiopian shopping assistant' };
    }
  };

  const greeting = getGreeting();

  return (
    <>
      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-50 transition-all duration-300 ease-in-out',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header with Ethiopian colors */}
          <div className="relative bg-gradient-to-r from-green-600 via-yellow-500 to-red-600 text-white px-4 py-3">
            {/* Ethiopian pattern overlay */}
            <div className="absolute inset-0 bg-black/10" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Kidist Avatar */}
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                  👩🏾
                </div>
                <div>
                  <h3 className="font-semibold text-white drop-shadow">Kidist</h3>
                  <p className="text-xs text-white/90">Shopping Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LanguageSelector value={language} onChange={setLanguage} />
                <button
                  onClick={clearSession}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  title="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">👩🏾‍💼</div>
                <p className="text-gray-800 font-semibold">{greeting.title}</p>
                <p className="text-sm text-gray-500 mt-1">{greeting.subtitle}</p>

                <div className="mt-5 space-y-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(action)}
                      className={cn(
                        'block w-full text-left px-3 py-2.5 text-sm bg-white rounded-lg border',
                        'hover:border-green-500 hover:text-green-700 hover:bg-green-50',
                        'transition-all duration-200'
                      )}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 flex items-center justify-center text-xs">
                    👩🏾
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
            <div className="flex items-end gap-2">
              {/* Voice button */}
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={cn(
                    'p-2 rounded-lg transition-colors shrink-0',
                    isVoiceActive
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  title={isVoiceActive ? 'Stop voice' : 'Start voice'}
                >
                  {isVoiceActive ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === 'am' ? 'መልእክትዎን ይጻፉ...' :
                  language === 'ti' ? 'መልእኽትኹም ጸሓፉ...' :
                  language === 'es' ? 'Escribe tu mensaje...' :
                  'Type your message...'
                }
                rows={1}
                className={cn(
                  'flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
                  'placeholder:text-gray-400',
                  'max-h-32'
                )}
                disabled={isTyping}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="shrink-0 bg-green-600 hover:bg-green-700"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating Action Button - Ethiopian Flag Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300',
          'flex items-center justify-center overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
          isOpen ? 'rotate-0' : 'hover:scale-110'
        )}
        style={{
          background: isOpen
            ? '#DC2626' // Red when open (close button)
            : 'linear-gradient(135deg, #16A34A 0%, #16A34A 33%, #EAB308 33%, #EAB308 66%, #DC2626 66%, #DC2626 100%)'
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat with Kidist'}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </button>
    </>
  );
}

// Chat Message Component
interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedProducts?: Product[];
}

function ChatMessage({ message }: { message: ChatMessageData }) {
  const { addToCart, isInCart } = useCart();
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className="flex items-end gap-2 max-w-[85%]">
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 flex items-center justify-center text-xs shrink-0">
            👩🏾
          </div>
        )}
        <div
          className={cn(
            'rounded-lg px-3 py-2',
            isUser
              ? 'bg-green-600 text-white rounded-br-sm'
              : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
          )}
        >
          {/* Message content */}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Suggested products */}
          {message.suggestedProducts && message.suggestedProducts.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">Suggested products:</p>
              <div className="space-y-2">
                {message.suggestedProducts.slice(0, 3).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => addToCart(product)}
                    isInCart={isInCart(product.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <p
            className={cn(
              'text-[10px] mt-1',
              isUser ? 'text-white/70' : 'text-gray-400'
            )}
          >
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
  isInCart,
}: {
  product: Product;
  onAddToCart: () => void;
  isInCart: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
      <img
        src={product.image}
        alt={product.name}
        className="w-10 h-10 rounded object-cover bg-gray-200"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/images/placeholder.png';
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-xs text-green-600 font-semibold">{formatPrice(product.price)}</p>
      </div>
      <button
        onClick={onAddToCart}
        disabled={isInCart}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          isInCart
            ? 'bg-green-100 text-green-600'
            : 'bg-green-600/10 text-green-600 hover:bg-green-600/20'
        )}
      >
        {isInCart ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <ShoppingCart className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
