'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/types/chat';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  className?: string;
}

const LANGUAGES: Language[] = ['en', 'am', 'ti', 'es'];

export function LanguageSelector({ value, onChange, className }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (language: Language) => {
    onChange(language);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
          'bg-white/10 hover:bg-white/20 transition-colors',
          'text-white'
        )}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-base">{LANGUAGE_FLAGS[value]}</span>
        <span className="hidden sm:inline">{LANGUAGE_NAMES[value]}</span>
        <ChevronDown className={cn(
          'h-3.5 w-3.5 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          'absolute top-full right-0 mt-1 py-1 min-w-[140px]',
          'bg-white rounded-md shadow-lg border border-gray-200',
          'z-50 animate-in fade-in-0 zoom-in-95'
        )}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelect(lang)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                'hover:bg-gray-100 transition-colors',
                value === lang && 'bg-primary/10 text-primary font-medium'
              )}
            >
              <span className="text-base">{LANGUAGE_FLAGS[lang]}</span>
              <span>{LANGUAGE_NAMES[lang]}</span>
              {value === lang && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
