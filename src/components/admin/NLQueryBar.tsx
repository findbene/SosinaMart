'use client';

import React, { useState, useCallback } from 'react';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueryResult {
  answer: string;
  type: 'text' | 'metric' | 'list';
  data?: { label: string; value: string }[];
}

const SUGGESTION_CHIPS = [
  'What was this week\'s revenue?',
  'Show me at-risk customers',
  'Which product is trending?',
  'How many new customers this month?',
];

interface NLQueryBarProps {
  className?: string;
}

export function NLQueryBar({ className }: NLQueryBarProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'query', query: trimmed }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setResult(json.data as QueryResult);
      } else {
        setError(json.error?.message || 'AI service unavailable. Configure GEMINI_API_KEY to enable.');
      }
    } catch {
      setError('Failed to reach AI service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(query);
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    handleQuery(chip);
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
    setQuery('');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Sparkles className="absolute left-3 h-4 w-4 text-amber-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your store..."
            className="w-full pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm placeholder-gray-400"
            disabled={isLoading}
          />
          {isLoading ? (
            <Loader2 className="absolute right-3 h-4 w-4 text-gray-400 animate-spin" />
          ) : query ? (
            <button
              type="submit"
              className="absolute right-3 p-1 text-primary hover:text-primary/80"
            >
              <Search className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Suggestion Chips */}
      {!result && !error && !isLoading && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className="px-2.5 py-1 text-xs bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 relative">
          <button
            onClick={clearResult}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-800 leading-relaxed">{result.answer}</p>
          </div>

          {result.data && result.data.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {result.data.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800">{error}</p>
            <button
              onClick={clearResult}
              className="text-xs text-amber-600 hover:text-amber-800 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
