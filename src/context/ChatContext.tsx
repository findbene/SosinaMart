'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Product } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedProducts?: Product[];
  suggestedActions?: string[];
}

interface ChatContextType {
  messages: ChatMessage[];
  sessionId: string | null;
  isOpen: boolean;
  isTyping: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (message: string) => Promise<void>;
  clearSession: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_SESSION_KEY = 'sosina-chat-session';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load session from storage on mount
  useEffect(() => {
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
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session ID if new
        if (data.data.sessionId && data.data.sessionId !== sessionId) {
          setSessionId(data.data.sessionId);
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.data.reply,
          timestamp: new Date(),
          suggestedProducts: data.data.suggestedProducts,
          suggestedActions: data.data.suggestedActions,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an issue. Please try again.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered a connection issue. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId]);

  const clearSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem(CHAT_SESSION_KEY);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessionId,
        isOpen,
        isTyping,
        setIsOpen,
        sendMessage,
        clearSession,
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
