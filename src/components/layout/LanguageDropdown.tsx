'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SupportedLocale } from '@/lib/translations';

const LOCALE_OPTIONS: { value: SupportedLocale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { value: 'ti', label: 'ትግርኛ', flag: '🇪🇹' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function LanguageDropdown() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LOCALE_OPTIONS.find(o => o.value === locale)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-white hover:text-accent-gold transition-colors px-2 py-1 rounded-md hover:bg-white/10"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">{current.flag} {current.label}</span>
        <span className="text-sm font-medium sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-1 z-50">
          {LOCALE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setLocale(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 ${
                locale === opt.value ? 'bg-gray-50 font-semibold text-primary' : 'text-gray-700'
              }`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
