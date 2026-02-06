import fs from 'fs';
import path from 'path';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type LogCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'api'
  | 'security'
  | 'cart'
  | 'crm'
  | 'ai'
  | 'auth'
  | 'middleware'
  | 'general';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  source?: string;
  error?: string;
  stack?: string;
  details?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
}

const LOG_DIR = path.join(process.cwd(), 'logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `app-${date}.jsonl`);
}

function writeLog(entry: LogEntry) {
  try {
    ensureLogDir();
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(getLogFilePath(), line, 'utf-8');
  } catch (err) {
    // Fallback to console if file write fails
    console.error('[Logger] Failed to write log file:', err);
    console.error('[Logger] Original entry:', JSON.stringify(entry));
  }
}

function createEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'category' | 'message'>>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...meta,
  };
}

export const logger = {
  error(category: LogCategory, message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'category' | 'message'>>) {
    const entry = createEntry('ERROR', category, message, meta);
    writeLog(entry);
    console.error(`[${category.toUpperCase()}] ${message}`, meta?.error || '');
  },

  warn(category: LogCategory, message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'category' | 'message'>>) {
    const entry = createEntry('WARN', category, message, meta);
    writeLog(entry);
    console.warn(`[${category.toUpperCase()}] ${message}`);
  },

  info(category: LogCategory, message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'category' | 'message'>>) {
    const entry = createEntry('INFO', category, message, meta);
    writeLog(entry);
  },

  debug(category: LogCategory, message: string, meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'category' | 'message'>>) {
    if (process.env.NODE_ENV === 'development') {
      const entry = createEntry('DEBUG', category, message, meta);
      writeLog(entry);
    }
  },

  /** Log an API request with its outcome */
  apiRequest(
    method: string,
    urlPath: string,
    statusCode: number,
    meta?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'category' | 'message'>>
  ) {
    const level: LogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const entry = createEntry(level, 'api', `${method} ${urlPath} → ${statusCode}`, {
      method,
      path: urlPath,
      statusCode,
      ...meta,
    });
    writeLog(entry);
  },

  /** Log a caught error with full stack trace */
  exception(category: LogCategory, error: unknown, context?: string) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.error(category, context ? `${context}: ${err.message}` : err.message, {
      error: err.message,
      stack: err.stack,
    });
  },
};
