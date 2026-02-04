import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { chatWithHistory, GeminiResponse } from '@/lib/gemini';
import { Language } from '@/types/chat';
import {
  createApiResponse,
  createApiError,
  handleApiError,
  parseRequestBody,
} from '@/lib/api-utils';
import { sendChatMessageSchema, validate, formatZodErrors } from '@/lib/validations';

// Generate UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Chat message interface
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// POST /api/ai/chat - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(sendChatMessageSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid chat message',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { message, sessionId, context } = validation.data;
    const language = ((body as Record<string, unknown>).language as Language) || 'en';

    // Get or create session
    let currentSessionId = sessionId;
    let previousMessages: ChatMessage[] = [];

    if (supabase) {
      if (sessionId) {
        // Fetch existing session messages
        const { data: session } = await supabase
          .from('chat_sessions')
          .select('id, status')
          .eq('id', sessionId)
          .single();

        if (session && session.status === 'active') {
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(20);

          previousMessages = (messages || []).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
        } else {
          currentSessionId = undefined;
        }
      }

      if (!currentSessionId) {
        currentSessionId = generateUUID();
        await supabase.from('chat_sessions').insert({
          id: currentSessionId,
          customer_id: context?.customerId || null,
          status: 'active',
          started_at: new Date().toISOString(),
        });
      }
    } else {
      currentSessionId = sessionId || generateUUID();
    }

    // Build messages array
    const messages: ChatMessage[] = [
      ...previousMessages,
      { role: 'user', content: message },
    ];

    // Get Gemini response
    const response: GeminiResponse = await chatWithHistory(messages, language);

    // Save messages to database
    if (supabase && currentSessionId) {
      // Save user message
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      });

      // Save assistant message
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: response.reply,
        metadata: {
          suggestedProducts: response.suggestedProducts,
          functionCalls: response.functionCalls,
        },
        created_at: new Date().toISOString(),
      });

      // Update session last activity
      await supabase
        .from('chat_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', currentSessionId);
    }

    return createApiResponse({
      reply: response.reply,
      sessionId: currentSessionId,
      suggestedProducts: response.suggestedProducts,
      functionCalls: response.functionCalls,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/ai/chat - Get chat session history
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return createApiError('VALIDATION_ERROR', 'Session ID is required', 400);
    }

    if (!supabase) {
      return createApiResponse({
        sessionId,
        messages: [],
        status: 'active',
      });
    }

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return createApiError('NOT_FOUND', 'Chat session not found', 404);
    }

    // Fetch messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content, metadata, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    return createApiResponse({
      sessionId: session.id,
      status: session.status,
      startedAt: session.started_at,
      messages: messages || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
