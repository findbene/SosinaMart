'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastContextProvider } from '@/context/ToastContext';
import { ChatProvider } from '@/context/ChatContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ChatWidget } from '@/components/ai/ChatWidget';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <ToastContextProvider>
              <ChatProvider>
                {children}
                <ChatWidget />
              </ChatProvider>
            </ToastContextProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
