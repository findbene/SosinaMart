import { NextRequest, NextResponse } from 'next/server';
import { logger, LogLevel, LogCategory } from '@/lib/logger';

const VALID_LEVELS: LogLevel[] = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
const VALID_CATEGORIES: LogCategory[] = [
  'frontend', 'backend', 'database', 'api', 'security',
  'cart', 'crm', 'ai', 'auth', 'middleware', 'general',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, category, message, source, error, stack, details } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const logLevel: LogLevel = VALID_LEVELS.includes(level) ? level : 'ERROR';
    const logCategory: LogCategory = VALID_CATEGORIES.includes(category) ? category : 'frontend';

    logger[logLevel.toLowerCase() as 'error' | 'warn' | 'info' | 'debug'](
      logCategory,
      message,
      {
        source: source || 'client',
        error,
        stack,
        details,
        path: request.headers.get('referer') || undefined,
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.exception('api', err, 'POST /api/log');
    return NextResponse.json({ error: 'Failed to process log' }, { status: 500 });
  }
}
