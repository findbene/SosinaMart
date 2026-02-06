'use client';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
type LogCategory =
  | 'frontend'
  | 'cart'
  | 'ai'
  | 'auth'
  | 'general';

function sendLog(
  level: LogLevel,
  category: LogCategory,
  message: string,
  meta?: { error?: string; stack?: string; details?: Record<string, unknown>; source?: string }
) {
  // Fire-and-forget — don't await, don't block UI
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level,
      category,
      message,
      ...meta,
    }),
  }).catch(() => {
    // Silently fail — logging should never break the app
  });
}

export const clientLogger = {
  error(category: LogCategory, message: string, meta?: { error?: string; stack?: string; details?: Record<string, unknown> }) {
    console.error(`[${category}]`, message, meta?.error || '');
    sendLog('ERROR', category, message, { ...meta, source: 'client' });
  },

  warn(category: LogCategory, message: string, meta?: { details?: Record<string, unknown> }) {
    console.warn(`[${category}]`, message);
    sendLog('WARN', category, message, { ...meta, source: 'client' });
  },

  info(category: LogCategory, message: string, meta?: { details?: Record<string, unknown> }) {
    sendLog('INFO', category, message, { ...meta, source: 'client' });
  },

  /** Capture unhandled errors — call this from error boundaries or window.onerror */
  exception(error: unknown, context?: string) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.error('frontend', context ? `${context}: ${err.message}` : err.message, {
      error: err.message,
      stack: err.stack,
    });
  },
};
