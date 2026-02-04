'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastContextProvider } from '@/context/ToastContext';
import { ChatProvider } from '@/context/ChatContext';
import { ChatWidget } from '@/components/ai/ChatWidget';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>
          <ToastContextProvider>
            <ChatProvider>
              {children}
              <ChatWidget />
            </ChatProvider>
          </ToastContextProvider>
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
