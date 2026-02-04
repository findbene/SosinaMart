'use client';

import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
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

const tools: { functionDeclarations: FunctionDeclaration[] }[] = [
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
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
    }
    return process.env.GEMINI_API_KEY || null;
  }

  async chat(message: string, history: any[] = [], ragContext?: string, language?: string) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        text: "I apologize, but I'm not fully configured yet. Please contact the store directly at 470-359-7924.",
        functionCalls: null
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const fullPrompt = `${ragContext ? `Context:\n${ragContext}\n\n` : ''}User (speaking ${language || 'English'}): ${message}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [...history, { role: 'user', parts: [{ text: fullPrompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: tools as any
        },
      });

      return {
        text: response.text,
        functionCalls: response.functionCalls
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
      return {
        text: "I apologize, but I encountered an issue. Please try again or contact the store directly.",
        functionCalls: null
      };
    }
  }

  connectVoice(callbacks: {
    onopen?: () => void;
    onmessage?: (msg: any) => void;
    onclose?: () => void;
    onerror?: (error: any) => void;
  }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.error('No API key available for voice');
      callbacks.onerror?.({ message: 'No API key configured' });
      return Promise.reject(new Error('No API key configured'));
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build callbacks with required properties
    const liveCallbacks = {
      onopen: callbacks.onopen || (() => {}),
      onmessage: callbacks.onmessage || (() => {}),
      onclose: callbacks.onclose || (() => {}),
      onerror: callbacks.onerror || (() => {}),
    };

    return ai.live.connect({
      model: 'gemini-2.0-flash-live-001',
      callbacks: liveCallbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        tools: tools as any,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
  }
}

export const gemini = new GeminiService();
