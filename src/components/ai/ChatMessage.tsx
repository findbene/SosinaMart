'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Check } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestedProducts?: Product[];
    suggestedActions?: string[];
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { addToCart, isInCart } = useCart();
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2',
          isUser
            ? 'bg-primary text-white rounded-br-sm'
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

        {/* Suggested actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestedActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              >
                {action}
              </button>
            ))}
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
        <p className="text-xs text-primary font-semibold">{formatPrice(product.price)}</p>
      </div>
      <button
        onClick={onAddToCart}
        disabled={isInCart}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          isInCart
            ? 'bg-green-100 text-green-600'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
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

function handleAction(action: string): void {
  // Handle different actions
  switch (action) {
    case 'Contact Store':
      window.location.href = 'tel:+14703597924';
      break;
    case 'Browse Products':
      // Scroll to products section or open modal
      document.getElementById('food-section')?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'View Cart':
      // Would need cart context to open sidebar
      break;
    default:
      break;
  }
}
