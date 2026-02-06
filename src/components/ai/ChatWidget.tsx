'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message, Language, ChatState, CartItem } from '@/types/chat';
import { gemini, encode, decode, decodeAudioData } from '@/lib/gemini';
import { searchKnowledge } from '@/lib/rag';
import LanguageSelector from './LanguageSelector';
import { useCart } from '@/context/CartContext';
import { PRODUCTS } from '@/lib/data';
import { LANGUAGE_LABELS } from '@/lib/constants';

const KIDIST_AVATAR = "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?auto=format&fit=crop&q=80&w=400&h=400";

const ChatWidget: React.FC = () => {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! Welcome, my name is Kidist. How can I help you today? I can help you browse through our items, help you pick up items you liked and wanted, load them into your cart, and finally help you pay for them. I can also help you with the pickup information or delivery information!',
        timestamp: new Date()
      }
    ],
    isVoiceActive: false,
    currentLanguage: Language.ENGLISH,
    isProcessing: false,
    cart: [],
    view: 'chat'
  });

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const inputCtxRef = useRef<AudioContext | null>(null);

  // Check if API key is configured
  const apiKeyConfigured = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.messages, state.isProcessing, state.view]);

  // Log API key status on mount (for debugging)
  useEffect(() => {
    console.log('[ChatWidget] API Key configured:', apiKeyConfigured);
    console.log('[ChatWidget] Environment check:', {
      hasNextPublicKey: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 10) + '...'
    });
  }, [apiKeyConfigured]);

  const handleToolCalls = (calls: any[]) => {
    calls.forEach(call => {
      if (call.name === 'add_to_cart' && call.args?.items) {
        call.args.items.forEach((item: any) => {
          // Find matching product in our catalog
          const product = PRODUCTS.find(p =>
            p.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(p.name.toLowerCase())
          );
          if (product) {
            // Add to the actual cart
            for (let i = 0; i < (item.quantity || 1); i++) {
              addToCart(product);
            }
          }
        });
        // Also track in local state for display
        const newItems: CartItem[] = call.args.items.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9)
        }));
        setState(prev => ({ ...prev, cart: [...prev.cart, ...newItems], view: 'cart' }));
      } else if (call.name === 'start_checkout') {
        setState(prev => ({ ...prev, view: 'checkout' }));
        // Trigger checkout modal
        const checkoutEvent = new CustomEvent('openCheckout');
        window.dispatchEvent(checkoutEvent);
      }
    });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setState(prev => ({ ...prev, messages: [...prev.messages, userMsg], isProcessing: true }));
    setInput('');

    // Get the language name for the prompt
    const languageName = LANGUAGE_LABELS[state.currentLanguage] || 'English';

    try {
      console.log('[ChatWidget] Sending message:', text, 'Language:', languageName);
      const ragContext = await searchKnowledge(text);
      console.log('[ChatWidget] RAG context found:', ragContext ? 'Yes' : 'No');

      const history = state.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const { text: response, functionCalls } = await gemini.chat(text, history, ragContext, languageName);
      console.log('[ChatWidget] Response received:', response?.substring(0, 100) + '...');
      console.log('[ChatWidget] Function calls:', functionCalls);

      if (functionCalls) handleToolCalls(functionCalls);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "Understood!",
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, assistantMsg], isProcessing: false }));
    } catch (err) {
      console.error('[ChatWidget] Error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: apiKeyConfigured
          ? "I apologize, but I encountered an issue. Please try again."
          : "I'm not fully configured yet. Please make sure NEXT_PUBLIC_GEMINI_API_KEY is set in the environment variables.",
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg], isProcessing: false }));
    }
  };

  // Gapless audio playback — schedule each chunk to start exactly when the previous ends
  const scheduleAudio = async (base64Data: string) => {
    if (!outputCtxRef.current) {
      outputCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const outCtx = outputCtxRef.current;
    const buffer = await decodeAudioData(decode(base64Data), outCtx, 24000, 1);
    const src = outCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(outCtx.destination);

    // Schedule this chunk right after the previous one ends (or now if nothing is playing)
    const now = outCtx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    src.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  };

  const startVoiceSession = async () => {
    if (!apiKeyConfigured) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Voice chat is not available. Please configure NEXT_PUBLIC_GEMINI_API_KEY.",
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg] }));
      return;
    }

    try {
      console.log('[ChatWidget] Starting voice session...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Single shared output context for playback
      if (!outputCtxRef.current) {
        outputCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      // Reset playback schedule
      nextPlayTimeRef.current = 0;

      // Input context for mic capture at 16kHz
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputCtxRef.current = inputCtx;

      const sessionPromise = gemini.connectVoice({
        onopen: () => {
          console.log('[ChatWidget] Voice session opened');
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e: any) => {
            const float32 = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(float32.length);
            for (let i = 0; i < float32.length; i++) {
              int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
            }
            sessionPromise.then(s => {
              s.sendRealtimeInput({
                media: {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000'
                }
              });
            });
          };
          source.connect(processor);
          // Connect to a silent gain node instead of destination to prevent mic feedback
          const silentGain = inputCtx.createGain();
          silentGain.gain.value = 0;
          silentGain.connect(inputCtx.destination);
          processor.connect(silentGain);
          setState(prev => ({ ...prev, isVoiceActive: true }));
        },
        onmessage: async (msg: any) => {
          // Schedule audio for gapless playback using SDK's data getter
          const audioData = msg.data || msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            scheduleAudio(audioData);
          }
          // Handle text responses in voice mode
          const textContent = msg.text || msg.serverContent?.modelTurn?.parts?.find((p: any) => p.text && !p.thought)?.text;
          if (textContent) {
            const assistantMsg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: textContent,
              timestamp: new Date()
            };
            setState(prev => ({ ...prev, messages: [...prev.messages, assistantMsg] }));
          }
          // Handle function calls in voice mode
          const funcCalls = msg.toolCall?.functionCalls;
          if (funcCalls) handleToolCalls(funcCalls);
        },
        onclose: () => {
          console.log('[ChatWidget] Voice session closed');
          setState(prev => ({ ...prev, isVoiceActive: false }));
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        },
        onerror: (error: any) => {
          console.error('[ChatWidget] Voice error:', error);
          setState(prev => ({ ...prev, isVoiceActive: false }));
          const errorMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "Voice chat encountered an error. Please try again.",
            timestamp: new Date()
          };
          setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg] }));
        }
      });

      sessionRef.current = await sessionPromise;
      console.log('[ChatWidget] Voice session established');
    } catch (e) {
      console.error('[ChatWidget] Voice session error:', e);
      setState(prev => ({ ...prev, isVoiceActive: false }));
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Could not start voice chat. Please check microphone permissions.",
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg] }));
    }
  };

  const stopVoiceSession = () => {
    console.log('[ChatWidget] Stopping voice session...');
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current) {
      inputCtxRef.current.close();
      inputCtxRef.current = null;
    }
    // Reset playback schedule and close output context to stop all audio
    nextPlayTimeRef.current = 0;
    if (outputCtxRef.current) {
      outputCtxRef.current.close();
      outputCtxRef.current = null;
    }
    setState(prev => ({ ...prev, isVoiceActive: false }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-5">
      {!isOpen ? (
        <div className="flex flex-col items-end group">
          {/* Bouncing Cloud Bubble */}
          <div className="relative animate-bounce">
            <div
              className="bg-white px-10 py-5 rounded-[2.5rem] border-2 border-amber-500 text-amber-900 text-[14px] font-black hidden md:block uppercase tracking-tight shadow-2xl mb-4 relative z-10"
              style={{ boxShadow: '0 -4px 15px rgba(0, 154, 68, 0.2), 0 0 25px rgba(254, 209, 0, 0.2), 0 4px 35px rgba(239, 51, 64, 0.2)' }}
            >
              Ask Kidist: Your Support & Concierge
            </div>
            <div className="absolute bottom-[8px] right-10 w-8 h-8 bg-white border-r-2 border-b-2 border-amber-500 rotate-45 hidden md:block z-0"></div>
          </div>

          {/* Ethiopian Flag Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-32 h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 border-[8px] border-white relative overflow-hidden shadow-2xl"
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="flag-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="100" height="33.3" fill="#009A44" />
                  <rect x="0" y="33.3" width="100" height="33.4" fill="#FED100" />
                  <rect x="0" y="66.7" width="100" height="33.3" fill="#EF3340" />
                </pattern>
              </defs>
              <g className="animate-[flag-wave_2s_ease-in-out_infinite]">
                <rect width="100" height="100" fill="url(#flag-pattern)" />
              </g>
            </svg>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40 z-20"></div>
            <div className="relative z-30">
              <svg className="w-16 h-16 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <style>{`
              @keyframes flag-wave {
                0%, 100% { transform: scale(1.4) skewX(-20deg) translateY(-3px); }
                50% { transform: scale(1.4) skewX(20deg) translateY(3px); }
              }
            `}</style>
          </button>
        </div>
      ) : (
        /* Chat Panel */
        <div className="w-full sm:w-[540px] h-[860px] max-h-[96vh] bg-white rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border ring-[15px] ring-amber-500/10 animate-in slide-in-from-bottom-12">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 p-8 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-6">
              <img src={KIDIST_AVATAR} className="w-20 h-20 rounded-full border-4 border-white object-cover" alt="Kidist" />
              <div>
                <h3 className="font-black text-2xl uppercase italic">Kidist</h3>
                <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Support & Concierge</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-white text-amber-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Language Selector Bar */}
          <div className="px-8 py-4 border-b flex justify-between items-center bg-amber-50/30">
            <span className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest">Language</span>
            <LanguageSelector
              currentLanguage={state.currentLanguage}
              onLanguageChange={(l) => setState(p => ({ ...p, currentLanguage: l }))}
            />
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
            {state.messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm text-sm ${m.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-amber-100'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {state.isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-[2rem] border border-amber-100 shadow-sm">
                  <div className="animate-pulse flex gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animation-delay-150"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animation-delay-300"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-10 bg-white border-t space-y-5">
            <div className="flex gap-4">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                className="flex-1 bg-gray-50 border-2 rounded-[1.5rem] px-6 py-4 focus:border-amber-600 outline-none text-gray-800"
                placeholder="Talk to Kidist..."
              />
              <button
                onClick={() => handleSend(input)}
                disabled={state.isProcessing || !input.trim()}
                className="bg-amber-700 text-white rounded-[1.5rem] px-6 shadow-lg hover:bg-amber-800 transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Voice Chat Button - GREEN when ready, RED when active */}
            <button
              onClick={state.isVoiceActive ? stopVoiceSession : startVoiceSession}
              className={`w-full py-5 rounded-[1.5rem] font-black tracking-widest uppercase border-4 transition-all flex items-center justify-center gap-3 ${
                state.isVoiceActive
                  ? 'bg-red-600 text-white border-red-700 animate-pulse'
                  : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
              }`}
            >
              {state.isVoiceActive ? (
                <>
                  <span className="w-4 h-4 bg-white rounded-full animate-ping"></span>
                  <span>🎤 Voice Active - Tap to Hang Up</span>
                </>
              ) : (
                <>
                  <span>🎤 Start Voice Chat</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;

export { ChatWidget };
