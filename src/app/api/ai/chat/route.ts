import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, KNOWLEDGE_BASE } from '@/lib/constants';
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

// Search knowledge base
function searchKnowledge(query: string): string {
  const keywords = query.toLowerCase().split(' ');
  const matches = KNOWLEDGE_BASE.filter(item =>
    keywords.some(kw =>
      item.content.toLowerCase().includes(kw) ||
      item.title.toLowerCase().includes(kw)
    )
  );
  if (matches.length === 0) return "";
  return matches.map(m => `${m.title}: ${m.content}`).join('\n\n');
}

// Server-side chat function
async function serverChat(message: string, history: any[] = [], language: string = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: "I apologize, but I'm not fully configured yet. Please contact the store directly at 470-359-7924.",
      functionCalls: null
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const ragContext = searchKnowledge(message);
  const fullPrompt = `${ragContext ? `Context:\n${ragContext}\n\n` : ''}User (speaking ${language}): ${message}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...history, { role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    return {
      text: response.text || "I understood your request.",
      functionCalls: response.functionCalls
    };
  } catch (error) {
    console.error('Gemini server chat error:', error);
    return {
      text: "I apologize, but I encountered an issue. Please try again.",
      functionCalls: null
    };
  }
}

// POST /api/ai/chat - Send a chat message (server-side fallback)
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
    const language = ((body as Record<string, unknown>).language as string) || 'en';

    // Get or create session
    let currentSessionId = sessionId || generateUUID();

    // Get Gemini response
    const response = await serverChat(message, [], language);

    // Save to database if available
    if (supabase && currentSessionId) {
      try {
        await supabase.from('chat_messages').insert({
          session_id: currentSessionId,
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        });

        await supabase.from('chat_messages').insert({
          session_id: currentSessionId,
          role: 'assistant',
          content: response.text,
          created_at: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return createApiResponse({
      reply: response.text,
      sessionId: currentSessionId,
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

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    return createApiResponse({
      sessionId,
      messages: messages || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
