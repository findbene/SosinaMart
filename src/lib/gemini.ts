'use client';

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "./constants";

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const tools: { functionDeclarations: any[] }[] = [
  {
    functionDeclarations: [
      {
        name: 'add_to_cart',
        description: 'Add one or more items to the shopping cart.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Product name' },
                  quantity: { type: Type.NUMBER, description: 'Amount' },
                  unit: { type: Type.STRING, enum: ['kg', 'lb', 'pcs'], description: 'Unit' },
                  price: { type: Type.NUMBER, description: 'Price per unit' }
                },
                required: ['name', 'quantity', 'unit', 'price']
              }
            }
          },
          required: ['items']
        }
      },
      {
        name: 'start_checkout',
        description: 'Initiate the checkout process.',
        parameters: { type: Type.OBJECT, properties: {} }
      }
    ]
  }
];

export class GeminiService {
  private getApiKey(): string | null {
    // Client-side: use NEXT_PUBLIC_ prefix
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
    console.log('[GeminiService] API Key available:', !!key);
    return key;
  }

  async chat(message: string, history: any[] = [], ragContext?: string, language?: string) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.error('[GeminiService] No API key configured');
      return {
        text: "I apologize, but I'm not fully configured yet. Please make sure NEXT_PUBLIC_GEMINI_API_KEY is set. Contact the store directly at 470-359-7924.",
        functionCalls: null
      };
    }

    try {
      console.log('[GeminiService] Initializing Gemini with key:', apiKey.substring(0, 10) + '...');
      const ai = new GoogleGenAI({ apiKey });

      // Build the prompt with language instruction
      const languageInstruction = language && language !== 'English'
        ? `IMPORTANT: The user is speaking ${language}. You MUST respond in ${language}.`
        : '';

      const fullPrompt = `${languageInstruction}\n${ragContext ? `Context:\n${ragContext}\n\n` : ''}User: ${message}`;

      console.log('[GeminiService] Sending request to Gemini...');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: [{ text: fullPrompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: tools as any
        },
      });

      console.log('[GeminiService] Response received:', {
        hasText: !!response.text,
        hasFunctionCalls: !!response.functionCalls
      });

      return {
        text: response.text || "I understand. How can I help you further?",
        functionCalls: response.functionCalls
      };
    } catch (error: any) {
      console.error('[GeminiService] Chat error:', error);
      console.error('[GeminiService] Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText
      });

      // Provide more specific error messages
      if (error?.message?.includes('API key')) {
        return {
          text: "There's an issue with the API key configuration. Please check that NEXT_PUBLIC_GEMINI_API_KEY is correctly set.",
          functionCalls: null
        };
      }

      if (error?.status === 429) {
        return {
          text: "I'm receiving too many requests right now. Please wait a moment and try again.",
          functionCalls: null
        };
      }

      return {
        text: "I apologize, but I encountered an issue. Please try again or contact the store directly at 470-359-7924.",
        functionCalls: null
      };
    }
  }

  connectVoice(language: string, callbacks: {
    onopen?: () => void;
    onmessage?: (msg: any) => void;
    onclose?: () => void;
    onerror?: (error: any) => void;
  }) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.error('[GeminiService] No API key available for voice');
      callbacks.onerror?.({ message: 'No API key configured. Please set NEXT_PUBLIC_GEMINI_API_KEY.' });
      return Promise.reject(new Error('No API key configured'));
    }

    console.log('[GeminiService] Connecting voice session, language:', language);
    const ai = new GoogleGenAI({ apiKey });

    // Build language-specific system instruction
    const langNames: Record<string, string> = {
      'am': 'Amharic (አማርኛ)',
      'ti': 'Tigrigna (ትግርኛ)',
      'es': 'Spanish (Español)',
    };

    let systemText = SYSTEM_PROMPT;
    if (language && language !== 'en' && langNames[language]) {
      const langName = langNames[language];
      systemText += `\n\nCRITICAL LANGUAGE REQUIREMENT: You MUST speak and respond EXCLUSIVELY in ${langName}. Do NOT use English at all. Every single word of your response must be in ${langName}. If the user speaks to you, respond ONLY in ${langName}. This is absolutely non-negotiable.`;
    }

    // Map language code to BCP-47 for speech synthesis
    // Only include languages the audio model natively supports for TTS.
    // Amharic and Tigrigna are NOT supported as BCP-47 languageCodes —
    // setting them causes the model to produce zero output. For those
    // languages, we rely on the system prompt instruction instead.
    const bcp47Map: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-US',
    };

    const liveCallbacks = {
      onopen: callbacks.onopen || (() => {}),
      onmessage: callbacks.onmessage || (() => {}),
      onclose: callbacks.onclose || (() => {}),
      onerror: callbacks.onerror || (() => {}),
    };

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-latest',
      callbacks: liveCallbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: systemText }] },
        tools: tools as any,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          ...(bcp47Map[language] ? { languageCode: bcp47Map[language] } : {}),
        },
      },
    });
  }
}

export const gemini = new GeminiService();
